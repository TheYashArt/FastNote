import React, { useState } from 'react';
import {
  QrCode,
  Database,
  Check,
  Copy,
  Laptop,
  Smartphone,
  Tablet
} from 'lucide-react';
import { detectDevice } from '../lib/utils';

interface HeaderProps {
  roomId: string;
  onChangeRoom: (newRoomId: string) => void;
  onOpenQrModal: () => void;
  onOpenSupabaseModal: () => void;
  isCloudSynced: boolean;
  totalNotes: number;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  onChangeRoom,
  onOpenQrModal,
  onOpenSupabaseModal,
  isCloudSynced,
  totalNotes,
}) => {
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [roomInput, setRoomInput] = useState(roomId);
  const [copiedLink, setCopiedLink] = useState(false);
  const currentDevice = detectDevice();

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean && clean !== roomId) {
      onChangeRoom(clean);
    }
    setIsEditingRoom(false);
  };

  const handleCopyShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-[#EBE7E0] transition-all">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1A1815] text-[#FAF9F7] flex items-center justify-center font-mono font-semibold text-xs sm:text-sm shadow-xs">
            FN
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-[#1A1815]">FastNote</span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EBE7E0] text-[#4D473E]">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#8C8476] hidden md:block">Quick device clipboard & notes</p>
          </div>
        </div>
        <div className="flex items-center bg-white border border-[#DDD7CD] rounded-lg px-2 sm:px-2.5 py-1 text-xs shadow-paper min-w-0">
          <span className="text-[#8C8476] mr-1 font-medium hidden md:inline">Sync Channel:</span>
          {isEditingRoom ? (
            <form onSubmit={handleRoomSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                onBlur={() => setIsEditingRoom(false)}
                autoFocus
                className="font-mono text-xs text-[#1A1815] bg-[#F4F2EE] px-1 py-0.5 rounded outline-none border border-amber-500 w-20 sm:w-24"
                maxLength={16}
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRoomInput(roomId);
                setIsEditingRoom(true);
              }}
              title="Tap to rename sync channel"
              className="font-mono font-medium text-[#1A1815] hover:text-[#B45309] hover:underline flex items-center gap-1 group truncate max-w-[100px] sm:max-w-none text-xs"
            >
              <span className="truncate">#{roomId}</span>
              <span className="text-[10px] text-[#8C8476] group-hover:text-[#B45309] shrink-0">({totalNotes})</span>
            </button>
          )}

          <div className="w-px h-3.5 bg-[#EBE7E0] mx-1 sm:mx-2 shrink-0" />

          <button
            type="button"
            onClick={handleCopyShareLink}
            title="Copy room link"
            className="text-[#8C8476] hover:text-[#1A1815] transition-colors p-1 sm:p-0.5 rounded shrink-0 min-w-[24px] min-h-[24px] flex items-center justify-center active:scale-90"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        {/* Center / Actions: Channel Pill & Quick Pairing */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Channel Pill */}


          {/* Quick Connect Device (QR Code) Button */}
          <button
            type="button"
            onClick={onOpenQrModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1A1815] text-[#FAF9F7] hover:bg-[#2F2B26] transition-all text-xs font-medium shadow-paper active:scale-95 shrink-0 min-h-[32px]"
            title="Pair with phone or another device"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">{currentDevice === 'mobile' ? 'Share Room' : 'Connect Phone'}</span>
            <span className="sm:hidden text-xs">Pair</span>
          </button>

          {/* Supabase Cloud Status Indicator */}
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 min-h-[32px] ${isCloudSynced
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
              : 'bg-white border-[#DDD7CD] text-[#4D473E] hover:border-[#B8B0A2]'
              }`}
            title="Configure Supabase Cloud Storage"
          >
            <Database className={`w-3.5 h-3.5 shrink-0 ${isCloudSynced ? 'text-emerald-600' : 'text-[#8C8476]'}`} />
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
            />
          </button>

          {/* Current Device Pill */}
          <div
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4F2EE] text-[#4D473E] text-xs font-mono shrink-0"
            title={`Current Device: ${currentDevice}`}
          >
            {currentDevice === 'desktop' && <Laptop className="w-3.5 h-3.5 text-[#8C8476]" />}
            {currentDevice === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-[#8C8476]" />}
            {currentDevice === 'tablet' && <Tablet className="w-3.5 h-3.5 text-[#8C8476]" />}
            <span className="capitalize">{currentDevice}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
