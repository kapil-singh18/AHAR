import { useEffect, useState } from 'react';
import { getTranslationCacheKey, useTranslationContext } from '../context/TranslationContext';
import { translateText } from '../services/translationAPI';

function useTranslate(text) {
  const { language, cache, setCachedTranslation, t } = useTranslationContext();
  const [translatedText, setTranslatedText] = useState(() => t(text));

  useEffect(() => {
    setTranslatedText(t(text));
  }, [text, t]);

  useEffect(() => {
    if (!text || typeof text !== 'string' || language === 'en') {
      return undefined;
    }

    const cachedValue = cache[getTranslationCacheKey(text, language)];
    if (cachedValue) {
      setTranslatedText(cachedValue);
      return undefined;
    }

    let isActive = true;

    translateText(text, language).then((value) => {
      if (!isActive) {
        return;
      }

      setCachedTranslation(text, language, value);
      setTranslatedText(value);
    });

    return () => {
      isActive = false;
    };
  }, [cache, language, setCachedTranslation, text]);

  return translatedText;
}

export default useTranslate;