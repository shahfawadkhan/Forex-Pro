const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  phone:   { type: String, trim: true },
  address: { type: String, trim: true },
  notes:   { type: String },
  isActive: { type: Boolean, default: true },

  // Main PKR balance: positive = they owe us, negative = we owe them
  balance: { type: Number, default: 0 },

  // Advance balance (pending advance deals not yet settled)
  advanceBalance: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Person', personSchema);
