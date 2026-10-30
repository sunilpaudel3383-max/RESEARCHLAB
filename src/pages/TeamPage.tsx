import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  Edit3,
  MessageSquare,
  Eye,
  Trash2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { Collaborator, DocumentRole, AuditLogEntry } from '../lib/types';

interface TeamPageProps {
  collaborators: Collaborator[];
  auditLog: AuditLogEntry[];
  currentUserRole: DocumentRole;
  currentUserId: string;
  platformType: 'admin' | 'member' | 'guest';
  onUpdateRole: (userId: string, newRole: DocumentRole) => void;
  onRevokeAccess: (userId: string) => void;
  onTransferOwnership: (newOwnerId: string) => void;
  onAddCollaborator: (collab: Collaborator) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({
  collaborators,
  auditLog,
  currentUserRole,
  currentUserId,
  platformType,
  onUpdateRole,
  onRevokeAccess,
  onTransferOwnership,
  onAddCollaborator,
}) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<DocumentRole>('editor');

  const isAdmin = platformType === 'admin';

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
    const newCollab: Collaborator = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=100&auto=format&fit=crop&q=80`,
      role: newRole,
      color: colors[collaborators.length % colors.length],
      isOnline: false,
    };

    onAddCollaborator(newCollab);
    setNewName('');
    setNewEmail('');
    setIsInviteOpen(false);
  };

  return (
    <div className="min-h-full bg-stone-100/70 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-stone-500 uppercase tracking-wider">
              <span>Laboratory Governance</span>
              <span>/</span>
              <span className="text-stone-900 font-semibold">{collaborators.length} Authorized Researchers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              {isAdmin ? 'Research Team & Access Control Matrix' : 'Laboratory Research Members Directory'}
            </h1>
            <p className="text-xs text-stone-600 font-serif mt-0.5">
              {isAdmin
                ? 'Assign roles, revoke authorizations, transfer ownership, and audit security events.'
                : 'Directory of lab investigators, postdoctoral reviewers, and collaborators.'}
            </p>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Authorize New Researcher</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-stone-200/80 rounded-lg text-xs text-stone-600 flex items-center space-x-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Role Management Managed by PI</span>
            </div>
          )}
        </div>

        {/* Member View Information Notice */}
        {!isAdmin && (
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-start space-x-3 text-xs text-stone-700">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900">Member Read-Only Directory View</p>
              <p className="text-stone-500 mt-0.5">
                Your account is authenticated as a Researcher Member. To request permission changes or invite external co-authors to a paper, contact the laboratory Principal Investigator.
              </p>
            </div>
          </div>
        )}

        {/* Collaborators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collaborators.map((c) => {
            const isMe = c.id === currentUserId;

            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-12 h-12 rounded-full object-cover border-2"
                      style={{ borderColor: c.color }}
                    />
                    {c.isOnline ? (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    ) : (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-stone-300 border-2 border-white rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-semibold text-sm text-stone-900 truncate">{c.name}</h4>
                      {isMe && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 truncate font-mono">{c.email}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-stone-400 mt-0.5">
                      <span>{c.isOnline ? 'Online in workspace' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                {/* Role Badge or Selector */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isAdmin && !isMe ? (
                    <div className="flex items-center space-x-1">
                      <select
                        value={c.role}
                        onChange={(e) => onUpdateRole(c.id, e.target.value as DocumentRole)}
                        className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg bg-stone-50 font-medium text-stone-800"
                      >
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => onRevokeAccess(c.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Revoke Access (Terminates Live Session)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase font-mono ${
                      c.role === 'owner' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      c.role === 'editor' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      c.role === 'reviewer' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {c.role}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Audit Trail (Admin only or summary for members) */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Security & Document Operation Audit Trail
              </h3>
              <p className="text-xs text-stone-500 font-serif">
                Immutable chronological log of document creations, permissions changes, and external Google Drive exports.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">{auditLog.length} events logged</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {auditLog.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start justify-between text-xs"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 bg-stone-200 rounded text-stone-700 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-900">{log.action}</span>
                      <span className="text-[10px] font-mono text-stone-500">
                        by {log.actorName} ({log.actorRole})
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-stone-600 mt-0.5 text-[11px]">{log.details}</p>
                    )}
                  </div>
                </div>
                <span className="text-stone-400 font-mono text-[10px] shrink-0">
                  {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900">Authorize New Lab Researcher</h3>
            <p className="text-xs text-stone-500 font-serif">
              Grants authorized access to participate in simultaneous real-time writing and peer review.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jennifer Doudna"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. j.doudna@berkeley.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as DocumentRole)}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-stone-50 font-medium"
                >
                  <option value="editor">Editor (Can directly modify manuscript)</option>
                  <option value="reviewer">Reviewer (Can suggest tracked changes & comment)</option>
                  <option value="viewer">Viewer (Read-only observer)</option>
                </select>
              </div>

              <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-200 text-[11px] text-stone-600 space-y-0.5">
                <span className="font-semibold text-stone-800 flex items-center space-x-1">
                  <span>Initial Access Password:</span>
                  <code className="px-1.5 py-0.5 bg-white border rounded text-purple-700 font-mono font-bold">member123</code>
                </span>
                <p className="text-[10px] text-stone-500">
                  The member can change this on their 1st login. After successive logins, password changes are permanently locked.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Authorize Researcher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
