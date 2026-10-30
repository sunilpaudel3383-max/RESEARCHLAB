import { getAccessToken } from './firebase';
import { ResearchPaperDrivePdf, Collaborator, DocumentRole } from './types';

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
}

export const ROOT_LAB_FOLDER = 'CivilLab - Research Literature Repositories';

/**
 * Searches for a folder or creates it if it doesn't exist
 */
export async function findOrCreateFolder(
  folderName: string,
  parentId?: string
): Promise<{ folderId: string; folderUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive is not linked. Please sign in with Google to connect Drive storage.');
  }

  // Sanitize folder query
  const escapedName = folderName.replace(/'/g, "\\'");
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to search Google Drive folders.');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const folder = searchData.files[0];
    return {
      folderId: folder.id,
      folderUrl: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
    };
  }

  // Create folder
  const bodyPayload: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    bodyPayload.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Drive folder.');
  }

  const newFolder = await createRes.json();
  return {
    folderId: newFolder.id,
    folderUrl: newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
  };
}

/**
 * Finds or creates a dedicated literature subfolder for a specific research project
 */
export async function findOrCreateProjectResearchFolder(
  paperTitle: string
): Promise<{ folderId: string; folderUrl: string; folderName: string }> {
  // 1. Ensure root lab folder exists
  const root = await findOrCreateFolder(ROOT_LAB_FOLDER);

  // 2. Ensure project subfolder exists under root
  const cleanTitle = paperTitle.trim().slice(0, 60) || 'Untitled Research Investigation';
  const projectFolderName = `[Literature] ${cleanTitle}`;
  const projectFolder = await findOrCreateFolder(projectFolderName, root.folderId);

  return {
    folderId: projectFolder.folderId,
    folderUrl: projectFolder.folderUrl,
    folderName: projectFolderName,
  };
}

/**
 * Uploads a research paper PDF directly into the research paper's Google Drive folder.
 * Accessible to any member working on that paper.
 */
export async function uploadResearchPdfToDrive(
  file: File,
  folderId: string,
  uploader: Collaborator,
  citationKey?: string,
  notes?: string
): Promise<ResearchPaperDrivePdf> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive is not linked. Please sign in with Google to grant Drive access.');
  }

  const metadata = {
    name: file.name,
    parents: [folderId],
    mimeType: 'application/pdf',
    description: `Civil Engineering Literature PDF uploaded by ${uploader.name} (${uploader.email})${
      citationKey ? ` for citation [${citationKey}]` : ''
    }. Notes: ${notes || 'None'}`,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,webContentLink,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload PDF to Google Drive research folder.');
  }

  const resData = await uploadRes.json();
  const pdfRecord: ResearchPaperDrivePdf = {
    id: resData.id,
    fileName: resData.name || file.name,
    fileSize: parseInt(resData.size || `${file.size}`, 10) || file.size,
    uploadedAt: resData.createdTime || new Date().toISOString(),
    uploadedBy: {
      id: uploader.id,
      name: uploader.name,
      email: uploader.email,
      avatar: uploader.avatar,
      role: uploader.role,
    },
    webViewLink: resData.webViewLink || `https://drive.google.com/file/d/${resData.id}/view`,
    downloadUrl: resData.webContentLink,
    citationKey: citationKey?.trim() || undefined,
    notes: notes?.trim() || undefined,
  };

  return pdfRecord;
}

/**
 * Downloads a research paper PDF from Google Drive to the local computer
 */
export async function downloadDrivePdf(fileId: string, fileName: string): Promise<void> {
  const openInNewTab = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const token = await getAccessToken();
  if (!token) {
    // If token not in memory, open the Google Drive view/download link directly
    openInNewTab(`https://drive.google.com/file/d/${fileId}/view`);
    return;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      openInNewTab(`https://drive.google.com/file/d/${fileId}/view`);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    openInNewTab(`https://drive.google.com/file/d/${fileId}/view`);
  }
}

/**
 * Deletes a literature PDF from Google Drive.
 * STRICT ENFORCEMENT: ONLY Administrator / Owner can delete files.
 * Members are strictly forbidden from deleting files.
 */
export async function deleteResearchPdfFromDrive(
  fileId: string,
  userRole: DocumentRole,
  platformType: 'admin' | 'member'
): Promise<void> {
  const isAuthorized = platformType === 'admin' || userRole === 'owner';
  if (!isAuthorized) {
    throw new Error('Access Denied: Research members cannot delete literature PDFs from the shared laboratory Google Drive.');
  }

  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive is not linked. Please sign in with Google to manage Drive files.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive.');
  }
}

/**
 * Exports Word or PDF manuscript snapshot to the project's Google Drive folder
 */
export async function exportManuscriptSnapshotToDrive(
  fileName: string,
  blob: Blob,
  folderId: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive is not linked.');

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType,
    description: 'Exported publication snapshot from CivilLab Workspace.',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to save snapshot to Google Drive.');
  }

  const resData = await uploadRes.json();
  return {
    fileId: resData.id,
    webViewLink: resData.webViewLink || `https://drive.google.com/file/d/${resData.id}/view`,
  };
}

export const CITED_LITERATURE_FOLDER = 'CivilLab - Cited Literature PDFs';

export async function getCitedLiteratureFolderUrl(): Promise<string> {
  try {
    const { folderId } = await findOrCreateFolder(CITED_LITERATURE_FOLDER);
    return `https://drive.google.com/drive/folders/${folderId}`;
  } catch {
    return 'https://drive.google.com';
  }
}

export async function uploadManuscriptToDrive(
  fileName: string,
  blob: Blob,
  folderId: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  return exportManuscriptSnapshotToDrive(fileName, blob, folderId, mimeType);
}

export async function listFolderFiles(folderId: string): Promise<DriveFileSummary[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,createdTime,size)&orderBy=createdTime desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}

export async function uploadCitedPdfToDrive(
  fileName: string,
  pdfBlob: Blob,
  citationKey: string,
  paperTitle: string,
  folderName = CITED_LITERATURE_FOLDER
): Promise<{ fileId: string; webViewLink: string; folderId: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  const folder = await findOrCreateFolder(folderName);

  const metadata = {
    name: fileName,
    parents: [folder.folderId],
    mimeType: 'application/pdf',
    description: `Cited Research Manuscript PDF for reference [${citationKey}]: ${paperTitle}`,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload cited PDF to Google Drive.');
  }

  const resData = await uploadRes.json();
  return {
    fileId: resData.id,
    webViewLink: resData.webViewLink || `https://drive.google.com/file/d/${resData.id}/view`,
    folderId: folder.folderId,
  };
}
