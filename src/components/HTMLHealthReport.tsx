'use client';

import React, { forwardRef } from 'react';
import { EvaluatedHealthData, FocusArea, EkblomBakNormativeData } from '@/types/health';
import { getLifestyleItems } from '@/utils/lifestyleItems';
import { computeDelta, getDeltaColor, formatDelta, getRiskLabel } from '@/utils/deltaHelpers';
import { getRiskColor, getBloodRefRange, computeTcHdlRatio, computeLdlHdlRatio } from '@/utils/healthEvaluation';
import { EkblomBakGraph } from './EkblomBakGraph';
import { getEkblomBakData } from '@/data/ekblomBakDefaults';

// Dynamic gradient: terracotta (low) → amber → sage → teal (high)
// backgroundSize trick scales gradient to container width regardless of fill width
const SLIDER_GRADIENT = 'linear-gradient(90deg, #C9A08A 0%, #C4A47C 15%, #C8D6C7 30%, #8FB3A3 55%, #8FB3A3 100%)';

function getSliderBackground(value: number): string {
  if (value <= 0) return '#E5E0D8';
  return SLIDER_GRADIENT;
}

function getSliderBackgroundSize(value: number): string {
  return `${1000 / Math.max(value, 0.1)}% 100%`;
}

// Bidirectional gradient for blood metrics: red → amber → sage → teal → sage → amber → red
// Color zones aligned with medical risk boundaries (factor 28): refLow→22%, refHigh→78%
const BLOOD_BAR_GRADIENT = 'linear-gradient(90deg, #C87979 0%, #C4A47C 10%, #C8D6C7 22%, #8FB3A3 35%, #8FB3A3 65%, #C8D6C7 78%, #C4A47C 90%, #C87979 100%)';

// Maps a blood value to a 0-100% bar position where refLow≈22% and refHigh≈78% (green zone edges)
function getBloodBarPercent(value: number, refLow: number, refHigh: number): number {
  const refCenter = (refLow + refHigh) / 2;
  const refHalfWidth = (refHigh - refLow) / 2;
  const normalized = (value - refCenter) / refHalfWidth; // -1 at refLow, 0 at center, +1 at refHigh
  const percent = 50 + normalized * 28; // refLow→22%, center→50%, refHigh→78%
  return Math.max(3, Math.min(97, percent));
}

// Determine which Ekblom-Bak zone a VO2max value falls in for a given age
function getEkblomBakZoneLabel(vo2: number, age: number | undefined, normData: EkblomBakNormativeData): string | null {
  if (!age || normData.zones.length === 0) return null;
  const clampedAge = Math.max(normData.ageRange[0], Math.min(normData.ageRange[1], age));

  for (const zone of normData.zones) {
    const bounds = zone.bounds;
    // Find the two surrounding age points for interpolation
    let lo = bounds[0], hi = bounds[bounds.length - 1];
    for (let i = 0; i < bounds.length - 1; i++) {
      if (clampedAge >= bounds[i].age && clampedAge <= bounds[i + 1].age) {
        lo = bounds[i];
        hi = bounds[i + 1];
        break;
      }
    }
    const t = lo.age === hi.age ? 0 : (clampedAge - lo.age) / (hi.age - lo.age);
    const zoneMin = lo.vo2Min + t * (hi.vo2Min - lo.vo2Min);
    const zoneMax = lo.vo2Max + t * (hi.vo2Max - lo.vo2Max);
    if (vo2 >= zoneMin && vo2 <= zoneMax) return zone.label;
  }
  // Below lowest zone
  return normData.zones[normData.zones.length - 1].label;
}

// Insight-meningar för livsstilsframsteg
const PROGRESS_INSIGHTS: Record<string, string> = {
  sleep: 'Bättre sömn stärker immunförsvaret och den mentala återhämtningen.',
  diet: 'Förbättrad kost ger kroppen rätt förutsättningar för optimal hälsa.',
  stress: 'Lägre stressnivå har en direkt positiv effekt på hjärta och sömn.',
  relationships: 'Starka relationer är en av de viktigaste faktorerna för långsiktig hälsa.',
  smoking: 'Minskad rökning förbättrar syreupptagning och kärlhälsa markant.',
  balance: 'Bättre balans mellan arbete och fritid stärker den mentala hälsan.',
  exercise: 'Ökad träning förbättrar kondition, sömn och stresshantering.',
  alcohol: 'Minskat alkoholintag gynnar lever, sömn och övergripande hälsa.',
};

