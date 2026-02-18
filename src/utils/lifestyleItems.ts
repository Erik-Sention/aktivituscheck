import { EvaluatedHealthData, FocusAreaKey } from '@/types/health';

export interface LifestyleItem {
  key: FocusAreaKey;
  label: string;
  value: number;
  status: string;
}

export function getLifestyleItems(d: EvaluatedHealthData): LifestyleItem[] {
  return [
    { key: 'sleep', label: 'Sömn', value: d.lifestyle.sleep, status: 'status-good' },
    { key: 'diet', label: 'Kost', value: d.lifestyle.diet, status: 'status-good' },
    { key: 'stress', label: 'Stress', value: d.lifestyle.stress, status: 'status-mid' },
    { key: 'relationships', label: 'Relationer', value: d.lifestyle.relationships, status: 'status-good' },
    { key: 'smoking', label: 'Rökning', value: d.lifestyle.smoking, status: 'status-good' },
    { key: 'balance', label: 'Balans arbete/fritid', value: d.lifestyle.balance, status: 'status-good' },
    { key: 'exercise', label: 'Träning', value: d.lifestyle.exercise, status: 'status-good' },
    { key: 'alcohol', label: 'Alkohol', value: d.lifestyle.alcohol, status: 'status-mid' },
  ];
}
