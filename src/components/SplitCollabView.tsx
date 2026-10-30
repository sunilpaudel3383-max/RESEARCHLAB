import React, { useState, useEffect, useRef } from 'react';
import { X, Users, RefreshCw, Send, CheckCircle2, SplitSquareVertical } from 'lucide-react';
import { ResearchDocument, DocumentRole, Collaborator } from '../lib/types';
import { CollabClient, ConnectionState } from '../lib/collab-client';
import { RESEARCH_PERSONAS } from '../lib/mock-data';

interface SplitCollabViewProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
}

export const SplitCollabView: React.FC<SplitCollabViewProps> = ({
  isOpen,
  onClose,
  docId,
}) => {
  // Co-author 1: Dr. Elena Vance
  const author1 = RESEARCH_PERSONAS[0]; // Elena (Owner)
  // Co-author 2: Prof. Marcus Chen
  const author2 = RESEARCH_PERSONAS[1]; // Marcus (Editor)

  const [docState1, setDocState1] = useState<ResearchDocument | null>(null);
  const [docState2, setDocState2] = useState<ResearchDocument | null>(null);

  const [status1, setStatus1] = useState<ConnectionState>('connecting');
  const [status2, setStatus2] = useState<ConnectionState>('connecting');

  const [cursor2InPane1, setCursor2InPane1] = useState<any>(null);
  const [cursor1InPane2, setCursor1InPane2] = useState<any>(null);

  const client1Ref = useRef<CollabClient | null>(null);
  const client2Ref = useRef<CollabClient | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Connect Client 1 (Elena)
    client1Ref.current = new CollabClient(
      docId,
      {
        id: author1.id,
        name: author1.name,
        role: author1.role,
        avatar: author1.avatar,
        color: author1.color,
      },
      {
        onSync: (doc) => setDocState1(JSON.parse(JSON.stringify(doc))),
        onRemoteUpdate: () => {
          // Re-sync local section text from Yjs
          const ySections = client1Ref.current?.yDoc.getMap<any>('sections');
          if (ySections && docState1) {
            setDocState1(prev => {
              if (!prev) return null;
              const next = { ...prev };
              next.sections = next.sections.map(s => {
                const yText = ySections.get(s.id);
                return yText ? { ...s, content: yText.toString() } : s;
              });
              return next;
            });
          }
        },
        onConnectionChange: setStatus1,
        onCursorUpdate: (cursor) => setCursor2InPane1(cursor),
        onUserLeft: () => setCursor2InPane1(null),
        onUserJoined: () => {},
        onMetadataUpdate: (m) => setDocState1(prev => prev ? ({ ...prev, ...m }) : null),
        onSectionsUpdate: (s) => setDocState1(prev => prev ? ({ ...prev, sections: s }) : null),
        onCommentUpdate: () => {},
        onSuggestionUpdate: () => {},
        onCollaboratorsUpdate: () => {},
        onRoleChange: () => {},
        onAccessRevoked: () => {},
        onVersionCreated: () => {},
        onVersionRestored: (doc) => setDocState1(doc),
        onReferencesUpdate: (refs) => setDocState1(prev => prev ? ({ ...prev, references: refs }) : null),
        onDriveExportsUpdate: () => {},
        onPermissionDenied: (r) => console.warn('P1 permission denied:', r),
      }
    );

    // Connect Client 2 (Marcus)
    client2Ref.current = new CollabClient(
      docId,
      {
        id: author2.id,
        name: author2.name,
        role: author2.role,
        avatar: author2.avatar,
        color: author2.color,
      },
      {
        onSync: (doc) => setDocState2(JSON.parse(JSON.stringify(doc))),
        onRemoteUpdate: () => {
          const ySections = client2Ref.current?.yDoc.getMap<any>('sections');
          if (ySections && docState2) {
            setDocState2(prev => {
              if (!prev) return null;
              const next = { ...prev };
              next.sections = next.sections.map(s => {
                const yText = ySections.get(s.id);
                return yText ? { ...s, content: yText.toString() } : s;
              });
              return next;
            });
          }
        },
        onConnectionChange: setStatus2,
        onCursorUpdate: (cursor) => setCursor1InPane2(cursor),
        onUserLeft: () => setCursor1InPane2(null),
        onUserJoined: () => {},
        onMetadataUpdate: (m) => setDocState2(prev => prev ? ({ ...prev, ...m }) : null),
        onSectionsUpdate: (s) => setDocState2(prev => prev ? ({ ...prev, sections: s }) : null),
        onCommentUpdate: () => {},
        onSuggestionUpdate: () => {},
        onCollaboratorsUpdate: () => {},
        onRoleChange: () => {},
        onAccessRevoked: () => {},
        onVersionCreated: () => {},
        onVersionRestored: (doc) => setDocState2(doc),
        onReferencesUpdate: (refs) => setDocState2(prev => prev ? ({ ...prev, references: refs }) : null),
        onDriveExportsUpdate: () => {},
        onPermissionDenied: (r) => console.warn('P2 permission denied:', r),
      }
    );

    return () => {
      client1Ref.current?.destroy();
      client2Ref.current?.destroy();
    };
  }, [isOpen, docId]);

  if (!isOpen) return null;

  const handlePane1Edit = (secId: string, val: string) => {
    if (!docState1 || !client1Ref.current) return;
    // Update Y.Text
    const ySections = client1Ref.current.yDoc.getMap<any>('sections');
    let yText = ySections.get(secId);
    if (yText) {
      yText.delete(0, yText.length);
      yText.insert(0, val);
    }
    // Update local state
    setDocState1(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === secId ? { ...s, content: val } : s)
      };
    });
    // Send cursor
    client1Ref.current.sendCursor(secId, val.length);
  };

  const handlePane2Edit = (secId: string, val: string) => {
    if (!docState2 || !client2Ref.current) return;
    const ySections = client2Ref.current.yDoc.getMap<any>('sections');
    let yText = ySections.get(secId);
    if (yText) {
      yText.delete(0, yText.length);
      yText.insert(0, val);
    }
    setDocState2(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === secId ? { ...s, content: val } : s)
      };
    });
    client2Ref.current.sendCursor(secId, val.length);
  };

  const targetSectionId = docState1?.sections[0]?.id || 'sec-intro';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col p-4">
      {/* Top Bar */}
      <div className="bg-stone-900 text-white rounded-t-xl px-6 py-3 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center space-x-3">
          <SplitSquareVertical className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-semibold text-sm">Simultaneous Co-Author Split View</h3>
            <p className="text-xs text-stone-400">
              Live dual-browser simulation: Two distinct researchers typing concurrently over WebSockets with Yjs CRDT synchronization.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Side-by-Side Panels */}
      <div className="flex-1 bg-stone-100 rounded-b-xl overflow-hidden grid grid-cols-2 divide-x divide-stone-300">
        {/* PANEL 1: DR. ELENA VANCE (Owner) */}
        <div className="flex flex-col bg-white overflow-hidden">
          {/* Panel 1 Header */}
          <div className="px-4 py-2.5 bg-purple-50/80 border-b border-purple-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={author1.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover border-2 border-purple-500"
              />
              <div>
                <span className="font-semibold text-xs text-purple-950">{author1.name}</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded font-semibold uppercase">
                  {author1.role}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{status1}</span>
            </div>
          </div>

          {/* Panel 1 Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="relative">
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                {docState1?.sections[0]?.title || 'Introduction'}
              </label>

              {/* Show collaborator 2's cursor tag */}
              {cursor2InPane1 && (
                <div className="mb-2 px-2 py-1 bg-emerald-100 text-emerald-900 text-xs rounded border border-emerald-300 flex items-center space-x-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span><strong>{cursor2InPane1.name}</strong> is typing here...</span>
                </div>
              )}

              <textarea
                value={docState1?.sections[0]?.content || ''}
                onChange={(e) => handlePane1Edit(targetSectionId, e.target.value)}
                rows={12}
                className="w-full p-3 text-sm font-serif border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50/20 leading-relaxed"
                placeholder="Type as Dr. Elena Vance..."
              />
            </div>

            <p className="text-xs text-stone-500 italic bg-stone-50 p-2.5 rounded border border-stone-200">
              💡 <strong>Instant Convergence:</strong> Type anywhere in this box. Changes are transmitted via WebSocket as binary Yjs delta updates and appear on Marcus&apos;s screen immediately.
            </p>
          </div>
        </div>

        {/* PANEL 2: PROF. MARCUS CHEN (Editor) */}
        <div className="flex flex-col bg-white overflow-hidden">
          {/* Panel 2 Header */}
          <div className="px-4 py-2.5 bg-emerald-50/80 border-b border-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={author2.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover border-2 border-emerald-500"
              />
              <div>
                <span className="font-semibold text-xs text-emerald-950">{author2.name}</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-semibold uppercase">
                  {author2.role}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{status2}</span>
            </div>
          </div>

          {/* Panel 2 Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="relative">
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                {docState2?.sections[0]?.title || 'Introduction'}
              </label>

              {/* Show collaborator 1's cursor tag */}
              {cursor1InPane2 && (
                <div className="mb-2 px-2 py-1 bg-purple-100 text-purple-900 text-xs rounded border border-purple-300 flex items-center space-x-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span><strong>{cursor1InPane2.name}</strong> is typing here...</span>
                </div>
              )}

              <textarea
                value={docState2?.sections[0]?.content || ''}
                onChange={(e) => handlePane2Edit(targetSectionId, e.target.value)}
                rows={12}
                className="w-full p-3 text-sm font-serif border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20 leading-relaxed"
                placeholder="Type as Prof. Marcus Chen..."
              />
            </div>

            <p className="text-xs text-stone-500 italic bg-stone-50 p-2.5 rounded border border-stone-200">
              💡 <strong>Simultaneous Editing:</strong> Try typing simultaneously in both boxes at different paragraphs or even the same sentence without collisions!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
