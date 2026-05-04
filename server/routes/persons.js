const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');

// GET all persons
router.get('/', async (req, res) => {
  try {
    const persons = await Person.find({ isActive: true }).sort({ name: 1 });
    res.json(persons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single person with ledger
router.get('/:id/ledger', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const { startDate, endDate } = req.query;
    let dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23,59,59));
    
    const txFilter = { person: req.params.id };
    const payFilter = { person: req.params.id };
    if (startDate || endDate) {
      txFilter.date = dateFilter;
      payFilter.date = dateFilter;
    }

    const transactions = await Transaction.find(txFilter).sort({ date: 1 });
    const payments = await Payment.find(payFilter).populate('account', 'name').sort({ date: 1 });

    // Build ledger entries
    const ledger = [];
    
    transactions.forEach(t => {
      ledger.push({
        _id: t._id,
        date: t.date,
        type: 'transaction',
        transactionType: t.type,
        currency: t.currency,
        amount: t.amount,
        rate: t.rate,
        totalPKR: t.totalPKR,
        profit: t.profit,
        notes: t.notes,
        debit: t.type === 'Sell' ? t.totalPKR : 0,  // they owe us
        credit: t.type === 'Buy' ? t.totalPKR : 0,   // we owe them
      });
    });

    payments.forEach(p => {
      ledger.push({
        _id: p._id,
        date: p.date,
        type: 'payment',
        direction: p.direction,
        accountName: p.account?.name,
        amount: p.amount,
        notes: p.notes,
        debit: p.direction === 'paid' ? p.amount : 0,   // we paid them
        credit: p.direction === 'received' ? p.amount : 0, // they paid us
      });
    });

    // Sort by date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Add running balance
    let running = 0;
    ledger.forEach(entry => {
      running += entry.debit - entry.credit;
      entry.balance = running;
    });

    res.json({ person, ledger, currentBalance: person.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create person
router.post('/', async (req, res) => {
  try {
    const person = new Person(req.body);
    await person.save();
    res.status(201).json(person);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update person
router.put('/:id', async (req, res) => {
  try {
    const person = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(person);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE person (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await Person.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Person deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
