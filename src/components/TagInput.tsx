import React, { useState, KeyboardEvent, useRef } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  id?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  id,
  tags,
  onChange,
  placeholder = 'Type and press Enter or comma...',
  suggestions = [],
  maxTags,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Check if duplicate (case-insensitive)
    const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setInputValue('');
      return;
    }

    if (maxTags && tags.length >= maxTags) return;

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  // Filter available suggestions that are not already chosen
  const filteredSuggestions = suggestions.filter((s) => {
    const isAlreadyTag = tags.some((t) => t.toLowerCase() === s.toLowerCase());
    if (isAlreadyTag) return false;
    if (!inputValue) return true;
    return s.toLowerCase().includes(inputValue.toLowerCase());
  }).slice(0, 6);

  return (
    <div className="relative">
      <div
        id={id}
        onClick={() => inputRef.current?.focus()}
        className={`w-full min-h-[44px] px-3 py-2 rounded-lg bg-slate-900/80 border text-sm flex flex-wrap items-center gap-1.5 transition-colors cursor-text ${
          isFocused ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-700/70 hover:border-slate-600'
        }`}
      >
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(idx);
              }}
              className="text-slate-400 hover:text-rose-400 focus:outline-none transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Short delay so suggestion clicks register before blur
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={tags.length === 0 ? placeholder : 'Add more...'}
          className="flex-1 min-w-[120px] bg-transparent text-slate-200 placeholder:text-slate-500 text-sm focus:outline-none py-1"
        />

        {inputValue.trim() && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addTag(inputValue);
            }}
            className="px-2 py-0.5 rounded text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {isFocused && filteredSuggestions.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg bg-[#1E293B] border border-slate-700 shadow-xl py-1 text-xs">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 tracking-wider">
            SUGGESTIONS FROM SKILLS POOL
          </div>
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before adding
                addTag(suggestion);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-300 transition-colors flex items-center justify-between"
            >
              <span>{suggestion}</span>
              <span className="text-[10px] text-slate-500">+ Click to add</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
