import React from 'react';
import { Search, X, Pin, Image as ImageIcon, FileCheck, Layers } from 'lucide-react';

export type FilterOption = 'all' | 'image' | 'pdf' | 'pinned';

interface FilterBarProps {
  currentFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    image: number;
    pdf: number;
    pinned: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-6">
      
      {/* 4 Filters: All, Images, PDFs, and Pinned (if any) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        
        {/* 1. All */}
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 min-h-[34px] sm:min-h-0 ${
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
        </button>

        {/* 2. Images */}
        <button
          type="button"
          onClick={() => onFilterChange('image')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 min-h-[34px] sm:min-h-0 ${
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
        </button>

        {/* 3. PDFs */}
        <button
          type="button"
          onClick={() => onFilterChange('pdf')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 min-h-[34px] sm:min-h-0 ${
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
        </button>

        {/* 4. Pinned (if any exist or currently active) */}
        {(counts.pinned > 0 || currentFilter === 'pinned') && (
          <button
            type="button"
            onClick={() => onFilterChange('pinned')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 min-h-[34px] sm:min-h-0 ${
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
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative min-w-[200px] sm:w-64">
        <Search className="w-3.5 h-3.5 text-[#8C8476] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter notes..."
          className="w-full pl-8 pr-8 py-2 sm:py-1.5 rounded-lg bg-white border border-[#DDD7CD] text-base sm:text-xs text-[#1A1815] placeholder-[#8C8476] outline-none focus:border-[#8C8476] transition-colors shadow-paper min-h-[36px]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C8476] hover:text-[#1A1815] p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};
