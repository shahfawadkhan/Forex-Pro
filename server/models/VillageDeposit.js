const mongoose = require('mongoose');

const villageDepositSchema = new mongoose.Schema({
  date:      { type: Date, required: true, default: Date.now },
  person:    { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  direction: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount:    { type: Number, required: true },
  notes:     { type: String, default: '' },
  createdBy: { type: String, default: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('VillageDeposit', villageDepositSchema);
