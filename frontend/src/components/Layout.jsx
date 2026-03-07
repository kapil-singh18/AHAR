import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './ui/Button';

const navItems = [
  { path: '/', label: 'Impact Dashboard' },
  { path: '/menu', label: 'Mindful Menu' },
  { path: '/inventory', label: 'Inventory Health' },
  { path: '/analytics', label: 'Waste Analytics' },
  { path: '/consumption', label: 'Daily Consumption' },
  { path: '/expiry', label: 'Expiry Scan' },
  { path: '/donations', label: 'Community Donations' },
  { path: '/recommendations', label: 'Dish Suggestions' }
];

function Layout({ children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'eco-light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme === 'eco-dark' ? 'eco-dark' : 'eco-light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="top-ribbon" aria-label="Primary">
        <div className="ribbon-brand">
          <h1>AHAR</h1>
          <p>Ai based hospitality and resource optimizer</p>
        </div>
        <nav className="nav-links nav-ribbon">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`.trim()}
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ribbon-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTheme((prev) => (prev === 'eco-dark' ? 'eco-light' : 'eco-dark'))}
            aria-label="Toggle eco dark mode"
          >
            {theme === 'eco-dark' ? 'Light Theme' : 'Dark Theme'}
          </Button>
        </div>
      </header>
      <div className="layout-main">
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
