const EventAdjustment = require('../models/EventAdjustment');
const Dish = require('../models/Dish');
const axios = require('axios');
const PredictionLog = require('../models/PredictionLog');

const calculateBaseDemand = (pastConsumption, expectedPeople) => {
  const avgPast = pastConsumption.reduce((sum, v) => sum + v, 0) / pastConsumption.length;
  return (avgPast * 0.7) + (expectedPeople * 0.3);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeWeatherForDemandModel = (weather = '') => {
  const value = String(weather).toLowerCase();
  if (value.includes('storm')) return 'storm';
  if (value.includes('rain')) return 'rainy';
  if (value.includes('sun')) return 'sunny';
  return 'cloudy';
};

const deriveEventEffect = (events = []) => {
  if (!Array.isArray(events) || !events.length) return 'none';
  const lowered = events.map((e) => String(e).toLowerCase());
  if (lowered.some((e) => e.includes('festival') || e.includes('event') || e.includes('holiday'))) {
    return 'increase';
  }
  return 'none';
};

const deriveEventSize = (events = [], expectedPeople = 0) => {
  if (!Array.isArray(events) || !events.length) return 'none';
  if (expectedPeople >= 180) return 'large';
  if (expectedPeople >= 120) return 'medium';
  return 'small';
};

const logPredictionEvent = (level, payload) => {
  const logLine = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  if (level === 'error') {
    console.error(logLine);
    return;
  }
  console.info(logLine);
};

const predictWaste = async (req, res, next) => {
  try {
    const {
      kitchenId,
      occupancyRate,
      temperatureC,
      prevDayMeals,
      prev7DayAvgMeals,
      mealsPrepared,
      weather,
      menuType,
      facilityType
    } = req.body;

    const modelUrl = process.env.ML_WASTE_URL || process.env.ML_DEMAND_URL || 'http://localhost:5001/predict';

    const features = {
      occupancy_rate: Number(occupancyRate),
      temperature_c: Number(temperatureC),
      prev_day_meals: Number(prevDayMeals),
      prev_7day_avg_meals: Number(prev7DayAvgMeals),
      meals_prepared: Number(mealsPrepared),
      weather: String(weather),
      menu_type: String(menuType),
      facility_type: String(facilityType),
      kitchen_id: String(kitchenId)
    };

    try {
      const { data } = await axios.post(
        modelUrl,
        { features },
        { timeout: Number(process.env.ML_TIMEOUT_MS) || 5000 }
      );

      const prediction = data?.prediction;
      if (prediction === undefined || prediction === null || Number.isNaN(Number(prediction))) {
        return res.status(502).json({
          success: false,
          message: 'ML service returned an invalid prediction',
          ml: data
        });
      }

      return res.status(200).json({
        predictedWaste: Number(prediction),
        unit: 'unknown',
        ml: {
          provider: 'ml-service',
          url: modelUrl,
          inputColumns: data?.input_columns || []
        }
      });
    } catch (mlError) {
      const mealsPreparedNum = Number(mealsPrepared);
      const occupancyNum = clamp(Number(occupancyRate), 0, 1);
      const baselineMeals = Number(prev7DayAvgMeals) || Number(prevDayMeals) || mealsPreparedNum;
      const expectedMeals = baselineMeals * occupancyNum;
      const estimatedWaste = Math.max(0, mealsPreparedNum - expectedMeals);

      return res.status(200).json({
        predictedWaste: Number(estimatedWaste.toFixed(2)),
        unit: 'meals',
        ml: {
          provider: 'fallback',
          reason: mlError.message,
          url: modelUrl
        }
      });
    }
  } catch (error) {
    return next(error);
  }
};

const predictDemand = async (req, res, next) => {
  const startedAt = Date.now();
  let inferenceStatus = 'unknown';
  try {
    const {
      kitchenId,
      pastConsumption = [],
      dayOfWeek,
      expectedPeople,
      events = [],
      weather,
      date,
      mealSlot,
      lastDayCustomers,
      last7DayAvg,
      temperature,
      weatherCondition,
      holiday,
      eventEffect,
      eventSize
    } = req.body;

    const numericPastConsumption = Array.isArray(pastConsumption)
      ? pastConsumption.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value))
      : [];

    const derivedExpectedPeople = Number(expectedPeople)
      || Math.round(Number(last7DayAvg) || numericPastConsumption[0] || numericPastConsumption[numericPastConsumption.length - 1] || 0);

    const fallbackPastConsumption = numericPastConsumption.length
      ? numericPastConsumption
      : [
        Number(last7DayAvg) || derivedExpectedPeople || 0,
        Number(lastDayCustomers) || derivedExpectedPeople || 0,
        derivedExpectedPeople || 0
      ];

    const eventRecords = await EventAdjustment.find({
      kitchenId,
      $or: [
        { name: { $in: events } },
        { holidayFlag: true }
      ]
    });

    const eventMultiplier = eventRecords.length
      ? eventRecords.reduce((acc, event) => acc * event.specialDemandMultiplier, 1)
      : 1;

    const weatherMultiplier = weather && weather.toLowerCase().includes('rain') ? 1.05 : 1;

    const demandModelUrl = process.env.ML_DEMAND_URL || 'http://localhost:5001/predict-demand';
    let predictedQuantity;
    let mlMeta;
    inferenceStatus = 'ml-service';

    try {
      const isWeekend = ['saturday', 'sunday'].includes(String(dayOfWeek || '').toLowerCase());
      const resolvedLastDayCustomers = Number(lastDayCustomers)
        || fallbackPastConsumption[fallbackPastConsumption.length - 1]
        || derivedExpectedPeople
        || 0;
      const resolvedLast7DayAvg = Number(last7DayAvg)
        || (fallbackPastConsumption.length
          ? fallbackPastConsumption.reduce((sum, value) => sum + Number(value || 0), 0) / fallbackPastConsumption.length
          : derivedExpectedPeople || 0);

      const demandFeatures = {
        date: date || new Date().toISOString().slice(0, 10),
        meal_slot: String(mealSlot || 'lunch').toLowerCase(),
        is_weekend: isWeekend,
        holiday: typeof holiday === 'boolean'
          ? holiday
          : Array.isArray(events) && events.some((e) => String(e).toLowerCase().includes('holiday')),
        special_event_effect: String(eventEffect || deriveEventEffect(events)).toLowerCase(),
        event_size: String(eventSize || deriveEventSize(events, derivedExpectedPeople || 0)).toLowerCase(),
        last_day_customers: Math.round(resolvedLastDayCustomers),
        last_7_day_avg: Number(resolvedLast7DayAvg.toFixed(2)),
        temperature: Number(temperature)
          || (weather && weather.toLowerCase().includes('sun') ? 82 : weather && weather.toLowerCase().includes('rain') ? 68 : 74),
        weather_condition: String(weatherCondition || normalizeWeatherForDemandModel(weather)).toLowerCase()
      };

      const { data } = await axios.post(
        demandModelUrl,
        { features: demandFeatures },
        { timeout: Number(process.env.ML_TIMEOUT_MS) || 5000 }
      );

      const prediction = Number(data?.prediction);
      if (!Number.isFinite(prediction)) {
        throw new Error('ML demand prediction was not numeric');
      }

      predictedQuantity = Math.round(prediction);
      mlMeta = {
        source: 'ml-service',
        model: data?.model || 'restaurant_demand_model',
        externalModelUrl: demandModelUrl,
        inputColumns: data?.input_columns || []
      };
    } catch (mlError) {
      inferenceStatus = 'fallback';
      predictedQuantity = Math.round(
        calculateBaseDemand(fallbackPastConsumption, derivedExpectedPeople) * eventMultiplier * weatherMultiplier
      );
      mlMeta = {
        source: 'fallback',
        model: 'formula',
        externalModelUrl: demandModelUrl,
        reason: mlError.message
      };
    }

    const surplusRisk = predictedQuantity > derivedExpectedPeople * 1.15;
    const donationRecommended = surplusRisk;
    const estimatedWaste = Math.max(0, predictedQuantity - derivedExpectedPeople);

    // ── Persist to MongoDB so Dashboard can load history after restart ──
    try {
      await PredictionLog.create({
        kitchenId,
        expectedPeople: derivedExpectedPeople,
        predictedQuantity,
        estimatedWaste,
        surplusRisk,
        donationRecommended,
        eventMultiplier,
        weatherMultiplier,
        dayOfWeek,
        weather: weather || '',
        events: Array.isArray(events) ? events.join(', ') : (events || '')
      });
    } catch (dbErr) {
      // Non-fatal: log but do not break the prediction response
      console.error('[PredictionLog] Could not save to DB:', dbErr.message);
    }

    return res.status(200).json({
      predictedQuantity,
      surplusRisk,
      donationRecommended,
      expectedPeople: derivedExpectedPeople,
      requestId: req?.requestId,
      adjustmentFactors: {
        eventMultiplier,
        weatherMultiplier,
        dayOfWeek
      },
      ml: mlMeta
    });
  } catch (error) {
    logPredictionEvent('error', {
      event: 'predict-demand',
      requestId: req?.requestId,
      status: 'failed',
      latencyMs: Date.now() - startedAt,
      message: error.message
    });
    return next(error);
  } finally {
    if (res.headersSent) {
      logPredictionEvent('info', {
        event: 'predict-demand',
        requestId: req?.requestId,
        status: res.statusCode,
        inferenceSource: inferenceStatus,
        latencyMs: Date.now() - startedAt
      });
    }
  }
};

