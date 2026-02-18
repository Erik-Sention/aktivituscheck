import { RiskLevel } from '@/types/health';

const LOWER_IS_BETTER = ['weight', 'bodyFat', 'visceralFat', 'ldl', 'triglycerides', 'glucose', 'tcHdlRatio', 'systolic', 'diastolic', 'stress'];

export function computeDelta(current: number, previous?: number | null): number | null {
  if (previous == null) return null;
  const delta = current - previous;
  return Math.abs(delta) < 0.001 ? 0 : delta;
}

export function isDeltaImprovement(metricKey: string, delta: number): boolean {
  if (LOWER_IS_BETTER.includes(metricKey)) return delta < 0;
  return delta > 0;
}

export function getDeltaColor(metricKey: string, delta: number): string {
  if (delta === 0) return '#9A9488';
  return isDeltaImprovement(metricKey, delta) ? '#8FB3A3' : '#C4A47C';
}

export function formatDelta(metricKey: string, delta: number, decimals: number = 1): string {
  const improved = isDeltaImprovement(metricKey, delta);
  const arrow = improved ? '▲' : '▼';
  const sign = delta > 0 ? '+' : '';
  return `${arrow} ${sign}${delta.toFixed(decimals)}`;
}

export function getRiskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'optimal': return 'Optimalt';
    case 'good': return 'Bra';
    case 'warning': return 'Varning';
    case 'high-risk': return 'Högrisk';
  }
}
