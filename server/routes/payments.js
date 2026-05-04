const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Person = require('../models/Person');
const Account = require('../models/Account');

// GET all payments
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, person, direction } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23,59,59));
    }
    if (person) filter.person = person;
    if (direction) filter.direction = direction;

    const payments = await Payment.find(filter)
      .populate('person', 'name phone')
      .populate('account', 'name type')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create payment
router.post('/', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();

    // Update person balance
    // received = person paid us → reduces what they owe (reduce positive balance)
    // paid = we paid person → reduces what we owe (increase positive balance / reduce negative)
    const personDelta = payment.direction === 'received' ? -payment.amount : payment.amount;
    await Person.findByIdAndUpdate(payment.person, { $inc: { balance: personDelta } });

    // Update account balance
    const accountDelta = payment.direction === 'received' ? payment.amount : -payment.amount;
    await Account.findByIdAndUpdate(payment.account, { $inc: { balance: accountDelta } });

    await payment.populate('person', 'name phone');
    await payment.populate('account', 'name type');
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });

    // Reverse effects
    const personDelta = payment.direction === 'received' ? payment.amount : -payment.amount;
    await Person.findByIdAndUpdate(payment.person, { $inc: { balance: personDelta } });
    const accountDelta = payment.direction === 'received' ? -payment.amount : payment.amount;
    await Account.findByIdAndUpdate(payment.account, { $inc: { balance: accountDelta } });

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
