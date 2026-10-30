import React, { useState } from 'react';
import {
  FileText,
  ChevronRight,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  FolderKanban,
  FileCheck2,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DocumentSection, DocumentRole } from '../lib/types';

interface OutlineSidebarProps {
  sections: DocumentSection[];
  activeSectionId: string;
  userRole: DocumentRole;
  currentDocId: string;
  onSelectSection: (sectionId: string) => void;
  onReorderSections: (newSections: DocumentSection[]) => void;
  onAddSection: (title: string, type: 'standard' | 'appendix') => void;
  onDeleteSection: (sectionId: string) => void;
  onSelectDocument: (docId: string) => void;
  allDocs: Array<{ id: string; title: string; docType: string }>;
  onCreateNewDoc: () => void;
  onDeleteDocument?: (docId: string) => void;
}

export const OutlineSidebar: React.FC<OutlineSidebarProps> = ({
  sections,
  activeSectionId,
  userRole,
  currentDocId,
  onSelectSection,
  onReorderSections,
  onAddSection,
  onDeleteSection,
  onSelectDocument,
  allDocs,
  onCreateNewDoc,
  onDeleteDocument,
}) => {
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'standard' | 'appendix'>('standard');

  const canEditStructure = userRole === 'owner' || userRole === 'editor';
  const isOwner = userRole === 'owner';

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!canEditStructure) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    // Update order values
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    onReorderSections(newSections);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddSection(newTitle.trim(), newType);
    setNewTitle('');
    setIsAddingSection(false);
  };

  return (
    <aside className="w-72 bg-white border-r border-stone-200 flex flex-col h-full select-none shrink-0">
      {/* Project / Document Switcher */}
      <div className="p-3.5 border-b border-stone-200 bg-stone-50/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-stone-700">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate">Project Documents</span>
          </div>
          {canEditStructure && (
            <button
              onClick={onCreateNewDoc}
              className="p-1 hover:bg-stone-200 text-stone-600 rounded transition-colors"
              title="Create new research paper in project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <select
            value={currentDocId}
            onChange={(e) => onSelectDocument(e.target.value)}
            className="flex-1 min-w-0 text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 shadow-2xs truncate cursor-pointer"
          >
            {allDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title.length > 28 ? `${d.title.substring(0, 28)}...` : d.title} ({d.docType})
              </option>
            ))}
          </select>
          {isOwner && onDeleteDocument && (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Delete Active Manuscript (Admin Only)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Manuscript Section Outline Header */}
      <div className="px-3.5 py-2.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/40">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Paper Outline</span>
        </div>

        {canEditStructure && (
          <button
            onClick={() => setIsAddingSection(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>Add Section</span>
          </button>
        )}
      </div>

      {/* Add Section Form Inline */}
      {isAddingSection && (
        <form onSubmit={handleAddSubmit} className="p-3 bg-indigo-50/50 border-b border-indigo-100 space-y-2">
          <input
            type="text"
            required
            autoFocus
            placeholder="e.g. 2.1 Theoretical Framework"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2.5 py-1 text-xs border border-indigo-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex items-center justify-between">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="text-[11px] bg-white border border-indigo-200 rounded px-1.5 py-0.5 text-stone-700"
            >
              <option value="standard">Main Section</option>
              <option value="appendix">Appendix</option>
            </select>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="text-[11px] text-stone-500 hover:text-stone-700 px-1.5 py-0.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-[11px] bg-indigo-600 text-white px-2 py-0.5 rounded font-medium shadow-2xs hover:bg-indigo-700"
              >
                Insert
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Section List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Fixed Title / Abstract links */}
        <button
          onClick={() => onSelectSection('sec-header')}
          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeSectionId === 'sec-header'
              ? 'bg-indigo-50 text-indigo-900 font-semibold'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <span className="truncate">Title, Abstract & Keywords</span>
          <ChevronRight className="w-3 h-3 text-stone-400" />
        </button>

        {sections.map((section, idx) => {
          const isActive = activeSectionId === section.id;
          const wordCount = section.content ? section.content.trim().split(/\s+/).filter(Boolean).length : 0;

          return (
            <div
              key={section.id}
              className={`group rounded-lg border transition-all ${
                isActive
                  ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
                  : 'bg-white border-transparent hover:border-stone-200 hover:bg-stone-50/80'
              }`}
            >
              <div className="flex items-center justify-between p-1.5">
                <button
                  onClick={() => onSelectSection(section.id)}
                  className="flex-1 text-left flex items-start space-x-1.5 truncate"
                >
                  <FileText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <div className="truncate">
                    <span className={`text-xs block truncate ${isActive ? 'font-semibold text-indigo-950' : 'text-stone-700 font-medium'}`}>
                      {section.title}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {wordCount} words
                      {section.equations && section.equations.length > 0 && ` • ${section.equations.length} eq`}
                      {section.figures && section.figures.length > 0 && ` • ${section.figures.length} fig`}
                      {section.tables && section.tables.length > 0 && ` • ${section.tables.length} tbl`}
                    </span>
                  </div>
                </button>

                {/* Move & Delete Controls */}
                {canEditStructure && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 shrink-0 transition-opacity">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                      title="Move section up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded"
                      title="Move section down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    {isOwner && section.type !== 'references' && (
                      <button
                        onClick={() => onDeleteSection(section.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                        title="Delete section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Statistics */}
      <div className="p-3 border-t border-stone-200 bg-stone-50/50 text-[11px] text-stone-500 font-mono space-y-1">
        <div className="flex justify-between">
          <span>Total Sections:</span>
          <span className="font-semibold text-stone-700">{sections.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Est. Reading Time:</span>
          <span className="font-semibold text-stone-700">
            {Math.max(1, Math.round(sections.reduce((a, s) => a + (s.content ? s.content.split(/\s+/).length : 0), 0) / 220))} min
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-sm overflow-hidden p-5 space-y-3">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Delete Active Manuscript
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete this research paper? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDocument) {
                    onDeleteDocument(currentDocId);
                  }
                  setIsConfirmingDelete(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
