import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, ImagePlus, Loader2, Plus, Sparkles } from 'lucide-react';
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

// ─── AI Expiry Detection Engine ────────────────────────────────────────────────

const DETECTION_PROFILES = [
  { keywords: ['paneer', 'chena', 'cottage cheese'], category: 'Dairy', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'paneer' },
  { keywords: ['milk', 'whole milk', 'skim milk', 'toned milk'], category: 'Dairy', shelfLifeDays: 5, storageClass: 'Refrigerated', imageKey: 'milk' },
  { keywords: ['butter', 'salted butter', 'unsalted butter'], category: 'Dairy', shelfLifeDays: 30, storageClass: 'Refrigerated', imageKey: 'butter' },
  { keywords: ['curd', 'dahi', 'yogurt', 'yoghurt', 'greek yogurt'], category: 'Dairy', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'curd' },
  { keywords: ['cream', 'fresh cream', 'heavy cream', 'whipping cream'], category: 'Dairy', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'curd' },
  { keywords: ['ghee', 'clarified butter'], category: 'Dairy', shelfLifeDays: 365, storageClass: 'Ambient', imageKey: 'butter' },
  { keywords: ['cheese', 'cheddar', 'mozzarella', 'gouda'], category: 'Dairy', shelfLifeDays: 14, storageClass: 'Refrigerated', imageKey: 'paneer' },

  { keywords: ['spinach', 'palak', 'baby spinach', 'methi', 'fenugreek leaves'], category: 'Produce', shelfLifeDays: 4, storageClass: 'Refrigerated', imageKey: 'spinach' },
  { keywords: ['tomato', 'tamatar', 'cherry tomato', 'roma tomato'], category: 'Produce', shelfLifeDays: 5, storageClass: 'Ambient', imageKey: 'tomato' },
  { keywords: ['onion', 'pyaz', 'shallot', 'green onion', 'yellow onion', 'red onion'], category: 'Produce', shelfLifeDays: 30, storageClass: 'Ambient', imageKey: 'onion' },
  { keywords: ['potato', 'aloo', 'batata', 'sweet potato'], category: 'Produce', shelfLifeDays: 30, storageClass: 'Ambient', imageKey: 'potato' },
  { keywords: ['carrot', 'gajar'], category: 'Produce', shelfLifeDays: 14, storageClass: 'Refrigerated', imageKey: 'carrot' },
  { keywords: ['capsicum', 'shimla mirch', 'bell pepper', 'green pepper', 'red pepper'], category: 'Produce', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'capsicum' },
  { keywords: ['mushroom', 'khumb', 'button mushroom'], category: 'Produce', shelfLifeDays: 5, storageClass: 'Refrigerated', imageKey: 'mushroom' },
  { keywords: ['cucumber', 'kheera', 'kakdi'], category: 'Produce', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'cucumber' },
  { keywords: ['lemon', 'nimbu', 'lime'], category: 'Produce', shelfLifeDays: 14, storageClass: 'Ambient', imageKey: 'lemon' },
  { keywords: ['cauliflower', 'gobhi', 'broccoli'], category: 'Produce', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'capsicum' },

  { keywords: ['tomato puree', 'tomato paste', 'tomato sauce'], category: 'Sauce Base', shelfLifeDays: 14, storageClass: 'Refrigerated', imageKey: 'tomato_puree' },
  { keywords: ['puree', 'paste', 'sauce'], category: 'Sauce Base', shelfLifeDays: 14, storageClass: 'Refrigerated', imageKey: 'tomato_puree' },
  { keywords: ['chutney', 'mint chutney', 'tamarind chutney'], category: 'Sauce Base', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'tomato_puree' },

  { keywords: ['rice', 'basmati', 'sona masoori', 'biryani rice', 'brown rice'], category: 'Dry Goods', shelfLifeDays: 365, storageClass: 'Ambient', imageKey: 'rice' },
  { keywords: ['atta', 'whole wheat flour', 'wheat flour', 'chakki atta', 'maida', 'all purpose flour', 'refined flour'], category: 'Dry Goods', shelfLifeDays: 180, storageClass: 'Ambient', imageKey: 'flour' },
  { keywords: ['flour'], category: 'Dry Goods', shelfLifeDays: 180, storageClass: 'Ambient', imageKey: 'flour' },
  { keywords: ['dal', 'moong dal', 'masoor dal', 'toor dal', 'urad dal', 'chana dal', 'lentil', 'lentils'], category: 'Dry Goods', shelfLifeDays: 365, storageClass: 'Ambient', imageKey: 'dal' },
  { keywords: ['chickpea', 'chole', 'kabuli chana', 'chick peas', 'garbanzo'], category: 'Dry Goods', shelfLifeDays: 365, storageClass: 'Ambient', imageKey: 'chickpea' },
  { keywords: ['oil', 'sunflower oil', 'mustard oil', 'soybean oil', 'vegetable oil', 'cooking oil', 'groundnut oil', 'canola'], category: 'Dry Goods', shelfLifeDays: 365, storageClass: 'Ambient', imageKey: 'oil' },
  { keywords: ['sugar', 'cheeni', 'brown sugar', 'jaggery', 'gur'], category: 'Dry Goods', shelfLifeDays: 730, storageClass: 'Ambient', imageKey: 'sugar' },
  { keywords: ['salt', 'namak', 'rock salt', 'sea salt'], category: 'Dry Goods', shelfLifeDays: 3650, storageClass: 'Ambient', imageKey: 'spice' },
  { keywords: ['cumin', 'jeera', 'cumin seeds'], category: 'Dry Goods', shelfLifeDays: 730, storageClass: 'Ambient', imageKey: 'spice' },
  { keywords: ['garam masala', 'masala', 'turmeric', 'haldi', 'chili powder', 'paprika', 'coriander powder', 'spice', 'spices'], category: 'Dry Goods', shelfLifeDays: 730, storageClass: 'Ambient', imageKey: 'spice' },

  { keywords: ['chicken', 'murgh', 'chicken breast', 'chicken leg', 'boneless chicken', 'poultry'], category: 'Protein', shelfLifeDays: 2, storageClass: 'Refrigerated', imageKey: 'chicken' },
  { keywords: ['mutton', 'lamb', 'goat meat', 'beef', 'pork'], category: 'Protein', shelfLifeDays: 2, storageClass: 'Refrigerated', imageKey: 'meat' },
  { keywords: ['fish', 'salmon', 'pomfret', 'rohu', 'tuna', 'tilapia', 'prawn', 'shrimp', 'seafood'], category: 'Protein', shelfLifeDays: 2, storageClass: 'Refrigerated', imageKey: 'fish' },
  { keywords: ['egg', 'anda', 'eggs', 'free range eggs'], category: 'Protein', shelfLifeDays: 21, storageClass: 'Refrigerated', imageKey: 'egg' },

  { keywords: ['bread', 'white bread', 'brown bread', 'sandwich bread', 'loaf', 'pav', 'bun', 'burger bun'], category: 'Bakery', shelfLifeDays: 3, storageClass: 'Ambient', imageKey: 'bread' },
  { keywords: ['roti', 'chapati', 'naan', 'paratha', 'phulka'], category: 'Bakery', shelfLifeDays: 2, storageClass: 'Ambient', imageKey: 'bread' },

  { keywords: ['juice', 'fruit juice', 'orange juice', 'mango juice', 'lassi', 'buttermilk', 'chaach'], category: 'Beverages', shelfLifeDays: 7, storageClass: 'Refrigerated', imageKey: 'beverage' },
];

