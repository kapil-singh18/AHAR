import React, { useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import StatChip from '../components/ui/StatChip';

function AnalyticsPage() {
  const [kitchenId, setKitchenId] = useState('kitchen-nyc-001');
  const [dashboardData, setDashboardData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const [dashboardRes, reportRes] = await Promise.all([
        api.get('/analytics/waste-dashboard', { params: { kitchenId } }),
        api.get('/analytics/weekly-report', { params: { kitchenId } })
      ]);
      setDashboardData(dashboardRes.data.data);
      setReportData(reportRes.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Impact Evidence"
        title="Waste Analytics"
        description="Turn daily kitchen data into sustainability insights to guide smarter planning and lower carbon-heavy waste."
      />
      <Card toned title="Load Kitchen Analytics">
        <div className="form-grid">
          <Field label="Kitchen ID" htmlFor="analytics-kitchen-id">
            <input value={kitchenId} onChange={(e) => setKitchenId(e.target.value)} placeholder="Kitchen ID" id="analytics-kitchen-id" />
          </Field>
          <div className="form-action">
            <Button id="load-analytics" type="button" onClick={loadAnalytics} disabled={loading}>{loading ? 'Loading...' : 'Load Analytics'}</Button>
          </div>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}

      {reportData && (
        <Card title="Weekly Sustainability Report">
          <div className="stats-grid">
            <StatChip label="Total waste" value={<Badge tone="warning">{reportData.totalWaste ?? 0}</Badge>} />
            <StatChip label="Waste reduction %" value={`${reportData.wasteReductionPercent ?? 0}%`} />
            <StatChip label="Estimated savings" value={`₹${Number(reportData.estimatedSavings ?? 0).toLocaleString('en-IN')}`} />
            <StatChip label="Kitchen ID" value={kitchenId} />
          </div>
        </Card>
      )}

      {dashboardData && (
        <Card title="Dish-wise Waste">
          {(dashboardData.dishWiseWaste || []).length === 0 && <p className="empty-state">No dish-level waste records found yet.</p>}
          {(dashboardData.dishWiseWaste || []).map((row) => (
            <div className="row" key={row._id}>
              <strong>{row.dishName || 'Unknown Dish'}</strong>
              <span>Leftover: {row.totalLeftover}</span>
              <Badge tone="warning">Track Closely</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default AnalyticsPage;
