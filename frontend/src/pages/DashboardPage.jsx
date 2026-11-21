import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [historyRes, analyticsRes] = await Promise.all([
          api.get('/prediction-history', { params: { limit: 100 } }),
          api.get('/analytics/waste-dashboard')
        ]);
        if (active) {
          setHistory(historyRes.data?.data || []);
          setDashboard(analyticsRes.data?.data || null);
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || 'Could not load operational overview.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const latest = history[0];
  return (
    <div className="stack">
      <div className="page-head"><p className="eyebrow">Operations</p><h1>Overview</h1><p>Current kitchen demand, consumption, and waste status.</p></div>
      {loading && <Alert tone="info">Loading operational data...</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-chip"><p>Latest predicted demand</p><strong>{latest?.predictedQuantity ?? '-'}</strong></div>
            <div className="stat-chip"><p>Latest estimated waste</p><strong>{latest?.estimatedWaste ?? '-'}</strong></div>
            <div className="stat-chip"><p>Prediction runs</p><strong>{history.length}</strong></div>
            <div className="stat-chip"><p>Donation recommended</p><strong>{latest ? (latest.donationRecommended ? 'Yes' : 'No') : '-'}</strong></div>
          </div>
          {latest ? (
            <Card title="Latest prediction activity">
              <dl className="settings-grid">
                <div><dt>Date</dt><dd>{new Date(latest.date).toLocaleString()}</dd></div>
                <div><dt>Expected demand</dt><dd>{latest.expectedPeople}</dd></div>
                <div><dt>Predicted quantity</dt><dd>{latest.predictedQuantity}</dd></div>
                <div><dt>Surplus risk</dt><dd>{latest.surplusRisk ? 'High' : 'Low'}</dd></div>
              </dl>
            </Card>
          ) : (
            <div className="empty-state">No prediction activity is available for this kitchen.</div>
          )}
          {dashboard ? (
            <Card title="Dish-level waste">
              {(dashboard.dishWiseWaste || []).length ? (
                <div className="table-shell"><table className="data-table"><thead><tr><th>Dish</th><th>Total leftover</th></tr></thead><tbody>
                  {dashboard.dishWiseWaste.map((row) => <tr key={row._id || row.dishName}><td>{row.dishName || 'Unknown dish'}</td><td><Badge tone="warning">{row.totalLeftover}</Badge></td></tr>)}
                </tbody></table></div>
              ) : <div className="empty-state">No dish-level waste records are available.</div>}
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

export default DashboardPage;
