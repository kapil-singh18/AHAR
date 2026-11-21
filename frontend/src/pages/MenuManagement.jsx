import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';

function MenuManagement() {
  const [dishes, setDishes] = useState([]);
  const [form, setForm] = useState({
    name: '',
    ingredientId: '',
    ingredientName: '',
    amountPerMeal: '',
    unit: 'kg',
    quantityPerPerson: 1
  });

  const loadDishes = async () => {
    const res = await api.get('/menu');
    setDishes(res.data.data || []);
  };

  useEffect(() => {
    loadDishes();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    await api.post('/menu', {
      name: form.name,
      ingredients: [
        {
          ingredientId: form.ingredientId,
          name: form.ingredientName,
          amountPerMeal: Number(form.amountPerMeal),
          unit: form.unit
        }
      ],
      quantityPerPerson: Number(form.quantityPerPerson)
    });
    setForm({ name: '', ingredientId: '', ingredientName: '', amountPerMeal: '', unit: 'kg', quantityPerPerson: 1 });
    loadDishes();
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Plan Smart Menus"
        title="Menu Management"
        description="Build portion-aware recipes so each service aligns with demand and reduces avoidable prep waste."
      />
      <Card toned title="Add Dish">
        <form className="form-grid" onSubmit={onCreate}>
          <Field label="Dish name" htmlFor="dish-name">
            <input id="dish-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dish Name" />
          </Field>
          <Field label="Ingredient ID" htmlFor="ingredient-id">
            <input id="ingredient-id" value={form.ingredientId} onChange={(e) => setForm({ ...form, ingredientId: e.target.value })} placeholder="Ingredient ID" />
          </Field>
          <Field label="Ingredient name" htmlFor="ingredient-name">
            <input id="ingredient-name" value={form.ingredientName} onChange={(e) => setForm({ ...form, ingredientName: e.target.value })} placeholder="Ingredient Name" />
          </Field>
          <Field label="Amount per meal" htmlFor="amount-per-meal">
            <input id="amount-per-meal" type="number" value={form.amountPerMeal} onChange={(e) => setForm({ ...form, amountPerMeal: e.target.value })} placeholder="Amount per Meal" />
          </Field>
          <Field label="Unit" htmlFor="unit">
            <input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Unit" />
          </Field>
          <Field label="Quantity per person" htmlFor="quantity-per-person">
            <input id="quantity-per-person" type="number" value={form.quantityPerPerson} onChange={(e) => setForm({ ...form, quantityPerPerson: e.target.value })} placeholder="Quantity per Person" />
          </Field>
          <div className="form-action">
            <Button id="add-dish-action" type="submit">Add Dish</Button>
          </div>
        </form>
      </Card>

      <Card title="Dish List">
        {dishes.length === 0 && <p className="empty-state">No dishes added yet for this kitchen.</p>}
        {dishes.map((dish) => (
          <div key={dish._id} className="row">
            <strong>{dish.name}</strong>
            <span>QPP: {dish.quantityPerPerson}</span>
            <Badge tone="neutral">Ingredients: {dish.ingredients.length}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default MenuManagement;
