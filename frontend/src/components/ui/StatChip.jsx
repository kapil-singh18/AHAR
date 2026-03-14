import React from 'react';
import useTranslate from '../../hooks/useTranslate';

function StatChip({ label, value }) {
  const translatedLabel = useTranslate(typeof label === 'string' ? label : '');

  return (
    <article className="stat-chip">
      <p>{typeof label === 'string' ? translatedLabel : label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default StatChip;
