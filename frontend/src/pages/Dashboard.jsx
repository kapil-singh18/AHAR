import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import StatChip from '../components/ui/StatChip';
import Badge from '../components/ui/Badge';

function Dashboard() {
  const [form, setForm] = useState({
    kitchenId: 'kitchen-nyc-001',
    pastConsumption: '120,130,115,140,125,132,138',
    dayOfWeek: 'Friday',
    expectedPeople: 145,
    events: 'Founders Day',
    weather: 'Rainy'
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [wasteDashboard, setWasteDashboard] = useState(null);
  const [chartError, setChartError] = useState('');

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitPrediction = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const payload = {
        kitchenId: form.kitchenId,
        pastConsumption: form.pastConsumption.split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)),
        dayOfWeek: form.dayOfWeek,
        expectedPeople: Number(form.expectedPeople),
        events: form.events ? form.events.split(',').map((x) => x.trim()) : [],
        weather: form.weather
      };

      const res = await api.post('/predict-demand', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed');
    }
  };

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const [weeklyRes, wasteRes] = await Promise.all([
          api.get('/analytics/weekly-report', { params: { kitchenId: form.kitchenId } }),
          api.get('/analytics/waste-dashboard', { params: { kitchenId: form.kitchenId } })
        ]);
        setWeeklyReport(weeklyRes.data?.data || null);
        setWasteDashboard(wasteRes.data?.data || null);
        setChartError('');
      } catch (err) {
        setChartError(err.response?.data?.message || 'Failed to load chart data');
      }
    };

    loadChartData();
  }, [form.kitchenId]);

  const weeklySavings = Number(weeklyReport?.estimatedSavings || 0);
  const dailyMoneySaved = Number((weeklySavings / 7).toFixed(2));

  const wasteTrend = (wasteDashboard?.dailyWasteTotals || [])
    .slice(-7)
    .map((row) => ({
      date: row?._id?.date || '',
      leftover: Number(row?.totalLeftover || 0)
    }));

  const maxLeftover = Math.max(1, ...wasteTrend.map((d) => d.leftover));
  const linePoints = wasteTrend
    .map((point, index) => {
      const x = wasteTrend.length === 1 ? 0 : (index / (wasteTrend.length - 1)) * 100;
      const y = 100 - (point.leftover / maxLeftover) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Forecast Mission"
        title="Demand Prediction Dashboard"
        description="Estimate demand before prep begins so your kitchen can reduce overproduction and redirect surplus responsibly."
      />

      <Card toned title="Demand Prediction">
        <form className="form-grid" onSubmit={submitPrediction}>
          <Field label="Kitchen ID" htmlFor="kitchen-id">
            <input id="kitchen-id" name="kitchenId" value={form.kitchenId} onChange={onChange} placeholder="Kitchen ID" />
          </Field>
          <Field label="Past Consumption (CSV)" htmlFor="past-consumption">
            <input id="past-consumption" name="pastConsumption" value={form.pastConsumption} onChange={onChange} placeholder="e.g., 120,130,115,140,125" />
          </Field>
          <Field label="Day of Week" htmlFor="day-of-week">
            <input id="day-of-week" name="dayOfWeek" value={form.dayOfWeek} onChange={onChange} placeholder="e.g., Monday, Friday" />
          </Field>
          <Field label="Expected People" htmlFor="expected-people">
            <input id="expected-people" name="expectedPeople" type="number" value={form.expectedPeople} onChange={onChange} placeholder="Expected number of people" />
          </Field>
          <Field label="Events (CSV)" htmlFor="events">
            <input id="events" name="events" value={form.events} onChange={onChange} placeholder="e.g., Founders Day, Festival" />
          </Field>
          <Field label="Weather" htmlFor="weather">
            <input id="weather" name="weather" value={form.weather} onChange={onChange} placeholder="e.g., Rainy, Sunny, Cloudy" />
          </Field>
          <div className="form-action">
            <Button id="predict-submit" type="submit">Predict Demand</Button>
          </div>
        </form>
      </Card>

      {chartError && <Alert tone="error" ariaLive="assertive">{chartError}</Alert>}

      <Card title="Daily Money Saved Chart">
        <div className="stats-grid">
          <StatChip label="Daily Money Saved" value={`₹${dailyMoneySaved}`} />
          <StatChip label="Weekly Savings" value={`₹${weeklySavings.toFixed(2)}`} />
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Daily</span>
              <strong>₹{dailyMoneySaved}</strong>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              <div
                style={{
                  width: `${Math.min(100, (dailyMoneySaved / Math.max(1, weeklySavings)) * 100)}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--accent), var(--primary))'
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Weekly</span>
              <strong>₹{weeklySavings.toFixed(2)}</strong>
            </div>
            <div style={{ height: 10, borderRadius: 999, background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--primary), var(--primary-strong))'
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Waste Trend (Last 7 Days)">
        {wasteTrend.length === 0 ? (
          <p className="empty-state">No trend data available yet.</p>
        ) : (
          <div className="stack" style={{ gap: '0.75rem' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 170, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-muted)' }}>
              <polyline fill="none" stroke="var(--primary)" strokeWidth="2" points={linePoints} />
            </svg>
            <div className="row" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', borderTop: 0, padding: 0 }}>
              {wasteTrend.slice(-3).map((entry) => (
                <span key={entry.date} style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  {entry.date}: {entry.leftover}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {error && <Alert tone="error" ariaLive="assertive">{error}</Alert>}

      {result && (
        <Card title="Prediction Results">
          <div className="stats-grid">
            <StatChip label="Predicted Quantity" value={result.predictedQuantity} />
            <StatChip
              label="Surplus Risk"
              value={result.surplusRisk ? <Badge tone="warning">High Risk</Badge> : <Badge tone="success">Controlled</Badge>}
            />
            <StatChip
              label="Donation Recommended"
              value={result.donationRecommended ? <Badge tone="success">Yes</Badge> : <Badge tone="neutral">No</Badge>}
            />
          </div>
          {result.adjustmentFactors && (
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <strong>Adjustment Factors:</strong>
              <div>Event Multiplier: {result.adjustmentFactors.eventMultiplier?.toFixed(2) || 1}</div>
              <div>Weather Multiplier: {result.adjustmentFactors.weatherMultiplier?.toFixed(2) || 1}</div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
