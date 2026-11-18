import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock, CalendarDays } from 'lucide-react';

interface CustomCalendarFilterProps {
  selectedDate: string | null; // ISO YYYY-MM-DD
  onSelectDate: (date: string | null) => void;
  noteDates?: Set<string>; // Set of YYYY-MM-DD strings that have notes
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomCalendarFilter: React.FC<CustomCalendarFilterProps> = ({
  selectedDate,
  onSelectDate,
  noteDates = new Set(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view month/year based on selectedDate or today
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Format today's YYYY-MM-DD
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${mStr}-${dStr}`;
    onSelectDate(dateStr);
    setIsOpen(false);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDate(todayStr);
    setIsOpen(false);
  };

  // Generate day matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  // Formatted label for trigger button
  const formattedButtonLabel = (() => {
    if (!selectedDate) return 'Date';
    const [y, m, d] = selectedDate.split('-');
    const monthName = MONTH_NAMES[parseInt(m, 10) - 1].slice(0, 3);
    const dayNum = parseInt(d, 10);
    if (selectedDate === todayStr) return `Today (${monthName} ${dayNum})`;
    return `${monthName} ${dayNum}, ${y}`;
  })();

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <div className="flex items-center">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 min-h-[34px] sm:min-h-0 ${
            selectedDate
              ? 'bg-[#1A1815] text-[#FAF9F7] shadow-sm'
              : 'bg-white border border-[#DDD7CD] text-[#4D473E] hover:text-[#1A1815] hover:border-[#B8B0A2] active:bg-[#F4F2EE]'
          }`}
          title="Filter notes by creation date"
        >
          <CalendarIcon className={`w-3.5 h-3.5 ${selectedDate ? 'text-amber-300' : 'text-[#8C8476]'}`} />
          <span>{formattedButtonLabel}</span>
          {selectedDate && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </motion.button>

        {/* Clear Date shortcut button right next to trigger */}
        {selectedDate && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectDate(null);
            }}
            className="ml-1 p-1 rounded-md text-[#8C8476] hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Clear date filter"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>

      {/* Custom Designed Calendar Box (Dropdown Popup) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 z-50 w-[285px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-[#DDD7CD] shadow-elevated ring-1 ring-black/5 p-3.5 select-none"
          >
            {/* Header Month / Year controls */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-[#1A1815] tracking-tight">
                  {MONTH_NAMES[viewMonth]} <span className="font-mono font-medium text-[#8C8476]">{viewYear}</span>
                </span>
              </div>

              <div className="flex items-center gap-0.5">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-[#8C8476] hover:text-[#1A1815] hover:bg-[#EBE7E0] transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-[#8C8476] hover:text-[#1A1815] hover:bg-[#EBE7E0] transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Weekday Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {WEEKDAY_NAMES.map((d, i) => (
                <span
                  key={d}
                  className={`text-[10px] font-mono font-semibold py-0.5 ${
                    i === 0 ? 'text-amber-800' : 'text-[#8C8476]'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Days from previous month */}
              {Array.from({ length: firstDayWeekday }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayWeekday + i + 1;
                return (
                  <div
                    key={`prev_${i}`}
                    className="h-7 flex items-center justify-center text-[11px] font-mono text-[#B8B0A2]/50 pointer-events-none"
                  >
                    {dayNum}
                  </div>
                );
              })}

              {/* Days of the current month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const mStr = String(viewMonth + 1).padStart(2, '0');
                const dStr = String(dayNum).padStart(2, '0');
                const thisDateStr = `${viewYear}-${mStr}-${dStr}`;

                const isSelected = selectedDate === thisDateStr;
                const isToday = todayStr === thisDateStr;
                const hasNotes = noteDates.has(thisDateStr);

                return (
                  <motion.button
                    key={`day_${dayNum}`}
                    type="button"
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-7 w-full rounded-lg flex flex-col items-center justify-center text-[11px] font-mono transition-colors relative group ${
                      isSelected
                        ? 'bg-[#1A1815] text-[#FAF9F7] font-bold shadow-xs'
                        : isToday
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300/80 hover:bg-amber-200'
                        : 'text-[#1A1815] hover:bg-[#EBE7E0]/80'
                    }`}
                    title={`${MONTH_NAMES[viewMonth]} ${dayNum}, ${viewYear}${hasNotes ? ' (Has notes)' : ''}`}
                  >
                    <span>{dayNum}</span>
                    {/* Subtle note indicator dot */}
                    {hasNotes && (
                      <span
                        className={`w-1 h-1 rounded-full absolute bottom-0.5 ${
                          isSelected ? 'bg-amber-300' : 'bg-amber-600'
                        }`}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer Quick Action Bar */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#EBE7E0] text-[11px]">
              <motion.button
                type="button"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJumpToToday}
                className="flex items-center gap-1 font-medium text-amber-800 hover:text-amber-950 hover:underline px-1.5 py-0.5 rounded transition-colors"
              >
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Jump to Today</span>
              </motion.button>

              {selectedDate && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onSelectDate(null);
                    setIsOpen(false);
                  }}
                  className="font-medium text-[#8C8476] hover:text-rose-700 px-1.5 py-0.5 rounded transition-colors"
                >
                  Clear Filter
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
