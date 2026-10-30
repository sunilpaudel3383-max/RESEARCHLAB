import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  Download,
  Search,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Edit2,
  Trash2,
  FileText,
  Filter,
  HardDrive,
  FolderSync,
} from 'lucide-react';
import { ReferenceItem } from '../lib/types';
import { formatReferenceText, exportToBibTeX } from '../lib/citation-utils';
import { getCitedLiteratureFolderUrl, CITED_LITERATURE_FOLDER } from '../lib/drive';

interface ReferencesPageProps {
  references: ReferenceItem[];
  citationStyle: 'ieee' | 'apa' | 'nature' | 'chicago';
  onUpdateStyle: (style: 'ieee' | 'apa' | 'nature' | 'chicago') => void;
  onOpenImportModal: () => void;
  onDeleteReference: (refId: string) => void;
  onOpenAttachPdf?: (ref: ReferenceItem, idx: number) => void;
  onOpenLiteratureDrive?: () => void;
  literatureCount?: number;
}

export const ReferencesPage: React.FC<ReferencesPageProps> = ({
  references,
  citationStyle,
  onUpdateStyle,
  onOpenImportModal,
  onDeleteReference,
  onOpenAttachPdf,
  onOpenLiteratureDrive,
  literatureCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pdfFilter, setPdfFilter] = useState<'all' | 'with-pdf' | 'missing-pdf'>('all');
  const [isOpeningFolder, setIsOpeningFolder] = useState(false);

  const filteredReferences = references.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.key.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (pdfFilter === 'with-pdf') return Boolean(r.pdfAttachment);
    if (pdfFilter === 'missing-pdf') return !r.pdfAttachment;

    return true;
  });

  const incompleteCount = references.filter(r => r.isIncomplete).length;
  const pdfAttachedCount = references.filter(r => r.pdfAttachment).length;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadBib = () => {
    const bib = exportToBibTeX(references);
    const blob = new Blob([bib], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = 'laboratory_bibliography.bib';
    a.click();
  };

  const handleOpenDriveFolder = async () => {
    setIsOpeningFolder(true);
    try {
      const url = await getCitedLiteratureFolderUrl();
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      const a = document.createElement('a');
      a.href = 'https://drive.google.com';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsOpeningFolder(false);
    }
  };

  return (
    <div className="min-h-full bg-stone-100/70 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-stone-500 uppercase tracking-wider">
              <span>Laboratory Bibliography</span>
              <span>/</span>
              <span className="text-stone-900 font-semibold">{references.length} Citations Cataloged</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Academic References & Citations Library
            </h1>
            <p className="text-xs text-stone-600 font-serif mt-0.5">
              Maintain standardized BibTeX/RIS references and format bibliographies across project manuscripts.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {onOpenLiteratureDrive && (
              <button
                onClick={onOpenLiteratureDrive}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Open Google Drive literature folder for this research project"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                <span>Literature Drive</span>
                {literatureCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded-full font-mono text-[10px] font-bold">
                    {literatureCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onOpenImportModal}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import BibTeX / RIS</span>
            </button>
            <button
              onClick={handleDownloadBib}
              className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .bib</span>
            </button>
          </div>
        </div>

        {/* Style & Search Ribbon */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter references by title, author, or BibTeX key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-stone-50/50"
            />
          </div>

          {/* Filter by PDF presence */}
          <div className="flex items-center space-x-1 bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setPdfFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pdfFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({references.length})
            </button>
            <button
              onClick={() => setPdfFilter('with-pdf')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 ${
                pdfFilter === 'with-pdf' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HardDrive className="w-3 h-3 text-emerald-600" />
              <span>Has Drive PDF ({pdfAttachedCount})</span>
            </button>
            <button
              onClick={() => setPdfFilter('missing-pdf')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pdfFilter === 'missing-pdf' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Missing PDF ({references.length - pdfAttachedCount})
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-stone-500 font-medium">Style:</span>
            <select
              value={citationStyle}
              onChange={(e) => onUpdateStyle(e.target.value as any)}
              className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg bg-stone-50 font-semibold text-stone-800"
            >
              <option value="ieee">IEEE [1] (Numbered)</option>
              <option value="apa">APA 7th (Author, Year)</option>
              <option value="nature">Nature 1. (Superscript)</option>
              <option value="chicago">Chicago (Notes & Bib)</option>
            </select>
          </div>
        </div>

        {/* Incomplete References Banner */}
        {incompleteCount > 0 && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Academic Data Integrity Alert:</strong> {incompleteCount} reference(s) are missing required metadata fields (DOI, year, or venue).
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-700">Flagged below</span>
          </div>
        )}

        {/* References List */}
        <div className="space-y-3">
          {filteredReferences.map((ref, idx) => {
            const formatted = formatReferenceText(ref, citationStyle, idx + 1);

            return (
              <div
                key={ref.id}
                className={`p-5 rounded-2xl border transition-all ${
                  ref.isIncomplete
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-stone-100 text-stone-800 rounded border border-stone-200">
                        [{idx + 1}] @{ref.key}
                      </span>
                      {ref.year && (
                        <span className="text-xs text-stone-500 font-mono">({ref.year})</span>
                      )}
                      {ref.isIncomplete && (
                        <span className="text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Incomplete metadata: missing {ref.missingFields?.join(', ')}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-serif text-stone-900 leading-relaxed">
                      {formatted}
                    </p>

                    <div className="flex items-center flex-wrap gap-4 text-xs text-stone-500 font-mono">
                      {ref.doi && (
                        <a
                          href={`https://doi.org/${ref.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center space-x-1"
                        >
                          <span>DOI: {ref.doi}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {ref.journal && <span>Journal: {ref.journal}</span>}
                      {ref.booktitle && <span>Venue: {ref.booktitle}</span>}
                    </div>

                    {/* Google Drive PDF Literature Attachment Status */}
                    <div className="pt-2 border-t border-stone-100 flex items-center flex-wrap gap-3">
                      {ref.pdfAttachment ? (
                        <div className="flex items-center flex-wrap gap-2 text-xs">
                          <a
                            href={ref.pdfAttachment.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-medium transition-colors shadow-2xs"
                          >
                            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                            <span>📄 Full-Text PDF in Drive ({ref.pdfAttachment.fileSize || 'PDF'})</span>
                            <ExternalLink className="w-3 h-3 text-emerald-600" />
                          </a>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-500 font-sans text-[11px]">
                            Added to Drive by {ref.pdfAttachment.uploadedBy}
                          </span>
                          {onOpenAttachPdf && (
                            <button
                              onClick={() => onOpenAttachPdf(ref, idx + 1)}
                              className="text-stone-400 hover:text-stone-700 underline text-xs ml-1"
                            >
                              Update / Replace PDF
                            </button>
                          )}
                        </div>
                      ) : (
                        onOpenAttachPdf && (
                          <button
                            onClick={() => onOpenAttachPdf(ref, idx + 1)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-stone-50 hover:bg-stone-100 text-indigo-700 border border-stone-200 hover:border-indigo-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                            <span>+ Attach Cited PDF to Google Drive</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleCopy(`[${idx + 1}]`, ref.key)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Copy in-text citation tag"
                    >
                      {copiedKey === ref.key ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onDeleteReference(ref.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete reference"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
