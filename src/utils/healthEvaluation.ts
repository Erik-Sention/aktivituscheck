import { HealthData, EvaluatedHealthData, RiskLevel, IndividualMetricRisks } from '@/types/health';

type ScoreResult = { value: number; risk: RiskLevel };

export interface BloodRefRange {
  // Slider bar positioning (practical visual range)
  low: number;
  high: number;
  // Medical evaluation zones
  greenLow: number;
  greenHigh: number;
  yellowLow: number;
  yellowHigh: number;
}

// ── Ekblom-Bak VO2 Max thresholds by gender and age ──
// Zones: Mycket låg → high-risk, Låg → warning, Medel → good, Hög/Mycket hög → optimal
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

function getVO2Thresholds(gender?: 'male' | 'female', age?: number) {
  const g = gender || 'male';
  const a = age || 30;
  const table = VO2_THRESHOLDS[g];
  return table.find(r => a <= r.maxAge) || table[table.length - 1];
}

export function getBloodRefRange(
  metric: 'hb' | 'glucose' | 'ldl' | 'hdl' | 'triglycerides' | 'tcHdlRatio' | 'ldlHdlRatio',
  gender?: 'male' | 'female',
  age?: number
): BloodRefRange {
  switch (metric) {
    case 'hb':
      // Male: Green 141–165, Yellow 134–140 / 166–170, Red <134 / >170
      // Female: Green 121–144, Yellow 117–120 / 145–153, Red <117 / >153
      return gender === 'female'
        ? { low: 121, high: 144, greenLow: 121, greenHigh: 144, yellowLow: 117, yellowHigh: 153 }
        : { low: 141, high: 165, greenLow: 141, greenHigh: 165, yellowLow: 134, yellowHigh: 170 };

    case 'glucose':
      // No user-provided reference data (HbA1c used clinically); reasonable defaults
      return { low: 4.2, high: 6.0, greenLow: 4.2, greenHigh: 6.0, yellowLow: 3.75, yellowHigh: 6.45 };

    case 'ldl':
      // Lower is better — no lower yellow/red zone
      // 18–30: Green 0–4.0, Yellow 4.1–4.3, Red ≥ 4.4
      // 31–50: Green 1.7–4.2, Yellow 4.3–4.7, Red ≥ 4.8
      // > 50:  Green 0–4.9, Yellow 5.0–5.3, Red ≥ 5.4
      if (age && age > 50)
        return { low: 1.0, high: 4.9, greenLow: 0, greenHigh: 4.9, yellowLow: 0, yellowHigh: 5.3 };
      if (age && age > 30)
        return { low: 1.7, high: 4.2, greenLow: 0, greenHigh: 4.2, yellowLow: 0, yellowHigh: 4.7 };
      return { low: 1.0, high: 4.0, greenLow: 0, greenHigh: 4.0, yellowLow: 0, yellowHigh: 4.3 };

    case 'hdl':
      // Higher is better — no upper yellow/red zone
      // Male:   Green ≥ 1.11, Yellow 0.8–1.0, Red < 0.8
      // Female: Green ≥ 1.11, Yellow 1.0–1.1, Red < 1.0
      return gender === 'female'
        ? { low: 0.8, high: 2.5, greenLow: 1.11, greenHigh: 999, yellowLow: 1.0, yellowHigh: 999 }
        : { low: 0.8, high: 2.5, greenLow: 1.11, greenHigh: 999, yellowLow: 0.8, yellowHigh: 999 };

    case 'triglycerides':
      // Lower is better — Green 0–2.3, Yellow 2.4–2.69, Red ≥ 2.7
      return { low: 0.3, high: 2.3, greenLow: 0, greenHigh: 2.3, yellowLow: 0, yellowHigh: 2.69 };

    case 'tcHdlRatio':
      // Lower is better — Optimal < 3.5, Warning 3.5–5.0, High-risk > 5.0
      return { low: 1.5, high: 3.5, greenLow: 0, greenHigh: 3.5, yellowLow: 0, yellowHigh: 5.0 };

    case 'ldlHdlRatio':
      // Lower is better — Optimal < 3.0, Warning 3.0–4.0, High-risk > 4.0
      return { low: 0.5, high: 3.0, greenLow: 0, greenHigh: 3.0, yellowLow: 0, yellowHigh: 4.0 };
  }
}

// Compute TC/HDL ratio from blood values (Friedewald: TC = LDL + HDL + TG/2.2)
// Returns provided value if available, otherwise computes from LDL, HDL, and triglycerides
export function computeTcHdlRatio(bloodWork: { hdl: number; ldl: number; triglycerides: number; tcHdlRatio?: number }): number {
  if (bloodWork.tcHdlRatio !== undefined) return bloodWork.tcHdlRatio;
  const tc = bloodWork.ldl + bloodWork.hdl + bloodWork.triglycerides / 2.2;
  return Math.round((tc / bloodWork.hdl) * 10) / 10;
}

