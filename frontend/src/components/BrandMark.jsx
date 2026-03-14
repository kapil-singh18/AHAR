import React from 'react';

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-soft ring-1 ring-black/5">
        <img src="/logo.png" alt="AHAR logo" className="h-full w-full object-cover" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-display text-[1.05rem] font-semibold tracking-tight text-ink">AHAR</p>
          <p className="max-w-[26ch] text-[11px] leading-5 text-ink-muted">AI-based Hospitality and Resource Optimizer</p>
        </div>
      )}
    </div>
  );
}

export default BrandMark;