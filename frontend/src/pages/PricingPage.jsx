import React from 'react';
import { useNavigate } from 'react-router-dom';
import { pricingPlans } from '../data/mockDataLayer';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';

const ONE_TIME_ONBOARDING_FEE = 1499;

function PricingPage() {
  const navigate = useNavigate();

  const choosePlan = (plan) => {
    const params = new URLSearchParams({ plan: plan.id });
    if (plan.monthlyAmount) {
      params.set('amount', String(plan.monthlyAmount + ONE_TIME_ONBOARDING_FEE));
    }
    navigate(`/payment?${params.toString()}`);
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Revenue Model"
        title="Pricing"
        description="Simple per-kitchen pricing with onboarding and enterprise options for larger chains and institutions."
      />

      <Card toned title="Commercial Terms">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-line/60 bg-surface-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">One-Time Onboarding</p>
            <p className="mt-2 text-base font-semibold text-ink sm:text-lg">₹1,499 per kitchen</p>
          </div>
          <div className="rounded-xl border border-line/60 bg-surface-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">Multi-Kitchen Discount</p>
            <p className="mt-2 text-base font-semibold text-ink sm:text-lg">Up to 10% off</p>
          </div>
          <div className="rounded-xl border border-line/60 bg-surface-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">Enterprise</p>
            <p className="mt-2 text-base font-semibold text-ink sm:text-lg">Custom chain pricing</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-4">
        {pricingPlans.map((plan) => (
          <Card key={plan.id} className="h-full">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-ink sm:text-2xl">{plan.name}</h2>
                {plan.id === 'growth' && <Badge tone="success">Most Popular</Badge>}
              </div>
              <p className="mt-4 text-sm text-ink-muted">Monthly</p>
              <p className="text-xl font-bold text-brand-red sm:text-2xl">{plan.monthly}</p>
              <p className="mt-2 text-sm text-ink-muted">Notes</p>
              <p className="text-base font-semibold text-ink sm:text-lg">{plan.yearly}</p>

              <ul className="mt-5 flex-1 space-y-2 text-sm leading-7 text-ink-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="rounded-xl border border-line/60 bg-surface-muted/60 px-3 py-2 text-ink">
                    {feature}
                  </li>
                ))}
              </ul>

              <Button type="button" className="mt-5 w-full" onClick={() => choosePlan(plan)}>Choose Plan</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PricingPage;
