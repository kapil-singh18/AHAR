const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    kitchenId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: ''
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    reorderDays: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

ingredientSchema.index({ kitchenId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Ingredient', ingredientSchema);
