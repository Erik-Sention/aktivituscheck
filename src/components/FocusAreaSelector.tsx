'use client';

import React from 'react';
import { LifestyleItem } from '@/utils/lifestyleItems';

interface FocusAreaSelectorProps {
  items: LifestyleItem[];
  selected: string[];
  onToggle: (key: string) => void;
  maxSelections: number;
}

export function FocusAreaSelector({ items, selected, onToggle, maxSelections }: FocusAreaSelectorProps) {
  const atMax = selected.length >= maxSelections;

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const isSelected = selected.includes(item.key);
        const isDisabled = !isSelected && atMax;

        return (
          <label
            key={item.key}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
              isSelected
                ? 'bg-[#EDF5F2] border border-[#8FB3A3]'
                : isDisabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[#F5F2EE] border border-transparent'
            }`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => onToggle(item.key)}
              className="w-4 h-4 rounded accent-[#8FB3A3]"
            />
            <span className="text-sm text-[#4A4642] flex-1">{item.label}</span>
            <span className="text-xs text-[#9A9488]">{item.value}/10</span>
          </label>
        );
      })}
      <p className="text-[10px] text-[#B5AFA2] mt-2">
        {selected.length}/{maxSelections} valda
      </p>
    </div>
  );
}
