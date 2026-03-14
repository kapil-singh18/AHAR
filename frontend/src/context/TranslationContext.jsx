import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'ahar.language';
const CACHE_KEY = 'ahar.translation.cache.v1';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' }
];

function readStoredCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getCacheKey(text, language) {
  return `${text}_${language}`;
}

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');
  const [cache, setCache] = useState(() => readStoredCache());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }, [cache]);

  const setCachedTranslation = useCallback((text, targetLanguage, value) => {
    if (!text || !targetLanguage || !value) {
      return;
    }

    setCache((currentCache) => {
      const key = getCacheKey(text, targetLanguage);
      if (currentCache[key] === value) {
        return currentCache;
      }

      return {
        ...currentCache,
        [key]: value
      };
    });
  }, []);

  const t = useCallback((text) => {
    if (typeof text !== 'string' || !text.trim() || language === 'en') {
      return text;
    }

    return cache[getCacheKey(text, language)] || text;
  }, [cache, language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    cache,
    setCachedTranslation,
    supportedLanguages: SUPPORTED_LANGUAGES
  }), [cache, language, setCachedTranslation, t]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useTranslationContext must be used inside TranslationProvider');
  }

  return context;
}

export function getTranslationCacheKey(text, language) {
  return getCacheKey(text, language);
}