const recommendDishes = async (req, res, next) => {
  try {
    const {
      kitchenId,
      topK = 5,
      cuisine,
      menuType,
      maxPrepTimeMin,
      excludeMissingIngredients = false
    } = req.body;

    const recommenderUrl = process.env.ML_RECOMMENDER_URL || 'http://localhost:5001/recommend';
    const menuDishes = await Dish.find(kitchenId ? { kitchenId } : {}).select('name ingredients quantityPerPerson').lean();

    try {
      const { data } = await axios.post(
        recommenderUrl,
        {
          topK,
          cuisine,
          menuType,
          maxPrepTimeMin,
          excludeMissingIngredients
        },
        { timeout: Number(process.env.ML_TIMEOUT_MS) || 5000 }
      );

      const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];
      const menuByLowerName = new Map(menuDishes.map((d) => [String(d.name || '').toLowerCase(), d]));

      const enriched = recs.map((r) => {
        const match = menuByLowerName.get(String(r.dishName || '').toLowerCase());
        return {
          ...r,
          existsInMenu: Boolean(match),
          menuDish: match || null
        };
      });

      return res.status(200).json({
        success: true,
        ...data,
        recommendations: enriched,
        ml: {
          provider: 'ml-service',
          url: recommenderUrl
        }
      });
    } catch (mlError) {
      const fallback = menuDishes
        .slice(0, Number(topK) || 5)
        .map((dish, idx) => ({
          dishName: dish.name,
          score: Number((1 - idx * 0.05).toFixed(3)),
          existsInMenu: true,
          menuDish: dish,
          missingIngredients: []
        }));

      return res.status(200).json({
        success: true,
        recommendations: fallback,
        ml: {
          provider: 'fallback',
          reason: mlError.message,
          url: recommenderUrl
        }
      });
    }
  } catch (error) {
    return next(error);
  }
};

