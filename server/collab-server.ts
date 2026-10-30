import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import { INITIAL_DOCUMENTS } from '../src/lib/mock-data';
import { ResearchDocument, DocumentRole, Collaborator, VersionSnapshot, DriveExportRecord, AuditLogEntry } from '../src/lib/types';

interface ConnectedClient {
  ws: WebSocket;
  docId: string;
  userId: string;
  userName: string;
  userRole: DocumentRole;
  userAvatar: string;
  userColor: string;
  lastPing: number;
}

interface DocRoom {
  yDoc: Y.Doc;
  doc: ResearchDocument;
  clients: Set<ConnectedClient>;
  dirty: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'documents.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

// Global state in memory
const rooms = new Map<string, DocRoom>();
let documentStore: Record<string, ResearchDocument> = {};

// Load documents from disk or mock data
function loadDocuments() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      documentStore = JSON.parse(content);
      return;
    } catch (err) {
      console.error('Error reading documents from disk, falling back to mock data:', err);
    }
  }

  // Initialize with mock data
  documentStore = {};
  for (const doc of INITIAL_DOCUMENTS) {
    documentStore[doc.id] = JSON.parse(JSON.stringify(doc));
  }
  saveDocumentsToDisk();
}

function saveDocumentsToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(documentStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving documents to disk:', err);
  }
}

loadDocuments();

// Get or initialize a Room for a document
export function getOrCreateRoom(docId: string): DocRoom {
  let room = rooms.get(docId);
  if (!room) {
    let doc = documentStore[docId];
    if (!doc) {
      // Find from initial documents or create blank
      const found = INITIAL_DOCUMENTS.find(d => d.id === docId);
      if (found) {
        doc = JSON.parse(JSON.stringify(found));
      } else {
        doc = {
          id: docId,
          projectId: 'proj-distributed-ai',
          docType: 'journal',
          title: 'Untitled Research Manuscript',
          abstract: '',
          keywords: [],
          citationStyle: 'ieee',
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authors: [],
          collaborators: [],
          sections: [
            {
              id: 'sec-intro',
              title: '1. Introduction',
              type: 'standard',
              order: 1,
              content: 'Write introduction here...',
            }
          ],
          references: [],
          comments: [],
          suggestions: [],
          versions: [],
          driveExports: [],
          auditLog: []
        };
      }
      documentStore[docId] = doc;
      saveDocumentsToDisk();
    }

    const yDoc = new Y.Doc();
    // Populate Y.Doc with initial section contents
    const ySections = yDoc.getMap<Y.Text>('sections');
    for (const sec of doc.sections) {
      const yText = new Y.Text();
      yText.insert(0, sec.content);
      ySections.set(sec.id, yText);
    }

    room = {
      yDoc,
      doc,
      clients: new Set(),
      dirty: false,
    };

    // Auto-sync Y.Doc updates to memory
    yDoc.on('update', (update: Uint8Array, origin: any) => {
      room!.dirty = true;
      // Broadcast binary Yjs update to all clients in room
      const updateBase64 = Buffer.from(update).toString('base64');
      const payload = JSON.stringify({
        type: 'yjs-update',
        update: updateBase64,
        originId: typeof origin === 'string' ? origin : undefined,
      });

      for (const client of room!.clients) {
        if (client.ws.readyState === WebSocket.OPEN && client.userId !== origin) {
          try {
            client.ws.send(payload);
          } catch (e) {
            console.error('Failed to send Yjs update to client:', e);
          }
        }
      }
    });

    rooms.set(docId, room);
  }
  return room;
}

let flushInterval: any = null;

function ensureFlushInterval() {
  if (!flushInterval) {
    flushInterval = setInterval(() => {
      for (const [docId, room] of rooms.entries()) {
        if (room.dirty) {
          // Sync Y.Text back into doc.sections
          const ySections = room.yDoc.getMap<Y.Text>('sections');
          for (const sec of room.doc.sections) {
            const yText = ySections.get(sec.id);
            if (yText) {
              sec.content = yText.toString();
            }
          }
          room.doc.updatedAt = new Date().toISOString();
          documentStore[docId] = room.doc;
          room.dirty = false;
          saveDocumentsToDisk();
        }
      }
    }, 3000);
    if (flushInterval?.unref) {
      flushInterval.unref();
    }
  }
}

