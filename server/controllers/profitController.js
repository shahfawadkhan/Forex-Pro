const Profit = require('../models/Profit');
const RiyalTransaction = require('../models/RiyalTransaction');
const DirhamTransaction = require('../models/DirhamTransaction');
const PKRTransaction = require('../models/PKRTransaction');

exports.getSummary = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, todayP, monthly, byCurrency] = await Promise.all([
      Profit.aggregate([{ $match: { isReset: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Profit.aggregate([{ $match: { isReset: false, date: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Profit.aggregate([{ $match: { isReset: false, date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Profit.aggregate([{ $match: { isReset: false } }, { $group: { _id: '$source', total: { $sum: '$amount' } } }])
    ]);

    const monthlyTrend = await Profit.aggregate([
      { $match: { isReset: false } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        total: total[0]?.total || 0,
        today: todayP[0]?.total || 0,
        monthly: monthly[0]?.total || 0,
        byCurrency, monthlyTrend
      }
    });
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, source, page = 1, limit = 20 } = req.query;
    const query = { isReset: false };
    if (source) query.source = source;
    if (startDate || endDate) { query.date = {}; if (startDate) query.date.$gte = new Date(startDate); if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59'); }
    const total = await Profit.countDocuments(query);
    const records = await Profit.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data: records, total });
  } catch (err) { next(err); }
};

exports.reset = async (req, res, next) => {
  try {
    await Profit.updateMany({ isReset: false }, { isReset: true });
    res.json({ success: true, message: 'Profit reset successfully' });
  } catch (err) { next(err); }
};

exports.toggleHide = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    user.settings.profitHidden = !user.settings.profitHidden;
    await user.save();
    res.json({ success: true, profitHidden: user.settings.profitHidden });
  } catch (err) { next(err); }
};
