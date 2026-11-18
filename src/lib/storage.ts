import type { Note, NewNotePayload, UpdateNotePayload, NoteAttachments, NoteAttachmentFile, NoteType } from '../types';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { detectDevice, ATTACHMENT_LIMITS } from './utils';

const BROADCAST_CHANNEL_NAME = 'fastnote_sync_channel';

// Cross-tab synchronization channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch (err) {
    console.warn('BroadcastChannel not supported', err);
  }
}

// Normalize a note and extract structured attachments (supporting multiple images, multiple PDFs, Markdown, and HTML files)
export function normalizeNote(raw: Note): Note {
  let attachments: NoteAttachments = {
    images: [],
    pdfs: [],
    md_files: [],
    html_files: [],
  };

  if (raw.file_url) {
    if (raw.file_url.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw.file_url);
        attachments = {
          link: parsed.link,
          images: Array.isArray(parsed.images)
            ? parsed.images
            : parsed.image
            ? [parsed.image]
            : [],
          pdfs: Array.isArray(parsed.pdfs)
            ? parsed.pdfs
            : parsed.pdf
            ? [parsed.pdf]
            : [],
          md_files: Array.isArray(parsed.md_files)
            ? parsed.md_files
            : Array.isArray(parsed.mds)
            ? parsed.mds
            : parsed.md_file
            ? [parsed.md_file]
            : [],
          html_files: Array.isArray(parsed.html_files)
            ? parsed.html_files
            : Array.isArray(parsed.htmls)
            ? parsed.htmls
            : parsed.html_file
            ? [parsed.html_file]
            : [],
        };
      } catch {
        attachments = { images: [], pdfs: [], md_files: [], html_files: [] };
      }
    } else {
      // Legacy single file_url
      if (raw.type === 'image') {
        attachments.images = [{
          url: raw.file_url,
          name: raw.file_name || 'image.png',
          size: raw.file_size,
        }];
      } else if (raw.type === 'pdf') {
        attachments.pdfs = [{
          url: raw.file_url,
          name: raw.file_name || 'document.pdf',
          size: raw.file_size,
        }];
      }
    }
  }

  // If type is link or note content is URL and attachments.link isn't set
  if (raw.type === 'link' && !attachments.link && raw.content) {
    attachments.link = raw.content;
  }

  if (!attachments.images) attachments.images = [];
  if (!attachments.pdfs) attachments.pdfs = [];
  if (!attachments.md_files) attachments.md_files = [];
  if (!attachments.html_files) attachments.html_files = [];

  // Maintain backward compatibility for single-item readers
  attachments.image = attachments.images[0];
  attachments.pdf = attachments.pdfs[0];
  attachments.md_file = attachments.md_files[0];
  attachments.html_file = attachments.html_files[0];

  return {
    ...raw,
    attachments,
  };
}

// Sample notes with rich multi-attachment demonstration
export function getInitialSampleNotes(roomId: string): Note[] {
  return [
    {
      id: 'welcome-1',
      room_id: roomId,
      type: 'text',
      title: 'Rich Sticky Note (Multi-Attachments)',
      content: 'This note demonstrates text, attached URL link, multiple images, and multiple PDFs all inside the same sticky note! Tap to open and edit in full focus.',
      color: 'amber',
      pinned: true,
      device_type: 'desktop',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      attachments: {
        link: 'https://supabase.com/docs',
        images: [],
        pdfs: [],
      },
    },
    {
      id: 'welcome-2',
      room_id: roomId,
      type: 'link',
      title: 'FastNote Documentation & Repository',
      content: 'https://github.com/supabase/supabase',
      color: 'sky',
      pinned: false,
      device_type: 'desktop',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      attachments: {
        link: 'https://github.com/supabase/supabase',
        images: [],
        pdfs: [],
      },
    },
    {
      id: 'welcome-3',
      room_id: roomId,
      type: 'text',
      title: 'Multi-File Drop & Equal Grid',
      content: 'You can drag & drop multiple images and multiple PDFs at once. All sticky notes maintain an architectural equal card size for a clean, minimal look.',
      color: 'sage',
      pinned: false,
      device_type: 'mobile',
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      attachments: {
        images: [],
        pdfs: [],
      },
    },
  ];
}

