export const fmtPKR = (n) => '₨' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })
export const fmtAED = (n) => 'AED ' + Number(n || 0).toLocaleString('en', { maximumFractionDigits: 2 })
export const fmtSAR = (n) => 'SAR ' + Number(n || 0).toLocaleString('en', { maximumFractionDigits: 2 })
export const fmtQAR = (n) => 'QAR ' + Number(n || 0).toLocaleString('en', { maximumFractionDigits: 2 })
export const fmtNum = (n, dec = 2) => Number(n || 0).toLocaleString('en', { maximumFractionDigits: dec })
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }) : '—'
export const fmtRate = (n) => Number(n || 0).toFixed(4)

export const statusBadge = (status) => {
  const map = { paid: 'badge-paid', unpaid: 'badge-unpaid', partial: 'badge-partial', active: 'badge-paid', completed: 'badge-unpaid', overdue: 'badge-partial' }
  return map[status] || 'badge-unpaid'
}
