const Ingredient = require('../models/Ingredient');
const Dish = require('../models/Dish');
const PurchaseBatch = require('../models/PurchaseBatch');

const roundQuantity = (value) => Number(Number(value || 0).toFixed(3));

const trimString = (value) => (typeof value === 'string' ? value.trim() : '');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const deriveExpiryDate = (purchaseDate, expiryDate, shelfLifeDays) => {
  if (expiryDate) {
    const parsed = new Date(expiryDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (shelfLifeDays === undefined || shelfLifeDays === null || shelfLifeDays === '') {
    return null;
  }

  const purchase = new Date(purchaseDate);
  if (Number.isNaN(purchase.getTime())) {
    return null;
  }

  purchase.setDate(purchase.getDate() + Number(shelfLifeDays));
  return purchase;
};

const calculateDaysUntil = (dateValue) => {
  const targetDate = new Date(dateValue);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const serializeBatch = (batch) => {
  const plain = batch.toObject ? batch.toObject() : batch;
  const daysUntilExpiry = calculateDaysUntil(plain.expiryDate);

  return {
    ...plain,
    daysUntilExpiry,
    expiringStatus: daysUntilExpiry === null ? 'unknown' : daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry <= 7 ? 'expiring-soon' : 'fresh'
  };
};

const ensureIngredient = async ({ kitchenId, ingredientName, unit, category }) => {
  const normalizedName = trimString(ingredientName);
  const normalizedUnit = trimString(unit);
  const normalizedCategory = trimString(category);

  let ingredient = await Ingredient.findOne({ kitchenId, name: normalizedName });

  if (ingredient) {
    if (normalizedUnit && ingredient.unit !== normalizedUnit) {
      throw createHttpError(
        400,
        `Unit mismatch for "${normalizedName}". Existing unit is "${ingredient.unit}", received "${normalizedUnit}".`
      );
    }

    if (normalizedCategory && ingredient.category !== normalizedCategory) {
      ingredient.category = normalizedCategory;
      await ingredient.save();
    }

    return ingredient;
  }

  ingredient = await Ingredient.create({
    kitchenId,
    name: normalizedName,
    category: normalizedCategory,
    stockQuantity: 0,
    unit: normalizedUnit,
    reorderDays: 0
  });

  return ingredient;
};

const applyIngredientDelta = async (ingredient, deltaQuantity) => {
  if (!ingredient || !deltaQuantity) {
    return ingredient;
  }

  ingredient.stockQuantity = roundQuantity(Math.max(0, ingredient.stockQuantity + deltaQuantity));
  return ingredient.save();
};

const buildFefoSummary = (batches, expiringWithinDays) => {
  const ingredientsMap = new Map();
  const serializedBatches = batches.map(serializeBatch);

  const overall = {
    totalActiveQuantity: 0,
    totalExpiringSoonQuantity: 0,
    totalExpiredQuantity: 0,
    ingredientsTracked: 0,
    earliestExpiryDate: null,
    earliestIngredientName: null,
    earliestQuantity: 0
  };

  serializedBatches.forEach((batch) => {
    const ingredientKey = `${batch.ingredientName}__${batch.unit}`;
    const daysUntilExpiry = batch.daysUntilExpiry;
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= expiringWithinDays;

    overall.totalActiveQuantity = roundQuantity(overall.totalActiveQuantity + batch.remainingQuantity);
    if (isExpired) {
      overall.totalExpiredQuantity = roundQuantity(overall.totalExpiredQuantity + batch.remainingQuantity);
    }
    if (isExpiringSoon) {
      overall.totalExpiringSoonQuantity = roundQuantity(overall.totalExpiringSoonQuantity + batch.remainingQuantity);
    }
    if (!overall.earliestExpiryDate || new Date(batch.expiryDate) < new Date(overall.earliestExpiryDate)) {
      overall.earliestExpiryDate = batch.expiryDate;
      overall.earliestIngredientName = batch.ingredientName;
      overall.earliestQuantity = batch.remainingQuantity;
    }

    if (!ingredientsMap.has(ingredientKey)) {
      ingredientsMap.set(ingredientKey, {
        ingredientId: batch.ingredientId,
        ingredientName: batch.ingredientName,
        category: batch.category,
        unit: batch.unit,
        totalQuantity: 0,
        expiringSoonQuantity: 0,
        expiredQuantity: 0,
        earliestExpiryDate: batch.expiryDate,
        earliestBatchId: batch.batchId || batch._id,
        earliestQuantity: batch.remainingQuantity,
        batchCount: 0
      });
    }

    const summary = ingredientsMap.get(ingredientKey);
    summary.totalQuantity = roundQuantity(summary.totalQuantity + batch.remainingQuantity);
    summary.batchCount += 1;
    if (isExpired) {
      summary.expiredQuantity = roundQuantity(summary.expiredQuantity + batch.remainingQuantity);
    }
    if (isExpiringSoon) {
      summary.expiringSoonQuantity = roundQuantity(summary.expiringSoonQuantity + batch.remainingQuantity);
    }
    if (new Date(batch.expiryDate) < new Date(summary.earliestExpiryDate)) {
      summary.earliestExpiryDate = batch.expiryDate;
      summary.earliestBatchId = batch.batchId || batch._id;
      summary.earliestQuantity = batch.remainingQuantity;
    }
  });

  const ingredients = Array.from(ingredientsMap.values()).sort(
    (left, right) => new Date(left.earliestExpiryDate) - new Date(right.earliestExpiryDate)
  );

  overall.ingredientsTracked = ingredients.length;

  return {
    overall,
    ingredients,
    batches: serializedBatches
  };
};

const createIngredient = async (req, res, next) => {
  try {
    const kitchenId = req.body.kitchenId;
    const name = req.body.name?.trim();
    const incomingStock = Number(req.body.stockQuantity) || 0;
    const incomingUnit = req.body.unit?.trim();
    const incomingCategory = req.body.category?.trim();
    const incomingReorderDays =
      req.body.reorderDays === undefined ? undefined : Number(req.body.reorderDays);

    const existing = await Ingredient.findOne({ kitchenId, name });

    if (existing) {
      if (existing.unit !== incomingUnit) {
        return res.status(400).json({
          success: false,
          message: `Unit mismatch for "${name}". Existing unit is "${existing.unit}", received "${incomingUnit}".`
        });
      }

      existing.stockQuantity += incomingStock;
      if (incomingCategory) {
        existing.category = incomingCategory;
      }
      if (incomingReorderDays !== undefined && !Number.isNaN(incomingReorderDays)) {
        existing.reorderDays = incomingReorderDays;
      }

      await existing.save();
      return res.status(200).json({
        success: true,
        message: `Updated "${name}" stock by +${incomingStock} ${incomingUnit}.`,
        data: existing
      });
    }

    const ingredient = await Ingredient.create({
      ...req.body,
      name
    });
    return res.status(201).json({ success: true, data: ingredient });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Ingredient "${req.body.name}" already exists for kitchen "${req.body.kitchenId}".`
      });
    }
    return next(error);
  }
};

const getIngredients = async (req, res, next) => {
  try {
    const { kitchenId } = req.query;
    const ingredients = await Ingredient.find(kitchenId ? { kitchenId } : {}).sort({ name: 1 });
    return res.status(200).json({ success: true, data: ingredients });
  } catch (error) {
    return next(error);
  }
};

const updateIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }
    return res.status(200).json({ success: true, data: ingredient });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Ingredient "${req.body.name}" already exists for this kitchen.`
      });
    }
    return next(error);
  }
};

const deleteIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }
    return res.status(200).json({ success: true, message: 'Ingredient deleted' });
  } catch (error) {
    return next(error);
  }
};

const createPurchaseBatch = async (req, res, next) => {
  try {
    const kitchenId = trimString(req.body.kitchenId);
    const ingredientName = trimString(req.body.ingredientName);
    const category = trimString(req.body.category);
    const quantity = roundQuantity(req.body.quantity);
    const unit = trimString(req.body.unit);
    const purchaseDate = new Date(req.body.purchaseDate);
    const shelfLifeDays = req.body.shelfLifeDays === undefined || req.body.shelfLifeDays === ''
      ? undefined
      : Number(req.body.shelfLifeDays);
    const expiryDate = deriveExpiryDate(req.body.purchaseDate, req.body.expiryDate, shelfLifeDays);

    if (Number.isNaN(purchaseDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Purchase date must be a valid date.' });
    }

    if (!expiryDate) {
      return res.status(400).json({ success: false, message: 'Expiry date is required unless shelf life is provided.' });
    }

    const ingredient = await ensureIngredient({ kitchenId, ingredientName, unit, category });
    const batch = await PurchaseBatch.create({
      kitchenId,
      ingredientId: ingredient._id,
      ingredientName,
      category,
      quantity,
      remainingQuantity: quantity,
      unit,
      purchaseDate,
      expiryDate,
      shelfLifeDays,
      batchId: trimString(req.body.batchId),
      vendor: trimString(req.body.vendor),
      cost: req.body.cost === undefined || req.body.cost === '' ? 0 : Number(req.body.cost)
    });

    await applyIngredientDelta(ingredient, quantity);

    return res.status(201).json({ success: true, data: serializeBatch(batch) });
  } catch (error) {
    if (error?.code === 11000 && req.body.batchId) {
      return res.status(409).json({ success: false, message: `Batch ID "${req.body.batchId}" already exists for this kitchen.` });
    }
    return next(error);
  }
};

const getPurchaseBatches = async (req, res, next) => {
  try {
    const { kitchenId, ingredientName, includeConsumed } = req.query;
    const query = {};
    if (kitchenId) {
      query.kitchenId = kitchenId;
    }
    if (ingredientName) {
      query.ingredientName = ingredientName;
    }
    if (includeConsumed !== 'true') {
      query.remainingQuantity = { $gt: 0 };
    }

    const batches = await PurchaseBatch.find(query).sort({ expiryDate: 1, purchaseDate: 1, createdAt: 1 });
    return res.status(200).json({ success: true, data: batches.map(serializeBatch) });
  } catch (error) {
    return next(error);
  }
};

const getPurchaseBatch = async (req, res, next) => {
  try {
    const batch = await PurchaseBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Purchase batch not found' });
    }

    return res.status(200).json({ success: true, data: serializeBatch(batch) });
  } catch (error) {
    return next(error);
  }
};

