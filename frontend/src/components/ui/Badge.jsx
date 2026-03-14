import React from 'react';
import useTranslate from '../../hooks/useTranslate';

function Badge({ tone = 'neutral', children }) {
  const translated = useTranslate(typeof children === 'string' ? children : '');

  return <span className={`badge badge-${tone}`}>{typeof children === 'string' ? translated : children}</span>;
}

export default Badge;
