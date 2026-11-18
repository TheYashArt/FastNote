export type NoteType = 'text' | 'link' | 'image' | 'pdf';

export type NoteColor = 'linen' | 'amber' | 'sage' | 'sky' | 'rose';

export interface NoteAttachmentFile {
  url: string;
  name: string;
  size?: number;
}

export interface NoteAttachments {
  link?: string;
  images?: NoteAttachmentFile[];
  pdfs?: NoteAttachmentFile[];
  md_files?: NoteAttachmentFile[];
  html_files?: NoteAttachmentFile[];
  // Legacy backward compatibility
  image?: NoteAttachmentFile;
  pdf?: NoteAttachmentFile;
  md_file?: NoteAttachmentFile;
  html_file?: NoteAttachmentFile;
}

export interface Note {
  id: string;
  room_id: string;
  type: NoteType;
  title?: string;
  content: string; // text body
  color: NoteColor;
  pinned: boolean;
  file_url?: string; // stores single URL or JSON string of NoteAttachments
  file_name?: string;
  file_size?: number;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  created_at: string;
  // Resolved attachments for multi-format notes
  attachments?: NoteAttachments;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isConnected: boolean;
  error?: string | null;
}

export interface NewNotePayload {
  type?: NoteType;
  title?: string;
  content: string;
  color: NoteColor;
  pinned?: boolean;
  link_url?: string;
  image_files?: File[];
  image_attachments?: NoteAttachmentFile[];
  pdf_files?: File[];
  pdf_attachments?: NoteAttachmentFile[];
  md_files?: File[];
  md_attachments?: NoteAttachmentFile[];
  html_files?: File[];
  html_attachments?: NoteAttachmentFile[];
  // Legacy fallback
  image_file?: File | null;
  image_url?: string;
  image_name?: string;
  image_size?: number;
  pdf_file?: File | null;
  pdf_url?: string;
  pdf_name?: string;
  pdf_size?: number;
  file?: File | null;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface UpdateNotePayload {
  title?: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  link_url?: string;
  image_files?: File[];
  image_attachments?: NoteAttachmentFile[];
  pdf_files?: File[];
  pdf_attachments?: NoteAttachmentFile[];
  md_files?: File[];
  md_attachments?: NoteAttachmentFile[];
  html_files?: File[];
  html_attachments?: NoteAttachmentFile[];
  // Legacy single file fallback
  image_file?: File | null;
  image_attachment?: NoteAttachmentFile | null;
  pdf_file?: File | null;
  pdf_attachment?: NoteAttachmentFile | null;
}
