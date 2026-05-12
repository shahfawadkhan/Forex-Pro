const mongoose = require('mongoose');

const DirhamTransactionSchema = new mongoose.Schema({
  buyPerson: { type: String, required: true, trim: true },
  buyAmount: { type: Number, required: true, min: 0 },
  buyRate: { type: Number, required: true },
  buyTotal: { type: Number },
  sellPerson: { type: String, required: true, trim: true },
  sellAmount: { type: Number, required: true, min: 0 },
  sellRate: { type: Number, required: true },
  sellTotal: { type: Number },
  profit: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
  buyAmountPaid: { type: Number, default: 0 },
  sellAmountPaid: { type: Number, default: 0 },
  buyRemaining: { type: Number, default: 0 },
  sellRemaining: { type: Number, default: 0 },
  weOweAmount: { type: Number, default: 0 },
  theyOweAmount: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

DirhamTransactionSchema.pre('save', function(next) {
  this.buyTotal = this.buyAmount * this.buyRate;
  this.sellTotal = this.sellAmount * this.sellRate;
  this.profit = this.sellTotal - this.buyTotal;
  this.buyRemaining = this.buyTotal - this.buyAmountPaid;
  this.sellRemaining = this.sellTotal - this.sellAmountPaid;
  this.weOweAmount = this.buyRemaining > 0 ? this.buyRemaining : 0;
  this.theyOweAmount = this.sellRemaining > 0 ? this.sellRemaining : 0;
  if (this.buyAmountPaid >= this.buyTotal && this.sellAmountPaid >= this.sellTotal) {
    this.paymentStatus = 'paid';
  } else if (this.buyAmountPaid > 0 || this.sellAmountPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
  }
  next();
});

module.exports = mongoose.model('DirhamTransaction', DirhamTransactionSchema);
