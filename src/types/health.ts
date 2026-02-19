export type RiskLevel = 'optimal' | 'good' | 'warning' | 'high-risk';

export interface BloodWork {
  hb: number; // Hemoglobin (g/L)
  glucose: number; // Fasting glucose (mmol/L)
  hdl: number; // HDL cholesterol (mmol/L)
  ldl: number; // LDL cholesterol (mmol/L)
  triglycerides: number; // Triglycerides (mmol/L)
  tcHdlRatio?: number; // TC/HDL kvot (computed if not provided)
  ldlHdlRatio?: number; // LDL/HDL kvot (computed if not provided)
}

export interface LifestyleRatings {
  sleep: number; // 1-10  Sömn
  diet: number; // 1-10  Kost
  stress: number; // 1-10  Stress
  relationships: number; // 1-10  Relationer
  smoking: number; // 1-10  Rökning (10 = röker inte)
  balance: number; // 1-10  Balans arbete/fritid
  exercise: number; // 1-10  Träning
  alcohol: number; // 1-10  Alkohol (10 = dricker inte)
}

export interface FitnessTests {
  vo2Max: number; // ml/kg/min
  gripStrength: number; // kg
}

export interface BodyComposition {
  bodyFat: number; // percentage
  muscleMass: number; // percentage
  visceralFat: number; // InBody scale 1-20
  weight: number; // kg
  height: number; // cm
}

export interface BloodPressure {
  systolic: number; // mmHg
  diastolic: number; // mmHg
}

export interface HealthData {
  bloodWork: BloodWork;
  lifestyle: LifestyleRatings;
  fitness: FitnessTests;
  bodyComposition: BodyComposition;
  bloodPressure: BloodPressure;
  date: string;
  firstname?: string;
  lastname?: string;
  personnummer?: string;
  age?: number;
  gender?: 'male' | 'female';
}

export interface IndividualMetricRisks {
  hb: RiskLevel;
  glucose: RiskLevel;
  hdl: RiskLevel;
  ldl: RiskLevel;
  triglycerides: RiskLevel;
  tcHdlRatio: RiskLevel;
  ldlHdlRatio: RiskLevel;
  bodyFat: RiskLevel;
  visceralFat: RiskLevel;
  bloodPressure: RiskLevel;
  vo2Max: RiskLevel;
}

export interface EvaluatedHealthData extends HealthData {
  scores: {
    bloodWorkScore: { value: number; risk: RiskLevel };
    lifestyleScore: { value: number; risk: RiskLevel };
    fitnessScore: { value: number; risk: RiskLevel };
    bodyCompositionScore: { value: number; risk: RiskLevel };
    bloodPressureScore: { value: number; risk: RiskLevel };
    overallScore: { value: number; risk: RiskLevel };
  };
  metricRisks: IndividualMetricRisks;
}

export interface Trend {
  date: string;
  value: number;
  label?: string;
}

export interface MetricTrend {
  name: string;
  unit: string;
  current: number;
  previous?: number;
  trend: Trend[];
  changePercent?: number;
  isImprovement?: boolean;
}

export interface HistoricalHealthData {
  entries: EvaluatedHealthData[];
  trends: {
    [key: string]: MetricTrend;
  };
}

// Focus Areas
export type FocusAreaKey = 'sleep' | 'diet' | 'stress' | 'relationships' | 'smoking' | 'balance' | 'exercise' | 'alcohol';

export interface FocusArea {
  key: FocusAreaKey;
  label: string;
  iconName: string;
  description: string;
}

// Ekblom-Bak Normative Data
export interface NormativeZone {
  label: string;
  color: string;
  bounds: { age: number; vo2Min: number; vo2Max: number }[];
}

export interface EkblomBakNormativeData {
  zones: NormativeZone[];
  ageRange: [number, number];
  vo2Range: [number, number];
}
