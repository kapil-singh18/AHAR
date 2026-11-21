import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', category: '', stockQuantity: '', unit: 'kg', reorderDays: '' });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [itemsRes, batchesRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/batches')
      ]);
      setItems(itemsRes.data?.data || []);
      setBatches(batchesRes.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/inventory', {
        name: form.name,
        category: form.category || undefined,
        stockQuantity: Number(form.stockQuantity),
        unit: form.unit,
        reorderDays: form.reorderDays ? Number(form.reorderDays) : undefined
      });
      setForm({ name: '', category: '', stockQuantity: '', unit: 'kg', reorderDays: '' });
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not add inventory item.');
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><p className="eyebrow">Operations</p><h1>Inventory</h1><p>Stock levels and purchase batches for the active kitchen.</p></div>
      {error && <Alert tone="error">{error}</Alert>}
      <Card toned title="Add inventory item">
        <form className="form-grid" onSubmit={submit}>
          <Field label="Item name" htmlFor="inventory-name"><input id="inventory-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Category" htmlFor="inventory-category"><input id="inventory-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Stock quantity" htmlFor="inventory-stock"><input id="inventory-stock" type="number" min="0" step="0.01" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required /></Field>
          <Field label="Unit" htmlFor="inventory-unit"><input id="inventory-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required /></Field>
          <Field label="Reorder days" htmlFor="inventory-reorder"><input id="inventory-reorder" type="number" min="0" step="0.1" value={form.reorderDays} onChange={(e) => setForm({ ...form, reorderDays: e.target.value })} /></Field>
          <div className="form-action"><button className="btn btn-primary" type="submit">Add item</button></div>
        </form>
      </Card>
      <Card title="Stock">
        {loading ? <div className="empty-state">Loading inventory...</div> : items.length ? (
          <div className="table-shell"><table className="data-table"><thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Status</th></tr></thead><tbody>
            {items.map((item) => <tr key={item._id}><td>{item.name}</td><td>{item.category || '-'}</td><td>{item.stockQuantity} {item.unit}</td><td><Badge tone={item.stockQuantity <= (item.reorderDays || 0) ? 'warning' : 'success'}>{item.stockQuantity <= (item.reorderDays || 0) ? 'Review stock' : 'Available'}</Badge></td></tr>)}
          </tbody></table></div>
        ) : <div className="empty-state">No inventory items found.</div>}
      </Card>
      <Card title="Purchase batches">
        {batches.length ? (
          <div className="table-shell"><table className="data-table"><thead><tr><th>Ingredient</th><th>Remaining</th><th>Expiry</th><th>Vendor</th></tr></thead><tbody>
            {batches.map((batch) => <tr key={batch._id}><td>{batch.ingredientName}</td><td>{batch.remainingQuantity} {batch.unit}</td><td>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '-'}</td><td>{batch.vendor || '-'}</td></tr>)}
          </tbody></table></div>
        ) : <div className="empty-state">No purchase batches found.</div>}
      </Card>
    </div>
  );
}

export default InventoryPage;
