const mongoose = require('mongoose');

const ProfitSchema = new mongoose.Schema({
  source: { type: String, enum: ['riyal', 'dirham', 'pkr', 'advance', 'conversion', 'other'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'PKR' },
  transactionRef: { type: mongoose.Schema.Types.ObjectId, refPath: 'sourceModel' },
  sourceModel: { type: String, enum: ['RiyalTransaction', 'DirhamTransaction', 'PKRTransaction'] },
  date: { type: Date, default: Date.now },
  notes: String,
  isReset: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Profit', ProfitSchema);
