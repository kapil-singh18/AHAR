import React from 'react';
import useTranslate from '../../hooks/useTranslate';

function Card({ title, toned = false, children, className = '' }) {
  const translatedTitle = useTranslate(typeof title === 'string' ? title : '');

  return (
    <section className={`card ${toned ? 'card-toned' : ''} ${className}`.trim()}>
      {title && <h2 className="card-title">{typeof title === 'string' ? translatedTitle : title}</h2>}
      {children}
    </section>
  );
}

export default Card;
