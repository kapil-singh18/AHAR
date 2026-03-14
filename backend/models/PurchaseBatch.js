const mongoose = require('mongoose');

const purchaseBatchSchema = new mongoose.Schema(
  {
    kitchenId: {
      type: String,
      required: true,
      index: true
    },
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
      index: true
    },
    ingredientName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    purchaseDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    shelfLifeDays: {
      type: Number,
      min: 1
    },
    batchId: {
      type: String,
      trim: true
    },
    vendor: {
      type: String,
      trim: true,
      default: ''
    },
    cost: {
      type: Number,
      min: 0,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'consumed'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

purchaseBatchSchema.index({ kitchenId: 1, ingredientName: 1, expiryDate: 1 });
purchaseBatchSchema.index({ kitchenId: 1, batchId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PurchaseBatch', purchaseBatchSchema);