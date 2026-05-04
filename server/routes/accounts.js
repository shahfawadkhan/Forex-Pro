const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Payment = require('../models/Payment');

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ isActive: true }).sort({ type: 1, name: 1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET account transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const payments = await Payment.find({ account: req.params.id })
      .populate('person', 'name')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create account
router.post('/', async (req, res) => {
  try {
    const account = new Account(req.body);
    await account.save();
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update account
router.put('/:id', async (req, res) => {
  try {
    const account = await Account.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    await Account.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
