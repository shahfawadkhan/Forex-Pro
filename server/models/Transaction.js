const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },

  // Two-party model: every deal has a buyer and a seller
  buyerPerson:  { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  sellerPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },

  currency: { type: String, enum: ['AED', 'SAR'], required: true },
  amount:   { type: Number, required: true },
  rate:     { type: Number, required: true },
  totalPKR: { type: Number, required: true },

  // Profit stored per-transaction (rate spread × amount, computed in route)
  profit: { type: Number, default: 0 },

  // SAR → AED shadow record linkage
  isSARConversion:  { type: Boolean, default: false },
  sarConversionRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },

  // Advance flag
  isAdvance: { type: Boolean, default: false },

  paymentMethod: { type: String, enum: ['Cash', 'Bank', 'Village'], default: 'Cash' },
  account:   { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  notes:     { type: String, default: '' },
  createdBy: { type: String, default: 'Admin' },
}, { timestamps: true });

transactionSchema.pre('save', function (next) {
  this.totalPKR = this.amount * this.rate;
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
