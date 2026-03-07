import React from 'react';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { useLanguage } from '../i18n';

const steps = [
  { title: 'Step 1', text: 'Add inventory items first.' },
  { title: 'Step 2', text: 'Create menu dishes using your inventory ingredients.' },
  { title: 'Step 3', text: 'Log daily consumption to track leftovers accurately.' },
  { title: 'Step 4', text: 'Use dashboard and analytics to plan and reduce waste.' }
];

function GuidePage() {
  const { t } = useLanguage();

  return (
    <div className="stack">
      <PageHeader
        eyebrow={t('Guide')}
        title={t('How To Use AHAR')}
        description={t('Simple instructions for first-time users.')}
      />

      {steps.map((step) => (
        <Card key={step.title} toned title={t(step.title)}>
          <p>{t(step.text)}</p>
        </Card>
      ))}
    </div>
  );
}

export default GuidePage;
