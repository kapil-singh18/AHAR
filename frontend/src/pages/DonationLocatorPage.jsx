import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

function DonationLocatorPage() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/donations/ngos')
      .then((response) => { if (active) setNgos(response.data?.data || []); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load donation partners.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="stack">
      <div className="page-head"><p className="eyebrow">Redistribution</p><h1>Surpluses & Donations</h1><p>Actual surplus partners and records available to the active kitchen.</p></div>
      {error && <Alert tone="error">{error}</Alert>}
      <Card title="Donation partners">
        {loading ? <div className="empty-state">Loading partners...</div> : ngos.length ? (
          <div className="table-shell"><table className="data-table"><thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>Pickup</th></tr></thead><tbody>
            {ngos.map((ngo) => <tr key={ngo._id}><td>{ngo.name}</td><td>{ngo.phone}</td><td>{ngo.address}</td><td><Badge tone={ngo.pickupAvailable ? 'success' : 'neutral'}>{ngo.pickupAvailable ? 'Available' : 'Unavailable'}</Badge></td></tr>)}
          </tbody></table></div>
        ) : <div className="empty-state">No donation partners are recorded for this kitchen.</div>}
      </Card>
      <Card title="Donation history"><div className="empty-state">No donation-history workflow is implemented by the backend yet.</div></Card>
    </div>
  );
}

export default DonationLocatorPage;