// Compute LDL/HDL ratio
// Returns provided value if available, otherwise computes from LDL and HDL
export function computeLdlHdlRatio(bloodWork: { hdl: number; ldl: number; ldlHdlRatio?: number }): number {
  if (bloodWork.ldlHdlRatio !== undefined) return bloodWork.ldlHdlRatio;
  return Math.round((bloodWork.ldl / bloodWork.hdl) * 10) / 10;
}

function evaluateBloodMetric(value: number, ref: BloodRefRange): RiskLevel {
  if (value >= ref.greenLow && value <= ref.greenHigh) return 'optimal';
  if (value >= ref.yellowLow && value <= ref.yellowHigh) return 'warning';
  return 'high-risk';
}

// Blood work overall score — uses correct Swedish units (g/L, mmol/L)
function evaluateBloodWork(bw: HealthData['bloodWork'], gender?: 'male' | 'female', age?: number): ScoreResult {
  let score = 100;
  const risks: RiskLevel[] = [];

  const metrics: Array<{ key: 'hb' | 'glucose' | 'hdl' | 'ldl' | 'triglycerides'; value: number; weight: number }> = [
    { key: 'hb', value: bw.hb, weight: 25 },
    { key: 'glucose', value: bw.glucose, weight: 25 },
    { key: 'hdl', value: bw.hdl, weight: 20 },
    { key: 'ldl', value: bw.ldl, weight: 15 },
    { key: 'triglycerides', value: bw.triglycerides, weight: 15 },
  ];

  for (const m of metrics) {
    const ref = getBloodRefRange(m.key, gender, age);
    const risk = evaluateBloodMetric(m.value, ref);
    risks.push(risk);
    if (risk === 'high-risk') score -= m.weight;
    else if (risk === 'warning') score -= Math.round(m.weight * 0.5);
  }

  const risk = risks.includes('high-risk')
    ? ('high-risk' as RiskLevel)
    : risks.includes('warning')
      ? ('warning' as RiskLevel)
      : ('optimal' as RiskLevel);

  return { value: Math.max(0, score), risk };
}

function evaluateLifestyle(lifestyle: HealthData['lifestyle']): ScoreResult {
  const average = (lifestyle.sleep + lifestyle.diet + lifestyle.stress + lifestyle.relationships + lifestyle.smoking + lifestyle.balance + lifestyle.exercise + lifestyle.alcohol) / 8;

  const score = average * 10;
  let risk: RiskLevel;

  if (average >= 8) risk = 'optimal';
  else if (average >= 6) risk = 'good';
  else if (average >= 4) risk = 'warning';
  else risk = 'high-risk';

  return { value: score, risk };
}

function evaluateFitness(fitness: HealthData['fitness'], gender?: 'male' | 'female', age?: number): ScoreResult {
  let score = 100;
  const risks: RiskLevel[] = [];

  // VO2 Max — Ekblom-Bak age/gender thresholds
  const t = getVO2Thresholds(gender, age);
  if (fitness.vo2Max < t.low) { score -= 30; risks.push('high-risk'); }
  else if (fitness.vo2Max < t.medium) { score -= 15; risks.push('warning'); }
  else if (fitness.vo2Max < t.high) { score -= 5; risks.push('good'); }
  else risks.push('optimal');

  // Grip Strength (no gender-specific data provided; keeping current thresholds)
  if (fitness.gripStrength < 20) { score -= 20; risks.push('warning'); }
  else if (fitness.gripStrength >= 30) risks.push('optimal');
  else risks.push('good');

  const risk = risks.includes('high-risk')
    ? ('high-risk' as RiskLevel)
    : risks.includes('warning')
      ? ('warning' as RiskLevel)
      : ('optimal' as RiskLevel);

  return { value: Math.max(0, score), risk };
}

function evaluateBodyComposition(bc: HealthData['bodyComposition'], gender?: 'male' | 'female'): ScoreResult {
  let score = 100;
  let risk: RiskLevel;
  const bf = bc.bodyFat;

  if (gender === 'female') {
    // Female: Green 18–28, Yellow 10–17.9 / 29–35, Red < 10 / > 35
    if (bf < 10 || bf > 35) { score -= 30; risk = 'high-risk'; }
    else if (bf < 18 || bf > 28) { score -= 15; risk = 'warning'; }
    else risk = 'optimal';
  } else {
    // Male: Green 10–20, Yellow 21–25, Red < 10 / > 25
    if (bf < 10 || bf > 25) { score -= 30; risk = 'high-risk'; }
    else if (bf > 20) { score -= 15; risk = 'warning'; }
    else risk = 'optimal';
  }

  return { value: Math.max(0, score), risk };
}

function evaluateBloodPressure(bp: HealthData['bloodPressure']): ScoreResult {
  let score = 100;
  let risk: RiskLevel;

  // BP categories: Normal <120/<80, Elevated 120-129/<80, Stage 1 130-139/80-89, Stage 2 >=140/>=90
  if (bp.systolic >= 140 || bp.diastolic >= 90) { score -= 30; risk = 'high-risk'; }
  else if (bp.systolic >= 130 || bp.diastolic >= 80) { score -= 15; risk = 'warning'; }
  else if (bp.systolic >= 120) { score -= 5; risk = 'good'; }
  else risk = 'optimal';

  return { value: Math.max(0, score), risk };
}

