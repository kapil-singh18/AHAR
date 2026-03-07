import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './ui/Button';
import { useLanguage } from '../i18n';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/prediction', label: 'Prediction' },
  { path: '/inventory', label: 'Inventory Hub' },
  { path: '/donations', label: 'Donation Locator' },
  { path: '/guide', label: 'Guide' }
];

function Layout({ children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'eco-light');
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    document.body.setAttribute('data-theme', theme === 'eco-dark' ? 'eco-dark' : 'eco-light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="top-ribbon" aria-label="Primary">
        <div className="ribbon-brand">
          <h1>{t('AHAR')}</h1>
          <p>{t('Ai based hospitality and resource optimizer')}</p>
        </div>
        <nav className="nav-links nav-ribbon">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path) ? 'active' : ''}`.trim()}
              aria-current={item.path === '/' ? location.pathname === '/' ? 'page' : undefined : location.pathname.startsWith(item.path) ? 'page' : undefined}
            >
              {t(item.label)}
            </Link>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            aria-label="Toggle app language"
            className="nav-link"
          >
            {language === 'hi' ? t('English') : t('Hindi')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTheme((prev) => (prev === 'eco-dark' ? 'eco-light' : 'eco-dark'))}
            aria-label="Toggle eco dark mode"
            className="nav-link"
          >
            {theme === 'eco-dark' ? t('Light Theme') : t('Dark Theme')}
          </Button>
        </nav>
      </header>
      <div className="layout-main">
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
