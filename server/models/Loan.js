const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema({
  date:     { type: Date, required: true, default: Date.now },
  amount:   { type: Number, required: true },
  currency: { type: String, enum: ['PKR', 'AED', 'SAR'], default: 'PKR' },
  notes:    { type: String, default: '' },
}, { timestamps: true });

const loanSchema = new mongoose.Schema({
  date:      { type: Date, required: true, default: Date.now },
  person:    { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },

  // 'give' = we gave a loan to this person; 'take' = we took a loan from this person
  direction: { type: String, enum: ['give', 'take'], required: true },

  currency:  { type: String, enum: ['PKR', 'AED', 'SAR'], default: 'PKR' },
  amount:    { type: Number, required: true },
  remaining: { type: Number },   // kept in sync on each repayment

  repayments: [repaymentSchema],

  notes:    { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: 'Admin' },
}, { timestamps: true });

loanSchema.pre('save', function (next) {
  const paid = this.repayments.reduce((s, r) => s + r.amount, 0);
  this.remaining = Math.max(0, this.amount - paid);
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
