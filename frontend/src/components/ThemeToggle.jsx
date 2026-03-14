import React from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import TranslatedText from './TranslatedText';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-surface/80 px-4 py-2 text-sm font-semibold text-ink shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-brand-teal/40"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      <span><TranslatedText text={theme === 'dark' ? 'Light' : 'Dark'} /></span>
    </button>
  );
}

export default ThemeToggle;