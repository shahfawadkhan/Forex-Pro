const XLSX = require('xlsx');

exports.generateExcel = (data, headers, sheetName = 'Report') => {
  const wsData = [headers, ...data.map(row => headers.map(h => row[h] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

exports.exportRiyal = (transactions) => {
  const headers = ['Date','Buy Person','Sell Person','Buy Amount','Buy Rate','Buy Total','Sell Amount','Sell Rate','Sell Total','Profit','Status','Remaining'];
  const data = transactions.map(t => ({
    'Date': new Date(t.date).toLocaleDateString(),
    'Buy Person': t.buyPerson, 'Sell Person': t.sellPerson,
    'Buy Amount': t.buyAmount, 'Buy Rate': t.buyRate, 'Buy Total': t.buyTotal,
    'Sell Amount': t.sellAmount, 'Sell Rate': t.sellRate, 'Sell Total': t.sellTotal,
    'Profit': t.profit, 'Status': t.paymentStatus, 'Remaining': t.sellRemaining
  }));
  return exports.generateExcel(data, headers, 'Riyal Transactions');
};

exports.exportDirham = (transactions) => {
  const headers = ['Date','Buy Person','Sell Person','Buy AED','Buy Rate','Sell AED','Sell Rate','Profit','Status'];
  const data = transactions.map(t => ({
    'Date': new Date(t.date).toLocaleDateString(),
    'Buy Person': t.buyPerson, 'Sell Person': t.sellPerson,
    'Buy AED': t.buyAmount, 'Buy Rate': t.buyRate,
    'Sell AED': t.sellAmount, 'Sell Rate': t.sellRate,
    'Profit': t.profit, 'Status': t.paymentStatus
  }));
  return exports.generateExcel(data, headers, 'Dirham Transactions');
};

exports.exportLoans = (loans) => {
  const headers = ['Date','Person','Type','Amount','Currency','Repaid','Remaining','Status'];
  const data = loans.map(l => ({
    'Date': new Date(l.date).toLocaleDateString(),
    'Person': l.personName, 'Type': l.loanType, 'Amount': l.amount,
    'Currency': l.currency, 'Repaid': l.totalRepaid, 'Remaining': l.remaining, 'Status': l.status
  }));
  return exports.generateExcel(data, headers, 'Loans');
};

exports.exportVillage = (txs) => {
  const headers = ['Date','Person','Type','Amount','Balance After','Notes'];
  const data = txs.map(t => ({
    'Date': new Date(t.date).toLocaleDateString(),
    'Person': t.personName, 'Type': t.type, 'Amount': t.amount,
    'Balance After': t.balanceAfter, 'Notes': t.notes || ''
  }));
  return exports.generateExcel(data, headers, 'Village Account');
};
