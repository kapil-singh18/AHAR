import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('30');

  const getPeriod = () => {
    if (range === 'all') return {};
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - Number(range) * 24 * 60 * 60 * 1000);
    return {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10)
    };
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = getPeriod();
    Promise.all([
      api.get('/analytics/waste-dashboard', { params }),
      api.get('/analytics/weekly-report', { params })
    ])
      .then(([dashboardRes, reportRes]) => {
        if (active) {
          setDashboardData(dashboardRes.data?.data || null);
          setReportData(reportRes.data?.data || null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load analytics.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  return (
    <div className="stack">
      <div className="page-head"><p className="eyebrow">Impact</p><h1>Analytics</h1><p>Actual waste and sustainability data recorded by the kitchen.</p></div>
      <div className="range-actions" aria-label="Analytics date range">
        {[['7', '7 days'], ['30', '30 days'], ['all', 'All time']].map(([value, label]) => (
          <button key={value} type="button" className={range === value ? 'range-button active' : 'range-button'} onClick={() => setRange(value)}>{label}</button>
        ))}
      </div>
      {loading && <Alert tone="info">Loading analytics...</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {reportData && <Card title="Weekly sustainability report"><div className="stats-grid">
        <div className="stat-chip"><p>Total waste</p><strong>{reportData.totalWaste ?? '-'}</strong></div>
        <div className="stat-chip"><p>Waste reduction</p><strong>{reportData.wasteReductionPercent ?? '-'}%</strong></div>
        <div className="stat-chip"><p>Total consumed</p><strong>{reportData.totalConsumed ?? '-'}</strong></div>
        <div className="stat-chip"><p>Utilization</p><strong>{reportData.utilizationPercentage == null ? '-' : `${reportData.utilizationPercentage}%`}</strong></div>
        <div className="stat-chip"><p>Waste percentage</p><strong>{reportData.wastePercentage == null ? '-' : `${reportData.wastePercentage}%`}</strong></div>
        <div className="stat-chip"><p>Average daily consumption</p><strong>{reportData.averageDailyConsumption ?? '-'}</strong></div>
      </div></Card>}
      {dashboardData && <Card title="Dish-level waste">
        {(dashboardData.dishWiseWaste || []).length ? <div className="table-shell"><table className="data-table"><thead><tr><th>Dish</th><th>Leftover</th></tr></thead><tbody>
          {dashboardData.dishWiseWaste.map((row) => <tr key={row._id || row.dishName}><td>{row.dishName || 'Unknown dish'}</td><td><Badge tone="warning">{row.totalLeftover}</Badge></td></tr>)}
        </tbody></table></div> : <div className="empty-state">No dish-level waste records found.</div>}
      </Card>}
    </div>
  );
}

export default AnalyticsPage;
