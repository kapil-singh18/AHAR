const express = require('express');
const { body, query } = require('express-validator');
const {
  predictWaste,
  predictDemand,
  recommendDishes,
  createEventAdjustment,
  getEventAdjustments,
  getPredictionHistory,
  deletePredictionHistory
} = require('../controllers/predictionController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

const predictDemandValidators = [
  body('kitchenId').isString().notEmpty(),
  body('pastConsumption').optional().isArray({ min: 3 }),
  body('pastConsumption.*').optional().isNumeric(),
  body('dayOfWeek').isString().notEmpty().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  body('expectedPeople').optional().isInt({ min: 1 }),
  body('lastDayCustomers').optional().isInt({ min: 0 }),
  body('last7DayAvg').optional().isFloat({ min: 0 }),
  body('temperature').optional().isFloat({ min: -40, max: 150 }),
  body('weatherCondition').optional().isIn(['sunny', 'cloudy', 'rainy', 'storm']),
  body('holiday').optional().isBoolean(),
  body('eventEffect').optional().isIn(['decrease', 'none', 'increase']),
  body('eventSize').optional().isIn(['large', 'medium', 'small', 'none']),
  body('date').optional().isISO8601(),
  body('mealSlot').optional().isIn(['Breakfast', 'Lunch', 'Dinner', 'breakfast', 'lunch', 'dinner']),
  body('events').optional().isArray(),
  body('weather').optional().isString(),
  body().custom((value) => {
    const hasBaseline = Boolean(
      value.expectedPeople || value.last7DayAvg || value.lastDayCustomers || (Array.isArray(value.pastConsumption) && value.pastConsumption.length)
    );
    if (!hasBaseline) {
      throw new Error('Provide one baseline input: expectedPeople, last7DayAvg, lastDayCustomers, or pastConsumption');
    }
    return true;
  })
];

router.post(
  '/predict-waste',
  [
    body('kitchenId').isString().notEmpty(),
    body('occupancyRate').isFloat({ min: 0, max: 1 }),
    body('temperatureC').isFloat({ min: -50, max: 70 }),
    body('prevDayMeals').isInt({ min: 0 }),
    body('prev7DayAvgMeals').isFloat({ min: 0 }),
    body('mealsPrepared').isInt({ min: 0 }),
    body('weather').isString().notEmpty(),
    body('menuType').isString().notEmpty(),
    body('facilityType').isString().notEmpty()
  ],
  validateRequest,
  predictWaste
);

router.post(
  '/predict-demand',
  predictDemandValidators,
  validateRequest,
  predictDemand
);

router.post(
  '/v1/predict-demand',
  predictDemandValidators,
  validateRequest,
  predictDemand
);

router.post(
  '/recommend-dishes',
  [
    body('kitchenId').optional().isString(),
    body('topK').optional().isInt({ min: 1, max: 25 }),
    body('cuisine').optional().isString(),
    body('menuType').optional().isString(),
    body('maxPrepTimeMin').optional().isInt({ min: 1, max: 600 }),
    body('excludeMissingIngredients').optional().isBoolean()
  ],
  validateRequest,
  recommendDishes
);

router.post(
  '/events',
  [
    body('kitchenId').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('date').isISO8601(),
    body('holidayFlag').optional().isBoolean(),
    body('specialDemandMultiplier').isFloat({ min: 0.1, max: 5 })
  ],
  validateRequest,
  createEventAdjustment
);

router.get(
  '/events',
  [query('kitchenId').optional().isString()],
  validateRequest,
  getEventAdjustments
);

router.get(
  '/prediction-history',
  [query('kitchenId').optional().isString(), query('limit').optional().isInt({ min: 1, max: 500 })],
  validateRequest,
  getPredictionHistory
);

router.delete(
  '/prediction-history',
  [query('kitchenId').optional().isString()],
  validateRequest,
  deletePredictionHistory
);

module.exports = router;
