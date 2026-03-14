import React from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { SignOutButton, useUser } from '@clerk/clerk-react';
import { LogOut } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

const pageTitles = [
  { match: '/dashboard', title: 'Dashboard' },
  { match: '/prediction', title: 'Prediction' },
  { match: '/inventory', title: 'Inventory Hub' },
  { match: '/donations', title: 'Donation Locator' },
  { match: '/payment', title: 'Payment & Pricing' },
  { match: '/pricing', title: 'Payment & Pricing' },
  { match: '/guide', title: 'Guide' },
  { match: '/', title: 'Dashboard' }
];

function AppHeader({ onMenuToggle }) {
  const { user } = useUser();
  const location = useLocation();
  const currentTitle = pageTitles.find((item) => location.pathname.startsWith(item.match))?.title || 'AHAR';
  const initials = (user?.fullName || user?.primaryEmailAddress?.emailAddress || 'AH')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 rounded-[1.5rem] border border-line/70 bg-surface/85 px-4 py-4 shadow-soft backdrop-blur xl:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line/70 bg-surface-muted text-ink shadow-soft transition hover:-translate-y-0.5 lg:hidden"
          aria-label="Open navigation"
        >
          <span className="block h-0.5 w-5 rounded-full bg-current" />
          <span className="sr-only">Menu</span>
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-muted">AHAR</p>
          <h1 className="font-display text-2xl font-bold text-ink">{currentTitle}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <LanguageSwitcher compact />
        <ThemeToggle />
        <Link
          to="/sign-in"
          className="inline-flex items-center rounded-full border border-line/70 bg-surface-muted px-4 py-2 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5"
        >
          Login
        </Link>
        <Link
          to="/sign-up"
          className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-red to-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-soft transition duration-200 hover:-translate-y-0.5"
        >
          Register
        </Link>
        {user ? (
          <>
            <div className="flex items-center gap-3 rounded-full border border-line/70 bg-surface-muted px-2 py-2 shadow-soft">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.fullName || 'Profile'} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-red to-brand-orange text-sm font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-ink">{user.fullName || 'Profile'}</p>
                <p className="truncate text-xs text-ink-muted">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            <SignOutButton>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-red to-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-soft transition duration-200 hover:-translate-y-0.5"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </SignOutButton>
          </>
        ) : null}
      </div>
    </header>
  );
}

export default AppHeader;