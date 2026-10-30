import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import {
  FileText,
  User,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Eye,
  Sliders,
  Columns,
  Square,
  AlignLeft,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import {
  ResearchDocument,
  DocumentSection,
  DocumentRole,
  CollaboratorCursor,
  PaperEquation,
  PaperFigure,
  PaperTable,
  ReferenceItem,
} from '../lib/types';
import { formatReferenceText } from '../lib/citation-utils';

interface DocumentCanvasProps {
  document: ResearchDocument;
  userRole: DocumentRole;
  currentUserId: string;
  activeSectionId: string;
  collaboratorCursors: Record<string, CollaboratorCursor>;
  layoutMode: 'single' | 'two-column';
  fontFamily: 'serif' | 'sans';
  fontSize: '10' | '11' | '12';
  lineSpacing: '1.15' | '1.5' | '2.0';
  highlightedText: string;
  onUpdateSectionContent: (sectionId: string, content: string) => void;
  onUpdateMetadata: (updates: Partial<ResearchDocument>) => void;
  onCursorMove: (sectionId: string, cursorIndex: number, selection?: { start: number; end: number }) => void;
  onTextSelect: (selectedText: string, sectionId: string) => void;
  onOpenEquationModal: (sectionId: string, eq?: PaperEquation) => void;
  onOpenFigureModal: (sectionId: string) => void;
  onOpenTableModal: (sectionId: string) => void;
  onOpenReferenceManager: () => void;
  onOpenAttachPdf?: (ref: ReferenceItem, citationIndex: number) => void;
  onDeleteEquation: (sectionId: string, eqId: string) => void;
  onDeleteFigure: (sectionId: string, figId: string) => void;
  onDeleteTable: (sectionId: string, tblId: string) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  document,
  userRole,
  currentUserId,
  activeSectionId,
  collaboratorCursors,
  layoutMode,
  fontFamily,
  fontSize,
  lineSpacing,
  highlightedText,
  onUpdateSectionContent,
  onUpdateMetadata,
  onCursorMove,
  onTextSelect,
  onOpenEquationModal,
  onOpenFigureModal,
  onOpenTableModal,
  onOpenReferenceManager,
  onOpenAttachPdf,
  onDeleteEquation,
  onDeleteFigure,
  onDeleteTable,
}) => {
  const isReadOnly = userRole === 'viewer';
  const isReviewer = userRole === 'reviewer';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll when activeSectionId changes
  useEffect(() => {
    if (activeSectionId && sectionRefs.current[activeSectionId]) {
      sectionRefs.current[activeSectionId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeSectionId]);

  // Handle text selection in editor
  const handleMouseUp = (sectionId: string) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text) {
        onTextSelect(text, sectionId);
      }
    }
  };

  const getFontFamilyClass = () => {
    return fontFamily === 'serif' ? 'font-serif' : 'font-sans';
  };

  const getFontSizeClass = () => {
    if (fontSize === '10') return 'text-[13px] leading-relaxed';
    if (fontSize === '12') return 'text-[16px] leading-relaxed';
    return 'text-[14.5px] leading-relaxed';
  };

  const getLineSpacingClass = () => {
    if (lineSpacing === '1.15') return 'leading-normal';
    if (lineSpacing === '2.0') return 'leading-loose';
    return 'leading-relaxed';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-200/70 p-6 flex justify-center">
      {/* Simulated Academic Paper Page */}
      <div
        className={`w-full max-w-[850px] min-h-[1100px] bg-white shadow-xl rounded-md border border-stone-300/80 p-12 md:p-16 transition-all duration-200 relative ${getFontFamilyClass()}`}
      >
        {/* Read-Only Banner if Viewer */}
        {isReadOnly && (
          <div className="mb-6 p-3 bg-stone-100 rounded-lg border border-stone-300 flex items-center space-x-2 text-xs text-stone-700 font-sans">
            <Eye className="w-4 h-4 text-stone-500 shrink-0" />
            <span>
              <strong>Read-Only Mode:</strong> You are viewing this manuscript with Viewer permissions. Editing tools are disabled.
            </span>
          </div>
        )}

        {/* Reviewer Suggestion Mode Banner */}
        {isReviewer && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center space-x-2 text-xs text-blue-900 font-sans">
            <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Reviewer Mode:</strong> Highlight any text to add comments or submit peer review revision suggestions.
            </span>
          </div>
        )}

        {/* HEADER SECTION: Title, Authors, Abstract, Keywords */}
        <div id="sec-header" ref={(el) => { sectionRefs.current['sec-header'] = el; }} className="space-y-6 mb-10">
          {/* Paper Title */}
          <div className="text-center">
            {canEdit ? (
              <textarea
                value={document.title}
                onChange={(e) => onUpdateMetadata({ title: e.target.value })}
                rows={2}
                className="w-full text-center text-2xl md:text-3xl font-bold text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-indigo-500 focus:outline-hidden transition-colors resize-none leading-tight"
                placeholder="Enter Academic Paper Title..."
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
                {document.title}
              </h1>
            )}
          </div>

          {/* Authors List & Affiliations */}
          <div className="text-center space-y-1">
            <div className="flex flex-wrap items-center justify-center gap-x-2 text-sm font-semibold text-stone-800">
              {document.authors.map((auth, idx) => (
                <span key={auth.id} className="inline-flex items-center">
                  <span>{auth.name}</span>
                  {auth.isCorresponding && <sup className="text-indigo-600 font-bold ml-0.5">*</sup>}
                  {idx < document.authors.length - 1 && <span className="ml-2 text-stone-400">,</span>}
                </span>
              ))}
            </div>

            <div className="text-xs text-stone-500 italic max-w-xl mx-auto">
              {Array.from(new Set(document.authors.map(a => a.affiliation))).join(' • ')}
            </div>

            {document.authors.some(a => a.isCorresponding) && (
              <div className="text-[11px] text-stone-400 font-sans mt-1">
                *Corresponding Author email: {document.authors.find(a => a.isCorresponding)?.email}
              </div>
            )}
          </div>

          {/* Abstract Block */}
          <div className="p-4 bg-stone-50/70 rounded-lg border border-stone-200 text-justify">
            <span className="font-bold text-xs uppercase tracking-wider text-stone-900 font-sans mr-2">
              Abstract—
            </span>
            {canEdit ? (
              <textarea
                value={document.abstract}
                onChange={(e) => onUpdateMetadata({ abstract: e.target.value })}
                rows={4}
                className="w-full text-xs italic text-stone-800 bg-transparent border-0 focus:ring-0 focus:outline-hidden resize-none leading-relaxed mt-1"
                placeholder="Provide a comprehensive academic abstract summarizing background, methodology, and experimental findings..."
              />
            ) : (
              <span className="text-xs italic text-stone-800 leading-relaxed">
                {document.abstract}
              </span>
            )}
          </div>

          {/* Keywords */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="font-bold uppercase tracking-wider text-stone-700 font-sans mr-1">
              Index Terms—
            </span>
            {document.keywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-sans text-[11px] border border-stone-200">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* MAIN BODY SECTIONS */}
        <div
          className={`space-y-8 ${
            layoutMode === 'two-column' ? 'columns-1 md:columns-2 gap-8 [column-rule:1px_solid_#e7e5e4]' : ''
          }`}
        >
          {document.sections.map((section) => {
            if (section.type === 'references') {
              return null; // Handled in dedicated references section at end
            }

            // Find collaborator cursors active in this section
            const activeCursors = Object.values(collaboratorCursors).filter(
              c => c.sectionId === section.id && c.userId !== currentUserId
            );

            return (
              <div
                key={section.id}
                id={section.id}
                ref={(el) => { sectionRefs.current[section.id] = el; }}
                className="relative break-inside-avoid space-y-3 group"
                onMouseUp={() => handleMouseUp(section.id)}
              >
                {/* Active Collaborator Cursors Badge */}
                {activeCursors.length > 0 && (
                  <div className="absolute -top-3 right-0 flex items-center space-x-1.5 z-10 animate-pulse">
                    {activeCursors.map(c => (
                      <span
                        key={c.userId}
                        className="px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold text-white shadow-xs flex items-center space-x-1"
                        style={{ backgroundColor: c.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>{c.name} editing</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Section Heading */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-1 pt-2">
                  <h2 className="text-base font-bold text-stone-900 tracking-wide uppercase font-serif">
                    {section.title}
                  </h2>

                  {/* Section Insert Actions */}
                  {canEdit && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity text-xs font-sans">
                      <button
                        onClick={() => onOpenEquationModal(section.id)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 rounded text-[11px] font-medium transition-colors"
                        title="Insert numbered equation"
                      >
                        + Eq
                      </button>
                      <button
                        onClick={() => onOpenFigureModal(section.id)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 rounded text-[11px] font-medium transition-colors"
                        title="Insert figure chart"
                      >
                        + Fig
                      </button>
                      <button
                        onClick={() => onOpenTableModal(section.id)}
                        className="px-2 py-0.5 bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 rounded text-[11px] font-medium transition-colors"
                        title="Insert table"
                      >
                        + Tbl
                      </button>
                    </div>
                  )}
                </div>

                {/* Section Content Area */}
                <div className="relative">
                  {canEdit ? (
                    <textarea
                      value={section.content}
                      onChange={(e) => onUpdateSectionContent(section.id, e.target.value)}
                      onSelect={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        onCursorMove(section.id, target.selectionStart, {
                          start: target.selectionStart,
                          end: target.selectionEnd,
                        });
                      }}
                      onKeyUp={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        onCursorMove(section.id, target.selectionStart);
                      }}
                      onClick={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        onCursorMove(section.id, target.selectionStart);
                      }}
                      rows={Math.max(4, Math.ceil((section.content?.length || 100) / 75))}
                      className={`w-full text-stone-800 text-justify bg-transparent border-0 focus:ring-1 focus:ring-indigo-400 rounded p-1 resize-y ${getFontSizeClass()} ${getLineSpacingClass()}`}
                      placeholder={`Draft ${section.title.toLowerCase()} content here...`}
                    />
                  ) : (
                    <div
                      className={`text-stone-800 text-justify whitespace-pre-wrap ${getFontSizeClass()} ${getLineSpacingClass()}`}
                    >
                      {section.content}
                    </div>
                  )}
                </div>

                {/* Embedded Numbered Equations */}
                {section.equations && section.equations.length > 0 && (
                  <div className="space-y-3 my-4">
                    {section.equations.map((eq) => (
                      <div
                        key={eq.id}
                        className="group/eq relative p-3 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between overflow-x-auto"
                      >
                        <div
                          className="flex-1 py-1 px-4 text-center text-stone-900"
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(eq.latex, {
                              displayMode: true,
                              throwOnError: false,
                            }),
                          }}
                        />
                        <span className="font-serif font-bold text-stone-700 text-sm pl-4 shrink-0">
                          ({eq.number})
                        </span>

                        {canEdit && (
                          <div className="opacity-0 group-hover/eq:opacity-100 absolute top-1 right-1 flex items-center space-x-1 bg-white p-0.5 rounded shadow-xs border border-stone-200">
                            <button
                              onClick={() => onOpenEquationModal(section.id, eq)}
                              className="p-1 text-stone-400 hover:text-indigo-600 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteEquation(section.id, eq.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Embedded Figures */}
                {section.figures && section.figures.length > 0 && (
                  <div className="space-y-4 my-4">
                    {section.figures.map((fig) => (
                      <div
                        key={fig.id}
                        className="group/fig relative border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                      >
                        <img
                          src={fig.imageUrl}
                          alt={fig.caption}
                          className="w-full max-h-72 object-cover"
                        />
                        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
                          <p className="text-xs text-stone-800 font-serif leading-snug">
                            <strong className="font-sans font-bold text-stone-900">
                              Figure {fig.number}.
                            </strong>{' '}
                            {fig.caption}
                          </p>
                        </div>

                        {canEdit && (
                          <button
                            onClick={() => onDeleteFigure(section.id, fig.id)}
                            className="opacity-0 group-hover/fig:opacity-100 absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-600 rounded-lg shadow-xs transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Embedded Tables */}
                {section.tables && section.tables.length > 0 && (
                  <div className="space-y-4 my-4 overflow-x-auto">
                    {section.tables.map((tbl) => (
                      <div
                        key={tbl.id}
                        className="group/tbl relative border border-stone-300 rounded-lg overflow-hidden bg-white"
                      >
                        {/* Table Caption (Centered above table in standard IEEE format) */}
                        <div className="p-2.5 text-center bg-stone-50 border-b border-stone-200">
                          <p className="text-xs font-serif uppercase tracking-wider font-bold text-stone-900">
                            TABLE {tbl.number}: {tbl.caption}
                          </p>
                        </div>

                        <table className="w-full text-xs text-left">
                          <thead className="bg-stone-100 border-b border-stone-300 font-semibold text-stone-800">
                            <tr>
                              {tbl.headers.map((h, i) => (
                                <th key={i} className="p-2 border-r border-stone-200 last:border-r-0 text-center">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tbl.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-stone-200 last:border-b-0 hover:bg-stone-50/60">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-2 border-r border-stone-200 last:border-r-0 text-center text-stone-700">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {canEdit && (
                          <button
                            onClick={() => onDeleteTable(section.id, tbl.id)}
                            className="opacity-0 group-hover/tbl:opacity-100 absolute top-2 right-2 p-1 text-stone-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* REFERENCES & BIBLIOGRAPHY SECTION */}
        <div id="sec-references" className="mt-12 pt-6 border-t border-stone-300 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900 tracking-wide uppercase font-serif">
              References ({document.references.length})
            </h2>
            <button
              onClick={onOpenReferenceManager}
              className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-semibold rounded-md transition-colors"
            >
              Manage References
            </button>
          </div>

          {document.references.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No references added yet.</p>
          ) : (
            <div className="space-y-3 text-xs font-serif leading-relaxed text-stone-800">
              {document.references.map((ref, idx) => {
                const formatted = formatReferenceText(ref, document.citationStyle, idx + 1);
                return (
                  <div key={ref.id} className="p-2.5 rounded-lg border border-stone-200/80 bg-stone-50/40 hover:bg-white hover:border-stone-300 transition-colors">
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-stone-500 shrink-0 font-semibold">
                        [{idx + 1}]
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <p>
                          {formatted}
                          {ref.doi && (
                            <a
                              href={`https://doi.org/${ref.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline ml-1 font-mono text-[11px]"
                            >
                              https://doi.org/{ref.doi}
                            </a>
                          )}
                        </p>

                        {/* Google Drive PDF Repository Link or Attach Action */}
                        <div className="flex items-center flex-wrap gap-2 pt-1 font-sans text-[11px]">
                          {ref.pdfAttachment ? (
                            <div className="flex items-center space-x-2">
                              <a
                                href={ref.pdfAttachment.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-medium transition-colors shadow-2xs"
                                title="Open full-text manuscript PDF stored in Google Drive"
                              >
                                <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                                <span>📄 PDF in Drive ({ref.pdfAttachment.fileSize || 'PDF'})</span>
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                              </a>
                              <span className="text-stone-400">·</span>
                              <span className="text-stone-500">
                                Uploaded by {ref.pdfAttachment.uploadedBy}
                              </span>
                              {onOpenAttachPdf && (
                                <button
                                  type="button"
                                  onClick={() => onOpenAttachPdf(ref, idx + 1)}
                                  className="text-stone-400 hover:text-stone-700 underline text-[10px] ml-1"
                                >
                                  Replace
                                </button>
                              )}
                            </div>
                          ) : onOpenAttachPdf ? (
                            <button
                              type="button"
                              onClick={() => onOpenAttachPdf(ref, idx + 1)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white hover:bg-stone-50 text-indigo-700 border border-stone-200 hover:border-indigo-300 rounded-md font-medium transition-colors shadow-2xs group"
                              title="Store and pile up the full-text cited PDF in the lab's Google Drive"
                            >
                              <HardDrive className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-105 transition-transform" />
                              <span>+ Attach Cited PDF to Drive</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
