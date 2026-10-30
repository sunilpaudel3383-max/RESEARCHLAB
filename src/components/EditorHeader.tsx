import React, { useState } from 'react';
import {
  Users,
  HardDrive,
  Download,
  History,
  Share2,
  Columns,
  Square,
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Sigma,
  Image as ImageIcon,
  Table as TableIcon,
  Quote,
  Sliders,
  Sparkles,
  SplitSquareVertical,
  ChevronDown,
  Printer,
  FileDown,
} from 'lucide-react';
import { Collaborator, DocumentRole, ResearchDocument } from '../lib/types';
import { ConnectionState } from '../lib/collab-client';
import { RESEARCH_PERSONAS } from '../lib/mock-data';

interface EditorHeaderProps {
  document: ResearchDocument;
  currentUserId: string;
  currentUserRole: DocumentRole;
  connectionState: ConnectionState;
  collaborators: Collaborator[];
  isSaving: boolean;
  isSplitView: boolean;
  layoutMode: 'single' | 'two-column';
  fontFamily: 'serif' | 'sans';
  fontSize: '10' | '11' | '12';
  lineSpacing: '1.15' | '1.5' | '2.0';
  onToggleSplitView: () => void;
  onToggleLayoutMode: () => void;
  onSetFontFamily: (font: 'serif' | 'sans') => void;
  onSetFontSize: (size: '10' | '11' | '12') => void;
  onSetLineSpacing: (spacing: '1.15' | '1.5' | '2.0') => void;
  onSwitchPersona: (persona: Collaborator) => void;
  onOpenShareModal: () => void;
  onOpenVersionModal: () => void;
  onOpenReferenceModal: () => void;
  onOpenDriveModal: () => void;
  onOpenDriveLiteratureModal?: () => void;
  onOpenEquationModal: () => void;
  onOpenFigureModal: () => void;
  onOpenTableModal: () => void;
  onToggleFindReplace: () => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  document,
  currentUserId,
  currentUserRole,
  connectionState,
  collaborators,
  isSaving,
  isSplitView,
  layoutMode,
  fontFamily,
  fontSize,
  lineSpacing,
  onToggleSplitView,
  onToggleLayoutMode,
  onSetFontFamily,
  onSetFontSize,
  onSetLineSpacing,
  onSwitchPersona,
  onOpenShareModal,
  onOpenVersionModal,
  onOpenReferenceModal,
  onOpenDriveModal,
  onOpenDriveLiteratureModal,
  onOpenEquationModal,
  onOpenFigureModal,
  onOpenTableModal,
  onToggleFindReplace,
  onExportDocx,
  onExportPdf,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTypographyMenu, setShowTypographyMenu] = useState(false);

  const currentPersona =
    RESEARCH_PERSONAS.find((p) => p.id === currentUserId) || {
      id: currentUserId,
      name: 'Dr. Elena Vance',
      role: currentUserRole,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      color: '#8b5cf6',
      email: 'e.vance@mit.edu',
      isOnline: true,
    };

  // Stats calculation
  const totalWords = document.sections.reduce(
    (acc, s) => acc + (s.content ? s.content.trim().split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const totalChars = document.sections.reduce(
    (acc, s) => acc + (s.content ? s.content.length : 0),
    0
  );

  return (
    <header className="bg-white border-b border-stone-200 select-none shrink-0 z-30">
      {/* Top Bar: Title, Connection Status, Collaborators, Actions */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-stone-100 gap-4">
        {/* Left: Branding & Document Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs font-serif">
              CE
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xs text-stone-900 truncate max-w-[260px] md:max-w-md">
                  {document.title}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded font-medium">
                  {document.docType}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-stone-400">
                {/* Autosave Status Indicator */}
                <span className="flex items-center space-x-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{isSaving ? 'Syncing...' : 'Saved to Cloud'}</span>
                </span>
                <span>•</span>
                {/* WebSocket Real-time Connection State */}
                <span className="flex items-center space-x-1 font-mono">
                  {connectionState === 'connected' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-stone-600">Live CRDT Sync</span>
                    </>
                  ) : connectionState === 'reconnecting' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin" />
                      <span className="text-amber-700">Reconnecting...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-rose-600">Offline (Buffered)</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active Collaborators, Persona Switcher, Split Screen, Export, Drive, Share */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Active Collaborators Avatars */}
          <div className="flex items-center -space-x-1.5 mr-1" title="Connected Collaborators">
            {collaborators.map((c) => (
              <div key={c.id} className="relative group">
                <img
                  src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                  alt={c.name}
                  className="w-7 h-7 rounded-full object-cover border-2 transition-transform hover:scale-110 hover:z-10"
                  style={{ borderColor: c.color }}
                />
                <span className="opacity-0 group-hover:opacity-100 absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-stone-900 text-white text-[10px] rounded whitespace-nowrap z-50 pointer-events-none transition-opacity">
                  {c.name} ({c.role})
                </span>
              </div>
            ))}
          </div>

          {/* Persona Switcher Dropdown (Allows easy test of multiple researchers) */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 text-stone-800 transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentPersona.color }}
              />
              <span className="truncate max-w-[110px]">{currentPersona.name.split(' ')[0]}</span>
              <span className="text-[10px] uppercase text-stone-500 font-mono">({currentUserRole})</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-semibold uppercase text-stone-400 tracking-wider">
                  Switch Active Researcher Persona
                </div>
                {RESEARCH_PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSwitchPersona(p);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center space-x-2.5 hover:bg-stone-50 transition-colors ${
                      p.id === currentUserId ? 'bg-indigo-50/50 font-semibold' : ''
                    }`}
                  >
                    <img src={p.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <div className="flex-1 truncate">
                      <div className="text-stone-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-stone-400 capitalize">{p.role} • {p.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Split Screen Co-Author Test Toggle */}
          <button
            onClick={onToggleSplitView}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
              isSplitView
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
            }`}
            title="Open side-by-side simultaneous author test panes"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSplitView ? 'Dual View' : 'Simultaneous View'}</span>
          </button>

          {/* Version History Button */}
          <button
            onClick={onOpenVersionModal}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
            title="Version History & Recovery"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg flex items-center space-x-1 transition-colors border border-stone-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-50">
                <button
                  onClick={() => {
                    onExportDocx();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <FileDown className="w-4 h-4 text-indigo-600" />
                  <span>Export to Word (.docx)</span>
                </button>
                <button
                  onClick={() => {
                    onExportPdf();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-stone-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <Printer className="w-4 h-4 text-rose-600" />
                  <span>Print to PDF (Publication)</span>
                </button>
              </div>
            )}
          </div>

          {/* Google Drive Literature Repository Button */}
          {onOpenDriveLiteratureModal && (
            <button
              onClick={onOpenDriveLiteratureModal}
              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Open Google Drive literature folder for this research paper"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Literature Drive</span>
              {document.literaturePdfs && document.literaturePdfs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded-full font-mono text-[10px]">
                  {document.literaturePdfs.length}
                </span>
              )}
            </button>
          )}

          {/* Share & Permissions Button */}
          <button
            onClick={onOpenShareModal}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Rich-Text, Equations, Citations, Layout, Typography, Stats */}
      <div className="px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 bg-stone-50/60 text-xs">
        {/* Left Formatting Group */}
        <div className="flex items-center space-x-1 flex-wrap">
          <div className="flex items-center space-x-0.5 border-r border-stone-200 pr-2 mr-1">
            <button
              onClick={onOpenEquationModal}
              className="p-1.5 hover:bg-stone-200 rounded text-stone-700 flex items-center space-x-1 transition-colors"
              title="Insert LaTeX Equation (KaTeX)"
            >
              <Sigma className="w-3.5 h-3.5 text-indigo-700" />
              <span className="font-semibold text-xs text-indigo-900">Equation</span>
            </button>
            <button
              onClick={onOpenFigureModal}
              className="p-1.5 hover:bg-stone-200 rounded text-stone-700 flex items-center space-x-1 transition-colors"
              title="Insert Figure & Caption"
            >
              <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
              <span>Figure</span>
            </button>
            <button
              onClick={onOpenTableModal}
              className="p-1.5 hover:bg-stone-200 rounded text-stone-700 flex items-center space-x-1 transition-colors"
              title="Insert Data Table & Caption"
            >
              <TableIcon className="w-3.5 h-3.5 text-stone-600" />
              <span>Table</span>
            </button>
            <button
              onClick={onOpenReferenceModal}
              className="p-1.5 hover:bg-indigo-100 rounded text-indigo-800 flex items-center space-x-1 transition-colors font-medium"
              title="Manage Citations & Bibliography"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cite [{document.references.length}]</span>
            </button>
          </div>

          {/* Layout Mode (Single vs Two-Column Academic) */}
          <button
            onClick={onToggleLayoutMode}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 border transition-colors ${
              layoutMode === 'two-column'
                ? 'bg-white border-indigo-300 text-indigo-700 shadow-2xs'
                : 'border-transparent text-stone-600 hover:bg-stone-200'
            }`}
            title="Toggle Two-Column IEEE Journal vs Single-Column Standard Layout"
          >
            {layoutMode === 'two-column' ? <Columns className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span>{layoutMode === 'two-column' ? '2-Column IEEE' : '1-Column'}</span>
          </button>

          {/* Typography Settings Menu */}
          <div className="relative">
            <button
              onClick={() => setShowTypographyMenu(!showTypographyMenu)}
              className="px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 text-stone-600 hover:bg-stone-200"
              title="Typography & Margins"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Typography</span>
            </button>

            {showTypographyMenu && (
              <div className="absolute left-0 mt-1 w-52 bg-white border border-stone-200 rounded-xl shadow-xl p-3 z-50 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-stone-700 block mb-1">Font Family</span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => onSetFontFamily('serif')}
                      className={`px-2 py-1 rounded font-serif text-xs border ${
                        fontFamily === 'serif' ? 'bg-indigo-50 border-indigo-300 font-bold' : 'border-stone-200'
                      }`}
                    >
                      Academic Serif
                    </button>
                    <button
                      onClick={() => onSetFontFamily('sans')}
                      className={`px-2 py-1 rounded font-sans text-xs border ${
                        fontFamily === 'sans' ? 'bg-indigo-50 border-indigo-300 font-bold' : 'border-stone-200'
                      }`}
                    >
                      Clean Sans
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-stone-700 block mb-1">Line Spacing</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['1.15', '1.5', '2.0'] as const).map((sp) => (
                      <button
                        key={sp}
                        onClick={() => onSetLineSpacing(sp)}
                        className={`px-1 py-1 rounded text-center text-xs border ${
                          lineSpacing === sp ? 'bg-indigo-50 border-indigo-300 font-bold' : 'border-stone-200'
                        }`}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Find & Replace Trigger */}
          <button
            onClick={onToggleFindReplace}
            className="p-1.5 hover:bg-stone-200 rounded text-stone-600 transition-colors"
            title="Find and replace (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Stats Group */}
        <div className="flex items-center space-x-3 text-stone-500 font-mono text-[11px]">
          <span>{totalWords.toLocaleString()} words</span>
          <span>•</span>
          <span>{totalChars.toLocaleString()} characters</span>
          <span>•</span>
          <span className="text-indigo-600 uppercase font-semibold">{document.citationStyle} Style</span>
        </div>
      </div>
    </header>
  );
};
