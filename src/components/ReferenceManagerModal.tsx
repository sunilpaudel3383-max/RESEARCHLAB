import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Upload,
  Download,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit2,
  FileText,
  Search,
  HardDrive,
} from 'lucide-react';
import { ReferenceItem } from '../lib/types';
import {
  parseBibTeX,
  parseRIS,
  exportToBibTeX,
  formatReferenceText,
} from '../lib/citation-utils';

interface ReferenceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  references: ReferenceItem[];
  citationStyle: 'ieee' | 'apa' | 'nature' | 'chicago';
  onUpdateStyle: (style: 'ieee' | 'apa' | 'nature' | 'chicago') => void;
  onAddReference: (ref: ReferenceItem) => void;
  onUpdateReference: (ref: ReferenceItem) => void;
  onDeleteReference: (refId: string) => void;
  onInsertCitation?: (citationKey: string, index: number) => void;
  onOpenAttachPdf?: (ref: ReferenceItem, index: number) => void;
}

export const ReferenceManagerModal: React.FC<ReferenceManagerModalProps> = ({
  isOpen,
  onClose,
  references,
  citationStyle,
  onUpdateStyle,
  onAddReference,
  onUpdateReference,
  onDeleteReference,
  onInsertCitation,
  onOpenAttachPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'import' | 'manual' | 'export'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [importText, setImportText] = useState('');
  const [importType, setImportType] = useState<'bibtex' | 'ris'>('bibtex');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Manual Form State
  const [editingRef, setEditingRef] = useState<ReferenceItem | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthors, setManualAuthors] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualJournal, setManualJournal] = useState('');
  const [manualVolume, setManualVolume] = useState('');
  const [manualIssue, setManualIssue] = useState('');
  const [manualPages, setManualPages] = useState('');
  const [manualDoi, setManualDoi] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');

  if (!isOpen) return null;

  const filteredReferences = references.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCitation = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartEdit = (ref: ReferenceItem) => {
    setEditingRef(ref);
    setManualTitle(ref.title);
    setManualAuthors(ref.authors.join(', '));
    setManualYear(ref.year ? String(ref.year) : '');
    setManualJournal(ref.journal || ref.booktitle || '');
    setManualVolume(ref.volume || '');
    setManualIssue(ref.issue || '');
    setManualPages(ref.pages || '');
    setManualDoi(ref.doi || '');
    setManualUrl(ref.url || '');
    setManualKey(ref.key);
    setActiveTab('manual');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const authors = manualAuthors
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const yearNum = manualYear ? parseInt(manualYear, 10) : undefined;
    const key = manualKey.trim() || ((authors[0]?.split(' ').pop()?.toLowerCase() || 'ref') + (yearNum || ''));

    const missing: string[] = [];
    if (!yearNum) missing.push('Year');
    if (!manualJournal.trim()) missing.push('Venue / Journal');
    if (!manualDoi.trim() && !manualUrl.trim()) missing.push('DOI / URL');

    const item: ReferenceItem = {
      id: editingRef ? editingRef.id : `ref-${Date.now()}`,
      key,
      title: manualTitle.trim(),
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      year: yearNum,
      journal: manualJournal.trim() || undefined,
      volume: manualVolume.trim() || undefined,
      issue: manualIssue.trim() || undefined,
      pages: manualPages.trim() || undefined,
      doi: manualDoi.trim() || undefined,
      url: manualUrl.trim() || undefined,
      isIncomplete: missing.length > 0,
      missingFields: missing.length > 0 ? missing : undefined,
    };

    if (editingRef) {
      onUpdateReference(item);
    } else {
      onAddReference(item);
    }

    setEditingRef(null);
    setActiveTab('list');
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;

    let items: ReferenceItem[] = [];
    if (importType === 'bibtex') {
      items = parseBibTeX(importText);
    } else {
      items = parseRIS(importText);
    }

    for (const item of items) {
      onAddReference(item);
    }

    setImportText('');
    setActiveTab('list');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
        if (file.name.endsWith('.ris')) {
          setImportType('ris');
        } else {
          setImportType('bibtex');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 flex items-center space-x-2">
                <span>Academic Bibliography & Citation Manager</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-mono">
                  {references.length} refs
                </span>
              </h3>
              <p className="text-xs text-stone-500">IEEE, APA, Nature, Chicago formatting & BibTeX/RIS synchronization</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Style & Navigation Bar */}
        <div className="px-6 py-2.5 bg-stone-100/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-stone-200/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => { setActiveTab('list'); setEditingRef(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'list' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              References ({references.length})
            </button>
            <button
              onClick={() => { setActiveTab('import'); setEditingRef(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${
                activeTab === 'import' ? 'bg-white text-indigo-700 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import BibTeX / RIS</span>
            </button>
            <button
              onClick={() => {
                setEditingRef(null);
                setManualTitle('');
                setManualAuthors('');
                setManualYear('');
                setManualJournal('');
                setManualVolume('');
                setManualIssue('');
                setManualPages('');
                setManualDoi('');
                setManualUrl('');
                setManualKey('');
                setActiveTab('manual');
              }}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${
                activeTab === 'manual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingRef ? 'Edit Entry' : 'Manual Entry'}</span>
            </button>
            <button
              onClick={() => { setActiveTab('export'); setEditingRef(null); }}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${
                activeTab === 'export' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export BibTeX</span>
            </button>
          </div>

          {/* Citation Style Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-stone-500 font-medium">Citation Style:</span>
            <select
              value={citationStyle}
              onChange={(e) => onUpdateStyle(e.target.value as any)}
              className="bg-white border border-stone-300 rounded-md px-2.5 py-1 text-xs font-semibold text-stone-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ieee">IEEE [1] (Numbered)</option>
              <option value="apa">APA 7th (Author, Year)</option>
              <option value="nature">Nature 1. (Numbered superscript)</option>
              <option value="chicago">Chicago (Notes & Bib)</option>
            </select>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: LIST */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search references by title, author, or BibTeX key..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-stone-50/50"
                />
              </div>

              {filteredReferences.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-xl">
                  <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-stone-600">No references found</p>
                  <p className="text-xs text-stone-400 mt-1">Import from a BibTeX / RIS file or add references manually.</p>
                  <button
                    onClick={() => setActiveTab('import')}
                    className="mt-3 px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 font-medium rounded-md hover:bg-indigo-100"
                  >
                    Import BibTeX
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReferences.map((ref, idx) => {
                    const formatted = formatReferenceText(ref, citationStyle, idx + 1);
                    return (
                      <div
                        key={ref.id}
                        className={`p-4 rounded-xl border transition-all ${
                          ref.isIncomplete
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {/* Key and Badges */}
                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-700 font-mono text-xs rounded border border-stone-200 font-medium">
                                [{idx + 1}] {ref.key}
                              </span>
                              {ref.year && (
                                <span className="text-xs text-stone-500 font-medium">
                                  ({ref.year})
                                </span>
                              )}
                              {ref.isIncomplete && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded font-medium">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Incomplete: Missing {ref.missingFields?.join(', ')}</span>
                                </span>
                              )}
                            </div>

                            {/* Formatted Citation Text */}
                            <p className="text-sm text-stone-800 font-serif leading-relaxed">
                              {formatted}
                            </p>

                            {/* DOI & Links */}
                            <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-stone-500">
                              {ref.doi && (
                                <a
                                  href={`https://doi.org/${ref.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 font-mono"
                                >
                                  <span>doi:{ref.doi}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {ref.url && !ref.doi && (
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 truncate max-w-xs"
                                >
                                  <span>{ref.url}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {/* Google Drive Literature PDF */}
                            <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs">
                              {ref.pdfAttachment ? (
                                <div className="flex items-center space-x-2">
                                  <a
                                    href={ref.pdfAttachment.driveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-medium transition-colors shadow-2xs"
                                  >
                                    <HardDrive className="w-3 h-3 text-emerald-600" />
                                    <span>📄 PDF in Drive ({ref.pdfAttachment.fileSize || 'PDF'})</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                  </a>
                                  <span className="text-[11px] text-stone-500">
                                    by {ref.pdfAttachment.uploadedBy}
                                  </span>
                                  {onOpenAttachPdf && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenAttachPdf(ref, idx + 1)}
                                      className="text-stone-400 hover:text-stone-700 underline text-[11px]"
                                    >
                                      Replace
                                    </button>
                                  )}
                                </div>
                              ) : onOpenAttachPdf ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenAttachPdf(ref, idx + 1)}
                                  className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                >
                                  <HardDrive className="w-3 h-3 text-indigo-500" />
                                  <span>+ Attach Cited PDF to Google Drive</span>
                                </button>
                              ) : null}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1.5">
                            {onInsertCitation && (
                              <button
                                onClick={() => onInsertCitation(ref.key, idx + 1)}
                                className="px-2 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded transition-colors"
                                title="Insert in-text citation at cursor"
                              >
                                Cite [{idx + 1}]
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyCitation(`[${idx + 1}]`, ref.key)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                              title="Copy in-text citation"
                            >
                              {copiedKey === ref.key ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleStartEdit(ref)}
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                              title="Edit Reference"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteReference(ref.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Reference"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-stone-500">
                  <span>Format:</span>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === 'bibtex'}
                      onChange={() => setImportType('bibtex')}
                    />
                    <span>BibTeX (.bib)</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer ml-3">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === 'ris'}
                      onChange={() => setImportType('ris')}
                    />
                    <span>RIS / EndNote (.ris)</span>
                  </label>
                </div>

                <label className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer flex items-center space-x-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File (.bib / .ris)</span>
                  <input type="file" accept=".bib,.ris,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={12}
                placeholder={
                  importType === 'bibtex'
                    ? `@article{vaswani2017attention,\n  author = {Vaswani, Ashish and Shazeer, Noam},\n  title = {Attention is All you Need},\n  journal = {NeurIPS},\n  year = {2017}\n}`
                    : `TY  - JOUR\nTI  - Deep Residual Learning for Image Recognition\nAU  - He, Kaiming\nPY  - 2016\nJF  - CVPR\nER  -`
                }
                className="w-full px-4 py-3 text-xs font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-stone-900 text-stone-100"
              />

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setImportText(''); setActiveTab('list'); }}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={!importText.trim()}
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium shadow-xs"
                >
                  Import {importType.toUpperCase()} References
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4 max-w-2xl">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Article or Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Attention Is All You Need"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Authors (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualAuthors}
                    onChange={(e) => setManualAuthors(e.target.value)}
                    placeholder="e.g. A. Vaswani, N. Shazeer, N. Parmar"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                    placeholder="e.g. 2017"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Journal / Conference / Book Title
                </label>
                <input
                  type="text"
                  value={manualJournal}
                  onChange={(e) => setManualJournal(e.target.value)}
                  placeholder="e.g. Advances in Neural Information Processing Systems (NeurIPS)"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Volume</label>
                  <input
                    type="text"
                    value={manualVolume}
                    onChange={(e) => setManualVolume(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Issue / No.</label>
                  <input
                    type="text"
                    value={manualIssue}
                    onChange={(e) => setManualIssue(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Pages</label>
                  <input
                    type="text"
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value)}
                    placeholder="e.g. 5998-6008"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">DOI</label>
                  <input
                    type="text"
                    value={manualDoi}
                    onChange={(e) => setManualDoi(e.target.value)}
                    placeholder="e.g. 10.1038/nature14539"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">BibTeX Citation Key</label>
                  <input
                    type="text"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    placeholder="e.g. vaswani2017attention"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setEditingRef(null); setActiveTab('list'); }}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
                >
                  {editingRef ? 'Update Reference' : 'Add Reference'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-600">
                  Full BibTeX export of all {references.length} references in this paper.
                </p>
                <button
                  onClick={() => {
                    const bib = exportToBibTeX(references);
                    const blob = new Blob([bib], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'manuscript_references.bib';
                    a.click();
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .bib</span>
                </button>
              </div>

              <textarea
                readOnly
                value={exportToBibTeX(references)}
                rows={14}
                className="w-full px-4 py-3 text-xs font-mono border border-stone-300 rounded-xl bg-stone-900 text-stone-100 select-all"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
