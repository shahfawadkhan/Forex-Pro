const RiyalTransaction = require('../models/RiyalTransaction');
const DirhamTransaction = require('../models/DirhamTransaction');
const PKRTransaction = require('../models/PKRTransaction');
const Loan = require('../models/Loan');
const VillageAccount = require('../models/VillageAccount');
const AdvanceRecord = require('../models/AdvanceRecord');
const Profit = require('../models/Profit');

exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProfit, todayProfit,
      pendingRiyal, pendingDirham, pendingPKR,
      loans, villageBalance, advance,
      recentRiyal, recentDirham,
      dailyProfit
    ] = await Promise.all([
      Profit.aggregate([{ $match: { isReset: false } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
      Profit.aggregate([{ $match: { isReset: false, date: { $gte: today } } }, { $group: { _id: null, t: { $sum: '$amount' } } }]),
      RiyalTransaction.aggregate([{ $match: { paymentStatus: { $in: ['unpaid','partial'] } } }, { $group: { _id: null, t: { $sum: '$sellRemaining' } } }]),
      DirhamTransaction.aggregate([{ $match: { paymentStatus: { $in: ['unpaid','partial'] } } }, { $group: { _id: null, t: { $sum: '$sellRemaining' } } }]),
      PKRTransaction.aggregate([{ $match: { paymentStatus: { $in: ['unpaid','partial'] } } }, { $group: { _id: null, t: { $sum: '$remaining' } } }]),
      Loan.aggregate([{ $match: { status: { $in: ['active','overdue'] } } }, { $group: { _id: '$loanType', total: { $sum: '$remaining' } } }]),
      VillageAccount.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      AdvanceRecord.aggregate([{ $group: { _id: null, total: { $sum: '$remainingAmount' } } }]),
      RiyalTransaction.find({}).sort({ date: -1 }).limit(5).lean(),
      DirhamTransaction.find({}).sort({ date: -1 }).limit(5).lean(),
      Profit.aggregate([
        { $match: { date: { $gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const villageDeposits = villageBalance.find(v => v._id === 'deposit')?.total || 0;
    const villageWithdrawals = villageBalance.find(v => v._id === 'withdrawal')?.total || 0;
    const loansGiven = loans.find(l => l._id === 'given')?.total || 0;
    const loansTaken = loans.find(l => l._id === 'taken')?.total || 0;

    const riyalWithCurrency = recentRiyal.map(t => ({ ...t, currency: 'SAR' }));
    const dirhamWithCurrency = recentDirham.map(t => ({ ...t, currency: 'AED' }));
    const allRecent = [...riyalWithCurrency, ...dirhamWithCurrency]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        totalProfit: totalProfit[0]?.t || 0,
        todayProfit: todayProfit[0]?.t || 0,
        pendingPayments: (pendingRiyal[0]?.t || 0) + (pendingDirham[0]?.t || 0) + (pendingPKR[0]?.t || 0),
        loansGiven,
        loansTaken,
        villageBalance: villageDeposits - villageWithdrawals,
        advanceBalance: advance[0]?.total || 0,
        recentTransactions: allRecent,
        dailyProfit
      }
    });
  } catch (err) { next(err); }
};
