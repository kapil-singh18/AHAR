import React from 'react';

function SectionTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="tablist" aria-label="Section tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'border-transparent bg-gradient-to-r from-brand-red to-brand-orange text-white shadow-primary'
                : 'border-line bg-surface text-ink-muted hover:border-brand-orange/40 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default SectionTabs;