const updatePurchaseBatch = async (req, res, next) => {
  try {
    const batch = await PurchaseBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Purchase batch not found' });
    }

    const previousIngredient = await Ingredient.findById(batch.ingredientId);
    const consumedQuantity = roundQuantity(batch.quantity - batch.remainingQuantity);

    const ingredientName = req.body.ingredientName === undefined ? batch.ingredientName : trimString(req.body.ingredientName);
    const category = req.body.category === undefined ? batch.category : trimString(req.body.category);
    const unit = req.body.unit === undefined ? batch.unit : trimString(req.body.unit);
    const quantity = req.body.quantity === undefined ? batch.quantity : roundQuantity(req.body.quantity);
    if (quantity < consumedQuantity) {
      return res.status(400).json({ success: false, message: 'Updated quantity cannot be less than the quantity already consumed.' });
    }

    let remainingQuantity = req.body.remainingQuantity === undefined
      ? batch.remainingQuantity
      : roundQuantity(req.body.remainingQuantity);

    if (req.body.quantity !== undefined && req.body.remainingQuantity === undefined) {
      remainingQuantity = roundQuantity(Math.max(0, quantity - consumedQuantity));
    }

    if (remainingQuantity > quantity) {
      return res.status(400).json({ success: false, message: 'Remaining quantity cannot exceed total quantity.' });
    }

    const purchaseDate = req.body.purchaseDate === undefined ? batch.purchaseDate : new Date(req.body.purchaseDate);
    if (Number.isNaN(new Date(purchaseDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Purchase date must be a valid date.' });
    }

    const shelfLifeDays = req.body.shelfLifeDays === undefined || req.body.shelfLifeDays === ''
      ? batch.shelfLifeDays
      : Number(req.body.shelfLifeDays);
    const expiryDate = deriveExpiryDate(purchaseDate, req.body.expiryDate === undefined ? batch.expiryDate : req.body.expiryDate, shelfLifeDays);
    if (!expiryDate) {
      return res.status(400).json({ success: false, message: 'Expiry date is required unless shelf life is provided.' });
    }

    const targetIngredient = await ensureIngredient({
      kitchenId: batch.kitchenId,
      ingredientName,
      unit,
      category
    });

    if (String(targetIngredient._id) === String(batch.ingredientId)) {
      await applyIngredientDelta(targetIngredient, roundQuantity(remainingQuantity - batch.remainingQuantity));
    } else {
      await applyIngredientDelta(previousIngredient, -batch.remainingQuantity);
      await applyIngredientDelta(targetIngredient, remainingQuantity);
    }

    batch.ingredientId = targetIngredient._id;
    batch.ingredientName = ingredientName;
    batch.category = category;
    batch.quantity = quantity;
    batch.remainingQuantity = remainingQuantity;
    batch.unit = unit;
    batch.purchaseDate = purchaseDate;
    batch.expiryDate = expiryDate;
    batch.shelfLifeDays = shelfLifeDays;
    batch.batchId = req.body.batchId === undefined ? batch.batchId : trimString(req.body.batchId);
    batch.vendor = req.body.vendor === undefined ? batch.vendor : trimString(req.body.vendor);
    batch.cost = req.body.cost === undefined || req.body.cost === '' ? batch.cost : Number(req.body.cost);
    batch.status = remainingQuantity <= 0 ? 'consumed' : 'active';

    await batch.save();

    return res.status(200).json({ success: true, data: serializeBatch(batch) });
  } catch (error) {
    if (error?.code === 11000 && req.body.batchId) {
      return res.status(409).json({ success: false, message: `Batch ID "${req.body.batchId}" already exists for this kitchen.` });
    }
    return next(error);
  }
};

const deletePurchaseBatch = async (req, res, next) => {
  try {
    const batch = await PurchaseBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Purchase batch not found' });
    }

    const ingredient = await Ingredient.findById(batch.ingredientId);
    await applyIngredientDelta(ingredient, -batch.remainingQuantity);
    await PurchaseBatch.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Purchase batch deleted' });
  } catch (error) {
    return next(error);
  }
};

