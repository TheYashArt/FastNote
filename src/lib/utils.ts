import type { NoteColor } from '../types';

export const ATTACHMENT_LIMITS = {
  MAX_IMAGES_PER_NOTE: 5,
  MAX_PDFS_PER_NOTE: 3,
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
    bg: 'bg-white',
    border: 'border-[#EAE7E1]',
    badge: 'bg-[#F4F2EE] text-[#4D473E]',
    label: 'White Linen',
    swatch: '#FFFFFF',
  },
  amber: {
    bg: 'bg-[#FCF9EE]',
    border: 'border-[#EFE5C6]',
    badge: 'bg-[#F7EFCF] text-[#855D10]',
    label: 'Warm Butter',
    swatch: '#FCF9EE',
  },
  sage: {
    bg: 'bg-[#F2F7F2]',
    border: 'border-[#D9E6DA]',
    badge: 'bg-[#E1ECE2] text-[#2F5233]',
    label: 'Soft Sage',
    swatch: '#F2F7F2',
  },
  sky: {
    bg: 'bg-[#F1F6FA]',
    border: 'border-[#D8E4EE]',
    badge: 'bg-[#DEEAF3] text-[#244E6E]',
    label: 'Morning Sky',
    swatch: '#F1F6FA',
  },
  rose: {
    bg: 'bg-[#FAF4F4]',
    border: 'border-[#EFE1E1]',
    badge: 'bg-[#F4E3E3] text-[#703239]',
    label: 'Pale Blush',
    swatch: '#FAF4F4',
  },
};
