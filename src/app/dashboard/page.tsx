'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ExcelUpload } from '@/components/ExcelUpload';
import { HTMLHealthReport } from '@/components/HTMLHealthReport';
import { FocusAreaSelector } from '@/components/FocusAreaSelector';
import { HistoricalSidebar } from '@/components/HistoricalSidebar';
import { TrendView } from '@/components/trends/TrendView';
import { PreviewModal } from '@/components/PreviewModal';
import { evaluateHealthData } from '@/utils/healthEvaluation';
import { getLifestyleItems } from '@/utils/lifestyleItems';
import { HealthData, EvaluatedHealthData, FocusArea } from '@/types/health';

const FOCUS_AREA_MAP: Record<string, FocusArea> = {
  sleep: { key: 'sleep', label: 'Sömn', iconName: 'Moon', description: 'Förbättra sömnkvalitet och rutiner' },
  diet: { key: 'diet', label: 'Kost', iconName: 'Apple', description: 'Balanserad näring för optimal hälsa' },
  stress: { key: 'stress', label: 'Stress', iconName: 'Brain', description: 'Hantera stress och återhämtning' },
  relationships: { key: 'relationships', label: 'Relationer', iconName: 'Heart', description: 'Socialt välmående och relationer' },
  smoking: { key: 'smoking', label: 'Rökning', iconName: 'Cigarette', description: 'Minska eller sluta röka' },
  balance: { key: 'balance', label: 'Balans', iconName: 'Scale', description: 'Balans mellan arbete och fritid' },
  exercise: { key: 'exercise', label: 'Träning', iconName: 'Dumbbell', description: 'Regelbunden fysisk aktivitet' },
  alcohol: { key: 'alcohol', label: 'Alkohol', iconName: 'Wine', description: 'Hållbara alkoholvanor' },
};

