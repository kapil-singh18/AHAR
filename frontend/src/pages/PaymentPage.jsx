import React, { useMemo, useState } from 'react';
import { CreditCard, Download, ReceiptText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import SectionTabs from '../components/SectionTabs';
import { invoices, paymentMethods, pricingPlans } from '../data/mockDataLayer';

const paymentTabs = [
  { id: 'pricing', label: 'Pricing' },
  { id: 'billing', label: 'Billing' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'methods', label: 'Payment Methods' }
];

const ONE_TIME_ONBOARDING_FEE = 1499;

function PaymentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlanId = searchParams.get('plan') || 'growth';
  const [activeTab, setActiveTab] = useState('pricing');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);

  const selectedPlan = useMemo(() => {
    return pricingPlans.find((plan) => plan.id === selectedPlanId) || pricingPlans[0];
  }, [selectedPlanId]);

  const currentPlanAmount = selectedPlan?.monthlyAmount;
  const planAmountText = currentPlanAmount ? `₹${currentPlanAmount.toLocaleString('en-IN')}` : 'Custom';
  const checkoutAmount = currentPlanAmount ? currentPlanAmount + ONE_TIME_ONBOARDING_FEE : null;

  const choosePlan = (plan) => {
    setSelectedPlanId(plan.id);
    setSearchParams({ plan: plan.id });
    setActiveTab('billing');
  };

  const openCheckout = () => {
    if (!currentPlanAmount) {
      return;
    }

    setSearchParams({ plan: selectedPlan.id, amount: String(checkoutAmount) });
    setActiveTab('billing');
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Finance"
        title="Payment & Pricing"
        description="Manage plan pricing, subscription billing, invoices, and payment methods in one unified workspace."
      />

      <SectionTabs tabs={paymentTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'pricing' && (
        <>
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
        </>
      )}

      {activeTab === 'billing' && (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card toned title="Current Plan">
            <p className="text-sm leading-7 text-ink-muted">Selected plan: <span className="font-semibold text-ink">{selectedPlan.name}</span>. Amounts are dynamically calculated from your chosen pricing model.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-line/70 bg-surface/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Amount</p>
                <p className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{currentPlanAmount ? `${planAmountText} / kitchen / month` : 'Enterprise custom quote'}</p>
              </div>
              <div className="rounded-[1.2rem] border border-line/70 bg-surface/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Status</p>
                <p className="mt-2"><Badge tone="success">Active</Badge></p>
              </div>
            </div>
            <div className="mt-4 rounded-[1.2rem] border border-line/70 bg-surface/80 px-4 py-3 text-sm text-ink-muted">
              <p>One-time onboarding: <span className="font-semibold text-ink">₹{ONE_TIME_ONBOARDING_FEE.toLocaleString('en-IN')} per kitchen</span></p>
              <p className="mt-1">Multi-kitchen discount: <span className="font-semibold text-ink">Up to 10% off</span></p>
              <p className="mt-1">Pay now total: <span className="font-semibold text-ink">{checkoutAmount ? `₹${checkoutAmount.toLocaleString('en-IN')}` : 'Contact sales'}</span></p>
            </div>
            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              <Button type="button" className="w-full sm:w-auto" onClick={openCheckout}>{checkoutAmount ? `Pay ₹${checkoutAmount.toLocaleString('en-IN')} Now` : 'Contact Sales'}</Button>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">Change Billing Cycle</Button>
            </div>
          </Card>

          <Card title="Billing Contact">
            <div className="rounded-[1.2rem] border border-line/70 bg-surface-muted/70 p-4 text-sm leading-7 text-ink-muted">
              <p className="font-semibold text-ink">AHAR Hospitality Pvt Ltd</p>
              <p>finance@ahar.app</p>
              <p>+91 98765 43210</p>
              <p>Mumbai, India</p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'invoices' && (
        <Card title="Invoice History">
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  {['Invoice ID', 'Period', 'Amount', 'Status', 'Action'].map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.period}</td>
                    <td>₹{invoice.amount.toLocaleString('en-IN')}</td>
                    <td><Badge tone={invoice.status === 'Paid' ? 'success' : 'warning'}>{invoice.status}</Badge></td>
                    <td>
                      <Button type="button" variant="secondary" className="w-full sm:w-auto"><Download size={14} />PDF</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'methods' && (
        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card key={method.id} title={method.type}>
              <div className="rounded-[1.2rem] border border-line/70 bg-surface-muted/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-ink">•••• {method.last4}</p>
                  <CreditCard size={18} className="text-ink-muted" />
                </div>
                <p className="mt-3 text-sm text-ink-muted">Card Holder: <span className="font-medium text-ink">{method.holder}</span></p>
                <p className="mt-1 text-sm text-ink-muted">Expiry: <span className="font-medium text-ink">{method.expiry}</span></p>
              </div>
              <div className="mt-4 grid gap-3 sm:flex">
                <Button type="button" variant="secondary" className="w-full sm:w-auto"><ReceiptText size={14} />Set Default</Button>
                <Button type="button" variant="secondary" className="w-full sm:w-auto">Remove</Button>
              </div>
            </Card>
          ))}

          <Card toned title="Add Payment Method">
            <p className="text-sm leading-7 text-ink-muted">Connect a new card or UPI payment rail for uninterrupted billing.</p>
            <Button type="button" className="mt-4">Add New Method</Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PaymentPage;