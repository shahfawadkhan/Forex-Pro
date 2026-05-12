import * as XLSX from 'xlsx'

export const downloadExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

export const exportRiyalExcel = (transactions) => downloadExcel(
  transactions.map(t => ({
    'Date': new Date(t.date).toLocaleDateString(),
    'Buy Person': t.buyPerson,
    'Sell Person': t.sellPerson,
    'Buy Amount (SAR)': t.buyAmount,
    'Buy Rate': t.buyRate,
    'Buy Total (PKR)': t.buyTotal,
    'Sell Amount (SAR)': t.sellAmount,
    'Sell Rate': t.sellRate,
    'Sell Total (PKR)': t.sellTotal,
    'Profit (PKR)': t.profit,
    'Status': t.paymentStatus,
    'Remaining (PKR)': t.sellRemaining
  })),
  'riyal-transactions.xlsx', 'Riyal'
)

export const exportDirhamExcel = (transactions) => downloadExcel(
  transactions.map(t => ({
    'Date': new Date(t.date).toLocaleDateString(),
    'Buy Person': t.buyPerson,
    'Sell Person': t.sellPerson,
    'Buy Amount (AED)': t.buyAmount,
    'Buy Rate': t.buyRate,
    'Sell Amount (AED)': t.sellAmount,
    'Sell Rate': t.sellRate,
    'Profit (PKR)': t.profit,
    'Status': t.paymentStatus
  })),
  'dirham-transactions.xlsx', 'Dirham'
)

export const exportLoansExcel = (loans) => downloadExcel(
  loans.map(l => ({
    'Date': new Date(l.date).toLocaleDateString(),
    'Person': l.personName,
    'Type': l.loanType,
    'Amount': l.amount,
    'Currency': l.currency,
    'Repaid': l.totalRepaid,
    'Remaining': l.remaining,
    'Status': l.status
  })),
  'loans.xlsx', 'Loans'
)

export const exportVillage = (transactions) => downloadExcel(
  transactions.map(t => ({
    'Date': new Date(t.date).toLocaleDateString(),
    'Person': t.personName,
    'Type': t.type,
    'Amount': t.amount,
    'Balance After': t.balanceAfter,
    'Notes': t.notes || ''
  })),
  'village-account.xlsx', 'Village Account'
)