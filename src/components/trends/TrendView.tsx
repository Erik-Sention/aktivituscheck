'use client';

import React, { useRef, useState } from 'react';
import { EvaluatedHealthData } from '@/types/health';
import { TrendLineChart } from './TrendLineChart';
import { TrendMultiLineChart } from './TrendMultiLineChart';
import { TrendChartCard } from './TrendChartCard';
import { PreviewModal } from '@/components/PreviewModal';
import {
  DataSeries,
  ReferenceZone,
  extractMetricData,
  buildLifestyleZones,
  buildBloodRefZones,
  buildBodyFatZones,
  buildVisceralFatZones,
  buildBPZones,
  buildVO2Zones,
  getZoneColor,
} from './trendUtils';
import { computeTcHdlRatio, computeLdlHdlRatio } from '@/utils/healthEvaluation';

// Positional colors: same index = same color across all 3 lifestyle groups
const POS_COLORS = ['#004B87', '#5B9289', '#C4A47C'] as const;

interface TrendViewProps {
  entries: EvaluatedHealthData[];
  onClose: () => void;
}

export function TrendView({ entries, onClose }: TrendViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingJPEG, setIsExportingJPEG] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const gender = latest.gender;
  const age = latest.age;
  const name = [latest.firstname, latest.lastname].filter(Boolean).join(' ') || 'Klient';

  const firstDate = new Date(sorted[0].date).toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' });
  const lastDate = new Date(sorted[sorted.length - 1].date).toLocaleDateString('sv-SE', { month: 'short', year: 'numeric' });

  // ── Zones ──
  const lifestyleZones = buildLifestyleZones();
  const bodyFatZones = buildBodyFatZones(gender);
  const visceralFatZones = buildVisceralFatZones();
  const vo2Zones = buildVO2Zones(gender, age);
  const bpZones = buildBPZones();
  const hbZones = buildBloodRefZones('hb', gender, age);
  const glucoseZones = buildBloodRefZones('glucose', gender, age);
  const hdlZones = buildBloodRefZones('hdl', gender, age);
  const ldlZones = buildBloodRefZones('ldl', gender, age);
  const trigZones = buildBloodRefZones('triglycerides', gender, age);
  const tcHdlZones = buildBloodRefZones('tcHdlRatio', gender, age);
  const ldlHdlZones = buildBloodRefZones('ldlHdlRatio', gender, age);

  // ── Helper: zone-based line color from latest value ──
  function zc(data: { value: number }[], zones: ReferenceZone[]): string {
    return getZoneColor(data[data.length - 1]?.value ?? 0, zones);
  }

  // ── Lifestyle data (split into 3 groups) ──
  const sleepData = extractMetricData(sorted, e => e.lifestyle.sleep);
  const dietData = extractMetricData(sorted, e => e.lifestyle.diet);
  const exerciseData = extractMetricData(sorted, e => e.lifestyle.exercise);
  const stressData = extractMetricData(sorted, e => e.lifestyle.stress);
  const relData = extractMetricData(sorted, e => e.lifestyle.relationships);
  const balanceData = extractMetricData(sorted, e => e.lifestyle.balance);
  const alcoholData = extractMetricData(sorted, e => e.lifestyle.alcohol);
  const smokingData = extractMetricData(sorted, e => e.lifestyle.smoking);

  const group1: DataSeries[] = [
    { key: 'sleep', label: 'Sömn', data: sleepData, color: POS_COLORS[0] },
    { key: 'diet', label: 'Kost', data: dietData, color: POS_COLORS[1] },
    { key: 'exercise', label: 'Träning', data: exerciseData, color: POS_COLORS[2] },
  ];
  const group2: DataSeries[] = [
    { key: 'stress', label: 'Stress', data: stressData, color: POS_COLORS[0] },
    { key: 'relationships', label: 'Relationer', data: relData, color: POS_COLORS[1] },
    { key: 'balance', label: 'Balans', data: balanceData, color: POS_COLORS[2] },
  ];
  const group3: DataSeries[] = [
    { key: 'alcohol', label: 'Alkohol', data: alcoholData, color: POS_COLORS[0] },
    { key: 'smoking', label: 'Rökning', data: smokingData, color: POS_COLORS[1] },
  ];

  // ── Physical data ──
  const weightData = extractMetricData(sorted, e => e.bodyComposition.weight);
  const bodyFatData = extractMetricData(sorted, e => e.bodyComposition.bodyFat);
  const muscleMassData = extractMetricData(sorted, e => e.bodyComposition.muscleMass);
  const visceralFatData = extractMetricData(sorted, e => e.bodyComposition.visceralFat);
  const systolicData = extractMetricData(sorted, e => e.bloodPressure.systolic);
  const diastolicData = extractMetricData(sorted, e => e.bloodPressure.diastolic);
  const vo2Data = extractMetricData(sorted, e => e.fitness.vo2Max);
  const gripData = extractMetricData(sorted, e => e.fitness.gripStrength);

  // ── Blood data ──
  const hbData = extractMetricData(sorted, e => e.bloodWork.hb);
  const glucoseData = extractMetricData(sorted, e => e.bloodWork.glucose);
  const hdlData = extractMetricData(sorted, e => e.bloodWork.hdl);
  const ldlData = extractMetricData(sorted, e => e.bloodWork.ldl);
  const trigData = extractMetricData(sorted, e => e.bloodWork.triglycerides);
  const tcHdlData = extractMetricData(sorted, e => computeTcHdlRatio(e.bloodWork));
  const ldlHdlData = extractMetricData(sorted, e => computeLdlHdlRatio(e.bloodWork));

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: Record<string, unknown> = {
        margin: 0,
        filename: `aktivitus_trender_${name.replace(/\s+/g, '_')}_${latest.personnummer?.replace(/[\s-]/g, '') || ''}_${firstDate.replace(/\s+/g, '')}-${lastDate.replace(/\s+/g, '')}.pdf`,
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 3, logging: false, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'in', format: 'a4' },
        pagebreak: { mode: 'avoid-all' },
      };
      await html2pdf().set(opt).from(printRef.current).save();
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF-export misslyckades. Försök igen.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPEG = async () => {
    if (!printRef.current) return;
    setIsExportingJPEG(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `aktivitus_trender_${name.replace(/\s+/g, '_')}_${latest.personnummer?.replace(/[\s-]/g, '') || ''}_${firstDate.replace(/\s+/g, '')}-${lastDate.replace(/\s+/g, '')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
    } catch (error) {
      console.error('JPEG export failed:', error);
      alert('JPEG-export misslyckades. Försök igen.');
    } finally {
      setIsExportingJPEG(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header (not in PDF) */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-[#E5E0D8]">
        <div className="max-w-[1200px] mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold aktivitus-blue">Trendgrafer</h1>
            <p className="text-sm text-[#B5AFA2]">
              {name} &bull; {firstDate} – {lastDate} &bull; {sorted.length} mätningar
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 text-sm font-medium text-[#4A4642] border border-[#E5E0D8] rounded-lg hover:bg-[#F0EDE8] transition-colors"
            >
              Förstora
            </button>
            <button
              onClick={handleExportJPEG}
              disabled={isExportingJPEG}
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isExportingJPEG
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#5B9289] text-white hover:bg-[#4a7a72]'
              }`}
            >
              {isExportingJPEG ? 'Skapar JPEG...' : 'Exportera JPEG'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
                isExporting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#004B87] text-white hover:bg-[#003461]'
              }`}
            >
              {isExporting ? 'Skapar PDF...' : 'Exportera PDF'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#4A4642] border border-[#E5E0D8] rounded-lg hover:bg-[#F0EDE8] transition-colors"
            >
              ← Tillbaka till rapport
            </button>
          </div>
        </div>
      </div>

      {/* A4-sized PDF capture area */}
      <div className="flex justify-center py-8">
        {renderA4Content(printRef)}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <PreviewModal onClose={() => setShowPreview(false)}>
          {renderA4Content()}
        </PreviewModal>
      )}
    </div>
  );

  function renderA4Content(ref?: React.Ref<HTMLDivElement>) {
    return (
      <div
        ref={ref}
        style={{ width: '794px', padding: '20px 32px 16px', borderTop: '4px solid #004B87' }}
        className="bg-white"
      >
        {/* Header — same structure as original health report */}
        <header className="flex justify-between items-start mb-3">
          <div>
            <p className="font-bold text-base text-[#1C2B3A]">{name}</p>
            {latest.personnummer && (
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#7a8a9a] mt-1">{latest.personnummer}</p>
            )}
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#7a8a9a] mt-1">
              {firstDate} – {lastDate} &bull; {sorted.length} mätningar
            </p>
          </div>
          <div className="flex flex-col items-end">
            <img src="/body-illustration.png" alt="Aktivitus" className="w-24 h-auto mb-2" />
            <img src="/Aktivitus-Blue.png" alt="Aktivitus" className="h-7" />
            <p className="text-[8px] tracking-[0.3em] uppercase text-[#B5AFA2] font-semibold mt-1">TRENDRAPPORT</p>
          </div>
        </header>

        <div className="space-y-2">
          {/* 1. Lifestyle — 3 grouped multi-line charts */}
          <TrendChartCard title="Livsstil" compact>
            <div className="grid grid-cols-3 gap-3">
              <TrendMultiLineChart
                series={group1}
                label="Sömn, Kost & Träning"
                unit="1–10"
                zones={lifestyleZones}
                yMin={0} yMax={10}
                width={220} height={110}
                compact
              />
              <TrendMultiLineChart
                series={group2}
                label="Stress, Relationer & Balans"
                unit="1–10"
                zones={lifestyleZones}
                yMin={0} yMax={10}
                width={220} height={110}
                compact
              />
              <TrendMultiLineChart
                series={group3}
                label="Alkohol & Rökning"
                unit="1–10"
                zones={lifestyleZones}
                yMin={0} yMax={10}
                width={220} height={110}
                compact
              />
            </div>
          </TrendChartCard>

          {/* 2. Physical — 4 columns */}
          <TrendChartCard title="Kroppssammansättning" compact>
            <div className="grid grid-cols-4 gap-3">
              <TrendLineChart data={weightData} label="Vikt" unit="kg" color="#004B87" decimals={1} width={160} height={85} compact />
              <TrendLineChart data={bodyFatData} label="Kroppsfett" unit="%" zones={bodyFatZones} color={zc(bodyFatData, bodyFatZones)} decimals={1} width={160} height={85} compact />
              <TrendLineChart data={muscleMassData} label="Muskelmassa" unit="%" color="#004B87" decimals={1} width={160} height={85} compact />
              <TrendLineChart data={visceralFatData} label="Visceralt fett" unit="/20" zones={visceralFatZones} color={zc(visceralFatData, visceralFatZones)} decimals={0} width={160} height={85} compact />
            </div>
          </TrendChartCard>

          {/* 3. Kondition + Blodtryck — 3 columns */}
          <TrendChartCard title="Kondition, Greppstyrka & Blodtryck" compact>
            <div className="grid grid-cols-3 gap-3">
              <TrendLineChart data={vo2Data} label="VO₂ Max" unit="ml/min/kg" zones={vo2Zones} color={zc(vo2Data, vo2Zones)} decimals={1} width={220} height={85} compact />
              <TrendLineChart data={gripData} label="Greppstyrka" unit="kg" color="#004B87" decimals={0} width={220} height={85} compact />
              <TrendLineChart
                data={systolicData}
                label="Blodtryck"
                unit="mmHg"
                zones={bpZones}
                color={zc(systolicData, bpZones)}
                secondaryData={diastolicData}
                secondaryColor="#8FB3A3"
                secondaryLabel="Diastoliskt"
                width={220}
                height={85}
                decimals={0}
                compact
                legendItems={[
                  { label: 'Sys', color: zc(systolicData, bpZones) },
                  { label: 'Dia', color: '#8FB3A3' },
                ]}
              />
            </div>
          </TrendChartCard>

          {/* 5. Blood analysis — 7 columns */}
          <TrendChartCard title="Blodanalys" compact>
            <div className="grid grid-cols-7 gap-2">
              <TrendLineChart data={hbData} label="Hemoglobin" unit="g/L" zones={hbZones} color={zc(hbData, hbZones)} width={90} height={85} decimals={0} compact />
              <TrendLineChart data={glucoseData} label="Glukos" unit="mmol/L" zones={glucoseZones} color={zc(glucoseData, glucoseZones)} width={90} height={85} decimals={1} compact />
              <TrendLineChart data={hdlData} label="HDL" unit="mmol/L" zones={hdlZones} color={zc(hdlData, hdlZones)} width={90} height={85} decimals={1} compact />
              <TrendLineChart data={ldlData} label="LDL" unit="mmol/L" zones={ldlZones} color={zc(ldlData, ldlZones)} width={90} height={85} decimals={1} compact />
              <TrendLineChart data={trigData} label="Triglyc." unit="mmol/L" zones={trigZones} color={zc(trigData, trigZones)} width={90} height={85} decimals={1} compact />
              <TrendLineChart data={tcHdlData} label="TC/HDL" unit="kvot" zones={tcHdlZones} color={zc(tcHdlData, tcHdlZones)} width={90} height={85} decimals={1} compact />
              <TrendLineChart data={ldlHdlData} label="LDL/HDL" unit="kvot" zones={ldlHdlZones} color={zc(ldlHdlData, ldlHdlZones)} width={90} height={85} decimals={1} compact />
            </div>
          </TrendChartCard>
        </div>

      </div>
    );
  }
}
