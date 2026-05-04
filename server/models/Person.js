const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  type: { type: String, enum: ['Buyer', 'Seller', 'Both'], default: 'Both' },
  balance: { type: Number, default: 0 }, // positive = they owe us, negative = we owe them
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Person', personSchema);
