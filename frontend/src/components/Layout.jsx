import React, { useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-app px-4 py-4 text-ink sm:px-5 lg:px-6">
      <div className="mx-auto flex max-w-[1600px] gap-4 xl:gap-6">
        <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="min-w-0 flex-1">
          <AppHeader onMenuToggle={() => setMobileOpen(true)} />
          <main className="content">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
