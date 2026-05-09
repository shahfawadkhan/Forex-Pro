const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Person = require('../models/Person');
const Account = require('../models/Account');
const Loan = require('../models/Loan');
const VillageDeposit = require('../models/VillageDeposit');
const ExcelJS = require('exceljs');

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [persons, accounts, allLoans, villageDeposits] = await Promise.all([
      Person.find({ isActive: true }),
      Account.find({ isActive: true }),
      Loan.find({ isActive: true }),
      VillageDeposit.find({}),
    ]);

    const totalReceivable = persons.reduce((s, p) => p.balance > 0 ? s + p.balance : s, 0);
    const totalPayable    = persons.reduce((s, p) => p.balance < 0 ? s + Math.abs(p.balance) : s, 0);
    const totalAccountBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const totalAdvancePending = persons.reduce((s, p) => s + (p.advanceBalance || 0), 0);

    // Loan summaries
    const loansGiven    = allLoans.filter(l => l.direction === 'give');
    const loansTaken    = allLoans.filter(l => l.direction === 'take');
    const loanOutstanding = loansGiven.reduce((s, l) => s + (l.remaining || 0), 0);
    const loanPayable     = loansTaken.reduce((s, l) => s + (l.remaining || 0), 0);

    // Village balance
    let villageBalance = 0;
    villageDeposits.forEach(v => {
      villageBalance += v.direction === 'deposit' ? v.amount : -v.amount;
    });

    // Today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayTx = await Transaction.find({ date: { $gte: today, $lte: todayEnd }, isSARConversion: false });
    const todayProfit = todayTx.reduce((s, t) => s + (t.profit || 0), 0);
    const todayVolume  = todayTx.reduce((s, t) => s + t.totalPKR, 0);

    // Month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTx = await Transaction.find({ date: { $gte: monthStart }, isSARConversion: false });
    const monthProfit = monthTx.reduce((s, t) => s + (t.profit || 0), 0);
    const monthVolume  = monthTx.reduce((s, t) => s + t.totalPKR, 0);

    const aedToday = todayTx.filter(t => t.currency === 'AED');
    const sarToday = todayTx.filter(t => t.currency === 'SAR');

    res.json({
      totalReceivable, totalPayable,
      netBalance: totalReceivable - totalPayable,
      totalAccountBalance, totalAdvancePending,
      loanOutstanding, loanPayable, villageBalance,
      accounts,
      todayProfit, todayVolume, todayTxCount: todayTx.length,
      monthProfit, monthVolume,
      aedTodayAmount: aedToday.reduce((s, t) => s + t.amount, 0),
      sarTodayAmount: sarToday.reduce((s, t) => s + t.amount, 0),
      topPersons: persons.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Profit report ─────────────────────────────────────────────────────────────
router.get('/profit', async (req, res) => {
  try {
    const { startDate, endDate, currency } = req.query;
    let start = new Date(); let end = new Date();
    end.setHours(23, 59, 59, 999);
    if (startDate && endDate) {
      start = new Date(startDate);
      end   = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    } else {
      start.setDate(1); start.setHours(0, 0, 0, 0);
    }

    const filter = { date: { $gte: start, $lte: end }, isSARConversion: false };
    if (currency) filter.currency = currency;

    const transactions = await Transaction.find(filter)
      .populate('buyerPerson',  'name')
      .populate('sellerPerson', 'name')
      .sort({ date: -1 });

    const totalProfit = transactions.reduce((s, t) => s + (t.profit || 0), 0);
    const totalVolume = transactions.reduce((s, t) => s + t.totalPKR, 0);
    const aedVolume   = transactions.filter(t => t.currency === 'AED').reduce((s, t) => s + t.amount, 0);
    const sarVolume   = transactions.filter(t => t.currency === 'SAR').reduce((s, t) => s + t.amount, 0);

    res.json({ transactions, totalProfit, totalVolume, aedVolume, sarVolume, start, end });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Daily summary (for charts) ─────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { months = 1 } = req.query;
    const start = new Date();
    start.setMonth(start.getMonth() - Number(months));
    start.setHours(0, 0, 0, 0);

    const data = await Transaction.aggregate([
      { $match: { date: { $gte: start }, isSARConversion: false } },
      { $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
          totalProfit: { $sum: '$profit' },
          totalVolume: { $sum: '$totalPKR' },
          count:       { $sum: 1 },
          aedAmount:   { $sum: { $cond: [{ $eq: ['$currency', 'AED'] }, '$amount', 0] } },
          sarAmount:   { $sum: { $cond: [{ $eq: ['$currency', 'SAR'] }, '$amount', 0] } },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Loan report ───────────────────────────────────────────────────────────────
router.get('/loans', async (req, res) => {
  try {
    const loans = await Loan.find({ isActive: true }).populate('person', 'name phone').sort({ date: -1 });
    const given = loans.filter(l => l.direction === 'give');
    const taken = loans.filter(l => l.direction === 'take');
    res.json({
      loans,
      totalGiven:    given.reduce((s, l) => s + l.amount, 0),
      totalTaken:    taken.reduce((s, l) => s + l.amount, 0),
      totalOutstanding: given.reduce((s, l) => s + (l.remaining || 0), 0),
      totalPayable:     taken.reduce((s, l) => s + (l.remaining || 0), 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Village report ─────────────────────────────────────────────────────────
router.get('/village', async (req, res) => {
  try {
    const all = await VillageDeposit.find({}).populate('person', 'name phone').sort({ date: -1 });
    const balanceMap = {};
    all.forEach(v => {
      const pid = v.person?._id?.toString();
      if (!pid) return;
      if (!balanceMap[pid]) balanceMap[pid] = { person: v.person, balance: 0, totalDeposited: 0, totalWithdrawn: 0 };
      if (v.direction === 'deposit') { balanceMap[pid].balance += v.amount; balanceMap[pid].totalDeposited += v.amount; }
      else { balanceMap[pid].balance -= v.amount; balanceMap[pid].totalWithdrawn += v.amount; }
    });
    const summary = Object.values(balanceMap);
    const totalBalance = summary.reduce((s, x) => s + x.balance, 0);
    res.json({ deposits: all, summary, totalBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Excel export ───────────────────────────────────────────────────────────
router.get('/export-excel', async (req, res) => {
  try {
    const { startDate, endDate, type = 'transactions' } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end   = endDate   ? new Date(new Date(endDate).setHours(23, 59, 59)) : new Date();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ForexPro';

    const goldFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4A843' } };
    const headerFont = { bold: true, color: { argb: 'FF000000' }, size: 11 };
    const border = { style: 'thin', color: { argb: 'FFCCCCCC' } };
    const allBorders = { top: border, left: border, bottom: border, right: border };

    if (type === 'transactions' || type === 'all') {
      const ws = wb.addWorksheet('Transactions');
      ws.columns = [
        { header: 'Date',        key: 'date',   width: 14 },
        { header: 'Buyer',       key: 'buyer',  width: 20 },
        { header: 'Seller',      key: 'seller', width: 20 },
        { header: 'Currency',    key: 'cur',    width: 10 },
        { header: 'Amount',      key: 'amt',    width: 14 },
        { header: 'Rate',        key: 'rate',   width: 10 },
        { header: 'Total PKR',   key: 'pkr',    width: 16 },
        { header: 'Profit',      key: 'profit', width: 14 },
        { header: 'Advance',     key: 'adv',    width: 10 },
        { header: 'Payment',     key: 'pay',    width: 12 },
        { header: 'Notes',       key: 'notes',  width: 24 },
      ];
      ws.getRow(1).eachCell(cell => { cell.fill = goldFill; cell.font = headerFont; cell.border = allBorders; });

      const txns = await Transaction.find({ date: { $gte: start, $lte: end }, isSARConversion: false })
        .populate('buyerPerson sellerPerson').sort({ date: -1 });

      txns.forEach(t => {
        const row = ws.addRow({
          date:   new Date(t.date).toLocaleDateString('en-PK'),
          buyer:  t.buyerPerson?.name,
          seller: t.sellerPerson?.name,
          cur:    t.currency,
          amt:    t.amount,
          rate:   t.rate,
          pkr:    t.totalPKR,
          profit: t.profit || 0,
          adv:    t.isAdvance ? 'Yes' : 'No',
          pay:    t.paymentMethod,
          notes:  t.notes,
        });
        row.eachCell(cell => { cell.border = allBorders; });
      });
    }

    if (type === 'loans' || type === 'all') {
      const ws = wb.addWorksheet('Loans');
      ws.columns = [
        { header: 'Date',      key: 'date',   width: 14 },
        { header: 'Person',    key: 'person', width: 20 },
        { header: 'Direction', key: 'dir',    width: 12 },
        { header: 'Currency',  key: 'cur',    width: 10 },
        { header: 'Amount',    key: 'amt',    width: 14 },
        { header: 'Remaining', key: 'rem',    width: 14 },
        { header: 'Notes',     key: 'notes',  width: 24 },
      ];
      ws.getRow(1).eachCell(cell => { cell.fill = goldFill; cell.font = headerFont; cell.border = allBorders; });
      const loans = await Loan.find({ isActive: true }).populate('person', 'name').sort({ date: -1 });
      loans.forEach(l => {
        const row = ws.addRow({ date: new Date(l.date).toLocaleDateString('en-PK'), person: l.person?.name, dir: l.direction === 'give' ? 'Given' : 'Taken', cur: l.currency, amt: l.amount, rem: l.remaining, notes: l.notes });
        row.eachCell(cell => { cell.border = allBorders; });
      });
    }

    if (type === 'village' || type === 'all') {
      const ws = wb.addWorksheet('Village');
      ws.columns = [
        { header: 'Date',      key: 'date',   width: 14 },
        { header: 'Person',    key: 'person', width: 20 },
        { header: 'Type',      key: 'dir',    width: 14 },
        { header: 'Amount',    key: 'amt',    width: 14 },
        { header: 'Notes',     key: 'notes',  width: 24 },
      ];
      ws.getRow(1).eachCell(cell => { cell.fill = goldFill; cell.font = headerFont; cell.border = allBorders; });
      const deps = await VillageDeposit.find({ date: { $gte: start, $lte: end } }).populate('person', 'name').sort({ date: -1 });
      deps.forEach(v => {
        const row = ws.addRow({ date: new Date(v.date).toLocaleDateString('en-PK'), person: v.person?.name, dir: v.direction === 'deposit' ? 'Deposit' : 'Withdrawal', amt: v.amount, notes: v.notes });
        row.eachCell(cell => { cell.border = allBorders; });
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="forexpro_${type}_${new Date().toISOString().split('T')[0]}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CSV export (kept for compatibility) ───────────────────────────────────
router.get('/export-csv', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end   = endDate   ? new Date(new Date(endDate).setHours(23, 59, 59)) : new Date();

    const txns = await Transaction.find({ date: { $gte: start, $lte: end }, isSARConversion: false })
      .populate('buyerPerson sellerPerson').sort({ date: -1 });

    const headers = ['Date', 'Buyer', 'Seller', 'Currency', 'Amount', 'Rate', 'Total PKR', 'Profit', 'Advance', 'Payment Method', 'Notes'];
    const rows = txns.map(t => [
      new Date(t.date).toLocaleDateString('en-PK'),
      t.buyerPerson?.name, t.sellerPerson?.name,
      t.currency, t.amount, t.rate, t.totalPKR, t.profit || 0,
      t.isAdvance ? 'Yes' : 'No', t.paymentMethod, t.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
