import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';

function InventoryPage() {
  const [kitchenId, setKitchenId] = useState('kitchen-nyc-001');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', stockQuantity: '', unit: 'kg', unitCost: '', reorderDays: 0 });
  const [error, setError] = useState('');

  const loadInventory = async () => {
    try {
      const res = await api.get('/inventory', { params: { kitchenId } });
      setItems(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        kitchenId,
        name: form.name,
        stockQuantity: Number(form.stockQuantity),
        unit: form.unit,
        unitCost: form.unitCost === '' ? undefined : Number(form.unitCost),
        reorderDays: Number(form.reorderDays)
      });
      setForm({ name: '', stockQuantity: '', unit: 'kg', unitCost: '', reorderDays: 0 });
      setError('');
      loadInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add ingredient');
    }
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Inventory Stewardship"
        title="Inventory Tracking"
        description="Track stock health in real time so ingredients are used before expiry and replenished only when needed."
      />
      <Card toned title="Add Ingredient">
        <form className="form-grid" onSubmit={onCreate}>
          <Field label="Kitchen ID" htmlFor="inventory-kitchen-id">
            <input id="inventory-kitchen-id" value={kitchenId} onChange={(e) => setKitchenId(e.target.value)} placeholder="Kitchen ID" />
          </Field>
          <Field label="Ingredient name" htmlFor="ingredient-name-input">
            <input id="ingredient-name-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ingredient Name" />
          </Field>
          <Field label="Stock quantity" htmlFor="stock-quantity">
            <input id="stock-quantity" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} placeholder="Stock" />
          </Field>
          <Field label="Unit" htmlFor="stock-unit">
            <input id="stock-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" />
          </Field>
          <Field label="Unit cost" htmlFor="stock-unit-cost">
            <input
              id="stock-unit-cost"
              type="number"
              min="0"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              placeholder="Cost per unit"
            />
          </Field>
          <Field label="Reorder in days" htmlFor="reorder-days">
            <input
              id="reorder-days"
              type="number"
              min="0"
              value={form.reorderDays}
              onChange={(e) => setForm({ ...form, reorderDays: e.target.value })}
              placeholder="Days until reorder"
            />
          </Field>
          <div className="form-action">
            <Button id="add-ingredient-action" type="submit">Add Ingredient</Button>
          </div>
        </form>
      </Card>
      {error && <Alert tone="error" ariaLive="assertive">{error}</Alert>}

      <Card title="Inventory List">
        {items.length === 0 && <p className="empty-state">No inventory items yet. Add your first ingredient above.</p>}
        {items.map((item) => (
          <div className="row" key={item._id}>
            <strong>{item.name}</strong>
            <span>{item.stockQuantity} {item.unit} | Cost: {Number(item.unitCost || 0).toFixed(2)}</span>
            <Badge tone={(item.reorderDays ?? item.reorderLevel ?? 0) <= 3 ? 'warning' : 'success'}>
              Reorder in {item.reorderDays ?? item.reorderLevel ?? 0} days
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default InventoryPage;
