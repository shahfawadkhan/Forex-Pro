const mongoose = require('mongoose');

const DepositEntrySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  rate: { type: Number, required: true },
  pkrValue: { type: Number },
  date: { type: Date, default: Date.now },
  notes: String
});

const DirectPaymentSchema = new mongoose.Schema({
  personName: { type: String, required: true, trim: true },
  currency: { type: String, default: 'QAR' },
  deposits: [DepositEntrySchema],
  totalDeposited: { type: Number, default: 0 },
  totalUsed: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
  weightedAvgRate: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

DirectPaymentSchema.methods.recalculate = function() {
  const totalAmt = this.deposits.reduce((s, d) => s + d.amount, 0);
  const weightedSum = this.deposits.reduce((s, d) => s + (d.amount * d.rate), 0);
  this.totalDeposited = totalAmt;
  this.weightedAvgRate = totalAmt > 0 ? weightedSum / totalAmt : 0;
  this.remainingBalance = this.totalDeposited - this.totalUsed;
};

module.exports = mongoose.model('DirectPayment', DirectPaymentSchema);