function evaluateIndividualMetrics(data: HealthData): IndividualMetricRisks {
  const gender = data.gender;
  const age = data.age;

  // Blood metrics — gender/age-aware reference ranges
  const hb = evaluateBloodMetric(data.bloodWork.hb, getBloodRefRange('hb', gender, age));
  const glucose = evaluateBloodMetric(data.bloodWork.glucose, getBloodRefRange('glucose', gender, age));
  const hdl = evaluateBloodMetric(data.bloodWork.hdl, getBloodRefRange('hdl', gender, age));
  const ldl = evaluateBloodMetric(data.bloodWork.ldl, getBloodRefRange('ldl', gender, age));
  const triglycerides = evaluateBloodMetric(data.bloodWork.triglycerides, getBloodRefRange('triglycerides', gender, age));

  // TC/HDL Ratio — computed from blood values
  const tcHdlValue = computeTcHdlRatio(data.bloodWork);
  const tcHdlRatio = evaluateBloodMetric(tcHdlValue, getBloodRefRange('tcHdlRatio', gender, age));

  // LDL/HDL Ratio
  const ldlHdlValue = computeLdlHdlRatio(data.bloodWork);
  const ldlHdlRatio = evaluateBloodMetric(ldlHdlValue, getBloodRefRange('ldlHdlRatio', gender, age));

  // Body Fat — gender-aware (InBody reference)
  let bodyFat: RiskLevel = 'optimal';
  const bf = data.bodyComposition.bodyFat;
  if (gender === 'female') {
    // Female: Green 18–28, Yellow 10–17.9 / 29–35, Red < 10 / > 35
    if (bf < 10 || bf > 35) bodyFat = 'high-risk';
    else if (bf < 18 || bf > 28) bodyFat = 'warning';
  } else {
    // Male: Green 10–20, Yellow 21–25, Red < 10 / > 25
    if (bf < 10 || bf > 25) bodyFat = 'high-risk';
    else if (bf > 20) bodyFat = 'warning';
  }

  // Visceral Fat — InBody scale 1-20: Optimal 1–9, Warning 10–14, High-risk ≥15
  let visceralFat: RiskLevel = 'optimal';
  const vf = data.bodyComposition.visceralFat;
  if (vf >= 15) visceralFat = 'high-risk';
  else if (vf >= 10) visceralFat = 'warning';

  // Blood Pressure
  let bloodPressure: RiskLevel = 'optimal';
  if (data.bloodPressure.systolic >= 140 || data.bloodPressure.diastolic >= 90) bloodPressure = 'high-risk';
  else if (data.bloodPressure.systolic >= 130 || data.bloodPressure.diastolic >= 80) bloodPressure = 'warning';
  else if (data.bloodPressure.systolic >= 120) bloodPressure = 'good';

  // VO2 Max — Ekblom-Bak age/gender thresholds
  const vt = getVO2Thresholds(gender, age);
  let vo2Max: RiskLevel = 'optimal';
  if (data.fitness.vo2Max < vt.low) vo2Max = 'high-risk';
  else if (data.fitness.vo2Max < vt.medium) vo2Max = 'warning';
  else if (data.fitness.vo2Max < vt.high) vo2Max = 'good';

  return { hb, glucose, hdl, ldl, triglycerides, tcHdlRatio, ldlHdlRatio, bodyFat, visceralFat, bloodPressure, vo2Max };
}

export function evaluateHealthData(data: HealthData): EvaluatedHealthData {
  const bloodWorkScore = evaluateBloodWork(data.bloodWork, data.gender, data.age);
  const lifestyleScore = evaluateLifestyle(data.lifestyle);
  const fitnessScore = evaluateFitness(data.fitness, data.gender, data.age);
  const bodyCompositionScore = evaluateBodyComposition(data.bodyComposition, data.gender);
  const bloodPressureScore = evaluateBloodPressure(data.bloodPressure);

  const scores = { bloodWorkScore, lifestyleScore, fitnessScore, bodyCompositionScore, bloodPressureScore };

  const overallValue =
    (bloodWorkScore.value * 0.25 +
      lifestyleScore.value * 0.25 +
      fitnessScore.value * 0.2 +
      bodyCompositionScore.value * 0.15 +
      bloodPressureScore.value * 0.15) /
    100 *
    100;

  let overallRisk: RiskLevel;
  if (overallValue >= 80) overallRisk = 'optimal';
  else if (overallValue >= 65) overallRisk = 'good';
  else if (overallValue >= 50) overallRisk = 'warning';
  else overallRisk = 'high-risk';

  return {
    ...data,
    scores: { ...scores, overallScore: { value: Math.round(overallValue), risk: overallRisk } },
    metricRisks: evaluateIndividualMetrics(data),
  };
}

export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'optimal': return '#004B87';
    case 'good': return '#8FB3A3';
    case 'warning': return '#C4A47C';
    case 'high-risk': return '#C87979';
  }
}
