import React from 'react';
import { useLanguage } from '../../i18n';

function PageHeader({ eyebrow, title, description }) {
  const { t } = useLanguage();

  const tr = (value) => (typeof value === 'string' ? t(value) : value);

  return (
    <header className="page-head fade-in">
      {eyebrow && <p className="eyebrow">{tr(eyebrow)}</p>}
      <h1>{tr(title)}</h1>
      {description && <p>{tr(description)}</p>}
    </header>
  );
}

export default PageHeader;
