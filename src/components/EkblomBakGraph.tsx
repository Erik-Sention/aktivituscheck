'use client';

import React, { useState } from 'react';
import { EkblomBakNormativeData } from '@/types/health';

interface EkblomBakGraphProps {
  vo2Max: number;
  age?: number;
  normativeData: EkblomBakNormativeData;
  width?: number;
  height?: number;
  interactive?: boolean;
  onAgeClick?: (age: number) => void;
}

const PADDING = { top: 8, right: 12, bottom: 20, left: 28 };

export function EkblomBakGraph({
  vo2Max,
  age,
  normativeData,
  width = 310,
  height = 120,
  interactive = false,
  onAgeClick,
}: EkblomBakGraphProps) {
  const [hoverAge, setHoverAge] = useState<number | null>(null);

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  const [ageMin, ageMax] = normativeData.ageRange;
  const [vo2Min, vo2Max_] = normativeData.vo2Range;

  const toX = (a: number) => PADDING.left + ((a - ageMin) / (ageMax - ageMin)) * plotW;
  const toY = (v: number) => PADDING.top + plotH - ((v - vo2Min) / (vo2Max_ - vo2Min)) * plotH;

  // Build zone polygons
  const zonePolygons = normativeData.zones.map((zone) => {
    const upper = zone.bounds.map((b) => `${toX(b.age)},${toY(b.vo2Max)}`).join(' ');
    const lower = [...zone.bounds].reverse().map((b) => `${toX(b.age)},${toY(b.vo2Min)}`).join(' ');
    return { ...zone, points: `${upper} ${lower}` };
  });

  // Axis ticks
  const ageTicks = zone_bounds_ages(normativeData);
  const vo2Ticks = generateVo2Ticks(vo2Min, vo2Max_);

  // Client point position
  const clientX = age ? toX(Math.max(ageMin, Math.min(ageMax, age))) : null;
  const clientY = toY(Math.max(vo2Min, Math.min(vo2Max_, vo2Max)));

  // Zone label positions (middle of each zone, centered age)
  const midAge = (ageMin + ageMax) / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Grid lines (drawn first = behind zones) */}
      {vo2Ticks.map((v) => (
        <line
          key={v}
          x1={PADDING.left}
          y1={toY(v)}
          x2={width - PADDING.right}
          y2={toY(v)}
          stroke="#E5E0D8"
          strokeWidth={0.5}
        />
      ))}

      {/* Zone fills */}
      {zonePolygons.map((zone) => (
        <polygon
          key={zone.label}
          points={zone.points}
          fill={zone.color}
          opacity={0.4}
        />
      ))}

      {/* Zone labels */}
      {normativeData.zones.map((zone) => {
        const midBound = zone.bounds[Math.floor(zone.bounds.length / 2)];
        const midVo2 = (midBound.vo2Min + midBound.vo2Max) / 2;
        return (
          <text
            key={zone.label}
            x={toX(midAge) + 30}
            y={toY(midVo2)}
            fill="#4A4642"
            fontSize="6"
            textAnchor="middle"
            dominantBaseline="middle"
            opacity={0.6}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {zone.label}
          </text>
        );
      })}

      {/* X-axis labels */}
      {ageTicks.map((a) => (
        <text
          key={a}
          x={toX(a)}
          y={height - 4}
          fill="#9A9488"
          fontSize="7"
          textAnchor="middle"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {a}
        </text>
      ))}

      {/* Y-axis labels */}
      {vo2Ticks.map((v) => (
        <text
          key={v}
          x={PADDING.left - 4}
          y={toY(v) + 2}
          fill="#9A9488"
          fontSize="7"
          textAnchor="end"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {v}
        </text>
      ))}

      {/* Axis labels */}
      <text
        x={width / 2}
        y={height}
        fill="#B5AFA2"
        fontSize="6"
        textAnchor="middle"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        Ålder
      </text>

      {/* Client point */}
      {clientX !== null && (
        <>
          <circle cx={clientX} cy={clientY} r={6} fill="#004B87" opacity={0.15} />
          <circle cx={clientX} cy={clientY} r={3.5} fill="#004B87" />
          <circle cx={clientX} cy={clientY} r={1.5} fill="#ffffff" />
        </>
      )}

      {/* Hover indicator (dashboard only) */}
      {interactive && hoverAge !== null && (
        <line
          x1={toX(hoverAge)}
          y1={PADDING.top}
          x2={toX(hoverAge)}
          y2={height - PADDING.bottom}
          stroke="#004B87"
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.4}
        />
      )}

      {/* Interactive overlay (dashboard only) */}
      {interactive && (
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onMouseMove={(e) => {
            const rect = (e.target as SVGRectElement).getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const ageVal = Math.round(ageMin + (relX / plotW) * (ageMax - ageMin));
            setHoverAge(Math.max(ageMin, Math.min(ageMax, ageVal)));
          }}
          onMouseLeave={() => setHoverAge(null)}
          onClick={() => {
            if (hoverAge !== null && onAgeClick) {
              onAgeClick(hoverAge);
            }
          }}
        />
      )}
    </svg>
  );
}

function zone_bounds_ages(data: EkblomBakNormativeData): number[] {
  if (data.zones.length === 0) return [];
  return data.zones[0].bounds.map((b) => b.age);
}

function generateVo2Ticks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const step = 10;
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    ticks.push(v);
  }
  return ticks;
}
