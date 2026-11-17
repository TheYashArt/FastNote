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
    <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 backdrop-blur-md border-b border-[#EBE7E0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1A1815] text-[#FAF9F7] flex items-center justify-center font-mono font-semibold text-sm shadow-sm">
            FN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-[#1A1815]">FastNote</span>
              <span className="text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EBE7E0] text-[#4D473E]">
                v1.0
              </span>
            </div>
            <p className="text-xs text-[#8C8476] hidden sm:block">Quick device clipboard & notes</p>
          </div>
        </div>

        {/* Center: Active Room & Device Sync Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#DDD7CD] rounded-lg px-2.5 py-1 text-xs shadow-paper">
            <span className="text-[#8C8476] mr-1.5 font-medium hidden md:inline">Sync Channel:</span>
            {isEditingRoom ? (
              <form onSubmit={handleRoomSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  onBlur={() => setIsEditingRoom(false)}
                  autoFocus
                  className="font-mono text-xs text-[#1A1815] bg-[#F4F2EE] px-1.5 py-0.5 rounded outline-none border border-amber-500 w-24"
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
                title="Click to rename sync channel"
                className="font-mono font-medium text-[#1A1815] hover:text-[#B45309] hover:underline flex items-center gap-1 group"
              >
                <span>#{roomId}</span>
                <span className="text-[10px] text-[#8C8476] group-hover:text-[#B45309]">({totalNotes})</span>
              </button>
            )}

            <div className="w-px h-3.5 bg-[#EBE7E0] mx-2" />

            <button
              type="button"
              onClick={handleCopyShareLink}
              title="Copy link to this room"
              className="text-[#8C8476] hover:text-[#1A1815] transition-colors p-0.5 rounded"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Connect Device (QR Code) Button */}
          <button
            type="button"
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1815] text-[#FAF9F7] hover:bg-[#2F2B26] transition-all text-xs font-medium shadow-paper active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Connect Phone</span>
            <span className="sm:hidden">Pair</span>
          </button>
        </div>

        {/* Right side: Device Indicator & Cloud Storage Trigger */}
        <div className="flex items-center gap-2">
          {/* Supabase Cloud Status Indicator */}
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isCloudSynced
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
                : 'bg-white border-[#DDD7CD] text-[#4D473E] hover:border-[#B8B0A2]'
            }`}
            title="Configure Supabase Cloud Storage"
          >
            <Database className={`w-3.5 h-3.5 ${isCloudSynced ? 'text-emerald-600' : 'text-[#8C8476]'}`} />
            <span className="hidden lg:inline">
              {isCloudSynced ? 'Supabase Synced' : 'Cloud Setup'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </button>

          {/* Current Device Pill */}
          <div
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4F2EE] text-[#4D473E] text-xs font-mono"
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
