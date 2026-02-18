'use client';

import React, { useState } from 'react';
import { EvaluatedHealthData } from '@/types/health';
import { isDeltaImprovement } from '@/utils/deltaHelpers';

interface HistoricalSidebarProps {
  entries: EvaluatedHealthData[];
  onShowTrends?: () => void;
}

interface MetricDef {
  label: string;
  key: string;
  getValue: (e: EvaluatedHealthData) => number;
  decimals: number;
}

const SECTIONS: { title: string; metrics: MetricDef[] }[] = [
  {
    title: 'Livsstil',
    metrics: [
      { label: 'Sömn', key: 'sleep', getValue: (e) => e.lifestyle.sleep, decimals: 0 },
      { label: 'Kost', key: 'diet', getValue: (e) => e.lifestyle.diet, decimals: 0 },
      { label: 'Stress', key: 'stress', getValue: (e) => e.lifestyle.stress, decimals: 0 },
      { label: 'Relationer', key: 'relationships', getValue: (e) => e.lifestyle.relationships, decimals: 0 },
      { label: 'Rökning', key: 'smoking', getValue: (e) => e.lifestyle.smoking, decimals: 0 },
      { label: 'Balans', key: 'balance', getValue: (e) => e.lifestyle.balance, decimals: 0 },
      { label: 'Träning', key: 'exercise', getValue: (e) => e.lifestyle.exercise, decimals: 0 },
      { label: 'Alkohol', key: 'alcohol', getValue: (e) => e.lifestyle.alcohol, decimals: 0 },
    ],
  },
  {
    title: 'Fysisk Status',
    metrics: [
      { label: 'Vikt', key: 'weight', getValue: (e) => e.bodyComposition.weight, decimals: 1 },
      { label: 'Kroppsfett', key: 'bodyFat', getValue: (e) => e.bodyComposition.bodyFat, decimals: 1 },
      { label: 'Systoliskt', key: 'systolic', getValue: (e) => e.bloodPressure.systolic, decimals: 0 },
      { label: 'Diastoliskt', key: 'diastolic', getValue: (e) => e.bloodPressure.diastolic, decimals: 0 },
      { label: 'VO\u2082 Max', key: 'vo2Max', getValue: (e) => e.fitness.vo2Max, decimals: 1 },
    ],
  },
  {
    title: 'Blodanalys',
    metrics: [
      { label: 'Hemoglobin', key: 'hb', getValue: (e) => e.bloodWork.hb, decimals: 0 },
      { label: 'Glukos', key: 'glucose', getValue: (e) => e.bloodWork.glucose, decimals: 1 },
      { label: 'HDL', key: 'hdl', getValue: (e) => e.bloodWork.hdl, decimals: 1 },
      { label: 'LDL', key: 'ldl', getValue: (e) => e.bloodWork.ldl, decimals: 1 },
      { label: 'Triglycerider', key: 'triglycerides', getValue: (e) => e.bloodWork.triglycerides, decimals: 1 },
    ],
  },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '');
  const year = d.getFullYear().toString().slice(-2);
  return `${month} ${year}`;
}

export function HistoricalSidebar({ entries, onShowTrends }: HistoricalSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const last = sorted[sorted.length - 1];
  const secondLast = sorted[sorted.length - 2];

  // Show last 3 by default, all when expanded
  const canExpand = sorted.length > 3;
  const visible = expanded ? sorted : sorted.slice(-3);

  return (
    <div className="w-80 flex-shrink-0 rounded-3xl p-6" style={{ backgroundColor: '#EDF2F7' }}>
      <h3 className="serif text-lg italic text-[#4A4642] mb-4">Historisk jämförelse</h3>

      {/* Date headers */}
      <div className="flex items-center mb-3">
        <span className="w-[88px] flex-shrink-0" />
        {visible.map((entry, idx) => (
          <span
            key={entry.date}
            className={`flex-1 text-[9px] uppercase tracking-wider text-center ${
              idx === visible.length - 1 ? 'font-bold text-[#4A4642]' : 'text-[#9A9488]'
            }`}
          >
            {formatDate(entry.date)}
          </span>
        ))}
        <span className="w-6 flex-shrink-0" />
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="text-[9px] uppercase tracking-widest text-[#B5AFA2] font-semibold mb-2">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.metrics.map((metric) => {
              const currentVal = metric.getValue(last);
              const prevVal = metric.getValue(secondLast);
              const delta = currentVal - prevVal;
              const hasChange = Math.abs(delta) > 0.001;

              return (
                <div key={metric.key} className="flex items-center">
                  <span className="text-[11px] text-[#4A4642] w-[88px] flex-shrink-0 truncate">{metric.label}</span>
                  {visible.map((entry, idx) => {
                    const val = metric.getValue(entry);
                    const isLast = idx === visible.length - 1;
                    return (
                      <span
                        key={entry.date}
                        className={`flex-1 text-[10px] text-center ${
                          isLast ? 'font-semibold text-[#4A4642]' : 'text-[#9A9488]'
                        }`}
                      >
                        {val.toFixed(metric.decimals)}
                      </span>
                    );
                  })}
                  <span className="w-6 flex-shrink-0 text-center">
                    {hasChange && (
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: isDeltaImprovement(metric.key, delta) ? '#8FB3A3' : '#C4A47C' }}
                      >
                        {isDeltaImprovement(metric.key, delta) ? '▲' : '▼'}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Expand button */}
      {canExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-[10px] uppercase tracking-widest text-[#9A9488] font-semibold py-2 mb-2 border border-[#D5DDE6] rounded-lg hover:bg-white/50 transition-colors"
        >
          {expanded ? 'Visa färre' : `Expandera (${sorted.length} mätningar)`}
        </button>
      )}

      <div className="mt-3 pt-3 border-t border-[#D5DDE6]">
        <div className="flex items-center gap-3 text-[9px] text-[#9A9488]">
          <span className="flex items-center gap-1"><span style={{ color: '#8FB3A3' }}>▲</span> Ökning</span>
          <span className="flex items-center gap-1"><span style={{ color: '#C4A47C' }}>▼</span> Minskning</span>
        </div>
      </div>

      {/* Trend graphs button */}
      {onShowTrends && (
        <button
          onClick={onShowTrends}
          className="w-full mt-4 py-2.5 text-[11px] uppercase tracking-widest font-semibold text-[#004B87] border border-[#004B87]/30 rounded-lg hover:bg-[#004B87]/5 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Visa trendgrafer
        </button>
      )}
    </div>
  );
}
