import React from 'react';
import { StickyNote, Image as ImageIcon, FileCheck, Layers, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FilterOption } from './FilterBar';

interface EmptyStateProps {
  filter: FilterOption;
  searchQuery: string;
  selectedDate?: string | null;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  filter,
  searchQuery,
  selectedDate,
  onClearFilters,
}) => {
  if (selectedDate) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="py-16 text-center border border-dashed border-[#DDD7CD] rounded-xl bg-white/40 p-6"
      >
        <div className="w-10 h-10 rounded-xl bg-[#F4F2EE] border border-[#EBE7E0] mx-auto flex items-center justify-center mb-2.5">
          <Calendar className="w-5 h-5 text-amber-700" />
        </div>
        <p className="text-sm font-semibold text-[#1A1815]">No notes found for {selectedDate}</p>
        <p className="text-xs text-[#8C8476] mt-1">There were no sticky notes created on this date.</p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearFilters}
          className="mt-3 text-xs font-medium text-[#B45309] hover:underline"
        >
          View all notes
        </motion.button>
      </motion.div>
    );
  }

  if (searchQuery) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="py-16 text-center border border-dashed border-[#DDD7CD] rounded-xl bg-white/40 p-6"
      >
        <p className="text-sm font-semibold text-[#1A1815]">No notes match "{searchQuery}"</p>
        <p className="text-xs text-[#8C8476] mt-1">Try searching with a different term or clear the filter.</p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearFilters}
          className="mt-3 text-xs font-medium text-[#B45309] hover:underline"
        >
          Clear search query
        </motion.button>
      </motion.div>
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="py-16 text-center border border-dashed border-[#DDD7CD] rounded-xl bg-white/50 p-6"
    >
      <div className="w-12 h-12 rounded-xl bg-[#F4F2EE] border border-[#EBE7E0] mx-auto flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#1A1815]">{title}</h3>
      <p className="text-xs text-[#8C8476] mt-1 max-w-sm mx-auto leading-relaxed">{desc}</p>
      {filter !== 'all' && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearFilters}
          className="mt-4 px-3 py-1.5 rounded-lg border border-[#DDD7CD] text-xs font-medium text-[#4D473E] hover:bg-white transition-colors"
        >
          View all notes
        </motion.button>
      )}
    </motion.div>
  );
};
