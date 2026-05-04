const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Person = require('../models/Person');
const Account = require('../models/Account');

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const persons = await Person.find({ isActive: true });
    const accounts = await Account.find({ isActive: true });

    const totalReceivable = persons.reduce((sum, p) => p.balance > 0 ? sum + p.balance : sum, 0);
    const totalPayable = persons.reduce((sum, p) => p.balance < 0 ? sum + Math.abs(p.balance) : sum, 0);
    const totalAccountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTx = await Transaction.find({ date: { $gte: today, $lte: todayEnd } });
    const todayProfit = todayTx.reduce((sum, t) => sum + (t.profit || 0), 0);
    const todayVolume = todayTx.reduce((sum, t) => sum + t.totalPKR, 0);

    // This month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTx = await Transaction.find({ date: { $gte: monthStart } });
    const monthProfit = monthTx.reduce((sum, t) => sum + (t.profit || 0), 0);
    const monthVolume = monthTx.reduce((sum, t) => sum + t.totalPKR, 0);

    // AED vs SAR breakdown today
    const aedToday = todayTx.filter(t => t.currency === 'AED');
    const sarToday = todayTx.filter(t => t.currency === 'SAR');

    res.json({
      totalReceivable,
      totalPayable,
      netBalance: totalReceivable - totalPayable,
      totalAccountBalance,
      accounts,
      todayProfit,
      todayVolume,
      todayTxCount: todayTx.length,
      monthProfit,
      monthVolume,
      aedTodayAmount: aedToday.reduce((s, t) => s + t.amount, 0),
      sarTodayAmount: sarToday.reduce((s, t) => s + t.amount, 0),
      topPersons: persons.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profit report
router.get('/profit', async (req, res) => {
  try {
    const { period, startDate, endDate, currency } = req.query;
    
    let start, end = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(new Date(endDate).setHours(23,59,59,999));
    } else {
      start = new Date();
      if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
      } else if (period === 'weekly') {
        start.setDate(start.getDate() - 7);
      } else if (period === 'monthly') {
        start.setDate(1); start.setHours(0,0,0,0);
      } else {
        start.setDate(1); start.setHours(0,0,0,0);
      }
    }

    const filter = { date: { $gte: start, $lte: end } };
    if (currency) filter.currency = currency;

    const transactions = await Transaction.find(filter)
      .populate('person', 'name')
      .sort({ date: -1 });

    const totalProfit = transactions.reduce((s, t) => s + (t.profit || 0), 0);
    const totalVolume = transactions.reduce((s, t) => s + t.totalPKR, 0);
    const aedVolume = transactions.filter(t=>t.currency==='AED').reduce((s,t)=>s+t.amount,0);
    const sarVolume = transactions.filter(t=>t.currency==='SAR').reduce((s,t)=>s+t.amount,0);

    res.json({ transactions, totalProfit, totalVolume, aedVolume, sarVolume, start, end });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summary by period (group by day)
router.get('/summary', async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const start = new Date();
    start.setMonth(start.getMonth() - Number(months));
    start.setHours(0,0,0,0);

    const data = await Transaction.aggregate([
      { $match: { date: { $gte: start } } },
      {
        $group: {
          _id: { 
            year: { $year: '$date' }, 
            month: { $month: '$date' }, 
            day: { $dayOfMonth: '$date' } 
          },
          totalProfit: { $sum: '$profit' },
          totalVolume: { $sum: '$totalPKR' },
          count: { $sum: 1 },
          aedAmount: { $sum: { $cond: [{ $eq: ['$currency', 'AED'] }, '$amount', 0] } },
          sarAmount: { $sum: { $cond: [{ $eq: ['$currency', 'SAR'] }, '$amount', 0] } },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
