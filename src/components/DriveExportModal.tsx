import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Upload,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  FileCheck,
  FolderPlus,
  Loader2,
  Calendar,
} from 'lucide-react';
import { ResearchDocument, DriveExportRecord } from '../lib/types';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/firebase';
import { findOrCreateFolder, uploadManuscriptToDrive, listFolderFiles, DriveFileSummary } from '../lib/drive';
import { generateDocxBlob } from '../lib/docx-export';
import { User } from 'firebase/auth';

interface DriveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ResearchDocument;
  onRecordExport: (record: DriveExportRecord) => void;
}

export const DriveExportModal: React.FC<DriveExportModalProps> = ({
  isOpen,
  onClose,
  document,
  onRecordExport,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'docx' | 'pdf'>('docx');
  const [folderName, setFolderName] = useState('CollabScholar - Research Manuscripts');
  const [versionLabel, setVersionLabel] = useState(
    `v${document.versions[0]?.versionNumber || '1.0'}`
  );
  const [recentExports, setRecentExports] = useState<DriveFileSummary[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Initialize Auth
  useEffect(() => {
    if (!isOpen) return;
    const unsub = initAuth(
      (user) => {
        setCurrentUser(user);
        loadFolderContents();
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsub();
  }, [isOpen]);

  const loadFolderContents = async () => {
    try {
      setIsLoadingFiles(true);
      const folder = await findOrCreateFolder(folderName);
      const files = await listFolderFiles(folder.folderId);
      setRecentExports(files);
    } catch (e) {
      console.warn('Could not list drive files:', e);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        loadFolderContents();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with Google Drive.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleExport = async () => {
    if (!isConfirmed) {
      setErrorMsg('Please review and confirm the export parameters before proceeding.');
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);

    try {
      setExportStep('Locating or creating Google Drive project folder...');
      const folder = await findOrCreateFolder(folderName);

      setExportStep('Generating formatted academic manuscript...');
      const docxBlob = await generateDocxBlob(document);

      // Safe versioned filename prevents accidental overwrite
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
      const sanitizedTitle = document.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const fileName = `${sanitizedTitle}_${versionLabel}_${dateStr}.${exportFormat}`;

      setExportStep(`Uploading "${fileName}" to Google Drive...`);
      const uploadRes = await uploadManuscriptToDrive(
        fileName,
        docxBlob,
        folder.folderId,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      setExportStep('Finalizing export record and synchronizing audit log...');

      const exportRecord: DriveExportRecord = {
        fileId: uploadRes.fileId,
        fileName,
        driveUrl: uploadRes.webViewLink,
        exportedAt: new Date().toISOString(),
        versionLabel,
        fileType: exportFormat,
        folderName,
      };

      onRecordExport(exportRecord);
      loadFolderContents();
      setExportStep('Completed successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during Google Drive export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Export Manuscript to Google Drive</h3>
              <p className="text-xs text-stone-500">Archive publication-ready snapshot in your designated project folder</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* User Sign-In Banner */}
          {!currentUser ? (
            <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 text-center space-y-3">
              <HardDrive className="w-10 h-10 text-emerald-600 mx-auto" />
              <div>
                <h4 className="font-semibold text-stone-900 text-sm">Connect Google Account</h4>
                <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
                  Sign in with Google to grant permission for saving paper snapshots and exported Word/PDF manuscripts directly into your Google Drive research folder.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="inline-flex items-center space-x-3 px-4 py-2 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 shadow-xs text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Authenticated User Status */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <img
                    src={currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-semibold text-xs text-stone-900">{currentUser.displayName || currentUser.email}</span>
                    <p className="text-[11px] text-emerald-800">Connected to Google Drive with permission</p>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="text-xs text-stone-500 hover:text-stone-700 underline"
                >
                  Sign Out
                </button>
              </div>

              {/* Export Configuration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Destination Folder
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Version Tag / Milestone
                  </label>
                  <input
                    type="text"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    placeholder="e.g. v1.1"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Explicit User Confirmation Dialog (MANDATORY per Workspace guidelines) */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-stone-700 leading-relaxed">
                    <p className="font-semibold text-stone-900 mb-0.5">User Confirmation Required</p>
                    <p>
                      This will compile the current canonical live state of <strong>&ldquo;{document.title}&rdquo;</strong> and upload a new publication file into Google Drive folder <strong>&ldquo;{folderName}&rdquo;</strong>.
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Existing previous snapshots will remain preserved without being overwritten.
                    </p>
                  </div>
                </div>
                <label className="flex items-center space-x-2 pt-1 text-xs text-stone-800 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>I confirm and authorize uploading this manuscript snapshot to Google Drive.</span>
                </label>
              </div>

              {/* Status or Progress */}
              {isExporting && (
                <div className="p-3 bg-stone-100 rounded-lg flex items-center space-x-3 text-xs text-stone-700">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                  <span className="font-mono">{exportStep}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={!isConfirmed || isExporting}
                  className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Exporting...' : 'Export Snapshot to Drive'}</span>
                </button>
              </div>

              {/* Previously Exported Snapshots List */}
              <div className="pt-4 border-t border-stone-200">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5 flex items-center justify-between">
                  <span>Exported Manuscripts in Project Folder</span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {recentExports.length} files found
                  </span>
                </h4>

                {isLoadingFiles ? (
                  <div className="py-4 text-center text-xs text-stone-400">Loading folder contents...</div>
                ) : recentExports.length === 0 ? (
                  <div className="py-3 text-center text-xs text-stone-400 border border-dashed rounded-lg">
                    No exported manuscripts in this folder yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {recentExports.map((file) => (
                      <div
                        key={file.id}
                        className="p-2 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs hover:bg-stone-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono truncate text-stone-800">{file.name}</span>
                        </div>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 shrink-0 font-medium"
                          >
                            <span>Open in Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
