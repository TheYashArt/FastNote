import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, ArrowRight, RefreshCw, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateRoomId } from '../lib/utils';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  onChangeRoom: (newRoom: string) => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onChangeRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [customRoom, setCustomRoom] = useState('');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
    : `https://fastnote.app?room=${roomId}`;

  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FastNote Live Sync',
          text: `Join my FastNote channel #${roomId} to pass notes and files`,
          url: currentUrl,
        });
      } catch {
        // User cancelled or share dismissed
      }
    } else {
      handleCopy();
    }
  };

  const handleSwitchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customRoom.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean) {
      onChangeRoom(clean);
      setCustomRoom('');
    }
  };

  const handleGenerateNew = () => {
    const newId = generateRoomId();
    onChangeRoom(newId);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        className="w-full max-w-sm rounded-2xl bg-white border border-[#DDD7CD] shadow-elevated p-5 sm:p-6 relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-2 rounded-lg text-[#8C8476] hover:text-[#1A1815] hover:bg-[#F4F2EE] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </motion.button>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 mx-auto flex items-center justify-center mb-2">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[#1A1815] tracking-tight">
            Connect Phone or Device
          </h2>
          <p className="text-xs text-[#8C8476] mt-1 max-w-[250px] mx-auto leading-relaxed">
            Scan with your phone camera or share link to sync notes across devices.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-[#FAF9F7] border border-[#EBE7E0] rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center mb-3">
          <div className="p-2 bg-white rounded-lg shadow-paper">
            <QRCodeSVG
              value={currentUrl}
              size={170}
              level="M"
              fgColor="#1A1815"
              bgColor="#FFFFFF"
            />
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 font-mono text-xs text-[#4D473E]">
            <span className="text-[#8C8476]">Sync Code:</span>
            <span className="font-semibold text-[#1A1815] bg-white px-2 py-0.5 rounded border border-[#DDD7CD]">
              #{roomId}
            </span>
          </div>
        </div>

        {/* Action Buttons: Native Share (on mobile) & Copy Link */}
        <div className="space-y-2 mb-3">
          {hasNativeShare && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#1A1815] text-[#FAF9F7] text-xs font-medium hover:bg-[#2F2B26] transition-colors min-h-[40px]"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Share via Phone / Apps</span>
            </motion.button>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
              hasNativeShare 
                ? 'bg-[#F4F2EE] text-[#1A1815] hover:bg-[#EBE7E0]' 
                : 'bg-[#1A1815] text-[#FAF9F7] hover:bg-[#2F2B26]'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Sync Link'}</span>
          </motion.button>
        </div>

        {/* Switch / Change Room */}
        <div className="pt-3 border-t border-[#EBE7E0] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#8C8476]">
            <span>Join another channel</span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleGenerateNew}
              className="hover:text-[#1A1815] flex items-center gap-1 text-[11px] py-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Random code</span>
            </motion.button>
          </div>
          <form onSubmit={handleSwitchRoom} className="flex gap-1.5">
            <input
              type="text"
              value={customRoom}
              onChange={(e) => setCustomRoom(e.target.value)}
              placeholder="e.g. mobile-notes"
              className="flex-1 px-3 py-2 sm:py-1.5 rounded-lg border border-[#DDD7CD] text-base sm:text-xs text-[#1A1815] placeholder-[#8C8476] outline-none font-mono min-h-[38px] sm:min-h-0"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              disabled={!customRoom.trim()}
              className="px-3.5 py-2 sm:py-1.5 rounded-lg border border-[#DDD7CD] hover:border-[#1A1815] text-xs font-medium text-[#1A1815] disabled:opacity-40 transition-colors min-h-[38px] sm:min-h-0 flex items-center justify-center"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </form>
        </div>

      </motion.div>
    </motion.div>
  );
};
