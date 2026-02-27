import { EvaluatedHealthData, FocusAreaKey } from '@/types/health';

export interface LifestyleItem {
  key: FocusAreaKey;
  label: string;
  value: number;
  status: string;
}

function lifestyleStatus(value: number): string {
  if (value >= 8) return 'status-good';
  if (value >= 4) return 'status-mid';
  return 'status-alert';
}

export function getLifestyleItems(d: EvaluatedHealthData): LifestyleItem[] {
  return [
    { key: 'sleep', label: 'Sömn', value: d.lifestyle.sleep, status: lifestyleStatus(d.lifestyle.sleep) },
    { key: 'diet', label: 'Kost', value: d.lifestyle.diet, status: lifestyleStatus(d.lifestyle.diet) },
    { key: 'stress', label: 'Stress', value: d.lifestyle.stress, status: lifestyleStatus(d.lifestyle.stress) },
    { key: 'relationships', label: 'Relationer', value: d.lifestyle.relationships, status: lifestyleStatus(d.lifestyle.relationships) },
    { key: 'smoking', label: 'Rökning', value: d.lifestyle.smoking, status: lifestyleStatus(d.lifestyle.smoking) },
    { key: 'balance', label: 'Balans arbete/fritid', value: d.lifestyle.balance, status: lifestyleStatus(d.lifestyle.balance) },
    { key: 'exercise', label: 'Träning', value: d.lifestyle.exercise, status: lifestyleStatus(d.lifestyle.exercise) },
    { key: 'alcohol', label: 'Alkohol', value: d.lifestyle.alcohol, status: lifestyleStatus(d.lifestyle.alcohol) },
  ];
}