const getFefoSummary = async (req, res, next) => {
  try {
    const kitchenId = trimString(req.query.kitchenId);
    const expiringWithinDays = req.query.expiringWithinDays === undefined ? 7 : Number(req.query.expiringWithinDays);
    const batches = await PurchaseBatch.find({
      kitchenId,
      remainingQuantity: { $gt: 0 }
    }).sort({ expiryDate: 1, purchaseDate: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        kitchenId,
        generatedAt: new Date().toISOString(),
        expiringWithinDays,
        ...buildFefoSummary(batches, expiringWithinDays)
      }
    });
  } catch (error) {
    return next(error);
  }
};

const calculateRequirements = async (req, res, next) => {
  try {
    const { kitchenId, predictedMeals, dishes } = req.body;

    const dishDocs = await Dish.find({ _id: { $in: dishes }, kitchenId });
    const neededMap = new Map();

    dishDocs.forEach((dish) => {
      dish.ingredients.forEach((ingredient) => {
        const current = neededMap.get(String(ingredient.ingredientId)) || {
          ingredientId: ingredient.ingredientId,
          name: ingredient.name,
          unit: ingredient.unit,
          required: 0
        };
        current.required += ingredient.amountPerMeal * predictedMeals;
        neededMap.set(String(ingredient.ingredientId), current);
      });
    });

    const ingredientIds = Array.from(neededMap.values()).map((item) => item.ingredientId);
    const stocks = await Ingredient.find({ _id: { $in: ingredientIds }, kitchenId });

    const stockMap = new Map(stocks.map((stock) => [String(stock._id), stock]));
    const requirements = Array.from(neededMap.values()).map((item) => {
      const stockItem = stockMap.get(String(item.ingredientId));
      const stockQuantity = stockItem ? stockItem.stockQuantity : 0;
      const shortage = Math.max(0, item.required - stockQuantity);
      return {
        ingredientId: item.ingredientId,
        name: item.name,
        unit: item.unit,
        required: Number(item.required.toFixed(2)),
        stockQuantity,
        shortage,
        shortageAlert: shortage > 0
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        kitchenId,
        predictedMeals,
        requirements
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
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
};