export function attachCollabServer(httpServer: http.Server | any, middlewares?: any) {
  ensureFlushInterval();
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: http.IncomingMessage, socket: any, head: Buffer) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/collab-ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const docId = url.searchParams.get('docId') || 'doc-fed-marl-2026';
    const userId = url.searchParams.get('userId') || `guest-${Date.now()}`;
    const userName = url.searchParams.get('userName') || 'Visiting Researcher';
    let userRole = (url.searchParams.get('userRole') as DocumentRole) || 'editor';
    const userEmail = url.searchParams.get('userEmail') || '';
    const userAvatar = url.searchParams.get('userAvatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    const userColor = url.searchParams.get('userColor') || '#6366f1';
    const isAdmin = userId === 'user-sunil' || userEmail.toLowerCase() === 'sunil@researchlab.np' || userRole === 'owner';

    const room = getOrCreateRoom(docId);

    // Verify authorized role from document collaborators if exists
    const existingCollab = room.doc.collaborators.find(
      c => c.id === userId || (userEmail && c.email.toLowerCase() === userEmail.toLowerCase())
    );

    if (existingCollab) {
      userRole = existingCollab.role;
      existingCollab.isOnline = true;
    } else if (isAdmin) {
      userRole = 'owner';
      const adminCollab = room.doc.collaborators.find(c => c.id === userId);
      if (!adminCollab) {
        room.doc.collaborators.unshift({
          id: userId,
          name: userName,
          email: userEmail || 'sunil@researchlab.np',
          avatar: userAvatar,
          role: 'owner',
          color: userColor,
          isOnline: true,
        });
      }
    } else {
      // Automatic collaboration: joining member is added to the paper's active collaborators
      const memberCollab = room.doc.collaborators.find(c => c.id === userId);
      if (!memberCollab) {
        room.doc.collaborators.push({
          id: userId,
          name: userName,
          email: userEmail || 'member@researchlab.np',
          avatar: userAvatar,
          role: userRole || 'editor',
          color: userColor,
          isOnline: true,
        });
      }
    }

    const client: ConnectedClient = {
      ws,
      docId,
      userId,
      userName,
      userRole,
      userAvatar,
      userColor,
      lastPing: Date.now(),
    };

    room.clients.add(client);

    // Send initial sync payload
    const yDocState = Y.encodeStateAsUpdate(room.yDoc);
    const initialPayload = {
      type: 'init-sync',
      doc: room.doc,
      userRole,
      yjsState: Buffer.from(yDocState).toString('base64'),
      activeUsers: Array.from(room.clients).map(c => ({
        userId: c.userId,
        name: c.userName,
        role: c.userRole,
        avatar: c.userAvatar,
        color: c.userColor,
      })),
    };
    ws.send(JSON.stringify(initialPayload));

    // Broadcast presence join to peers
    broadcastToRoom(room, {
      type: 'user-joined',
      user: {
        userId: client.userId,
        name: client.userName,
        role: client.userRole,
        avatar: client.userAvatar,
        color: client.userColor,
      },
    }, client.userId);

    // Handle incoming client messages
    ws.on('message', (data: any) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'yjs-update': {
            // BACKEND PERMISSION CHECK
            if (client.userRole === 'viewer') {
              ws.send(JSON.stringify({
                type: 'permission-denied',
                reason: 'Read-only access: Viewers cannot modify document content.',
              }));
              return;
            }
            if (client.userRole === 'reviewer') {
              ws.send(JSON.stringify({
                type: 'permission-denied',
                reason: 'Reviewers can only submit suggestions or comments, not edit directly.',
              }));
              return;
            }

            // Apply to authoritative server Y.Doc
            const updateBuf = Buffer.from(msg.update, 'base64');
            Y.applyUpdate(room.yDoc, new Uint8Array(updateBuf), client.userId);
            break;
          }

          case 'cursor-move': {
            // Broadcast cursor awareness
            broadcastToRoom(room, {
              type: 'cursor-update',
              cursor: {
                userId: client.userId,
                name: client.userName,
                color: client.userColor,
                role: client.userRole,
                avatar: client.userAvatar,
                sectionId: msg.sectionId,
                cursorIndex: msg.cursorIndex,
                selection: msg.selection,
                updatedAt: Date.now(),
              }
            }, client.userId);
            break;
          }

          case 'update-metadata': {
            if (client.userRole !== 'owner' && client.userRole !== 'editor') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Insufficient privileges to edit document metadata.' }));
              return;
            }
            if (msg.title !== undefined) room.doc.title = msg.title;
            if (msg.abstract !== undefined) room.doc.abstract = msg.abstract;
            if (msg.keywords !== undefined) room.doc.keywords = msg.keywords;
            if (msg.citationStyle !== undefined) room.doc.citationStyle = msg.citationStyle;
            if (msg.authors !== undefined) room.doc.authors = msg.authors;
            room.dirty = true;
            broadcastToRoom(room, {
              type: 'metadata-updated',
              title: room.doc.title,
              abstract: room.doc.abstract,
              keywords: room.doc.keywords,
              citationStyle: room.doc.citationStyle,
              authors: room.doc.authors,
            });
            break;
          }

          case 'section-reorder': {
            if (client.userRole !== 'owner' && client.userRole !== 'editor') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Only owners and editors can reorder sections.' }));
              return;
            }
            room.doc.sections = msg.sections;
            room.dirty = true;
            broadcastToRoom(room, { type: 'sections-updated', sections: room.doc.sections });
            break;
          }

          case 'section-add': {
            if (client.userRole !== 'owner' && client.userRole !== 'editor') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Only owners and editors can add sections.' }));
              return;
            }
            room.doc.sections.push(msg.section);
            // Also initialize in Y.Doc
            const ySections = room.yDoc.getMap<Y.Text>('sections');
            const yText = new Y.Text();
            yText.insert(0, msg.section.content || '');
            ySections.set(msg.section.id, yText);
            room.dirty = true;
            broadcastToRoom(room, { type: 'sections-updated', sections: room.doc.sections });
            break;
          }

          case 'section-delete': {
            if (client.userRole !== 'owner') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Only the document owner can delete sections.' }));
              return;
            }
            room.doc.sections = room.doc.sections.filter(s => s.id !== msg.sectionId);
            room.dirty = true;
            broadcastToRoom(room, { type: 'sections-updated', sections: room.doc.sections });
            break;
          }

          case 'add-comment': {
            const comment = {
              ...msg.comment,
              timestamp: new Date().toISOString(),
              replies: [],
            };
            room.doc.comments.push(comment);
            room.dirty = true;
            broadcastToRoom(room, { type: 'comment-added', comment });
            break;
          }

          case 'reply-comment': {
            const comment = room.doc.comments.find(c => c.id === msg.commentId);
            if (comment) {
              const reply = {
                id: `rep-${Date.now()}`,
                author: {
                  id: client.userId,
                  name: client.userName,
                  avatar: client.userAvatar,
                  role: client.userRole,
                },
                content: msg.content,
                timestamp: new Date().toISOString(),
              };
              comment.replies.push(reply);
              room.dirty = true;
              broadcastToRoom(room, { type: 'comment-replied', commentId: msg.commentId, reply });
            }
            break;
          }

          case 'resolve-comment': {
            const comment = room.doc.comments.find(c => c.id === msg.commentId);
            if (comment) {
              comment.resolved = msg.resolved !== undefined ? msg.resolved : true;
              room.dirty = true;
              broadcastToRoom(room, { type: 'comment-resolved', commentId: msg.commentId, resolved: comment.resolved });
            }
            break;
          }

          case 'add-suggestion': {
            const suggestion = {
              ...msg.suggestion,
              id: `sug-${Date.now()}`,
              timestamp: new Date().toISOString(),
              status: 'pending',
              author: {
                id: client.userId,
                name: client.userName,
                avatar: client.userAvatar,
                role: client.userRole,
              }
            };
            room.doc.suggestions.push(suggestion);
            room.dirty = true;
            broadcastToRoom(room, { type: 'suggestion-added', suggestion });
            break;
          }

          case 'resolve-suggestion': {
            // Must be editor or owner to accept/reject
            if (client.userRole !== 'owner' && client.userRole !== 'editor') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Only owners and editors can accept or reject suggestions.' }));
              return;
            }
            const suggestion = room.doc.suggestions.find(s => s.id === msg.suggestionId);
            if (suggestion) {
              suggestion.status = msg.status; // 'accepted' | 'rejected'
              if (msg.status === 'accepted') {
                // Apply suggestion text to target section
                const section = room.doc.sections.find(s => s.id === suggestion.sectionId);
                if (section && suggestion.originalText) {
                  section.content = section.content.replace(suggestion.originalText, suggestion.suggestedText);
                  // Update Y.Doc text
                  const ySections = room.yDoc.getMap<Y.Text>('sections');
                  const yText = ySections.get(section.id);
                  if (yText) {
                    yText.delete(0, yText.length);
                    yText.insert(0, section.content);
                  }
                }
              }
              room.dirty = true;
              broadcastToRoom(room, {
                type: 'suggestion-resolved',
                suggestionId: msg.suggestionId,
                status: msg.status,
                sections: room.doc.sections,
              });
            }
            break;
          }

          case 'update-collaborator-role': {
            if (client.userRole !== 'owner') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Only the document owner can change collaborator permissions.' }));
              return;
            }
            const target = room.doc.collaborators.find(c => c.id === msg.targetUserId);
            if (target) {
              target.role = msg.newRole;
              // Update live client role if connected
              for (const cl of room.clients) {
                if (cl.userId === msg.targetUserId) {
                  cl.userRole = msg.newRole;
                  cl.ws.send(JSON.stringify({
                    type: 'role-changed',
                    newRole: msg.newRole,
                  }));
                }
              }
              room.dirty = true;
              broadcastToRoom(room, {
                type: 'collaborators-updated',
                collaborators: room.doc.collaborators,
              });
            }
            break;
          }

          case 'revoke-collaborator': {
            if (client.userRole !== 'owner') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Only the document owner can revoke collaborator access.' }));
              return;
            }
            room.doc.collaborators = room.doc.collaborators.filter(c => c.id !== msg.targetUserId);
            // Terminate connection for revoked user immediately
            for (const cl of room.clients) {
              if (cl.userId === msg.targetUserId) {
                cl.ws.send(JSON.stringify({
                  type: 'access-revoked',
                  reason: 'Your access to this document has been revoked by the owner.',
                }));
                cl.ws.close(4003, 'Access revoked');
              }
            }
            room.dirty = true;
            broadcastToRoom(room, {
              type: 'collaborators-updated',
              collaborators: room.doc.collaborators,
            });
            break;
          }

          case 'transfer-ownership': {
            if (client.userRole !== 'owner') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Only current owner can transfer ownership.' }));
              return;
            }
            const oldOwner = room.doc.collaborators.find(c => c.id === client.userId);
            const newOwner = room.doc.collaborators.find(c => c.id === msg.newOwnerId);
            if (oldOwner && newOwner) {
              oldOwner.role = 'editor';
              newOwner.role = 'owner';
              client.userRole = 'editor';
              client.ws.send(JSON.stringify({ type: 'role-changed', newRole: 'editor' }));
              for (const cl of room.clients) {
                if (cl.userId === newOwner.id) {
                  cl.userRole = 'owner';
                  cl.ws.send(JSON.stringify({ type: 'role-changed', newRole: 'owner' }));
                }
              }
              room.dirty = true;
              broadcastToRoom(room, {
                type: 'collaborators-updated',
                collaborators: room.doc.collaborators,
              });
            }
            break;
          }

          case 'create-version-snapshot': {
            const versionId = `ver-${Date.now()}`;
            const verNum = `${(room.doc.versions.length + 1).toFixed(1)}`;
            const snapshot: VersionSnapshot = {
              id: versionId,
              versionNumber: msg.versionNumber || verNum,
              label: msg.label || `Revision ${verNum}`,
              summary: msg.summary || 'Collaborative snapshot',
              authorName: client.userName,
              authorAvatar: client.userAvatar,
              timestamp: new Date().toISOString(),
              data: {
                title: room.doc.title,
                abstract: room.doc.abstract,
                keywords: [...room.doc.keywords],
                authors: JSON.parse(JSON.stringify(room.doc.authors)),
                sections: JSON.parse(JSON.stringify(room.doc.sections)),
                references: JSON.parse(JSON.stringify(room.doc.references)),
                stats: {
                  words: room.doc.sections.reduce((acc, s) => acc + (s.content ? s.content.split(/\s+/).length : 0), 0),
                  characters: room.doc.sections.reduce((acc, s) => acc + (s.content ? s.content.length : 0), 0),
                }
              }
            };
            room.doc.versions.unshift(snapshot);
            room.dirty = true;
            broadcastToRoom(room, { type: 'version-created', version: snapshot });
            break;
          }

          case 'restore-version': {
            if (client.userRole !== 'owner' && client.userRole !== 'editor') {
              ws.send(JSON.stringify({ type: 'permission-denied', reason: 'Insufficient privileges to restore versions.' }));
              return;
            }
            const targetVer = room.doc.versions.find(v => v.id === msg.versionId);
            if (targetVer) {
              // Safety snapshot before restore
              const safetySnapshot: VersionSnapshot = {
                id: `ver-auto-${Date.now()}`,
                versionNumber: `${(room.doc.versions.length + 1).toFixed(1)}`,
                label: `Auto-snapshot prior to restore of v${targetVer.versionNumber}`,
                summary: 'System backup prior to version rollback.',
                authorName: client.userName,
                authorAvatar: client.userAvatar,
                timestamp: new Date().toISOString(),
                data: {
                  title: room.doc.title,
                  abstract: room.doc.abstract,
                  keywords: [...room.doc.keywords],
                  authors: JSON.parse(JSON.stringify(room.doc.authors)),
                  sections: JSON.parse(JSON.stringify(room.doc.sections)),
                  references: JSON.parse(JSON.stringify(room.doc.references)),
                  stats: {
                    words: room.doc.sections.reduce((acc, s) => acc + (s.content ? s.content.split(/\s+/).length : 0), 0),
                    characters: room.doc.sections.reduce((acc, s) => acc + (s.content ? s.content.length : 0), 0),
                  }
                }
              };
              room.doc.versions.unshift(safetySnapshot);

              // Restore content
              room.doc.title = targetVer.data.title;
              room.doc.abstract = targetVer.data.abstract;
              room.doc.keywords = [...targetVer.data.keywords];
              room.doc.sections = JSON.parse(JSON.stringify(targetVer.data.sections));
              room.doc.references = JSON.parse(JSON.stringify(targetVer.data.references));

              // Sync to Y.Doc
              const ySections = room.yDoc.getMap<Y.Text>('sections');
              for (const sec of room.doc.sections) {
                let yText = ySections.get(sec.id);
                if (!yText) {
                  yText = new Y.Text();
                  ySections.set(sec.id, yText);
                }
                yText.delete(0, yText.length);
                yText.insert(0, sec.content || '');
              }

              room.dirty = true;
              broadcastToRoom(room, {
                type: 'version-restored',
                doc: room.doc,
                restoredVersion: targetVer.versionNumber,
              });
            }
            break;
          }

          case 'add-reference': {
            room.doc.references.push(msg.reference);
            room.dirty = true;
            broadcastToRoom(room, { type: 'references-updated', references: room.doc.references });
            break;
          }

          case 'update-reference': {
            const idx = room.doc.references.findIndex(r => r.id === msg.reference.id);
            if (idx !== -1) {
              room.doc.references[idx] = msg.reference;
              room.dirty = true;
              broadcastToRoom(room, { type: 'references-updated', references: room.doc.references });
            }
            break;
          }

          case 'delete-reference': {
            room.doc.references = room.doc.references.filter(r => r.id !== msg.referenceId);
            room.dirty = true;
            broadcastToRoom(room, { type: 'references-updated', references: room.doc.references });
            break;
          }

          case 'drive-export-recorded': {
            room.doc.driveExports.unshift(msg.exportRecord);
            room.doc.auditLog.unshift({
              id: `log-${Date.now()}`,
              action: 'Exported to Google Drive',
              actorName: client.userName,
              actorRole: client.userRole,
              timestamp: new Date().toISOString(),
              details: `Exported ${msg.exportRecord.fileName} (${msg.exportRecord.fileType.toUpperCase()}) to Google Drive.`
            });
            room.dirty = true;
            broadcastToRoom(room, {
              type: 'drive-exports-updated',
              driveExports: room.doc.driveExports,
              auditLog: room.doc.auditLog,
            });
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      room.clients.delete(client);
      const remainingForUser = Array.from(room.clients).filter(c => c.userId === client.userId);
      if (remainingForUser.length === 0) {
        const collab = room.doc.collaborators.find(c => c.id === client.userId);
        if (collab) collab.isOnline = false;
        broadcastToRoom(room, {
          type: 'user-left',
          userId: client.userId,
        });
      }
    });
  });

  // Attach REST endpoints to Express / Vite middlewares
  if (middlewares) {
    mountRestEndpoints(middlewares);
  }
}

