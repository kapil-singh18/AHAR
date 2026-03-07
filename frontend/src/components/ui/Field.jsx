import React from 'react';
import { useLanguage } from '../../i18n';

function Field({ label, htmlFor, children }) {
  const { t } = useLanguage();

  return (
    <div className="field">
      <label htmlFor={htmlFor}>{typeof label === 'string' ? t(label) : label}</label>
      {children}
    </div>
  );
}

export default Field;
