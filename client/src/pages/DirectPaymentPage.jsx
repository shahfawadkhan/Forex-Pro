import { useEffect, useState, useCallback } from 'react'
import { FileText, FileSpreadsheet, Printer, Trash2, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../utils/api'
import StatCard from '../components/common/StatCard'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { fmtPKR, fmtQAR, fmtDate } from '../utils/format'
import { exportToPDF } from '../utils/exportPDF'
import { downloadExcel } from '../utils/exportExcel'
import toast from 'react-hot-toast'
import { Coins } from 'lucide-react'

export default function DirectPaymentPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [addModal, setAddModal] = useState(false)
  const [form, setForm] = useState({ personName: '', amount: '', rate: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { recordId, depositId }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/direct-payment')
      setRecords(data.data || [])
    } catch {
      toast.error('Failed to load direct payment records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const save = async () => {
    if (!form.personName || !form.amount || !form.rate) return toast.error('Fill Person Name, Amount and Rate')
    setSaving(true)
    try {
      await api.post('/direct-payment/deposit', {
        personName: form.personName.trim(),
        amount: Number(form.amount),
        rate: Number(form.rate),
        notes: form.notes
      })
      toast.success('Deposit saved!')
      setForm({ personName: '', amount: '', rate: '', notes: '' })
      setAddModal(false)
      load()
    } catch(e) {
      toast.error(e.response?.data?.message || 'Error saving deposit')
    } finally {
      setSaving(false)
    }
  }

  const deleteDeposit = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/direct-payment/${deleteTarget.recordId}/deposit/${deleteTarget.depositId}`)
      toast.success('Deposit removed')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to delete deposit')
    }
  }

  // Totals
  const totalDeposited = records.reduce((s, r) => s + (r.totalDeposited || 0), 0)
  const totalUsed      = records.reduce((s, r) => s + (r.totalUsed || 0), 0)
  const totalRemaining = records.reduce((s, r) => s + (r.remainingBalance || 0), 0)

  // Flatten all deposits for export
  const allDeposits = records.flatMap(r =>
    (r.deposits || []).map(d => ({
      Person: r.personName,
      Date: fmtDate(d.date),
      'Amount (QAR)': d.amount,
      'Rate (₨/QAR)': d.rate,
      'PKR Value': d.pkrValue || d.amount * d.rate,
      Notes: d.notes || ''
    }))
  )

  const exportPDF = () => {
    const rows = records.flatMap(r =>
      (r.deposits || []).map(d => [
        r.personName,
        fmtDate(d.date),
        fmtQAR(d.amount),
        d.rate?.toFixed(4),
        fmtPKR(d.pkrValue || d.amount * d.rate),
        d.notes || '—'
      ])
    )
    // Summary rows per person
    const summaryRows = records.map(r => [
      r.personName,
      `${r.deposits?.length || 0} entries`,
      fmtQAR(r.totalDeposited),
      r.weightedAvgRate?.toFixed(4),
      fmtQAR(r.remainingBalance),
      fmtQAR(r.totalUsed)
    ])

    exportToPDF({
      title: 'Direct Payment (QAR Deposits) Report',
      headers: ['Person', 'Date', 'Amount (QAR)', 'Rate (₨)', 'PKR Value', 'Notes'],
      rows,
      filename: 'direct-payment-deposits.pdf'
    })
  }

  const exportSummaryPDF = () => {
    exportToPDF({
      title: 'Direct Payment — Person Summary',
      headers: ['Person', 'Entries', 'Total Deposited', 'Avg Rate', 'Remaining', 'Used'],
      rows: records.map(r => [
        r.personName,
        r.deposits?.length || 0,
        fmtQAR(r.totalDeposited),
        r.weightedAvgRate?.toFixed(4),
        fmtQAR(r.remainingBalance),
        fmtQAR(r.totalUsed)
      ]),
      filename: 'direct-payment-summary.pdf'
    })
  }

  const exportExcel = () => downloadExcel(allDeposits, 'direct-payment-deposits.xlsx', 'Deposits')

  const exportSummaryExcel = () => downloadExcel(
    records.map(r => ({
      Person: r.personName,
      Entries: r.deposits?.length || 0,
      'Total Deposited (QAR)': r.totalDeposited,
      'Weighted Avg Rate (₨)': r.weightedAvgRate,
      'Remaining (QAR)': r.remainingBalance,
      'Used (QAR)': r.totalUsed
    })),
    'direct-payment-summary.xlsx', 'Summary'
  )

  const pkrValue = (Number(form.amount) || 0) * (Number(form.rate) || 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Deposited" value={fmtQAR(totalDeposited)} icon={Coins} color="blue" sub={`${records.length} persons`}/>
        <StatCard label="Total Remaining" value={fmtQAR(totalRemaining)} color="green"/>
        <StatCard label="Total Used" value={fmtQAR(totalUsed)} color="red"/>
      </div>

      {/* Toolbar */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Direct Payment Records (QAR)</span>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button onClick={load} className="btn-secondary text-xs py-1.5" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>Refresh
          </button>
          <button onClick={exportPDF} className="btn-secondary text-xs py-1.5">
            <FileText size={13}/>Detail PDF
          </button>
          <button onClick={exportSummaryPDF} className="btn-secondary text-xs py-1.5">
            <FileText size={13}/>Summary PDF
          </button>
          <button onClick={exportExcel} className="btn-secondary text-xs py-1.5">
            <FileSpreadsheet size={13}/>Detail Excel
          </button>
          <button onClick={exportSummaryExcel} className="btn-secondary text-xs py-1.5">
            <FileSpreadsheet size={13}/>Summary Excel
          </button>
          <button onClick={()=>window.print()} className="btn-secondary text-xs py-1.5">
            <Printer size={13}/>Print
          </button>
          <button onClick={()=>setAddModal(true)} className="btn-primary text-xs py-1.5">
            <Plus size={13}/>New Deposit
          </button>
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-semibold">Person Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th"></th>
                <th className="th">Person</th>
                <th className="th">Entries</th>
                <th className="th">Total Deposited (QAR)</th>
                <th className="th">Weighted Avg Rate (₨)</th>
                <th className="th">PKR Value</th>
                <th className="th">Used (QAR)</th>
                <th className="th">Remaining (QAR)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="td text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>
                    Loading...
                  </div>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="td text-center py-12 text-gray-400">
                  No deposit records yet. Click "+ New Deposit" to add your first entry.
                </td></tr>
              ) : (
                records.map(record => {
                  const pkrTotal = (record.deposits || []).reduce((s, d) => s + (d.pkrValue || d.amount * d.rate || 0), 0)
                  const isOpen = expanded[record._id]
                  return [
                    // Summary row
                    <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer" onClick={()=>toggleExpand(record._id)}>
                      <td className="td w-8">
                        <span className="text-gray-400">
                          {isOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </span>
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {record.personName?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium">{record.personName}</span>
                        </div>
                      </td>
                      <td className="td text-center">{record.deposits?.length || 0}</td>
                      <td className="td font-semibold text-blue-600">{fmtQAR(record.totalDeposited)}</td>
                      <td className="td font-mono text-sm">₨{record.weightedAvgRate?.toFixed(4)}</td>
                      <td className="td text-indigo-600">{fmtPKR(pkrTotal)}</td>
                      <td className="td text-red-500">{fmtQAR(record.totalUsed)}</td>
                      <td className="td font-semibold text-green-600">{fmtQAR(record.remainingBalance)}</td>
                    </tr>,

                    // Expanded deposit rows
                    isOpen && (
                      <tr key={`${record._id}-detail`}>
                        <td colSpan={8} className="p-0">
                          <div className="bg-blue-50/50 dark:bg-blue-900/10 border-t border-b border-blue-100 dark:border-blue-900/30">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-blue-100/50 dark:bg-blue-900/20">
                                  <th className="th pl-16">Date</th>
                                  <th className="th">Amount (QAR)</th>
                                  <th className="th">Rate (₨/QAR)</th>
                                  <th className="th">PKR Value</th>
                                  <th className="th">Notes</th>
                                  <th className="th">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(record.deposits || []).length === 0 ? (
                                  <tr><td colSpan={6} className="td text-center py-4 text-gray-400 pl-16 text-xs">No deposits yet</td></tr>
                                ) : (
                                  (record.deposits || []).map((dep, i) => (
                                    <tr key={dep._id || i} className="hover:bg-blue-100/30 dark:hover:bg-blue-900/10">
                                      <td className="td pl-16 text-xs text-gray-400">{fmtDate(dep.date)}</td>
                                      <td className="td font-medium">{fmtQAR(dep.amount)}</td>
                                      <td className="td font-mono text-sm">₨{dep.rate?.toFixed(4)}</td>
                                      <td className="td text-blue-600">{fmtPKR(dep.pkrValue || dep.amount * dep.rate)}</td>
                                      <td className="td text-xs text-gray-400">{dep.notes || '—'}</td>
                                      <td className="td">
                                        <button
                                          onClick={e => { e.stopPropagation(); setDeleteTarget({ recordId: record._id, depositId: dep._id }) }}
                                          className="p-1.5 rounded hover:bg-red-100 text-red-500 transition"
                                          title="Delete this deposit"
                                        >
                                          <Trash2 size={13}/>
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                              <tfoot>
                                <tr className="bg-blue-100/50 dark:bg-blue-900/20">
                                  <td className="td pl-16 font-semibold text-xs">Total</td>
                                  <td className="td font-semibold text-blue-600">{fmtQAR(record.totalDeposited)}</td>
                                  <td className="td font-semibold">Avg: ₨{record.weightedAvgRate?.toFixed(4)}</td>
                                  <td className="td font-semibold text-indigo-600">{fmtPKR(pkrTotal)}</td>
                                  <td className="td"></td>
                                  <td className="td"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )
                  ]
                })
              )}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                  <td className="td"></td>
                  <td className="td text-sm font-bold">Grand Total</td>
                  <td className="td text-center">{records.reduce((s,r)=>s+(r.deposits?.length||0),0)}</td>
                  <td className="td text-blue-600">{fmtQAR(totalDeposited)}</td>
                  <td className="td">—</td>
                  <td className="td text-indigo-600">
                    {fmtPKR(records.reduce((s,r)=>(r.deposits||[]).reduce((ss,d)=>ss+(d.pkrValue||d.amount*d.rate||0),s),0))}
                  </td>
                  <td className="td text-red-500">{fmtQAR(totalUsed)}</td>
                  <td className="td text-green-600">{fmtQAR(totalRemaining)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Deposit Modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="New QAR Deposit Entry">
        <div className="space-y-3">
          <div>
            <label className="label">Person Name</label>
            <input className="input" value={form.personName} onChange={e=>setForm({...form,personName:e.target.value})} placeholder="e.g. Zaz, Fawad"/>
            <p className="text-xs text-gray-400 mt-1">If person already exists, deposit will be added to their record.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (QAR)</label>
              <input className="input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="4000" step="0.01"/>
            </div>
            <div>
              <label className="label">Rate (₨ per QAR)</label>
              <input className="input" type="number" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} placeholder="77.60" step="0.01"/>
            </div>
          </div>
          <div>
            <label className="label">Notes (Optional)</label>
            <input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="e.g. First batch"/>
          </div>

          {form.amount && form.rate && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-600 text-white rounded-lg p-2.5 text-center">
                <div className="text-xs opacity-80">Amount</div>
                <div className="font-semibold text-sm">{fmtQAR(form.amount)}</div>
              </div>
              <div className="bg-indigo-600 text-white rounded-lg p-2.5 text-center">
                <div className="text-xs opacity-80">Rate</div>
                <div className="font-semibold text-sm">₨{Number(form.rate).toFixed(4)}</div>
              </div>
              <div className="bg-green-600 text-white rounded-lg p-2.5 text-center">
                <div className="text-xs opacity-80">PKR Value</div>
                <div className="font-semibold text-sm">{fmtPKR(pkrValue)}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={()=>setAddModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                : <><Plus size={13}/>Save Deposit</>
              }
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={()=>setDeleteTarget(null)}
        onConfirm={deleteDeposit}
        title="Delete Deposit"
        message="This will permanently remove this deposit entry. The person's totals and weighted average rate will be recalculated automatically."
        confirmText="Delete"
        danger
      />
    </div>
  )
}