import React from 'react';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { useLanguage } from '../i18n';

const guideSteps = [
  {
    title: 'Guide Start Here',
    items: [
      'Guide Start Here Item 1',
      'Guide Start Here Item 2',
      'Guide Start Here Item 3'
    ]
  },
  {
    title: 'Guide Predict Food Need',
    items: [
      'Guide Predict Food Need Item 1',
      'Guide Predict Food Need Item 2',
      'Guide Predict Food Need Item 3',
      'Guide Predict Food Need Item 4'
    ]
  },
  {
    title: 'Guide Manage Stock',
    items: [
      'Guide Manage Stock Item 1',
      'Guide Manage Stock Item 2',
      'Guide Manage Stock Item 3'
    ]
  },
  {
    title: 'Guide Donate Extra Food',
    items: [
      'Guide Donate Extra Food Item 1',
      'Guide Donate Extra Food Item 2',
      'Guide Donate Extra Food Item 3',
      'Guide Donate Extra Food Item 4'
    ]
  },
  {
    title: 'Guide Daily Habit',
    items: [
      'Guide Daily Habit Item 1',
      'Guide Daily Habit Item 2',
      'Guide Daily Habit Item 3'
    ]
  }
];

function GuidePage() {
  const { t } = useLanguage();

  return (
    <div className="stack">
      <PageHeader
        eyebrow={t('Guide')}
        title={t('How To Use AHAR')}
        description={t('Guide Intro Simple')}
      />

      {guideSteps.map((section, idx) => (
        <Card key={section.title} toned title={`${idx + 1}. ${t(section.title)}`}>
          <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
            {section.items.map((item, i) => (
              <li key={i}>{t(item)}</li>
            ))}
          </ul>
        </Card>
      ))}

      <Card title={t('Guide Quick Help')}>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>{t('Guide Quick Help Item 1')}</li>
          <li>{t('Guide Quick Help Item 2')}</li>
          <li>{t('Guide Quick Help Item 3')}</li>
          <li>{t('Guide Quick Help Item 4')}</li>
        </ul>
      </Card>

      <Card title={t('Guide Need Help')}>
        <p style={{ lineHeight: '1.6' }}>
          {t('Guide Need Help Line 1')}<br />
          {t('Guide Need Help Line 2')}<br />
          {t('Guide Need Help Line 3')}<br />
          {t('Guide Need Help Line 4')}
        </p>
      </Card>
    </div>
  );
}

export default GuidePage;
