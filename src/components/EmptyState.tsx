import React from 'react';
import { StickyNote, Image as ImageIcon, FileCheck, Layers } from 'lucide-react';
import type { FilterOption } from './FilterBar';

interface EmptyStateProps {
  filter: FilterOption;
  searchQuery: string;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  filter,
  searchQuery,
  onClearFilters,
}) => {
  if (searchQuery) {
    return (
      <div className="py-16 text-center border border-dashed border-[#DDD7CD] rounded-xl bg-white/40 p-6">
        <p className="text-sm font-semibold text-[#1A1815]">No notes match "{searchQuery}"</p>
        <p className="text-xs text-[#8C8476] mt-1">Try searching with a different term or clear the filter.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 text-xs font-medium text-[#B45309] hover:underline"
        >
          Clear search query
        </button>
      </div>
    );
  }

  const getFilterDetails = () => {
    switch (filter) {
      case 'image':
        return {
          icon: <ImageIcon className="w-6 h-6 text-[#8C8476]" />,
          title: 'No images found',
          desc: 'Drop screenshots or photos here, or press Ctrl+V anywhere on the page to paste directly.',
        };
      case 'pdf':
        return {
          icon: <FileCheck className="w-6 h-6 text-[#8C8476]" />,
          title: 'No PDF documents found',
          desc: 'Upload a PDF ticket, paper, or invoice to easily open and view it on your mobile device.',
        };
      case 'pinned':
        return {
          icon: <StickyNote className="w-6 h-6 text-amber-700" />,
          title: 'No pinned sticky notes',
          desc: 'Hover over any sticky note and click the pin icon to keep important items at the top.',
        };
      default:
        return {
          icon: <Layers className="w-6 h-6 text-[#8C8476]" />,
          title: 'This sync channel is empty',
          desc: 'Write a quick thought, paste a link, or drop a file above to send it to all your connected devices instantly.',
        };
    }
  };

  const { icon, title, desc } = getFilterDetails();

  return (
    <div className="py-16 text-center border border-dashed border-[#DDD7CD] rounded-xl bg-white/50 p-6">
      <div className="w-12 h-12 rounded-xl bg-[#F4F2EE] border border-[#EBE7E0] mx-auto flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#1A1815]">{title}</h3>
      <p className="text-xs text-[#8C8476] mt-1 max-w-sm mx-auto leading-relaxed">{desc}</p>
      {filter !== 'all' && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 px-3 py-1.5 rounded-lg border border-[#DDD7CD] text-xs font-medium text-[#4D473E] hover:bg-white transition-colors"
        >
          View all notes
        </button>
      )}
    </div>
  );
};
