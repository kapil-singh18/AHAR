import React from 'react';
import { useLanguage } from '../../i18n';

function Alert({ tone = 'info', children, ariaLive = 'polite' }) {
  const { t } = useLanguage();

  return (
    <div className={`alert alert-${tone}`} role="status" aria-live={ariaLive}>
      {typeof children === 'string' ? t(children) : children}
    </div>
  );
}

export default Alert;
