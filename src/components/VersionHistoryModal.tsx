import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Plus,
  GitCompare,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { VersionSnapshot, AuditLogEntry, ResearchDocument, DocumentRole } from '../lib/types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionSnapshot[];
  auditLog: AuditLogEntry[];
  currentDoc: ResearchDocument;
  userRole: DocumentRole;
  onCreateSnapshot: (versionNumber: string, label: string, summary: string) => void;
  onRestoreVersion: (versionId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  auditLog,
  currentDoc,
  userRole,
  onCreateSnapshot,
  onRestoreVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'versions' | 'audit' | 'new'>('versions');
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || ''
  );

  // New Snapshot Form
  const [newVersionNum, setNewVersionNum] = useState(
    `${(versions.length + 1).toFixed(1)}`
  );
  const [newLabel, setNewLabel] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedVersion = versions.find(v => v.id === selectedVersionId) || versions[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onCreateSnapshot(newVersionNum, newLabel.trim(), newSummary.trim() || 'Manual revision checkpoint');
    setNewLabel('');
    setNewSummary('');
    setActiveTab('versions');
  };

  const handleConfirmRestore = (versionId: string) => {
    onRestoreVersion(versionId);
    setRestoreConfirmId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-5xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 flex items-center space-x-2">
                <span>Document Version History & Recovery</span>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-mono">
                  {versions.length} revisions
                </span>
              </h3>
              <p className="text-xs text-stone-500">Non-destructive snapshots, side-by-side diffing, and audit trails</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-6 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-stone-200/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('versions')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'versions' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Revisions ({versions.length})
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${
                activeTab === 'new' ? 'bg-white text-amber-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Named Snapshot</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${
                activeTab === 'audit' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Log ({auditLog.length})</span>
            </button>
          </div>

          <div className="text-xs text-stone-500 font-mono">
            Current live state: {currentDoc.sections.reduce((a, s) => a + (s.content ? s.content.split(/\s+/).length : 0), 0)} words
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'versions' && (
            <>
              {/* Left Column: Version List */}
              <div className="w-80 border-r border-stone-200 overflow-y-auto bg-stone-50/50 p-3 space-y-2">
                {versions.length === 0 ? (
                  <div className="text-center py-10 text-stone-400 text-xs">
                    No snapshots recorded yet.
                  </div>
                ) : (
                  versions.map((ver) => {
                    const isSelected = ver.id === selectedVersion?.id;
                    return (
                      <button
                        key={ver.id}
                        onClick={() => setSelectedVersionId(ver.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-white border-amber-400 shadow-xs ring-1 ring-amber-400'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-stone-900 font-mono">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(ver.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-stone-800 line-clamp-1 mb-1">
                          {ver.label}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-stone-500">
                          <img
                            src={ver.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="truncate">{ver.authorName}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: Version Inspector & Diff */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
                {selectedVersion ? (
                  <div className="space-y-5">
                    {/* Version Top Bar */}
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono text-xs font-bold rounded">
                            Snapshot v{selectedVersion.versionNumber}
                          </span>
                          <h3 className="font-semibold text-stone-900 text-sm">{selectedVersion.label}</h3>
                        </div>
                        <p className="text-xs text-stone-600 mb-2">{selectedVersion.summary}</p>
                        <div className="flex items-center space-x-4 text-xs text-stone-500 font-mono">
                          <span>Author: {selectedVersion.authorName}</span>
                          <span>Timestamp: {new Date(selectedVersion.timestamp).toLocaleString()}</span>
                          {selectedVersion.data?.stats && (
                            <span>{selectedVersion.data.stats.words} words • {selectedVersion.data.stats.characters} chars</span>
                          )}
                        </div>
                      </div>

                      {/* Restore Action */}
                      {(userRole === 'owner' || userRole === 'editor') && (
                        <div>
                          {restoreConfirmId === selectedVersion.id ? (
                            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-rose-300 shadow-xs">
                              <span className="text-xs text-rose-700 font-medium">Confirm restore?</span>
                              <button
                                onClick={() => handleConfirmRestore(selectedVersion.id)}
                                className="px-2.5 py-1 text-xs bg-rose-600 text-white rounded hover:bg-rose-700 font-medium"
                              >
                                Yes, Restore
                              </button>
                              <button
                                onClick={() => setRestoreConfirmId(null)}
                                className="px-2 py-1 text-xs text-stone-500 hover:text-stone-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRestoreConfirmId(selectedVersion.id)}
                              className="px-3.5 py-2 text-xs bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore this Version</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Snapshot Abstract Comparison */}
                    <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-stone-500 tracking-wider flex items-center space-x-1.5">
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Snapshot Content Preview</span>
                      </h4>

                      <div>
                        <span className="text-xs font-semibold text-stone-700">Title:</span>
                        <p className="text-sm font-serif font-bold text-stone-900 mt-0.5">
                          {selectedVersion.data?.title || currentDoc.title}
                        </p>
                      </div>

                      {selectedVersion.data?.abstract && (
                        <div>
                          <span className="text-xs font-semibold text-stone-700">Abstract:</span>
                          <p className="text-xs font-serif italic text-stone-800 leading-relaxed mt-0.5 bg-stone-50 p-3 rounded-lg border border-stone-100">
                            {selectedVersion.data.abstract}
                          </p>
                        </div>
                      )}

                      {/* Sections snapshot summary */}
                      <div>
                        <span className="text-xs font-semibold text-stone-700">Sections in Snapshot:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {(selectedVersion.data?.sections || []).map((sec, idx) => (
                            <div key={idx} className="p-2 bg-stone-50 rounded border border-stone-200 text-xs">
                              <span className="font-semibold text-stone-800">{sec.title}</span>
                              <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                {sec.content ? `${sec.content.substring(0, 70)}...` : '(Empty section)'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
                    Select a version on the left to inspect
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB: CREATE NEW SNAPSHOT */}
          {activeTab === 'new' && (
            <div className="flex-1 p-8 max-w-xl mx-auto overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-base font-semibold text-stone-900">Create Milestone Snapshot</h4>
                <p className="text-xs text-stone-500 mt-1">
                  Freeze the current state of all sections, equations, references, and statistics into an immutable revision checkpoint.
                </p>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Version Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersionNum}
                    onChange={(e) => setNewVersionNum(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Revision Label / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Post-Peer Review Revision or Camera Ready v1.2"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Summary of Modifications
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe changes made since previous version..."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('versions')}
                    className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium shadow-xs"
                  >
                    Save Version Snapshot
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-stone-900">Document Activity & Security Audit Trail</h4>
                <p className="text-xs text-stone-500">Chronological ledger of document access, permission changes, version restorations, and external exports.</p>
              </div>

              <div className="space-y-2.5">
                {auditLog.map((log) => (
                  <div key={log.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-start justify-between text-xs">
                    <div className="flex items-start space-x-3">
                      <div className="p-1.5 bg-stone-200 rounded text-stone-700 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-stone-900">{log.action}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded font-mono">
                            {log.actorName} ({log.actorRole})
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-stone-600 mt-0.5">{log.details}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-stone-400 font-mono text-[10px] shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
