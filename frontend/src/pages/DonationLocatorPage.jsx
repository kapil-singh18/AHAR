import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../services/api';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';
import PageHeader from '../components/ui/PageHeader';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [map, position]);

  return null;
}

function DonationLocatorPage() {
  const [kitchenId, setKitchenId] = useState('kitchen-nyc-001');
  const [radiusKm, setRadiusKm] = useState(10);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [resultMode, setResultMode] = useState('nearby');
  const [status, setStatus] = useState('Waiting for location...');
  const [error, setError] = useState('');

  const mapCenter = useMemo(() => currentPosition || [40.7128, -74.006], [currentPosition]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPosition(coords);
        setStatus(`Live location updated: ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`);
      },
      () => {
        setError('Location access denied or unavailable.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const fetchNearbyNgos = async () => {
      try {
        if (currentPosition) {
          const [lat, lng] = currentPosition;
          const response = await api.get('/donations/nearby-ngos', {
            params: { lat, lng, radiusKm, kitchenId }
          });
          const nearby = response.data.data.ngos || [];

          if (nearby.length > 0) {
            setNgos(nearby);
            setResultMode('nearby');
            return;
          }
        }

        const allResponse = await api.get('/donations/ngos', { params: { kitchenId } });
        const allNgos = allResponse.data.data || [];
        setNgos(allNgos);
        setResultMode('all');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load nearby NGOs');
      }
    };

    fetchNearbyNgos();
    const interval = setInterval(fetchNearbyNgos, 15000);

    return () => clearInterval(interval);
  }, [currentPosition, radiusKm, kitchenId]);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Redistribution Network"
        title="Nearest NGO Locator"
        description="Route safe surplus to nearby community partners in real time and keep edible food in circulation."
      />
      <Card toned title="Search Radius">
        <div className="form-grid">
          <Field label="Kitchen ID" htmlFor="donation-kitchen-id">
            <input id="donation-kitchen-id" value={kitchenId} onChange={(e) => setKitchenId(e.target.value)} placeholder="Kitchen ID" />
          </Field>
          <Field label="Radius (km)" htmlFor="radius-km">
            <input
              id="radius-km"
              type="number"
              min="1"
              max="100"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value) || 10)}
              placeholder="Radius (km)"
            />
          </Field>
        </div>
      </Card>

      <Card title="Live Location Status">
        <Alert tone="info">{status}</Alert>
        {error && <Alert tone="error" ariaLive="assertive">{error}</Alert>}
        {!error && resultMode === 'all' && (
          <Alert tone="info">
            No NGO found inside current radius from your live location. Showing all NGOs for this Kitchen ID.
          </Alert>
        )}
      </Card>

      <Card title="Map View">
        <div className="map-wrap">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="ngo-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {currentPosition && (
              <Marker position={currentPosition}>
                <Popup>Your live location</Popup>
              </Marker>
            )}

            {ngos.map((ngo) => (
              <Marker
                key={ngo._id}
                position={[ngo.location.coordinates[1], ngo.location.coordinates[0]]}
              >
                <Popup>
                  <strong>{ngo.name}</strong>
                  <br />
                  {ngo.address}
                  <br />
                  {typeof ngo.distanceKm === 'number' && (
                    <>
                      Distance: {ngo.distanceKm} km
                      <br />
                    </>
                  )}
                  Phone: {ngo.phone}
                  <br />
                  Hours: {ngo.operatingHours}
                </Popup>
              </Marker>
            ))}

            <RecenterMap position={currentPosition} />
          </MapContainer>
        </div>
      </Card>

      <Card title="Nearby NGOs">
        {ngos.length === 0 && <p className="empty-state">No NGOs found in the selected radius.</p>}
        {ngos.map((ngo) => (
          <div className="row" key={ngo._id}>
            <strong>{ngo.name}</strong>
            <span>{ngo.phone}</span>
            {typeof ngo.distanceKm === 'number' ? (
              <Badge tone="success">{ngo.distanceKm} km away</Badge>
            ) : (
              <Badge tone="neutral">Outside current radius</Badge>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

export default DonationLocatorPage;
