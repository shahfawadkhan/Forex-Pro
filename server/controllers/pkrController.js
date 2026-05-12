const PKRTransaction = require('../models/PKRTransaction');
const Profit = require('../models/Profit');

exports.getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;
    if (search) query.$or = [{ buyPerson: { $regex: search, $options: 'i' } }, { sellPerson: { $regex: search, $options: 'i' } }];
    const total = await PKRTransaction.countDocuments(query);
    const transactions = await PKRTransaction.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data: transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const tx = await PKRTransaction.create({ ...req.body, createdBy: req.user._id });
    if (tx.profit > 0) await Profit.create({ source: 'pkr', amount: tx.profit, transactionRef: tx._id, sourceModel: 'PKRTransaction', createdBy: req.user._id });
    res.status(201).json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const tx = await PKRTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(tx, req.body);
    await tx.save();
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await PKRTransaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.makePayment = async (req, res, next) => {
  try {
    const { amountPaid } = req.body;
    const tx = await PKRTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Not found' });
    tx.amountPaid += Number(amountPaid);
    await tx.save();
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};
