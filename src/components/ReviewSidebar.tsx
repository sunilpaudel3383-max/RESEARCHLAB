import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  AtSign,
  RotateCcw,
  Check,
  Ban,
  UserCheck,
  CornerDownRight,
  Filter,
} from 'lucide-react';
import {
  DocumentComment,
  DocumentSuggestion,
  Collaborator,
  DocumentRole,
} from '../lib/types';

interface ReviewSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  comments: DocumentComment[];
  suggestions: DocumentSuggestion[];
  collaborators: Collaborator[];
  currentUserId: string;
  userRole: DocumentRole;
  selectedText: string;
  activeSectionId: string;
  onAddComment: (content: string, selectedText?: string, sectionId?: string) => void;
  onReplyComment: (commentId: string, content: string) => void;
  onResolveComment: (commentId: string, resolved: boolean) => void;
  onAddSuggestion: (originalText: string, suggestedText: string, sectionId: string) => void;
  onResolveSuggestion: (suggestionId: string, status: 'accepted' | 'rejected') => void;
}

export const ReviewSidebar: React.FC<ReviewSidebarProps> = ({
  isOpen,
  onClose,
  comments,
  suggestions,
  collaborators,
  currentUserId,
  userRole,
  selectedText,
  activeSectionId,
  onAddComment,
  onReplyComment,
  onResolveComment,
  onAddSuggestion,
  onResolveSuggestion,
}) => {
  const [tab, setTab] = useState<'comments' | 'suggestions'>('comments');
  const [filterResolved, setFilterResolved] = useState(false);

  // New Comment State
  const [newCommentText, setNewCommentText] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // New Suggestion State
  const [isSuggestingNew, setIsSuggestingNew] = useState(false);
  const [suggestedReplacement, setSuggestedReplacement] = useState('');

  if (!isOpen) return null;

  const canAcceptReject = userRole === 'owner' || userRole === 'editor';

  const filteredComments = comments.filter(c => filterResolved ? true : !c.resolved);
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim(), selectedText || undefined, activeSectionId);
    setNewCommentText('');
  };

  const handleSendReply = (commentId: string) => {
    const text = replyInputs[commentId];
    if (!text || !text.trim()) return;
    onReplyComment(commentId, text.trim());
    setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
  };

  const handleMentionInsert = (name: string, isReplyForId?: string) => {
    const mention = `@${name.split(' ')[0]} `;
    if (isReplyForId) {
      setReplyInputs(prev => ({
        ...prev,
        [isReplyForId]: (prev[isReplyForId] || '') + mention
      }));
    } else {
      setNewCommentText(prev => prev + mention);
    }
  };

  const handleCreateSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedText.trim() || !suggestedReplacement.trim()) return;
    onAddSuggestion(selectedText.trim(), suggestedReplacement.trim(), activeSectionId);
    setSuggestedReplacement('');
    setIsSuggestingNew(false);
  };

  return (
    <aside className="w-84 bg-white border-l border-stone-200 flex flex-col h-full shadow-lg z-20 shrink-0">
      {/* Top Header */}
      <div className="px-4 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
        <div className="flex items-center space-x-1 bg-stone-200/80 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setTab('comments')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1.5 ${
              tab === 'comments' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Comments ({comments.filter(c => !c.resolved).length})</span>
          </button>
          <button
            onClick={() => setTab('suggestions')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1.5 ${
              tab === 'suggestions' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Suggestions ({pendingSuggestions.length})</span>
          </button>
        </div>

        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded hover:bg-stone-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* COMMENTS TAB */}
      {tab === 'comments' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* New Comment Creator Box */}
          <div className="p-3.5 border-b border-stone-200 bg-blue-50/30">
            {selectedText && (
              <div className="mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200/60 text-xs">
                <span className="text-[10px] uppercase font-semibold text-amber-800 tracking-wider block">
                  Anchored Selection
                </span>
                <p className="text-stone-800 italic line-clamp-2 mt-0.5 font-serif">
                  &ldquo;{selectedText}&rdquo;
                </p>
              </div>
            )}

            <form onSubmit={handleCreateComment} className="space-y-2">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={2}
                placeholder="Start discussion thread... Use @name to mention"
                className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />

              <div className="flex items-center justify-between">
                {/* Mention Quick Tags */}
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {collaborators.slice(0, 3).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleMentionInsert(c.name)}
                      className="px-1.5 py-0.5 text-[10px] bg-stone-100 hover:bg-blue-100 hover:text-blue-700 rounded text-stone-600 font-medium transition-colors"
                    >
                      @{c.name.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="px-3.5 py-1.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>{filteredComments.length} active threads</span>
            <label className="flex items-center space-x-1.5 cursor-pointer text-[11px]">
              <input
                type="checkbox"
                checked={filterResolved}
                onChange={(e) => setFilterResolved(e.target.checked)}
                className="rounded border-stone-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Resolved</span>
            </label>
          </div>

          {/* Comment Threads List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {filteredComments.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-1 text-stone-300" />
                No comments in this filter. Highlight any text in the paper to discuss.
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-xl border transition-all ${
                    comment.resolved
                      ? 'bg-stone-50 border-stone-200 opacity-60'
                      : 'bg-white border-stone-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  {/* Anchor quote */}
                  {comment.selectedText && (
                    <div className="mb-2 p-1.5 bg-amber-50/70 border-l-2 border-amber-400 rounded-r text-[11px] text-stone-700 italic font-serif">
                      &ldquo;{comment.selectedText}&rdquo;
                    </div>
                  )}

                  {/* Comment Author & Content */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <img
                        src={comment.author.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-semibold text-xs text-stone-900">{comment.author.name}</span>
                        <span className="text-[10px] text-stone-400 ml-1.5">
                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onResolveComment(comment.id, !comment.resolved)}
                      className={`text-[11px] font-medium flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors ${
                        comment.resolved
                          ? 'text-amber-700 hover:bg-amber-100'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={comment.resolved ? 'Reopen thread' : 'Mark as resolved'}
                    >
                      {comment.resolved ? <RotateCcw className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span>{comment.resolved ? 'Reopen' : 'Resolve'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-stone-800 mt-1.5 leading-relaxed">
                    {comment.content}
                  </p>

                  {/* Thread Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 space-y-2 pl-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="text-xs space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-stone-900 text-[11px]">{reply.author.name}:</span>
                            <span className="text-[9px] text-stone-400">
                              {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-stone-700 text-[11px] pl-1">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {!comment.resolved && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center space-x-1.5">
                      <input
                        type="text"
                        placeholder="Reply..."
                        value={replyInputs[comment.id] || ''}
                        onChange={(e) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendReply(comment.id);
                          }
                        }}
                        className="flex-1 px-2.5 py-1 text-xs border border-stone-200 rounded-md bg-stone-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSendReply(comment.id)}
                        disabled={!replyInputs[comment.id]?.trim()}
                        className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-30"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUGGESTIONS TAB (Tracked Changes) */}
      {tab === 'suggestions' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* New Suggestion Creator */}
          <div className="p-3.5 border-b border-stone-200 bg-amber-50/30">
            {selectedText ? (
              <form onSubmit={handleCreateSuggestion} className="space-y-2">
                <div className="p-2 bg-rose-50 rounded border border-rose-200 text-xs">
                  <span className="text-[10px] font-semibold text-rose-800 uppercase block">Selected Text to Replace:</span>
                  <p className="line-through text-stone-700 text-xs mt-0.5 italic">
                    &ldquo;{selectedText}&rdquo;
                  </p>
                </div>

                <textarea
                  value={suggestedReplacement}
                  onChange={(e) => setSuggestedReplacement(e.target.value)}
                  rows={2}
                  placeholder="Type suggested revision..."
                  className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold shadow-xs"
                  >
                    Submit Tracked Suggestion
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-stone-500 italic">
                Highlight text in any section to submit a revision suggestion without overwriting the original manuscript.
              </p>
            )}
          </div>

          {/* Suggestions List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                No active suggestions. Highlight text to propose revisions.
              </div>
            ) : (
              suggestions.map((sug) => {
                const isPending = sug.status === 'pending';

                return (
                  <div
                    key={sug.id}
                    className={`p-3 rounded-xl border transition-all ${
                      sug.status === 'accepted'
                        ? 'bg-emerald-50/50 border-emerald-200 opacity-70'
                        : sug.status === 'rejected'
                        ? 'bg-rose-50/50 border-rose-200 opacity-60'
                        : 'bg-white border-stone-200 hover:border-amber-300 shadow-2xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <img
                          src={sug.author.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50'}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-semibold text-xs text-stone-900">{sug.author.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        sug.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        sug.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {sug.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Diff Preview */}
                    <div className="space-y-1.5 text-xs font-serif leading-relaxed">
                      {sug.originalText && (
                        <div className="p-1.5 bg-rose-50/80 rounded border-l-2 border-rose-400 text-rose-900 line-through">
                          {sug.originalText}
                        </div>
                      )}
                      <div className="p-1.5 bg-emerald-50/80 rounded border-l-2 border-emerald-400 text-emerald-950 font-medium">
                        {sug.suggestedText}
                      </div>
                    </div>

                    {/* Accept / Reject actions */}
                    {isPending && canAcceptReject && (
                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onResolveSuggestion(sug.id, 'rejected')}
                          className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md font-medium flex items-center space-x-1"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => onResolveSuggestion(sug.id, 'accepted')}
                          className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium flex items-center space-x-1 shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept & Apply</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
