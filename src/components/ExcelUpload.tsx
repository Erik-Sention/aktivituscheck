'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseExcelFile, generateSampleExcel } from '@/utils/excelParser';
import { HealthData } from '@/types/health';

interface ExcelUploadProps {
  onFileProcessed: (data: HealthData[]) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export function ExcelUpload({ onFileProcessed, onError, isLoading = false }: ExcelUploadProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        onError('No file provided');
        return;
      }

      const file = acceptedFiles[0];

      if (
        !file.name.endsWith('.xlsx') &&
        !file.name.endsWith('.xls') &&
        !file.type.includes('spreadsheet')
      ) {
        onError('Vänligen ladda upp en Excel-fil (.xlsx eller .xls)');
        return;
      }

      try {
        const healthData = await parseExcelFile(file);
        onFileProcessed(healthData);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Kunde inte läsa Excel-filen');
      }
    },
    [onFileProcessed, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    disabled: isLoading,
  });

  const handleDownloadSample = async () => {
    const blob = generateSampleExcel();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'health_data_sample.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all cursor-pointer ${
          isDragActive
            ? 'border-[#0072bc] bg-[#eff6ff]'
            : 'border-[#e5e7eb] bg-white hover:border-[#0072bc] hover:bg-[#eff6ff]/50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="mb-4 rounded-full bg-[#eff6ff] p-4 text-[#0072bc] group-hover:scale-110 transition-transform">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-[#111827]">
            {isLoading ? 'Bearbetar...' : 'Dra och släpp filen här'}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">eller klicka för att bläddra</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <button
          type="button"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-xl bg-[#0072bc] py-4 font-bold text-white shadow-lg shadow-[#0072bc]/20 transition-all hover:bg-[#005fa0] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            /* Trigger is handled by dropzone */
          }}
          {...getRootProps()}
        >
          <span>Välj fil</span>
        </button>

        <button
          onClick={handleDownloadSample}
          className="flex w-full items-center justify-center rounded-xl border border-[#e5e7eb] py-3 text-sm font-semibold text-[#4b5563] transition-all hover:bg-[#f9fafb]"
        >
          Ladda ner exempel-mall (.xlsx)
        </button>
      </div>
    </div>
  );
}
