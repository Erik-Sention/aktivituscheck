'use client';

import React, { useState, useCallback } from 'react';
import {
  DataSeries,
  ReferenceZone,
  PADDING,
  PADDING_COMPACT,
  createScaleX,
  createScaleY,
  computeYRange,
  generateTicks,
  buildLinePath,
  formatDateParts,
  getZoneColor,
} from './trendUtils';

interface TrendMultiLineChartProps {
  series: DataSeries[];
  label?: string;
  unit: string;
  zones?: ReferenceZone[];
  width?: number;
  height?: number;
  yMin?: number;
  yMax?: number;
  compact?: boolean;
}

export function TrendMultiLineChart({
  series,
  label = 'Alla metriker',
  unit,
  zones,
  width = 800,
  height = 280,
  yMin,
  yMax,
  compact = false,
}: TrendMultiLineChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const pad = compact ? PADDING_COMPACT : PADDING;

  const visibleSeries = series.filter(s => !hiddenKeys.has(s.key));
  const allValues = visibleSeries.flatMap(s => s.data.map(d => d.value));
  const autoRange = computeYRange(allValues.length > 0 ? allValues : [0, 10], zones);
  const yMinFinal = yMin ?? autoRange.min;
  const yMaxFinal = yMax ?? autoRange.max;

  const dateCount = series[0]?.data.length || 0;
  const toX = createScaleX(dateCount, width, pad);
  const toY = createScaleY(yMinFinal, yMaxFinal, height, pad);
  const ticks = generateTicks(yMinFinal, yMaxFinal, compact ? 4 : 6);

  const toggleKey = (key: string) => {
    setHiddenKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < dateCount; i++) {
      const dist = Math.abs(toX(i) - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setHoverIndex(closestDist < 50 ? closest : null);
  }, [dateCount, toX]);

  const plotBottom = height - pad.bottom;
  const plotTop = pad.top;

  const tickFs = compact ? 7 : 9;
  const xLabelFs = compact ? 6 : 8;
  const dotR1 = compact ? 4 : 5;
  const dotR2 = compact ? 2.5 : 3.5;
  const dotR3 = compact ? 0.8 : 1;
  const lineW = compact ? 1.2 : 1.5;

  return (
    <div>
      <div className="mb-1" style={{ paddingLeft: `${pad.left}px` }}>
        <span className={`${compact ? 'text-[7px]' : 'text-[10px]'} uppercase tracking-widest text-[#7a8a9a] font-semibold`}>
          {label}
        </span>
        <span className={`${compact ? 'text-[5px]' : 'text-[8px]'} uppercase tracking-normal text-[#9aafc7] ml-1`}>
          ({unit})
        </span>
      </div>

      <svg
        width={width}
        height={height}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Reference zones */}
        {zones?.map((zone, i) => {
          const clampedLow = Math.max(zone.low, yMinFinal);
          const clampedHigh = Math.min(zone.high, yMaxFinal);
          if (clampedLow >= clampedHigh) return null;
          return (
            <rect
              key={i}
              x={pad.left}
              y={toY(clampedHigh)}
              width={width - pad.left - pad.right}
              height={toY(clampedLow) - toY(clampedHigh)}
              fill={zone.color}
              opacity={zone.opacity}
              rx={compact ? 2 : 4}
            />
          );
        })}

        {/* Grid lines */}
        {ticks.map(tick => (
          <g key={tick}>
            <line
              x1={pad.left}
              y1={toY(tick)}
              x2={width - pad.right}
              y2={toY(tick)}
              stroke="#E5E0D8"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
            <text
              x={pad.left - (compact ? 4 : 8)}
              y={toY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#9A9488"
              fontSize={tickFs}
              fontFamily="Inter, sans-serif"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis labels (two lines) */}
        {series[0]?.data.map((d, i) => {
          const { month, year } = formatDateParts(d.date);
          return (
            <text key={d.date} textAnchor="middle" fill="#9A9488" fontSize={xLabelFs} fontFamily="Inter, sans-serif">
              <tspan x={toX(i)} y={plotBottom + (compact ? 8 : 12)}>{month}</tspan>
              <tspan x={toX(i)} y={plotBottom + (compact ? 15 : 21)}>{year}</tspan>
            </text>
          );
        })}

        {/* Lines — different dash patterns so overlapping lines are visible */}
        {visibleSeries.map((s, si) => {
          const pts = s.data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
          // Index 0: solid, 1: dashed, 2: dotted
          const origIndex = series.findIndex(orig => orig.key === s.key);
          const dashArray = origIndex === 0 ? 'none' : origIndex === 1 ? '6 3' : '2 3';
          return (
            <g key={s.key}>
              {pts.length > 1 && (
                <path
                  d={buildLinePath(pts)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={lineW}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={dashArray}
                  opacity={0.9}
                />
              )}
              {/* Dots at each data point — colored by zone */}
              {pts.map((p, i) => {
                const dotColor = zones ? getZoneColor(s.data[i].value, zones) : s.color;
                return (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={dotR1} fill={dotColor} opacity={0.25} />
                    <circle cx={p.x} cy={p.y} r={dotR2} fill={dotColor} />
                    <circle cx={p.x} cy={p.y} r={dotR3} fill="white" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Hover crosshair */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={toX(hoverIndex)}
              y1={plotTop}
              x2={toX(hoverIndex)}
              y2={plotBottom}
              stroke="#9A9488"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
            {/* Tooltip */}
            <g transform={`translate(${Math.min(toX(hoverIndex), width - 90)}, ${plotTop - 4})`}>
              <rect
                x={-4}
                y={-6 - visibleSeries.length * 14}
                width={82}
                height={visibleSeries.length * 14 + 4}
                rx={6}
                fill="white"
                stroke="#E5E0D8"
                strokeWidth={0.5}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"
              />
              {visibleSeries.map((s, si) => (
                <text
                  key={s.key}
                  x={6}
                  y={-visibleSeries.length * 14 + si * 14 + 6}
                  fill={s.color}
                  fontSize={9}
                  fontWeight={500}
                  fontFamily="Inter, sans-serif"
                >
                  {s.label}: {s.data[hoverIndex]?.value ?? '–'}
                </text>
              ))}
            </g>
          </g>
        )}
      </svg>

      {/* Legend with line style indicators */}
      <div className={`flex flex-wrap gap-x-3 gap-y-0.5 ${compact ? 'mt-1' : 'mt-3'}`} style={{ paddingLeft: `${pad.left}px` }}>
        {series.map((s, si) => {
          const hidden = hiddenKeys.has(s.key);
          const dash = si === 0 ? 'none' : si === 1 ? '4 2' : '1.5 2';
          return (
            <button
              key={s.key}
              onClick={() => toggleKey(s.key)}
              className={`flex items-center gap-1 ${compact ? 'text-[7px]' : 'text-[10px]'} font-medium transition-opacity ${hidden ? 'opacity-30' : 'opacity-100'}`}
            >
              <svg width={compact ? 12 : 16} height={compact ? 6 : 8} className="overflow-visible">
                <line x1={0} y1={compact ? 3 : 4} x2={compact ? 12 : 16} y2={compact ? 3 : 4}
                  stroke={s.color} strokeWidth={compact ? 1.5 : 2} strokeDasharray={dash} strokeLinecap="round" />
              </svg>
              <span className="text-[#4A4642]">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
