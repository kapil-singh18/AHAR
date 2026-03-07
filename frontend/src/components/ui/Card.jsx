import React from 'react';
import { useLanguage } from '../../i18n';

function Card({ title, toned = false, children, className = '' }) {
  const { t } = useLanguage();

  return (
    <section className={`card ${toned ? 'card-toned' : ''} ${className}`.trim()}>
      {title && <h2 className="card-title">{typeof title === 'string' ? t(title) : title}</h2>}
      {children}
    </section>
  );
}

export default Card;
