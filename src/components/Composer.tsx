import React, { useState, useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Image as ImageIcon,
  FileCheck,
  Pin,
  Send,
  X,
  FileIcon,
  Plus,
  AlertCircle,
  HardDrive,
  ExternalLink,
  FileCode,
  CodeXml
} from 'lucide-react';
import type { NoteColor, NewNotePayload } from '../types';
import { isUrl, extractDomain, formatBytes, NOTE_COLOR_MAP, ATTACHMENT_LIMITS } from '../lib/utils';

interface ComposerProps {
  onAddNote: (payload: NewNotePayload) => Promise<void>;
  isSubmitting: boolean;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

export const Composer: React.FC<ComposerProps> = ({ onAddNote, isSubmitting }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('linen');
  const [isPinned, setIsPinned] = useState(false);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Multiple Images & Multiple PDFs & Multiple MDs & HTML files
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [mdFiles, setMdFiles] = useState<File[]>([]);
  const [htmlFiles, setHtmlFiles] = useState<File[]>([]);
  const [limitNotice, setLimitNotice] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Clean image previews on unmount
  useEffect(() => {
    return () => {
      imageItems.forEach((item) => {
        if (item.preview.startsWith('blob:')) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [imageItems]);

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

  // Auto-adjust textarea height as user types, capped at 260px
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 72), 260);
    textarea.style.height = `${nextHeight}px`;
  }, [content]);

  const showTemporaryNotice = (msg: string) => {
    setLimitNotice(msg);
    setTimeout(() => {
      setLimitNotice((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Global paste handler to intercept clipboard images or links seamlessly
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement instanceof HTMLInputElement;
      if (isInput) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            if (imageItems.length >= ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE) {
              showTemporaryNotice(`Max ${ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE} images reached. Upload extra files to Google Drive.`);
              return;
            }
            if (blob.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES) {
              showTemporaryNotice('Image exceeds 25 MB limit. Upload to Google Drive and paste link.');
              return;
            }

            const pastedFile = new File([blob], `Pasted-Image-${Date.now()}.png`, { type: blob.type });
            const preview = URL.createObjectURL(pastedFile);
            setImageItems((prev) => [
              ...prev,
              { id: `img_${Date.now()}_${Math.random()}`, file: pastedFile, preview },
            ]);
            return;
          }
        }
      }

      // If user pasted a URL and link input is not visible yet, auto-populate it
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && isUrl(pastedText.trim()) && !linkUrl.trim()) {
        setShowLinkInput(true);
        setLinkUrl(pastedText.trim());
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [linkUrl, imageItems.length]);

  // Add selected images with limit checking
  const handleAddImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE - imageItems.length;

    if (remainingSlots <= 0) {
      showTemporaryNotice(`Max ${ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE} images reached. Upload extra files to Google Drive.`);
      return;
    }

    const newItems: ImageItem[] = [];
    let oversizeCount = 0;

    for (let i = 0; i < files.length && newItems.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES) {
        oversizeCount++;
        continue;
      }
      if (file.type.startsWith('image/')) {
        newItems.push({
          id: `img_${Date.now()}_${i}_${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }

    if (files.length > remainingSlots) {
      showTemporaryNotice(`Added ${remainingSlots} images (max reached). Upload remaining to Google Drive.`);
    } else if (oversizeCount > 0) {
      showTemporaryNotice('Files >25 MB skipped. Upload larger files to Google Drive and paste link.');
    }

    setImageItems((prev) => [...prev, ...newItems]);
  };

  const handleRemoveImage = (id: string) => {
    setImageItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target && target.preview.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Add selected PDFs with limit checking
  const handleAddPdfs = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE - pdfFiles.length;

    if (remainingSlots <= 0) {
      showTemporaryNotice(`Max ${ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE} PDFs reached. Upload extra files to Google Drive.`);
      return;
    }

    const newPdfs: File[] = [];
    let oversizeCount = 0;

    for (let i = 0; i < files.length && newPdfs.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES) {
        oversizeCount++;
        continue;
      }
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        newPdfs.push(file);
      }
    }

    if (files.length > remainingSlots) {
      showTemporaryNotice(`Added ${remainingSlots} PDFs (max reached). Upload remaining to Google Drive.`);
    } else if (oversizeCount > 0) {
      showTemporaryNotice('Files >25 MB skipped. Upload larger files to Google Drive and paste link.');
    }

    setPdfFiles((prev) => [...prev, ...newPdfs]);
  };

  const handleRemovePdf = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Add selected MDs with limit checking
  const handleAddMds = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE - mdFiles.length;

    if (remainingSlots <= 0) {
      showTemporaryNotice(`Max ${ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE} .md files reached. Upload extra files to Google Drive.`);
      return;
    }

    const newMds: File[] = [];
    let oversizeCount = 0;

    for (let i = 0; i < files.length && newMds.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES) {
        oversizeCount++;
        continue;
      }
      if (file.name.endsWith('.md') || file.type === 'text/markdown' || file.name.endsWith('.markdown')) {
        newMds.push(file);
      }
    }

    if (files.length > remainingSlots) {
      showTemporaryNotice(`Added ${remainingSlots} .md files (max reached). Upload remaining to Google Drive.`);
    } else if (oversizeCount > 0) {
      showTemporaryNotice('Files >25 MB skipped. Upload larger files to Google Drive and paste link.');
    }

    setMdFiles((prev) => [...prev, ...newMds]);
  };

  const handleRemoveMd = (index: number) => {
    setMdFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddHtmls = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE - htmlFiles.length;

    if (remainingSlots <= 0) {
      showTemporaryNotice(`Max ${ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE} HTML files reached. Upload extra files to Google Drive.`);
      return;
    }

    const newHtmls: File[] = [];
    let oversizeCount = 0;

    for (let i = 0; i < files.length && newHtmls.length < remainingSlots; i++) {
      const file = files[i];
      if (file.size > ATTACHMENT_LIMITS.MAX_FILE_SIZE_BYTES) {
        oversizeCount++;
        continue;
      }
      if (file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type === 'text/html') {
        newHtmls.push(file);
      }
    }

    if (files.length > remainingSlots) {
      showTemporaryNotice(`Added ${remainingSlots} HTML files (max reached). Upload remaining to Google Drive.`);
    } else if (oversizeCount > 0) {
      showTemporaryNotice('Files >25 MB skipped. Upload larger files to Google Drive and paste link.');
    }

    setHtmlFiles((prev) => [...prev, ...newHtmls]);
  };

  const handleRemoveHtml = (index: number) => {
    setHtmlFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const imgList: File[] = [];
      const pdfList: File[] = [];
      const mdList: File[] = [];
      const htmlList: File[] = [];

      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const droppedFile = e.dataTransfer.files[i];
        if (droppedFile.type.startsWith('image/')) {
          imgList.push(droppedFile);
        } else if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
          pdfList.push(droppedFile);
        } else if (droppedFile.name.endsWith('.md') || droppedFile.type === 'text/markdown' || droppedFile.name.endsWith('.markdown')) {
          mdList.push(droppedFile);
        } else if (droppedFile.name.endsWith('.html') || droppedFile.name.endsWith('.htm') || droppedFile.type === 'text/html') {
          htmlList.push(droppedFile);
        }
      }

      if (imgList.length > 0) {
        const remainingImgSlots = ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE - imageItems.length;
        const toAdd = imgList.slice(0, Math.max(0, remainingImgSlots));
        if (toAdd.length > 0) {
          const newItems: ImageItem[] = toAdd.map((file, idx) => ({
            id: `img_drop_${Date.now()}_${idx}`,
            file,
            preview: URL.createObjectURL(file),
          }));
          setImageItems((prev) => [...prev, ...newItems]);
        }
        if (imgList.length > remainingImgSlots) {
          showTemporaryNotice(`Images capped at ${ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE} max. Upload more to Google Drive.`);
        }
      }

      if (pdfList.length > 0) {
        const remainingPdfSlots = ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE - pdfFiles.length;
        const toAdd = pdfList.slice(0, Math.max(0, remainingPdfSlots));
        if (toAdd.length > 0) {
          setPdfFiles((prev) => [...prev, ...toAdd]);
        }
        if (pdfList.length > remainingPdfSlots) {
          showTemporaryNotice(`PDFs capped at ${ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE} max. Upload more to Google Drive.`);
        }
      }

      if (mdList.length > 0) {
        const remainingMdSlots = ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE - mdFiles.length;
        const toAdd = mdList.slice(0, Math.max(0, remainingMdSlots));
        if (toAdd.length > 0) {
          setMdFiles((prev) => [...prev, ...toAdd]);
        }
        if (mdList.length > remainingMdSlots) {
          showTemporaryNotice(`.md files capped at ${ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE} max. Upload more to Google Drive.`);
        }
      }

      if (htmlList.length > 0) {
        const remainingHtmlSlots = ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE - htmlFiles.length;
        const toAdd = htmlList.slice(0, Math.max(0, remainingHtmlSlots));
        if (toAdd.length > 0) {
          setHtmlFiles((prev) => [...prev, ...toAdd]);
        }
        if (htmlList.length > remainingHtmlSlots) {
          showTemporaryNotice(`HTML files capped at ${ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE} max. Upload more to Google Drive.`);
        }
      }
    }
  };

  // Validate if anything is ready to submit
  const canSubmit = Boolean(
    content.trim() ||
    title.trim() ||
    linkUrl.trim() ||
    imageItems.length > 0 ||
    pdfFiles.length > 0 ||
    mdFiles.length > 0 ||
    htmlFiles.length > 0
  );

  // Submit note
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || !canSubmit) return;

    let finalLink = linkUrl.trim();
    if (finalLink && !finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
      finalLink = `https://${finalLink}`;
    }

    try {
      await onAddNote({
        title: title.trim() || undefined,
        content: content.trim() || (finalLink ? finalLink : 'Note'),
        color: selectedColor,
        pinned: isPinned,
        link_url: finalLink || undefined,
        image_files: imageItems.map((item) => item.file),
        pdf_files: pdfFiles,
        md_files: mdFiles,
        html_files: htmlFiles,
      });

      // Reset form
      setTitle('');
      setContent('');
      setLinkUrl('');
      setShowLinkInput(false);
      imageItems.forEach((item) => {
        if (item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      });
      setImageItems([]);
      setPdfFiles([]);
      setMdFiles([]);
      setHtmlFiles([]);
      setIsPinned(false);
    } catch (err) {
      console.error('Failed to submit note:', err);
    }
  };

  // Handle Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentColorConfig = NOTE_COLOR_MAP[selectedColor];
  const isImageLimitReached = imageItems.length >= ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE;
  const isPdfLimitReached = pdfFiles.length >= ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE;
  const isMdLimitReached = mdFiles.length >= ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE;
  const isHtmlLimitReached = htmlFiles.length >= ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border transition-all duration-200 shadow-paper relative overflow-visible ${currentColorConfig.bg
        } ${currentColorConfig.border} ${isDragging ? 'ring-2 ring-amber-500 border-amber-500 scale-[1.005]' : ''
        }`}
    >
      {/* Top Composer Header: Quick actions & Pin toggle */}
      <div className="flex items-center justify-between border-b border-[#EBE7E0]/80 px-3 sm:px-4 py-2 bg-white/50 gap-2 relative z-30 rounded-t-xl">

        {/* Attachment Adders Menu via Plus Button */}
        <div className="relative z-40" ref={attachMenuRef}>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowAttachMenu((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-colors shrink-0 min-h-[32px] sm:min-h-0 ${
              showAttachMenu || showLinkInput || linkUrl.trim() || imageItems.length > 0 || pdfFiles.length > 0 || mdFiles.length > 0 || htmlFiles.length > 0
                ? 'bg-[#1A1815] text-white shadow-xs'
                : 'text-[#4D473E] bg-[#F4F2EE] hover:bg-[#EBE7E0] active:bg-[#E2DED6]'
            }`}
            title="Attach file, link, or media"
          >
            <Plus className={`w-3.5 h-3.5 transition-transform duration-150 ${showAttachMenu ? 'rotate-45' : ''}`} />
            <span>Attach</span>
            {(linkUrl.trim() || imageItems.length > 0 || pdfFiles.length > 0 || mdFiles.length > 0 || htmlFiles.length > 0) && (
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
                className="absolute left-0 top-full mt-1.5 z-50 w-60 bg-white border border-[#DDD7CD] rounded-xl shadow-elevated p-1.5 space-y-1 select-none"
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
                  disabled={isImageLimitReached}
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isImageLimitReached
                      ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                      : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#8C8476]" />
                    <span>Images</span>
                  </div>
                  <span className={`text-[10px] font-mono ${imageItems.length > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                    {imageItems.length}/{ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE}
                  </span>
                </button>

                {/* PDFs Option */}
                <button
                  type="button"
                  disabled={isPdfLimitReached}
                  onClick={() => {
                    pdfInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isPdfLimitReached
                      ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                      : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#8C8476]" />
                    <span>PDF Documents</span>
                  </div>
                  <span className={`text-[10px] font-mono ${pdfFiles.length > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                    {pdfFiles.length}/{ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE}
                  </span>
                </button>

                {/* Markdown Option */}
                <button
                  type="button"
                  disabled={isMdLimitReached}
                  onClick={() => {
                    mdInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isMdLimitReached
                      ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                      : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#8C8476]" />
                    <span>Markdown (.md)</span>
                  </div>
                  <span className={`text-[10px] font-mono ${mdFiles.length > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                    {mdFiles.length}/{ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE}
                  </span>
                </button>

                {/* HTML Option */}
                <button
                  type="button"
                  disabled={isHtmlLimitReached}
                  onClick={() => {
                    htmlInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isHtmlLimitReached
                      ? 'text-[#8C8476] opacity-50 cursor-not-allowed'
                      : 'text-[#1A1815] hover:bg-[#F4F2EE]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CodeXml className="w-4 h-4 text-orange-600" />
                    <span>HTML Webpage (.html)</span>
                  </div>
                  <span className={`text-[10px] font-mono ${htmlFiles.length > 0 ? 'text-amber-600 font-bold' : 'text-[#8C8476]'}`}>
                    {htmlFiles.length}/{ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE}
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

        {/* Pin to top button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsPinned(!isPinned)}
          className={`flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-md text-xs transition-colors shrink-0 min-h-[32px] sm:min-h-0 ${isPinned
            ? 'bg-amber-100 text-amber-800 font-medium'
            : 'text-[#8C8476] hover:text-[#1A1815] hover:bg-[#F4F2EE]'
            }`}
          title={isPinned ? 'Note will be pinned to top' : 'Pin note to top'}
        >
          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-700 text-amber-700' : ''}`} />
          <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin'}</span>
        </motion.button>
      </div>

      {/* Hidden File Inputs (enforced via accept & multiple) */}
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={(e) => {
          handleAddImages(e.target.files);
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
          handleAddPdfs(e.target.files);
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
          handleAddMds(e.target.files);
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
          handleAddHtmls(e.target.files);
          if (e.target) e.target.value = '';
        }}
      />

      {/* Limit Notice banner if user exceeded cap */}
      <AnimatePresence>
        {limitNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-amber-50/95 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="truncate">{limitNotice}</span>
            </div>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowLinkInput(true)}
              className="shrink-0 flex items-center gap-1 font-semibold text-amber-900 underline hover:text-amber-950 text-[11px]"
            >
              <span>Upload to Drive ↗</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Composer Content Area */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Optional Title (text-base on mobile prevents iOS safari auto-zoom) */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Note title (optional)"
          className="w-full bg-transparent text-base sm:text-sm font-semibold text-[#1A1815] placeholder-[#B8B0A2] outline-none border-b border-transparent focus:border-[#DDD7CD] pb-1 transition-colors tracking-tight"
        />

        {/* Note Body Textarea (text-base on mobile prevents iOS safari auto-zoom, auto-resizing with cap) */}
        <div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your note, thoughts, instructions, or paste anything (Ctrl+V)..."
            className="w-full bg-transparent text-base sm:text-sm text-[#1A1815] placeholder-[#8C8476] outline-none resize-none leading-relaxed overflow-y-auto min-h-[72px] max-h-[260px]"
          />
        </div>

        {/* Active Attachments Drawer with AnimatePresence */}
        <AnimatePresence>
          {(showLinkInput || linkUrl.trim() || imageItems.length > 0 || pdfFiles.length > 0 || mdFiles.length > 0 || htmlFiles.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="pt-2 border-t border-[#EBE7E0]/70 space-y-2.5 overflow-hidden"
            >

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
                className="shrink-0 flex items-center gap-1 font-medium text-amber-800 hover:text-amber-950 hover:underline text-[11px]"
                title="Open Google Drive to upload files"
              >
                <span>Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Link Input Field */}
            {(showLinkInput || linkUrl.trim()) && (
              <div className="flex items-center gap-2 bg-white/90 border border-[#DDD7CD] rounded-lg px-3 py-2 shadow-2xs">
                <Link2 className="w-4 h-4 text-[#8C8476] shrink-0" />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste URL or Google Drive link..."
                  className="w-full bg-transparent text-base sm:text-xs text-[#1A1815] placeholder-[#8C8476] outline-none font-mono"
                  autoFocus
                />
                {linkUrl && isUrl(linkUrl) && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 hidden sm:inline-block ${linkUrl.includes('drive.google.com')
                    ? 'bg-amber-100 text-amber-900 font-medium'
                    : 'bg-[#F4F2EE] text-[#8C8476]'
                    }`}>
                    {linkUrl.includes('drive.google.com') ? 'Google Drive' : extractDomain(linkUrl)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setLinkUrl('');
                    setShowLinkInput(false);
                  }}
                  className="text-[#8C8476] hover:text-rose-700 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                  title="Remove link"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Multiple Attached Images List */}
            {imageItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>
                    Images ({imageItems.length}/{ATTACHMENT_LIMITS.MAX_IMAGES_PER_NOTE})
                  </span>
                  {!isImageLimitReached ? (
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
                  {imageItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative group p-1.5 rounded-lg bg-white/90 border border-[#DDD7CD] shadow-2xs flex items-center gap-2 overflow-hidden"
                    >
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-9 h-9 object-cover rounded border border-[#EBE7E0] shrink-0"
                      />
                      <div className="truncate flex-1 min-w-0 pr-4">
                        <p className="text-[11px] font-medium text-[#1A1815] truncate">{item.file.name}</p>
                        <p className="text-[10px] font-mono text-[#8C8476]">{formatBytes(item.file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(item.id)}
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

            {/* Multiple Attached HTML Files List */}
            {htmlFiles.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>
                    HTML Webpages ({htmlFiles.length}/{ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE})
                  </span>
                  {!isHtmlLimitReached ? (
                    <button
                      type="button"
                      onClick={() => htmlInputRef.current?.click()}
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
                  {htmlFiles.map((file, idx) => (
                    <div
                      key={`html_${file.name}_${idx}`}
                      className="relative group p-2 rounded-lg bg-white/90 border border-[#DDD7CD] shadow-2xs flex items-center justify-between gap-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
                          <CodeXml className="w-4 h-4" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate font-mono">{file.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8476]">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHtml(idx)}
                        className="p-1 rounded text-[#8C8476] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Remove HTML file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Attached PDFs List */}
            {pdfFiles.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>
                    PDFs ({pdfFiles.length}/{ATTACHMENT_LIMITS.MAX_PDFS_PER_NOTE})
                  </span>
                  {!isPdfLimitReached ? (
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
                  {pdfFiles.map((file, idx) => (
                    <div
                      key={`pdf_${file.name}_${idx}`}
                      className="relative group p-2 rounded-lg bg-white/90 border border-[#DDD7CD] shadow-2xs flex items-center justify-between gap-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-[#FAF4F4] border border-[#EFE1E1] flex items-center justify-center text-rose-700 shrink-0">
                          <FileIcon className="w-4 h-4" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate">{file.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8476]">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePdf(idx)}
                        className="p-1 rounded text-[#8C8476] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Remove PDF"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Attached MDs List */}
            {mdFiles.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>
                    .MD Files ({mdFiles.length}/{ATTACHMENT_LIMITS.MAX_MDS_PER_NOTE})
                  </span>
                  {!isMdLimitReached ? (
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
                  {mdFiles.map((file, idx) => (
                    <div
                      key={`md_${file.name}_${idx}`}
                      className="relative group p-2 rounded-lg bg-white/90 border border-[#DDD7CD] shadow-2xs flex items-center justify-between gap-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-[#F4F5F7] border border-[#E2E5EB] flex items-center justify-center text-indigo-700 shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate font-mono">{file.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8476]">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMd(idx)}
                        className="p-1 rounded text-[#8C8476] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Remove Markdown file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multiple Attached HTML Files List */}
            {htmlFiles.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C8476] font-medium px-0.5">
                  <span>
                    HTML Webpages ({htmlFiles.length}/{ATTACHMENT_LIMITS.MAX_HTMLS_PER_NOTE})
                  </span>
                  {!isHtmlLimitReached ? (
                    <button
                      type="button"
                      onClick={() => htmlInputRef.current?.click()}
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
                  {htmlFiles.map((file, idx) => (
                    <div
                      key={`html_${file.name}_${idx}`}
                      className="relative group p-2 rounded-lg bg-white/90 border border-[#DDD7CD] shadow-2xs flex items-center justify-between gap-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className="w-7 h-7 rounded bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600 shrink-0">
                          <CodeXml className="w-4 h-4" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-[#1A1815] truncate font-mono">{file.name}</p>
                          <p className="text-[10px] font-mono text-[#8C8476]">{formatBytes(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHtml(idx)}
                        className="p-1 rounded text-[#8C8476] hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Remove HTML file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      </div>

      {/* Bottom Action Footer: Stationery Color Swatches & Submit */}
      <div className="flex items-center justify-between border-t border-[#EBE7E0]/80 px-3 sm:px-4 py-2.5 bg-white/40 gap-3 rounded-b-xl">

        {/* Subtle Stationery Color Swatches (larger touch targets on mobile) */}
        <div className="flex items-center gap-2 sm:gap-1.5" title="Note paper color">
          {(Object.keys(NOTE_COLOR_MAP) as NoteColor[]).map((cKey) => {
            const config = NOTE_COLOR_MAP[cKey];
            const isSelected = selectedColor === cKey;
            return (
              <motion.button
                key={cKey}
                type="button"
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => setSelectedColor(cKey)}
                aria-label={config.label}
                title={config.label}
                className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full border transition-all touch-manipulation ${config.border} ${isSelected ? 'scale-125 ring-2 ring-[#1A1815]/30 shadow-sm' : 'opacity-80'
                  }`}
                style={{ backgroundColor: config.swatch }}
              />
            );
          })}
        </div>

        {/* Submit Button & Shortcut hint */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-[#8C8476] hidden md:inline">
            Ctrl + Enter
          </span>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSubmitting || !canSubmit}
            onClick={() => handleSubmit()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg bg-[#1A1815] hover:bg-[#2F2B26] text-white text-xs font-medium shadow-paper disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[36px]"
          >
            <Send className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">{isSubmitting ? 'Syncing...' : 'Add Note'}</span>
          </motion.button>
        </div>

      </div>
    </div>
  );
};
