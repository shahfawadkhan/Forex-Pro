const mongoose = require('mongoose');

const RepaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'village-account', 'bank', 'other'], default: 'cash' },
  date: { type: Date, default: Date.now },
  notes: String
});

const LoanSchema = new mongoose.Schema({
  personName: { type: String, required: true, trim: true },
  loanType: { type: String, enum: ['given', 'taken'], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['PKR', 'SAR', 'AED', 'QAR'], default: 'PKR' },
  interestRate: { type: Number, default: 0 },
  totalRepaid: { type: Number, default: 0 },
  remaining: { type: Number },
  repayments: [RepaymentSchema],
  status: { type: String, enum: ['active', 'completed', 'overdue'], default: 'active' },
  dueDate: { type: Date },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

LoanSchema.pre('save', function(next) {
  this.totalRepaid = this.repayments.reduce((s, r) => s + r.amount, 0);
  this.remaining = this.amount - this.totalRepaid;
  if (this.remaining <= 0) this.status = 'completed';
  else if (this.dueDate && new Date() > this.dueDate) this.status = 'overdue';
  else this.status = 'active';
  next();
});

module.exports = mongoose.model('Loan', LoanSchema);
