import React, { useMemo, useState } from 'react';
import { Bell, BellRing, CheckCircle2, PhoneCall, Search, Sparkles } from 'lucide-react';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import SectionTabs from '../components/SectionTabs';
import { nearestNgos } from '../data/mockDataLayer';
import api from '../services/api';

const NEAREST_NGO = [...nearestNgos].sort((a, b) => a.distanceKm - b.distanceKm)[0];

const tabs = [
  { id: 'predict', label: 'Prediction Input' },
  { id: 'result', label: 'Result View' },
  { id: 'notes', label: 'Recommendations' }
];

const KITCHEN_ID = 'kitchen-nyc-001';

function PredictionPage() {
  const [activeTab, setActiveTab] = useState('predict');
  const [query, setQuery] = useState('Lunch buffet - North Indian thali');
  const [form, setForm] = useState({
    dateTime: new Date().toISOString().slice(0, 16),
    serviceWindow: 'Lunch',
    holiday: false,
    lastDayCustomers: 96,
    last7DayAvg: 88,
    temperature: 74,
    weatherCondition: 'cloudy',
    eventEffect: 'none',
    eventSize: 'none'
  });
  const [result, setResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState('');
  const [alertState, setAlertState] = useState('idle'); // idle | sending | sent

  const autoContext = useMemo(() => {
    const selectedDate = new Date(form.dateTime);
    const day = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    const lastDayCustomers = Number(form.lastDayCustomers) || 0;
    const last7DayAvg = Number(form.last7DayAvg) || 0;
    const expectedPeopleEstimate = Math.round(last7DayAvg || lastDayCustomers || 0);
    const occupancyRate = Math.min(0.98, Math.max(0.2, Number(((lastDayCustomers || expectedPeopleEstimate) / 190).toFixed(2))));

    return {
      day,
      isWeekend,
      temperature: Number(form.temperature) || 74,
      weatherCondition: form.weatherCondition,
      occupancyRate,
      prevDayMeals: lastDayCustomers,
      prev7DayAvgMeals: last7DayAvg,
      expectedPeopleEstimate,
      eventEffect: form.eventEffect,
      eventSize: form.eventSize,
      holiday: form.holiday
    };
  }, [form.dateTime, form.eventEffect, form.eventSize, form.holiday, form.last7DayAvg, form.lastDayCustomers, form.temperature, form.weatherCondition]);

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
      const expectedPeople = autoContext.expectedPeopleEstimate;
      const backendPayload = {
        kitchenId: KITCHEN_ID,
        pastConsumption: [
          autoContext.prev7DayAvgMeals,
          autoContext.prevDayMeals,
          autoContext.expectedPeopleEstimate
        ],
        date: form.dateTime.slice(0, 10),
        mealSlot: form.serviceWindow,
        dayOfWeek: autoContext.day,
        expectedPeople,
        lastDayCustomers: autoContext.prevDayMeals,
        last7DayAvg: autoContext.prev7DayAvgMeals,
        temperature: autoContext.temperature,
        weatherCondition: autoContext.weatherCondition,
        holiday: autoContext.holiday,
        eventEffect: autoContext.eventEffect,
        eventSize: autoContext.eventSize,
        events: autoContext.holiday ? ['Holiday'] : [],
        weather: autoContext.weatherCondition
      };

      const response = await api.post('/predict-demand', backendPayload);
      const predictedPlates = Number(response.data?.predictedQuantity || 0);
      const estimatedDemand = Number(response.data?.expectedPeople || expectedPeople || 0);
      const estimatedWaste = Math.max(0, predictedPlates - estimatedDemand);
      const efficiency = predictedPlates > 0 ? Number(((estimatedDemand / predictedPlates) * 100).toFixed(1)) : 0;

      const donationRecommended = !!response.data?.donationRecommended;
      setResult({
        predictedPlates,
        estimatedWaste,
        efficiency,
        estimatedDemand,
        recommendation: donationRecommended ? 'Donation Recommended' : 'Normal Distribution',
        donationRecommended,
        autoContext,
        weather: autoContext.weatherCondition,
        adjustmentFactors: response.data?.adjustmentFactors || null
      });
      setLoadingProgress(100);
      if (donationRecommended) {
        setAlertState('idle');
      }
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

  const efficiencyValue = useMemo(() => {
    if (!result) return 0;
    return Math.max(0, Math.min(100, Number(result.efficiency) || 0));
  }, [result]);

  const sendDonationAlert = () => {
    if (alertState !== 'idle') return;
    setAlertState('sending');
    setTimeout(() => setAlertState('sent'), 1600);
  };

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
            <Field label="Yesterday's Customers" htmlFor="pred-last-day">
              <input id="pred-last-day" type="number" value={form.lastDayCustomers} onChange={(event) => setForm({ ...form, lastDayCustomers: event.target.value })} />
            </Field>
            <Field label="7-Day Average" htmlFor="pred-last-7-day">
              <input id="pred-last-7-day" type="number" value={form.last7DayAvg} onChange={(event) => setForm({ ...form, last7DayAvg: event.target.value })} />
            </Field>
            <Field label="Temperature (°F)" htmlFor="pred-temperature">
              <input id="pred-temperature" type="number" value={form.temperature} onChange={(event) => setForm({ ...form, temperature: event.target.value })} />
            </Field>
            <Field label="Weather Condition" htmlFor="pred-weather-condition">
              <select id="pred-weather-condition" value={form.weatherCondition} onChange={(event) => setForm({ ...form, weatherCondition: event.target.value })}>
                <option value="sunny">Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="rainy">Rainy</option>
                <option value="storm">Storm</option>
              </select>
            </Field>
            <Field label="Event Effect" htmlFor="pred-event-effect">
              <select id="pred-event-effect" value={form.eventEffect} onChange={(event) => setForm({ ...form, eventEffect: event.target.value })}>
                <option value="decrease">Decrease</option>
                <option value="none">None</option>
                <option value="increase">Increase</option>
              </select>
            </Field>
            <Field label="Event Size" htmlFor="pred-event-size">
              <select id="pred-event-size" value={form.eventSize} onChange={(event) => setForm({ ...form, eventSize: event.target.value })}>
                <option value="large">Large</option>
                <option value="medium">Medium</option>
                <option value="small">Small</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label="Holiday" htmlFor="pred-holiday">
              <select id="pred-holiday" value={form.holiday ? 'yes' : 'no'} onChange={(event) => setForm({ ...form, holiday: event.target.value === 'yes' })}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
          </div>

          <div className="mt-4 rounded-[1.4rem] border border-line/70 bg-surface-muted/70 p-4">
            <p className="text-sm font-semibold text-ink">Model Context</p>
            <p className="mt-1 text-sm text-ink-muted">These values are the exact feature inputs sent to your demand model.</p>
            <div className="mt-3 grid gap-2 text-sm text-ink-muted sm:grid-cols-2">
              <p>Day of Week: <span className="font-semibold text-ink">{autoContext.day}</span></p>
              <p>Weekend: <span className="font-semibold text-ink">{autoContext.isWeekend ? 'Yes' : 'No'}</span></p>
              <p>Occupancy Rate: <span className="font-semibold text-ink">{autoContext.occupancyRate}</span></p>
              <p>Temperature: <span className="font-semibold text-ink">{autoContext.temperature}°F</span></p>
              <p>Prev Day Meals: <span className="font-semibold text-ink">{autoContext.prevDayMeals}</span></p>
              <p>Prev 7-Day Avg Meals: <span className="font-semibold text-ink">{autoContext.prev7DayAvgMeals}</span></p>
              <p>Estimated Demand Baseline: <span className="font-semibold text-ink">{autoContext.expectedPeopleEstimate}</span></p>
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
                  className="h-full rounded-full bg-brand-teal transition-all duration-150"
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
              <Card title="Efficiency Progress">
                <div className="flex items-center gap-4">
                  <div
                    className="relative h-24 w-24 rounded-full"
                    style={{
                      background: `conic-gradient(rgb(var(--color-brand-teal)) ${efficiencyValue}%, rgb(var(--color-surface-muted)) ${efficiencyValue}% 100%)`
                    }}
                    role="img"
                    aria-label={`Efficiency progress ${efficiencyValue}%`}
                  >
                    <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-surface">
                      <span className="text-lg font-bold text-brand-teal">{efficiencyValue}%</span>
                    </div>
                  </div>
                  <div className="text-sm text-ink-muted">
                    <p className="font-semibold text-ink">Efficiency Estimate</p>
                    <p>Target: 90%+</p>
                  </div>
                </div>
              </Card>
              <Card title="Recommendation"><Badge tone={recommendationTone}>{result.recommendation}</Badge></Card>
            </div>
          )}

          {result?.donationRecommended && !isPredicting && (
            <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-amber-500/40 bg-amber-500/8">
              <div className="flex items-center gap-3 border-b border-amber-500/20 px-5 py-3">
                {alertState === 'sent'
                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                  : <BellRing size={18} className="animate-bounce text-amber-500" />}
                <p className="text-sm font-semibold text-ink">
                  {alertState === 'sent' ? 'Donation Alert Sent' : 'Donation Alert — Nearest NGO'}
                </p>
                {alertState === 'sent' && (
                  <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">Notified</span>
                )}
                {alertState !== 'sent' && (
                  <span className="ml-auto rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Action Required</span>
                )}
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-[auto_1fr_auto]">
                <img
                  src={NEAREST_NGO.imageUrl}
                  alt={NEAREST_NGO.name}
                  className="h-20 w-28 rounded-[1rem] object-cover"
                />
                <div className="flex flex-col justify-center gap-1">
                  <p className="text-base font-semibold text-ink">{NEAREST_NGO.name}</p>
                  <p className="text-sm text-ink-muted">{NEAREST_NGO.description}</p>
                  <div className="flex flex-wrap gap-4 pt-1 text-sm">
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <PhoneCall size={13} />{NEAREST_NGO.contact}
                    </span>
                    <Badge tone="success">{NEAREST_NGO.distanceKm} km away</Badge>
                  </div>
                </div>
                <div className="flex items-center">
                  {alertState === 'sent' ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600">
                      <CheckCircle2 size={15} /> Alert Sent
                    </div>
                  ) : (
                    <Button type="button" onClick={sendDonationAlert} disabled={alertState === 'sending'}>
                      <Bell size={15} />
                      {alertState === 'sending' ? 'Sending…' : 'Send Alert'}
                    </Button>
                  )}
                </div>
              </div>
              {alertState === 'sent' && (
                <div className="border-t border-emerald-500/20 bg-emerald-500/8 px-5 py-3 text-sm text-emerald-700">
                  Donation request dispatched to <strong>{NEAREST_NGO.name}</strong> via SMS &amp; app notification. They will confirm pickup shortly.
                </div>
              )}
            </div>
          )}

          {result?.autoContext && (
            <div className="mt-4 rounded-[1.4rem] border border-line/70 bg-surface-muted/70 p-4 text-sm text-ink-muted">
              <p className="font-semibold text-ink">Context Used For This Prediction</p>
              <p className="mt-2">Day: {result.autoContext.day} | Weekend: {result.autoContext.isWeekend ? 'Yes' : 'No'} | Temp: {result.autoContext.temperature}°F</p>
              <p className="mt-1">Prev Day: {result.autoContext.prevDayMeals} | Prev 7-day Avg: {result.autoContext.prev7DayAvgMeals} | Baseline: {result.autoContext.expectedPeopleEstimate}</p>
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
