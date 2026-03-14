import React from 'react';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, useTranslationContext } from '../context/TranslationContext';

function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage } = useTranslationContext();

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-line/70 bg-surface/80 px-3 py-2 shadow-soft backdrop-blur">
        <Globe size={16} className="text-ink-muted" />
        <select
          aria-label="Select language"
          className="bg-transparent text-sm font-medium text-ink outline-none"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {SUPPORTED_LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SUPPORTED_LANGUAGES.map((item) => {
        const isActive = item.code === language;

        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200 ${
              isActive
                ? 'border-transparent bg-gradient-to-r from-brand-red to-brand-orange text-white shadow-soft'
                : 'border-line/80 bg-surface/75 text-ink-muted hover:border-brand-teal/40 hover:text-ink'
            }`}
          >
            {item.code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;