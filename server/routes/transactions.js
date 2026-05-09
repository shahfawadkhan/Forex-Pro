const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Person = require('../models/Person');

const SAR_TO_AED = 0.95000;

// Helper: update both persons' balances after a transaction
async function applyBalances(tx, multiplier = 1) {
  // buyer owes us totalPKR (positive = they owe us)
  // seller is owed totalPKR by us (negative = we owe them) → their balance decreases
  const field = tx.isAdvance ? 'advanceBalance' : 'balance';
  await Person.findByIdAndUpdate(tx.buyerPerson,  { $inc: { [field]: multiplier * tx.totalPKR } });
  await Person.findByIdAndUpdate(tx.sellerPerson, { $inc: { [field]: multiplier * -tx.totalPKR } });
}

// GET all transactions with filters
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, buyerPerson, sellerPerson, person, currency, type, isAdvance, page = 1, limit = 50 } = req.query;
    const filter = { isSARConversion: false }; // hide shadow SAR records from main list

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    // person filter matches either buyer or seller
    if (person) filter.$or = [{ buyerPerson: person }, { sellerPerson: person }];
    else {
      if (buyerPerson)  filter.buyerPerson  = buyerPerson;
      if (sellerPerson) filter.sellerPerson = sellerPerson;
    }
    if (currency)  filter.currency  = currency;
    if (isAdvance !== undefined && isAdvance !== '') filter.isAdvance = isAdvance === 'true';

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate('buyerPerson',  'name phone')
      .populate('sellerPerson', 'name phone')
      .populate('account', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create transaction
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };
    // Remove old single-person field if frontend sends it
    delete body.person;
    delete body.buyingRate;
    delete body.sellingRate;
    delete body.type; // no longer needed — buyer/seller defines direction

    const tx = new Transaction(body);
    await tx.save();
    await applyBalances(tx, 1);

    // If SAR, auto-create AED shadow record
    if (tx.currency === 'SAR' && !tx.isSARConversion) {
      const aedAmount = tx.amount * SAR_TO_AED;
      const shadow = new Transaction({
        date:             tx.date,
        buyerPerson:      tx.buyerPerson,
        sellerPerson:     tx.sellerPerson,
        currency:         'AED',
        amount:           aedAmount,
        rate:             tx.rate,
        totalPKR:         aedAmount * tx.rate,
        profit:           0,
        isSARConversion:  true,
        sarConversionRef: tx._id,
        isAdvance:        tx.isAdvance,
        paymentMethod:    tx.paymentMethod,
        account:          tx.account,
        notes:            `SAR→AED conversion (×${SAR_TO_AED}) of txn ${tx._id}`,
        createdBy:        tx.createdBy,
      });
      await shadow.save();
      // Shadow does NOT double-count person balances (already covered by main SAR tx)
    }

    await tx.populate('buyerPerson sellerPerson account');
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update transaction
router.put('/:id', async (req, res) => {
  try {
    const old = await Transaction.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Transaction not found' });

    // Reverse old balance effect
    await applyBalances(old, -1);

    // Delete old SAR shadow if exists
    await Transaction.deleteMany({ sarConversionRef: old._id });

    const body = { ...req.body };
    delete body.person; delete body.buyingRate; delete body.sellingRate; delete body.type;

    const updated = await Transaction.findByIdAndUpdate(req.params.id, body, { new: true });
    await updated.save(); // triggers pre-save for totalPKR
    await applyBalances(updated, 1);

    // Re-create SAR shadow if needed
    if (updated.currency === 'SAR' && !updated.isSARConversion) {
      const aedAmount = updated.amount * SAR_TO_AED;
      const shadow = new Transaction({
        date:             updated.date,
        buyerPerson:      updated.buyerPerson,
        sellerPerson:     updated.sellerPerson,
        currency:         'AED',
        amount:           aedAmount,
        rate:             updated.rate,
        totalPKR:         aedAmount * updated.rate,
        profit:           0,
        isSARConversion:  true,
        sarConversionRef: updated._id,
        isAdvance:        updated.isAdvance,
        paymentMethod:    updated.paymentMethod,
        account:          updated.account,
        notes:            `SAR→AED conversion (×${SAR_TO_AED})`,
        createdBy:        updated.createdBy,
      });
      await shadow.save();
    }

    await updated.populate('buyerPerson sellerPerson account');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Not found' });

    await applyBalances(tx, -1);
    await Transaction.deleteMany({ sarConversionRef: tx._id }); // delete shadow
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
