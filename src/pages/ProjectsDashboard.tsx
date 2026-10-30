import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Users,
  HardDrive,
  Calendar,
  Clock,
  ArrowRight,
  Download,
  Share2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Archive,
  Layers,
  Shield,
  UserCheck,
  AlertCircle,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { ResearchDocument, DocumentRole, Collaborator } from '../lib/types';
import { generateDocxBlob } from '../lib/docx-export';

interface ProjectsDashboardProps {
  documents: ResearchDocument[];
  currentDocId: string;
  onSelectDoc: (docId: string) => void;
  onOpenEditor: () => void;
  onCreateNewDoc: (docType: 'journal' | 'conference' | 'lit_review' | 'technical_report', title: string) => void;
  onOpenDriveModal: (doc: ResearchDocument) => void;
  onOpenDriveLiteratureModal?: (doc: ResearchDocument) => void;
  onOpenShareModal: (doc: ResearchDocument) => void;
  onDeleteDocument?: (docId: string) => void;
  currentUser: Collaborator | null;
  platformType: 'admin' | 'member' | 'guest';
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  documents,
  currentDocId,
  onSelectDoc,
  onOpenEditor,
  onCreateNewDoc,
  onOpenDriveModal,
  onOpenDriveLiteratureModal,
  onOpenShareModal,
  onDeleteDocument,
  currentUser,
  platformType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDocType, setNewDocType] = useState<'journal' | 'conference' | 'lit_review' | 'technical_report'>('journal');
  const [docToDelete, setDocToDelete] = useState<ResearchDocument | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const isAdmin = platformType === 'admin';

  // All laboratory research manuscripts are shared across the lab
  const visibleDocs = documents;

  const filteredDocs = visibleDocs.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.authors.some((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || doc.docType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNewDoc(newDocType, newTitle.trim());
    setNewTitle('');
    setIsCreateModalOpen(false);
  };

  const handleExportDocx = async (doc: ResearchDocument) => {
    try {
      const blob = await generateDocxBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setExportError('Failed to export DOCX document. Please try again.');
      setTimeout(() => setExportError(null), 4000);
    }
  };

  const totalWords = documents.reduce(
    (acc, doc) =>
      acc +
      doc.sections.reduce(
        (a, s) => a + (s.content ? s.content.trim().split(/\s+/).filter(Boolean).length : 0),
        0
      ),
    0
  );

  return (
    <div className="min-h-full bg-stone-100/70 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Platform Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider">
              {isAdmin ? (
                <>
                  <span className="text-purple-700 font-bold flex items-center space-x-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Administrator Master Console</span>
                  </span>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-700 font-medium">Lab Governance</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Researcher Member Workspace</span>
                  </span>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-700 font-medium">Assigned Manuscripts</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              {isAdmin ? 'Laboratory Manuscripts Directorate' : 'My Research Manuscripts & Reviews'}
            </h1>
            <p className="text-xs text-stone-600 font-serif mt-0.5">
              {isAdmin
                ? 'Full administrative control over all laboratory papers, collaborator roles, and Google Drive publication archives.'
                : 'Manage your active writing assignments, track peer review suggestions, and collaborate in real time.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Research Manuscript</span>
              </button>
            )}

            {!isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Propose Manuscript</span>
              </button>
            )}
          </div>
        </div>

        {exportError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Metric Ribbons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500 block uppercase tracking-wider">
              {isAdmin ? 'All Lab Manuscripts' : 'Assigned Manuscripts'}
            </span>
            <p className="text-2xl font-mono font-bold text-stone-900 mt-1">{visibleDocs.length}</p>
            <span className="text-[11px] text-stone-400">
              {isAdmin ? `${documents.length} papers across lab` : 'Authorized by Administrator'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500 block uppercase tracking-wider">
              Total Corpus
            </span>
            <p className="text-2xl font-mono font-bold text-indigo-700 mt-1">
              {totalWords.toLocaleString()}
            </p>
            <span className="text-[11px] text-stone-400">
              Collaborative words written
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500 block uppercase tracking-wider">Active Citations</span>
            <p className="text-2xl font-mono font-bold text-emerald-700 mt-1">
              {visibleDocs.reduce((acc, d) => acc + d.references.length, 0)}
            </p>
            <span className="text-[11px] text-stone-400">Synchronized references</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-xs font-semibold text-stone-500 block uppercase tracking-wider">Research Team</span>
            <p className="text-2xl font-mono font-bold text-amber-700 mt-1">
              {new Set(visibleDocs.flatMap((d) => d.collaborators.map((c) => c.id))).size || 1}
            </p>
            <span className="text-[11px] text-stone-400">Collaborating civil engineers</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search manuscripts by title, keyword, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-stone-50/50"
            />
          </div>

          <div className="flex items-center space-x-1 text-xs">
            {(['all', 'journal', 'conference', 'lit_review', 'technical_report'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Manuscripts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc) => {
            const isCurrent = doc.id === currentDocId;
            const wordCount = doc.sections.reduce(
              (acc, s) => acc + (s.content ? s.content.trim().split(/\s+/).filter(Boolean).length : 0),
              0
            );

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl border transition-all p-6 flex flex-col justify-between shadow-2xs ${
                  isCurrent ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-mono font-semibold px-2 py-0.5 bg-stone-100 text-stone-700 rounded border border-stone-200">
                      {doc.docType.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-1.5 text-xs text-stone-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {new Date(doc.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Title & Abstract */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-stone-900 leading-snug line-clamp-2">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-stone-600 font-serif line-clamp-3 mt-1.5 leading-relaxed">
                      {doc.abstract || 'No abstract provided yet. Click Open Editor to begin writing.'}
                    </p>
                  </div>

                  {/* Authors & Keywords */}
                  <div className="text-xs text-stone-500 font-serif">
                    <span className="font-semibold text-stone-700">Authors: </span>
                    <span>{doc.authors.map(a => a.name).join(', ')}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {doc.keywords.slice(0, 4).map((kw, i) => (
                      <span key={i} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-sans border border-stone-200">
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Collaborators Avatar Strip */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <div className="flex items-center -space-x-1.5">
                      {doc.collaborators.map((c) => (
                        <img
                          key={c.id}
                          src={c.avatar}
                          alt={c.name}
                          className="w-6 h-6 rounded-full object-cover border-2 border-white"
                          title={`${c.name} (${c.role})`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[11px] text-stone-500">
                      {wordCount.toLocaleString()} words · {doc.sections.length} sections
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleExportDocx(doc)}
                      className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Download formatted Word DOCX"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {onOpenDriveLiteratureModal && (
                      <button
                        onClick={() => {
                          onSelectDoc(doc.id);
                          onOpenDriveLiteratureModal(doc);
                        }}
                        className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                        title="Open Google Drive literature folder for this research paper"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-medium">Drive PDFs</span>
                        {doc.literaturePdfs && doc.literaturePdfs.length > 0 && (
                          <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded-full font-mono text-[10px] font-bold">
                            {doc.literaturePdfs.length}
                          </span>
                        )}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onOpenShareModal(doc)}
                        className="p-2 text-stone-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="Manage Collaborator Permissions (Admin)"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && onDeleteDocument && (
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove / Delete Manuscript (Admin Only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onSelectDoc(doc.id);
                      onOpenEditor();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors ${
                      isAdmin ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    <span>Open Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {visibleDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                {isAdmin ? 'Ready to Launch Your First Research Manuscript' : 'No Manuscripts Assigned to Your Account'}
              </h3>
              <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed mt-1">
                {isAdmin
                  ? 'Your ResearchLab publication directorate is clean and ready for launch. Create your first academic paper to begin writing with real-time CRDT collaboration, scientific formulas, and Google Drive literature archiving.'
                  : 'All members can only see the research papers in which the laboratory administrator has added them as a collaborator. Please wait for Sunil Paudel (PI) to assign you to an active project.'}
              </p>
            </div>
            {isAdmin && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Research Manuscript</span>
                </button>
              </div>
            )}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <Search className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-base font-semibold text-stone-900">No manuscripts matching filter</h3>
            <p className="text-xs text-stone-500">Try adjusting your search query or document type filter.</p>
          </div>
        ) : null}
      </div>

      {/* New Manuscript Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900">
              {isAdmin ? 'Initialize New Research Manuscript' : 'Propose New Research Draft'}
            </h3>
            <p className="text-xs text-stone-500 font-serif">
              Initializes a synchronized collaborative workspace with academic sections, KaTeX notation, and bibliography manager.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Manuscript Title *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Seismic Fragility and Load-Deflection Analysis of Post-Tensioned Concrete Bridge Girders"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Civil Engineering Template & Format
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-stone-50 font-medium"
                >
                  <option value="journal">Peer-Reviewed Journal Manuscript (ASCE / Elsevier / ACI)</option>
                  <option value="conference">Civil Engineering Conference Proceeding (ASCE / ICE / IABSE)</option>
                  <option value="lit_review">Structural & Geotechnical State-of-the-Art Review</option>
                  <option value="technical_report">Field Investigation & Infrastructure Assessment Report</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Initialize Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Manuscript Confirmation Modal (Admin Only) */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Delete Research Manuscript
                </h3>
                <p className="text-xs text-stone-500">
                  This action is permanent and restricted to laboratory administrators.
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-500 tracking-wider">
                Target Manuscript to Delete
              </span>
              <p className="text-xs font-serif font-bold text-stone-900 leading-snug">
                {docToDelete.title}
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-stone-500">
                <span className="uppercase font-mono text-[10px] bg-stone-200/70 px-1.5 py-0.5 rounded">
                  {docToDelete.docType.replace('_', ' ')}
                </span>
                <span>•</span>
                <span>{docToDelete.sections.length} sections</span>
                <span>•</span>
                <span>{docToDelete.collaborators.length} collaborators</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete this paper? All section drafts, KaTeX equations, experimental figures, bibliography citations, and Google Drive folder associations will be removed from the system.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteDocument && docToDelete) {
                    onDeleteDocument(docToDelete.id);
                  }
                  setDocToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete Paper</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
