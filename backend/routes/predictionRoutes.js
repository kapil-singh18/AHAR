const express = require('express');
const { body, query } = require('express-validator');
const {
  predictWaste,
  predictDemand,
  recommendDishes,
  createEventAdjustment,
  getEventAdjustments
} = require('../controllers/predictionController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

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
  [
    body('kitchenId').isString().notEmpty(),
    body('pastConsumption').isArray({ min: 3 }),
    body('pastConsumption.*').isNumeric(),
    body('dayOfWeek').isString().notEmpty(),
    body('expectedPeople').isInt({ min: 1 }),
    body('events').optional().isArray(),
    body('weather').optional().isString()
  ],
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

module.exports = router;
