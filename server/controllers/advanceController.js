const AdvanceRecord = require('../models/AdvanceRecord');

exports.getAll = async (req, res, next) => {
  try {
    const records = await AdvanceRecord.find({}).sort({ date: -1 });
    const totals = await AdvanceRecord.aggregate([{
      $group: { _id: null, totalAED: { $sum: '$aedAmount' }, totalUsed: { $sum: '$usedAmount' }, totalRemaining: { $sum: '$remainingAmount' } }
    }]);
    res.json({ success: true, data: records, totals: totals[0] || {} });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const record = await AdvanceRecord.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const record = await AdvanceRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(record, req.body);
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await AdvanceRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

exports.deduct = async (req, res, next) => {
  try {
    const { aedAmount, linkedConversionId, notes } = req.body;
    const record = await AdvanceRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    if (aedAmount > record.remainingAmount) return res.status(400).json({ success: false, message: 'Deduction exceeds remaining' });
    record.usedAmount += Number(aedAmount);
    record.deductions.push({ aedAmount, linkedConversionId, notes });
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};
