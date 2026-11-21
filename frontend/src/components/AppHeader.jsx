import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const pageTitles = [
  ['/overview', 'Overview'], ['/forecasting', 'Demand Forecasting'], ['/analytics', 'Analytics'],
  ['/menu', 'Menu Management'], ['/inventory', 'Inventory'], ['/consumption', 'Consumption'],
  ['/donations', 'Surpluses & Donations'], ['/settings', 'Settings']
];

function AppHeader({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const title = pageTitles.find(([path]) => location.pathname.startsWith(path))?.[1] || 'AHAR';
  const initials = (user?.name || user?.email || 'AH').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in', { replace: true });
  };

  return (
    <header className="app-header">
      <div className="header-title">
        <button type="button" className="menu-toggle" onClick={onMenuToggle} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div>
          <p className="header-breadcrumb">AHAR / Operations</p>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="header-actions">
        <ThemeToggle />
        <div className="account">
          <div className="avatar">{initials}</div>
          <div className="account-copy">
            <strong>{user?.name || 'Account'}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <button type="button" className="logout-button" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
