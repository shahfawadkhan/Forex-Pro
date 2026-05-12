const RiyalTransaction = require('../models/RiyalTransaction');
const DirhamTransaction = require('../models/DirhamTransaction');
const Loan = require('../models/Loan');
const VillageAccount = require('../models/VillageAccount');
const Profit = require('../models/Profit');
const { exportRiyal, exportDirham, exportLoans, exportVillage, generateExcel } = require('../utils/excelExporter');

const buildDateQuery = (startDate, endDate) => {
  const q = {};
  if (startDate) q.$gte = new Date(startDate);
  if (endDate) q.$lte = new Date(endDate + 'T23:59:59');
  return Object.keys(q).length ? q : undefined;
};

exports.generate = async (req, res, next) => {
  try {
    const { type, startDate, endDate, format } = req.body;
    const dateQ = buildDateQuery(startDate, endDate);
    let data, buffer, filename;

    if (type === 'riyal') {
      data = await RiyalTransaction.find(dateQ ? { date: dateQ } : {}).sort({ date: -1 });
      buffer = exportRiyal(data);
      filename = 'riyal-report.xlsx';
    } else if (type === 'dirham') {
      data = await DirhamTransaction.find(dateQ ? { date: dateQ } : {}).sort({ date: -1 });
      buffer = exportDirham(data);
      filename = 'dirham-report.xlsx';
    } else if (type === 'loans') {
      data = await Loan.find({}).sort({ date: -1 });
      buffer = exportLoans(data);
      filename = 'loans-report.xlsx';
    } else if (type === 'village') {
      data = await VillageAccount.find(dateQ ? { date: dateQ } : {}).sort({ date: -1 });
      buffer = exportVillage(data);
      filename = 'village-report.xlsx';
    } else if (type === 'profit') {
      data = await Profit.find(dateQ ? { date: dateQ, isReset: false } : { isReset: false }).sort({ date: -1 });
      const headers = ['Date','Source','Amount','Currency','Notes'];
      const rows = data.map(p => ({ Date: new Date(p.date).toLocaleDateString(), Source: p.source, Amount: p.amount, Currency: p.currency, Notes: p.notes || '' }));
      buffer = generateExcel(rows, headers, 'Profit Report');
      filename = 'profit-report.xlsx';
    } else {
      return res.status(400).json({ success: false, message: 'Unknown report type' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { next(err); }
};
