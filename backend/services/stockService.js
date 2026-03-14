const Ingredient = require('../models/Ingredient');
const Dish = require('../models/Dish');
const PurchaseBatch = require('../models/PurchaseBatch');

const roundQuantity = (value) => Number(Number(value || 0).toFixed(3));

const deductFromBatchesFefo = async (kitchenId, ingredient, requiredAmount) => {
  const amountToDeduct = roundQuantity(requiredAmount);
  if (!ingredient || amountToDeduct <= 0) {
    return;
  }

  let remainingToDeduct = amountToDeduct;
  const batches = await PurchaseBatch.find({
    kitchenId,
    ingredientId: ingredient._id,
    remainingQuantity: { $gt: 0 }
  }).sort({ expiryDate: 1, purchaseDate: 1, createdAt: 1 });

  for (const batch of batches) {
    if (remainingToDeduct <= 0) {
      break;
    }

    const consumedQuantity = Math.min(batch.remainingQuantity, remainingToDeduct);
    batch.remainingQuantity = roundQuantity(batch.remainingQuantity - consumedQuantity);
    batch.status = batch.remainingQuantity <= 0 ? 'consumed' : 'active';
    await batch.save();
    remainingToDeduct = roundQuantity(remainingToDeduct - consumedQuantity);
  }

  ingredient.stockQuantity = roundQuantity(Math.max(0, ingredient.stockQuantity - amountToDeduct));
  await ingredient.save();
};

const reduceStockForCooking = async (kitchenId, dishId, cookedMeals) => {
  const dish = await Dish.findOne({ _id: dishId, kitchenId });
  if (!dish) {
    return;
  }

  for (const item of dish.ingredients) {
    const ingredient = await Ingredient.findOne({ _id: item.ingredientId, kitchenId });
    const requiredAmount = item.amountPerMeal * cookedMeals;
    await deductFromBatchesFefo(kitchenId, ingredient, requiredAmount);
  }
};

module.exports = {
  reduceStockForCooking,
  deductFromBatchesFefo
};
