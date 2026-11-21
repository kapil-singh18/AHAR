import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';

function PredictionPage() {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    mealSlot: 'Lunch',
    expectedPeople: '',
    lastDayCustomers: '',
    last7DayAvg: '',
    temperature: '',
    weatherCondition: 'cloudy',
    holiday: false,
    eventEffect: 'none',
    eventSize: 'none'
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [serviceStatus, setServiceStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    api.get('/ml/health')
      .then(() => { if (active) setServiceStatus('available'); })
      .catch(() => { if (active) setServiceStatus('unavailable'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/consumption')
      .then((response) => {
        if (!active) return;
        const logs = response.data?.data || [];
        const daily = logs.reduce((totals, row) => {
          if (!row.date) return totals;
          const key = new Date(row.date).toISOString().slice(0, 10);
          totals[key] = (totals[key] || 0) + Number(row.consumed || 0);
          return totals;
        }, {});
        const dates = Object.entries(daily).sort(([left], [right]) => right.localeCompare(left));
        const previous = dates[0];
        const valid = dates.slice(0, 7);
        const lastDayCustomers = previous ? previous[1] : undefined;
        const last7DayAvg = valid.length
          ? Number((valid.reduce((sum, [, consumed]) => sum + consumed, 0) / valid.length).toFixed(1))
          : undefined;
        if (lastDayCustomers !== undefined || last7DayAvg !== undefined) {
          setForm((current) => ({
            ...current,
            lastDayCustomers: lastDayCustomers !== undefined ? String(lastDayCustomers) : current.lastDayCustomers,
            last7DayAvg: last7DayAvg !== undefined ? String(last7DayAvg) : current.last7DayAvg
          }));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const run = async (event) => {
    event.preventDefault();
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const dayOfWeek = new Date(`${form.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
      const response = await api.post('/predict-demand', {
        ...form,
        dayOfWeek,
        expectedPeople: form.expectedPeople ? Number(form.expectedPeople) : undefined,
        lastDayCustomers: form.lastDayCustomers ? Number(form.lastDayCustomers) : undefined,
        last7DayAvg: form.last7DayAvg ? Number(form.last7DayAvg) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        pastConsumption: [
          Number(form.last7DayAvg || 0),
          Number(form.lastDayCustomers || 0),
          Number(form.expectedPeople || 0)
        ].filter(Boolean)
      });
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Demand forecasting request failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head"><p className="eyebrow">AI Forecast</p><h1>Demand Forecasting</h1><p>Generate a demand prediction using the configured forecasting service.</p></div>
      {serviceStatus === 'checking' && <Alert tone="info">Checking demand forecasting service availability...</Alert>}
      {serviceStatus === 'unavailable' && <Alert tone="error">Demand forecasting service is currently unavailable. Please try again later.</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      <Card toned title="Forecast inputs">
        <form className="form-grid" onSubmit={run}>
          <Field label="Date" htmlFor="forecast-date"><input id="forecast-date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required /></Field>
          <Field label="Meal slot" htmlFor="forecast-slot"><select id="forecast-slot" value={form.mealSlot} onChange={(e) => update('mealSlot', e.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option></select></Field>
          <Field label="Expected people" htmlFor="forecast-expected"><input id="forecast-expected" type="number" min="1" value={form.expectedPeople} onChange={(e) => update('expectedPeople', e.target.value)} /></Field>
          <Field label="Last day customers" htmlFor="forecast-last-day"><input id="forecast-last-day" type="number" min="0" value={form.lastDayCustomers} onChange={(e) => update('lastDayCustomers', e.target.value)} /></Field>
          <Field label="7-day average" htmlFor="forecast-average"><input id="forecast-average" type="number" min="0" step="0.1" value={form.last7DayAvg} onChange={(e) => update('last7DayAvg', e.target.value)} /></Field>
          <Field label="Temperature (degrees)" htmlFor="forecast-temperature"><input id="forecast-temperature" type="number" value={form.temperature} onChange={(e) => update('temperature', e.target.value)} /></Field>
          <Field label="Weather" htmlFor="forecast-weather"><select id="forecast-weather" value={form.weatherCondition} onChange={(e) => update('weatherCondition', e.target.value)}><option value="sunny">Sunny</option><option value="cloudy">Cloudy</option><option value="rainy">Rainy</option><option value="storm">Storm</option></select></Field>
          <Field label="Event effect" htmlFor="forecast-event"><select id="forecast-event" value={form.eventEffect} onChange={(e) => update('eventEffect', e.target.value)}><option value="none">None</option><option value="increase">Increase</option><option value="decrease">Decrease</option></select></Field>
          <div className="form-action"><button className="btn btn-primary" type="submit" disabled={running}>{running ? 'Running forecast...' : 'Run prediction'}</button></div>
        </form>
      </Card>
      {result && (
        <Card title="Prediction result">
          <div className="stats-grid">
            <div className="stat-chip"><p>Predicted quantity</p><strong>{result.predictedQuantity}</strong></div>
            <div className="stat-chip"><p>Estimated waste</p><strong>{result.estimatedWaste}</strong></div>
            <div className="stat-chip"><p>Surplus risk</p><strong>{result.surplusRisk ? 'High' : 'Low'}</strong></div>
            <div className="stat-chip"><p>Donation recommendation</p><strong>{result.donationRecommended ? 'Recommended' : 'Not recommended'}</strong></div>
          </div>
        </Card>
      )}
      {!result && !error && <div className="empty-state">Run a forecast to view the model result.</div>}
    </div>
  );
}

export default PredictionPage;
