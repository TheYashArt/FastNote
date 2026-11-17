import React, { useState } from 'react';
import { 
  Pin, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Link2, 
  Image as ImageIcon, 
  FileCheck, 
  Download, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Maximize2,
  Pencil,
  HardDrive
} from 'lucide-react';
import type { Note } from '../types';
import { extractDomain, formatBytes, timeAgo, NOTE_COLOR_MAP } from '../lib/utils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onOpenImageLightbox: (imageUrl: string, title?: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenImageLightbox,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const colorConfig = NOTE_COLOR_MAP[note.color] || NOTE_COLOR_MAP.linen;

  // Resolve multi-attachments
  const linkAttachment = note.attachments?.link || (note.type === 'link' ? note.content : undefined);
  const isGoogleDriveLink = Boolean(
    linkAttachment && 
    (linkAttachment.includes('drive.google.com') || linkAttachment.includes('docs.google.com'))
  );
  
  const imagesList = note.attachments?.images && note.attachments.images.length > 0
    ? note.attachments.images
    : note.attachments?.image
    ? [note.attachments.image]
    : note.type === 'image' && note.file_url
    ? [{ url: note.file_url, name: note.file_name || 'image.png', size: note.file_size }]
    : [];

  const pdfsList = note.attachments?.pdfs && note.attachments.pdfs.length > 0
    ? note.attachments.pdfs
    : note.attachments?.pdf
    ? [note.attachments.pdf]
    : note.type === 'pdf' && note.file_url
    ? [{ url: note.file_url, name: note.file_name || 'document.pdf', size: note.file_size }]
    : [];

  // Determine whether to display the text body
  const showTextBody = Boolean(
    note.content &&
    note.content !== linkAttachment &&
    !imagesList.some((img) => img.name === note.content) &&
    !pdfsList.some((pdf) => pdf.name === note.content) &&
    note.content !== 'Note'
  );

  const handleCopyAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const parts: string[] = [];
      if (note.title) parts.push(note.title);
      if (showTextBody) parts.push(note.content);
      if (linkAttachment) parts.push(`Link: ${linkAttachment}`);
      if (imagesList.length > 0) {
        parts.push(`Images (${imagesList.length}):\n${imagesList.map((i) => i.url).join('\n')}`);
      }
      if (pdfsList.length > 0) {
        parts.push(`PDFs (${pdfsList.length}):\n${pdfsList.map((p) => p.url).join('\n')}`);
      }

      const fullText = parts.join('\n\n') || note.content;
      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    } catch (err) {
      console.error('Failed to copy note:', err);
    }
  };

  const handleCopyLinkOnly = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const renderDeviceIcon = () => {
    switch (note.device_type) {
      case 'mobile':
        return <Smartphone className="w-3 h-3 text-[#8C8476]" />;
      case 'tablet':
        return <Tablet className="w-3 h-3 text-[#8C8476]" />;
      default:
        return <Laptop className="w-3 h-3 text-[#8C8476]" />;
    }
  };

  return (
    <article
      onClick={() => onEdit(note)}
      className={`group relative rounded-xl border p-4 transition-all duration-200 shadow-paper hover:shadow-paper-hover flex flex-col justify-between cursor-pointer overflow-hidden h-[350px] ${
        colorConfig.bg
      } ${colorConfig.border} ${
        note.pinned ? 'ring-1 ring-amber-500/30' : ''
      }`}
    >
      {/* 1. Top Meta Bar */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Attachment & Device Icons (No text labels) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {showTextBody && (
              <span 
                className={`inline-flex items-center justify-center p-1 rounded-md ${colorConfig.badge}`}
                title="Text Note"
              >
                <FileText className="w-3 h-3" />
              </span>
            )}

            {linkAttachment && (
              <span 
                className={`inline-flex items-center justify-center p-1 rounded-md ${
                  isGoogleDriveLink 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300/60' 
                    : 'bg-sky-50 text-sky-800 border border-sky-200/50'
                }`}
                title={isGoogleDriveLink ? 'Google Drive Navigation Link' : 'Contains URL Link'}
              >
                {isGoogleDriveLink ? <HardDrive className="w-3 h-3 text-amber-800" /> : <Link2 className="w-3 h-3" />}
              </span>
            )}

            {imagesList.length > 0 && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/50"
                title={`${imagesList.length} image(s)`}
              >
                <ImageIcon className="w-3 h-3" />
                {imagesList.length > 1 && (
                  <span className="text-[10px] font-mono font-semibold">{imagesList.length}</span>
                )}
              </span>
            )}

            {pdfsList.length > 0 && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200/50"
                title={`${pdfsList.length} PDF(s)`}
              >
                <FileCheck className="w-3 h-3" />
                {pdfsList.length > 1 && (
                  <span className="text-[10px] font-mono font-semibold">{pdfsList.length}</span>
                )}
              </span>
            )}

            {note.device_type && (
              <span
                className="inline-flex items-center justify-center p-1 rounded-md text-[#8C8476] bg-black/[0.03]"
                title={`Sent from ${note.device_type}`}
              >
                {renderDeviceIcon()}
              </span>
            )}

            <span className="text-[11px] font-mono text-[#8C8476] ml-0.5">
              {timeAgo(note.created_at)}
            </span>
          </div>

          {/* Right: Edit, Pin & Delete actions (accessible on mobile without hover) */}
          <div className="flex items-center gap-1 sm:gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              className="p-1.5 sm:p-1 rounded text-[#8C8476] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 hover:text-[#1A1815] hover:bg-black/5 transition-all min-w-[28px] min-h-[28px] flex items-center justify-center active:scale-90"
              title="Open and edit note"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id, note.pinned);
              }}
              className={`p-1.5 sm:p-1 rounded transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center active:scale-90 ${
                note.pinned
                  ? 'text-amber-700 hover:text-amber-800'
                  : 'text-[#8C8476] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 hover:text-[#1A1815]'
              }`}
              title={note.pinned ? 'Unpin note' : 'Pin note to top'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-amber-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1.5 sm:p-1 rounded text-[#8C8476] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:opacity-100 hover:text-rose-700 hover:bg-rose-50 transition-all min-w-[28px] min-h-[28px] flex items-center justify-center active:scale-90"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Middle Content Area (Uniform scrollable container) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-1 text-[#2F2B26]">
        {/* Note Title */}
        {note.title && (
          <h3 className="font-semibold text-sm text-[#1A1815] tracking-tight break-words">
            {note.title}
          </h3>
        )}

        {/* Note Text Body */}
        {showTextBody && (
          <div className="text-xs text-[#2F2B26] leading-relaxed whitespace-pre-wrap break-words font-normal">
            {note.content}
          </div>
        )}

        {/* Attached Link Card */}
        {linkAttachment && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`p-2 rounded-lg border space-y-1 shadow-2xs ${
              isGoogleDriveLink 
                ? 'bg-amber-50/80 border-amber-200/80' 
                : 'bg-white/80 border-[#DDD7CD]/80'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-[#8C8476] font-mono">
              <div className="flex items-center gap-1 truncate max-w-[170px]">
                {isGoogleDriveLink ? (
                  <>
                    <HardDrive className="w-3 h-3 text-amber-700 shrink-0" />
                    <span className="font-semibold text-amber-900">Google Drive</span>
                  </>
                ) : (
                  <span className="truncate">{extractDomain(linkAttachment)}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleCopyLinkOnly(e, linkAttachment)}
                  className="hover:text-[#1A1815] p-0.5 rounded transition-colors"
                  title="Copy URL"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#8C8476]" />}
                </button>
                <a
                  href={linkAttachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B45309]"
                  title={isGoogleDriveLink ? 'Open in Google Drive' : 'Open link'}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <a
              href={linkAttachment}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs font-medium text-[#1A1815] hover:text-[#B45309] truncate underline underline-offset-2"
            >
              {linkAttachment}
            </a>
          </div>
        )}

        {/* Multiple Attached Images Gallery */}
        {imagesList.length > 0 && (
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            {imagesList.length === 1 ? (
              <div className="relative group/img overflow-hidden rounded-lg border border-[#DDD7CD]/80 bg-black/5 aspect-video flex items-center justify-center">
                <img
                  src={imagesList[0].url}
                  alt={imagesList[0].name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => onOpenImageLightbox(imagesList[0].url, imagesList[0].name)}
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => onOpenImageLightbox(imagesList[0].url, imagesList[0].name)}
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                  title="Zoom image"
                >
                  <Maximize2 className="w-4 h-4 drop-shadow" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {imagesList.slice(0, 4).map((img, idx) => (
                  <div 
                    key={`${img.name}_${idx}`}
                    className="relative group/img overflow-hidden rounded-md border border-[#DDD7CD]/80 bg-black/5 aspect-4/3 flex items-center justify-center"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => onOpenImageLightbox(img.url, img.name)}
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => onOpenImageLightbox(img.url, img.name)}
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                      title="Zoom image"
                    >
                      <Maximize2 className="w-3.5 h-3.5 drop-shadow" />
                    </button>
                    {idx === 3 && imagesList.length > 4 && (
                      <div 
                        onClick={() => onOpenImageLightbox(img.url, img.name)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        +{imagesList.length - 3}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Multiple Attached PDFs List */}
        {pdfsList.length > 0 && (
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            {pdfsList.map((pdf, idx) => (
              <div 
                key={`${pdf.name}_${idx}`}
                className="p-2 rounded-lg bg-white/80 border border-[#DDD7CD]/80 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <div className="w-6 h-6 rounded bg-[#FAF4F4] border border-[#EFE1E1] flex items-center justify-center text-rose-700 shrink-0">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-[11px] font-semibold text-[#1A1815] truncate">{pdf.name}</p>
                    <p className="text-[9px] font-mono text-[#8C8476]">{formatBytes(pdf.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-[#4D473E] hover:text-[#1A1815] hover:bg-[#F4F2EE] transition-colors"
                    title="Open PDF"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={pdf.url}
                    download={pdf.name}
                    className="p-1 rounded text-[#4D473E] hover:text-[#1A1815] hover:bg-[#F4F2EE] transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Card Footer (Uniformly pinned at bottom) */}
      <div className="shrink-0 pt-2 border-t border-[#EBE7E0]/60 flex items-center justify-between text-xs text-[#8C8476]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyAll}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs font-medium ${
              isCopied
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-[#4D473E] hover:text-[#1A1815] hover:bg-black/[0.04]'
            }`}
            title="Copy note and all links"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-[#8C8476] hover:text-[#1A1815] hover:bg-black/[0.04] transition-colors"
            title="Open and edit note"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {note.pinned && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
            Pinned
          </span>
        )}
      </div>
    </article>
  );
};
