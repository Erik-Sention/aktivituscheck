'use client';

import React, { useState, useEffect } from 'react';

interface PreviewModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export function PreviewModal({ onClose, children }: PreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#111]/90">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#1a1a1a] border-b border-white/10 shrink-0">
        <span className="text-white/60 text-sm font-medium tracking-wide">Förhandsgranskning</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-lg leading-none"
          >
            −
          </button>
          <span className="text-white/70 text-sm min-w-[4rem] text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-lg leading-none"
          >
            +
          </button>
          <button
            onClick={handleReset}
            className="ml-2 px-3 h-8 flex items-center rounded-md bg-white/10 text-white/80 text-sm hover:bg-white/20 transition-colors"
          >
            Återställ
          </button>
          <button
            onClick={onClose}
            className="ml-4 px-3 h-8 flex items-center rounded-md bg-white/10 text-white/80 text-sm hover:bg-white/20 transition-colors"
          >
            ✕ Stäng
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center p-8 min-h-full">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
