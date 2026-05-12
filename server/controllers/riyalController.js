const RiyalTransaction = require('../models/RiyalTransaction');
const Profit = require('../models/Profit');
const { exportRiyal } = require('../utils/excelExporter');

exports.getAll = async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (status) query.paymentStatus = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59');
    }
    if (search) {
      query.$or = [
        { buyPerson: { $regex: search, $options: 'i' } },
        { sellPerson: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await RiyalTransaction.countDocuments(query);
    const transactions = await RiyalTransaction.find(query)
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const ledger = await RiyalTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalWeOwe: { $sum: '$weOweAmount' },
          totalTheyOwe: { $sum: '$theyOweAmount' },
          totalProfit: { $sum: '$profit' }
        }
      }
    ]);

    res.json({
      success: true,
      data: transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      ledger: ledger[0] || { totalWeOwe: 0, totalTheyOwe: 0, totalProfit: 0 }
    });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const tx = await RiyalTransaction.findById(req.params.id).lean();
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const tx = new RiyalTransaction({ ...req.body, createdBy: req.user._id });
    await tx.save();

    if (tx.profit > 0) {
      await Profit.create({
        source: 'riyal',
        amount: tx.profit,
        transactionRef: tx._id,
        sourceModel: 'RiyalTransaction',
        createdBy: req.user._id
      });
    }

    res.status(201).json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const tx = await RiyalTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(tx, req.body);
    await tx.save();
    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await RiyalTransaction.findByIdAndDelete(req.params.id);
    await Profit.deleteMany({ transactionRef: req.params.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

exports.makePayment = async (req, res, next) => {
  try {
    const { buyAmountPaid, sellAmountPaid, notes } = req.body;
    const tx = await RiyalTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Not found' });

    if (buyAmountPaid) tx.buyAmountPaid = (tx.buyAmountPaid || 0) + Number(buyAmountPaid);
    if (sellAmountPaid) tx.sellAmountPaid = (tx.sellAmountPaid || 0) + Number(sellAmountPaid);

    const paid = (Number(buyAmountPaid) || 0) + (Number(sellAmountPaid) || 0);
    if (paid > 0) tx.paymentHistory.push({ amount: paid, notes });

    await tx.save();
    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const transactions = await RiyalTransaction.find({}).sort({ date: -1 }).lean();
    const buffer = exportRiyal(transactions);
    res.setHeader('Content-Disposition', 'attachment; filename=riyal-transactions.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};