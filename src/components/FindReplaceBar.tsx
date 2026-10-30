import React, { useState } from 'react';
import { Search, Replace, ChevronUp, ChevronDown, X, CaseSensitive } from 'lucide-react';

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (term: string, caseSensitive: boolean) => number;
  onReplace: (findTerm: string, replaceTerm: string, replaceAll: boolean, caseSensitive: boolean) => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
}) => {
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [caseSensitive, setCaseSensitive] = useState(false);

  if (!isOpen) return null;

  const handleSearchChange = (val: string) => {
    setFindTerm(val);
    if (!val.trim()) {
      setMatchCount(null);
    } else {
      const count = onFind(val, caseSensitive);
      setMatchCount(count);
    }
  };

  const handleReplaceOne = () => {
    if (!findTerm.trim()) return;
    onReplace(findTerm, replaceTerm, false, caseSensitive);
    const count = onFind(findTerm, caseSensitive);
    setMatchCount(count);
  };

  const handleReplaceAll = () => {
    if (!findTerm.trim()) return;
    onReplace(findTerm, replaceTerm, true, caseSensitive);
    setMatchCount(0);
  };

  return (
    <div className="absolute top-3 right-6 z-30 bg-white border border-stone-300 rounded-xl shadow-xl p-2.5 flex items-center space-x-2 animate-in slide-in-from-top-2 duration-150 text-xs">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2" />
        <input
          type="text"
          autoFocus
          placeholder="Find in manuscript..."
          value={findTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
          className="pl-7 pr-16 py-1 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 w-44 bg-stone-50 focus:bg-white"
        />
        {matchCount !== null && (
          <span className="absolute right-2 font-mono text-[10px] text-stone-500">
            {matchCount} found
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          const newCase = !caseSensitive;
          setCaseSensitive(newCase);
          if (findTerm) setMatchCount(onFind(findTerm, newCase));
        }}
        className={`p-1 rounded transition-colors ${caseSensitive ? 'bg-indigo-100 text-indigo-700' : 'text-stone-400 hover:text-stone-700'}`}
        title="Match Case"
      >
        <CaseSensitive className="w-4 h-4" />
      </button>

      {/* Replace Input */}
      <div className="relative flex items-center">
        <Replace className="w-3.5 h-3.5 text-stone-400 absolute left-2" />
        <input
          type="text"
          placeholder="Replace with..."
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
          className="pl-7 pr-3 py-1 text-xs border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 w-40 bg-stone-50 focus:bg-white"
        />
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={handleReplaceOne}
          disabled={!findTerm.trim() || matchCount === 0}
          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 disabled:opacity-30 rounded font-medium text-stone-700 text-[11px]"
        >
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={!findTerm.trim() || matchCount === 0}
          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-30 text-indigo-700 rounded font-medium text-[11px]"
        >
          Replace All
        </button>
      </div>

      <button
        onClick={onClose}
        className="p-1 text-stone-400 hover:text-stone-600 rounded hover:bg-stone-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
