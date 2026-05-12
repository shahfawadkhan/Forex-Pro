import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToPDF = ({ title, headers, rows, filename = 'report.pdf' }) => {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.setTextColor(30, 58, 138)
  doc.text('ForexPro Exchange Management', 14, 15)
  doc.setFontSize(12)
  doc.setTextColor(100)
  doc.text(title, 14, 23)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 10 }
  })
  doc.save(filename)
}

export const exportRiyalPDF = (transactions) => {
  exportToPDF({
    title: 'Riyal Transactions Report',
    headers: ['Date', 'Buy Person', 'Sell Person', 'Buy SAR', 'Buy Rate', 'Sell SAR', 'Sell Rate', 'Profit', 'Status'],
    rows: transactions.map(t => [
      new Date(t.date).toLocaleDateString(), t.buyPerson, t.sellPerson,
      t.buyAmount, t.buyRate, t.sellAmount, t.sellRate,
      '₨' + t.profit?.toLocaleString(), t.paymentStatus
    ]),
    filename: 'riyal-transactions.pdf'
  })
}

export const exportDirhamPDF = (transactions) => {
  exportToPDF({
    title: 'Dirham Transactions Report',
    headers: ['Date', 'Buy Person', 'Sell Person', 'Buy AED', 'Buy Rate', 'Sell AED', 'Sell Rate', 'Profit', 'Status'],
    rows: transactions.map(t => [
      new Date(t.date).toLocaleDateString(), t.buyPerson, t.sellPerson,
      t.buyAmount, t.buyRate, t.sellAmount, t.sellRate,
      '₨' + t.profit?.toLocaleString(), t.paymentStatus
    ]),
    filename: 'dirham-transactions.pdf'
  })
}

export const exportLoansPDF = (loans) => {
  exportToPDF({
    title: 'Loans Report',
    headers: ['Date', 'Person', 'Type', 'Amount', 'Currency', 'Repaid', 'Remaining', 'Status'],
    rows: loans.map(l => [
      new Date(l.date).toLocaleDateString(), l.personName, l.loanType,
      l.amount, l.currency, l.totalRepaid, l.remaining, l.status
    ]),
    filename: 'loans.pdf'
  })
}
