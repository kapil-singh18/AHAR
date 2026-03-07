const EventAdjustment = require('../models/EventAdjustment');
const Dish = require('../models/Dish');
const axios = require('axios');

const calculateBaseDemand = (pastConsumption, expectedPeople) => {
  const avgPast = pastConsumption.reduce((sum, v) => sum + v, 0) / pastConsumption.length;
  return (avgPast * 0.7) + (expectedPeople * 0.3);
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

    const modelUrl = process.env.ML_DEMAND_URL || 'http://localhost:5001/predict';

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
  } catch (error) {
    return next(error);
  }
};

const predictDemand = async (req, res, next) => {
  try {
    const {
      kitchenId,
      pastConsumption,
      dayOfWeek,
      expectedPeople,
      events = [],
      weather
    } = req.body;

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
    const predictedQuantity = Math.round(
      calculateBaseDemand(pastConsumption, expectedPeople) * eventMultiplier * weatherMultiplier
    );

    const surplusRisk = predictedQuantity > expectedPeople * 1.15;

    const mockMlPayload = {
      source: 'mock',
      externalModelUrl: process.env.ML_DEMAND_URL || 'http://localhost:5001/predict',
      modelIntegrationReady: true
    };

    return res.status(200).json({
      predictedQuantity,
      surplusRisk,
      donationRecommended: surplusRisk,
      adjustmentFactors: {
        eventMultiplier,
        weatherMultiplier,
        dayOfWeek
      },
      ml: mockMlPayload
    });
  } catch (error) {
    return next(error);
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
    const menuDishes = await Dish.find(kitchenId ? { kitchenId } : {}).select('name ingredients quantityPerPerson').lean();

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

module.exports = {
  predictWaste,
  predictDemand,
  recommendDishes,
  createEventAdjustment,
  getEventAdjustments
};
