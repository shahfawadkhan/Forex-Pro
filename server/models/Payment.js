const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  amount: { type: Number, required: true },
  direction: { 
    type: String, 
    enum: ['received', 'paid'], // received = person paid us, paid = we paid person
    required: true 
  },
  notes: { type: String },
  createdBy: { type: String, default: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
