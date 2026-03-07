const express = require('express');
const { query } = require('express-validator');
const {
  getWasteDashboard,
  getWeeklySustainabilityReport,
  getDailySavings
} = require('../controllers/analyticsController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/waste-dashboard', [query('kitchenId').optional().isString()], validateRequest, getWasteDashboard);
router.get('/weekly-report', [query('kitchenId').optional().isString()], validateRequest, getWeeklySustainabilityReport);
router.get(
  '/daily-savings',
  [query('kitchenId').optional().isString(), query('date').optional().isISO8601()],
  validateRequest,
  getDailySavings
);

module.exports = router;
