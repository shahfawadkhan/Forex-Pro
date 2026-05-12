const VillageAccount = require('../models/VillageAccount');
const { exportVillage } = require('../utils/excelExporter');

exports.getAll = async (req, res, next) => {
  try {
    const { personName, page = 1, limit = 20 } = req.query;
    const query = {};
    if (personName) query.personName = { $regex: personName, $options: 'i' };
    const total = await VillageAccount.countDocuments(query);
    const transactions = await VillageAccount.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const summary = await VillageAccount.aggregate([
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    const deposits = summary.find(s => s._id === 'deposit')?.total || 0;
    const withdrawals = summary.find(s => s._id === 'withdrawal')?.total || 0;
    res.json({ success: true, data: transactions, total, balance: deposits - withdrawals, deposits, withdrawals });
  } catch (err) { next(err); }
};

exports.addTransaction = async (req, res, next) => {
  try {
    const { personName, type, amount, notes } = req.body;
    const prev = await VillageAccount.findOne({}).sort({ date: -1 });
    const prevBalance = prev?.balanceAfter || 0;
    const balanceAfter = type === 'deposit' ? prevBalance + amount : prevBalance - amount;
    if (balanceAfter < 0) return res.status(400).json({ success: false, message: 'Insufficient balance for withdrawal' });
    const tx = await VillageAccount.create({ personName, type, amount, balanceAfter, notes, createdBy: req.user._id });
    res.status(201).json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await VillageAccount.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const txs = await VillageAccount.find({}).sort({ date: -1 });
    const buffer = exportVillage(txs);
    res.setHeader('Content-Disposition', 'attachment; filename=village-account.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { next(err); }
};

exports.getPersonStatement = async (req, res, next) => {
  try {
    const { personName } = req.params;
    const txs = await VillageAccount.find({ personName: { $regex: personName, $options: 'i' } }).sort({ date: 1 });
    const deposits = txs.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const withdrawals = txs.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    res.json({ success: true, data: txs, deposits, withdrawals, balance: deposits - withdrawals });
  } catch (err) { next(err); }
};
