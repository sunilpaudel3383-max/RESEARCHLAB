export type DocumentRole = 'owner' | 'editor' | 'reviewer' | 'viewer';

export interface Author {
  id: string;
  name: string;
  email: string;
  affiliation: string;
  isCorresponding?: boolean;
}

export interface PaperFigure {
  id: string;
  number: number;
  caption: string;
  imageUrl: string;
  width?: string;
  altText?: string;
}

export interface PaperTable {
  id: string;
  number: number;
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface PaperEquation {
  id: string;
  number: number;
  latex: string;
  description?: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  type: 'title' | 'abstract' | 'keywords' | 'authors' | 'standard' | 'references' | 'appendix';
  content: string; // rich text HTML / text
  order: number;
  figures?: PaperFigure[];
  tables?: PaperTable[];
  equations?: PaperEquation[];
}

export interface ReferenceItem {
  id: string;
  key: string; // e.g. "vaswani2017attention"
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  booktitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  rawBibtex?: string;
  citationIndex?: number; // 1-based index based on appearance [1]
  isIncomplete?: boolean;
  missingFields?: string[];
  pdfAttachment?: ReferencePdfAttachment;
}

export interface ReferencePdfAttachment {
  fileId: string;
  fileName: string;
  driveUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize?: string;
  driveFolder?: string;
}


export interface DocumentCommentReply {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: DocumentRole;
  };
  content: string;
  timestamp: string;
}

export interface DocumentComment {
  id: string;
  sectionId?: string;
  selectedText?: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: DocumentRole;
  };
  content: string;
  timestamp: string;
  resolved: boolean;
  replies: DocumentCommentReply[];
}

export interface DocumentSuggestion {
  id: string;
  sectionId: string;
  type: 'insert' | 'delete' | 'replace';
  author: {
    id: string;
    name: string;
    avatar: string;
    role: DocumentRole;
  };
  originalText?: string;
  suggestedText: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface VersionSnapshot {
  id: string;
  versionNumber: string; // e.g. "1.0", "1.1"
  label: string; // e.g. "Pre-peer review draft"
  summary: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  data: {
    title: string;
    abstract: string;
    keywords: string[];
    authors: Author[];
    sections: DocumentSection[];
    references: ReferenceItem[];
    stats: {
      words: number;
      characters: number;
    };
  };
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: DocumentRole;
  color: string;
  isOnline: boolean;
  lastActive?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorName: string;
  actorRole: DocumentRole;
  timestamp: string;
  details?: string;
}

export interface DriveExportRecord {
  fileId: string;
  fileName: string;
  driveUrl: string;
  exportedAt: string;
  versionLabel: string;
  fileType: 'docx' | 'pdf';
  folderName: string;
}

export interface ResearchPaperDrivePdf {
  id: string; // Google Drive file ID
  fileName: string;
  fileSize: number; // in bytes
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: DocumentRole;
  };
  webViewLink: string;
  downloadUrl?: string;
  citationKey?: string;
  notes?: string;
}

export interface ResearchDocument {
  id: string;
  projectId: string;
  docType: 'journal' | 'conference' | 'lit_review' | 'technical_report';
  title: string;
  abstract: string;
  keywords: string[];
  authors: Author[];
  sections: DocumentSection[];
  references: ReferenceItem[];
  comments: DocumentComment[];
  suggestions: DocumentSuggestion[];
  collaborators: Collaborator[];
  versions: VersionSnapshot[];
  driveExports: DriveExportRecord[];
  driveFolderId?: string;
  driveFolderUrl?: string;
  driveFolderName?: string;
  literaturePdfs?: ResearchPaperDrivePdf[];
  auditLog: AuditLogEntry[];
  citationStyle: 'ieee' | 'apa' | 'nature' | 'chicago';
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollaboratorCursor {
  userId: string;
  name: string;
  color: string;
  role: DocumentRole;
  avatar: string;
  sectionId?: string;
  cursorIndex?: number;
  selection?: {
    start: number;
    end: number;
  };
  updatedAt: number;
}
