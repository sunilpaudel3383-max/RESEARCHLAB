import * as Y from 'yjs';
import { ResearchDocument, DocumentRole, CollaboratorCursor, Collaborator } from './types';

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

export interface CollabClientEvents {
  onSync: (doc: ResearchDocument, role: DocumentRole) => void;
  onRemoteUpdate: (update: Uint8Array) => void;
  onConnectionChange: (state: ConnectionState) => void;
  onCursorUpdate: (cursor: CollaboratorCursor) => void;
  onUserLeft: (userId: string) => void;
  onUserJoined: (user: Partial<Collaborator>) => void;
  onMetadataUpdate: (meta: any) => void;
  onSectionsUpdate: (sections: any[]) => void;
  onCommentUpdate: (payload: any) => void;
  onSuggestionUpdate: (payload: any) => void;
  onCollaboratorsUpdate: (collaborators: Collaborator[]) => void;
  onRoleChange: (newRole: DocumentRole) => void;
  onAccessRevoked: (reason: string) => void;
  onVersionCreated: (version: any) => void;
  onVersionRestored: (doc: ResearchDocument) => void;
  onReferencesUpdate: (refs: any[]) => void;
  onDriveExportsUpdate: (payload: any) => void;
  onPermissionDenied: (reason: string) => void;
}

export class CollabClient {
  public yDoc: Y.Doc;
  private ws: WebSocket | null = null;
  private docId: string;
  private userId: string;
  private userName: string;
  private userEmail: string;
  private userRole: DocumentRole;
  private userAvatar: string;
  private userColor: string;
  private events: CollabClientEvents;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private pendingQueue: any[] = [];
  private isDestroyed = false;

