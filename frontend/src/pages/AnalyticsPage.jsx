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

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/analytics/waste-dashboard'), api.get('/analytics/weekly-report')])
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
  }, []);

  return (
    <div className="stack">
      <div className="page-head"><p className="eyebrow">Impact</p><h1>Analytics</h1><p>Actual waste and sustainability data recorded by the kitchen.</p></div>
      {loading && <Alert tone="info">Loading analytics...</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {reportData && <Card title="Weekly sustainability report"><div className="stats-grid">
        <div className="stat-chip"><p>Total waste</p><strong>{reportData.totalWaste ?? '-'}</strong></div>
        <div className="stat-chip"><p>Waste reduction</p><strong>{reportData.wasteReductionPercent ?? '-'}%</strong></div>
        <div className="stat-chip"><p>Estimated savings</p><strong>{reportData.estimatedSavings ?? '-'}</strong></div>
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
