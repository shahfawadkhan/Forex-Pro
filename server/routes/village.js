const express = require('express');
const router = express.Router();
const VillageDeposit = require('../models/VillageDeposit');
const Person = require('../models/Person');

// GET all village deposits (grouped by person balances)
router.get('/', async (req, res) => {
  try {
    const { person, startDate, endDate } = req.query;
    const filter = {};
    if (person) filter.person = person;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const deposits = await VillageDeposit.find(filter)
      .populate('person', 'name phone')
      .sort({ date: -1 });

    // Per-person balance summary
    const balanceMap = {};
    deposits.forEach(d => {
      const pid = d.person?._id?.toString();
      if (!pid) return;
      if (!balanceMap[pid]) balanceMap[pid] = { person: d.person, balance: 0, deposits: 0, withdrawals: 0 };
      if (d.direction === 'deposit') {
        balanceMap[pid].balance    += d.amount;
        balanceMap[pid].deposits   += d.amount;
      } else {
        balanceMap[pid].balance    -= d.amount;
        balanceMap[pid].withdrawals += d.amount;
      }
    });
    const summary = Object.values(balanceMap).sort((a, b) => b.balance - a.balance);
    const totalBalance = summary.reduce((s, x) => s + x.balance, 0);

    res.json({ deposits, summary, totalBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create deposit/withdrawal
router.post('/', async (req, res) => {
  try {
    const dep = new VillageDeposit(req.body);
    await dep.save();
    await dep.populate('person', 'name phone');
    res.status(201).json(dep);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await VillageDeposit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