const STRENGTH_INSIGHTS: Record<string, string> = {
  sleep: 'Din goda sömn är en stark grund för övrig hälsa.',
  diet: 'Din kost ger kroppen utmärkta förutsättningar.',
  stress: 'Din låga stressnivå skyddar hjärta och immunförsvar.',
  relationships: 'Dina starka relationer bidrar till långsiktig hälsa.',
  smoking: 'Ditt tobaksfria liv ger stor hälsonytta.',
  balance: 'Din balans mellan arbete och fritid stärker välmåendet.',
  exercise: 'Dina träningsvanor stärker kondition och mental hälsa.',
  alcohol: 'Dina alkoholvanor gynnar din övergripande hälsa.',
};

interface HTMLHealthReportProps {
  data: EvaluatedHealthData;
  previousData?: EvaluatedHealthData | null;
  selectedFocusAreas?: FocusArea[];
  ekblomBakData?: EkblomBakNormativeData;
}

export const HTMLHealthReport = forwardRef<HTMLDivElement, HTMLHealthReportProps>(
  ({ data, previousData, selectedFocusAreas, ekblomBakData }, ref) => {
    const items = getLifestyleItems(data);
    const prevItems = previousData ? getLifestyleItems(previousData) : null;

    const average = items.reduce((s, i) => s + i.value, 0) / items.length;
    const prevAverage = prevItems ? prevItems.reduce((s, i) => s + i.value, 0) / prevItems.length : null;
    const avgDiff = prevAverage !== null ? average - prevAverage : null;

    // Lifestyle progress: show all areas that share the top improvement
    const allImprovements = prevItems
      ? items
          .map((item, idx) => ({ key: item.key, label: item.label, value: item.value, diff: item.value - prevItems[idx].value }))
          .filter(i => i.diff > 0)
          .sort((a, b) => b.diff - a.diff)
      : [];
    const topDiff = allImprovements.length > 0 ? allImprovements[0].diff : 0;
    const topTied = allImprovements.filter(i => i.diff === topDiff);
    // If ≤3 share the top diff → show individually; if >3 → free text summary
    const lifestyleProgress = topTied.length <= 3 ? topTied : [];
    const manyTiedProgress = topTied.length > 3 ? topTied : [];
    const hasProgress = allImprovements.length > 0;
    const topStrengths = !hasProgress
      ? [...items].sort((a, b) => b.value - a.value).slice(0, 2)
      : [];

    // Fysisk Status deltas
    const weightDelta = computeDelta(data.bodyComposition.weight, previousData?.bodyComposition.weight);
    const bodyFatDelta = computeDelta(data.bodyComposition.bodyFat, previousData?.bodyComposition.bodyFat);
    const muscleMassDelta = computeDelta(data.bodyComposition.muscleMass, previousData?.bodyComposition.muscleMass);
    const visceralFatDelta = computeDelta(data.bodyComposition.visceralFat, previousData?.bodyComposition.visceralFat);
    const systolicDelta = computeDelta(data.bloodPressure.systolic, previousData?.bloodPressure.systolic);
    const diastolicDelta = computeDelta(data.bloodPressure.diastolic, previousData?.bloodPressure.diastolic);
    const vo2Delta = computeDelta(data.fitness.vo2Max, previousData?.fitness.vo2Max);
    const gripDelta = computeDelta(data.fitness.gripStrength, previousData?.fitness.gripStrength);

    // Blodanalys deltas
    const hbDelta = computeDelta(data.bloodWork.hb, previousData?.bloodWork.hb);
    const glucoseDelta = computeDelta(data.bloodWork.glucose, previousData?.bloodWork.glucose);
    const ldlDelta = computeDelta(data.bloodWork.ldl, previousData?.bloodWork.ldl);
    const hdlDelta = computeDelta(data.bloodWork.hdl, previousData?.bloodWork.hdl);
    const trigDelta = computeDelta(data.bloodWork.triglycerides, previousData?.bloodWork.triglycerides);

    // TC/HDL ratio (computed)
    const tcHdlRatio = computeTcHdlRatio(data.bloodWork);
    const prevTcHdlRatio = previousData ? computeTcHdlRatio(previousData.bloodWork) : null;
    const tcHdlDelta = computeDelta(tcHdlRatio, prevTcHdlRatio);

    // LDL/HDL ratio (computed)
    const ldlHdlRatio = computeLdlHdlRatio(data.bloodWork);
    const prevLdlHdlRatio = previousData ? computeLdlHdlRatio(previousData.bloodWork) : null;
    const ldlHdlDelta = computeDelta(ldlHdlRatio, prevLdlHdlRatio);

    const normData = ekblomBakData || getEkblomBakData(data.gender);

    return (
      <div ref={ref} className="px-8 pt-8 pb-3 bg-[#F8F6F2] flex flex-col" style={{ width: '794px', maxHeight: '1122px' }}>
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-start mb-4">
            <div>
              <p className="serif text-xl italic text-[#4A4642]">{[data.firstname, data.lastname].filter(Boolean).join(' ') || 'Klient'}</p>
              {data.personnummer && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#B5AFA2] mt-1">{data.personnummer}</p>
              )}
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#B5AFA2] mt-1">
                {new Date(data.date).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <img src="/body-illustration.png" alt="Aktivitus" className="w-24 h-auto mb-2" />
              <img src="/Aktivitus-Blue.png" alt="Aktivitus" className="h-7" />
              <p className="text-[8px] tracking-[0.3em] uppercase text-[#B5AFA2] font-semibold mt-1">HÄLSOKONTROLL</p>
            </div>
          </header>

          {/* Main Grid */}
          <div className="grid grid-cols-2 gap-5">

            {/* Lifestyle Metrics Card */}
            <div className="bento-card p-6">
              <h2 className="serif text-xl mb-4 italic">Livsstil</h2>
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const diff = prevItems ? item.value - prevItems[idx].value : null;
                  return (
                    <div className="space-y-1" key={item.key}>
                      <div className="flex justify-between text-[9px] uppercase tracking-widest font-medium text-[#9A9488]">
                        <span>{item.label}</span>
                        <span className="flex items-center gap-1.5">
                          {diff !== null && diff !== 0 && (
                            <span className="text-[8px] font-bold" style={{ color: getDeltaColor(item.key, diff) }}>
                              {diff > 0 ? '▲' : '▼'}{Math.abs(diff)}
                            </span>
                          )}
                          <span className={`${item.status} font-bold`}>{item.value}/10</span>
                        </span>
                      </div>
                      <div className="relative flex items-center h-4">
                        <div className="slider-container w-full" style={{ height: '14px' }}>
                          <div
                            className="slider-fill"
                            style={{
                              width: `${item.value * 10}%`,
                              background: getSliderBackground(item.value),
                              backgroundSize: getSliderBackgroundSize(item.value),
                            }}
                          />
                          {prevItems && prevItems[idx].value > item.value && (
                            <div
                              className="slider-drop"
                              style={{
                                left: `${item.value * 10}%`,
                                width: `${(prevItems[idx].value - item.value) * 10}%`,
                              }}
                            />
                          )}
                        </div>
                        <div className="slider-knob" style={{ left: `${item.value * 10}%`, width: '20px', height: '20px', top: '-3px', marginLeft: '-10px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Average & Change */}
              <div className="mt-5 pt-4 border-t border-[#F5F2EE]">
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-[#9A9488]">Medelvärde</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-light tracking-tight">{average.toFixed(1)}<span className="text-[10px] opacity-40">/10</span></span>
                  </div>
                </div>
                {avgDiff !== null && (
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-[9px] uppercase tracking-widest text-[#B5AFA2]">Sedan förra</span>
                    <span className="text-[10px] font-bold tracking-tight" style={{ color: avgDiff === 0 ? '#9A9488' : getDeltaColor('lifestyle', avgDiff) }}>
                      {avgDiff > 0 ? '▲ +' : avgDiff < 0 ? '▼ ' : '– '}{avgDiff.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Störst framsteg / Dina styrkor */}
              <div className="mt-3 pt-3 border-t border-[#F5F2EE]">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-[#9A9488] mb-2">
                  {hasProgress ? 'Störst framsteg' : 'Dina styrkor'}
                </p>
                {hasProgress ? (
                  manyTiedProgress.length > 0 ? (
                    <p className="text-[10px] text-[#4A4642] mb-1">
                      <span className="text-[9px] font-bold" style={{ color: '#10b981' }}>▲</span>{' '}
                      {manyTiedProgress.length} av {items.length} områden förbättrades med +{topDiff} ({manyTiedProgress.map(i => i.label).join(', ')})
                    </p>
                  ) : (
                    lifestyleProgress.map(item => (
                      <div key={item.key} className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold" style={{ color: '#10b981' }}>▲</span>
                        <span className="text-[10px] text-[#4A4642]">{item.label}</span>
                        <span className="text-[10px] font-bold" style={{ color: '#10b981' }}>+{item.diff}</span>
                      </div>
                    ))
                  )
                ) : (
                  topStrengths.map(item => (
                    <div key={item.key} className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold" style={{ color: '#0072bc' }}>★</span>
                      <span className="text-[10px] text-[#4A4642]">{item.label}</span>
                      <span className="text-[10px] font-bold" style={{ color: '#0072bc' }}>{item.value}/10</span>
                    </div>
                  ))
                )}
                <p className="text-[8px] italic text-[#9A9488] mt-1.5 leading-relaxed">
                  {hasProgress
                    ? manyTiedProgress.length > 0
                      ? 'Bred förbättring över flera områden visar på en positiv helhetsutveckling.'
                      : PROGRESS_INSIGHTS[lifestyleProgress[0].key]
                    : STRENGTH_INSIGHTS[topStrengths[0]?.key]
                  }
                </p>

                {/* Fokusområden — inline i samma kort */}
                {selectedFocusAreas && selectedFocusAreas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F5F2EE]">
                    <p className="text-[9px] uppercase tracking-widest font-semibold text-[#9A9488] mb-2">
                      Fokusområden
                    </p>
                    <div className="space-y-1.5">
                      {selectedFocusAreas.map((area) => (
                        <div key={area.key} className="flex items-start gap-1.5">
                          <span className="text-[9px] font-bold" style={{ color: '#8FB3A3' }}>◆</span>
                          <div>
                            <span className="text-[10px] font-semibold text-[#4A4642]">{area.label}</span>
                            <span className="text-[8px] text-[#9A9488] ml-1">{area.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">

              {/* Fysisk Status */}
              <div className="bento-card p-6">
                <h2 className="serif text-xl italic mb-3">Fysisk Status</h2>

                {/* Row 1: Vikt + Kroppsfett + Blodtryck */}
                <div className="grid grid-cols-3 gap-3 pb-2.5 border-b border-[#F5F2EE]">
                  <div>
                    <p className="text-[8px] uppercase text-[#7a8a9a] mb-0.5">Vikt</p>
                    <span className="text-2xl font-extralight tracking-tighter">{data.bodyComposition.weight}</span>
                    <span className="text-[10px] ml-1 opacity-40 uppercase">kg</span>
                    {weightDelta !== null && weightDelta !== 0 && (
                      <span className="block text-[8px] font-bold" style={{ color: '#9A9488' }}>
                        {weightDelta > 0 ? '▲' : '▼'} {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-[#7a8a9a] mb-0.5">Kroppsfett</p>
                    <span className="text-2xl font-extralight tracking-tighter" style={{ color: getRiskColor(data.metricRisks.bodyFat) }}>
                      {data.bodyComposition.bodyFat}
                    </span>
                    <span className="text-[10px] ml-1 opacity-40 uppercase">%</span>
                    {bodyFatDelta !== null && bodyFatDelta !== 0 && (
                      <span className="block text-[8px] font-bold" style={{ color: getDeltaColor('bodyFat', bodyFatDelta) }}>
                        {formatDelta('bodyFat', bodyFatDelta, 1)}
                      </span>
                    )}
                    <span className="block text-[9px] uppercase font-bold tracking-tighter" style={{ color: getRiskColor(data.metricRisks.bodyFat) }}>
                      ● {getRiskLabel(data.metricRisks.bodyFat)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-[#7a8a9a] mb-0.5">Blodtryck</p>
                    <span className="text-2xl font-extralight tracking-tighter" style={{ color: getRiskColor(data.metricRisks.bloodPressure) }}>
                      {data.bloodPressure.systolic}/{data.bloodPressure.diastolic}
                    </span>
                    <span className="text-[10px] ml-1 opacity-40 uppercase">mmHg</span>
                    {systolicDelta !== null && systolicDelta !== 0 && (
                      <span className="block text-[8px] font-bold" style={{ color: getDeltaColor('systolic', systolicDelta) }}>
                        {formatDelta('systolic', systolicDelta, 0)}
                      </span>
                    )}
                    <span className="block text-[9px] uppercase font-bold tracking-tighter" style={{ color: getRiskColor(data.metricRisks.bloodPressure) }}>
                      ● {getRiskLabel(data.metricRisks.bloodPressure)}
                    </span>
                  </div>
                </div>

                {/* Row 2: Muskelmassa + Visceralt fett */}
                <div className="grid grid-cols-3 gap-3 pt-2.5">
                  <div>
                    <p className="text-[8px] uppercase text-[#7a8a9a] mb-0.5">Muskelmassa</p>
                    <span className="text-2xl font-extralight tracking-tighter">{data.bodyComposition.muscleMass}</span>
                    <span className="text-[10px] ml-1 opacity-40 uppercase">%</span>
                    {muscleMassDelta !== null && muscleMassDelta !== 0 && (
                      <span className="block text-[8px] font-bold" style={{ color: getDeltaColor('muscleMass', muscleMassDelta) }}>
                        {formatDelta('muscleMass', muscleMassDelta, 1)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-[#7a8a9a] mb-0.5">Visceralt fett</p>
                    <span className="text-2xl font-extralight tracking-tighter" style={{ color: getRiskColor(data.metricRisks.visceralFat) }}>
                      {data.bodyComposition.visceralFat}
                    </span>
                    <span className="text-[10px] ml-1 opacity-40 uppercase">/20</span>
                    {visceralFatDelta !== null && visceralFatDelta !== 0 && (
                      <span className="block text-[8px] font-bold" style={{ color: getDeltaColor('visceralFat', visceralFatDelta) }}>
                        {formatDelta('visceralFat', visceralFatDelta, 0)}
                      </span>
                    )}
                    <span className="block text-[9px] uppercase font-bold tracking-tighter" style={{ color: getRiskColor(data.metricRisks.visceralFat) }}>
                      ● {getRiskLabel(data.metricRisks.visceralFat)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase text-[#7a8a9a] mb-0.5">Greppstyrka</p>
                    <span className="text-2xl font-extralight tracking-tighter">{data.fitness.gripStrength}</span>
                    <span className="text-[10px] ml-1 opacity-40 uppercase">kg</span>
                    {gripDelta !== null && gripDelta !== 0 && (
                      <span className="block text-[8px] font-bold" style={{ color: getDeltaColor('gripStrength', gripDelta) }}>
                        {formatDelta('gripStrength', gripDelta, 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Kondition (VO2max / Ekblom-Bak) — egen ruta */}
              <div className="bento-card p-5">
                <h2 className="serif text-lg italic mb-1">Kondition <span className="text-[8px] uppercase text-[#7a8a9a] not-italic tracking-wide">(Ekblom-Bak Test)</span></h2>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-lg font-light tracking-tight" style={{ color: getRiskColor(data.metricRisks.vo2Max) }}>
                    {data.fitness.vo2Max}
                    <span className="text-[8px] uppercase ml-1 text-[#7a8a9a]">ml/min/kg</span>
                  </p>
                  {vo2Delta !== null && vo2Delta !== 0 && (
                    <span className="text-[8px] font-bold" style={{ color: getDeltaColor('vo2Max', vo2Delta) }}>
                      {formatDelta('vo2Max', vo2Delta, 1)}
                    </span>
                  )}
                </div>
                <span className="block text-[9px] uppercase font-bold tracking-tighter mb-1" style={{ color: getRiskColor(data.metricRisks.vo2Max) }}>
                  ● {getEkblomBakZoneLabel(data.fitness.vo2Max, data.age, normData) || getRiskLabel(data.metricRisks.vo2Max)}
                </span>
                <EkblomBakGraph
                  vo2Max={data.fitness.vo2Max}
                  age={data.age}
                  normativeData={normData}
                  width={310}
                  height={100}
                  interactive={false}
                />
              </div>

              {/* Blodanalys */}
              <div className="bento-card p-5 bg-linear-to-br from-[#ffffff] to-[#F9F8F6]">
                <h2 className="serif text-lg italic mb-2">Blodanalys</h2>
                <div className="space-y-1 text-xs font-light">
                  {[
                    { label: 'Hemoglobin', displayValue: `${data.bloodWork.hb.toFixed(0)}`, unit: 'g/L', risk: data.metricRisks.hb, rawValue: data.bloodWork.hb, prevRawValue: previousData?.bloodWork.hb ?? null, delta: hbDelta, deltaKey: 'hb' as const, decimals: 1, metricKey: 'hb' as const },
                    { label: 'Glukos', displayValue: `${data.bloodWork.glucose}`, unit: 'mmol/L', risk: data.metricRisks.glucose, rawValue: data.bloodWork.glucose, prevRawValue: previousData?.bloodWork.glucose ?? null, delta: glucoseDelta, deltaKey: 'glucose' as const, decimals: 0, metricKey: 'glucose' as const },
                    { label: 'LDL', displayValue: `${data.bloodWork.ldl}`, unit: 'mmol/L', risk: data.metricRisks.ldl, rawValue: data.bloodWork.ldl, prevRawValue: previousData?.bloodWork.ldl ?? null, delta: ldlDelta, deltaKey: 'ldl' as const, decimals: 1, metricKey: 'ldl' as const },
                    { label: 'HDL', displayValue: `${data.bloodWork.hdl}`, unit: 'mmol/L', risk: data.metricRisks.hdl, rawValue: data.bloodWork.hdl, prevRawValue: previousData?.bloodWork.hdl ?? null, delta: hdlDelta, deltaKey: 'hdl' as const, decimals: 1, metricKey: 'hdl' as const },
                    { label: 'Triglycerider', displayValue: `${data.bloodWork.triglycerides}`, unit: 'mmol/L', risk: data.metricRisks.triglycerides, rawValue: data.bloodWork.triglycerides, prevRawValue: previousData?.bloodWork.triglycerides ?? null, delta: trigDelta, deltaKey: 'triglycerides' as const, decimals: 1, metricKey: 'triglycerides' as const },
                    { label: 'TC/HDL Kvot', displayValue: `${tcHdlRatio}`, unit: '', risk: data.metricRisks.tcHdlRatio, rawValue: tcHdlRatio, prevRawValue: prevTcHdlRatio, delta: tcHdlDelta, deltaKey: 'tcHdlRatio' as const, decimals: 1, metricKey: 'tcHdlRatio' as const },
                    { label: 'LDL/HDL Kvot', displayValue: `${ldlHdlRatio}`, unit: '', risk: data.metricRisks.ldlHdlRatio, rawValue: ldlHdlRatio, prevRawValue: prevLdlHdlRatio, delta: ldlHdlDelta, deltaKey: 'ldlHdlRatio' as const, decimals: 1, metricKey: 'ldlHdlRatio' as const },
                  ].map((m, idx, arr) => {
                    const ref = getBloodRefRange(m.metricKey, data.gender, data.age);
                    const percent = getBloodBarPercent(m.rawValue, ref.low, ref.high);
                    const prevPercent = m.prevRawValue !== null ? getBloodBarPercent(m.prevRawValue, ref.low, ref.high) : null;
                    const isRegression = prevPercent !== null && Math.abs(percent - 50) > Math.abs(prevPercent - 50);
                    const dropLeft = isRegression ? Math.min(percent, prevPercent!) : 0;
                    const dropWidth = isRegression ? Math.abs(percent - prevPercent!) : 0;
                    const isLast = idx === arr.length - 1;
                    return (
                      <div key={m.label} className={isLast ? '' : 'border-b border-[#F5F2EE] pb-1'}>
                        <div className="flex justify-between items-center mb-1">
                          <span>{m.label}</span>
                          <div className="text-right flex items-center gap-2">
                            {m.delta !== null && m.delta !== 0 && (
                              <span className="text-[8px] font-bold" style={{ color: '#9A9488' }}>
                                {m.delta > 0 ? '▲' : '▼'} {m.delta > 0 ? '+' : ''}{m.delta.toFixed(m.decimals)}
                              </span>
                            )}
                            <span className="font-normal mr-1.5">{m.displayValue}{m.unit ? ` ${m.unit}` : ''}</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: getRiskColor(m.risk) }}>
                              {getRiskLabel(m.risk)}
                            </span>
                          </div>
                        </div>
                        <div className="relative flex items-center h-3.5">
                          <div className="slider-container w-full" style={{ height: '12px', background: BLOOD_BAR_GRADIENT }}>
                            {isRegression && (
                              <div
                                className="slider-drop"
                                style={{
                                  left: `${dropLeft}%`,
                                  width: `${dropWidth}%`,
                                }}
                              />
                            )}
                          </div>
                          <div className="slider-knob" style={{ left: `${percent}%`, width: '18px', height: '18px', top: '-3px', marginLeft: '-9px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }
);

HTMLHealthReport.displayName = 'HTMLHealthReport';