const createEventAdjustment = async (req, res, next) => {
  try {
    const event = await EventAdjustment.create(req.body);
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return next(error);
  }
};

const getEventAdjustments = async (req, res, next) => {
  try {
    const { kitchenId } = req.query;
    const query = kitchenId ? { kitchenId } : {};
    const events = await EventAdjustment.find(query).sort({ date: 1 });
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    return next(error);
  }
};

const getPredictionHistory = async (req, res, next) => {
  try {
    const { kitchenId, limit = 100 } = req.query;
    const filter = kitchenId ? { kitchenId } : {};
    const logs = await PredictionLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    // Map to the same shape the frontend localStorage used
    const history = logs.map((l) => ({
      id: String(l._id),
      date: l.createdAt.toISOString(),
      kitchenId: l.kitchenId,
      expectedPeople: l.expectedPeople,
      predictedQuantity: l.predictedQuantity,
      estimatedWaste: l.estimatedWaste,
      surplusRisk: l.surplusRisk,
      donationRecommended: l.donationRecommended,
      eventMultiplier: l.eventMultiplier,
      weatherMultiplier: l.weatherMultiplier,
      dayOfWeek: l.dayOfWeek,
      weather: l.weather
    }));

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return next(error);
  }
};

const deletePredictionHistory = async (req, res, next) => {
  try {
    const { kitchenId } = req.query;
    const filter = kitchenId ? { kitchenId } : {};
    await PredictionLog.deleteMany(filter);
    return res.status(200).json({ success: true, message: 'History cleared' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  predictWaste,
  predictDemand,
  recommendDishes,
  createEventAdjustment,
  getEventAdjustments,
  getPredictionHistory,
  deletePredictionHistory
};
