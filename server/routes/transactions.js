const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Person = require('../models/Person');

// GET all transactions with filters
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, person, currency, type, page = 1, limit = 50 } = req.query;
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    if (person) filter.person = person;
    if (currency) filter.currency = currency;
    if (type) filter.type = type;

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('person', 'name phone')
      .populate('account', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create transaction
router.post('/', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();

    // Update person balance
    const balanceDelta = transaction.type === 'Sell' 
      ? transaction.totalPKR   // they owe us more
      : -transaction.totalPKR; // we owe them more

    await Person.findByIdAndUpdate(transaction.person, {
      $inc: { balance: balanceDelta }
    });

    await transaction.populate('person', 'name phone');
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update transaction
router.put('/:id', async (req, res) => {
  try {
    const old = await Transaction.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Transaction not found' });

    // Reverse old balance effect
    const oldDelta = old.type === 'Sell' ? old.totalPKR : -old.totalPKR;
    await Person.findByIdAndUpdate(old.person, { $inc: { balance: -oldDelta } });

    // Apply new
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await updated.save(); // triggers pre-save hook
    const newDelta = updated.type === 'Sell' ? updated.totalPKR : -updated.totalPKR;
    await Person.findByIdAndUpdate(updated.person, { $inc: { balance: newDelta } });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });

    // Reverse balance effect
    const delta = tx.type === 'Sell' ? tx.totalPKR : -tx.totalPKR;
    await Person.findByIdAndUpdate(tx.person, { $inc: { balance: -delta } });

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
