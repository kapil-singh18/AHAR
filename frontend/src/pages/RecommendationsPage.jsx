import React, { useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import { useLanguage } from '../i18n';
import TranslatedText from '../components/TranslatedText';

function RecommendationsPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    kitchenId: 'kitchen-nyc-001',
    topK: 5,
    cuisine: '',
    menuType: '',
    maxPrepTimeMin: '',
    excludeMissingIngredients: false
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const fetchRecommendations = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const payload = {
        kitchenId: form.kitchenId,
        topK: Number(form.topK),
        cuisine: form.cuisine || undefined,
        menuType: form.menuType || undefined,
        maxPrepTimeMin: form.maxPrepTimeMin ? Number(form.maxPrepTimeMin) : undefined,
        excludeMissingIngredients: Boolean(form.excludeMissingIngredients)
      };

      const res = await api.post('/recommend-dishes', payload);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 500) {
        setError('Recommendation service is unavailable on deployed backend. Redeploy backend with fallback support or set ML_RECOMMENDER_URL.');
      } else {
        setError(err.response?.data?.message || 'Recommendation request failed');
      }
    }
  };

  const recs = result?.recommendations || [];

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Cook Smarter"
        title="Dish Recommendations"
        description="Get AI-ranked dish suggestions and see which ones already exist in your kitchen menu."
      />

      <Card toned title="Recommendation Inputs">
        <form className="form-grid" onSubmit={fetchRecommendations}>
          <Field label="Kitchen ID (optional match)" htmlFor="rec-kitchen-id">
            <input id="rec-kitchen-id" name="kitchenId" value={form.kitchenId} onChange={onChange} placeholder="Kitchen ID" />
          </Field>
          <Field label="Top K" htmlFor="rec-topk">
            <input id="rec-topk" name="topK" type="number" value={form.topK} onChange={onChange} min="1" max="25" />
          </Field>
          <Field label="Cuisine (optional)" htmlFor="rec-cuisine">
            <input id="rec-cuisine" name="cuisine" value={form.cuisine} onChange={onChange} placeholder="indian / south_indian / ..." />
          </Field>
          <Field label="Menu type (optional)" htmlFor="rec-menutype">
            <input id="rec-menutype" name="menuType" value={form.menuType} onChange={onChange} placeholder="veg / vegan / nonveg / ..." />
          </Field>
          <Field label="Max prep time (min)" htmlFor="rec-prep">
            <input id="rec-prep" name="maxPrepTimeMin" type="number" value={form.maxPrepTimeMin} onChange={onChange} placeholder="e.g. 45" />
          </Field>
          <Field label="Exclude dishes with missing ingredients" htmlFor="rec-exclude">
            <label className="row">
              <input id="rec-exclude" name="excludeMissingIngredients" type="checkbox" checked={form.excludeMissingIngredients} onChange={onChange} />
              <span><TranslatedText text="Only show fully-covered recipes" /></span>
            </label>
          </Field>
          <div className="form-action">
            <Button type="submit">Get Recommendations</Button>
          </div>
        </form>
      </Card>

      {error && <Alert tone="error" ariaLive="assertive">{error}</Alert>}

      {result && (
        <Card title={`${t('Recommendations')} (${recs.length})`}>
          {recs.length === 0 && <p className="empty-state">No recommendations matched your filters.</p>}
          {recs.map((rec) => (
            <div key={rec.dishName} className="row">
              <strong className="flex-1">{rec.dishName}</strong>
              {rec.existsInMenu ? <Badge tone="success">In menu</Badge> : <Badge tone="neutral">Not in menu</Badge>}
              <Badge tone="neutral">Score: {Number(rec.score).toFixed(3)}</Badge>
              {Array.isArray(rec.missingIngredients) && rec.missingIngredients.length > 0 && (
                <Badge tone="warning">Missing: {rec.missingIngredients.slice(0, 3).join(', ')}</Badge>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default RecommendationsPage;
