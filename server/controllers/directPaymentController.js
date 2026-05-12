const DirectPayment = require('../models/DirectPayment');
const { calculateWeightedRate } = require('../utils/profitCalculator');

exports.getAll = async (req, res, next) => {
  try {
    const records = await DirectPayment.find({}).sort({ updatedAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const record = await DirectPayment.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.addDeposit = async (req, res, next) => {
  try {
    const { personName, amount, rate, notes } = req.body;
    let record = await DirectPayment.findOne({ personName: new RegExp(`^${personName}$`, 'i') });
    if (!record) record = new DirectPayment({ personName, createdBy: req.user._id });
    record.deposits.push({ amount, rate, pkrValue: amount * rate, notes });
    record.recalculate();
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

exports.convert = async (req, res, next) => {
  try {
    const { personId, inputAmount, factor = 0.95, advanceDeductions } = req.body;
    const record = await DirectPayment.findById(personId);
    if (!record) return res.status(404).json({ success: false, message: 'Person not found' });
    const convertedAmount = inputAmount * factor;
    const pkrValue = convertedAmount * record.weightedAvgRate;
    let advanceTotalPKR = 0;
    if (advanceDeductions && advanceDeductions.length > 0) {
      const AdvanceRecord = require('../models/AdvanceRecord');
      for (const ded of advanceDeductions) {
        const adv = await AdvanceRecord.findById(ded.advanceId);
        if (adv) {
          advanceTotalPKR += ded.aedAmount * adv.rate;
          adv.usedAmount += ded.aedAmount;
          await adv.save();
        }
      }
    }
    record.totalUsed += inputAmount;
    record.recalculate();
    await record.save();
    res.json({ success: true, data: { inputAmount, convertedAmount, pkrValue, advanceTotalPKR, netProfit: pkrValue - advanceTotalPKR, weightedAvgRate: record.weightedAvgRate } });
  } catch (err) { next(err); }
};

exports.deleteDeposit = async (req, res, next) => {
  try {
    const { depositId } = req.params;
    const record = await DirectPayment.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    record.deposits = record.deposits.filter(d => d._id.toString() !== depositId);
    record.recalculate();
    await record.save();
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
};
