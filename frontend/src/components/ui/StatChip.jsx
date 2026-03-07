import React from 'react';
import { useLanguage } from '../../i18n';

function StatChip({ label, value }) {
  const { t } = useLanguage();

  return (
    <article className="stat-chip">
      <p>{typeof label === 'string' ? t(label) : label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default StatChip;
