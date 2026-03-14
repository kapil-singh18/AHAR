import React, { useMemo, useState } from 'react';
import { Clock3, ImagePlus, Plus } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import SectionTabs from '../components/SectionTabs';
import { inventoryItems as baseItems } from '../data/mockDataLayer';

const inventoryTabs = [
  { id: 'all', label: 'All' },
  { id: 'soon', label: 'Expiry Soon' },
  { id: 'add', label: 'Add Item' },
  { id: 'expired', label: 'Expired' }
];

function getDaysUntil(dateString) {
  const targetDate = new Date(dateString);
  const today = new Date();
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getFreshnessLabel(days) {
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days <= 3) return `Expiring in ${days} days`;
  return `Fresh for ${days} more days`;
}

function getFreshnessTone(days) {
  if (days < 0) return 'danger';
  if (days <= 3) return 'warning';
  return 'success';
}

function getEarliestBatchSummary(item) {
  const batches = Array.isArray(item.batches) ? item.batches : [];

  if (!batches.length) {
    return {
      totalQuantity: Number(item.quantity) || 0,
      earliestExpiringQuantity: Number(item.quantity) || 0,
      earliestExpiryDate: item.expiryDate
    };
  }

  const sortedByExpiry = [...batches].sort((left, right) => new Date(left.expiryDate) - new Date(right.expiryDate));
  const earliestDate = sortedByExpiry[0]?.expiryDate;
  const totalQuantity = batches.reduce((sum, batch) => sum + (Number(batch.quantity) || 0), 0);
  const earliestExpiringQuantity = batches
    .filter((batch) => batch.expiryDate === earliestDate)
    .reduce((sum, batch) => sum + (Number(batch.quantity) || 0), 0);

  return {
    totalQuantity,
    earliestExpiringQuantity,
    earliestExpiryDate: earliestDate
  };
}

function getTwoToFiveDayRange() {
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now);
  from.setDate(now.getDate() + 2);
  to.setDate(now.getDate() + 5);
  return { from, to };
}

function getAutoExpiryDate() {
  const today = new Date();
  const dayOffset = Math.floor(Math.random() * 4) + 2; // 2 to 5 days ahead
  const expiry = new Date(today);
  expiry.setDate(today.getDate() + dayOffset);
  return expiry.toISOString().slice(0, 10);
}

function InventoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState(baseItems);
  const [detailsItemId, setDetailsItemId] = useState('');
  const [autofillSelection, setAutofillSelection] = useState('');
  const [autofillForm, setAutofillForm] = useState({ quantity: '', expiryDate: '' });
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'kg',
    expiryDate: getAutoExpiryDate(),
    imageUrl: '',
    notes: ''
  });

  const expiryWindow = useMemo(() => getTwoToFiveDayRange(), []);

  const processedItems = useMemo(() => {
    return items.map((item) => {
      const batchSummary = getEarliestBatchSummary(item);
      const daysLeft = getDaysUntil(batchSummary.earliestExpiryDate || item.expiryDate);
      return {
        ...item,
        totalQuantity: batchSummary.totalQuantity,
        earliestExpiringQuantity: batchSummary.earliestExpiringQuantity,
        earliestExpiryDate: batchSummary.earliestExpiryDate,
        daysLeft,
        freshness: getFreshnessLabel(daysLeft),
        freshnessTone: getFreshnessTone(daysLeft)
      };
    });
  }, [items]);

  const visibleItems = useMemo(() => {
    if (activeTab === 'soon') {
      return processedItems.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3);
    }
    if (activeTab === 'expired') {
      return processedItems.filter((item) => item.daysLeft < 0);
    }
    return processedItems;
  }, [activeTab, processedItems]);

  const selectedAutofillItem = useMemo(() => {
    return processedItems.find((item) => item.id === autofillSelection) || null;
  }, [autofillSelection, processedItems]);

  const saveAutofillItem = () => {
    if (!selectedAutofillItem) return;
    const quantity = Number(autofillForm.quantity || selectedAutofillItem.quantity);
    const expiryDate = autofillForm.expiryDate || selectedAutofillItem.expiryDate;

    setItems((currentItems) => currentItems.map((item) => (
      item.id === selectedAutofillItem.id
        ? {
          ...item,
          quantity,
          expiryDate,
          batches: [{ id: `${item.id}-autofill`, quantity, expiryDate }]
        }
        : item
    )));

    setAutofillForm({ quantity: '', expiryDate: '' });
  };

  const saveNewItem = () => {
    if (!newItemForm.name || !newItemForm.category || !newItemForm.quantity || !newItemForm.expiryDate) {
      return;
    }

    setItems((currentItems) => [
      {
        id: `item-${Date.now()}`,
        name: newItemForm.name,
        category: newItemForm.category,
        quantity: Number(newItemForm.quantity),
        unit: newItemForm.unit,
        expiryDate: newItemForm.expiryDate,
        batches: [{ id: `batch-${Date.now()}`, quantity: Number(newItemForm.quantity), expiryDate: newItemForm.expiryDate }],
        imageUrl: newItemForm.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=60',
        notes: newItemForm.notes || 'No notes'
      },
      ...currentItems
    ]);

    setNewItemForm({
      name: '',
      category: '',
      quantity: '',
      unit: 'kg',
      expiryDate: getAutoExpiryDate(),
      imageUrl: '',
      notes: ''
    });
    setActiveTab('all');
  };

  const resetNewItemForm = () => {
    setNewItemForm({
      name: '',
      category: '',
      quantity: '',
      unit: 'kg',
      expiryDate: getAutoExpiryDate(),
      imageUrl: '',
      notes: ''
    });
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Inventory Ops"
        title="Inventory Hub"
        description="Manage stock cards with freshness countdowns and use two clear add-item methods for quick operations."
      />

      <SectionTabs tabs={inventoryTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab !== 'add' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <img src={item.imageUrl} alt={item.name} className="h-44 w-full rounded-[1.2rem] object-cover" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-muted">{item.category}</p>
                  <h3 className="mt-2 text-xl font-semibold text-ink">{item.name}</h3>
                </div>
                <Badge tone={item.freshnessTone}>{item.freshness}</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-ink-muted">
                <p>Total Quantity: <span className="font-semibold text-ink">{item.totalQuantity} {item.unit}</span></p>
                <p>Earliest Expiry: <span className="font-semibold text-ink">{new Date(item.earliestExpiryDate || item.expiryDate).toLocaleDateString('en-IN')}</span></p>
                <p>
                  Earliest Expiring Quantity:{' '}
                  <span className="font-semibold text-ink">{item.earliestExpiringQuantity} of {item.totalQuantity} {item.unit}</span>
                </p>
                <p>
                  Suggested Expiry Window (2-5 days ahead):{' '}
                  <span className="font-semibold text-ink">
                    {expiryWindow.from.toLocaleDateString('en-IN')} - {expiryWindow.to.toLocaleDateString('en-IN')}
                  </span>
                </p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-surface-muted">
                <div
                  className={`h-full rounded-full ${item.daysLeft < 0 ? 'bg-red-500' : item.daysLeft <= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.max(8, Math.min(100, item.daysLeft < 0 ? 100 : (item.daysLeft / 12) * 100))}%` }}
                />
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDetailsItemId(detailsItemId === item.id ? '' : item.id)}
                >
                  See Details
                </Button>
              </div>
              {detailsItemId === item.id && (
                <div className="mt-4 rounded-[1rem] border border-line/70 bg-surface-muted/70 px-4 py-3 text-sm text-ink-muted">
                  <p><span className="font-semibold text-ink">Basic Details:</span> {item.notes}</p>
                  <p className="mt-1">Batches: {Array.isArray(item.batches) ? item.batches.length : 1}</p>
                  <p className="mt-1">Current freshness status: {item.freshness}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="grid gap-6">
          <Card toned title="Method 1 - Smart Autofill">
            <div className="form-grid">
              <Field label="Select Item" htmlFor="autofill-item">
                <select
                  id="autofill-item"
                  value={autofillSelection}
                  onChange={(event) => setAutofillSelection(event.target.value)}
                >
                  <option value="">Choose existing item</option>
                  {processedItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity" htmlFor="autofill-qty">
                <input
                  id="autofill-qty"
                  type="number"
                  value={autofillForm.quantity}
                  onChange={(event) => setAutofillForm({ ...autofillForm, quantity: event.target.value })}
                  placeholder={selectedAutofillItem ? String(selectedAutofillItem.quantity) : 'Enter quantity'}
                />
              </Field>
              <Field label="Expiry Date" htmlFor="autofill-expiry">
                <input
                  id="autofill-expiry"
                  type="date"
                  value={autofillForm.expiryDate}
                  onChange={(event) => setAutofillForm({ ...autofillForm, expiryDate: event.target.value })}
                />
              </Field>
            </div>

            {selectedAutofillItem && (
              <div className="mt-5 rounded-[1.4rem] border border-line/70 bg-surface/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-muted">Autofill Preview</p>
                <div className="mt-3 grid gap-4 md:grid-cols-[180px_1fr]">
                  <img src={selectedAutofillItem.imageUrl} alt={selectedAutofillItem.name} className="h-36 w-full rounded-[1rem] object-cover" />
                  <div className="text-sm leading-7 text-ink-muted">
                    <p className="text-xl font-semibold text-ink">{selectedAutofillItem.name}</p>
                    <p>Category: <span className="font-semibold text-ink">{selectedAutofillItem.category}</span></p>
                    <p>Notes: <span className="font-semibold text-ink">{selectedAutofillItem.notes}</span></p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <Button type="button" onClick={saveAutofillItem}><Clock3 size={16} />Save Item</Button>
            </div>
          </Card>

          <Card title="Method 2 - New Item Entry">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="form-grid">
                <Field label="Item Name" htmlFor="new-item-name">
                  <input id="new-item-name" value={newItemForm.name} onChange={(event) => setNewItemForm({ ...newItemForm, name: event.target.value })} placeholder="Item Name" />
                </Field>
                <Field label="Category" htmlFor="new-item-category">
                  <input id="new-item-category" value={newItemForm.category} onChange={(event) => setNewItemForm({ ...newItemForm, category: event.target.value })} placeholder="Category" />
                </Field>
                <Field label="Quantity" htmlFor="new-item-quantity">
                  <input id="new-item-quantity" type="number" value={newItemForm.quantity} onChange={(event) => setNewItemForm({ ...newItemForm, quantity: event.target.value })} />
                </Field>
                <Field label="Unit" htmlFor="new-item-unit">
                  <input id="new-item-unit" value={newItemForm.unit} onChange={(event) => setNewItemForm({ ...newItemForm, unit: event.target.value })} />
                </Field>
                <Field label="Expiry Date" htmlFor="new-item-expiry">
                  <input id="new-item-expiry" type="date" value={newItemForm.expiryDate} readOnly />
                </Field>
                <Field label="Image URL" htmlFor="new-item-image">
                  <input id="new-item-image" value={newItemForm.imageUrl} onChange={(event) => setNewItemForm({ ...newItemForm, imageUrl: event.target.value })} placeholder="https://..." />
                </Field>
                <Field label="Notes" htmlFor="new-item-notes">
                  <textarea id="new-item-notes" value={newItemForm.notes} onChange={(event) => setNewItemForm({ ...newItemForm, notes: event.target.value })} />
                </Field>
              </div>

              <div className="rounded-[1.5rem] border border-line/70 bg-surface-muted/70 p-4">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                  <ImagePlus size={18} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-muted">Image Preview</p>
                <img
                  src={newItemForm.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=60'}
                  alt="Item preview"
                  className="mt-3 h-48 w-full rounded-[1rem] object-cover"
                />
                <div className="mt-4 flex gap-3">
                  <Button type="button" onClick={saveNewItem}><Plus size={16} />Save Item</Button>
                  <Button type="button" variant="secondary" onClick={resetNewItemForm}>Reset</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
