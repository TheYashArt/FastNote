import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
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

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm rounded-2xl bg-white border border-[#DDD7CD] shadow-elevated p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8C8476] hover:text-[#1A1815] hover:bg-[#F4F2EE] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 mx-auto flex items-center justify-center mb-2.5">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-[#1A1815] tracking-tight">
            Connect Phone or Device
          </h2>
          <p className="text-xs text-[#8C8476] mt-1 max-w-[240px] mx-auto">
            Scan with your phone camera to instantly access and sync notes on this board.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-[#FAF9F7] border border-[#EBE7E0] rounded-xl p-4 flex flex-col items-center justify-center mb-4">
          <div className="p-2 bg-white rounded-lg shadow-paper">
            <QRCodeSVG
              value={currentUrl}
              size={180}
              level="M"
              fgColor="#1A1815"
              bgColor="#FFFFFF"
            />
          </div>
          <div className="mt-3 flex items-center gap-1.5 font-mono text-xs text-[#4D473E]">
            <span className="text-[#8C8476]">Sync Code:</span>
            <span className="font-semibold text-[#1A1815] bg-white px-2 py-0.5 rounded border border-[#DDD7CD]">
              #{roomId}
            </span>
          </div>
        </div>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#1A1815] text-[#FAF9F7] text-xs font-medium hover:bg-[#2F2B26] transition-colors mb-3 active:scale-98"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Sync Link'}</span>
        </button>

        {/* Switch / Change Room */}
        <div className="pt-3 border-t border-[#EBE7E0] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#8C8476]">
            <span>Join another channel</span>
            <button
              type="button"
              onClick={handleGenerateNew}
              className="hover:text-[#1A1815] flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Random code</span>
            </button>
          </div>
          <form onSubmit={handleSwitchRoom} className="flex gap-1.5">
            <input
              type="text"
              value={customRoom}
              onChange={(e) => setCustomRoom(e.target.value)}
              placeholder="e.g. mobile-notes"
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#DDD7CD] text-xs text-[#1A1815] placeholder-[#8C8476] outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!customRoom.trim()}
              className="px-3 py-1.5 rounded-lg border border-[#DDD7CD] hover:border-[#1A1815] text-xs font-medium text-[#1A1815] disabled:opacity-40 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
