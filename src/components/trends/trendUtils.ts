import { EvaluatedHealthData } from '@/types/health';
import { getBloodRefRange } from '@/utils/healthEvaluation';

// ── Types ──

export interface DataPoint {
  date: string;
  value: number;
}

export interface ReferenceZone {
  low: number;
  high: number;
  color: string;
  opacity: number;
}

export interface DataSeries {
  key: string;
  label: string;
  data: DataPoint[];
  color: string;
}

// ── Coordinate transforms ──

export type Padding = { top: number; right: number; bottom: number; left: number };

export const PADDING: Padding = { top: 20, right: 20, bottom: 32, left: 24 };
export const PADDING_COMPACT: Padding = { top: 14, right: 10, bottom: 22, left: 16 };

export function createScaleX(count: number, width: number, pad: Padding = PADDING): (index: number) => number {
  const plotWidth = width - pad.left - pad.right;
  if (count <= 1) return () => pad.left + plotWidth / 2;
  return (i: number) => pad.left + (i / (count - 1)) * plotWidth;
}

export function createScaleY(min: number, max: number, height: number, pad: Padding = PADDING): (value: number) => number {
  const plotTop = pad.top;
  const plotBottom = height - pad.bottom;
  const range = max - min || 1;
  return (v: number) => plotBottom - ((v - min) / range) * (plotBottom - plotTop);
}

// ── Y-axis ticks ──

export function generateTicks(min: number, max: number, targetCount: number = 5): number[] {
  const range = max - min;
  if (range === 0) return [min];

  const rawStep = range / (targetCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 2.5, 5, 10];
  const step = candidates.map(c => c * magnitude).find(s => s >= rawStep) || rawStep;

  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.01; v += step) {
    if (v >= min - step * 0.01) ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

// ── Y range with padding ──

export function computeYRange(
  values: number[],
  zones?: ReferenceZone[]
): { min: number; max: number } {
  let min = Math.min(...values);
  let max = Math.max(...values);

  // Include zone boundaries in range
  if (zones) {
    for (const z of zones) {
      if (z.low > -100) min = Math.min(min, z.low);
      if (z.high < 900) max = Math.max(max, z.high);
    }
  }

  // Add 10% padding
  const pad = (max - min) * 0.1 || 1;
  return { min: min - pad, max: max + pad };
}

// ── SVG path builder ──

export function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

// ── Date formatting ──

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '');
  const year = d.getFullYear().toString().slice(-2);
  return `${month} ${year}`;
}

export function formatDateParts(dateStr: string): { month: string; year: string } {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '');
  const year = d.getFullYear().toString().slice(-2);
  return { month, year };
}

// ── Zone color lookup ──

export function getZoneColor(value: number, zones?: ReferenceZone[]): string {
  if (!zones || zones.length === 0) return '#004B87';
  // Iterate from highest zone to prefer "better" zone at boundaries
  for (let i = zones.length - 1; i >= 0; i--) {
    if (value >= zones[i].low && value <= zones[i].high) {
      return zones[i].color;
    }
  }
  return '#9A9488';
}

// ── Extract chart data from entries ──

export function extractMetricData(
  entries: EvaluatedHealthData[],
  getValue: (e: EvaluatedHealthData) => number,
): DataPoint[] {
  return entries.map(e => ({ date: e.date, value: getValue(e) }));
}

// ── Reference zone builders ──

export function buildLifestyleZones(): ReferenceZone[] {
  return [
    { low: 0, high: 4, color: '#C87979', opacity: 0.15 },
    { low: 4, high: 8, color: '#C4A47C', opacity: 0.18 },
    { low: 8, high: 10, color: '#8FB3A3', opacity: 0.22 },
  ];
}

