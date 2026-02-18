'use client';

import React from 'react';

interface TrendChartCardProps {
  title: string;
  colSpan?: 1 | 2;
  compact?: boolean;
  children: React.ReactNode;
}

export function TrendChartCard({ title, colSpan = 1, compact = false, children }: TrendChartCardProps) {
  return (
    <div
      className={`bento-card ${compact ? 'px-5 pt-4 pb-3' : 'p-6'} ${colSpan === 2 ? 'col-span-2' : ''}`}
    >
      <h3 className={`serif italic text-[#4A4642] ${compact ? 'text-sm mb-2.5' : 'text-lg mb-4'}`}>{title}</h3>
      {children}
    </div>
  );
}
