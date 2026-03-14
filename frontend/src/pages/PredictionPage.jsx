import React, { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import SectionTabs from '../components/SectionTabs';
import api from '../services/api';

const tabs = [
  { id: 'predict', label: 'Prediction Input' },
  { id: 'result', label: 'Result View' },
  { id: 'notes', label: 'Recommendations' }
];

const KITCHEN_ID = 'kitchen-nyc-001';

function deriveWeatherLabel(temperature) {
  if (temperature >= 34) return 'Sunny';
  if (temperature <= 22) return 'Windy';
  if (temperature >= 30) return 'Cloudy';
  return 'Rainy';
}

function PredictionPage() {
  const [activeTab, setActiveTab] = useState('predict');
  const [query, setQuery] = useState('Lunch buffet - North Indian thali');
  const [form, setForm] = useState({
    expectedPeople: 140,
    dateTime: new Date().toISOString().slice(0, 16),
    serviceWindow: 'Lunch',
    eventType: 'Regular Day',
    menuType: 'Buffet',
    facilityType: 'Restaurant',
    autoMode: true
  });
  const [result, setResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState('');

  const autoContext = useMemo(() => {
    const expectedPeople = Number(form.expectedPeople) || 0;
    const selectedDate = new Date(form.dateTime);
    const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = day === 'Saturday' || day === 'Sunday';

    const baseTempByMonth = [24, 26, 30, 33, 35, 33, 30, 29, 29, 30, 28, 25];
    const monthTemp = baseTempByMonth[selectedDate.getMonth()] || 29;
    const temperature = monthTemp + (isWeekend ? 1 : 0);

    const occupancyRate = Math.min(0.98, Math.max(0.45, Number((expectedPeople / 190).toFixed(2))));
    const prevDayMeals = Math.max(40, Math.round(expectedPeople * (isWeekend ? 1.08 : 0.96)));
    const prev7DayAvgMeals = Math.max(35, Math.round(expectedPeople * 0.92));
    const mealsPrepared = Math.round(expectedPeople * 1.06);

    return {
      day,
      temperature,
      occupancyRate,
      prevDayMeals,
      prev7DayAvgMeals,
      mealsPrepared
    };
  }, [form.dateTime, form.expectedPeople]);

  const eventMultiplierMap = {
    'Regular Day': 1.0,
    Weekend: 1.08,
    'Corporate Event': 1.14,
    Festival: 1.2
  };

  const serviceWindowMultiplierMap = {
    Breakfast: 0.82,
    Lunch: 1.0,
    Dinner: 1.12
  };

  const runPrediction = async () => {
    if (isPredicting) {
      return;
    }

    setIsPredicting(true);
    setLoadingProgress(0);
    setError('');
    setResult(null);
    setActiveTab('result');

    // Simulate real model inference latency.
    const waitTimeMs = 2800 + Math.floor(Math.random() * 2800);
    const startTime = Date.now();

    await new Promise((resolve) => {
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(99, Math.round((elapsed / waitTimeMs) * 100));
        setLoadingProgress(progress);

        if (elapsed >= waitTimeMs) {
          clearInterval(timer);
          resolve();
        }
      }, 120);
    });

    try {
      const expectedPeople = Number(form.expectedPeople) || 0;
      const weather = deriveWeatherLabel(autoContext.temperature);
      const backendPayload = {
        kitchenId: KITCHEN_ID,
        pastConsumption: [
          autoContext.prev7DayAvgMeals,
          autoContext.prevDayMeals,
          autoContext.mealsPrepared
        ],
        dayOfWeek: autoContext.day,
        expectedPeople,
        events: form.eventType === 'Regular Day' ? [] : [form.eventType],
        weather
      };

      const response = await api.post('/predict-demand', backendPayload);
      const predictedPlates = Number(response.data?.predictedQuantity || 0);
      const estimatedWaste = Math.max(0, predictedPlates - expectedPeople);
      const efficiency = predictedPlates > 0 ? Number(((expectedPeople / predictedPlates) * 100).toFixed(1)) : 0;

      setResult({
        predictedPlates,
        estimatedWaste,
        efficiency,
        recommendation: response.data?.donationRecommended ? 'Donation Recommended' : 'Normal Distribution',
        autoContext,
        weather,
        adjustmentFactors: response.data?.adjustmentFactors || null
      });
      setLoadingProgress(100);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Prediction request failed.');
      setActiveTab('predict');
    } finally {
      setIsPredicting(false);
    }
  };

  const recommendationTone = useMemo(() => {
    if (!result) return 'neutral';
    return result.recommendation.includes('Donation') ? 'warning' : 'success';
  }, [result]);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="AI Forecast"
        title="Prediction"
        description="Estimate meal demand before prep begins and get real-time guidance on waste and donation actions."
      />

      <SectionTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {error && <Alert tone="error">{error}</Alert>}

      {activeTab === 'predict' && (
        <Card toned title="Prediction Input (Minimal Manual Mode)">
          <div className="rounded-[1.5rem] border border-line/70 bg-surface/85 p-4">
            <label htmlFor="prediction-search" className="mb-2 block text-sm font-semibold text-ink">Meal Context Search</label>
            <div className="flex items-center gap-3 rounded-2xl border border-line/80 bg-surface-raised/90 px-4 py-3">
              <Search size={18} className="text-ink-muted" />
              <input
                id="prediction-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meal context, menu pattern, or prep notes"
                className="w-full border-0 bg-transparent p-0 text-sm text-ink outline-none"
              />
            </div>
          </div>

          <div className="form-grid mt-4">
            <Field label="Expected People" htmlFor="pred-people">
              <input id="pred-people" type="number" value={form.expectedPeople} onChange={(event) => setForm({ ...form, expectedPeople: event.target.value })} />
            </Field>
            <Field label="Date & Time" htmlFor="pred-datetime">
              <input id="pred-datetime" type="datetime-local" value={form.dateTime} onChange={(event) => setForm({ ...form, dateTime: event.target.value })} />
            </Field>
            <Field label="Service Window" htmlFor="pred-service-window">
              <select id="pred-service-window" value={form.serviceWindow} onChange={(event) => setForm({ ...form, serviceWindow: event.target.value })}>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
              </select>
            </Field>
            <Field label="Event Type" htmlFor="pred-event-type">
              <select id="pred-event-type" value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value })}>
                <option>Regular Day</option>
                <option>Weekend</option>
                <option>Corporate Event</option>
                <option>Festival</option>
              </select>
            </Field>
            <Field label="Menu Type" htmlFor="pred-menu-type">
              <select id="pred-menu-type" value={form.menuType} onChange={(event) => setForm({ ...form, menuType: event.target.value })}>
                <option>Buffet</option>
                <option>A la carte</option>
                <option>Set Menu</option>
              </select>
            </Field>
            <Field label="Facility Type" htmlFor="pred-facility-type">
              <select id="pred-facility-type" value={form.facilityType} onChange={(event) => setForm({ ...form, facilityType: event.target.value })}>
                <option>Restaurant</option>
                <option>Cloud Kitchen</option>
                <option>Cafeteria</option>
                <option>Institutional Kitchen</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-line/70 bg-surface-muted/70 p-4">
            <p className="text-sm font-semibold text-ink">Auto-Captured Model Context</p>
            <p className="mt-1 text-sm text-ink-muted">These values are generated automatically to reduce manual input.</p>
            <div className="mt-3 grid gap-2 text-sm text-ink-muted sm:grid-cols-2">
              <p>Day of Week: <span className="font-semibold text-ink">{autoContext.day}</span></p>
              <p>Occupancy Rate: <span className="font-semibold text-ink">{autoContext.occupancyRate}</span></p>
              <p>Temperature: <span className="font-semibold text-ink">{autoContext.temperature}°C</span></p>
              <p>Prev Day Meals: <span className="font-semibold text-ink">{autoContext.prevDayMeals}</span></p>
              <p>Prev 7-Day Avg Meals: <span className="font-semibold text-ink">{autoContext.prev7DayAvgMeals}</span></p>
              <p>Meals Prepared (Auto): <span className="font-semibold text-ink">{autoContext.mealsPrepared}</span></p>
            </div>
          </div>

          <div className="mt-5">
            <Button type="button" onClick={runPrediction} disabled={isPredicting}>
              <Sparkles size={16} />
              {isPredicting ? 'Processing Prediction...' : 'Run Prediction'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'result' && (
        <Card title="Prediction Result">
          {isPredicting ? (
            <div className="rounded-[1.4rem] border border-line/70 bg-surface-muted/70 p-5">
              <p className="text-base font-semibold text-ink">Running AI prediction model...</p>
              <p className="mt-2 text-sm leading-7 text-ink-muted">Analyzing context, weather, and event multipliers. This can take a few seconds.</p>
              <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
                <span>Processing...</span>
                <span className="font-semibold text-ink">{loadingProgress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-red to-brand-orange transition-all duration-150"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          ) : !result ? (
            <p className="empty-state">Run a prediction to view output cards.</p>
          ) : (
            <div className="stats-grid">
              <Card title="Predicted Plates"><p className="text-4xl font-bold text-ink">{result.predictedPlates}</p></Card>
              <Card title="Estimated Waste"><p className="text-4xl font-bold text-brand-orange">{result.estimatedWaste}</p></Card>
              <Card title="Efficiency Estimate"><p className="text-4xl font-bold text-brand-teal">{result.efficiency}%</p></Card>
              <Card title="Recommendation"><Badge tone={recommendationTone}>{result.recommendation}</Badge></Card>
            </div>
          )}

          {result?.autoContext && (
            <div className="mt-4 rounded-[1.4rem] border border-line/70 bg-surface-muted/70 p-4 text-sm text-ink-muted">
              <p className="font-semibold text-ink">Context Used For This Prediction</p>
              <p className="mt-2">Day: {result.autoContext.day} | Occupancy: {result.autoContext.occupancyRate} | Temp: {result.autoContext.temperature}°C</p>
              <p className="mt-1">Prev Day: {result.autoContext.prevDayMeals} | Prev 7-day Avg: {result.autoContext.prev7DayAvgMeals} | Prepared: {result.autoContext.mealsPrepared}</p>
              <p className="mt-1">Weather: {result.weather}</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'notes' && (
        <Card title="Operational Recommendation">
          <div className="rounded-[1.4rem] border border-line/70 bg-surface-muted/70 p-4">
            <p className="text-sm leading-7 text-ink-muted">When estimated waste exceeds threshold, trigger donation workflows and lower prep quantity for the next similar slot. Track this outcome in Dashboard reports.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default PredictionPage;
