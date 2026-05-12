const mongoose = require('mongoose');

const VillageTransactionSchema = new mongoose.Schema({
  personName: { type: String, required: true, trim: true },
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number },
  date: { type: Date, default: Date.now },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('VillageAccount', VillageTransactionSchema);
