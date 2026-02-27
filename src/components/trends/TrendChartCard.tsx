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
      <h3 className={`font-extrabold uppercase tracking-wide text-[#004B87] ${compact ? 'text-xs mb-2.5' : 'text-sm mb-4'}`}>{title}</h3>
      {children}
    </div>
  );
}
