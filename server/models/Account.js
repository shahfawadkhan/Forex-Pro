const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g., "Peshawar Cash", "Village Cash", "HBL Bank"
  type: { type: String, enum: ['Cash', 'Bank'], required: true },
  balance: { type: Number, default: 0 },
  bankName: { type: String }, // for bank accounts
  accountNumber: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
