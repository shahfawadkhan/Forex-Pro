const Person = require('../models/Person');
const DirhamTransaction = require('../models/DirhamTransaction');
const RiyalTransaction  = require('../models/RiyalTransaction');
const PKRTransaction    = require('../models/PKRTransaction');

// ─── List all persons ─────────────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { search, active } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (active !== undefined) query.active = active === 'true';

    const persons = await Person.find(query).sort({ name: 1 });
    res.json({ success: true, data: persons });
  } catch (err) { next(err); }
};

// ─── Create ───────────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const person = await Person.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: person });
  } catch (err) { next(err); }
};

// ─── Update ───────────────────────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const person = await Person.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!person) return res.status(404).json({ success: false, message: 'Person not found' });
    res.json({ success: true, data: person });
  } catch (err) { next(err); }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
exports.delete = async (req, res, next) => {
  try {
    await Person.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─── Get one person + their full ledger across all currencies ─────────────────
exports.getOne = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) return res.status(404).json({ success: false, message: 'Not found' });

    const name = person.name;

    // --- Dirham ---
    const dirhamTx = await DirhamTransaction.find({
      $or: [
        { buyPerson: { $regex: `^${name}$`, $options: 'i' } },
        { sellPerson: { $regex: `^${name}$`, $options: 'i' } }
      ]
    }).sort({ date: -1 });

    let dirhamOwes = 0, dirhamOwed = 0, dirhamProfit = 0;
    for (const tx of dirhamTx) {
      const isBuyer  = tx.buyPerson.toLowerCase()  === name.toLowerCase();
      const isSeller = tx.sellPerson.toLowerCase() === name.toLowerCase();
      if (isBuyer)  dirhamOwes  += tx.weOweAmount  || 0;
      if (isSeller) dirhamOwed  += tx.theyOweAmount || 0;
      dirhamProfit += tx.profit || 0;
    }

    // --- Riyal ---
    const riyalTx = await RiyalTransaction.find({
      $or: [
        { buyPerson: { $regex: `^${name}$`, $options: 'i' } },
        { sellPerson: { $regex: `^${name}$`, $options: 'i' } }
      ]
    }).sort({ date: -1 });

    let riyalOwes = 0, riyalOwed = 0, riyalProfit = 0;
    for (const tx of riyalTx) {
      const isBuyer  = tx.buyPerson.toLowerCase()  === name.toLowerCase();
      const isSeller = tx.sellPerson.toLowerCase() === name.toLowerCase();
      if (isBuyer)  riyalOwes  += tx.weOweAmount  || 0;
      if (isSeller) riyalOwed  += tx.theyOweAmount || 0;
      riyalProfit += tx.profit || 0;
    }

    // --- PKR ---
    const pkrTx = await PKRTransaction.find({
      $or: [
        { buyPerson: { $regex: `^${name}$`, $options: 'i' } },
        { sellPerson: { $regex: `^${name}$`, $options: 'i' } }
      ]
    }).sort({ date: -1 });

    let pkrOwes = 0, pkrOwed = 0, pkrProfit = 0;
    for (const tx of pkrTx) {
      const isBuyer  = tx.buyPerson.toLowerCase()  === name.toLowerCase();
      const isSeller = tx.sellPerson.toLowerCase() === name.toLowerCase();
      if (isBuyer)  pkrOwes += tx.remaining || 0;
      if (isSeller) pkrOwed += tx.remaining || 0;
      pkrProfit += tx.profit || 0;
    }

    res.json({
      success: true,
      data: person,
      ledger: {
        dirham: { owes: dirhamOwes, owed: dirhamOwed, profit: dirhamProfit, txCount: dirhamTx.length },
        riyal:  { owes: riyalOwes,  owed: riyalOwed,  profit: riyalProfit,  txCount: riyalTx.length  },
        pkr:    { owes: pkrOwes,    owed: pkrOwed,    profit: pkrProfit,    txCount: pkrTx.length    }
      },
      transactions: {
        dirham: dirhamTx,
        riyal:  riyalTx,
        pkr:    pkrTx
      }
    });
  } catch (err) { next(err); }
};
