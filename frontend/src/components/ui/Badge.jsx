import React from 'react';
import { useLanguage } from '../../i18n';

function Badge({ tone = 'neutral', children }) {
  const { t } = useLanguage();

  return <span className={`badge badge-${tone}`}>{typeof children === 'string' ? t(children) : children}</span>;
}

export default Badge;
