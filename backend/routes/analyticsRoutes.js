const express = require('express');
const { query } = require('express-validator');
const {
  getWasteDashboard,
  getWeeklySustainabilityReport
} = require('../controllers/analyticsController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get(
  '/waste-dashboard',
  [
    query('kitchenId').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  getWasteDashboard
);
router.get(
  '/weekly-report',
  [
    query('kitchenId').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  getWeeklySustainabilityReport
);

module.exports = router;
