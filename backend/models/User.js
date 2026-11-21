const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  revokedAt: { type: Date, default: null },
  replacedByHash: { type: String, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'manager' },
  kitchenIds: [{ type: String, required: true }],
  activeKitchenId: { type: String, required: true },
  refreshTokens: { type: [refreshTokenSchema], default: [], select: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
