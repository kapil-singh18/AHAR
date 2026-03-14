import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Boxes,
  CircleDollarSign,
  Compass,
  FileText,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import BrandMark from './BrandMark';
import TranslatedText from './TranslatedText';

const workspaceItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, matchPaths: ['/dashboard', '/'] },
  { path: '/prediction', label: 'Prediction', icon: Sparkles, matchPaths: ['/prediction'] },
  { path: '/inventory', label: 'Inventory Hub', icon: Boxes, matchPaths: ['/inventory'] },
  { path: '/donations', label: 'Donation Locator', icon: Compass, matchPaths: ['/donations'] },
  { path: '/payment', label: 'Payment & Pricing', icon: CircleDollarSign, matchPaths: ['/payment', '/pricing'] },
  { path: '/guide', label: 'Guide', icon: FileText, matchPaths: ['/guide'] }
];

function SidebarBody() {
  const location = useLocation();

  const isActive = (item) => item.matchPaths.some((path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <div className="flex h-full flex-col gap-6 rounded-[1.15rem] border border-line/70 bg-slate-200/95 px-5 py-6 text-ink shadow-soft backdrop-blur">
      <BrandMark />

      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-ink-muted">Main Menu</p>
        <nav className="mt-3 flex flex-col gap-2" aria-label="Primary">
          {workspaceItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition duration-200 ${
                  isActive(item)
                    ? 'bg-gradient-to-r from-brand-red to-brand-orange text-white shadow-soft'
                    : 'text-ink-muted hover:-translate-y-0.5 hover:bg-white/10 hover:text-ink'
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isActive(item) ? 'bg-white/15' : 'bg-white/8 group-hover:bg-white/15'}`}>
                  <Icon size={18} />
                </span>
                <span><TranslatedText text={item.label} /></span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function AppSidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className="hidden h-[calc(100vh-2rem)] w-[300px] shrink-0 lg:sticky lg:top-4 lg:-ml-2 lg:block">
        <SidebarBody />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-y-4 left-2 z-50 w-[min(84vw,320px)] lg:hidden"
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <SidebarBody />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default AppSidebar;