import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LifeBuoy } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import SectionTabs from '../components/SectionTabs';

const guideTabs = [
  { id: 'start', label: 'Getting Started' },
  { id: 'features', label: 'Features' },
  { id: 'talk', label: 'Talk to Us' },
  { id: 'demo', label: 'Free Demo' }
];

const faqItems = [
  {
    id: 'faq-1',
    title: 'How does prediction work?',
    content: 'Prediction combines expected attendance, weather, and event multipliers to estimate meal quantity and probable waste.'
  },
  {
    id: 'faq-2',
    title: 'Can we track expiry in inventory?',
    content: 'Yes. Inventory cards include freshness countdowns and Expiry Soon filters so kitchen teams can prioritize usage.'
  },
  {
    id: 'faq-3',
    title: 'How can we trigger donation quickly?',
    content: 'Use Donation Locator to identify nearby NGOs and log distribution history for audit and impact reporting.'
  }
];

function GuidePage() {
  const [activeTab, setActiveTab] = useState('start');
  const [openFaq, setOpenFaq] = useState(faqItems[0].id);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Support"
        title="Guide"
        description="Explore AHAR workflows, core features, and onboarding support through a clear help center."
      />

      <SectionTabs tabs={guideTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'start' && (
        <Card toned title="Getting Started Checklist">
          <ul className="ml-6 space-y-2 text-sm leading-7 text-ink-muted">
            <li className="text-ink">Connect your kitchen profile and baseline meal schedule.</li>
            <li className="text-ink">Run your first prediction using expected footfall and weather inputs.</li>
            <li className="text-ink">Add inventory items with expiry dates and quantity units.</li>
            <li className="text-ink">Set donation preferences for quick NGO handoff.</li>
          </ul>
        </Card>
      )}

      {activeTab === 'features' && (
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => {
            const isOpen = openFaq === item.id;
            return (
              <Card key={item.id} title={item.title}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-[1rem] border border-line/70 bg-surface-muted/70 px-4 py-3 text-left"
                  onClick={() => setOpenFaq(isOpen ? '' : item.id)}
                >
                  <span className="text-sm font-semibold text-ink">Expand answer</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isOpen && <p className="mt-4 text-sm leading-7 text-ink-muted">{item.content}</p>}
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'talk' && (
        <Card title="Talk to Us">
          <div className="rounded-[1.3rem] border border-line/70 bg-surface-muted/70 p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/15 text-brand-teal">
              <LifeBuoy size={18} />
            </div>
            <p className="mt-3 text-sm leading-7 text-ink-muted">Need onboarding help or platform support? Reach us directly:</p>
            <div className="mt-3 text-sm leading-7 text-ink">
              <p>Email: support@ahar.app</p>
              <p>Phone: +91 98765 43210</p>
              <p>Hours: Mon-Sat, 9:00 AM to 7:00 PM</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'demo' && (
        <Card title="Request a Free Demo">
          <p className="text-sm leading-7 text-ink-muted">Book a personalized walkthrough for your kitchen operation team.</p>
          <div className="mt-4 form-grid">
            <input placeholder="Your Name" />
            <input placeholder="Work Email" />
            <input placeholder="Kitchen / Organization" />
            <input placeholder="Preferred Date" type="date" />
          </div>
          <div className="mt-5">
            <Button type="button">Submit Request</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default GuidePage;
