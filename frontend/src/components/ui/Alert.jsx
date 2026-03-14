import React from 'react';
import useTranslate from '../../hooks/useTranslate';

function Alert({ tone = 'info', children, ariaLive = 'polite' }) {
  const translated = useTranslate(typeof children === 'string' ? children : '');

  return (
    <div className={`alert alert-${tone}`} role="status" aria-live={ariaLive}>
      {typeof children === 'string' ? translated : children}
    </div>
  );
}

export default Alert;
