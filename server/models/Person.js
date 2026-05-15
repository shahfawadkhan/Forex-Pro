const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  phone:   { type: String, trim: true, default: '' },
  city:    { type: String, trim: true, default: '' },
  notes:   { type: String, trim: true, default: '' },
  active:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure names are unique per user space
PersonSchema.index({ name: 1 }, { unique: false });

module.exports = mongoose.model('Person', PersonSchema);
