const mongoose = require('mongoose');

const PaymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: String
});

const RiyalTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['riyal-to-riyal', 'riyal-to-saudi'],
    default: 'riyal-to-riyal'
  },
  // Buy side
  buyPerson: { type: String, required: true, trim: true },
  buyAmount: { type: Number, default: 0 },
  buyRate: { type: Number, default: 0 },
  buyTotal: { type: Number, default: 0 },
  // Sell side
  sellPerson: { type: String, required: true, trim: true },
  sellAmount: { type: Number, default: 0 },
  sellRate: { type: Number, default: 0 },
  sellTotal: { type: Number, default: 0 },
  // Calculated
  profit: { type: Number, default: 0 },
  exchangeDifference: { type: Number, default: 0 },
  // Payment
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'partial'],
    default: 'unpaid'
  },
  buyAmountPaid: { type: Number, default: 0 },
  sellAmountPaid: { type: Number, default: 0 },
  buyRemaining: { type: Number, default: 0 },
  sellRemaining: { type: Number, default: 0 },
  paymentHistory: [PaymentHistorySchema],
  // Ledger
  weOweAmount: { type: Number, default: 0 },
  theyOweAmount: { type: Number, default: 0 },
  // Meta
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

RiyalTransactionSchema.pre('save', function (next) {
  const buyAmt = Number(this.buyAmount) || 0;
  const buyRt = Number(this.buyRate) || 0;
  const sellAmt = Number(this.sellAmount) || 0;
  const sellRt = Number(this.sellRate) || 0;
  const buyPaid = Number(this.buyAmountPaid) || 0;
  const sellPaid = Number(this.sellAmountPaid) || 0;

  this.buyTotal = buyAmt * buyRt;
  this.sellTotal = sellAmt * sellRt;
  this.profit = this.sellTotal - this.buyTotal;
  this.buyRemaining = Math.max(0, this.buyTotal - buyPaid);
  this.sellRemaining = Math.max(0, this.sellTotal - sellPaid);
  this.weOweAmount = this.buyRemaining;
  this.theyOweAmount = this.sellRemaining;

  if (buyPaid >= this.buyTotal && sellPaid >= this.sellTotal && this.buyTotal > 0) {
    this.paymentStatus = 'paid';
  } else if (buyPaid > 0 || sellPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
  }

  next();
});

module.exports = mongoose.model('RiyalTransaction', RiyalTransactionSchema);