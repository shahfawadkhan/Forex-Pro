const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  currency: { type: String, enum: ['AED', 'SAR'], required: true },
  type: { type: String, enum: ['Buy', 'Sell'], required: true },
  amount: { type: Number, required: true }, // foreign currency amount
  rate: { type: Number, required: true },   // PKR per unit
  totalPKR: { type: Number, required: true }, // amount * rate
  buyingRate: { type: Number }, // for profit calculation
  sellingRate: { type: Number },
  profit: { type: Number, default: 0 },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  notes: { type: String },
  createdBy: { type: String, default: 'Admin' },
}, { timestamps: true });

// Auto-calculate totalPKR and profit before saving
transactionSchema.pre('save', function(next) {
  this.totalPKR = this.amount * this.rate;
  if (this.type === 'Sell' && this.buyingRate) {
    this.profit = (this.rate - this.buyingRate) * this.amount;
  } else if (this.type === 'Buy' && this.sellingRate) {
    this.profit = (this.sellingRate - this.rate) * this.amount;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