const ITEM_IMAGES = {
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=60',
  milk: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=60',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=60',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=60',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=60',
  tomato: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=60',
  onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=60',
  potato: 'https://images.unsplash.com/photo-1518977676405-d4b7e4a0adf8?auto=format&fit=crop&w=800&q=60',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=60',
  capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=60',
  mushroom: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=60',
  cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=800&q=60',
  lemon: 'https://images.unsplash.com/photo-1571943345-b3e8dba04b3b?auto=format&fit=crop&w=800&q=60',
  tomato_puree: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?auto=format&fit=crop&w=800&q=60',
  rice: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=800&q=60',
  flour: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=60',
  dal: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=60',
  chickpea: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=60',
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=60',
  sugar: 'https://images.unsplash.com/photo-1550411294-e6a8e9e48c4d?auto=format&fit=crop&w=800&q=60',
  spice: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=60',
  chicken: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=60',
  meat: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=60',
  fish: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&w=800&q=60',
  egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=60',
  bread: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?auto=format&fit=crop&w=800&q=60',
  beverage: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=60',
  default: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=60'
};

function detectItemProfile(name) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return null;

  for (const profile of DETECTION_PROFILES) {
    for (const keyword of profile.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + profile.shelfLifeDays);
        return {
          category: profile.category,
          shelfLifeDays: profile.shelfLifeDays,
          storageClass: profile.storageClass,
          imageUrl: ITEM_IMAGES[profile.imageKey] || ITEM_IMAGES.default,
          expiryDate: expiryDate.toISOString().slice(0, 10),
          confidence: Math.floor(Math.random() * 7) + 92
        };
      }
    }
  }
  return null;
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
  const [detection, setDetection] = useState({ detecting: false, result: null });

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
    setDetection({ detecting: false, result: null });
  };

  useEffect(() => {
    const name = newItemForm.name.trim();
    if (!name) {
      setDetection({ detecting: false, result: null });
      return;
    }
    setDetection((prev) => ({ ...prev, detecting: true }));
    const timer = setTimeout(() => {
      const result = detectItemProfile(name);
      setDetection({ detecting: false, result });
      if (result) {
        setNewItemForm((prev) => ({
          ...prev,
          category: prev.category || result.category,
          expiryDate: result.expiryDate,
          imageUrl: prev.imageUrl || result.imageUrl
        }));
      }
    }, 850);
    return () => clearTimeout(timer);
  }, [newItemForm.name]);

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
                <Field
                  label={
                    <span className="flex items-center gap-2">
                      Item Name
                      {detection.detecting && <Loader2 size={12} className="animate-spin text-brand-orange" />}
                      {!detection.detecting && detection.result && <Sparkles size={12} className="text-emerald-500" />}
                    </span>
                  }
                  htmlFor="new-item-name"
                >
                  <input id="new-item-name" value={newItemForm.name} onChange={(event) => setNewItemForm({ ...newItemForm, name: event.target.value })} placeholder="e.g. Paneer Cubes, Basmati Rice…" />
                </Field>
                <Field
                  label={
                    <span className="flex items-center gap-2">
                      Category
                      {!detection.detecting && detection.result && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">AI</span>
                      )}
                    </span>
                  }
                  htmlFor="new-item-category"
                >
                  <input id="new-item-category" value={newItemForm.category} onChange={(event) => setNewItemForm({ ...newItemForm, category: event.target.value })} placeholder="e.g. Dairy, Produce, Dry Goods" />
                </Field>
                <Field label="Quantity" htmlFor="new-item-quantity">
                  <input id="new-item-quantity" type="number" value={newItemForm.quantity} onChange={(event) => setNewItemForm({ ...newItemForm, quantity: event.target.value })} />
                </Field>
                <Field label="Unit" htmlFor="new-item-unit">
                  <input id="new-item-unit" value={newItemForm.unit} onChange={(event) => setNewItemForm({ ...newItemForm, unit: event.target.value })} />
                </Field>
                <Field
                  label={
                    <span className="flex items-center gap-2">
                      Expiry Date
                      {!detection.detecting && detection.result && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">AI detected</span>
                      )}
                    </span>
                  }
                  htmlFor="new-item-expiry"
                >
                  <input
                    id="new-item-expiry"
                    type="date"
                    value={newItemForm.expiryDate}
                    onChange={(event) => setNewItemForm({ ...newItemForm, expiryDate: event.target.value })}
                  />
                </Field>
                <Field label="Image URL" htmlFor="new-item-image">
                  <input id="new-item-image" value={newItemForm.imageUrl} onChange={(event) => setNewItemForm({ ...newItemForm, imageUrl: event.target.value })} placeholder="Auto-filled on detection or paste URL" />
                </Field>
                <Field label="Notes" htmlFor="new-item-notes">
                  <textarea id="new-item-notes" value={newItemForm.notes} onChange={(event) => setNewItemForm({ ...newItemForm, notes: event.target.value })} />
                </Field>
              </div>

              {detection.detecting && (
                <div className="mt-4 flex items-center gap-3 rounded-[1rem] border border-line/60 bg-surface-muted/60 px-4 py-3 text-sm">
                  <Loader2 size={16} className="animate-spin text-brand-orange" />
                  <span className="text-ink-muted">AI model analyzing item profile</span>
                  <span className="ml-1 inline-flex gap-0.5">
                    <span className="animate-bounce text-brand-orange" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce text-brand-orange" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce text-brand-orange" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </div>
              )}

              {!detection.detecting && detection.result && (
                <div className="mt-4 rounded-[1.2rem] border border-emerald-500/30 bg-emerald-500/8 p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-emerald-500" />
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">AI Profile Detected</p>
                    <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{detection.result.confidence}% confidence</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-ink-muted">Detected Category</p>
                      <p className="font-semibold text-ink">{detection.result.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Typical Shelf Life</p>
                      <p className="font-semibold text-ink">{detection.result.shelfLifeDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Auto Expiry Set To</p>
                      <p className="font-semibold text-ink">{new Date(detection.result.expiryDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Storage Class</p>
                      <p className="font-semibold text-ink">{detection.result.storageClass}</p>
                    </div>
                  </div>
                </div>
              )}

              {!detection.detecting && newItemForm.name.trim() && !detection.result && (
                <div className="mt-4 flex items-center gap-3 rounded-[1rem] border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm">
                  <Sparkles size={15} className="text-amber-500" />
                  <span className="text-ink-muted">Item not recognized — please fill in category &amp; expiry manually.</span>
                </div>
              )}

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
