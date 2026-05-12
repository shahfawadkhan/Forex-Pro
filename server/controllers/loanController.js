const Loan = require('../models/Loan');
const { exportLoans } = require('../utils/excelExporter');

exports.getAll = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.loanType = type;
    if (status) query.status = status;
    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const summary = await Loan.aggregate([
      { $group: { _id: '$loanType', total: { $sum: '$amount' }, remaining: { $sum: '$remaining' } } }
    ]);
    res.json({ success: true, data: loans, total, summary });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: loan });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const loan = await Loan.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: loan });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(loan, req.body);
    await loan.save();
    res.json({ success: true, data: loan });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await Loan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.addRepayment = async (req, res, next) => {
  try {
    const { amount, method, notes } = req.body;
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Not found' });
    if (amount > loan.remaining) return res.status(400).json({ success: false, message: 'Repayment exceeds remaining amount' });
    loan.repayments.push({ amount, method, notes });
    await loan.save();
    res.json({ success: true, data: loan });
  } catch (err) { next(err); }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const loans = await Loan.find({}).sort({ date: -1 });
    const buffer = exportLoans(loans);
    res.setHeader('Content-Disposition', 'attachment; filename=loans.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { next(err); }
};
