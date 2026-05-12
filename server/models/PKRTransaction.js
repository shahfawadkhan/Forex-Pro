const mongoose = require('mongoose');

const PKRTransactionSchema = new mongoose.Schema({
  buyPerson: { type: String, required: true, trim: true },
  sellPerson: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  marginPercent: { type: Number, default: 0.5 },
  profit: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
  amountPaid: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

PKRTransactionSchema.pre('save', function(next) {
  this.profit = (this.amount * this.marginPercent) / 100;
  this.remaining = this.amount - this.amountPaid;
  if (this.amountPaid >= this.amount) this.paymentStatus = 'paid';
  else if (this.amountPaid > 0) this.paymentStatus = 'partial';
  else this.paymentStatus = 'unpaid';
  next();
});

module.exports = mongoose.model('PKRTransaction', PKRTransactionSchema);
