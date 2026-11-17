import type { NoteColor } from '../types';

export const ATTACHMENT_LIMITS = {
  MAX_IMAGES_PER_NOTE: 5,
  MAX_PDFS_PER_NOTE: 3,
  MAX_MDS_PER_NOTE: 10,
  MAX_MDS_PER_NOTE: 3,
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB limit per file
};

export function generateRoomId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function detectDevice(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

export function isUrl(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const NOTE_COLOR_MAP: Record<NoteColor, {
  bg: string;
  border: string;
  badge: string;
  label: string;
  swatch: string;
}> = {
  linen: {
    bg: 'bg-[#FAF8F5]',
    border: 'border-[#E2DCD2]',
    badge: 'bg-[#EDE7DE] text-[#4D473E]',
    label: 'Linen White',
    swatch: '#FAF8F5',
  },
  amber: {
    bg: 'bg-[#FEF3C7]',
    border: 'border-[#FCD34D]',
    badge: 'bg-[#FDE68A] text-[#92400E]',
    label: 'Canary Yellow',
    swatch: '#FDE68A',
  },
  sage: {
    bg: 'bg-[#DCFCE7]',
    border: 'border-[#86EFAC]',
    badge: 'bg-[#BBF7D0] text-[#166534]',
    label: 'Sage Green',
    swatch: '#86EFAC',
  },
  sky: {
    bg: 'bg-[#E0F2FE]',
    border: 'border-[#7DD3FC]',
    badge: 'bg-[#BAE6FD] text-[#075985]',
    label: 'Sky Blue',
    swatch: '#7DD3FC',
  },
  rose: {
    bg: 'bg-[#FCE7F3]',
    border: 'border-[#F472B6]',
    badge: 'bg-[#FBCFE8] text-[#9D174D]',
    label: 'Rose Pink',
    swatch: '#F472B6',
  },
};