function broadcastToRoom(room: DocRoom, msg: any, excludeUserId?: string) {
  const str = JSON.stringify(msg);
  for (const client of room.clients) {
    if (client.ws.readyState === WebSocket.OPEN && client.userId !== excludeUserId) {
      try {
        client.ws.send(str);
      } catch (e) {
        console.error('Error broadcasting to client:', e);
      }
    }
  }
}

export function mountRestEndpoints(app: any) {
  // Simple body parser middleware if needed
  app.use('/api', (req: any, res: any, next: any) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        if (body) {
          try {
            req.body = JSON.parse(body);
          } catch (e) {
            req.body = {};
          }
        }
        next();
      });
    } else {
      next();
    }
  });

  // GET /api/documents
  app.use('/api/documents', (req: any, res: any, next: any) => {
    if (req.method === 'GET' && (req.url === '' || req.url === '/')) {
      const docs = Object.values(documentStore).map(d => ({
        id: d.id,
        projectId: d.projectId,
        docType: d.docType,
        title: d.title,
        abstract: d.abstract,
        citationStyle: d.citationStyle,
        isArchived: d.isArchived,
        authorCount: d.authors.length,
        collaborators: d.collaborators,
        updatedAt: d.updatedAt,
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(docs));
      return;
    }

    if (req.method === 'POST' && (req.url === '' || req.url === '/')) {
      const newDoc: ResearchDocument = {
        id: `doc-${Date.now()}`,
        projectId: req.body?.projectId || 'proj-distributed-ai',
        docType: req.body?.docType || 'journal',
        title: req.body?.title || 'New Collaborative Manuscript',
        abstract: '',
        keywords: [],
        citationStyle: req.body?.citationStyle || 'ieee',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authors: req.body?.authors || [
          {
            id: 'auth-me',
            name: req.body?.creatorName || 'Lead Researcher',
            email: 'researcher@lab.org',
            affiliation: 'Department of Research Science',
            isCorresponding: true,
          }
        ],
        collaborators: req.body?.collaborators || [],
        sections: [
          { id: `sec-intro-${Date.now()}`, title: '1. Introduction', type: 'standard', order: 1, content: 'Introduction content...' },
          { id: `sec-methods-${Date.now()}`, title: '2. Methodology', type: 'standard', order: 2, content: 'Methodology content...' },
          { id: `sec-results-${Date.now()}`, title: '3. Results', type: 'standard', order: 3, content: 'Results and findings...' },
          { id: `sec-concl-${Date.now()}`, title: '4. Conclusion', type: 'standard', order: 4, content: 'Conclusions and future work...' },
          { id: `sec-ref-${Date.now()}`, title: 'References', type: 'references', order: 5, content: '' },
        ],
        references: [],
        comments: [],
        suggestions: [],
        versions: [],
        driveExports: [],
        auditLog: [
          {
            id: `log-${Date.now()}`,
            action: 'Document Created',
            actorName: req.body?.creatorName || 'Lead Researcher',
            actorRole: 'owner',
            timestamp: new Date().toISOString(),
            details: 'Initialized new academic manuscript workspace.'
          }
        ]
      };
      documentStore[newDoc.id] = newDoc;
      saveDocumentsToDisk();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newDoc));
      return;
    }

    next();
  });
}