  constructor(
    docId: string,
    user: { id: string; name: string; email?: string; role: DocumentRole; avatar: string; color: string },
    events: CollabClientEvents
  ) {
    this.docId = docId;
    this.userId = user.id;
    this.userName = user.name;
    this.userEmail = user.email || '';
    this.userRole = user.role;
    this.userAvatar = user.avatar;
    this.userColor = user.color;
    this.events = events;

    this.yDoc = new Y.Doc();

    // Listen to local Yjs changes and push to server
    this.yDoc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && origin !== 'server-init') {
        const base64 = this.toBase64(update);
        this.send({
          type: 'yjs-update',
          update: base64,
        });
      }
    });

    this.connect();
  }

  private toBase64(uint8: Uint8Array): string {
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  private fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  public connect() {
    if (this.isDestroyed) return;

    this.events.onConnectionChange(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const params = new URLSearchParams({
      docId: this.docId,
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
      userRole: this.userRole,
      userAvatar: this.userAvatar,
      userColor: this.userColor,
    });

    const wsUrl = `${protocol}//${host}/collab-ws?${params.toString()}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.events.onConnectionChange('connected');

        // Flush pending queued messages
        while (this.pendingQueue.length > 0) {
          const item = this.pendingQueue.shift();
          this.sendRaw(item);
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        if (event.code === 4003 || event.code === 4403) {
          this.events.onAccessRevoked('Access Restricted: You have not been added as a collaborator to this manuscript by the lab administrator.');
          return;
        }
        if (!this.isDestroyed) {
          this.events.onConnectionChange('disconnected');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('CollabClient WebSocket error:', err);
      };
    } catch (e) {
      console.error('Error instantiating WebSocket:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isDestroyed) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  private handleMessage(dataStr: string) {
    try {
      const msg = JSON.parse(dataStr);
      switch (msg.type) {
        case 'init-sync': {
          if (msg.yjsState) {
            const bytes = this.fromBase64(msg.yjsState);
            Y.applyUpdate(this.yDoc, bytes, 'server-init');
          }
          if (msg.userRole) {
            this.userRole = msg.userRole;
          }
          this.events.onSync(msg.doc, msg.userRole);
          break;
        }

        case 'yjs-update': {
          const bytes = this.fromBase64(msg.update);
          Y.applyUpdate(this.yDoc, bytes, 'remote');
          this.events.onRemoteUpdate(bytes);
          break;
        }

        case 'cursor-update': {
          this.events.onCursorUpdate(msg.cursor);
          break;
        }

        case 'user-joined': {
          this.events.onUserJoined(msg.user);
          break;
        }

        case 'user-left': {
          this.events.onUserLeft(msg.userId);
          break;
        }

        case 'metadata-updated': {
          this.events.onMetadataUpdate(msg);
          break;
        }

        case 'sections-updated': {
          this.events.onSectionsUpdate(msg.sections);
          break;
        }

        case 'comment-added':
        case 'comment-replied':
        case 'comment-resolved': {
          this.events.onCommentUpdate(msg);
          break;
        }

        case 'suggestion-added':
        case 'suggestion-resolved': {
          this.events.onSuggestionUpdate(msg);
          break;
        }

        case 'collaborators-updated': {
          this.events.onCollaboratorsUpdate(msg.collaborators);
          break;
        }

        case 'role-changed': {
          this.userRole = msg.newRole;
          this.events.onRoleChange(msg.newRole);
          break;
        }

        case 'access-revoked': {
          this.events.onAccessRevoked(msg.reason);
          break;
        }

        case 'version-created': {
          this.events.onVersionCreated(msg.version);
          break;
        }

        case 'version-restored': {
          this.events.onVersionRestored(msg.doc);
          break;
        }

        case 'references-updated': {
          this.events.onReferencesUpdate(msg.references);
          break;
        }

        case 'drive-exports-updated': {
          this.events.onDriveExportsUpdate(msg);
          break;
        }

        case 'permission-denied': {
          this.events.onPermissionDenied(msg.reason);
          break;
        }
      }
    } catch (err) {
      console.error('Error parsing incoming message:', err);
    }
  }

  private sendRaw(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      // Buffer offline changes
      this.pendingQueue.push(payload);
    }
  }

  public sendCursor(sectionId: string, cursorIndex: number, selection?: { start: number; end: number }) {
    this.send({
      type: 'cursor-move',
      sectionId,
      cursorIndex,
      selection,
    });
  }

  public sendMetadataUpdate(updates: Partial<ResearchDocument>) {
    this.send({
      type: 'update-metadata',
      ...updates,
    });
  }

  public sendSectionReorder(sections: any[]) {
    this.send({
      type: 'section-reorder',
      sections,
    });
  }

  public sendSectionAdd(section: any) {
    this.send({
      type: 'section-add',
      section,
    });
  }

  public sendSectionDelete(sectionId: string) {
    this.send({
      type: 'section-delete',
      sectionId,
    });
  }

  public sendAddComment(comment: any) {
    this.send({
      type: 'add-comment',
      comment,
    });
  }

  public sendReplyComment(commentId: string, content: string) {
    this.send({
      type: 'reply-comment',
      commentId,
      content,
    });
  }

  public sendResolveComment(commentId: string, resolved: boolean) {
    this.send({
      type: 'resolve-comment',
      commentId,
      resolved,
    });
  }

  public sendAddSuggestion(suggestion: any) {
    this.send({
      type: 'add-suggestion',
      suggestion,
    });
  }

  public sendResolveSuggestion(suggestionId: string, status: 'accepted' | 'rejected') {
    this.send({
      type: 'resolve-suggestion',
      suggestionId,
      status,
    });
  }

  public sendUpdateRole(targetUserId: string, newRole: DocumentRole) {
    this.send({
      type: 'update-collaborator-role',
      targetUserId,
      newRole,
    });
  }

  public sendRevokeCollaborator(targetUserId: string) {
    this.send({
      type: 'revoke-collaborator',
      targetUserId,
    });
  }

  public sendTransferOwnership(newOwnerId: string) {
    this.send({
      type: 'transfer-ownership',
      newOwnerId,
    });
  }

  public sendCreateVersion(versionNumber: string, label: string, summary: string) {
    this.send({
      type: 'create-version-snapshot',
      versionNumber,
      label,
      summary,
    });
  }

  public sendRestoreVersion(versionId: string) {
    this.send({
      type: 'restore-version',
      versionId,
    });
  }

  public sendAddReference(reference: any) {
    this.send({
      type: 'add-reference',
      reference,
    });
  }

  public sendUpdateReference(reference: any) {
    this.send({
      type: 'update-reference',
      reference,
    });
  }

  public sendDeleteReference(referenceId: string) {
    this.send({
      type: 'delete-reference',
      referenceId,
    });
  }

  public sendDriveExportRecorded(exportRecord: any) {
    this.send({
      type: 'drive-export-recorded',
      exportRecord,
    });
  }

  public destroy() {
    this.isDestroyed = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.yDoc.destroy();
  }
}
