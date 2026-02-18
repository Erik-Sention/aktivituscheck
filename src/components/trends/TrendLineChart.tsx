'use client';

import React, { useState, useCallback } from 'react';
import {
  DataPoint,
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

interface TrendLineChartProps {
  data: DataPoint[];
  label: string;
  unit: string;
  zones?: ReferenceZone[];
  width?: number;
  height?: number;
  color?: string;
  yMin?: number;
  yMax?: number;
  secondaryData?: DataPoint[];
  secondaryColor?: string;
  secondaryLabel?: string;
  decimals?: number;
  compact?: boolean;
  legendItems?: { label: string; color: string }[];
}

export function TrendLineChart({
  data,
  label,
  unit,
  zones,
  width = 400,
  height = 200,
  color = '#004B87',
  yMin,
  yMax,
  secondaryData,
  secondaryColor = '#8FB3A3',
  secondaryLabel,
  decimals = 1,
  compact = false,
  legendItems,
}: TrendLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const pad = compact ? PADDING_COMPACT : PADDING;

  // Compute Y range
  const allValues = [...data.map(d => d.value), ...(secondaryData?.map(d => d.value) || [])];
  const autoRange = computeYRange(allValues, zones);
  const yMinFinal = yMin ?? autoRange.min;
  const yMaxFinal = yMax ?? autoRange.max;

  // Scales
  const toX = createScaleX(data.length, width, pad);
  const toY = createScaleY(yMinFinal, yMaxFinal, height, pad);
  const ticks = generateTicks(yMinFinal, yMaxFinal, compact ? 4 : 5);

  // Points
  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const secondaryPoints = secondaryData?.map((d, i) => ({ x: toX(i), y: toY(d.value) }));

  // Hover handler
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(toX(i) - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    setHoverIndex(closestDist < 40 ? closest : null);
  }, [data.length, toX]);

  const plotBottom = height - pad.bottom;
  const plotTop = pad.top;

  // Compact sizing
  const dotR = compact ? 4.5 : 6;
  const dotR2 = compact ? 3 : 4.5;
  const dotR3 = compact ? 1 : 1.5;
  const secDotR = compact ? 4 : 5;
  const secDotR2 = compact ? 2.5 : 3.5;
  const secDotR3 = compact ? 0.8 : 1;
  const xLabelFs = compact ? 6 : 8;

  return (
    <div className="last:mb-0">
      <div className="mb-0.5" style={{ paddingLeft: `${pad.left}px` }}>
        <span className={`${compact ? 'text-[7px]' : 'text-[10px]'} uppercase tracking-widest text-[#9A9488] font-semibold`}>
          {label}
        </span>
        <span className={`${compact ? 'text-[5px]' : 'text-[8px]'} uppercase tracking-normal text-[#B5AFA2] ml-1`}>
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

        {/* Grid lines (no Y-axis labels — values shown above dots) */}
        {ticks.map((tick) => (
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
          </g>
        ))}

        {/* X-axis labels (two lines: month + year) */}
        {data.map((d, i) => {
          const { month, year } = formatDateParts(d.date);
          return (
            <text key={d.date} textAnchor="middle" fill="#9A9488" fontSize={xLabelFs} fontFamily="Inter, sans-serif">
              <tspan x={toX(i)} y={plotBottom + (compact ? 8 : 12)}>{month}</tspan>
              <tspan x={toX(i)} y={plotBottom + (compact ? 15 : 21)}>{year}</tspan>
            </text>
          );
        })}

        {/* Secondary line (e.g. diastolic) */}
        {secondaryPoints && secondaryPoints.length > 1 && (
          <path
            d={buildLinePath(secondaryPoints)}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={compact ? 1 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        )}

        {/* Main line */}
        {points.length > 1 && (
          <path
            d={buildLinePath(points)}
            fill="none"
            stroke={color}
            strokeWidth={compact ? 1.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data dots — colored by zone */}
        {points.map((p, i) => {
          const dotColor = zones ? getZoneColor(data[i].value, zones) : color;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={dotR} fill={dotColor} opacity={0.25} />
              <circle cx={p.x} cy={p.y} r={dotR2} fill={dotColor} />
              <circle cx={p.x} cy={p.y} r={dotR3} fill="white" />
            </g>
          );
        })}

        {/* Secondary dots */}
        {secondaryPoints?.map((p, i) => (
          <g key={`s-${i}`}>
            <circle cx={p.x} cy={p.y} r={secDotR} fill={secondaryColor} opacity={0.3} />
            <circle cx={p.x} cy={p.y} r={secDotR2} fill={secondaryColor} />
            <circle cx={p.x} cy={p.y} r={secDotR3} fill="white" />
          </g>
        ))}

        {/* Value labels above all data points */}
        {points.map((p, i) => {
          const val = data[i].value;
          const labelColor = zones ? getZoneColor(val, zones) : color;
          const displayVal = decimals === 0 ? val.toFixed(0) : val.toFixed(1);
          return (
            <text
              key={`lbl-${i}`}
              x={p.x}
              y={p.y - (compact ? 7 : 10)}
              textAnchor="middle"
              fill={labelColor}
              fontSize={compact ? 5.5 : 7.5}
              fontWeight={600}
              fontFamily="Inter, sans-serif"
            >
              {displayVal}
            </text>
          );
        })}

        {/* Secondary value labels */}
        {secondaryData && secondaryPoints?.map((p, i) => {
          const val = secondaryData[i].value;
          const displayVal = decimals === 0 ? val.toFixed(0) : val.toFixed(1);
          return (
            <text
              key={`slbl-${i}`}
              x={p.x}
              y={p.y + (compact ? 12 : 15)}
              textAnchor="middle"
              fill={secondaryColor}
              fontSize={compact ? 7 : 9}
              fontWeight={600}
              fontFamily="Inter, sans-serif"
              opacity={0.7}
            >
              {displayVal}
            </text>
          );
        })}

        {/* Hover crosshair + tooltip */}
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
            {/* Tooltip box */}
            <g transform={`translate(${toX(hoverIndex)}, ${plotTop - 4})`}>
              <rect
                x={-36}
                y={-28}
                width={72}
                height={secondaryData ? 36 : 24}
                rx={6}
                fill="white"
                stroke="#E5E0D8"
                strokeWidth={0.5}
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))"
              />
              <text
                x={0}
                y={-14}
                textAnchor="middle"
                fill="#4A4642"
                fontSize={10}
                fontWeight={600}
                fontFamily="Inter, sans-serif"
              >
                {data[hoverIndex].value.toFixed(decimals)}
                {secondaryData && (
                  <tspan fill={secondaryColor}> / {secondaryData[hoverIndex].value.toFixed(decimals)}</tspan>
                )}
              </text>
              {secondaryData && secondaryLabel && (
                <text x={0} y={0} textAnchor="middle" fill="#9A9488" fontSize={7} fontFamily="Inter, sans-serif">
                  {label} / {secondaryLabel}
                </text>
              )}
            </g>
          </g>
        )}
      </svg>

      {/* Legend (e.g. for blood pressure: Systoliskt / Diastoliskt) */}
      {legendItems && legendItems.length > 0 && (
        <div className={`flex gap-x-4 ${compact ? 'mt-1' : 'mt-2'}`}>
          {legendItems.map(item => (
            <div key={item.label} className={`flex items-center gap-1 ${compact ? 'text-[7px]' : 'text-[10px]'} font-medium`}>
              <span
                className={`inline-block ${compact ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} rounded-full`}
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#4A4642]">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
