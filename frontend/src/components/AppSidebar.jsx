import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Boxes,
  ChartNoAxesCombined,
  HandPlatter,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Soup,
  TrendingUp
} from 'lucide-react';
import BrandMark from './BrandMark';

const navSections = [
  { title: 'Intelligence', items: [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/forecasting', label: 'Demand Forecasting', icon: TrendingUp },
    { path: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined }
  ] },
  { title: 'Operations', items: [
    { path: '/menu', label: 'Menu Management', icon: Soup },
    { path: '/inventory', label: 'Inventory', icon: Boxes },
    { path: '/consumption', label: 'Consumption', icon: ClipboardList },
    { path: '/donations', label: 'Surpluses & Donations', icon: HandPlatter }
  ] },
  { title: 'System', items: [
    { path: '/settings', label: 'Settings', icon: Settings }
  ] }
];

function SidebarBody({ onClose }) {
  const location = useLocation();
  const isActive = (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

  return (
    <div className="sidebar-inner">
      <BrandMark />
      <nav className="sidebar-nav" aria-label="Primary">
        {navSections.map((section) => (
          <div className="sidebar-section" key={section.title}>
            <p className="sidebar-section-title">{section.title}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

function AppSidebar({ mobileOpen, onClose }) {
  return (
    <>
      <aside className="desktop-sidebar">
        <SidebarBody />
      </aside>
      {mobileOpen && (
        <>
          <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />
          <aside className="mobile-sidebar">
            <SidebarBody onClose={onClose} />
          </aside>
        </>
      )}
    </>
  );
}

export default AppSidebar;
