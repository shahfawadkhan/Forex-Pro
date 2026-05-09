const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');

// GET all loans
router.get('/', async (req, res) => {
  try {
    const { person, direction, isActive } = req.query;
    const filter = {};
    if (person)    filter.person    = person;
    if (direction) filter.direction = direction;
    if (isActive !== undefined) filter.isActive = isActive !== 'false';

    const loans = await Loan.find(filter)
      .populate('person', 'name phone')
      .sort({ date: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single loan
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('person', 'name phone');
    if (!loan) return res.status(404).json({ error: 'Not found' });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create loan
router.post('/', async (req, res) => {
  try {
    const loan = new Loan({ ...req.body, remaining: req.body.amount });
    await loan.save();
    await loan.populate('person', 'name phone');
    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST add repayment
router.post('/:id/repay', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Not found' });

    loan.repayments.push({
      date:     req.body.date || new Date(),
      amount:   Number(req.body.amount),
      currency: req.body.currency || 'PKR',
      notes:    req.body.notes || '',
    });
    await loan.save(); // pre-save updates remaining
    await loan.populate('person', 'name phone');
    res.json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE repayment
router.delete('/:id/repay/:repayId', async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Not found' });
    loan.repayments = loan.repayments.filter(r => r._id.toString() !== req.params.repayId);
    await loan.save();
    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update loan
router.put('/:id', async (req, res) => {
  try {
    const loan = await Loan.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('person', 'name phone');
    res.json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE loan (soft)
router.delete('/:id', async (req, res) => {
  try {
    await Loan.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
