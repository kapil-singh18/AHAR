import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import SectionTabs from '../components/SectionTabs';
import StatChip from '../components/ui/StatChip';
import api from '../services/api';
import {
  topDemandDishes,
  wasteTrend
} from '../data/mockDataLayer';
import useStaticI18n from '../hooks/useStaticI18n';

const dashboardTabs = [
  { id: 'key', label: 'Key Analytics' },
  { id: 'range', label: 'Time Range Analytics' },
  { id: 'reports', label: 'Reports' }
];

const rangeFilters = ['1 Week', '1 Month', '1 Year', 'All Time'];
const KITCHEN_ID = 'kitchen-nyc-001';

function getLinePath(values, width = 560, height = 180, padding = 20) {
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((value / max) * (height - padding * 2));
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('key');
  const [activeRange, setActiveRange] = useState('1 Week');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { tx } = useStaticI18n();

  useEffect(() => {
    let isActive = true;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/prediction-history', {
          params: {
            kitchenId: KITCHEN_ID,
            limit: 200
          }
        });

        if (isActive) {
          setHistory(response.data?.data || []);
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.response?.data?.message || 'Could not load dashboard prediction history.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadHistory();
    return () => {
      isActive = false;
    };
  }, []);

  const computedKpis = useMemo(() => {
    if (!history.length) {
      return {
        totalPredictions: 0,
        totalWaste: 0,
        avgWaste: 0,
        efficiencyRate: 0,
        moneySaved: 0,
        platesSaved: 0
      };
    }

    const totalPredictions = history.length;
    const totalWaste = history.reduce((sum, item) => sum + Number(item.estimatedWaste || 0), 0);
    const totalExpected = history.reduce((sum, item) => sum + Number(item.expectedPeople || 0), 0);
    const totalPredicted = history.reduce((sum, item) => sum + Number(item.predictedQuantity || 0), 0);
    const avgWaste = Number((totalWaste / totalPredictions).toFixed(1));
    const efficiencyRate = totalPredicted > 0 ? Number(((totalExpected / totalPredicted) * 100).toFixed(1)) : 0;
    const platesSaved = Math.max(0, totalPredicted - totalWaste);
    const moneySaved = platesSaved * 50;

    return {
      totalPredictions,
      totalWaste,
      avgWaste,
      efficiencyRate,
      moneySaved,
      platesSaved
    };
  }, [history]);

  const latestPredictionSnapshot = useMemo(() => {
    if (!history.length) {
      return null;
    }

    const latest = history[0];
    return {
      date: latest.date,
      expectedPeople: latest.expectedPeople,
      predictedQuantity: latest.predictedQuantity,
      estimatedWaste: latest.estimatedWaste,
      dayOfWeek: latest.dayOfWeek,
      weather: latest.weather,
      eventMultiplier: latest.eventMultiplier,
      weatherMultiplier: latest.weatherMultiplier
    };
  }, [history]);

  const predictionHistory = useMemo(() => {
    return history.map((item) => {
      const efficiency = item.predictedQuantity > 0 ? Number(((item.expectedPeople / item.predictedQuantity) * 100).toFixed(1)) : 0;
      return {
        id: item.id,
        date: new Date(item.date).toLocaleString('en-IN'),
        expected: item.expectedPeople,
        predicted: item.predictedQuantity,
        waste: item.estimatedWaste,
        efficiency,
        risk: item.surplusRisk ? 'High' : 'Low',
        donation: item.donationRecommended ? 'Yes' : 'No'
      };
    });
  }, [history]);

  const dynamicWasteTrend = useMemo(() => {
    if (!history.length) {
      return [];
    }

    const grouped = history.reduce((accumulator, item) => {
      const label = new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!accumulator[label]) {
        accumulator[label] = {
          label,
          waste: 0,
          expected: 0,
          predicted: 0,
          donations: 0,
          runs: 0
        };
      }

      accumulator[label].waste += Number(item.estimatedWaste || 0);
      accumulator[label].expected += Number(item.expectedPeople || 0);
      accumulator[label].predicted += Number(item.predictedQuantity || 0);
      accumulator[label].donations += item.donationRecommended ? 1 : 0;
      accumulator[label].runs += 1;
      return accumulator;
    }, {});

    return Object.values(grouped)
      .sort((left, right) => new Date(`2026 ${left.label}`) - new Date(`2026 ${right.label}`))
      .slice(-7)
      .map((item) => ({
        label: item.label,
        waste: Number(item.waste.toFixed(1)),
        efficiency: item.predicted > 0 ? Number(((item.expected / item.predicted) * 100).toFixed(1)) : 0,
        donations: item.donations
      }));
  }, [history]);

  const wasteValues = (dynamicWasteTrend.length ? dynamicWasteTrend : wasteTrend).map((item) => item.waste);
  const efficiencyValues = (dynamicWasteTrend.length ? dynamicWasteTrend : wasteTrend).map((item) => item.efficiency);
  const wastePath = useMemo(() => getLinePath(wasteValues), [wasteValues]);
  const efficiencyPath = useMemo(() => getLinePath(efficiencyValues), [efficiencyValues]);

  const trendSource = dynamicWasteTrend.length ? dynamicWasteTrend : wasteTrend;

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Analytics SaaS"
        title="AHAR Dashboard"
        description="Track prediction performance, waste trends, and donation impact with a clean analytics workspace."
      />

      <SectionTabs tabs={dashboardTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {loading && <Alert tone="info">Loading dashboard data from prediction history...</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {activeTab === 'key' && (
        <>
          <div className="stats-grid">
            <StatChip label="Total Predictions Run" value={computedKpis.totalPredictions} />
            <StatChip label="Total Estimated Waste (plates)" value={<Badge tone="warning">{computedKpis.totalWaste}</Badge>} />
            <StatChip label="Avg Waste per Prediction" value={computedKpis.avgWaste} />
            <StatChip label="Overall Efficiency Rate (%)" value={<Badge tone="success">{computedKpis.efficiencyRate}%</Badge>} />
            <StatChip label="Money Saved (₹)" value={`₹${computedKpis.moneySaved.toLocaleString('en-IN')}`} />
            <StatChip label="Plates Saved" value={computedKpis.platesSaved} />
          </div>

          <div className="dashboard-visual-grid">
            <Card title="Waste Trend">
              <svg className="line-chart" viewBox="0 0 560 180" role="img" aria-label="Waste trend">
                <line x1="20" y1="160" x2="540" y2="160" className="chart-axis" />
                <line x1="20" y1="20" x2="20" y2="160" className="chart-axis" />
                <path d={wastePath} className="chart-line" />
                {trendSource.map((item, index) => {
                  const x = 20 + (index * (520 / (Math.max(trendSource.length - 1, 1)))) ;
                  const y = 160 - ((item.waste / Math.max(...wasteValues, 1)) * 140);
                  return (
                    <g key={item.label}>
                      <circle cx={x} cy={y} r="5" className="chart-point" />
                      <text x={x} y="176" textAnchor="middle" className="chart-label">{item.label}</text>
                    </g>
                  );
                })}
              </svg>
              <p className="chart-caption">Daily estimated waste from recent prediction sessions.</p>
            </Card>

            <Card title="Efficiency Progress">
              <svg className="line-chart" viewBox="0 0 560 180" role="img" aria-label="Efficiency progress">
                <line x1="20" y1="160" x2="540" y2="160" className="chart-axis" />
                <line x1="20" y1="20" x2="20" y2="160" className="chart-axis" />
                <path d={efficiencyPath} className="chart-line" />
                {trendSource.map((item, index) => {
                  const x = 20 + (index * (520 / (Math.max(trendSource.length - 1, 1)))) ;
                  const y = 160 - ((item.efficiency / Math.max(...efficiencyValues, 1)) * 140);
                  return (
                    <g key={`eff-${item.label}`}>
                      <circle cx={x} cy={y} r="5" className="chart-point" />
                      <text x={x} y="176" textAnchor="middle" className="chart-label">{item.label}</text>
                    </g>
                  );
                })}
              </svg>
              <p className="chart-caption">Efficiency percentage movement across the same time window.</p>
            </Card>
          </div>

          {latestPredictionSnapshot ? (
            <Card title="Latest Prediction Snapshot">
              <div className="stats-grid">
                <StatChip label="Date & Time" value={new Date(latestPredictionSnapshot.date).toLocaleString('en-IN')} />
                <StatChip label="Expected People" value={latestPredictionSnapshot.expectedPeople} />
                <StatChip label="Predicted Quantity" value={latestPredictionSnapshot.predictedQuantity} />
                <StatChip label="Estimated Waste" value={<Badge tone="warning">{latestPredictionSnapshot.estimatedWaste}</Badge>} />
                <StatChip label="Day of Week" value={latestPredictionSnapshot.dayOfWeek} />
                <StatChip label="Weather" value={latestPredictionSnapshot.weather} />
                <StatChip label="Event Multiplier" value={`${latestPredictionSnapshot.eventMultiplier}x`} />
                <StatChip label="Weather Multiplier" value={`${latestPredictionSnapshot.weatherMultiplier}x`} />
              </div>
            </Card>
          ) : (
            !loading && <Alert tone="info">No prediction history in the database yet. Run a prediction to populate dashboard analytics.</Alert>
          )}

          <Card title="Top 10 In-Demand Dishes (Current Consumption)">
            <div className="overflow-x-auto rounded-[1.25rem] border border-line/70">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-muted/70">
                    {['Rank', 'Dish Name', 'Current Consumption', 'Trend'].map((header) => (
                      <th key={header} className="whitespace-nowrap px-3 py-3 text-left font-semibold text-ink">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topDemandDishes.map((item, index) => (
                    <tr key={item.id} className="border-b border-line/70 bg-surface/80">
                      <td className="px-3 py-3 text-ink">#{index + 1}</td>
                      <td className="px-3 py-3 text-ink">{item.dish}</td>
                      <td className="px-3 py-3 text-ink">{item.currentConsumption} {item.unit}</td>
                      <td className="px-3 py-3"><Badge tone="success">{item.trend}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Prediction History">
            <div className="overflow-x-auto rounded-[1.25rem] border border-line/70">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-muted/70">
                    {['Date', 'Expected', 'Predicted', 'Waste', 'Efficiency', 'Risk', 'Donation'].map((header) => (
                      <th key={header} className="whitespace-nowrap px-3 py-3 text-left font-semibold text-ink">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {predictionHistory.map((item) => (
                    <tr key={item.id} className="border-b border-line/70 bg-surface/80">
                      <td className="px-3 py-3 text-ink">{item.date}</td>
                      <td className="px-3 py-3 text-ink">{item.expected}</td>
                      <td className="px-3 py-3 text-ink">{item.predicted}</td>
                      <td className="px-3 py-3"><Badge tone="warning">{item.waste}</Badge></td>
                      <td className="px-3 py-3"><Badge tone="success">{item.efficiency}%</Badge></td>
                      <td className="px-3 py-3"><Badge tone={item.risk === 'High' ? 'danger' : 'success'}>{item.risk}</Badge></td>
                      <td className="px-3 py-3"><Badge tone={item.donation === 'Yes' ? 'success' : 'neutral'}>{item.donation}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'range' && (
        <>
          <Card toned title="Time Range Filter">
            <div className="flex flex-wrap gap-3">
              {rangeFilters.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setActiveRange(range)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeRange === range
                      ? 'border-transparent bg-gradient-to-r from-brand-red to-brand-orange text-white'
                      : 'border-line bg-surface text-ink-muted hover:text-ink'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </Card>

          <div className="stats-grid">
            <StatChip label={`${activeRange} Waste`} value={<Badge tone="warning">{computedKpis.totalWaste}</Badge>} />
            <StatChip label={`${activeRange} Efficiency`} value={<Badge tone="success">{computedKpis.efficiencyRate}%</Badge>} />
            <StatChip label={`${activeRange} Donations`} value={trendSource.reduce((sum, item) => sum + item.donations, 0)} />
            <StatChip label={`${activeRange} Savings`} value={`₹${computedKpis.moneySaved.toLocaleString('en-IN')}`} />
          </div>

          <div className="dashboard-visual-grid">
            <Card title="Waste vs Efficiency Over Time">
              <svg className="line-chart" viewBox="0 0 560 180" role="img" aria-label="Waste and efficiency over time">
                <line x1="20" y1="160" x2="540" y2="160" className="chart-axis" />
                <line x1="20" y1="20" x2="20" y2="160" className="chart-axis" />
                <path d={wastePath} className="chart-line" />
                <path d={efficiencyPath} className="chart-line" style={{ opacity: 0.65 }} />
              </svg>
            </Card>
            <Card title="Donations Recommended">
              <div className="bar-chart">
                {trendSource.map((item) => (
                  <div className="bar-item" key={`don-${item.label}`}>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${Math.max(10, item.donations * 28)}%` }} />
                    </div>
                    <p className="bar-value">{item.donations}</p>
                    <p className="bar-label">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { title: 'Download Weekly Report (PDF)', description: 'Complete weekly waste, prediction, and donation summary.' },
              { title: 'Download Monthly Report (PDF)', description: 'Month-wise trend lines and operational recommendations.' },
              { title: 'Download Custom CSV', description: 'Raw dataset export for BI and audit workflows.' }
            ].map((report) => (
              <Card key={report.title} title={report.title}>
                <p className="text-sm leading-7 text-ink-muted">{report.description}</p>
                <Button className="mt-4" type="button"><Download size={16} />Download</Button>
              </Card>
            ))}
          </div>

          <Card toned title="Generate Report">
            <div className="form-grid">
              <Field label="Start Date" htmlFor="report-start">
                <input id="report-start" type="date" />
              </Field>
              <Field label="End Date" htmlFor="report-end">
                <input id="report-end" type="date" />
              </Field>
            </div>
            <div className="mt-4 flex gap-3">
              <Button type="button"><FileText size={16} />{tx('generateReport', 'Generate Report')}</Button>
              <Button type="button" variant="secondary">Schedule Monthly Email</Button>
            </div>
            <Alert tone="info" ariaLive="polite">Reports in this UI are mock downloads for now and can be connected to backend export endpoints later.</Alert>
          </Card>
        </>
      )}
    </div>
  );
}

export default DashboardPage;