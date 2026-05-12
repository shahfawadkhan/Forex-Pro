const DirhamTransaction = require('../models/DirhamTransaction');
const Profit = require('../models/Profit');
const { exportDirham } = require('../utils/excelExporter');

exports.getAll = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;
    if (startDate || endDate) { query.date = {}; if (startDate) query.date.$gte = new Date(startDate); if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59'); }
    if (search) query.$or = [{ buyPerson: { $regex: search, $options: 'i' } }, { sellPerson: { $regex: search, $options: 'i' } }];
    const total = await DirhamTransaction.countDocuments(query);
    const transactions = await DirhamTransaction.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const ledger = await DirhamTransaction.aggregate([{ $group: { _id: null, totalWeOwe: { $sum: '$weOweAmount' }, totalTheyOwe: { $sum: '$theyOweAmount' }, totalProfit: { $sum: '$profit' } } }]);
    res.json({ success: true, data: transactions, total, page: Number(page), pages: Math.ceil(total / limit), ledger: ledger[0] || {} });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const tx = await DirhamTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const tx = await DirhamTransaction.create({ ...req.body, createdBy: req.user._id });
    if (tx.profit > 0) await Profit.create({ source: 'dirham', amount: tx.profit, transactionRef: tx._id, sourceModel: 'DirhamTransaction', createdBy: req.user._id });
    res.status(201).json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const tx = await DirhamTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(tx, req.body);
    await tx.save();
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await DirhamTransaction.findByIdAndDelete(req.params.id);
    await Profit.deleteMany({ transactionRef: req.params.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.makePayment = async (req, res, next) => {
  try {
    const { buyAmountPaid, sellAmountPaid, notes } = req.body;
    const tx = await DirhamTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Not found' });
    if (buyAmountPaid) tx.buyAmountPaid += Number(buyAmountPaid);
    if (sellAmountPaid) tx.sellAmountPaid += Number(sellAmountPaid);
    await tx.save();
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const transactions = await DirhamTransaction.find({}).sort({ date: -1 });
    const buffer = exportDirham(transactions);
    res.setHeader('Content-Disposition', 'attachment; filename=dirham-transactions.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { next(err); }
};
