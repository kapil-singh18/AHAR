const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createIngredient,
  getIngredients,
  updateIngredient,
  deleteIngredient,
  createPurchaseBatch,
  getPurchaseBatches,
  getPurchaseBatch,
  updatePurchaseBatch,
  deletePurchaseBatch,
  getFefoSummary,
  calculateRequirements
} = require('../controllers/inventoryController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/',
  [
    body('kitchenId').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('category').optional().isString(),
    body('stockQuantity').isFloat({ min: 0 }),
    body('unit').isString().notEmpty(),
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
    body('category').optional().isString(),
    body('stockQuantity').optional().isFloat({ min: 0 }),
    body('reorderDays').optional().isFloat({ min: 0 })
  ],
  validateRequest,
  updateIngredient
);

router.delete('/:id', [param('id').isMongoId()], validateRequest, deleteIngredient);

router.post(
  '/batches',
  [
    body('kitchenId').isString().notEmpty(),
    body('ingredientName').isString().notEmpty(),
    body('category').optional().isString(),
    body('quantity').isFloat({ min: 0.001 }),
    body('unit').isString().notEmpty(),
    body('purchaseDate').isISO8601(),
    body('expiryDate').optional().isISO8601(),
    body('shelfLifeDays').optional().isInt({ min: 1 }),
    body('batchId').optional().isString(),
    body('vendor').optional().isString(),
    body('cost').optional().isFloat({ min: 0 }),
    body().custom((value) => {
      if (!value.expiryDate && !value.shelfLifeDays) {
        throw new Error('Provide expiryDate or shelfLifeDays.');
      }
      return true;
    })
  ],
  validateRequest,
  createPurchaseBatch
);

router.get(
  '/batches',
  [
    query('kitchenId').optional().isString(),
    query('ingredientName').optional().isString(),
    query('includeConsumed').optional().isBoolean()
  ],
  validateRequest,
  getPurchaseBatches
);

router.get('/batches/:id', [param('id').isMongoId()], validateRequest, getPurchaseBatch);

router.put(
  '/batches/:id',
  [
    param('id').isMongoId(),
    body('ingredientName').optional().isString(),
    body('category').optional().isString(),
    body('quantity').optional().isFloat({ min: 0.001 }),
    body('remainingQuantity').optional().isFloat({ min: 0 }),
    body('unit').optional().isString(),
    body('purchaseDate').optional().isISO8601(),
    body('expiryDate').optional().isISO8601(),
    body('shelfLifeDays').optional().isInt({ min: 1 }),
    body('batchId').optional().isString(),
    body('vendor').optional().isString(),
    body('cost').optional().isFloat({ min: 0 })
  ],
  validateRequest,
  updatePurchaseBatch
);

router.delete('/batches/:id', [param('id').isMongoId()], validateRequest, deletePurchaseBatch);

router.get(
  '/fefo-summary',
  [query('kitchenId').isString().notEmpty(), query('expiringWithinDays').optional().isInt({ min: 0 })],
  validateRequest,
  getFefoSummary
);

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
