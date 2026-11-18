import React, { useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageLightboxProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (imageUrl) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <p className="text-xs font-medium truncate max-w-md text-stone-200">
            {title || 'Image Preview'}
          </p>

          <div className="flex items-center gap-2">
            <motion.a
              href={imageUrl}
              download="fastnote-image.png"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-xs flex items-center gap-1.5"
              title="Download image"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs">Download</span>
            </motion.a>

            <motion.a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Open full size in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.a>

            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Image Display */}
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 max-h-[80vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt={title || 'Full preview'}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
