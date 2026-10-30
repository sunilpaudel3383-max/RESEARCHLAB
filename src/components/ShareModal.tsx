import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Crown,
  Archive,
  Copy,
  Check,
  AlertCircle,
  Eye,
  MessageSquare,
  Edit3,
} from 'lucide-react';
import { Collaborator, DocumentRole } from '../lib/types';
import { RESEARCH_PERSONAS } from '../lib/mock-data';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: Collaborator[];
  currentUserId: string;
  currentUserRole: DocumentRole;
  isArchived: boolean;
  onUpdateRole: (userId: string, newRole: DocumentRole) => void;
  onRevokeAccess: (userId: string) => void;
  onTransferOwnership: (newOwnerId: string) => void;
  onToggleArchive: () => void;
  onAddCollaborator: (collab: Collaborator) => void;
  registeredMembers?: Collaborator[];
}

const ROLE_DESCRIPTIONS: Record<DocumentRole, { label: string; desc: string; icon: any; color: string }> = {
  owner: {
    label: 'Owner',
    desc: 'Full document control, manages permissions, can delete or archive paper.',
    icon: Crown,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  editor: {
    label: 'Editor',
    desc: 'Can write, edit text, insert equations, tables, figures, and manage references.',
    icon: Edit3,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  reviewer: {
    label: 'Reviewer',
    desc: 'Can add comments and make suggestions without directly changing manuscript text.',
    icon: MessageSquare,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  viewer: {
    label: 'Viewer',
    desc: 'Read-only access. Cannot edit, comment, or modify document.',
    icon: Eye,
    color: 'text-stone-600 bg-stone-100 border-stone-200',
  },
};

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  currentUserId,
  currentUserRole,
  isArchived,
  onUpdateRole,
  onRevokeAccess,
  onTransferOwnership,
  onToggleArchive,
  onAddCollaborator,
  registeredMembers = [],
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<DocumentRole>('editor');
  const [copiedLink, setCopiedLink] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = currentUserRole === 'owner';

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4'];
    const assignedColor = colors[collaborators.length % colors.length];

    const newCollab: Collaborator = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
      role: newRole,
      color: assignedColor,
      isOnline: false,
    };

    onAddCollaborator(newCollab);
    setNewEmail('');
    setNewName('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleConfirmTransfer = (targetId: string) => {
    onTransferOwnership(targetId);
    setTransferTargetId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Manage Research Collaborators & Roles</h3>
              <p className="text-xs text-stone-500">Enforce server-authoritative read, review, and edit privileges</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add Collaborator Form (Owners Only) */}
          {isOwner && (
            <form onSubmit={handleAddSubmit} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Invite New Researcher</span>
              </h4>

              <div className="grid grid-cols-5 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Dr. Alan Turing)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="col-span-2 px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <input
                  type="email"
                  required
                  placeholder="Institution Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="col-span-2 px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as DocumentRole)}
                  className="px-2 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="editor">Editor</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs"
                >
                  Add Collaborator
                </button>
              </div>

              {/* Quick Add Registered Lab Members */}
              {registeredMembers.filter((m) => !collaborators.some((c) => c.id === m.id || c.email.toLowerCase() === m.email.toLowerCase())).length > 0 && (
                <div className="pt-2.5 border-t border-stone-200">
                  <p className="text-[11px] font-semibold text-stone-600 mb-2">
                    Quick Assign Registered Lab Members (Members only see papers where admin adds them):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {registeredMembers.filter(
                      (p) => !collaborators.some((c) => c.id === p.id || c.email.toLowerCase() === p.email.toLowerCase())
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onAddCollaborator({
                            ...p,
                            role: p.role === 'owner' ? 'editor' : p.role,
                          });
                        }}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-indigo-50 text-stone-700 hover:text-indigo-700 border border-stone-200 hover:border-indigo-300 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                      >
                        <UserPlus className="w-3 h-3 text-indigo-500" />
                        <span>+ Add {p.name} ({p.role})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Current Collaborator List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Authorized Collaborators ({collaborators.length})
              </h4>
              <button
                onClick={handleCopyLink}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-medium"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link copied!' : 'Copy Document Link'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {collaborators.map((c) => {
                const RoleIcon = ROLE_DESCRIPTIONS[c.role].icon;
                const isMe = c.id === currentUserId;

                return (
                  <div
                    key={c.id}
                    className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border-2"
                          style={{ borderColor: c.color }}
                        />
                        {c.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs text-stone-900">{c.name}</span>
                          {isMe && (
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500">{c.email}</p>
                      </div>
                    </div>

                    {/* Actions & Role Select */}
                    <div className="flex items-center space-x-2">
                      {isOwner && !isMe ? (
                        <>
                          <select
                            value={c.role}
                            onChange={(e) => onUpdateRole(c.id, e.target.value as DocumentRole)}
                            className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg bg-stone-50 font-medium text-stone-800 focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="editor">Editor</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="viewer">Viewer</option>
                          </select>

                          {transferTargetId === c.id ? (
                            <div className="flex items-center space-x-1 bg-amber-50 p-1 rounded border border-amber-300">
                              <span className="text-[10px] text-amber-800">Transfer ownership?</span>
                              <button
                                onClick={() => handleConfirmTransfer(c.id)}
                                className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[10px]"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setTransferTargetId(null)}
                                className="text-[10px] text-stone-500 px-1"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setTransferTargetId(c.id)}
                              className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                              title="Transfer Ownership"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onRevokeAccess(c.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Revoke Access (Terminates Live Session)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${ROLE_DESCRIPTIONS[c.role].color}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{ROLE_DESCRIPTIONS[c.role].label}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Permission Guidance */}
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Role Capabilities
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded border border-stone-200">
                <span className="font-semibold text-emerald-700">Editor:</span>
                <p className="text-stone-600 text-[11px]">Directly writes, edits content, inserts equations/figures.</p>
              </div>
              <div className="p-2 bg-white rounded border border-stone-200">
                <span className="font-semibold text-blue-700">Reviewer:</span>
                <p className="text-stone-600 text-[11px]">Cannot overwrite text; submissions become trackable suggestions.</p>
              </div>
              <div className="p-2 bg-white rounded border border-stone-200">
                <span className="font-semibold text-stone-700">Viewer:</span>
                <p className="text-stone-600 text-[11px]">Read-only. Server drops all edit packets automatically.</p>
              </div>
              <div className="p-2 bg-white rounded border border-stone-200">
                <span className="font-semibold text-amber-700">Owner:</span>
                <p className="text-stone-600 text-[11px]">Can assign/revoke permissions, archive, and transfer control.</p>
              </div>
            </div>
          </div>

          {/* Archive / Project Actions */}
          {isOwner && (
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-semibold text-stone-800">Archive Research Paper</h5>
                <p className="text-[11px] text-stone-500">Lock the document against modifications when peer review concludes.</p>
              </div>
              <button
                onClick={onToggleArchive}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-colors ${
                  isArchived
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isArchived ? 'Unarchive Paper' : 'Archive Paper'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
