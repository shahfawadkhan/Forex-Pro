import { useEffect, useState, useCallback } from 'react'
import { FileText, FileSpreadsheet, Printer, Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import api from '../utils/api'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatCard from '../components/common/StatCard'
import { fmtPKR, fmtSAR, fmtDate } from '../utils/format'
import { exportRiyalPDF } from '../utils/exportPDF'
import { exportRiyalExcel } from '../utils/exportExcel'
import toast from 'react-hot-toast'
import PersonSelect from '../components/common/PersonSelect'

const emptyForm = { buyPerson:'', buyAmount:'', buyRate:'', sellPerson:'', sellAmount:'', sellRate:'', notes:'', date: new Date().toISOString().split('T')[0] }

export default function RiyalPage() {
  const [data, setData] = useState([])
  const [ledger, setLedger] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null) // 'add'|'edit'|'pay'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [payForm, setPayForm] = useState({ buyAmountPaid: '', sellAmountPaid: '', notes: '' })
  const [deleteId, setDeleteId] = useState(null)

  const calc = { buyTotal: (form.buyAmount||0)*(form.buyRate||0), sellTotal: (form.sellAmount||0)*(form.sellRate||0) }
  calc.profit = calc.sellTotal - calc.buyTotal

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit:20, ...(search&&{search}), ...(status&&{status}) })
      const { data: r } = await api.get(`/riyal?${q}`)
      setData(r.data); setPages(r.pages); setLedger(r.ledger||{})
    } finally { setLoading(false) }
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    try {
      if (selected) await api.put(`/riyal/${selected._id}`, form)
      else await api.post('/riyal', form)
      toast.success(selected ? 'Updated!' : 'Saved!'); setModal(null); load()
    } catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  const del = async () => {
    try { await api.delete(`/riyal/${deleteId}`); toast.success('Deleted'); load() }
    catch(e) { toast.error('Delete failed') }
  }

  const pay = async () => {
    try { await api.post(`/riyal/${selected._id}/payment`, payForm); toast.success('Payment recorded!'); setModal(null); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  const openEdit = (row) => { setSelected(row); setForm({ buyPerson:row.buyPerson, buyAmount:row.buyAmount, buyRate:row.buyRate, sellPerson:row.sellPerson, sellAmount:row.sellAmount, sellRate:row.sellRate, notes:row.notes||'', date: row.date?.split('T')[0]||'' }); setModal('edit') }
  const openAdd = () => { setSelected(null); setForm(emptyForm); setModal('add') }
  const openPay = (row) => { setSelected(row); setPayForm({ buyAmountPaid:'', sellAmountPaid:'', notes:'' }); setModal('pay') }

  const cols = [
    { key:'date', label:'Date', render: v => <span className="text-gray-400 text-xs">{fmtDate(v)}</span> },
    { key:'buyPerson', label:'Buy Person' },
    { key:'sellPerson', label:'Sell Person' },
    { key:'buyAmount', label:'Buy SAR', render: v => fmtSAR(v) },
    { key:'buyRate', label:'Buy Rate', render: v => v?.toFixed(4) },
    { key:'sellAmount', label:'Sell SAR', render: v => fmtSAR(v) },
    { key:'sellRate', label:'Sell Rate', render: v => v?.toFixed(4) },
    { key:'profit', label:'Profit', render: v => <span className="text-green-600 font-medium">{fmtPKR(v)}</span> },
    { key:'paymentStatus', label:'Status', render: v => <Badge status={v}/> },
    { key:'sellRemaining', label:'Remaining', render: v => v>0 ? <span className="text-red-500 text-xs font-medium">{fmtPKR(v)}</span> : <span className="text-gray-300">—</span> },
    { key:'_id', label:'Actions', render: (_,row) => (
      <div className="flex gap-1">
        <button onClick={()=>openPay(row)} title="Record Payment" className="p-1.5 rounded hover:bg-green-100 text-green-600 transition"><DollarSign size={13}/></button>
        <button onClick={()=>openEdit(row)} title="Edit" className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition"><Pencil size={13}/></button>
        <button onClick={()=>setDeleteId(row._id)} title="Delete" className="p-1.5 rounded hover:bg-red-100 text-red-600 transition"><Trash2 size={13}/></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="We Owe Them" value={fmtPKR(ledger.totalWeOwe)} color="red"/>
        <StatCard label="They Owe Us" value={fmtPKR(ledger.totalTheyOwe)} color="blue"/>
        <StatCard label="Total Profit" value={fmtPKR(ledger.totalProfit)} color="green"/>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-800 flex-wrap">
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search person..." className="input w-48"/>
          <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}} className="input w-32">
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>
          <div className="ml-auto flex gap-2 flex-wrap">
            <button onClick={()=>exportRiyalPDF(data)} className="btn-secondary text-xs py-1.5"><FileText size={13}/>PDF</button>
            <button onClick={()=>exportRiyalExcel(data)} className="btn-secondary text-xs py-1.5"><FileSpreadsheet size={13}/>Excel</button>
            <button onClick={()=>window.print()} className="btn-secondary text-xs py-1.5"><Printer size={13}/>Print</button>
            <button onClick={openAdd} className="btn-primary text-xs py-1.5"><Plus size={13}/>New</button>
          </div>
        </div>
        <Table columns={cols} data={data} loading={loading} page={page} pages={pages} onPageChange={setPage}/>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)} title={modal==='edit'?'Edit Riyal Transaction':'New Riyal Transaction'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide">↓ Buy Section</h4>
            <div><label className="label">Buy From (Person)</label><PersonSelect value={form.buyPerson} onChange={v=>setForm({...form,buyPerson:v})} placeholder="Select buyer"/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Amount (SAR)</label><input className="input" type="number" value={form.buyAmount} onChange={e=>setForm({...form,buyAmount:e.target.value})} placeholder="0"/></div>
              <div><label className="label">Buy Rate (₨)</label><input className="input" type="number" value={form.buyRate} onChange={e=>setForm({...form,buyRate:e.target.value})} placeholder="73.00"/></div>
            </div>
            <div className="bg-red-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Buy Total</p><p className="text-lg font-semibold">{fmtPKR(calc.buyTotal)}</p></div>
          </div>
          <div className="border border-green-200 dark:border-green-900 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-green-600 uppercase tracking-wide">↑ Sell Section</h4>
            <div><label className="label">Sell To (Person)</label><PersonSelect value={form.sellPerson} onChange={v=>setForm({...form,sellPerson:v})} placeholder="Select seller"/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Amount (SAR)</label><input className="input" type="number" value={form.sellAmount} onChange={e=>setForm({...form,sellAmount:e.target.value})} placeholder="0"/></div>
              <div><label className="label">Sell Rate (₨)</label><input className="input" type="number" value={form.sellRate} onChange={e=>setForm({...form,sellRate:e.target.value})} placeholder="73.20"/></div>
            </div>
            <div className="bg-green-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Sell Total</p><p className="text-lg font-semibold">{fmtPKR(calc.sellTotal)}</p></div>
          </div>
        </div>
        <div className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-3 flex items-center justify-between">
          <div><p className="text-xs opacity-80">Profit</p><p className="text-xl font-bold">{fmtPKR(calc.profit)}</p></div>
          <div className="text-right"><p className="text-xs opacity-80">Date</p><input className="bg-white/20 text-white text-xs rounded px-2 py-1 outline-none" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        </div>
        <div className="mt-3"><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes"/></div>
        <div className="flex justify-end gap-2 mt-4"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={submit} className="btn-primary">Save Transaction</button></div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={modal==='pay'} onClose={()=>setModal(null)} title="Record Payment" size="sm">
        {selected && (
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Buy Remaining:</span><span className="font-medium text-red-600">{fmtPKR(selected.buyRemaining)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sell Remaining:</span><span className="font-medium text-red-600">{fmtPKR(selected.sellRemaining)}</span></div>
            </div>
            <div><label className="label">Buy Amount Paid (PKR)</label><input className="input" type="number" value={payForm.buyAmountPaid} onChange={e=>setPayForm({...payForm,buyAmountPaid:e.target.value})} placeholder="0"/></div>
            <div><label className="label">Sell Amount Paid (PKR)</label><input className="input" type="number" value={payForm.sellAmountPaid} onChange={e=>setPayForm({...payForm,sellAmountPaid:e.target.value})} placeholder="0"/></div>
            <div><label className="label">Notes</label><input className="input" value={payForm.notes} onChange={e=>setPayForm({...payForm,notes:e.target.value})} placeholder="Payment note"/></div>
            <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={pay} className="btn-success">Record Payment</button></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={del} title="Delete Transaction" message="This will permanently delete the transaction and its profit record." confirmText="Delete" danger/>
    </div>
  )
}
