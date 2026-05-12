const DirectPayment = require('../models/DirectPayment');
const AdvanceRecord = require('../models/AdvanceRecord');
const Profit = require('../models/Profit');

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

    if (!personName || !amount || !rate)
      return res.status(400).json({ success: false, message: 'personName, amount and rate are required' });

    let record = await DirectPayment.findOne({
      personName: { $regex: `^${personName.trim()}$`, $options: 'i' }
    });
    if (!record) record = new DirectPayment({ personName: personName.trim(), createdBy: req.user._id });

    const amt = Number(amount);
    const rt  = Number(rate);
    record.deposits.push({ amount: amt, rate: rt, pkrValue: amt * rt, notes: notes || '' });
    record.recalculate();
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

// ─── CONVERSION ──────────────────────────────────────────────────────────────
// Workflow:
//   1. We BOUGHT QAR from person (direct payment, buy rate = weighted avg rate)
//   2. inputAmount × 0.95 = convertedAmount (AED equivalent to pay)
//   3. convertedAmount is deducted from advance record (sell rate)
//   4. Profit = convertedAmount × (sellRate − buyRate)
//
// Example: Fawad deposited 5000 QAR @ Rs76.30 (buy rate)
//          5000 × 0.95 = 4750 AED to pay from Ihsan's advance @ Rs76.60 (sell rate)
//          Profit = 4750 × (76.60 − 76.30) = Rs1,425
exports.convert = async (req, res, next) => {
  try {
    const { personId, inputAmount, factor = 0.95, advanceDeductions } = req.body;

    if (!personId || !inputAmount)
      return res.status(400).json({ success: false, message: 'personId and inputAmount are required' });

    if (!advanceDeductions || advanceDeductions.length === 0)
      return res.status(400).json({ success: false, message: 'Select at least one advance record to pay from' });

    const dpRecord = await DirectPayment.findById(personId);
    if (!dpRecord)
      return res.status(404).json({ success: false, message: 'Direct payment person not found' });

    const amt       = Number(inputAmount);
    const fct       = Number(factor) || 0.95;
    const converted = +(amt * fct).toFixed(4);        // e.g. 5000 × 0.95 = 4750
    const buyRate   = dpRecord.weightedAvgRate || 0;   // rate we bought QAR at

    if (amt > (dpRecord.remainingBalance || 0))
      return res.status(400).json({
        success: false,
        message: `Amount (${amt}) exceeds remaining balance (${dpRecord.remainingBalance})`
      });

    // Process each advance deduction
    let totalAdvancePKR = 0;
    let sellRate        = 0;

    for (const ded of advanceDeductions) {
      if (!ded.advanceId || !ded.aedAmount) continue;

      const adv = await AdvanceRecord.findById(ded.advanceId);
      if (!adv)
        return res.status(404).json({ success: false, message: `Advance record not found: ${ded.advanceId}` });

      const deductAmt = Number(ded.aedAmount);
      if (deductAmt > (adv.remainingAmount || 0))
        return res.status(400).json({
          success: false,
          message: `Deduction ${deductAmt} AED exceeds remaining ${adv.remainingAmount} AED for ${adv.personName}`
        });

      sellRate         = adv.rate || 0;   // rate we sold AED at
      totalAdvancePKR += deductAmt * sellRate;

      adv.usedAmount = (Number(adv.usedAmount) || 0) + deductAmt;
      adv.deductions.push({
        aedAmount: deductAmt,
        notes: `Conversion — paid to ${dpRecord.personName}`
      });
      await adv.save();
    }

    // Deduct from direct payment record
    dpRecord.totalUsed = (Number(dpRecord.totalUsed) || 0) + amt;
    dpRecord.recalculate();
    await dpRecord.save();

    // Profit:
    //   Cost    = converted × buyRate  (what the QAR cost us in PKR)
    //   Revenue = converted × sellRate (what we get from advance side in PKR)
    //   Profit  = revenue − cost
    const costPKR    = converted * buyRate;
    const revenuePKR = converted * sellRate;
    const netProfit  = revenuePKR - costPKR;

    // Save profit record
    if (Math.abs(netProfit) > 0) {
      await Profit.create({
        source: 'conversion',
        amount: netProfit,
        currency: 'PKR',
        notes: `QAR→AED: ${amt} QAR × ${fct} = ${converted} AED | Buy Rs${buyRate.toFixed(4)} Sell Rs${sellRate.toFixed(4)}`,
        createdBy: req.user._id
      });
    }

    res.json({
      success: true,
      data: {
        inputAmount:     amt,
        factor:          fct,
        convertedAmount: converted,
        buyRate,
        sellRate,
        costPKR,
        revenuePKR,
        netProfit,
        dpRemaining:     dpRecord.remainingBalance
      }
    });
  } catch (err) { next(err); }
};

// ─── DELETE SINGLE DEPOSIT ───────────────────────────────────────────────────
// Removes one deposit entry. If it was the last deposit AND no usage exists,
// the entire person record is also deleted.
exports.deleteDeposit = async (req, res, next) => {
  try {
    const { id, depositId } = req.params;
    const record = await DirectPayment.findById(id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });

    const before = record.deposits.length;
    record.deposits = record.deposits.filter(d => d._id.toString() !== depositId);

    if (record.deposits.length === before)
      return res.status(404).json({ success: false, message: 'Deposit entry not found' });

    // Delete entire person record if no deposits left AND never used
    if (record.deposits.length === 0 && (Number(record.totalUsed) || 0) === 0) {
      await DirectPayment.findByIdAndDelete(id);
      return res.json({ success: true, deleted: true, message: 'Last deposit removed — person record deleted' });
    }

    record.recalculate();
    await record.save();
    res.json({ success: true, deleted: false, data: record });
  } catch (err) { next(err); }
};

// ─── DELETE ENTIRE PERSON RECORD ─────────────────────────────────────────────
exports.deletePerson = async (req, res, next) => {
  try {
    const record = await DirectPayment.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: `Person "${record.personName}" and all deposits deleted` });
  } catch (err) { next(err); }
};