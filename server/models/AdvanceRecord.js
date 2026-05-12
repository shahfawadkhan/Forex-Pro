const mongoose = require('mongoose');

const DeductionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  aedAmount: { type: Number, required: true },
  linkedConversionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DirectPayment' },
  notes: String
});

const AdvanceRecordSchema = new mongoose.Schema({
  personName: { type: String, required: true, trim: true },
  aedAmount: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true },
  pkrEquivalent: { type: Number },
  usedAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  deductions: [DeductionSchema],
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AdvanceRecordSchema.pre('save', function(next) {
  this.pkrEquivalent = this.aedAmount * this.rate;
  this.remainingAmount = this.aedAmount - this.usedAmount;
  next();
});

module.exports = mongoose.model('AdvanceRecord', AdvanceRecordSchema);
