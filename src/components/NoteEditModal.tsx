import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Trash2, 
  Pin, 
  Link2, 
  Image as ImageIcon, 
  FileCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Maximize2,
  Plus,
  HardDrive,
  FileCode,
  CodeXml
} from 'lucide-react';
import type { Note, NoteColor, NoteAttachmentFile } from '../types';
import { extractDomain, formatBytes, timeAgo, NOTE_COLOR_MAP, isUrl, ATTACHMENT_LIMITS } from '../lib/utils';

interface NoteEditModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
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
  ) => Promise<void>;
  onDelete: (noteId: string) => void;
  onOpenImageLightbox: (imageUrl: string, title?: string) => void;
}

interface NewImageItem {
  id: string;
  file: File;
  preview: string;
}

export const NoteEditModal: React.FC<NoteEditModalProps> = ({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenImageLightbox,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('linen');
  const [pinned, setPinned] = useState(false);
  
  // Attachments
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Existing & New Images
  const [existingImages, setExistingImages] = useState<NoteAttachmentFile[]>([]);
  const [newImages, setNewImages] = useState<NewImageItem[]>([]);

  // Existing & New PDFs
  const [existingPdfs, setExistingPdfs] = useState<NoteAttachmentFile[]>([]);
  const [newPdfFiles, setNewPdfFiles] = useState<File[]>([]);

  // Existing & New MDs
  const [existingMds, setExistingMds] = useState<NoteAttachmentFile[]>([]);
  const [newMdFiles, setNewMdFiles] = useState<File[]>([]);

  // Existing & New HTMLs
  const [existingHtmls, setExistingHtmls] = useState<NoteAttachmentFile[]>([]);
  const [newHtmlFiles, setNewHtmlFiles] = useState<File[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Close attachment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state whenever note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setColor(note.color || 'linen');
      setPinned(note.pinned || false);

      const link = note.attachments?.link || (note.type === 'link' ? note.content : '');
      setLinkUrl(link || '');
      setShowLinkInput(Boolean(link));

      const imgs = note.attachments?.images && note.attachments.images.length > 0
        ? note.attachments.images
        : note.attachments?.image
        ? [note.attachments.image]
        : note.type === 'image' && note.file_url
        ? [{ url: note.file_url, name: note.file_name || 'image.png', size: note.file_size }]
        : [];
      setExistingImages(imgs);
      setNewImages([]);

      const pdfs = note.attachments?.pdfs && note.attachments.pdfs.length > 0
        ? note.attachments.pdfs
        : note.attachments?.pdf
        ? [note.attachments.pdf]
        : note.type === 'pdf' && note.file_url
        ? [{ url: note.file_url, name: note.file_name || 'document.pdf', size: note.file_size }]
        : [];
      setExistingPdfs(pdfs);
      setNewPdfFiles([]);

      const mds = note.attachments?.md_files && note.attachments.md_files.length > 0
        ? note.attachments.md_files
        : note.attachments?.md_file
        ? [note.attachments.md_file]
        : [];
      setExistingMds(mds);
      setNewMdFiles([]);

      const htmls = note.attachments?.html_files && note.attachments.html_files.length > 0
        ? note.attachments.html_files
        : note.attachments?.html_file
        ? [note.attachments.html_file]
        : [];
      setExistingHtmls(htmls);
      setNewHtmlFiles([]);
    }
  }, [note, isOpen]);

  // Clean object URLs on unmount
  useEffect(() => {
    return () => {
      newImages.forEach((item) => {
        if (item.preview.startsWith('blob:')) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [newImages]);

  // Auto-adjust textarea height as user types or when modal opens, capped at 280px
  useEffect(() => {
    if (!isOpen) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 84), 280);
    textarea.style.height = `${nextHeight}px`;
  }, [content, isOpen]);

  // Escape key to cancel, Ctrl+Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, content, color, pinned, linkUrl, existingImages, newImages, existingPdfs, newPdfFiles, existingMds, newMdFiles, existingHtmls, newHtmlFiles]);

  if (!isOpen || !note) return null;

  const colorConfig = NOTE_COLOR_MAP[color] || NOTE_COLOR_MAP.linen;

  const handleAddNewImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentTotal = existingImages.length + newImages.length;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE - currentTotal;
    if (remainingSlots <= 0) return;

    const items: NewImageItem[] = [];
    for (let i = 0; i < files.length && items.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size <= ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES && file.type.startsWith('image/')) {
        items.push({
          id: `new_img_${Date.now()}_${i}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }
    setNewImages((prev) => [...prev, ...items]);
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (id: string) => {
    setNewImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.preview.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleAddNewPdfs = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentTotal = existingPdfs.length + newPdfFiles.length;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE - currentTotal;
    if (remainingSlots <= 0) return;

    const pdfs: File[] = [];
    for (let i = 0; i < files.length && pdfs.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size <= ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
        pdfs.push(file);
      }
    }
    setNewPdfFiles((prev) => [...prev, ...pdfs]);
  };

  const handleRemoveExistingPdf = (index: number) => {
    setExistingPdfs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewPdf = (index: number) => {
    setNewPdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNewMds = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentTotal = existingMds.length + newMdFiles.length;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE - currentTotal;
    if (remainingSlots <= 0) return;

    const mds: File[] = [];
    for (let i = 0; i < files.length && mds.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size <= ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES && (file.name.endsWith('.md') || file.type === 'text/markdown' || file.name.endsWith('.markdown'))) {
        mds.push(file);
      }
    }
    setNewMdFiles((prev) => [...prev, ...mds]);
  };

  const handleRemoveExistingMd = (index: number) => {
    setExistingMds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewMd = (index: number) => {
    setNewMdFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNewHtmls = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const currentTotal = existingHtmls.length + newHtmlFiles.length;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE - currentTotal;
    if (remainingSlots <= 0) return;

    const htmls: File[] = [];
    for (let i = 0; i < files.length && htmls.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size <= ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES && (file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type === 'text/html')) {
        htmls.push(file);
      }
    }
    setNewHtmlFiles((prev) => [...prev, ...htmls]);
  };

  const handleRemoveExistingHtml = (index: number) => {
    setExistingHtmls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewHtml = (index: number) => {
    setNewHtmlFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyLink = () => {
    if (!linkUrl) return;
    navigator.clipboard.writeText(linkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    let cleanLink = linkUrl.trim();
    if (cleanLink && !cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = `https://${cleanLink}`;
    }

    try {
      await onSave(note.id, {
        title: title.trim() || undefined,
        content: content.trim() || (cleanLink || 'Note'),
        color,
        pinned,
        link_url: cleanLink || undefined,
        image_files: newImages.map((item) => item.file),
        image_attachments: existingImages,
        pdf_files: newPdfFiles,
        pdf_attachments: existingPdfs,
        md_files: newMdFiles,
        md_attachments: existingMds,
        html_files: newHtmlFiles,
        html_attachments: existingHtmls,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save note updates:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalImagesCount = existingImages.length + newImages.length;
  const totalPdfsCount = existingPdfs.length + newPdfFiles.length;
  const totalMdsCount = existingMds.length + newMdFiles.length;
  const totalHtmlsCount = existingHtmls.length + newHtmlFiles.length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className={`w-full max-w-lg sm:max-w-2xl max-h-[88vh] sm:max-h-[85vh] rounded-2xl border ${colorConfig.border} ${colorConfig.bg} shadow-elevated flex flex-col overflow-hidden my-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hidden Multi-File Inputs */}
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleAddNewImages(e.target.files);
              if (e.target) e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={pdfInputRef}
            className="hidden"
            accept=".pdf,application/pdf"
            multiple
            onChange={(e) => {
              handleAddNewPdfs(e.target.files);
              if (e.target) e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={mdInputRef}
            className="hidden"
            accept=".md,text/markdown,text/plain"
            multiple
            onChange={(e) => {
              handleAddNewMds(e.target.files);
              if (e.target) e.target.value = '';
            }}
          />
          <input
            type="file"
            ref={htmlInputRef}
            className="hidden"
            accept=".html,.htm,text/html"
            multiple
            onChange={(e) => {
              handleAddNewHtmls(e.target.files);
              if (e.target) e.target.value = '';
            }}
          />

          {/* Modal Top Chrome */}
          <div className="flex items-center justify-between border-b border-[#EBE7E0]/80 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/60 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1A1815] uppercase tracking-wider font-mono">
                Edit Sticky Note
              </span>
              <span className="text-[11px] font-mono text-[#8C8476]">
                • {timeAgo(note.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Pin Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setPinned(!pinned)}
                className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-colors ${
                  pinned
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-[#8C8476] hover:text-[#1A1815] hover:bg-black/5'
                }`}
                title={pinned ? 'Unpin note' : 'Pin note to top'}
              >
                <Pin className={`w-3.5 h-3.5 ${pinned ? 'fill-amber-700 text-amber-700' : ''}`} />
                <span>{pinned ? 'Pinned' : 'Pin'}</span>
              </motion.button>

              {/* Close Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#8C8476] hover:text-[#1A1815] hover:bg-black/5 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-4 sm:p-6 space-y-4">
          
          {/* Note Title Input (text-base prevents iOS auto-zoom) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8C8476] uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your note a title..."
              className="w-full bg-white/70 border border-[#DDD7CD] rounded-lg px-3 py-2 text-base sm:text-sm font-semibold text-[#1A1815] placeholder-[#B8B0A2] outline-none focus:border-[#8C8476] transition-colors"
            />
          </div>

          {/* Note Body Textarea (text-base prevents iOS auto-zoom, auto-resizing with cap) */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8C8476] uppercase tracking-wider mb-1">
              Note Content
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note, instructions, or clipboard text here..."
              className="w-full bg-white/70 border border-[#DDD7CD] rounded-lg p-3 text-base sm:text-sm text-[#1A1815] placeholder-[#8C8476] outline-none focus:border-[#8C8476] resize-none leading-relaxed font-normal overflow-y-auto min-h-[84px] max-h-[280px]"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 pt-2 border-t border-[#EBE7E0]/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[#8C8476] uppercase tracking-wider">
                Attachments
              </span>
              
              {/* Attachment Plus Menu */}
              <div className="relative" ref={attachMenuRef}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShowAttachMenu((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-colors shrink-0 min-h-[30px] sm:min-h-0 ${
                    showAttachMenu || showLinkInput || linkUrl || totalImagesCount > 0 || totalPdfsCount > 0 || totalMdsCount > 0 || totalHtmlsCount > 0
                      ? 'bg-[#1A1815] text-white shadow-xs'
                      : 'text-[#4D473E] bg-white/70 hover:bg-[#F4F2EE] border border-[#DDD7CD]'
                  }`}
                  title="Attach file, link, or media"
                >
                  <Plus className={`w-3.5 h-3.5 transition-transform duration-150 ${showAttachMenu ? 'rotate-45' : ''}`} />
                  <span>Attach</span>
                  {(linkUrl || totalImagesCount > 0 || totalPdfsCount > 0 || totalMdsCount > 0 || totalHtmlsCount > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </motion.button>

                {/* Attachment Options Dialogue Box / Dropdown */}
                <AnimatePresence>
                  {showAttachMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -6 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-white border border-[#DDD7CD] rounded-xl shadow-elevated p-1.5 space-y-1 select-none"
                    >
                      {/* Link Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowLinkInput(true);
                          setShowAttachMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-[#1A1815] hover:bg-[#F4F2EE] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-[#8C8476]" />
                          <span>Attach Link</span>
                        </div>
                        {linkUrl.trim() && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      </button>

                      {/* Images Option */}
                      <button
                        type="button"
                        disabled={totalImagesCount >= ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE}
                        onClick={() => {
                          imageInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          totalImagesCount >= ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE
                            ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                            : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-[#8C8476]" />
                          <span>Images</span>
                        </div>
                        <span className={`text-[10px] font-mono ${totalImagesCount > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                          {totalImagesCount}/{ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE}
                        </span>
                      </button>

                      {/* PDFs Option */}
                      <button
                        type="button"
                        disabled={totalPdfsCount >= ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE}
                        onClick={() => {
                          pdfInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          totalPdfsCount >= ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE
                            ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                            : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-[#8C8476]" />
                          <span>PDF Documents</span>
                        </div>
                        <span className={`text-[10px] font-mono ${totalPdfsCount > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                          {totalPdfsCount}/{ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE}
                        </span>
                      </button>

                      {/* Markdown Option */}
                      <button
                        type="button"
                        disabled={totalMdsCount >= ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE}
                        onClick={() => {
                          mdInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          totalMdsCount >= ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE
                            ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                            : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-[#8C8476]" />
                          <span>Markdown (.md)</span>
                        </div>
                        <span className={`text-[10px] font-mono ${totalMdsCount > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                          {totalMdsCount}/{ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE}
                        </span>
                      </button>

                      {/* HTML Option */}
                      <button
                        type="button"
                        disabled={totalHtmlsCount >= ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE}
                        onClick={() => {
                          htmlInputRef.current?.click();
                          setShowAttachMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                          totalHtmlsCount >= ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE
                            ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                            : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CodeXml className="w-4 h-4 text-orange-600" />
                          <span>HTML Webpage (.html)</span>
                        </div>
                        <span className={`text-[10px] font-mono ${totalHtmlsCount > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                          {totalHtmlsCount}/{ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE}
                        </span>
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-[#EBE7E0] my-1" />

                      {/* Google Drive Option */}
                      <a
                        href="https://drive.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setShowLinkInput(true);
                          setShowAttachMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-[#1A1815] hover:bg-[#F4F2EE] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-amber-700" />
                          <span>Google Drive (Backup)</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-[#8C8476]" />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Google Drive Backup Guidance Strip */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/[0.02] border border-[#DDD7CD]/70 text-[11px] text-[#6E675F] gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <HardDrive className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="truncate">
                  For large/bulk files: Upload to Drive & paste link.
                </span>
              </div>
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowLinkInput(true)}
                className="shrink-0 flex items-center gap-1 font-medium text-amber-800 hover:text-amber-950 hover:underline ml-2"
                title="Open Google Drive to upload files"
              >
                <span>Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Link Field */}
            {(showLinkInput || linkUrl) && (
              <div className="flex items-center gap-2 bg-white/90 border border-[#DDD7CD] rounded-lg px-3 py-2 shadow-2xs">
                <Link2 className="w-4 h-4 text-[#8C8476] shrink-0" />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Paste URL or Google Drive link (https://drive.google.com/...)"
                  className="w-full bg-transparent text-base sm:text-xs text-[#1A1815] placeholder-[#8C8476] outline-none font-mono"
                />
                {linkUrl && isUrl(linkUrl) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      linkUrl.includes('drive.google.com') 
                        ? 'bg-amber-100 text-amber-900 font-medium' 
                        : 'bg-[#F4F2EE] text-[#8C8476]'
                    }`}>
                      {linkUrl.includes('drive.google.com') ? 'Google Drive' : extractDomain(linkUrl)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 hover:text-[#1A1815] transition-colors"
                      title="Copy URL"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#8C8476]" />}
                    </button>
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-[#8C8476] hover:text-[#B45309]"
                      title="Visit link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setLinkUrl('');
                    setShowLinkInput(false);
                  }}
                  className="p-1 text-[#8C8476] hover:text-rose-700"
                  title="Remove link"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Multiple Images List */}
            {totalImagesCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>Attached Images ({totalImagesCount}/{ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE})</span>
                  {totalImagesCount < ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE ? (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-[#B45309] hover:underline flex items-center gap-0.5 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add more</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-mono">Max limit reached</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Existing uploaded images */}
                  {existingImages.map((img, idx) => (
                    <div 
                      key={`existing_img_${img.url}_${idx}`}
                      className="relative group p-1.5 rounded-lg bg-white/90 border border-[#DDD7CD] shadow-2xs flex items-center gap-2 overflow-hidden"
                    >
                      <div className="relative group/thumb w-10 h-10 rounded overflow-hidden shrink-0">
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onOpenImageLightbox(img.url, img.name)}
                          className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white"
                          title="View image"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="truncate flex-1 min-w-0 pr-4">
                        <p className="text-[11px] font-medium text-[#1A1815] truncate">{img.name}</p>
                        <p className="text-[9px] font-mono text-[#8C8476]">{img.size ? formatBytes(img.size) : 'Cloud Image'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="absolute right-1 top-1 p-0.5 rounded text-[#8C8476] hover:text-rose-700 hover:bg-rose-50"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* New images ready to upload */}
                  {newImages.map((item) => (
                    <div 
                      key={item.id}
                      className="relative group p-1.5 rounded-lg bg-amber-50/80 border border-amber-200/60 shadow-2xs flex items-center gap-2 overflow-hidden"
                    >
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-10 h-10 object-cover rounded shrink-0 border border-amber-200"
                      />
                      <div className="truncate flex-1 min-w-0 pr-4">
                        <p className="text-[11px] font-medium text-[#1A1815] truncate">{item.file.name}</p>
                        <p className="text-[9px] font-mono text-amber-800">New • {formatBytes(item.file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(item.id)}
                        className="absolute right-1 top-1 p-0.5 rounded text-[#8C8476] hover:text-rose-700 hover:bg-rose-50"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple PDFs List */}
            {totalPdfsCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>Attached PDFs ({totalPdfsCount}/{ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE})</span>
                  {totalPdfsCount < ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE ? (
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="text-[#B45309] hover:underline flex items-center gap-0.5 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add more</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-mono">Max limit reached</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Existing PDFs */}
                  {existingPdfs.map((pdf, idx) => (
                    <div 
                      key={`existing_pdf_${pdf.url}_${idx}`}
                      className="p-2 rounded-lg bg-white/90 border border-[#DDD7CD] flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-[#FAF4F4] border border-[#EFE1E1] flex items-center justify-center text-rose-700 shrink-0">
                          <FileCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate">{pdf.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8476]">{pdf.size ? formatBytes(pdf.size) : 'PDF Document'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-[#8C8476] hover:text-[#1A1815] rounded hover:bg-[#F4F2EE]"
                          title="Open PDF"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingPdf(idx)}
                          className="p-1 text-[#8C8476] hover:text-rose-700 rounded hover:bg-rose-50"
                          title="Remove PDF"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* New PDFs */}
                  {newPdfFiles.map((file, idx) => (
                    <div 
                      key={`new_pdf_${file.name}_${idx}`}
                      className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-[#FAF4F4] border border-[#EFE1E1] flex items-center justify-center text-rose-700 shrink-0">
                          <FileCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate">{file.name}</p>
                          <p className="text-[10px] font-mono text-amber-800">New • {formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPdf(idx)}
                        className="p-1 text-[#8C8476] hover:text-rose-700 rounded hover:bg-rose-50"
                        title="Remove PDF"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple MDs List */}
            {totalMdsCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>Attached .MD Files ({totalMdsCount}/{ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE})</span>
                  {totalMdsCount < ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE ? (
                    <button
                      type="button"
                      onClick={() => mdInputRef.current?.click()}
                      className="text-[#B45309] hover:underline flex items-center gap-0.5 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add more</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-mono">Max limit reached</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Existing MDs */}
                  {existingMds.map((md, idx) => (
                    <div 
                      key={`existing_md_${md.url}_${idx}`}
                      className="p-2 rounded-lg bg-white/90 border border-[#DDD7CD] flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-[#F4F5F7] border border-[#E2E5EB] flex items-center justify-center text-indigo-700 shrink-0">
                          <FileCode className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate font-mono">{md.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8476]">{md.size ? formatBytes(md.size) : 'Markdown'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={md.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-[#8C8476] hover:text-[#1A1815] rounded hover:bg-[#F4F2EE]"
                          title="Open Markdown"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingMd(idx)}
                          className="p-1 text-[#8C8476] hover:text-rose-700 rounded hover:bg-rose-50"
                          title="Remove Markdown"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* New MDs */}
                  {newMdFiles.map((file, idx) => (
                    <div 
                      key={`new_md_${file.name}_${idx}`}
                      className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-[#F4F5F7] border border-[#E2E5EB] flex items-center justify-center text-indigo-700 shrink-0">
                          <FileCode className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate font-mono">{file.name}</p>
                          <p className="text-[10px] font-mono text-amber-800">New • {formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewMd(idx)}
                        className="p-1 text-[#8C8476] hover:text-rose-700 rounded hover:bg-rose-50"
                        title="Remove Markdown"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Attached HTML Files (Existing + New) */}
            {totalHtmlsCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>HTML Webpages ({totalHtmlsCount}/{ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE})</span>
                  {totalHtmlsCount < ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE && (
                    <button
                      type="button"
                      onClick={() => htmlInputRef.current?.click()}
                      className="text-[#B45309] hover:underline flex items-center gap-0.5 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add more</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Existing HTMLs */}
                  {existingHtmls.map((html, idx) => (
                    <div 
                      key={`exist_html_${html.name}_${idx}`}
                      className="p-2 rounded-lg bg-white/80 border border-[#DDD7CD] flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
                          <CodeXml className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate font-mono">{html.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8476]">{formatBytes(html.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={html.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-[#8C8476] hover:text-[#1A1815] rounded hover:bg-[#F4F2EE]"
                          title="Open HTML file"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingHtml(idx)}
                          className="p-1 text-[#8C8476] hover:text-rose-700 rounded hover:bg-rose-50"
                          title="Remove HTML file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* New HTMLs */}
                  {newHtmlFiles.map((file, idx) => (
                    <div 
                      key={`new_html_${file.name}_${idx}`}
                      className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
                          <CodeXml className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate font-mono">{file.name}</p>
                          <p className="text-[10px] font-mono text-amber-800">New • {formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewHtml(idx)}
                        className="p-1 text-[#8C8476] hover:text-rose-700 rounded hover:bg-rose-50"
                        title="Remove HTML file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Color Tint Selector */}
          <div className="pt-2 border-t border-[#EBE7E0]/70 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8C8476] uppercase tracking-wider">
              Stationery Color
            </span>
            <div className="flex items-center gap-2">
              {(Object.keys(NOTE_COLOR_MAP) as NoteColor[]).map((cKey) => {
                const config = NOTE_COLOR_MAP[cKey];
                const isSelected = color === cKey;
                return (
                  <motion.button
                    key={cKey}
                    type="button"
                    whileHover={{ scale: 1.22 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setColor(cKey)}
                    aria-label={config.label}
                    title={config.label}
                    className={`w-6 h-6 rounded-full border transition-shadow ${config.border} ${
                      isSelected ? 'ring-2 ring-[#1A1815]/40 shadow-sm' : 'opacity-75'
                    }`}
                    style={{ backgroundColor: config.swatch }}
                  />
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="border-t border-[#EBE7E0]/80 px-4 sm:px-6 py-3 sm:py-3.5 bg-white/80 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
          {/* Delete Action */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this note?')) {
                onDelete(note.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-900 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-rose-50 transition-colors min-h-[38px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </motion.button>

          {/* Cancel and Save */}
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-3.5 py-2 sm:py-1.5 rounded-lg border border-[#DDD7CD] hover:border-[#8C8476] text-xs font-medium text-[#4D473E] hover:text-[#1A1815] transition-colors min-h-[38px]"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg bg-[#1A1815] text-white text-xs font-medium hover:bg-[#2F2B26] shadow-paper disabled:opacity-40 transition-all min-h-[38px]"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </motion.button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};
