import 'leaflet/dist/leaflet.css';
import React, { useMemo, useState } from 'react';
import { LocateFixed, MapPinned, PhoneCall } from 'lucide-react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';
import SectionTabs from '../components/SectionTabs';
import { donationHistory, nearestNgos } from '../data/mockDataLayer';

const donationTabs = [
  { id: 'nearest', label: 'Nearest NGOs' },
  { id: 'history', label: 'History' },
  { id: 'map', label: 'Map (Optional)' }
];

const ngoIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41]
});

function DonationLocatorPage() {
  const [activeTab, setActiveTab] = useState('nearest');
  const [radius, setRadius] = useState(6);
  const [sortBy, setSortBy] = useState('distance');

  const filteredNgos = useMemo(() => {
    const list = nearestNgos.filter((ngo) => ngo.distanceKm <= radius);
    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [radius, sortBy]);

  const mapCenter = useMemo(() => {
    if (!filteredNgos.length) {
      return [19.076, 72.8777];
    }

    const lat = filteredNgos.reduce((sum, ngo) => sum + ngo.lat, 0) / filteredNgos.length;
    const lng = filteredNgos.reduce((sum, ngo) => sum + ngo.lng, 0) / filteredNgos.length;
    return [lat, lng];
  }, [filteredNgos]);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Redistribution"
        title="Donation Locator"
        description="Connect surplus food with nearby NGO partners, track pickup history, and view map-ready locations."
      />

      <SectionTabs tabs={donationTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'nearest' && (
        <>
          <Card title="Filter & Sort NGOs">
            <div className="form-grid md:grid-cols-2">
              <Field label="Maximum Distance (km)" htmlFor="ngo-radius">
                <input
                  id="ngo-radius"
                  type="range"
                  min="1"
                  max="10"
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                />
              </Field>
              <Field label="Sort By" htmlFor="ngo-sort">
                <select id="ngo-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="distance">Distance</option>
                  <option value="name">Name</option>
                </select>
              </Field>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNgos.map((ngo) => (
              <Card key={ngo.id} className="overflow-hidden">
                <img src={ngo.imageUrl} alt={ngo.name} className="h-44 w-full rounded-[1.2rem] object-cover" />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-ink">{ngo.name}</h3>
                  <Badge tone="success">{ngo.distanceKm} km</Badge>
                </div>
                <p className="mt-2 text-sm leading-7 text-ink-muted">{ngo.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
                  <PhoneCall size={14} />
                  <span>{ngo.contact}</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button type="button">Donate Food</Button>
                  <Button type="button" variant="secondary">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <Card title="Donation History">
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  {['Date', 'NGO', 'Food Type', 'Quantity', 'Status'].map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donationHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.date}</td>
                    <td>{entry.ngo}</td>
                    <td>{entry.foodType}</td>
                    <td>{entry.quantity}</td>
                    <td><Badge tone={entry.status === 'Delivered' ? 'success' : 'warning'}>{entry.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'map' && (
        <Card toned title="Map View (Optional)">
          <div className="rounded-[1.5rem] border border-line/70 bg-surface/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-ink-muted">
              <MapPinned size={16} />
              Nearest NGOs Map
            </div>
            <p className="mt-3 text-sm leading-7 text-ink-muted">Interactive map showing nearest NGOs within your current radius filter.</p>
            <div className="mt-4 h-[440px] overflow-hidden rounded-[1.2rem] border border-line/70">
              <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredNgos.map((ngo) => (
                  <Marker key={ngo.id} position={[ngo.lat, ngo.lng]} icon={ngoIcon}>
                    <Popup>
                      <div className="min-w-[180px] text-sm">
                        <p className="font-semibold text-ink">{ngo.name}</p>
                        <p className="mt-1 text-ink-muted">{ngo.description}</p>
                        <p className="mt-2 text-ink">Distance: {ngo.distanceKm} km</p>
                        <p className="mt-1 text-ink-muted">Contact: {ngo.contact}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="mt-4 grid gap-2">
              {filteredNgos.map((ngo) => (
                <div key={`map-list-${ngo.id}`} className="flex items-center justify-between rounded-[1rem] border border-line/70 bg-surface-muted/70 px-4 py-2 text-sm">
                  <p className="font-medium text-ink">{ngo.name}</p>
                  <div className="flex items-center gap-2 text-ink-muted"><LocateFixed size={14} />{ngo.distanceKm} km</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default DonationLocatorPage;