export function buildBloodRefZones(
  metric: 'hb' | 'glucose' | 'ldl' | 'hdl' | 'triglycerides' | 'tcHdlRatio' | 'ldlHdlRatio',
  gender?: 'male' | 'female',
  age?: number,
): ReferenceZone[] {
  const ref = getBloodRefRange(metric, gender, age);
  const zones: ReferenceZone[] = [];

  // Red below yellow
  if (ref.yellowLow > 0) {
    zones.push({ low: ref.yellowLow * 0.7, high: ref.yellowLow, color: '#C87979', opacity: 0.15 });
  }
  // Yellow below green
  if (ref.yellowLow < ref.greenLow) {
    zones.push({ low: ref.yellowLow, high: ref.greenLow, color: '#C4A47C', opacity: 0.18 });
  }
  // Green zone
  if (ref.greenHigh < 900) {
    zones.push({ low: ref.greenLow, high: ref.greenHigh, color: '#8FB3A3', opacity: 0.22 });
  } else {
    // One-directional (e.g. HDL: higher is better)
    zones.push({ low: ref.greenLow, high: ref.greenLow * 3, color: '#8FB3A3', opacity: 0.22 });
  }
  // Yellow above green
  if (ref.yellowHigh < 900 && ref.yellowHigh > ref.greenHigh) {
    zones.push({ low: ref.greenHigh, high: ref.yellowHigh, color: '#C4A47C', opacity: 0.18 });
  }
  // Red above yellow
  if (ref.yellowHigh < 900) {
    zones.push({ low: ref.yellowHigh, high: ref.yellowHigh * 1.3, color: '#C87979', opacity: 0.15 });
  }

  return zones;
}

export function buildBodyFatZones(gender?: 'male' | 'female'): ReferenceZone[] {
  if (gender === 'female') {
    return [
      { low: 0, high: 10, color: '#C87979', opacity: 0.15 },
      { low: 10, high: 18, color: '#C4A47C', opacity: 0.18 },
      { low: 18, high: 28, color: '#8FB3A3', opacity: 0.22 },
      { low: 28, high: 35, color: '#C4A47C', opacity: 0.18 },
      { low: 35, high: 45, color: '#C87979', opacity: 0.15 },
    ];
  }
  return [
    { low: 0, high: 10, color: '#C87979', opacity: 0.15 },
    { low: 10, high: 20, color: '#8FB3A3', opacity: 0.22 },
    { low: 20, high: 25, color: '#C4A47C', opacity: 0.18 },
    { low: 25, high: 35, color: '#C87979', opacity: 0.15 },
  ];
}

export function buildVisceralFatZones(): ReferenceZone[] {
  // InBody scale 1-20: Optimal 1–9, Warning 10–14, High-risk ≥15
  return [
    { low: 0, high: 9, color: '#8FB3A3', opacity: 0.22 },
    { low: 9, high: 14, color: '#C4A47C', opacity: 0.18 },
    { low: 14, high: 20, color: '#C87979', opacity: 0.15 },
  ];
}

export function buildBPZones(): ReferenceZone[] {
  return [
    { low: 60, high: 120, color: '#8FB3A3', opacity: 0.22 },
    { low: 120, high: 140, color: '#C4A47C', opacity: 0.18 },
    { low: 140, high: 180, color: '#C87979', opacity: 0.15 },
  ];
}

// VO2 Max zones from Ekblom-Bak thresholds
export function buildVO2Zones(gender?: 'male' | 'female', age?: number): ReferenceZone[] {
  // Import thresholds inline to avoid circular dependency
  const VO2_THRESHOLDS = {
    male: [
      { maxAge: 29, low: 34, medium: 44, high: 53 },
      { maxAge: 39, low: 31, medium: 42, high: 50 },
      { maxAge: 49, low: 27, medium: 39, high: 48 },
      { maxAge: 59, low: 25, medium: 37, high: 45 },
      { maxAge: 99, low: 23, medium: 33, high: 41 },
    ],
    female: [
      { maxAge: 29, low: 28, medium: 37, high: 45 },
      { maxAge: 39, low: 26, medium: 35, high: 43 },
      { maxAge: 49, low: 23, medium: 33, high: 41 },
      { maxAge: 59, low: 21, medium: 30, high: 38 },
      { maxAge: 99, low: 18, medium: 27, high: 35 },
    ],
  };

  const g = gender || 'male';
  const a = age || 30;
  const table = VO2_THRESHOLDS[g];
  const row = table.find(r => a <= r.maxAge) || table[table.length - 1];

  return [
    { low: 0, high: row.low, color: '#C87979', opacity: 0.15 },
    { low: row.low, high: row.medium, color: '#C4A47C', opacity: 0.18 },
    { low: row.medium, high: row.high, color: '#8FB3A3', opacity: 0.18 },
    { low: row.high, high: row.high + 20, color: '#8FB3A3', opacity: 0.22 },
  ];
}

// ── Lifestyle line colors (8 distinct) ──

export const LIFESTYLE_COLORS: Record<string, string> = {
  sleep: '#004B87',
  diet: '#8FB3A3',
  stress: '#C4A47C',
  relationships: '#5B9289',
  smoking: '#9A6B4A',
  balance: '#7B8FA3',
  exercise: '#6A9B76',
  alcohol: '#B07D9E',
};
