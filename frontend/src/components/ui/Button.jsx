import React from 'react';
import useTranslate from '../../hooks/useTranslate';

function Button({ variant = 'primary', className = '', children, ...props }) {
  const translatedText = useTranslate(typeof children === 'string' ? children : '');
  const content = typeof children === 'string' ? translatedText : children;

  return (
    <button className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {content}
    </button>
  );
}

export default Button;
