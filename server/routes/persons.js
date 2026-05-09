const express = require('express');
const router = express.Router();
const Person = require('../models/Person');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const VillageDeposit = require('../models/VillageDeposit');

// GET all persons
router.get('/', async (req, res) => {
  try {
    const persons = await Person.find({ isActive: true }).sort({ name: 1 });
    res.json(persons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single person with unified ledger
router.get('/:id/ledger', async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate)   dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    const hasDate = startDate || endDate;

    const txFilter  = { $or: [{ buyerPerson: req.params.id }, { sellerPerson: req.params.id }], isSARConversion: false };
    const payFilter = { person: req.params.id };
    const villFilter = { person: req.params.id };
    if (hasDate) {
      txFilter.date    = dateFilter;
      payFilter.date   = dateFilter;
      villFilter.date  = dateFilter;
    }

    const [transactions, payments, loans, villageDeposits] = await Promise.all([
      Transaction.find(txFilter)
        .populate('buyerPerson',  'name')
        .populate('sellerPerson', 'name')
        .sort({ date: 1 }),
      Payment.find(payFilter).populate('account', 'name').sort({ date: 1 }),
      Loan.find({ person: req.params.id, isActive: true }),
      VillageDeposit.find(villFilter).sort({ date: 1 }),
    ]);

    const ledger = [];

    transactions.forEach(t => {
      const isBuyer  = t.buyerPerson?._id?.toString()  === req.params.id;
      const isSeller = t.sellerPerson?._id?.toString() === req.params.id;
      const counterpart = isBuyer ? t.sellerPerson?.name : t.buyerPerson?.name;
      ledger.push({
        _id: t._id,
        date: t.date,
        type: 'transaction',
        currency: t.currency,
        amount: t.amount,
        rate: t.rate,
        totalPKR: t.totalPKR,
        profit: t.profit,
        isAdvance: t.isAdvance,
        role: isBuyer ? 'Buyer' : 'Seller',
        counterpart,
        notes: t.notes,
        // Buyer owes us (debit), Seller is owed by us (credit)
        debit:  isBuyer  ? t.totalPKR : 0,
        credit: isSeller ? t.totalPKR : 0,
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
        debit:  p.direction === 'paid'     ? p.amount : 0,
        credit: p.direction === 'received' ? p.amount : 0,
      });
    });

    loans.forEach(l => {
      ledger.push({
        _id:   l._id,
        date:  l.date,
        type:  'loan',
        direction: l.direction,
        currency: l.currency,
        amount: l.amount,
        remaining: l.remaining,
        notes: l.notes,
        // give = we gave them money → they owe us (debit)
        // take = they gave us money → we owe them (credit)
        debit:  l.direction === 'give' ? l.amount : 0,
        credit: l.direction === 'take' ? l.amount : 0,
      });
      // Add repayments as sub-entries
      l.repayments.forEach(r => {
        if (hasDate) {
          const d = new Date(r.date);
          if (startDate && d < new Date(startDate)) return;
          if (endDate   && d > new Date(new Date(endDate).setHours(23,59,59))) return;
        }
        ledger.push({
          _id:  r._id,
          date: r.date,
          type: 'loan_repayment',
          direction: l.direction,
          currency:  r.currency,
          amount:    r.amount,
          notes:     r.notes,
          debit:  l.direction === 'take' ? r.amount : 0,
          credit: l.direction === 'give' ? r.amount : 0,
        });
      });
    });

    villageDeposits.forEach(v => {
      ledger.push({
        _id:  v._id,
        date: v.date,
        type: 'village',
        direction: v.direction,
        amount: v.amount,
        notes: v.notes,
        debit:  v.direction === 'withdrawal' ? v.amount : 0,
        credit: v.direction === 'deposit'    ? v.amount : 0,
      });
    });

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;
    ledger.forEach(entry => {
      running += entry.debit - entry.credit;
      entry.balance = running;
    });

    res.json({ person, ledger, currentBalance: person.balance, advanceBalance: person.advanceBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create person
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    const person = new Person({ name, phone, address, notes });
    await person.save();
    res.status(201).json(person);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update person
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    const person = await Person.findByIdAndUpdate(req.params.id, { name, phone, address, notes }, { new: true });
    res.json(person);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE person (soft)
router.delete('/:id', async (req, res) => {
  try {
    await Person.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
