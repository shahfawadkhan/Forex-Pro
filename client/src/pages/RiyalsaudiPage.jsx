import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, FileText, FileSpreadsheet, Printer, TrendingUp } from 'lucide-react'
import api from '../utils/api'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatCard from '../components/common/StatCard'
import { fmtPKR, fmtQAR, fmtDate } from '../utils/format'
import { exportToPDF } from '../utils/exportPDF'
import { downloadExcel } from '../utils/exportExcel'
import toast from 'react-hot-toast'
import { ArrowLeftRight } from 'lucide-react'

// This page shows conversion history: who we bought from (direct payment)
// and who we paid through (advance), with profit per transaction.
// We store these as a simple local collection in directPayment conversion logs.

const emptyForm = {
  buyPerson: '', buyAmount: '', buyRate: '',
  sellPerson: '', sellAmount: '', sellRate: '',
  notes: '', date: new Date().toISOString().split('T')[0]
}

export default function RiyalSaudiPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  // We store riyal-saudi records as riyal transactions with type riyal-to-saudi
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/riyal?transactionType=riyal-to-saudi&limit=100')
      setRecords(data.data || [])
    } catch { toast.error('Failed to load records') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Calculations
  const buyTotal  = (form.buyAmount  || 0) * (form.buyRate  || 0)
  const sellTotal = (form.sellAmount || 0) * (form.sellRate || 0)
  const profit    = sellTotal - buyTotal

  const totalBuy    = records.reduce((s, r) => s + (r.buyTotal  || 0), 0)
  const totalSell   = records.reduce((s, r) => s + (r.sellTotal || 0), 0)
  const totalProfit = records.reduce((s, r) => s + (r.profit    || 0), 0)

  const save = async () => {
    if (!form.buyPerson || !form.sellPerson || !form.buyAmount || !form.sellAmount) {
      return toast.error('Fill all required fields')
    }
    setSaving(true)
    try {
      await api.post('/riyal', { ...form, transactionType: 'riyal-to-saudi' })
      toast.success('Record saved!'); setModal(false); setForm(emptyForm); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async () => {
    try { await api.delete(`/riyal/${deleteId}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const exportPDF = () => exportToPDF({
    title: 'Riyal-Saudi Transaction Records',
    headers: ['Date','Buy From','Buy QAR','Buy Rate','Sell To','Sell QAR','Sell Rate','Profit (Rs)'],
    rows: records.map(r => [
      fmtDate(r.date), r.buyPerson, fmtQAR(r.buyAmount), r.buyRate?.toFixed(4),
      r.sellPerson, fmtQAR(r.sellAmount), r.sellRate?.toFixed(4), fmtPKR(r.profit)
    ]),
    filename: 'riyal-saudi-records.pdf'
  })

  const exportExcel = () => downloadExcel(
    records.map(r => ({
      Date: fmtDate(r.date),
      'Buy From': r.buyPerson, 'Buy Amount (QAR)': r.buyAmount, 'Buy Rate': r.buyRate,
      'Buy Total (Rs)': r.buyTotal,
      'Sell To': r.sellPerson, 'Sell Amount (QAR)': r.sellAmount, 'Sell Rate': r.sellRate,
      'Sell Total (Rs)': r.sellTotal, 'Profit (Rs)': r.profit
    })),
    'riyal-saudi-records.xlsx', 'Riyal-Saudi'
  )

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Buy (PKR)" value={fmtPKR(totalBuy)} color="blue"/>
        <StatCard label="Total Sell (PKR)" value={fmtPKR(totalSell)} color="purple"/>
        <StatCard label="Total Profit" value={fmtPKR(totalProfit)} icon={TrendingUp} color="green"/>
      </div>

      {/* Toolbar */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Riyal ↔ Saudi Records</span>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button onClick={exportPDF} className="btn-secondary text-xs py-1.5"><FileText size={13}/>PDF</button>
          <button onClick={exportExcel} className="btn-secondary text-xs py-1.5"><FileSpreadsheet size={13}/>Excel</button>
          <button onClick={() => window.print()} className="btn-secondary text-xs py-1.5"><Printer size={13}/>Print</button>
          <button onClick={() => { setForm(emptyForm); setModal(true) }} className="btn-primary text-xs py-1.5"><Plus size={13}/>New Record</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ArrowLeftRight size={32} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">No Riyal-Saudi records yet.</p>
            <p className="text-xs mt-1">Records created through the Conversion tab appear here automatically.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">Date</th>
                    <th className="th bg-red-50 dark:bg-red-900/10 text-red-600">Buy From</th>
                    <th className="th bg-red-50 dark:bg-red-900/10 text-red-600">Buy Amount</th>
                    <th className="th bg-red-50 dark:bg-red-900/10 text-red-600">Buy Rate</th>
                    <th className="th bg-red-50 dark:bg-red-900/10 text-red-600">Buy Total (Rs)</th>
                    <th className="th bg-green-50 dark:bg-green-900/10 text-green-600">Sell To</th>
                    <th className="th bg-green-50 dark:bg-green-900/10 text-green-600">Sell Amount</th>
                    <th className="th bg-green-50 dark:bg-green-900/10 text-green-600">Sell Rate</th>
                    <th className="th bg-green-50 dark:bg-green-900/10 text-green-600">Sell Total (Rs)</th>
                    <th className="th">Profit</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r._id || i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="td text-xs text-gray-400">{fmtDate(r.date)}</td>
                      <td className="td bg-red-50/30 dark:bg-red-900/5">{r.buyPerson}</td>
                      <td className="td bg-red-50/30 dark:bg-red-900/5">{fmtQAR(r.buyAmount)}</td>
                      <td className="td bg-red-50/30 dark:bg-red-900/5 font-mono text-xs">Rs{r.buyRate?.toFixed(4)}</td>
                      <td className="td bg-red-50/30 dark:bg-red-900/5 text-red-600 font-medium">{fmtPKR(r.buyTotal)}</td>
                      <td className="td bg-green-50/30 dark:bg-green-900/5">{r.sellPerson}</td>
                      <td className="td bg-green-50/30 dark:bg-green-900/5">{fmtQAR(r.sellAmount)}</td>
                      <td className="td bg-green-50/30 dark:bg-green-900/5 font-mono text-xs">Rs{r.sellRate?.toFixed(4)}</td>
                      <td className="td bg-green-50/30 dark:bg-green-900/5 text-green-600 font-medium">{fmtPKR(r.sellTotal)}</td>
                      <td className="td">
                        <span className={`font-semibold ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmtPKR(r.profit)}
                        </span>
                      </td>
                      <td className="td">
                        <button onClick={() => setDeleteId(r._id)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition">
                          <Trash2 size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-800 font-semibold text-sm">
                    <td className="td font-bold">Total</td>
                    <td className="td bg-red-50/50 dark:bg-red-900/10"></td>
                    <td className="td bg-red-50/50 dark:bg-red-900/10"></td>
                    <td className="td bg-red-50/50 dark:bg-red-900/10"></td>
                    <td className="td bg-red-50/50 dark:bg-red-900/10 text-red-600">{fmtPKR(totalBuy)}</td>
                    <td className="td bg-green-50/50 dark:bg-green-900/10"></td>
                    <td className="td bg-green-50/50 dark:bg-green-900/10"></td>
                    <td className="td bg-green-50/50 dark:bg-green-900/10"></td>
                    <td className="td bg-green-50/50 dark:bg-green-900/10 text-green-600">{fmtPKR(totalSell)}</td>
                    <td className="td text-green-600">{fmtPKR(totalProfit)}</td>
                    <td className="td"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Manual Record Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Riyal-Saudi Record" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {/* Buy side */}
          <div className="border border-red-200 dark:border-red-900/40 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide">↓ Buy Side (We Buy QAR)</h4>
            <div>
              <label className="label">Buy From (Person)</label>
              <input className="input" value={form.buyPerson} onChange={e => setForm({ ...form, buyPerson: e.target.value })} placeholder="e.g. Fawad"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Amount (QAR)</label>
                <input className="input" type="number" value={form.buyAmount} onChange={e => setForm({ ...form, buyAmount: e.target.value })} placeholder="5000" step="0.01"/>
              </div>
              <div>
                <label className="label">Buy Rate (Rs/QAR)</label>
                <input className="input" type="number" value={form.buyRate} onChange={e => setForm({ ...form, buyRate: e.target.value })} placeholder="76.30" step="0.0001"/>
              </div>
            </div>
            <div className="bg-red-600 text-white rounded-lg p-3">
              <div className="text-xs opacity-80">Buy Total</div>
              <div className="text-xl font-bold">{fmtPKR(buyTotal)}</div>
            </div>
          </div>

          {/* Sell side */}
          <div className="border border-green-200 dark:border-green-900/40 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-green-600 uppercase tracking-wide">↑ Sell Side (We Pay)</h4>
            <div>
              <label className="label">Sell To (Person)</label>
              <input className="input" value={form.sellPerson} onChange={e => setForm({ ...form, sellPerson: e.target.value })} placeholder="e.g. Ihsan"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Amount (QAR)</label>
                <input className="input" type="number" value={form.sellAmount} onChange={e => setForm({ ...form, sellAmount: e.target.value })} placeholder="5000" step="0.01"/>
              </div>
              <div>
                <label className="label">Sell Rate (Rs/QAR)</label>
                <input className="input" type="number" value={form.sellRate} onChange={e => setForm({ ...form, sellRate: e.target.value })} placeholder="76.60" step="0.0001"/>
              </div>
            </div>
            <div className="bg-green-600 text-white rounded-lg p-3">
              <div className="text-xs opacity-80">Sell Total</div>
              <div className="text-xl font-bold">{fmtPKR(sellTotal)}</div>
            </div>
          </div>
        </div>

        {/* Profit bar */}
        <div className={`mt-4 ${profit >= 0 ? 'bg-blue-600' : 'bg-red-600'} text-white rounded-xl p-4 flex items-center justify-between`}>
          <div>
            <div className="text-xs opacity-80">Profit</div>
            <div className="text-2xl font-bold">{fmtPKR(profit)}</div>
          </div>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none"
          />
        </div>

        <div className="mt-3">
          <label className="label">Notes</label>
          <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes"/>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Save Record'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={del}
        title="Delete Record"
        message="Delete this Riyal-Saudi record?"
        confirmText="Delete"
        danger
      />
    </div>
  )
}