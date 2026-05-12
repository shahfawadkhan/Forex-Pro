const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'manager', 'viewer'], default: 'manager' },
  isActive: { type: Boolean, default: true },
  companyName: { type: String, default: 'ForexPro Exchange' },
  settings: {
    defaultCurrency: { type: String, default: 'PKR' },
    profitHidden: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false }
  }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

UserSchema.methods.getSignedJwt = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

module.exports = mongoose.model('User', UserSchema);
