import React from 'react';
import useTranslate from '../../hooks/useTranslate';

function PageHeader({ eyebrow, title, description }) {
  const translatedEyebrow = useTranslate(typeof eyebrow === 'string' ? eyebrow : '');
  const translatedTitle = useTranslate(typeof title === 'string' ? title : '');
  const translatedDescription = useTranslate(typeof description === 'string' ? description : '');

  return (
    <header className="page-head fade-in">
      {eyebrow && <p className="eyebrow">{typeof eyebrow === 'string' ? translatedEyebrow : eyebrow}</p>}
      <h1>{typeof title === 'string' ? translatedTitle : title}</h1>
      {description && <p>{typeof description === 'string' ? translatedDescription : description}</p>}
    </header>
  );
}

export default PageHeader;