export default function DashboardPage() {
  const [evaluatedData, setEvaluatedData] = useState<EvaluatedHealthData | null>(null);
  const [previousData, setPreviousData] = useState<EvaluatedHealthData | null>(null);
  const [allEntries, setAllEntries] = useState<EvaluatedHealthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFocusKeys, setSelectedFocusKeys] = useState<string[]>([]);
  const [showTrends, setShowTrends] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleFileProcessed = async (data: HealthData[]) => {
    setError(null);
    setLoading(true);
    try {
      const evaluatedArr = data.map((d) => evaluateHealthData(d));
      const latestEvaluated = evaluatedArr[evaluatedArr.length - 1];
      const prevEvaluated = evaluatedArr.length > 1 ? evaluatedArr[evaluatedArr.length - 2] : null;
      setEvaluatedData(latestEvaluated);
      setPreviousData(prevEvaluated);
      setAllEntries(evaluatedArr);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleError = (msg: string) => setError(msg);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !evaluatedData) return;

    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;

      const fullName = [evaluatedData.firstname, evaluatedData.lastname].filter(Boolean).join('_') || 'rapport';
      const opt: Record<string, unknown> = {
        margin: 0,
        filename: `aktivitus_rapport_${fullName}_${evaluatedData.personnummer?.replace(/[\s-]/g, '') || ''}_${evaluatedData.date}.pdf`,
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 3, logging: false, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'in', format: 'a4' },
        pagebreak: { mode: 'avoid-all' },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF-export misslyckades. Försök igen.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setEvaluatedData(null);
    setPreviousData(null);
    setAllEntries([]);
    setError(null);
    setSelectedFocusKeys([]);
    setShowTrends(false);
  };

  const handleFocusToggle = (key: string) => {
    setSelectedFocusKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  const resolvedFocusAreas = selectedFocusKeys
    .map((k) => FOCUS_AREA_MAP[k])
    .filter(Boolean);

  // Upload View
  if (!evaluatedData) {
    return (
      <div className="flex min-h-screen w-full overflow-hidden bg-[#f8fafc]">
        {/* Left side - Hero image */}
        <div className="relative hidden lg:block lg:w-[61.8%] shrink-0">
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=2070"
            alt="Health and Lifestyle"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-blue-900/40 to-transparent"></div>

          <div className="absolute bottom-12 left-12 max-w-md text-white">
            <div className="mb-4 h-1 w-20 bg-[#60a5fa]"></div>
            <h2 className="text-4xl font-bold leading-tight drop-shadow-lg">
              Analysera din data.
            </h2>
            <p className="mt-2 text-[#eff6ff]/80">
              Ladda upp din Excel-fil för att generera en personlig hälsorapport.
            </p>
          </div>
        </div>

        {/* Right side - Upload */}
        <div className="flex w-full flex-col p-8 lg:w-[38.2%]">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center space-x-2">
              <img src="/body-illustration.png" alt="Aktivitus" className="h-8 w-auto" />
              <img src="/Aktivitus-Blue.png" alt="Aktivitus" className="h-5" />
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] hover:text-[#ef4444] transition-colors"
            >
              Logga ut
            </button>
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#111827]">Ladda upp Excel</h3>
              <p className="text-sm text-[#6b7280] mt-1">
                Välj den fil som innehåller din hälsodata.
              </p>
            </div>

            <ExcelUpload
              onFileProcessed={handleFileProcessed}
              onError={handleError}
              isLoading={loading}
            />

            {error && (
              <div className="mt-4 text-sm text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 text-center">
            <p className="text-[10px] text-[#9ca3af] uppercase tracking-[0.2em]">
              Aktivitus Hälsokontroll v2.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Trend View
  if (showTrends && allEntries.length > 1) {
    return <TrendView entries={allEntries} onClose={() => setShowTrends(false)} />;
  }

  const lifestyleItems = getLifestyleItems(evaluatedData);

  // Report View
  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* Header Actions */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-[#E5E0D8]">
        <div className="max-w-[1200px] mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold aktivitus-blue">Hälsorapport</h1>
            <p className="text-sm text-[#B5AFA2]">
              {[evaluatedData.firstname, evaluatedData.lastname].filter(Boolean).join(' ') || 'Klient'} &bull; {new Date(evaluatedData.date).toLocaleDateString('sv-SE')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 text-sm font-medium text-[#4A4642] border border-[#E5E0D8] rounded-lg hover:bg-[#F0EDE8] transition-colors"
            >
              Förstora
            </button>
            {allEntries.length > 1 && (
              <button
                onClick={() => setShowTrends(true)}
                className="px-4 py-2 text-sm font-medium text-[#004B87] border border-[#004B87]/30 rounded-lg hover:bg-[#004B87]/5 transition-colors"
              >
                Visa trender
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-[#4A4642] border border-[#E5E0D8] rounded-lg hover:bg-[#F0EDE8] transition-colors"
            >
              Ladda upp ny fil
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
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-[#4A4642] border border-[#E5E0D8] rounded-lg hover:bg-[#F0EDE8] transition-colors"
            >
              Logga ut
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto p-8 flex gap-8 items-start">
        {/* Left: Focus Selector + Report */}
        <div className="flex-shrink-0">
          {/* PDF Capture Target */}
          <div className="bento-card overflow-hidden">
            <HTMLHealthReport
              ref={reportRef}
              data={evaluatedData}
              previousData={previousData}
              selectedFocusAreas={resolvedFocusAreas}
            />
          </div>

          {/* Focus Area Selector (outside reportRef — not in PDF) */}
          <div className="bento-card p-6 mt-6" style={{ width: '794px' }}>
            <h3 className="serif text-lg italic text-[#4A4642] mb-3">Välj fokusområden (max 3)</h3>
            <FocusAreaSelector
              items={lifestyleItems}
              selected={selectedFocusKeys}
              onToggle={handleFocusToggle}
              maxSelections={3}
            />
          </div>
        </div>

        {/* Right: Historical Sidebar (outside reportRef — not in PDF) */}
        {allEntries.length > 1 && (
          <HistoricalSidebar
            entries={allEntries}
            onShowTrends={() => setShowTrends(true)}
          />
        )}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <PreviewModal onClose={() => setShowPreview(false)}>
          <div className="bento-card overflow-hidden">
            <HTMLHealthReport
              data={evaluatedData}
              previousData={previousData}
              selectedFocusAreas={resolvedFocusAreas}
            />
          </div>
        </PreviewModal>
      )}
    </div>
  );
}
