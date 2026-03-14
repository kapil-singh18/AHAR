import React from 'react';
import useTranslate from '../hooks/useTranslate';

function TranslatedText({ text }) {
  const translated = useTranslate(typeof text === 'string' ? text : '');

  return <>{typeof text === 'string' ? translated : text}</>;
}

export default TranslatedText;