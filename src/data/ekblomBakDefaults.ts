import { EkblomBakNormativeData } from '@/types/health';

// Real Ekblom-Bak normative data — VO2max (ml/min/kg)
// Sources: Ekblom-Bak reference tables by gender
// Ages use midpoint of each decade bracket (25, 35, 45, 55, 65)

export const maleEkblomBakData: EkblomBakNormativeData = {
  zones: [
    {
      label: 'Mycket hög',
      color: '#8FB3A3',
      bounds: [
        { age: 25, vo2Min: 62, vo2Max: 70 },
        { age: 35, vo2Min: 58, vo2Max: 66 },
        { age: 45, vo2Min: 56, vo2Max: 64 },
        { age: 55, vo2Min: 53, vo2Max: 61 },
        { age: 65, vo2Min: 49, vo2Max: 57 },
      ],
    },
    {
      label: 'Hög',
      color: '#C8D6C7',
      bounds: [
        { age: 25, vo2Min: 53, vo2Max: 62 },
        { age: 35, vo2Min: 50, vo2Max: 58 },
        { age: 45, vo2Min: 48, vo2Max: 56 },
        { age: 55, vo2Min: 45, vo2Max: 53 },
        { age: 65, vo2Min: 41, vo2Max: 49 },
      ],
    },
    {
      label: 'Medel',
      color: '#E5E0D8',
      bounds: [
        { age: 25, vo2Min: 44, vo2Max: 52 },
        { age: 35, vo2Min: 42, vo2Max: 49 },
        { age: 45, vo2Min: 39, vo2Max: 47 },
        { age: 55, vo2Min: 37, vo2Max: 44 },
        { age: 65, vo2Min: 33, vo2Max: 40 },
      ],
    },
    {
      label: 'Låg',
      color: '#D9C5B2',
      bounds: [
        { age: 25, vo2Min: 34, vo2Max: 43 },
        { age: 35, vo2Min: 31, vo2Max: 41 },
        { age: 45, vo2Min: 27, vo2Max: 38 },
        { age: 55, vo2Min: 25, vo2Max: 36 },
        { age: 65, vo2Min: 23, vo2Max: 32 },
      ],
    },
    {
      label: 'Mycket låg',
      color: '#C4A47C',
      bounds: [
        { age: 25, vo2Min: 15, vo2Max: 33 },
        { age: 35, vo2Min: 15, vo2Max: 30 },
        { age: 45, vo2Min: 15, vo2Max: 26 },
        { age: 55, vo2Min: 15, vo2Max: 24 },
        { age: 65, vo2Min: 15, vo2Max: 22 },
      ],
    },
  ],
  ageRange: [20, 70],
  vo2Range: [15, 70],
};

export const femaleEkblomBakData: EkblomBakNormativeData = {
  zones: [
    {
      label: 'Mycket hög',
      color: '#8FB3A3',
      bounds: [
        { age: 25, vo2Min: 53, vo2Max: 61 },
        { age: 35, vo2Min: 51, vo2Max: 59 },
        { age: 45, vo2Min: 48, vo2Max: 56 },
        { age: 55, vo2Min: 45, vo2Max: 53 },
        { age: 65, vo2Min: 43, vo2Max: 51 },
      ],
    },
    {
      label: 'Hög',
      color: '#C8D6C7',
      bounds: [
        { age: 25, vo2Min: 45, vo2Max: 53 },
        { age: 35, vo2Min: 43, vo2Max: 51 },
        { age: 45, vo2Min: 41, vo2Max: 48 },
        { age: 55, vo2Min: 38, vo2Max: 45 },
        { age: 65, vo2Min: 35, vo2Max: 43 },
      ],
    },
    {
      label: 'Medel',
      color: '#E5E0D8',
      bounds: [
        { age: 25, vo2Min: 37, vo2Max: 44 },
        { age: 35, vo2Min: 35, vo2Max: 42 },
        { age: 45, vo2Min: 33, vo2Max: 40 },
        { age: 55, vo2Min: 30, vo2Max: 37 },
        { age: 65, vo2Min: 27, vo2Max: 34 },
      ],
    },
    {
      label: 'Låg',
      color: '#D9C5B2',
      bounds: [
        { age: 25, vo2Min: 28, vo2Max: 36 },
        { age: 35, vo2Min: 26, vo2Max: 34 },
        { age: 45, vo2Min: 23, vo2Max: 32 },
        { age: 55, vo2Min: 21, vo2Max: 29 },
        { age: 65, vo2Min: 18, vo2Max: 26 },
      ],
    },
    {
      label: 'Mycket låg',
      color: '#C4A47C',
      bounds: [
        { age: 25, vo2Min: 15, vo2Max: 27 },
        { age: 35, vo2Min: 15, vo2Max: 25 },
        { age: 45, vo2Min: 15, vo2Max: 22 },
        { age: 55, vo2Min: 15, vo2Max: 20 },
        { age: 65, vo2Min: 15, vo2Max: 17 },
      ],
    },
  ],
  ageRange: [20, 70],
  vo2Range: [15, 61],
};

export function getEkblomBakData(gender?: 'male' | 'female'): EkblomBakNormativeData {
  return gender === 'female' ? femaleEkblomBakData : maleEkblomBakData;
}
