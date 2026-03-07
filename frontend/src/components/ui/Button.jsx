import React from 'react';
import { useLanguage } from '../../i18n';

function Button({ variant = 'primary', className = '', children, ...props }) {
  const { t } = useLanguage();
  const content = typeof children === 'string' ? t(children) : children;

  return (
    <button className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {content}
    </button>
  );
}

export default Button;
