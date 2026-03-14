import React from 'react';

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-line/70 bg-slate-200/95 shadow-soft">
        <img src="/logo.png" alt="AHAR logo" className="h-8 w-8 object-contain" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold tracking-tight text-ink">AHAR</p>
          <p className="max-w-[26ch] text-xs text-ink-muted">AI-based Hospitality and Resource Optimizer</p>
        </div>
      )}
    </div>
  );
}

export default BrandMark;