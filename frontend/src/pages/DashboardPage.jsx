import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

function buildLinePath(values, width = 560, height = 180, padding = 20, sharedMax = null) {
  if (!values.length) return '';
  const max = sharedMax || Math.max(...values, 1);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  return values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value / max) * (height - padding * 2));
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
}

function LineChart({ series, labels, title }) {
  const width = 560;
  const height = 180;
  const allValues = series.flatMap((item) => item.values);
  const max = Math.max(...allValues, 1);
  const step = labels.length > 1 ? 520 / (labels.length - 1) : 0;

  return (
    <div className="chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <line x1="20" y1="160" x2="540" y2="160" className="chart-axis" />
        <line x1="20" y1="20" x2="20" y2="160" className="chart-axis" />
        {series.map((item) => (
          <g key={item.name}>
            <path
              d={buildLinePath(item.values, width, height, 20, max)}
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {item.values.map((value, index) => {
              const x = 20 + index * step;
              const y = 160 - ((value / max) * 140);
              return <circle key={`${item.name}-${index}`} cx={x} cy={y} r="4" fill={item.color} />;
            })}
          </g>
        ))}
        {labels.map((label, index) => (
          <text key={label} x={20 + index * step} y="176" textAnchor="middle" className="chart-label">{label}</text>
        ))}
      </svg>
      <div className="chart-legend">
        {series.map((item) => (
          <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>
        ))}
      </div>
    </div>
  );
}

function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [consumption, setConsumption] = useState([]);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const startDate = range === 'all'
          ? undefined
          : new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const params = startDate ? { startDate, endDate: new Date().toISOString().slice(0, 10) } : {};
        const [historyRes, analyticsRes, consumptionRes] = await Promise.all([
          api.get('/prediction-history', { params: { limit: 100 } }),
          api.get('/analytics/waste-dashboard', { params }),
          api.get('/consumption', { params })
        ]);
        if (active) {
          setHistory(historyRes.data?.data || []);
          setDashboard(analyticsRes.data?.data || null);
          setConsumption(consumptionRes.data?.data || []);
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Could not load operational overview.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [range]);

  const latest = history[0];
  const dailyConsumption = useMemo(() => {
    const totals = consumption.reduce((acc, row) => {
      if (!row.date) return acc;
      const key = new Date(row.date).toISOString().slice(0, 10);
      acc[key] = (acc[key] || 0) + numberValue(row.consumed);
      return acc;
    }, {});
    return Object.entries(totals).sort(([left], [right]) => left.localeCompare(right)).slice(-14);
  }, [consumption]);

  const demandTrend = useMemo(() => {
    const totals = history.reduce((acc, row) => {
      if (!row.date) return acc;
      const key = new Date(row.date).toISOString().slice(0, 10);
      if (!acc[key]) acc[key] = { predicted: 0, expected: 0 };
      acc[key].predicted += numberValue(row.predictedQuantity);
      acc[key].expected += numberValue(row.expectedPeople);
      return acc;
    }, {});
    return Object.entries(totals).sort(([left], [right]) => left.localeCompare(right)).slice(-14);
  }, [history]);

  const wasteTrend = dashboard?.dailyWasteTotals || [];
  const summary = dashboard?.summary;

  return (
    <div className="stack">
      <div className="page-head">
        <p className="eyebrow">Operations</p>
        <h1>Overview</h1>
        <p>Current kitchen demand, consumption, and waste status.</p>
      </div>

      <div className="range-actions" aria-label="Overview date range">
        {[['7', '7 days'], ['30', '30 days'], ['all', 'All time']].map(([value, label]) => (
          <button key={value} type="button" className={range === value ? 'range-button active' : 'range-button'} onClick={() => setRange(value)}>
            {label}
          </button>
        ))}
      </div>

      {loading && <Alert tone="info">Loading operational data...</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-chip"><p>Latest predicted demand</p><strong>{latest?.predictedQuantity ?? '-'}</strong></div>
            <div className="stat-chip"><p>Latest estimated waste</p><strong>{latest?.estimatedWaste ?? '-'}</strong></div>
            <div className="stat-chip"><p>Total consumed</p><strong>{summary?.totalConsumed ?? '-'}</strong></div>
            <div className="stat-chip"><p>Waste percentage</p><strong>{summary?.wastePercentage == null ? '-' : `${summary.wastePercentage}%`}</strong></div>
          </div>

          <div className="dashboard-visual-grid">
            <Card title="Daily consumption">
              {dailyConsumption.length ? (
                <LineChart
                  title="Daily consumed quantity"
                  labels={dailyConsumption.map(([date]) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}
                  series={[{ name: 'Consumed', values: dailyConsumption.map(([, value]) => value), color: '#27835B' }]}
                />
              ) : <div className="empty-state">No consumption records are available for this period.</div>}
            </Card>

            <Card title="Predicted vs expected demand">
              {demandTrend.length ? (
                <LineChart
                  title="Predicted and expected demand"
                  labels={demandTrend.map(([date]) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}
                  series={[
                    { name: 'Predicted', values: demandTrend.map(([, value]) => value.predicted), color: '#172B4D' },
                    { name: 'Expected', values: demandTrend.map(([, value]) => value.expected), color: '#B7791F' }
                  ]}
                />
              ) : <div className="empty-state">No prediction records are available for this period.</div>}
            </Card>
          </div>

          {wasteTrend.length ? (
            <Card title="Daily waste trend">
              <LineChart
                title="Daily food waste"
                labels={wasteTrend.slice(-14).map((row) => new Date(`${row._id.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}
                series={[{ name: 'Leftover', values: wasteTrend.slice(-14).map((row) => numberValue(row.totalLeftover)), color: '#C74747' }]}
              />
            </Card>
          ) : <Card title="Daily waste trend"><div className="empty-state">No waste records are available for this period.</div></Card>}

          {latest ? (
            <Card title="Latest prediction activity">
              <dl className="settings-grid">
                <div><dt>Date</dt><dd>{new Date(latest.date).toLocaleString()}</dd></div>
                <div><dt>Expected demand</dt><dd>{latest.expectedPeople}</dd></div>
                <div><dt>Predicted quantity</dt><dd>{latest.predictedQuantity}</dd></div>
                <div><dt>Surplus risk</dt><dd>{latest.surplusRisk ? 'High' : 'Low'}</dd></div>
              </dl>
            </Card>
          ) : <Card title="Latest prediction activity"><div className="empty-state">No prediction activity is available for this kitchen.</div></Card>}
        </>
      )}
    </div>
  );
}

export default DashboardPage;
