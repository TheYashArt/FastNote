import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Composer } from './components/Composer';
import { NoteCard } from './components/NoteCard';
import { NoteEditModal } from './components/NoteEditModal';
import { FilterBar } from './components/FilterBar';
import type { FilterOption } from './components/FilterBar';
import { QrModal } from './components/QrModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ImageLightbox } from './components/ImageLightbox';
import { EmptyState } from './components/EmptyState';
import type { Note, NewNotePayload, NoteColor, NoteAttachmentFile } from './types';
import { 
  fetchNotes, 
  createNote, 
  updateNote,
  deleteNote, 
  togglePinNote, 
  subscribeToRoom 
} from './lib/storage';
import { generateRoomId } from './lib/utils';
import { Check, Smartphone } from 'lucide-react';

export function App() {
  // Determine active Room
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) return roomParam.toLowerCase().replace(/[^a-z0-9_-]/g, '');

      const stored = localStorage.getItem('fastnote_active_room');
      if (stored) return stored;

      const generated = generateRoomId();
      localStorage.setItem('fastnote_active_room', generated);
      return generated;
    }
    return 'demo';
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  
  // UI Controls
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync room in URL query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('room') !== roomId) {
        url.searchParams.set('room', roomId);
        window.history.replaceState({}, '', url.toString());
      }
      localStorage.setItem('fastnote_active_room', roomId);
    }
  }, [roomId]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  }, []);

  // Fetch notes for the active room
  const loadNotes = useCallback(async () => {
    try {
      const result = await fetchNotes(roomId);
      setNotes(result.notes);
      setIsCloudSynced(result.isCloud);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    setIsLoading(true);
    loadNotes();
  }, [loadNotes]);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, () => {
      loadNotes();
    });
    return () => unsubscribe();
  }, [roomId, loadNotes]);

  // Handle adding a new note
  const handleAddNote = async (payload: NewNotePayload) => {
    setIsSubmitting(true);
    try {
      const newNote = await createNote(roomId, payload);
      setNotes((prev) => [newNote, ...prev.filter((n) => n.id !== newNote.id)]);
      showToast('Note synced to devices');
    } catch (err) {
      console.error('Error creating note:', err);
      showToast('Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(roomId, id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (editingNote?.id === id) {
        setEditingNote(null);
      }
      showToast('Note deleted');
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Handle updating a note
  const handleUpdateNote = async (
    noteId: string,
    data: {
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
    }
  ) => {
    try {
      const updated = await updateNote(roomId, noteId, data);
      if (updated) {
        setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
        showToast('Note updated & synced');
      }
    } catch (err) {
      console.error('Failed to update note:', err);
      showToast('Failed to update note');
    }
  };

  // Handle toggling pin status
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const newPinned = await togglePinNote(roomId, id, currentPinned);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, pinned: newPinned } : n))
      );
      showToast(newPinned ? 'Note pinned to top' : 'Note unpinned');
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Switch Room
  const handleChangeRoom = (newRoom: string) => {
    if (newRoom && newRoom !== roomId) {
      setRoomId(newRoom);
      showToast(`Switched to channel #${newRoom}`);
    }
  };

  // Set of dates (YYYY-MM-DD) that have notes
  const noteDates = useMemo(() => {
    const dates = new Set<string>();
    notes.forEach((n) => {
      if (n.created_at) {
        const d = new Date(n.created_at);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.add(`${y}-${m}-${day}`);
      }
    });
    return dates;
  }, [notes]);

  // Counts for filters: All, Images, PDFs, .MDs, Pinned
  const counts = useMemo(() => {
    return {
      all: notes.length,
      image: notes.filter((n) => Boolean(
        (n.attachments?.images && n.attachments.images.length > 0) ||
        n.attachments?.image ||
        (n.type === 'image' && n.file_url)
      )).length,
      pdf: notes.filter((n) => Boolean(
        (n.attachments?.pdfs && n.attachments.pdfs.length > 0) ||
        n.attachments?.pdf ||
        (n.type === 'pdf' && n.file_url)
      )).length,
      md: notes.filter((n) => Boolean(
        (n.attachments?.md_files && n.attachments.md_files.length > 0) ||
        n.attachments?.md_file
      )).length,
      html: notes.filter((n) => Boolean(
        (n.attachments?.html_files && n.attachments.html_files.length > 0) ||
        n.attachments?.html_file
      )).length,
      pinned: notes.filter((n) => n.pinned).length,
    };
  }, [notes]);

  // Filter & Search logic
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Filter tab
        if (filter === 'pinned') {
          if (!note.pinned) return false;
        } else if (filter === 'image') {
          const hasImg = Boolean(
            (note.attachments?.images && note.attachments.images.length > 0) ||
            note.attachments?.image ||
            (note.type === 'image' && note.file_url)
          );
          if (!hasImg) return false;
        } else if (filter === 'pdf') {
          const hasPdf = Boolean(
            (note.attachments?.pdfs && note.attachments.pdfs.length > 0) ||
            note.attachments?.pdf ||
            (note.type === 'pdf' && note.file_url)
          );
          if (!hasPdf) return false;
        } else if (filter === 'md') {
          const hasMd = Boolean(
            (note.attachments?.md_files && note.attachments.md_files.length > 0) ||
            note.attachments?.md_file
          );
          if (!hasMd) return false;
        } else if (filter === 'html') {
          const hasHtml = Boolean(
            (note.attachments?.html_files && note.attachments.html_files.length > 0) ||
            note.attachments?.html_file
          );
          if (!hasHtml) return false;
        }

        // Date filter
        if (selectedDate) {
          if (!note.created_at) return false;
          const noteDate = new Date(note.created_at);
          const y = noteDate.getFullYear();
          const m = String(noteDate.getMonth() + 1).padStart(2, '0');
          const d = String(noteDate.getDate()).padStart(2, '0');
          const noteDateStr = `${y}-${m}-${d}`;
          if (noteDateStr !== selectedDate) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = note.title?.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchLink = note.attachments?.link?.toLowerCase().includes(q);
          const matchImages = note.attachments?.images?.some((i) => i.name.toLowerCase().includes(q));
          const matchPdfs = note.attachments?.pdfs?.some((p) => p.name.toLowerCase().includes(q));
          const matchMds = note.attachments?.md_files?.some((m) => m.name.toLowerCase().includes(q));
          const matchHtmls = note.attachments?.html_files?.some((h) => h.name.toLowerCase().includes(q));
          const matchFileName = note.file_name?.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchLink && !matchImages && !matchPdfs && !matchMds && !matchHtmls && !matchFileName) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notes always surface first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [notes, filter, searchQuery, selectedDate]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1815] flex flex-col paper-grid">
      {/* Top Navigation */}
      <Header
        roomId={roomId}
        onChangeRoom={handleChangeRoom}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isCloudSynced={isCloudSynced}
        totalNotes={notes.length}
      />

      {/* Main Content Area - Split Screen on Desktop (Input Left, Notes Right), Full Width */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
          
          {/* Left Column: Fixed / Sticky Composer Sidebar */}
          <aside className="w-full lg:w-[380px] xl:w-[420px] 2xl:w-[460px] shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 no-scrollbar space-y-4">
            {/* Quick intro banner & Device Pairing */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#EBE7E0]">
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#1A1815] truncate">
                  New Sticky Note
                </h1>
                <p className="text-[11px] text-[#8C8476] mt-0.5 leading-tight truncate">
                  Sync text, links, screenshots, PDFs, & MD
                </p>
              </div>

              <div className="shrink-0 flex items-center">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setIsQrModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#4D473E] bg-[#F4F2EE] hover:bg-[#EBE7E0] transition-colors min-h-[30px] shadow-2xs whitespace-nowrap"
                  title="Scan QR Code to open on mobile"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#8C8476]" />
                  <span className="hidden xs:inline">Pair Mobile</span>
                  <span className="xs:hidden">Pair</span>
                </motion.button>
              </div>
            </div>

            {/* Note Composer */}
            <Composer onAddNote={handleAddNote} isSubmitting={isSubmitting} />

            {/* Helpful Quick Tip on Desktop */}
            <div className="hidden lg:flex items-center justify-between px-3 py-2 rounded-lg bg-black/[0.02] border border-[#EBE7E0] text-[11px] text-[#8C8476]">
              <span>Tip: Paste anything with <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#DDD7CD] text-[#1A1815]">Ctrl+V</kbd></span>
              <span className="font-mono text-[10px]">#{roomId}</span>
            </div>
          </aside>

          {/* Right Column: Dynamic Notes Board */}
          <section className="flex-1 min-w-0 w-full space-y-4">
            {/* Filter and Search Bar */}
            <FilterBar
              currentFilter={filter}
              onFilterChange={setFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              noteDates={noteDates}
              counts={counts}
            />

            {/* Notes Grid — Responsive full-width grid (2-col mobile, up to 4-col on ultra-wide) */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 items-stretch">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-[280px] sm:h-[350px] rounded-xl border border-[#EBE7E0] bg-white/60 p-3 sm:p-4 animate-pulse flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="w-12 sm:w-16 h-3.5 sm:h-4 bg-[#F4F2EE] rounded" />
                        <div className="w-8 sm:w-10 h-3.5 sm:h-4 bg-[#F4F2EE] rounded" />
                      </div>
                      <div className="w-3/4 h-3.5 sm:h-4 bg-[#F4F2EE] rounded" />
                      <div className="space-y-1.5">
                        <div className="w-full h-2.5 sm:h-3 bg-[#F4F2EE] rounded" />
                        <div className="w-5/6 h-2.5 sm:h-3 bg-[#F4F2EE] rounded" />
                      </div>
                    </div>
                    <div className="w-16 sm:w-20 h-3.5 sm:h-4 bg-[#F4F2EE] rounded" />
                  </div>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <EmptyState
                filter={filter}
                searchQuery={searchQuery}
                selectedDate={selectedDate}
                onClearFilters={() => {
                  setFilter('all');
                  setSearchQuery('');
                  setSelectedDate(null);
                }}
              />
            ) : (
              <motion.div layout className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 items-stretch">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={(n) => setEditingNote(n)}
                      onDelete={handleDeleteNote}
                      onTogglePin={handleTogglePin}
                      onOpenImageLightbox={(url, title) =>
                        setLightboxImage({ url, title })
                      }
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EBE7E0] bg-[#FAF9F7]/90 py-6 text-xs text-[#8C8476] mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#1A1815]">FastNote</span>
            <span>&bull;</span>
            <span>Zero-login quick device drop</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isQrModalOpen && (
          <QrModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            roomId={roomId}
            onChangeRoom={handleChangeRoom}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSupabaseModalOpen && (
          <SupabaseModal
            isOpen={isSupabaseModalOpen}
            onClose={() => setIsSupabaseModalOpen(false)}
            onConfigUpdated={() => {
              loadNotes();
              showToast('Storage configuration updated');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxImage && (
          <ImageLightbox
            imageUrl={lightboxImage.url}
            title={lightboxImage.title}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit / View Note Modal */}
      <AnimatePresence>
        {editingNote && (
          <NoteEditModal
            note={editingNote}
            isOpen={Boolean(editingNote)}
            onClose={() => setEditingNote(null)}
            onSave={handleUpdateNote}
            onDelete={handleDeleteNote}
            onOpenImageLightbox={(url, title) => setLightboxImage({ url, title })}
          />
        )}
      </AnimatePresence>

      {/* Toast Feedback with framer-motion micro-animation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-50 bg-[#1A1815] text-[#FAF9F7] px-4 py-2.5 rounded-lg text-xs font-medium shadow-elevated flex items-center justify-center sm:justify-start gap-2 pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
