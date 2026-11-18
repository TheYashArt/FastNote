import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Pin, Image as ImageIcon, FileCheck, Layers, FileCode, CodeXml } from 'lucide-react';
import { CustomCalendarFilter } from './CustomCalendarFilter';

export type FilterOption = 'all' | 'image' | 'pdf' | 'md' | 'html' | 'pinned';

interface FilterBarProps {
  currentFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  noteDates?: Set<string>;
  counts: {
    all: number;
    image: number;
    pdf: number;
    md: number;
    html: number;
    pinned: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedDate,
  onSelectDate,
  noteDates,
  counts,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
      
      {/* 1. Category / Media Filters (Scrollable strip) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar min-w-0">
        {/* All */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onFilterChange('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[34px] sm:min-h-0 ${
            currentFilter === 'all'
              ? 'bg-[#1A1815] text-[#FAF9F7] shadow-sm'
              : 'bg-white border border-[#DDD7CD] text-[#4D473E] hover:text-[#1A1815] hover:border-[#B8B0A2] active:bg-[#F4F2EE]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All</span>
          <span className={`text-[10px] font-mono px-1 rounded ${
            currentFilter === 'all' ? 'bg-[#2F2B26] text-amber-300' : 'bg-[#F4F2EE] text-[#8C8476]'
          }`}>
            {counts.all}
          </span>
        </motion.button>

        {/* Images */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onFilterChange('image')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[34px] sm:min-h-0 ${
            currentFilter === 'image'
              ? 'bg-[#1A1815] text-[#FAF9F7] shadow-sm'
              : 'bg-white border border-[#DDD7CD] text-[#4D473E] hover:text-[#1A1815] hover:border-[#B8B0A2] active:bg-[#F4F2EE]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Images</span>
          {counts.image > 0 && (
            <span className={`text-[10px] font-mono px-1 rounded ${
              currentFilter === 'image' ? 'bg-[#2F2B26] text-amber-300' : 'bg-[#F4F2EE] text-[#8C8476]'
            }`}>
              {counts.image}
            </span>
          )}
        </motion.button>

        {/* PDFs */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onFilterChange('pdf')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[34px] sm:min-h-0 ${
            currentFilter === 'pdf'
              ? 'bg-[#1A1815] text-[#FAF9F7] shadow-sm'
              : 'bg-white border border-[#DDD7CD] text-[#4D473E] hover:text-[#1A1815] hover:border-[#B8B0A2] active:bg-[#F4F2EE]'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>PDFs</span>
          {counts.pdf > 0 && (
            <span className={`text-[10px] font-mono px-1 rounded ${
              currentFilter === 'pdf' ? 'bg-[#2F2B26] text-amber-300' : 'bg-[#F4F2EE] text-[#8C8476]'
            }`}>
              {counts.pdf}
            </span>
          )}
        </motion.button>

        {/* MDs */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onFilterChange('md')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[34px] sm:min-h-0 ${
            currentFilter === 'md'
              ? 'bg-[#1A1815] text-[#FAF9F7] shadow-sm'
              : 'bg-white border border-[#DDD7CD] text-[#4D473E] hover:text-[#1A1815] hover:border-[#B8B0A2] active:bg-[#F4F2EE]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>.MD</span>
          {counts.md > 0 && (
            <span className={`text-[10px] font-mono px-1 rounded ${
              currentFilter === 'md' ? 'bg-[#2F2B26] text-amber-300' : 'bg-[#F4F2EE] text-[#8C8476]'
            }`}>
              {counts.md}
            </span>
          )}
        </motion.button>

        {/* HTML */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onFilterChange('html')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[34px] sm:min-h-0 ${
            currentFilter === 'html'
              ? 'bg-[#1A1815] text-[#FAF9F7] shadow-sm'
              : 'bg-white border border-[#DDD7CD] text-[#4D473E] hover:text-[#1A1815] hover:border-[#B8B0A2] active:bg-[#F4F2EE]'
          }`}
        >
          <CodeXml className="w-3.5 h-3.5 text-orange-600" />
          <span>HTML</span>
          {counts.html > 0 && (
            <span className={`text-[10px] font-mono px-1 rounded ${
              currentFilter === 'html' ? 'bg-[#2F2B26] text-amber-300' : 'bg-[#F4F2EE] text-[#8C8476]'
            }`}>
              {counts.html}
            </span>
          )}
        </motion.button>

        {/* Pinned (if any exist or currently active) */}
        {(counts.pinned > 0 || currentFilter === 'pinned') && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onFilterChange('pinned')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[34px] sm:min-h-0 ${
              currentFilter === 'pinned'
                ? 'bg-amber-800 text-amber-100 shadow-sm'
                : 'bg-white border border-[#DDD7CD] text-amber-800 hover:border-amber-400 active:bg-[#F4F2EE]'
            }`}
          >
            <Pin className="w-3.5 h-3.5 fill-amber-700" />
            <span>Pinned</span>
            <span className="text-[10px] font-mono px-1 rounded bg-amber-100 text-amber-900">
              {counts.pinned}
            </span>
          </motion.button>
        )}
      </div>

      {/* 2. Right Controls: Standalone Calendar Filter & Search (NOT clipped by overflow-x) */}
      <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end">
        {/* Custom Calendar Filter with unclipped floating box */}
        <CustomCalendarFilter
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          noteDates={noteDates}
        />

        {/* Search Bar */}
        <div className="relative flex-1 sm:flex-initial sm:w-56 min-w-[150px]">
          <Search className="w-3.5 h-3.5 text-[#8C8476] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-8 pr-8 py-2 sm:py-1.5 rounded-lg bg-white border border-[#DDD7CD] text-base sm:text-xs text-[#1A1815] placeholder-[#8C8476] outline-none focus:border-[#8C8476] transition-colors shadow-paper min-h-[34px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C8476] hover:text-[#1A1815] p-1 rounded min-w-[24px] min-h-[24px] flex items-center justify-center"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