// Local storage helpers
function getLocalNotes(roomId: string): Note[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`fastnote_notes_${roomId}`);
      if (!raw) {
        const samples = getInitialSampleNotes(roomId);
        localStorage.setItem(`fastnote_notes_${roomId}`, JSON.stringify(samples));
        return samples.map(normalizeNote);
      }
      const parsed: Note[] = JSON.parse(raw);
      return parsed.map(normalizeNote);
    } catch {
      return [];
    }
  }
  return [];
}

function setLocalNotes(roomId: string, notes: Note[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`fastnote_notes_${roomId}`, JSON.stringify(notes));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'UPDATE', roomId, timestamp: Date.now() });
    }
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export async function fetchNotes(roomId: string): Promise<{ notes: Note[]; isCloud: boolean }> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('room_id', roomId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch returned error, falling back to local storage:', error.message);
        return { notes: getLocalNotes(roomId), isCloud: false };
      }

      const normalized = ((data as Note[]) || []).map(normalizeNote);
      return { notes: normalized, isCloud: true };
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local storage:', err);
      return { notes: getLocalNotes(roomId), isCloud: false };
    }
  }

  return { notes: getLocalNotes(roomId), isCloud: false };
}

// Helper to upload a file to Supabase storage or convert to data URL
async function uploadOrConvertFile(
  supabase: SupabaseClient | null,
  roomId: string,
  file: File,
  prefix: string
): Promise<NoteAttachmentFile> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

  if (supabase) {
    try {
      const filePath = `${roomId}/${Date.now()}_${prefix}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('fastnote-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('fastnote-files')
          .getPublicUrl(filePath);
        return {
          url: publicUrlData.publicUrl,
          name: file.name,
          size: file.size,
        };
      }
      console.error('Supabase storage upload error, falling back to local data URL:', uploadError);
    } catch (uploadErr) {
      console.error('File upload exception, using local data URL:', uploadErr);
    }
  }

  const dataUrl = await fileToDataUrl(file);
  return {
    url: dataUrl,
    name: file.name,
    size: file.size,
  };
}

export async function createNote(roomId: string, payload: NewNotePayload): Promise<Note> {
  const supabase = getSupabase();
  const device = detectDevice();

  let link = payload.link_url?.trim() || undefined;
  const imageAttachments: NoteAttachmentFile[] = [...(payload.image_attachments || [])];
  const pdfAttachments: NoteAttachmentFile[] = [...(payload.pdf_attachments || [])];
  const mdAttachments: NoteAttachmentFile[] = [...(payload.md_attachments || [])];
  const htmlAttachments: NoteAttachmentFile[] = [...(payload.html_attachments || [])];

  // Upload multiple images if provided (enforcing MAX_IMAGES_PER_NOTE)
  const remainingImageSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE - imageAttachments.length);
  if (payload.image_files && payload.image_files.length > 0) {
    const filesToUpload = payload.image_files.slice(0, remainingImageSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'img');
      imageAttachments.push(uploaded);
    }
  } else if (payload.image_file && remainingImageSlots > 0) {
    const uploaded = await uploadOrConvertFile(supabase, roomId, payload.image_file, 'img');
    imageAttachments.push(uploaded);
  } else if (payload.image_url && remainingImageSlots > 0) {
    imageAttachments.push({
      url: payload.image_url,
      name: payload.image_name || 'image.png',
      size: payload.image_size,
    });
  }

  // Upload multiple PDFs if provided (enforcing MAX_PDFS_PER_NOTE)
  const remainingPdfSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE - pdfAttachments.length);
  if (payload.pdf_files && payload.pdf_files.length > 0) {
    const filesToUpload = payload.pdf_files.slice(0, remainingPdfSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'doc');
      pdfAttachments.push(uploaded);
    }
  } else if (payload.pdf_file && remainingPdfSlots > 0) {
    const uploaded = await uploadOrConvertFile(supabase, roomId, payload.pdf_file, 'doc');
    pdfAttachments.push(uploaded);
  } else if (payload.pdf_url && remainingPdfSlots > 0) {
    pdfAttachments.push({
      url: payload.pdf_url,
      name: payload.pdf_name || 'document.pdf',
      size: payload.pdf_size,
    });
  }

  // Upload multiple Markdown files if provided (enforcing MAX_MDS_PER_NOTE)
  const remainingMdSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE - mdAttachments.length);
  if (payload.md_files && payload.md_files.length > 0) {
    const filesToUpload = payload.md_files.slice(0, remainingMdSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'md');
      mdAttachments.push(uploaded);
    }
  }

  // Upload multiple HTML files if provided (enforcing MAX_HTMLS_PER_NOTE)
  const remainingHtmlSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE - htmlAttachments.length);
  if (payload.html_files && payload.html_files.length > 0) {
    const filesToUpload = payload.html_files.slice(0, remainingHtmlSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'html');
      htmlAttachments.push(uploaded);
    }
  }

  // Legacy fallback
  if (payload.file && imageAttachments.length === 0 && pdfAttachments.length === 0 && mdAttachments.length === 0 && htmlAttachments.length === 0) {
    if (payload.file.type.startsWith('image/')) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, payload.file, 'img');
      imageAttachments.push(uploaded);
    } else if (payload.file.name.endsWith('.md') || payload.file.type === 'text/markdown') {
      const uploaded = await uploadOrConvertFile(supabase, roomId, payload.file, 'md');
      mdAttachments.push(uploaded);
    } else if (payload.file.name.endsWith('.html') || payload.file.name.endsWith('.htm') || payload.file.type === 'text/html') {
      const uploaded = await uploadOrConvertFile(supabase, roomId, payload.file, 'html');
      htmlAttachments.push(uploaded);
    } else {
      const uploaded = await uploadOrConvertFile(supabase, roomId, payload.file, 'doc');
      pdfAttachments.push(uploaded);
    }
  }

  const attachments: NoteAttachments = {
    link,
    images: imageAttachments,
    pdfs: pdfAttachments,
    md_files: mdAttachments,
    html_files: htmlAttachments,
    image: imageAttachments[0],
    pdf: pdfAttachments[0],
    md_file: mdAttachments[0],
    html_file: htmlAttachments[0],
  };

  const hasAttachments = Boolean(link || imageAttachments.length > 0 || pdfAttachments.length > 0 || mdAttachments.length > 0 || htmlAttachments.length > 0);

  // Primary type for DB check constraint (must be 'text' | 'link' | 'image' | 'pdf')
  let primaryType: NoteType = 'text';
  if (payload.type) {
    primaryType = payload.type;
  } else if (link && imageAttachments.length === 0 && pdfAttachments.length === 0 && mdAttachments.length === 0 && !payload.content.trim()) {
    primaryType = 'link';
  } else if (imageAttachments.length > 0 && pdfAttachments.length === 0 && mdAttachments.length === 0 && !link && !payload.content.trim()) {
    primaryType = 'image';
  } else if (pdfAttachments.length > 0 && imageAttachments.length === 0 && mdAttachments.length === 0 && !link && !payload.content.trim()) {
    primaryType = 'pdf';
  } else {
    primaryType = 'text';
  }

  const fileUrlSerialized = hasAttachments ? JSON.stringify(attachments) : undefined;
  const mainFileName = imageAttachments[0]?.name || pdfAttachments[0]?.name || mdAttachments[0]?.name;
  const mainFileSize = imageAttachments[0]?.size || pdfAttachments[0]?.size || mdAttachments[0]?.size;

  const newNote: Note = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    room_id: roomId,
    type: primaryType,
    title: payload.title?.trim() || undefined,
    content: payload.content.trim(),
    color: payload.color,
    pinned: payload.pinned ?? false,
    file_url: fileUrlSerialized,
    file_name: mainFileName,
    file_size: mainFileSize,
    device_type: device,
    created_at: new Date().toISOString(),
    attachments,
  };

  if (supabase) {
    try {
      const dbPayload = {
        id: newNote.id,
        room_id: newNote.room_id,
        type: newNote.type,
        title: newNote.title,
        content: newNote.content,
        color: newNote.color,
        pinned: newNote.pinned,
        file_url: newNote.file_url,
        file_name: newNote.file_name,
        file_size: newNote.file_size,
        device_type: newNote.device_type,
        created_at: newNote.created_at,
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([dbPayload])
        .select()
        .single();

      if (!error && data) {
        return normalizeNote(data as Note);
      }
      console.warn('Supabase insert failed, saving locally:', error?.message);
    } catch (insertErr) {
      console.warn('Supabase insert exception, saving locally:', insertErr);
    }
  }

  // Local fallback
  const local = getLocalNotes(roomId);
  const updated = [newNote, ...local];
  setLocalNotes(roomId, updated);
  return newNote;
}

export async function updateNote(
  roomId: string,
  noteId: string,
  payload: UpdateNotePayload
): Promise<Note | null> {
  const supabase = getSupabase();
  const localNotes = getLocalNotes(roomId);
  const existing = localNotes.find((n) => n.id === noteId);

  let link = payload.link_url?.trim() || undefined;
  const imageAttachments: NoteAttachmentFile[] = [...(payload.image_attachments || [])];
  const pdfAttachments: NoteAttachmentFile[] = [...(payload.pdf_attachments || [])];
  const mdAttachments: NoteAttachmentFile[] = [...(payload.md_attachments || [])];
  const htmlAttachments: NoteAttachmentFile[] = [...(payload.html_attachments || [])];

  // Upload any new image files (enforcing MAX_IMAGES_PER_NOTE)
  const remainingImageSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE - imageAttachments.length);
  if (payload.image_files && payload.image_files.length > 0) {
    const filesToUpload = payload.image_files.slice(0, remainingImageSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'img');
      imageAttachments.push(uploaded);
    }
  } else if (payload.image_file && remainingImageSlots > 0) {
    const uploaded = await uploadOrConvertFile(supabase, roomId, payload.image_file, 'img');
    imageAttachments.push(uploaded);
  }

  // Upload any new PDF files (enforcing MAX_PDFS_PER_NOTE)
  const remainingPdfSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE - pdfAttachments.length);
  if (payload.pdf_files && payload.pdf_files.length > 0) {
    const filesToUpload = payload.pdf_files.slice(0, remainingPdfSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'doc');
      pdfAttachments.push(uploaded);
    }
  } else if (payload.pdf_file && remainingPdfSlots > 0) {
    const uploaded = await uploadOrConvertFile(supabase, roomId, payload.pdf_file, 'doc');
    pdfAttachments.push(uploaded);
  }

  // Upload any new Markdown files (enforcing MAX_MDS_PER_NOTE)
  const remainingMdSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE - mdAttachments.length);
  if (payload.md_files && payload.md_files.length > 0) {
    const filesToUpload = payload.md_files.slice(0, remainingMdSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'md');
      mdAttachments.push(uploaded);
    }
  }

  // Upload any new HTML files (enforcing MAX_HTMLS_PER_NOTE)
  const remainingHtmlSlots = Math.max(0, ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE - htmlAttachments.length);
  if (payload.html_files && payload.html_files.length > 0) {
    const filesToUpload = payload.html_files.slice(0, remainingHtmlSlots);
    for (const f of filesToUpload) {
      const uploaded = await uploadOrConvertFile(supabase, roomId, f, 'html');
      htmlAttachments.push(uploaded);
    }
  }

  const attachments: NoteAttachments = {
    link,
    images: imageAttachments,
    pdfs: pdfAttachments,
    md_files: mdAttachments,
    html_files: htmlAttachments,
    image: imageAttachments[0],
    pdf: pdfAttachments[0],
    md_file: mdAttachments[0],
    html_file: htmlAttachments[0],
  };

  const hasAttachments = Boolean(link || imageAttachments.length > 0 || pdfAttachments.length > 0 || mdAttachments.length > 0 || htmlAttachments.length > 0);

  let primaryType: NoteType = 'text';
  if (link && imageAttachments.length === 0 && pdfAttachments.length === 0 && mdAttachments.length === 0 && !payload.content.trim()) {
    primaryType = 'link';
  } else if (imageAttachments.length > 0 && pdfAttachments.length === 0 && mdAttachments.length === 0 && !link && !payload.content.trim()) {
    primaryType = 'image';
  } else if (pdfAttachments.length > 0 && imageAttachments.length === 0 && mdAttachments.length === 0 && !link && !payload.content.trim()) {
    primaryType = 'pdf';
  } else {
    primaryType = 'text';
  }

  const fileUrlSerialized = hasAttachments ? JSON.stringify(attachments) : null;
  const mainFileName = imageAttachments[0]?.name || pdfAttachments[0]?.name || mdAttachments[0]?.name || null;
  const mainFileSize = imageAttachments[0]?.size || pdfAttachments[0]?.size || mdAttachments[0]?.size || null;

  const updatedNote: Note = {
    id: noteId,
    room_id: roomId,
    type: primaryType,
    title: payload.title?.trim() || undefined,
    content: payload.content.trim(),
    color: payload.color,
    pinned: payload.pinned,
    file_url: fileUrlSerialized || undefined,
    file_name: mainFileName || undefined,
    file_size: mainFileSize || undefined,
    device_type: existing?.device_type || detectDevice(),
    created_at: existing?.created_at || new Date().toISOString(),
    attachments,
  };

  if (supabase) {
    try {
      const dbPayload = {
        type: updatedNote.type,
        title: updatedNote.title || null,
        content: updatedNote.content,
        color: updatedNote.color,
        pinned: updatedNote.pinned,
        file_url: fileUrlSerialized,
        file_name: mainFileName,
        file_size: mainFileSize,
      };

      const { data, error } = await supabase
        .from('notes')
        .update(dbPayload)
        .eq('id', noteId)
        .eq('room_id', roomId)
        .select()
        .single();

      if (!error && data) {
        const normalized = normalizeNote(data as Note);
        const updatedList = localNotes.map((n) => (n.id === noteId ? normalized : n));
        setLocalNotes(roomId, updatedList);
        return normalized;
      }
      console.warn('Supabase update returned error, updating locally:', error?.message);
    } catch (err) {
      console.warn('Supabase update exception, updating locally:', err);
    }
  }

  const updatedList = localNotes.map((n) => (n.id === noteId ? updatedNote : n));
  setLocalNotes(roomId, updatedList);
  return updatedNote;
}

export async function deleteNote(roomId: string, noteId: string): Promise<void> {
  const supabase = getSupabase();
  const local = getLocalNotes(roomId);
  const noteToDelete = local.find((n) => n.id === noteId);

  if (supabase) {
    try {
      // Remove any uploaded storage files from bucket
      if (noteToDelete?.attachments) {
        const filePaths: string[] = [];
        noteToDelete.attachments.images?.forEach((img) => {
          if (img.url.includes('/fastnote-files/')) {
            const path = img.url.split('/fastnote-files/')[1];
            if (path) filePaths.push(decodeURIComponent(path));
          }
        });
        noteToDelete.attachments.pdfs?.forEach((pdf) => {
          if (pdf.url.includes('/fastnote-files/')) {
            const path = pdf.url.split('/fastnote-files/')[1];
            if (path) filePaths.push(decodeURIComponent(path));
          }
        });
        noteToDelete.attachments.md_files?.forEach((md) => {
          if (md.url.includes('/fastnote-files/')) {
            const path = md.url.split('/fastnote-files/')[1];
            if (path) filePaths.push(decodeURIComponent(path));
          }
        });
        noteToDelete.attachments.html_files?.forEach((html) => {
          if (html.url.includes('/fastnote-files/')) {
            const path = html.url.split('/fastnote-files/')[1];
            if (path) filePaths.push(decodeURIComponent(path));
          }
        });
        if (filePaths.length > 0) {
          await supabase.storage.from('fastnote-files').remove(filePaths);
        }
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('room_id', roomId);

      if (!error) return;
      console.warn('Supabase delete failed, removing locally:', error.message);
    } catch (err) {
      console.warn('Supabase delete exception:', err);
    }
  }

  const updated = local.filter((n) => n.id !== noteId);
  setLocalNotes(roomId, updated);
}

export async function togglePinNote(roomId: string, noteId: string, currentPinned: boolean): Promise<boolean> {
  const newPinned = !currentPinned;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ pinned: newPinned })
        .eq('id', noteId)
        .eq('room_id', roomId);

      if (!error) return newPinned;
      console.warn('Supabase pin toggle failed, updating locally:', error.message);
    } catch (err) {
      console.warn('Supabase pin toggle exception:', err);
    }
  }

  const local = getLocalNotes(roomId);
  const updated = local.map((n) => (n.id === noteId ? { ...n, pinned: newPinned } : n));
  setLocalNotes(roomId, updated);
  return newPinned;
}

// Convert a File to base64 data URL for local storage
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Subscribe to real-time changes
export function subscribeToRoom(roomId: string, onUpdate: () => void) {
  const supabase = getSupabase();
  let channel: RealtimeChannel | null = null;

  if (supabase) {
    try {
      channel = supabase
        .channel(`room_${roomId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes',
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Failed to subscribe to Supabase channel:', err);
    }
  }

  // Cross-tab broadcast listener for local mode
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.roomId === roomId) {
      onUpdate();
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}
