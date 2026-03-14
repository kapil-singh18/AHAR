import React from 'react';
import useTranslate from '../../hooks/useTranslate';

function Field({ label, htmlFor, children }) {
  const translatedLabel = useTranslate(typeof label === 'string' ? label : '');

  return (
    <div className="field">
      <label htmlFor={htmlFor}>{typeof label === 'string' ? translatedLabel : label}</label>
      {children}
    </div>
  );
}

export default Field;
