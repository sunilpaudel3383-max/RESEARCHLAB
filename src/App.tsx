import React, { useState, useEffect, useRef } from 'react';
import {
  ResearchDocument,
  DocumentRole,
  Collaborator,
  CollaboratorCursor,
  PaperEquation,
  PaperFigure,
  PaperTable,
  ReferenceItem,
  ReferencePdfAttachment,
  DriveExportRecord,
  VersionSnapshot,
  DocumentSuggestion,
} from './lib/types';
import { ShieldAlert, FileText, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { CollabClient, ConnectionState } from './lib/collab-client';
import { INITIAL_DOCUMENTS, ADMIN_USER, RESEARCH_PERSONAS } from './lib/mock-data';
import { Navigation, PageId } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { ReferencesPage } from './pages/ReferencesPage';
import { TeamPage } from './pages/TeamPage';
import { EditorHeader } from './components/EditorHeader';
import { OutlineSidebar } from './components/OutlineSidebar';
import { DocumentCanvas } from './components/DocumentCanvas';
import { ReviewSidebar } from './components/ReviewSidebar';
import { EquationModal } from './components/EquationModal';
import { FigureTableModal } from './components/FigureTableModal';
import { ReferenceManagerModal } from './components/ReferenceManagerModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ShareModal } from './components/ShareModal';
import { DriveExportModal } from './components/DriveExportModal';
import { AttachPdfModal } from './components/AttachPdfModal';
import { FindReplaceBar } from './components/FindReplaceBar';
import { SplitCollabView } from './components/SplitCollabView';
import { generateDocxBlob } from './lib/docx-export';
import { ResearchDriveLiteratureModal } from './components/ResearchDriveLiteratureModal';
import { sanitizeCollaborator, registerNewMemberCredential } from './lib/auth-crypto';

export default function App() {
  // Navigation / Page State
  const [currentPage, setCurrentPage] = useState<PageId>('landing');

  // Platform Type: 'admin' | 'member' | 'guest'
  const [platformType, setPlatformType] = useState<'admin' | 'member' | 'guest'>('guest');

  // Authenticated user (starts as null / guest requiring login)
  const [currentPersona, setCurrentPersona] = useState<Collaborator | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<DocumentRole>('viewer');

  // Registered members (dynamic list governed strictly by Admin Sunil, passwords kept in encrypted vault)
  const [registeredMembers, setRegisteredMembers] = useState<Collaborator[]>(() => {
    try {
      const saved = localStorage.getItem('researchlab_registered_members');
      if (saved) {
        const parsed: Collaborator[] = JSON.parse(saved);
        return parsed.map((m) => sanitizeCollaborator(m));
      }
    } catch {}
    return [sanitizeCollaborator(ADMIN_USER)];
  });

  // Documents state (fresh start: starts clean with 0 active papers)
  const [allDocuments, setAllDocuments] = useState<ResearchDocument[]>(() => {
    try {
      const saved = localStorage.getItem('researchlab_documents');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DOCUMENTS; // []
  });

  const [currentDocId, setCurrentDocId] = useState<string>('');
  const [document, setDocument] = useState<ResearchDocument | null>(null);

  // Real-time synchronization state
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isSaving, setIsSaving] = useState(false);
  const [collaboratorCursors, setCollaboratorCursors] = useState<Record<string, CollaboratorCursor>>({});
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Active section & selection in editor
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-intro');
  const [selectedText, setSelectedText] = useState<string>('');
  const [activeTargetSectionId, setActiveTargetSectionId] = useState<string>('sec-intro');

  // Layout & Typography
  const [layoutMode, setLayoutMode] = useState<'single' | 'two-column'>('single');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [fontSize, setFontSize] = useState<'10' | '11' | '12'>('11');
  const [lineSpacing, setLineSpacing] = useState<'1.15' | '1.5' | '2.0'>('1.5');

  // Modals & Panels
  const [isReviewSidebarOpen, setIsReviewSidebarOpen] = useState(true);
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [editingEquation, setEditingEquation] = useState<PaperEquation | null>(null);
  const [isFigureModalOpen, setIsFigureModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isDriveLiteratureModalOpen, setIsDriveLiteratureModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState(false);

  // Attached PDF modal target
  const [attachPdfTarget, setAttachPdfTarget] = useState<{ ref: ReferenceItem; index: number } | null>(null);

  const clientRef = useRef<CollabClient | null>(null);
  const deletedDocIdsRef = useRef<Set<string>>(new Set());

  // All laboratory research manuscripts are shared across all team members
  const isUserAdmin = platformType === 'admin' || currentPersona?.role === 'owner';
  const authorizedDocuments = allDocuments;

  // Synchronize active document modifications back into allDocuments and persist to localStorage
  useEffect(() => {
    if (!document) return;
    if (deletedDocIdsRef.current.has(document.id)) return;
    setAllDocuments(prev => {
      const idx = prev.findIndex(d => d.id === document.id);
      let next: ResearchDocument[];
      if (idx === -1) {
        next = [document, ...prev];
      } else {
        if (prev[idx] === document) return prev;
        next = [...prev];
        next[idx] = document;
      }
      try {
        localStorage.setItem('researchlab_documents', JSON.stringify(next));
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
      return next;
    });
  }, [document]);

  // Keep selected document synced when switching documents
  useEffect(() => {
    if (!currentDocId) {
      if (allDocuments.length > 0) {
        setCurrentDocId(allDocuments[0].id);
        setDocument(allDocuments[0]);
      } else {
        setDocument(null);
      }
      return;
    }

    if (!document || document.id !== currentDocId) {
      const found = allDocuments.find(d => d.id === currentDocId);
      if (found) {
        setDocument(found);
      } else if (allDocuments.length > 0) {
        setCurrentDocId(allDocuments[0].id);
        setDocument(allDocuments[0]);
      } else {
        setDocument(null);
      }
    }
  }, [currentDocId]);

  // Save all documents to localStorage whenever allDocuments changes
  useEffect(() => {
    try {
      localStorage.setItem('researchlab_documents', JSON.stringify(allDocuments));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }, [allDocuments]);

  // Connect CollabClient
  useEffect(() => {
    if (!currentPersona || !currentDocId) {
      clientRef.current?.destroy();
      setConnectionState('disconnected');
      return;
    }

    setRevokedMessage(null);
    clientRef.current?.destroy();

    const client = new CollabClient(
      currentDocId,
      {
        id: currentPersona.id,
        name: currentPersona.name,
        email: currentPersona.email,
        role: currentPersona.role,
        avatar: currentPersona.avatar,
        color: currentPersona.color,
      },
      {
        onSync: (serverDoc, role) => {
          setCurrentUserRole(role);
          setDocument(current => {
            if (current && current.id === serverDoc.id) {
              const currentUpdated = new Date(current.updatedAt || 0).getTime();
              const serverUpdated = new Date(serverDoc.updatedAt || 0).getTime();
              if (currentUpdated > serverUpdated) {
                clientRef.current?.sendMetadataUpdate(current);
                clientRef.current?.sendSectionReorder(current.sections);
                return current;
              }
            }
            return serverDoc;
          });
        },
        onRemoteUpdate: () => {
          if (clientRef.current && document) {
            const ySections = clientRef.current.yDoc.getMap<any>('sections');
            setDocument(prev => {
              if (!prev) return null;
              const updated = { ...prev };
              updated.sections = updated.sections.map(s => {
                const yText = ySections.get(s.id);
                return yText ? { ...s, content: yText.toString() } : s;
              });
              return updated;
            });
          }
        },
        onConnectionChange: setConnectionState,
        onCursorUpdate: (cursor) => {
          setCollaboratorCursors(prev => ({ ...prev, [cursor.userId]: cursor }));
        },
        onUserLeft: (userId) => {
          setCollaboratorCursors(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        },
        onUserJoined: (user) => {
          setDocument(prev => {
            if (!prev) return null;
            const exists = prev.collaborators.some(c => c.id === user.id);
            if (exists) {
              return {
                ...prev,
                collaborators: prev.collaborators.map(c => c.id === user.id ? { ...c, isOnline: true } : c)
              };
            }
            return {
              ...prev,
              collaborators: [...prev.collaborators, user as Collaborator]
            };
          });
        },
        onMetadataUpdate: (meta) => {
          setDocument(prev => prev ? ({ ...prev, ...meta }) : null);
        },
        onSectionsUpdate: (sections) => {
          setDocument(prev => prev ? ({ ...prev, sections }) : null);
        },
        onCommentUpdate: (payload) => {
          if (payload.type === 'comment-added') {
            setDocument(prev => prev ? ({ ...prev, comments: [...prev.comments, payload.comment] }) : null);
          } else if (payload.type === 'comment-replied') {
            setDocument(prev => {
              if (!prev) return null;
              return {
                ...prev,
                comments: prev.comments.map(c => c.id === payload.commentId ? {
                  ...c,
                  replies: [...c.replies, payload.reply]
                } : c)
              };
            });
          } else if (payload.type === 'comment-resolved') {
            setDocument(prev => {
              if (!prev) return null;
              return {
                ...prev,
                comments: prev.comments.map(c => c.id === payload.commentId ? {
                  ...c,
                  resolved: payload.resolved
                } : c)
              };
            });
          }
        },
        onSuggestionUpdate: (payload) => {
          if (payload.type === 'suggestion-added') {
            setDocument(prev => prev ? ({ ...prev, suggestions: [...prev.suggestions, payload.suggestion] }) : null);
          } else if (payload.type === 'suggestion-resolved') {
            setDocument(prev => {
              if (!prev) return null;
              return {
                ...prev,
                suggestions: prev.suggestions.map(s => s.id === payload.suggestionId ? {
                  ...s,
                  status: payload.status
                } : s)
              };
            });
          }
        },
        onCollaboratorsUpdate: (collaborators) => {
          setDocument(prev => prev ? ({ ...prev, collaborators }) : null);
        },
        onRoleChange: (newRole) => {
          setCurrentUserRole(newRole);
        },
        onAccessRevoked: (reason) => {
          setRevokedMessage(reason);
        },
        onVersionCreated: (version) => {
          setDocument(prev => prev ? ({ ...prev, versions: [version, ...prev.versions] }) : null);
        },
        onVersionRestored: (doc) => {
          setDocument(doc);
        },
        onReferencesUpdate: (refs) => {
          setDocument(prev => prev ? ({ ...prev, references: refs }) : null);
        },
        onDriveExportsUpdate: (payload) => {
          setDocument(prev => {
            if (!prev) return null;
            return {
              ...prev,
              driveExports: payload.driveExports || prev.driveExports,
              auditLog: payload.auditLog || prev.auditLog,
            };
          });
        },
        onPermissionDenied: (reason) => {
          setToastMessage(`Server Permission: ${reason}`);
        },
      }
    );

    clientRef.current = client;

    return () => {
      client.destroy();
    };
  }, [currentDocId, currentPersona?.id]);

  // Handle Login Event with specific platform
  const handleLoginSuccess = (user: Collaborator, type: 'admin' | 'member') => {
    setCurrentPersona(user);
    setCurrentUserRole(user.role);
    setPlatformType(type);
    setCurrentPage('dashboard');
  };

  const handleSignOut = () => {
    setCurrentPersona(null);
    setPlatformType('guest');
    setCurrentPage('login');
  };

  // Section Content Edit
  const handleUpdateSectionContent = (sectionId: string, content: string) => {
    if (!document) return;
    if (currentUserRole === 'viewer') return;
    if (currentUserRole === 'reviewer') {
      setSelectedText(content.slice(0, 50));
      setActiveTargetSectionId(sectionId);
      setIsReviewSidebarOpen(true);
      return;
    }

    setIsSaving(true);
    if (clientRef.current) {
      const ySections = clientRef.current.yDoc.getMap<any>('sections');
      let yText = ySections.get(sectionId);
      if (yText) {
        yText.delete(0, yText.length);
        yText.insert(0, content);
      }
    }

    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, content } : s),
        updatedAt: new Date().toISOString(),
      };
    });

    setTimeout(() => setIsSaving(false), 600);
  };

  const handleUpdateMetadata = (updates: Partial<ResearchDocument>) => {
    if (!document) return;
    if (currentUserRole !== 'owner' && currentUserRole !== 'editor') return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendMetadataUpdate(updates);
  };

  const handleCursorMove = (sectionId: string, cursorIndex: number, selection?: { start: number; end: number }) => {
    clientRef.current?.sendCursor(sectionId, cursorIndex, selection);
  };

  const handleTextSelect = (text: string, sectionId: string) => {
    setSelectedText(text);
    setActiveTargetSectionId(sectionId);
  };

  // Section Reordering
  const handleReorderSections = (newSections: any[]) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendSectionReorder(newSections);
  };

  const handleAddSection = (title: string, type: 'standard' | 'appendix') => {
    if (!document) return;
    const newSec = {
      id: `sec-${Date.now()}`,
      title,
      type,
      order: document.sections.length + 1,
      content: '',
    };
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: [...prev.sections, newSec],
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendSectionAdd(newSec);
    setActiveSectionId(newSec.id);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!document) return;
    if (currentUserRole !== 'owner') return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.filter(s => s.id !== sectionId),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendSectionDelete(sectionId);
  };

  // Comments & Suggestions
  const handleAddComment = (content: string, selText?: string, secId?: string) => {
    if (!document || !currentPersona) return;
    const comment = {
      id: `comm-${Date.now()}`,
      sectionId: secId || activeTargetSectionId,
      selectedText: selText || selectedText,
      author: {
        id: currentPersona.id,
        name: currentPersona.name,
        avatar: currentPersona.avatar,
        role: currentUserRole,
      },
      content,
      timestamp: new Date().toISOString(),
      resolved: false,
      replies: [],
    };
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        comments: [comment, ...prev.comments],
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendAddComment(comment);
    setSelectedText('');
  };

  const handleReplyComment = (commentId: string, content: string) => {
    if (!currentPersona) return;
    const reply = {
      id: `rep-${Date.now()}`,
      author: {
        id: currentPersona.id,
        name: currentPersona.name,
        avatar: currentPersona.avatar,
        role: currentUserRole,
      },
      content,
      timestamp: new Date().toISOString(),
    };
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        comments: prev.comments.map(c => c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendReplyComment(commentId, content);
  };

  const handleResolveComment = (commentId: string, resolved: boolean) => {
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        comments: prev.comments.map(c => c.id === commentId ? { ...c, resolved } : c),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendResolveComment(commentId, resolved);
  };

  const handleAddSuggestion = (originalText: string, suggestedText: string, sectionId: string) => {
    if (!currentPersona) return;
    const suggestion: DocumentSuggestion = {
      id: `sug-${Date.now()}`,
      sectionId: sectionId || activeTargetSectionId,
      type: 'replace',
      author: {
        id: currentPersona.id,
        name: currentPersona.name,
        avatar: currentPersona.avatar,
        role: currentUserRole,
      },
      originalText,
      suggestedText,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        suggestions: [suggestion, ...prev.suggestions],
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendAddSuggestion(suggestion);
    setSelectedText('');
  };

  const handleResolveSuggestion = (suggestionId: string, status: 'accepted' | 'rejected') => {
    setDocument(prev => {
      if (!prev) return null;
      const sug = prev.suggestions.find(s => s.id === suggestionId);
      let updatedSections = prev.sections;
      if (status === 'accepted' && sug) {
        updatedSections = prev.sections.map(s => {
          if (s.id === sug.sectionId) {
            return {
              ...s,
              content: s.content.replace(sug.originalText || '', sug.suggestedText),
            };
          }
          return s;
        });
      }
      return {
        ...prev,
        sections: updatedSections,
        suggestions: prev.suggestions.map(s => s.id === suggestionId ? { ...s, status } : s),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendResolveSuggestion(suggestionId, status);
  };

  // Roles & Permissions
  const handleUpdateCollaboratorRole = (userId: string, newRole: DocumentRole) => {
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        collaborators: prev.collaborators.map(c => c.id === userId ? { ...c, role: newRole } : c),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendUpdateRole(userId, newRole);
  };

  const handleRevokeAccess = (userId: string) => {
    if (document) {
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          collaborators: prev.collaborators.filter(c => c.id !== userId),
          updatedAt: new Date().toISOString(),
        };
      });
      clientRef.current?.sendRevokeCollaborator(userId);
    }
  };

  const handleTransferOwnership = (newOwnerId: string) => {
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        collaborators: prev.collaborators.map(c => {
          if (c.id === newOwnerId) return { ...c, role: 'owner' as DocumentRole };
          if (c.role === 'owner') return { ...c, role: 'editor' as DocumentRole };
          return c;
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendTransferOwnership(newOwnerId);
  };

  // Add Collaborator (Only Admin can add members)
  const handleAddCollaborator = (collab: Collaborator) => {
    // 1. Register credentials in private cryptographic vault (salted SHA-256)
    registerNewMemberCredential(collab.id, collab.email);

    // 2. Sanitize public collaborator record so password is never stored or visible
    const safeCollab = sanitizeCollaborator(collab);

    // 3. Save sanitized record to registeredMembers
    setRegisteredMembers(prev => {
      const exists = prev.some(m => m.id === safeCollab.id || m.email.toLowerCase() === safeCollab.email.toLowerCase());
      const updated = exists ? prev.map(m => (m.id === safeCollab.id || m.email.toLowerCase() === safeCollab.email.toLowerCase()) ? safeCollab : m) : [...prev, safeCollab];
      try {
        localStorage.setItem('researchlab_registered_members', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. Add to active document if exists
    if (document) {
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          collaborators: [...prev.collaborators.filter(c => c.id !== safeCollab.id), safeCollab],
          updatedAt: new Date().toISOString(),
        };
      });
      clientRef.current?.sendUpdateRole(safeCollab.id, safeCollab.role);
    }
  };

  // Update Member (e.g., when member changes their password on first login)
  const handleUpdateMember = (updatedMember: Collaborator) => {
    setRegisteredMembers(prev => {
      const updated = prev.map(m => (m.id === updatedMember.id || m.email.toLowerCase() === updatedMember.email.toLowerCase()) ? updatedMember : m);
      try {
        localStorage.setItem('researchlab_registered_members', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (currentPersona?.id === updatedMember.id || currentPersona?.email.toLowerCase() === updatedMember.email.toLowerCase()) {
      setCurrentPersona(updatedMember);
    }

    if (document) {
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          collaborators: prev.collaborators.map(c => (c.id === updatedMember.id || c.email.toLowerCase() === updatedMember.email.toLowerCase()) ? { ...c, ...updatedMember } : c),
          updatedAt: new Date().toISOString(),
        };
      });
    }
  };

  const handleToggleArchive = () => {
    if (!document) return;
    const nextArchived = !document.isArchived;
    setDocument(prev => prev ? ({ ...prev, isArchived: nextArchived, updatedAt: new Date().toISOString() }) : null);
    clientRef.current?.sendMetadataUpdate({ isArchived: nextArchived });
  };

  // Equations, Figures, Tables
  const handleSaveEquation = (eq: PaperEquation) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === activeTargetSectionId) {
            const eqs = s.equations ? [...s.equations] : [];
            const idx = eqs.findIndex(e => e.id === eq.id);
            if (idx !== -1) eqs[idx] = eq;
            else eqs.push(eq);
            return { ...s, equations: eqs };
          }
          return s;
        }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleDeleteEquation = (sectionId: string, eqId: string) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? {
          ...s,
          equations: s.equations?.filter(e => e.id !== eqId)
        } : s),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleSaveFigure = (fig: PaperFigure) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === activeTargetSectionId) {
            return { ...s, figures: [...(s.figures || []), fig] };
          }
          return s;
        }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleDeleteFigure = (sectionId: string, figId: string) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? {
          ...s,
          figures: s.figures?.filter(f => f.id !== figId)
        } : s),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleSaveTable = (tbl: PaperTable) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => {
          if (s.id === activeTargetSectionId) {
            return { ...s, tables: [...(s.tables || []), tbl] };
          }
          return s;
        }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleDeleteTable = (sectionId: string, tblId: string) => {
    if (!document) return;
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? {
          ...s,
          tables: s.tables?.filter(t => t.id !== tblId)
        } : s),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // References
  const handleAddReference = (ref: ReferenceItem) => {
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        references: [...prev.references, ref],
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendAddReference(ref);
  };

  const handleUpdateReference = (ref: ReferenceItem) => {
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        references: prev.references.map(r => r.id === ref.id ? ref : r),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendUpdateReference(ref);
  };

  const handleDeleteReference = (refId: string) => {
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        references: prev.references.filter(r => r.id !== refId),
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendDeleteReference(refId);
  };

  const handleInsertCitation = (key: string, index: number) => {
    if (!document) return;
    const citationTag = ` [${index}]`;
    const sec = document.sections.find(s => s.id === activeTargetSectionId) || document.sections[0];
    if (sec) {
      handleUpdateSectionContent(sec.id, sec.content + citationTag);
    }
  };

  // Google Drive Cited Literature PDF attachment handler
  const handleSavePdfAttachment = (referenceId: string, attachment: ReferencePdfAttachment | null) => {
    if (!document) return;
    const updatedReferences = document.references.map(r => {
      if (r.id === referenceId) {
        return { ...r, pdfAttachment: attachment || undefined };
      }
      return r;
    });

    const targetRef = updatedReferences.find(r => r.id === referenceId);

    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        references: updatedReferences,
        auditLog: [
          {
            id: `log-${Date.now()}`,
            action: attachment ? 'Attached Cited PDF to Google Drive' : 'Unlinked Cited PDF',
            actorName: currentPersona?.name || 'Researcher',
            actorRole: currentUserRole,
            timestamp: new Date().toISOString(),
            details: attachment
              ? `Uploaded ${attachment.fileName} to Google Drive folder 'CollabScholar - Cited Literature PDFs'`
              : `Removed PDF attachment for reference ${targetRef?.key || referenceId}`,
          },
          ...prev.auditLog,
        ],
        updatedAt: new Date().toISOString(),
      };
    });

    if (targetRef) {
      clientRef.current?.sendUpdateReference(targetRef);
    }
  };

  // Version Snapshots
  const handleCreateSnapshot = (versionNumber: string, label: string, summary: string) => {
    if (!document) return;
    const newVersion: VersionSnapshot = {
      id: `ver-${Date.now()}`,
      versionNumber,
      label,
      summary,
      authorName: currentPersona?.name || 'Researcher',
      authorAvatar: currentPersona?.avatar || ADMIN_USER.avatar,
      timestamp: new Date().toISOString(),
      data: {
        title: document.title,
        abstract: document.abstract,
        keywords: [...document.keywords],
        authors: [...document.authors],
        sections: JSON.parse(JSON.stringify(document.sections)),
        references: JSON.parse(JSON.stringify(document.references)),
        stats: {
          words: document.sections.reduce((acc, s) => acc + (s.content ? s.content.trim().split(/\s+/).filter(Boolean).length : 0), 0),
          characters: document.sections.reduce((acc, s) => acc + (s.content ? s.content.length : 0), 0),
        },
      },
    };

    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        versions: [newVersion, ...prev.versions],
        auditLog: [
          {
            id: `log-${Date.now()}`,
            action: 'Created Version Snapshot',
            actorName: currentPersona?.name || 'Researcher',
            actorRole: currentUserRole,
            timestamp: new Date().toISOString(),
            details: `Snapshot ${versionNumber}: ${label}`,
          },
          ...prev.auditLog,
        ],
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendCreateVersion(versionNumber, label, summary);
  };

  const handleRestoreVersion = (versionId: string) => {
    if (!document) return;
    const targetVer = document.versions.find(v => v.id === versionId);
    if (!targetVer) return;

    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        title: targetVer.data.title,
        abstract: targetVer.data.abstract,
        keywords: [...targetVer.data.keywords],
        authors: [...targetVer.data.authors],
        sections: JSON.parse(JSON.stringify(targetVer.data.sections)),
        references: JSON.parse(JSON.stringify(targetVer.data.references)),
        auditLog: [
          {
            id: `log-${Date.now()}`,
            action: 'Restored Version',
            actorName: currentPersona?.name || 'Researcher',
            actorRole: currentUserRole,
            timestamp: new Date().toISOString(),
            details: `Restored manuscript state to Version ${targetVer.versionNumber}`,
          },
          ...prev.auditLog,
        ],
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.sendRestoreVersion(versionId);
  };

  // Google Drive Export
  const handleRecordDriveExport = (record: DriveExportRecord) => {
    setDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        driveExports: [record, ...(prev.driveExports || [])],
        auditLog: [
          {
            id: `log-${Date.now()}`,
            action: 'Exported Manuscript to Google Drive',
            actorName: currentPersona?.name || 'Researcher',
            actorRole: currentUserRole,
            timestamp: new Date().toISOString(),
            details: `Exported ${record.fileName} to Google Drive folder "${record.folderName}"`,
          },
          ...prev.auditLog,
        ],
        updatedAt: new Date().toISOString(),
      };
    });
    clientRef.current?.send({
      type: 'drive-export-recorded',
      exportRecord: record,
    });
  };

  // Export DOCX
  const handleExportDocx = async () => {
    if (!document) return;
    try {
      const blob = await generateDocxBlob(document);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setToastMessage('Failed to generate DOCX file. Please check manuscript content.');
    }
  };

  // Export PDF (Print dialog with page styling)
  const handleExportPdf = () => {
    window.print();
  };

  // Fresh Start: Create New Research Manuscript
  const handleCreateNewManuscript = (
    docType: 'journal' | 'conference' | 'lit_review' | 'technical_report',
    title: string
  ) => {
    const newDoc: ResearchDocument = {
      id: `doc-${Date.now()}`,
      projectId: 'proj-civillab',
      docType,
      title: title || 'Experimental Investigation into Civil Infrastructure Mechanics',
      abstract: 'Abstract summarizing civil engineering scope, experimental testing matrix, finite element modeling, and principal structural/geotechnical findings.',
      keywords: ['Civil Engineering', 'Structural Mechanics', 'Finite Element Analysis', 'Infrastructure Resilience'],
      citationStyle: 'ieee',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authors: [
        {
          id: 'auth-sunil',
          name: 'Sunil Paudel',
          email: 'sunil@researchlab.np',
          affiliation: 'Department of Civil & Environmental Engineering',
          isCorresponding: true,
        }
      ],
      collaborators: [currentPersona || ADMIN_USER],
      sections: [
        {
          id: 'sec-intro',
          title: '1. Introduction',
          type: 'standard',
          order: 1,
          content: 'State infrastructure research background, structural or geotechnical problem statement, and engineering objectives...',
        },
        {
          id: 'sec-lit-review',
          title: '2. Literature Review & Design Codes',
          type: 'standard',
          order: 2,
          content: 'Review prior experimental literature, building codes (ASCE 7, ACI 318, Eurocode), and analytical formulations...',
        },
        {
          id: 'sec-methodology',
          title: '3. Experimental Program & Numerical Modeling',
          type: 'standard',
          order: 3,
          content: 'Specify material batching, specimen geometry, testing instrumentation, strain gages, and boundary conditions...',
        },
        {
          id: 'sec-results',
          title: '4. Experimental Results & Structural Discussion',
          type: 'standard',
          order: 4,
          content: 'Present load-deformation curves, stress-strain behavior, failure modes, crack propagation, and comparative validation...',
        },
        {
          id: 'sec-conclusion',
          title: '5. Conclusions & Engineering Implications',
          type: 'standard',
          order: 5,
          content: 'Synthesize primary conclusions, factor of safety implications, and design recommendations for practicing engineers...',
        }
      ],
      references: [],
      comments: [],
      suggestions: [],
      versions: [
        {
          id: `ver-${Date.now()}`,
          versionNumber: '1.0',
          label: 'Initial Manuscript Creation',
          summary: 'Initialized publication draft in ResearchLab workspace.',
          authorName: currentPersona?.name || 'Sunil Paudel',
          authorAvatar: currentPersona?.avatar || ADMIN_USER.avatar,
          timestamp: new Date().toISOString(),
          data: {
            title: title || 'Untitled Research Manuscript',
            abstract: '',
            keywords: [],
            authors: [],
            sections: [],
            references: [],
            stats: { words: 0, characters: 0 }
          }
        }
      ],
      driveExports: [],
      auditLog: [
        {
          id: `log-${Date.now()}`,
          action: 'Manuscript Created',
          actorName: currentPersona?.name || 'Sunil Paudel',
          actorRole: currentUserRole,
          timestamp: new Date().toISOString(),
          details: 'Initialized publication draft in ResearchLab directorate.'
        }
      ]
    };

    setAllDocuments(prev => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
    setDocument(newDoc);
    setCurrentPage('editor');
  };

  // Administrator Manuscript Deletion
  const handleDeleteManuscript = (docId: string) => {
    if (!isUserAdmin) return;
    deletedDocIdsRef.current.add(docId);

    const remaining = allDocuments.filter(d => d.id !== docId);
    setAllDocuments(remaining);
    try {
      localStorage.setItem('researchlab_documents', JSON.stringify(remaining));
    } catch (err) {
      console.warn('LocalStorage save after delete failed:', err);
    }

    if (currentDocId === docId || (document && document.id === docId)) {
      const nextDoc = remaining.length > 0 ? remaining[0] : null;
      setDocument(nextDoc);
      setCurrentDocId(nextDoc ? nextDoc.id : '');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-stone-100 text-stone-900 font-sans">
      {/* 1. UNIVERSAL NAVIGATION BAR */}
      <Navigation
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentPersona}
        platformType={platformType}
        onSignOut={handleSignOut}
        activeDocTitle={document?.title}
      />

      {/* 2. PUBLIC / OVERVIEW LANDING PAGE */}
      {currentPage === 'landing' && (
        <div className="flex-1 overflow-y-auto">
          <LandingPage
            onOpenEditor={() => {
              if (currentPersona) {
                setCurrentPage(allDocuments.length > 0 ? 'editor' : 'dashboard');
              } else {
                setCurrentPage('login');
              }
            }}
            onOpenDashboard={() => {
              if (currentPersona) {
                setCurrentPage('dashboard');
              } else {
                setCurrentPage('login');
              }
            }}
            onOpenLogin={() => setCurrentPage('login')}
          />
        </div>
      )}

      {/* 3. DEDICATED AUTHENTICATION GATEWAY */}
      {currentPage === 'login' && (
        <div className="flex-1 overflow-y-auto">
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateHome={() => setCurrentPage('landing')}
            registeredMembers={registeredMembers}
            onUpdateMember={handleUpdateMember}
          />
        </div>
      )}

      {/* 4. MANUSCRIPTS & PROJECTS HUB */}
      {currentPage === 'dashboard' && (
        <div className="flex-1 overflow-y-auto">
          <ProjectsDashboard
            documents={allDocuments}
            currentDocId={currentDocId}
            onSelectDoc={(id) => {
              setCurrentDocId(id);
              const doc = allDocuments.find(d => d.id === id);
              if (doc) setDocument(doc);
            }}
            onOpenEditor={() => setCurrentPage('editor')}
            onCreateNewDoc={handleCreateNewManuscript}
            onOpenDriveModal={(doc) => {
              setDocument(doc);
              setIsDriveModalOpen(true);
            }}
            onOpenDriveLiteratureModal={(doc) => {
              setDocument(doc);
              setIsDriveLiteratureModalOpen(true);
            }}
            onOpenShareModal={(doc) => {
              setDocument(doc);
              setIsShareModalOpen(true);
            }}
            onDeleteDocument={handleDeleteManuscript}
            currentUser={currentPersona}
            platformType={platformType}
          />
        </div>
      )}

      {/* 5. REFERENCES & CITATIONS CATALOG */}
      {currentPage === 'references' && (
        <div className="flex-1 overflow-y-auto">
          <ReferencesPage
            references={document ? document.references : []}
            citationStyle={document ? document.citationStyle : 'ieee'}
            onUpdateStyle={(style) => handleUpdateMetadata({ citationStyle: style })}
            onOpenImportModal={() => setIsReferenceModalOpen(true)}
            onDeleteReference={handleDeleteReference}
            onOpenAttachPdf={(ref, idx) => setAttachPdfTarget({ ref, index: idx })}
            onOpenLiteratureDrive={() => setIsDriveLiteratureModalOpen(true)}
            literatureCount={document?.literaturePdfs?.length || 0}
          />
        </div>
      )}

      {/* 6. TEAM & ACCESS CONTROL (Admin Matrix vs Member Directory) */}
      {currentPage === 'team' && (
        <div className="flex-1 overflow-y-auto">
          <TeamPage
            collaborators={document ? document.collaborators : registeredMembers}
            auditLog={document ? document.auditLog : []}
            currentUserRole={currentUserRole}
            currentUserId={currentPersona?.id || ''}
            platformType={platformType}
            onUpdateRole={handleUpdateCollaboratorRole}
            onRevokeAccess={handleRevokeAccess}
            onTransferOwnership={handleTransferOwnership}
            onAddCollaborator={handleAddCollaborator}
          />
        </div>
      )}

      {/* 7. REAL-TIME COLLABORATIVE PAPER EDITOR */}
      {currentPage === 'editor' && (
        !document ? (
          <div className="flex-1 bg-stone-100 flex items-center justify-center p-8">
            <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-900">
                No Active Manuscript Loaded
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {platformType === 'admin'
                  ? 'Your ResearchLab directorate is clean and ready. Initialize your first research paper to begin writing with real-time CRDT collaboration.'
                  : 'You have not been assigned to any research papers yet. Please contact the administrator (sunil@researchlab.np).'}
              </p>
              <div className="pt-2 flex justify-center space-x-3">
                {platformType === 'admin' ? (
                  <button
                    onClick={() => handleCreateNewManuscript('journal', 'Untitled Research Manuscript')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Manuscript</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold"
                  >
                    View Manuscripts Hub
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : revokedMessage ? (
          <div className="flex-1 bg-stone-100 flex items-center justify-center p-8">
            <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Document Access Revoked
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {revokedMessage}
              </p>
              <div className="pt-2 flex justify-center space-x-3">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <EditorHeader
              document={document}
              currentUserId={currentPersona?.id || ''}
              currentUserRole={currentUserRole}
              connectionState={connectionState}
              collaborators={document.collaborators}
              isSaving={isSaving}
              isSplitView={isSplitViewOpen}
              layoutMode={layoutMode}
              fontFamily={fontFamily}
              fontSize={fontSize}
              lineSpacing={lineSpacing}
              onToggleSplitView={() => setIsSplitViewOpen(!isSplitViewOpen)}
              onToggleLayoutMode={() => setLayoutMode(layoutMode === 'single' ? 'two-column' : 'single')}
              onSetFontFamily={setFontFamily}
              onSetFontSize={setFontSize}
              onSetLineSpacing={setLineSpacing}
              onSwitchPersona={(p) => {
                setCurrentPersona(p);
                setCurrentUserRole(p.role);
              }}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onOpenVersionModal={() => setIsVersionModalOpen(true)}
              onOpenReferenceModal={() => setIsReferenceModalOpen(true)}
              onOpenDriveModal={() => setIsDriveModalOpen(true)}
              onOpenDriveLiteratureModal={() => setIsDriveLiteratureModalOpen(true)}
              onOpenEquationModal={() => {
                setEditingEquation(null);
                setIsEquationModalOpen(true);
              }}
              onOpenFigureModal={() => setIsFigureModalOpen(true)}
              onOpenTableModal={() => setIsTableModalOpen(true)}
              onToggleFindReplace={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
              onExportDocx={handleExportDocx}
              onExportPdf={handleExportPdf}
            />

            <FindReplaceBar
              isOpen={isFindReplaceOpen}
              onClose={() => setIsFindReplaceOpen(false)}
              onFind={(term, caseSens) => {
                if (!term || !document) return 0;
                let count = 0;
                const flags = caseSens ? 'g' : 'gi';
                const regex = new RegExp(term, flags);
                for (const sec of document.sections) {
                  const matches = sec.content.match(regex);
                  if (matches) count += matches.length;
                }
                return count;
              }}
              onReplace={(findTerm, replaceTerm, replaceAll, caseSens) => {
                if (!findTerm || !document) return;
                const flags = caseSens ? (replaceAll ? 'g' : '') : (replaceAll ? 'gi' : 'i');
                const regex = new RegExp(findTerm, flags);
                const updatedSections = document.sections.map(sec => {
                  if (regex.test(sec.content)) {
                    const nextContent = sec.content.replace(regex, replaceTerm);
                    handleUpdateSectionContent(sec.id, nextContent);
                    return { ...sec, content: nextContent };
                  }
                  return sec;
                });
                setDocument(prev => prev ? ({ ...prev, sections: updatedSections }) : null);
              }}
            />

            <div className="flex-1 flex overflow-hidden relative">
              <OutlineSidebar
                sections={document.sections}
                activeSectionId={activeSectionId}
                userRole={currentUserRole}
                currentDocId={currentDocId}
                onSelectSection={setActiveSectionId}
                onReorderSections={handleReorderSections}
                onAddSection={handleAddSection}
                onDeleteSection={handleDeleteSection}
                onSelectDocument={setCurrentDocId}
                allDocs={authorizedDocuments.map(d => ({ id: d.id, title: d.title, docType: d.docType }))}
                onCreateNewDoc={() => handleCreateNewManuscript('conference', 'Untitled Conference Paper')}
                onDeleteDocument={isUserAdmin ? handleDeleteManuscript : undefined}
              />

              <DocumentCanvas
                document={document}
                userRole={currentUserRole}
                currentUserId={currentPersona?.id || ''}
                activeSectionId={activeSectionId}
                collaboratorCursors={collaboratorCursors}
                layoutMode={layoutMode}
                fontFamily={fontFamily}
                fontSize={fontSize}
                lineSpacing={lineSpacing}
                highlightedText={selectedText}
                onUpdateSectionContent={handleUpdateSectionContent}
                onUpdateMetadata={handleUpdateMetadata}
                onCursorMove={handleCursorMove}
                onTextSelect={handleTextSelect}
                onOpenEquationModal={(secId, eq) => {
                  setActiveTargetSectionId(secId);
                  setEditingEquation(eq || null);
                  setIsEquationModalOpen(true);
                }}
                onOpenFigureModal={(secId) => {
                  setActiveTargetSectionId(secId);
                  setIsFigureModalOpen(true);
                }}
                onOpenTableModal={(secId) => {
                  setActiveTargetSectionId(secId);
                  setIsTableModalOpen(true);
                }}
                onOpenReferenceManager={() => setIsReferenceModalOpen(true)}
                onOpenAttachPdf={(ref, idx) => setAttachPdfTarget({ ref, index: idx })}
                onDeleteEquation={handleDeleteEquation}
                onDeleteFigure={handleDeleteFigure}
                onDeleteTable={handleDeleteTable}
              />

              <ReviewSidebar
                isOpen={isReviewSidebarOpen}
                onClose={() => setIsReviewSidebarOpen(false)}
                comments={document.comments}
                suggestions={document.suggestions}
                collaborators={document.collaborators}
                currentUserId={currentPersona?.id || ''}
                userRole={currentUserRole}
                selectedText={selectedText}
                activeSectionId={activeTargetSectionId}
                onAddComment={handleAddComment}
                onReplyComment={handleReplyComment}
                onResolveComment={handleResolveComment}
                onAddSuggestion={handleAddSuggestion}
                onResolveSuggestion={handleResolveSuggestion}
              />
            </div>
          </div>
        )
      )}

      {/* Global Modals (Only active when document exists) */}
      {document && (
        <>
          <EquationModal
            isOpen={isEquationModalOpen}
            onClose={() => {
              setIsEquationModalOpen(false);
              setEditingEquation(null);
            }}
            onSave={handleSaveEquation}
            initialEquation={editingEquation}
            nextNumber={
              document.sections.reduce((acc, s) => acc + (s.equations ? s.equations.length : 0), 0) + 1
            }
          />

          <FigureTableModal
            isOpen={isFigureModalOpen}
            onClose={() => setIsFigureModalOpen(false)}
            type="figure"
            sectionId={activeTargetSectionId}
            nextNumber={
              document.sections.reduce((acc, s) => acc + (s.figures ? s.figures.length : 0), 0) + 1
            }
            onSaveFigure={handleSaveFigure}
            onSaveTable={handleSaveTable}
          />

          <FigureTableModal
            isOpen={isTableModalOpen}
            onClose={() => setIsTableModalOpen(false)}
            type="table"
            sectionId={activeTargetSectionId}
            nextNumber={
              document.sections.reduce((acc, s) => acc + (s.tables ? s.tables.length : 0), 0) + 1
            }
            onSaveFigure={handleSaveFigure}
            onSaveTable={handleSaveTable}
          />

          <ReferenceManagerModal
            isOpen={isReferenceModalOpen}
            onClose={() => setIsReferenceModalOpen(false)}
            references={document.references}
            citationStyle={document.citationStyle}
            onUpdateStyle={(style) => handleUpdateMetadata({ citationStyle: style })}
            onAddReference={handleAddReference}
            onUpdateReference={handleUpdateReference}
            onDeleteReference={handleDeleteReference}
            onInsertCitation={handleInsertCitation}
            onOpenAttachPdf={(ref, idx) => setAttachPdfTarget({ ref, index: idx })}
          />

          <VersionHistoryModal
            isOpen={isVersionModalOpen}
            onClose={() => setIsVersionModalOpen(false)}
            versions={document.versions}
            auditLog={document.auditLog}
            currentDoc={document}
            userRole={currentUserRole}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreVersion={handleRestoreVersion}
          />

          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            collaborators={document.collaborators}
            currentUserId={currentPersona?.id || ''}
            currentUserRole={currentUserRole}
            isArchived={document.isArchived}
            onUpdateRole={handleUpdateCollaboratorRole}
            onRevokeAccess={handleRevokeAccess}
            onTransferOwnership={handleTransferOwnership}
            onToggleArchive={handleToggleArchive}
            onAddCollaborator={handleAddCollaborator}
            registeredMembers={registeredMembers}
          />

          <DriveExportModal
            isOpen={isDriveModalOpen}
            onClose={() => setIsDriveModalOpen(false)}
            document={document}
            onRecordExport={handleRecordDriveExport}
          />

          <ResearchDriveLiteratureModal
            isOpen={isDriveLiteratureModalOpen}
            onClose={() => setIsDriveLiteratureModalOpen(false)}
            document={document}
            currentUser={currentPersona}
            currentUserRole={currentUserRole}
            platformType={platformType}
            onUpdateDocument={(partial) => handleUpdateMetadata(partial)}
          />

          <SplitCollabView
            isOpen={isSplitViewOpen}
            onClose={() => setIsSplitViewOpen(false)}
            docId={currentDocId}
          />
        </>
      )}

      {/* Google Drive PDF Attachment Modal */}
      <AttachPdfModal
        isOpen={Boolean(attachPdfTarget)}
        onClose={() => setAttachPdfTarget(null)}
        reference={attachPdfTarget?.ref || null}
        citationIndex={attachPdfTarget?.index}
        currentUser={currentPersona}
        onSaveAttachment={handleSavePdfAttachment}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-stone-50 px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center space-x-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
