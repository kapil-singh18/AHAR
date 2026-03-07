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

  const [wasteForm, setWasteForm] = useState({
    kitchenId: 'kitchen-nyc-001',
    occupancyRate: 0.85,
    temperatureC: 28,
    prevDayMeals: 140,
    prev7DayAvgMeals: 132,
    mealsPrepared: 150,
    weather: 'rain',
    menuType: 'standard_veg',
    facilityType: 'hostel'
  });
  const [wasteResult, setWasteResult] = useState(null);
  const [wasteError, setWasteError] = useState('');
  const [dailySavings, setDailySavings] = useState(null);
  const [dailySavingsError, setDailySavingsError] = useState('');

  const loadDailySavings = async (kitchenId) => {
    try {
      const res = await api.get('/analytics/daily-savings', {
        params: { kitchenId }
      });
      setDailySavings(res.data?.data || null);
      setDailySavingsError('');
    } catch (err) {
      setDailySavingsError(err.response?.data?.message || 'Failed to load daily savings');
    }
  };

  useEffect(() => {
    loadDailySavings(form.kitchenId);
  }, [form.kitchenId]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitPrediction = async (e) => {
    e.preventDefault();
    setError('');

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

  const onWasteChange = (e) => {
    setWasteForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitWastePrediction = async (e) => {
    e.preventDefault();
    setWasteError('');
    setWasteResult(null);

    try {
      const payload = {
        kitchenId: wasteForm.kitchenId,
        occupancyRate: Number(wasteForm.occupancyRate),
        temperatureC: Number(wasteForm.temperatureC),
        prevDayMeals: Number(wasteForm.prevDayMeals),
        prev7DayAvgMeals: Number(wasteForm.prev7DayAvgMeals),
        mealsPrepared: Number(wasteForm.mealsPrepared),
        weather: wasteForm.weather,
        menuType: wasteForm.menuType,
        facilityType: wasteForm.facilityType
      };

      const res = await api.post('/predict-waste', payload);
      setWasteResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setWasteError('Waste prediction endpoint is missing on the deployed backend. Redeploy backend with POST /api/predict-waste.');
      } else {
        setWasteError(err.response?.data?.message || 'Waste prediction failed');
      }
    }
  };

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Forecast Mission"
        title="Demand Prediction Dashboard"
        description="Estimate demand before prep begins so your kitchen can reduce overproduction and redirect surplus responsibly."
      />

      <Card title="Today Financial Impact">
        <div className="stats-grid">
          <StatChip label="Money saved today" value={dailySavings ? dailySavings.moneySaved : 0} />
          <StatChip label="Baseline waste cost" value={dailySavings ? dailySavings.baselineWasteCost : 0} />
          <StatChip label="Actual waste cost" value={dailySavings ? dailySavings.actualWasteCost : 0} />
        </div>
      </Card>
      {dailySavingsError && <Alert tone="error" ariaLive="assertive">{dailySavingsError}</Alert>}

      <Card toned title="Prediction Inputs">
        <form className="form-grid" onSubmit={submitPrediction}>
          <Field label="Kitchen ID" htmlFor="kitchen-id">
            <input id="kitchen-id" name="kitchenId" value={form.kitchenId} onChange={onChange} placeholder="Kitchen ID" />
          </Field>
          <Field label="Past consumption (CSV)" htmlFor="past-consumption">
            <input id="past-consumption" name="pastConsumption" value={form.pastConsumption} onChange={onChange} placeholder="Past consumption CSV" />
          </Field>
          <Field label="Day of week" htmlFor="day-of-week">
            <input id="day-of-week" name="dayOfWeek" value={form.dayOfWeek} onChange={onChange} placeholder="Day of Week" />
          </Field>
          <Field label="Expected people" htmlFor="expected-people">
            <input id="expected-people" name="expectedPeople" value={form.expectedPeople} onChange={onChange} placeholder="Expected People" type="number" />
          </Field>
          <Field label="Events (CSV)" htmlFor="events">
            <input id="events" name="events" value={form.events} onChange={onChange} placeholder="Events CSV" />
          </Field>
          <Field label="Weather" htmlFor="weather">
            <input id="weather" name="weather" value={form.weather} onChange={onChange} placeholder="Weather" />
          </Field>
          <div className="form-action">
            <Button id="predict-submit" type="submit">Predict Demand</Button>
          </div>
        </form>
      </Card>

      {error && <Alert tone="error" ariaLive="assertive">{error}</Alert>}

      {result && (
        <Card title="Prediction Result">
          <div className="stats-grid">
            <StatChip label="Predicted quantity" value={result.predictedQuantity} />
            <StatChip
              label="Surplus risk"
              value={result.surplusRisk ? <Badge tone="warning">High risk</Badge> : <Badge tone="success">Controlled</Badge>}
            />
            <StatChip
              label="Donation route"
              value={result.donationRecommended ? <Badge tone="success">Recommended</Badge> : <Badge tone="neutral">Not needed</Badge>}
            />
          </div>
        </Card>
      )}

      <Card toned title="Food Waste Prediction (ML)">
        <form className="form-grid" onSubmit={submitWastePrediction}>
          <Field label="Kitchen ID" htmlFor="waste-kitchen-id">
            <input id="waste-kitchen-id" name="kitchenId" value={wasteForm.kitchenId} onChange={onWasteChange} placeholder="Kitchen ID" />
          </Field>
          <Field label="Occupancy rate (0..1)" htmlFor="waste-occ">
            <input id="waste-occ" name="occupancyRate" type="number" step="0.01" value={wasteForm.occupancyRate} onChange={onWasteChange} />
          </Field>
          <Field label="Temperature (°C)" htmlFor="waste-temp">
            <input id="waste-temp" name="temperatureC" type="number" step="0.1" value={wasteForm.temperatureC} onChange={onWasteChange} />
          </Field>
          <Field label="Prev day meals" htmlFor="waste-prev">
            <input id="waste-prev" name="prevDayMeals" type="number" value={wasteForm.prevDayMeals} onChange={onWasteChange} />
          </Field>
          <Field label="Prev 7-day avg meals" htmlFor="waste-avg7">
            <input id="waste-avg7" name="prev7DayAvgMeals" type="number" step="0.1" value={wasteForm.prev7DayAvgMeals} onChange={onWasteChange} />
          </Field>
          <Field label="Meals prepared" htmlFor="waste-prepared">
            <input id="waste-prepared" name="mealsPrepared" type="number" value={wasteForm.mealsPrepared} onChange={onWasteChange} />
          </Field>
          <Field label="Weather" htmlFor="waste-weather">
            <input id="waste-weather" name="weather" value={wasteForm.weather} onChange={onWasteChange} placeholder="clear / cold / hot / humid / rain" />
          </Field>
          <Field label="Menu type" htmlFor="waste-menuType">
            <input id="waste-menuType" name="menuType" value={wasteForm.menuType} onChange={onWasteChange} placeholder="standard_veg / standard_nonveg / ..." />
          </Field>
          <Field label="Facility type" htmlFor="waste-facilityType">
            <input id="waste-facilityType" name="facilityType" value={wasteForm.facilityType} onChange={onWasteChange} placeholder="hostel / ..." />
          </Field>
          <div className="form-action">
            <Button type="submit">Predict Waste</Button>
          </div>
        </form>
      </Card>

      {wasteError && <Alert tone="error" ariaLive="assertive">{wasteError}</Alert>}

      {wasteResult && (
        <Card title="Waste Prediction Result">
          <div className="stats-grid">
            <StatChip label="Predicted waste" value={wasteResult.predictedWaste} />
            <StatChip label="Unit" value={wasteResult.unit || 'unknown'} />
            <StatChip label="ML columns" value={(wasteResult.ml?.inputColumns || []).length} />
          </div>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
