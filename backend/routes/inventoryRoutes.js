const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
  calculateRequirements
} = require('../controllers/inventoryController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/',
  [
    body('kitchenId').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('stockQuantity').isFloat({ min: 0 }),
    body('unit').isString().notEmpty(),
    body('unitCost').optional().isFloat({ min: 0 }),
    body('reorderDays').optional().isFloat({ min: 0 })
  ],
  validateRequest,
  createIngredient
);

router.get('/', [query('kitchenId').optional().isString()], validateRequest, getIngredients);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('stockQuantity').optional().isFloat({ min: 0 }),
    body('unitCost').optional().isFloat({ min: 0 }),
    body('reorderDays').optional().isFloat({ min: 0 })
  ],
  validateRequest,
  updateIngredient
);

router.delete('/:id', [param('id').isMongoId()], validateRequest, deleteIngredient);

router.post(
  '/calculate-requirements',
  [
    body('kitchenId').isString().notEmpty(),
    body('predictedMeals').isInt({ min: 1 }),
    body('dishes').isArray({ min: 1 }),
    body('dishes.*').isMongoId()
  ],
  validateRequest,
  calculateRequirements
);

module.exports = router;
