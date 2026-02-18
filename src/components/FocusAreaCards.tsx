'use client';

import React from 'react';
import { FocusArea } from '@/types/health';
import { Moon, Apple, Brain, Heart, Cigarette, Scale, Dumbbell, Wine } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Moon,
  Apple,
  Brain,
  Heart,
  Cigarette,
  Scale,
  Dumbbell,
  Wine,
};

interface FocusAreaCardsProps {
  selectedAreas: FocusArea[];
}

export function FocusAreaCards({ selectedAreas }: FocusAreaCardsProps) {
  if (selectedAreas.length === 0) return null;

  const gridCols =
    selectedAreas.length === 1 ? 'grid-cols-1' :
    selectedAreas.length === 2 ? 'grid-cols-2' :
    'grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {selectedAreas.map((area) => {
        const Icon = iconMap[area.iconName];
        return (
          <div
            key={area.key}
            className="focus-card"
          >
            {Icon && (
              <div className="flex-shrink-0 mt-0.5">
                <Icon size={18} color="#8FB3A3" strokeWidth={1.8} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4A4642]">
                {area.label}
              </p>
              <p className="text-[8px] text-[#9A9488] leading-tight mt-0.5">
                {area.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
