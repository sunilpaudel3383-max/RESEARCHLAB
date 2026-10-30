import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  HardDrive,
  Upload,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Plus,
  FolderPlus,
  ShieldAlert,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import {
  ResearchDocument,
  ResearchPaperDrivePdf,
  Collaborator,
  DocumentRole,
} from '../lib/types';
import {
  findOrCreateProjectResearchFolder,
  uploadResearchPdfToDrive,
  downloadDrivePdf,
  deleteResearchPdfFromDrive,
} from '../lib/drive';
import { googleSignIn, getAccessToken, logout as googleLogout, initAuth } from '../lib/firebase';
import { User } from 'firebase/auth';

interface ResearchDriveLiteratureModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ResearchDocument;
  currentUser: Collaborator | null;
  currentUserRole: DocumentRole;
  platformType: 'admin' | 'member' | 'guest';
  onUpdateDocument: (updated: Partial<ResearchDocument>) => void;
}

export const ResearchDriveLiteratureModal: React.FC<ResearchDriveLiteratureModalProps> = ({
  isOpen,
  onClose,
  document,
  currentUser,
  currentUserRole,
  platformType,
  onUpdateDocument,
}) => {
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isInitializingFolder, setIsInitializingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [citationKey, setCitationKey] = useState('');
  const [notes, setNotes] = useState('');

  // Delete Confirmation Modal State (MANDATORY per Workspace guidelines)
  const [deleteTarget, setDeleteTarget] = useState<ResearchPaperDrivePdf | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = platformType === 'admin' || currentUserRole === 'owner';
  const literatureList = document.literaturePdfs || [];

  // Check Drive Auth status on mount
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initAuth(
      (user, token) => {
        setDriveUser(user);
        setHasDriveToken(Boolean(token));
      },
      () => {
        setDriveUser(null);
        setHasDriveToken(false);
      }
    );

    getAccessToken().then((token) => {
      if (token) setHasDriveToken(true);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google Drive sign-in
  const handleGoogleConnect = async () => {
    setIsSigningIn(true);
    setUploadError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setDriveUser(res.user);
        setHasDriveToken(true);

        // If document doesn't have a folder yet, initialize it
        if (!document.driveFolderId) {
          await handleEnsureFolder();
        }
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setUploadError(err.message || 'Failed to authenticate with Google Drive.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Disconnect
  const handleGoogleDisconnect = async () => {
    try {
      await googleLogout();
      setDriveUser(null);
      setHasDriveToken(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Ensure Project Folder exists in Google Drive
  const handleEnsureFolder = async () => {
    setIsInitializingFolder(true);
    setUploadError(null);
    try {
      const folder = await findOrCreateProjectResearchFolder(document.title);
      onUpdateDocument({
        driveFolderId: folder.folderId,
        driveFolderUrl: folder.folderUrl,
        driveFolderName: folder.folderName,
      });
      return folder;
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      setUploadError(err.message || 'Could not create research folder in Google Drive.');
      return null;
    } finally {
      setIsInitializingFolder(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setUploadError('Only PDF research papers are supported.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  // Handle Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!hasDriveToken) {
      setUploadError('Please connect your Google Drive to upload literature PDFs.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      let folderId = document.driveFolderId;
      if (!folderId) {
        const folder = await handleEnsureFolder();
        if (!folder) throw new Error('Could not establish research folder in Google Drive.');
        folderId = folder.folderId;
      }

      const activeUploader: Collaborator = currentUser || {
        id: 'member-active',
        name: 'Research Collaborator',
        email: 'collaborator@researchlab.np',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        role: currentUserRole,
        color: '#10b981',
        isOnline: true,
      };

      const newRecord = await uploadResearchPdfToDrive(
        selectedFile,
        folderId,
        activeUploader,
        citationKey,
        notes
      );

      const updatedList = [newRecord, ...literatureList];
      onUpdateDocument({
        literaturePdfs: updatedList,
      });

      // Reset form
      setSelectedFile(null);
      setCitationKey('');
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload PDF to Google Drive research folder.');
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm and Execute Delete (Owner / Admin only)
  const executeDelete = async () => {
    if (!deleteTarget) return;

    // Strict Permission check: members cannot delete
    if (!isAdmin) {
      setDeleteError('Permission Denied: Research members are not permitted to delete literature PDFs.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteResearchPdfFromDrive(deleteTarget.id, currentUserRole, platformType as any);

      // Remove from document record
      const updatedList = literatureList.filter((p) => p.id !== deleteTarget.id);
      onUpdateDocument({ literaturePdfs: updatedList });

      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <HardDrive className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Project Literature Drive Repository
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Zero Hosting Storage
                </span>
              </div>
              <p className="text-xs text-stone-500 font-serif truncate max-w-md">
                Cloud PDF storage for: <strong>{document.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 1. Google Drive Connection Status Card */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    hasDriveToken ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500'
                  }`}
                />
                <span className="font-semibold text-stone-900">
                  {hasDriveToken
                    ? `Google Drive Connected ${driveUser?.email ? `(${driveUser.email})` : ''}`
                    : 'Google Drive Storage Not Linked'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed max-w-lg">
                {hasDriveToken
                  ? 'All research papers uploaded by group members are stored in your Google Drive folder, avoiding local web hosting storage limits.'
                  : 'Link your Google Drive so that you and group members can store, view, and download full-text research paper PDFs.'}
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-2">
              {!hasDriveToken ? (
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isSigningIn}
                  className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 shadow-2xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign In with Google</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="px-3 py-1.5 text-stone-500 hover:text-stone-800 text-[11px] font-medium border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* 2. Research Paper's Folder Details */}
          {hasDriveToken && (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-semibold text-stone-900 block">
                    {document.driveFolderName || `[Literature] ${document.title.slice(0, 45)}...`}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-mono">
                    Dedicated Google Drive Folder for this Research Paper
                  </span>
                </div>
              </div>

              {document.driveFolderUrl && (
                <a
                  href={document.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 flex items-center space-x-1 transition-colors"
                >
                  <span>Open Folder in Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* 3. Upload Research Paper PDF (For ALL Group Members) */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Add Research Paper PDF to Project Drive</span>
              </h4>
              <span className="text-[11px] text-stone-500">
                Any assigned group member can contribute
              </span>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* File picker */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select Research Paper PDF *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    required
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-stone-50/50 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-[11px] text-stone-500 mt-1">
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </p>
                  )}
                </div>

                {/* Optional citation key */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Link to Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={citationKey}
                    onChange={(e) => setCitationKey(e.target.value)}
                    placeholder="e.g. Terzaghi1943 or [1]"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Research Note / Brief Findings (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Contains experimental stress-strain benchmark values for 40 MPa concrete"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-stone-50/50"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading || !hasDriveToken}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload to Project Drive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 4. Literature PDFs Catalog in this Research Project */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                Literature PDFs in this Research ({literatureList.length})
              </h4>
              <div className="flex items-center space-x-1.5 text-[11px] text-stone-500">
                <Lock className="w-3 h-3 text-stone-400" />
                <span>Members can view & download · Deletion restricted to Admin</span>
              </div>
            </div>

            {literatureList.length === 0 ? (
              <div className="p-8 border border-dashed border-stone-300 rounded-2xl text-center space-y-2 bg-stone-50/50">
                <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-serif font-semibold text-stone-700 text-sm">
                  No literature PDFs uploaded yet
                </p>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                  Any member of this research paper can upload relevant literature PDFs above. Files will be saved directly into your Google Drive.
                </p>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {literatureList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-stone-900 truncate max-w-[260px] sm:max-w-md">
                            {item.fileName}
                          </span>
                          {item.citationKey && (
                            <span className="px-1.5 py-0.2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] rounded font-mono font-medium">
                              Ref: {item.citationKey}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-stone-400">
                          <span>{formatBytes(item.fileSize)}</span>
                          <span>•</span>
                          <span>Uploaded by {item.uploadedBy.name}</span>
                          <span>•</span>
                          <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-stone-600 font-serif italic">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: View, Download (Everyone) | Delete (Admin Only) */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      {/* View PDF */}
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center space-x-1"
                        title="View PDF in Google Drive viewer"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-[11px] font-medium hidden sm:inline">View</span>
                      </a>

                      {/* Download PDF (Any member can download) */}
                      <button
                        onClick={() => downloadDrivePdf(item.id, item.fileName)}
                        className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Download research paper PDF to your computer"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span className="text-[11px] font-medium hidden sm:inline">Download</span>
                      </button>

                      {/* Delete PDF: STRICTLY ADMIN / OWNER ONLY */}
                      {isAdmin ? (
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Permanently delete from Google Drive (Admin Only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="text-[10px] text-stone-400 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-stone-100"
                          title="Members cannot delete files"
                        >
                          <Lock className="w-3 h-3 text-stone-400" />
                          <span>Protected</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center space-x-2 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Files are hosted directly in Google Drive to preserve zero free-tier server quota</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL FOR DELETION (Workspace Integration Rule) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 font-sans text-xs">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-serif font-bold text-stone-900">
                Confirm Deletion from Google Drive
              </h4>
              <p className="text-stone-600 leading-relaxed text-xs">
                Are you sure you want to permanently delete the research paper PDF{' '}
                <strong>"{deleteTarget.fileName}"</strong> from your Google Drive folder?
              </p>
              <p className="text-[11px] text-rose-600 font-medium">
                This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
