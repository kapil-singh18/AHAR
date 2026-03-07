import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { useLanguage } from '../i18n';

const sections = [
  { title: 'Inventory Tracking', path: '/inventory/stock', cta: 'Open Inventory' },
  { title: 'Menu Management', path: '/inventory/menu', cta: 'Open Menu' },
  { title: 'Daily Consumption', path: '/inventory/consumption', cta: 'Open Consumption' },
  { title: 'Expiry Check', path: '/inventory/expiry', cta: 'Open Expiry Scan' }
];

function InventoryHub() {
  const { t } = useLanguage();

  return (
    <div className="stack">
      <PageHeader
        eyebrow={t('Inventory')}
        title={t('Inventory Hub')}
        description={t('Manage all inventory-related workflows from one place.')}
      />

      <div className="stats-grid">
        {sections.map((section) => (
          <Card key={section.path} toned title={t(section.title)}>
            <Link to={section.path} className="nav-link active" style={{ width: 'fit-content' }}>
              {t(section.cta)}
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default InventoryHub;
