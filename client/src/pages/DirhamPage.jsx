import { useEffect, useState, useCallback } from 'react'
import { FileText, FileSpreadsheet, Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import api from '../utils/api'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatCard from '../components/common/StatCard'
import { fmtPKR, fmtAED, fmtDate } from '../utils/format'
import { exportDirhamPDF } from '../utils/exportPDF'
import { exportDirhamExcel } from '../utils/exportExcel'
import toast from 'react-hot-toast'

const emptyForm = { buyPerson:'', buyAmount:'', buyRate:'', sellPerson:'', sellAmount:'', sellRate:'', notes:'', date: new Date().toISOString().split('T')[0] }

export default function DirhamPage() {
  const [data, setData] = useState([])
  const [ledger, setLedger] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [pages, setPages] = useState(1)
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null); const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [payForm, setPayForm] = useState({ buyAmountPaid:'', sellAmountPaid:'', notes:'' })
  const [deleteId, setDeleteId] = useState(null)

  const calc = { buyTotal:(form.buyAmount||0)*(form.buyRate||0), sellTotal:(form.sellAmount||0)*(form.sellRate||0) }
  calc.profit = calc.sellTotal - calc.buyTotal

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit:20, ...(search&&{search}), ...(status&&{status}) })
      const { data: r } = await api.get(`/dirham?${q}`)
      setData(r.data); setPages(r.pages); setLedger(r.ledger||{})
    } finally { setLoading(false) }
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    try { if (selected) await api.put(`/dirham/${selected._id}`, form); else await api.post('/dirham', form); toast.success(selected?'Updated!':'Saved!'); setModal(null); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }
  const del = async () => { try { await api.delete(`/dirham/${deleteId}`); toast.success('Deleted'); load() } catch { toast.error('Failed') } }
  const pay = async () => { try { await api.post(`/dirham/${selected._id}/payment`, payForm); toast.success('Payment recorded!'); setModal(null); load() } catch(e) { toast.error(e.response?.data?.message||'Error') } }
  const openEdit = (row) => { setSelected(row); setForm({ buyPerson:row.buyPerson, buyAmount:row.buyAmount, buyRate:row.buyRate, sellPerson:row.sellPerson, sellAmount:row.sellAmount, sellRate:row.sellRate, notes:row.notes||'', date:row.date?.split('T')[0]||'' }); setModal('edit') }

  const cols = [
    { key:'date', label:'Date', render: v=><span className="text-gray-400 text-xs">{fmtDate(v)}</span> },
    { key:'buyPerson', label:'Buy Person' }, { key:'sellPerson', label:'Sell Person' },
    { key:'buyAmount', label:'Buy AED', render: v=>fmtAED(v) }, { key:'buyRate', label:'Buy Rate', render: v=>v?.toFixed(4) },
    { key:'sellAmount', label:'Sell AED', render: v=>fmtAED(v) }, { key:'sellRate', label:'Sell Rate', render: v=>v?.toFixed(4) },
    { key:'profit', label:'Profit', render: v=><span className="text-green-600 font-medium">{fmtPKR(v)}</span> },
    { key:'paymentStatus', label:'Status', render: v=><Badge status={v}/> },
    { key:'sellRemaining', label:'Remaining', render: v=>v>0?<span className="text-red-500 text-xs font-medium">{fmtPKR(v)}</span>:<span className="text-gray-300">—</span> },
    { key:'_id', label:'Actions', render:(_,row)=>(
      <div className="flex gap-1">
        <button onClick={()=>{setSelected(row);setPayForm({buyAmountPaid:'',sellAmountPaid:'',notes:''});setModal('pay')}} className="p-1.5 rounded hover:bg-green-100 text-green-600"><DollarSign size={13}/></button>
        <button onClick={()=>openEdit(row)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600"><Pencil size={13}/></button>
        <button onClick={()=>setDeleteId(row._id)} className="p-1.5 rounded hover:bg-red-100 text-red-600"><Trash2 size={13}/></button>
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
            <option value="">All Status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button onClick={()=>exportDirhamPDF(data)} className="btn-secondary text-xs py-1.5"><FileText size={13}/>PDF</button>
            <button onClick={()=>exportDirhamExcel(data)} className="btn-secondary text-xs py-1.5"><FileSpreadsheet size={13}/>Excel</button>
            <button onClick={()=>{setSelected(null);setForm(emptyForm);setModal('add')}} className="btn-primary text-xs py-1.5"><Plus size={13}/>New</button>
          </div>
        </div>
        <Table columns={cols} data={data} loading={loading} page={page} pages={pages} onPageChange={setPage}/>
      </div>

      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)} title={modal==='edit'?'Edit Dirham Transaction':'New Dirham Transaction'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-red-600 uppercase">↓ Buy Dirham</h4>
            <div><label className="label">Buy From</label><input className="input" value={form.buyPerson} onChange={e=>setForm({...form,buyPerson:e.target.value})} placeholder="Person name"/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Amount (AED)</label><input className="input" type="number" value={form.buyAmount} onChange={e=>setForm({...form,buyAmount:e.target.value})} placeholder="0"/></div>
              <div><label className="label">Buy Rate (₨)</label><input className="input" type="number" value={form.buyRate} onChange={e=>setForm({...form,buyRate:e.target.value})} placeholder="76.00"/></div>
            </div>
            <div className="bg-red-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Buy Total</p><p className="text-lg font-semibold">{fmtPKR(calc.buyTotal)}</p></div>
          </div>
          <div className="border border-green-200 dark:border-green-900 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-green-600 uppercase">↑ Sell Dirham</h4>
            <div><label className="label">Sell To</label><input className="input" value={form.sellPerson} onChange={e=>setForm({...form,sellPerson:e.target.value})} placeholder="Person name"/></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Amount (AED)</label><input className="input" type="number" value={form.sellAmount} onChange={e=>setForm({...form,sellAmount:e.target.value})} placeholder="0"/></div>
              <div><label className="label">Sell Rate (₨)</label><input className="input" type="number" value={form.sellRate} onChange={e=>setForm({...form,sellRate:e.target.value})} placeholder="76.50"/></div>
            </div>
            <div className="bg-green-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Sell Total</p><p className="text-lg font-semibold">{fmtPKR(calc.sellTotal)}</p></div>
          </div>
        </div>
        <div className="mt-4 bg-blue-600 text-white rounded-xl p-3 flex justify-between items-center">
          <div><p className="text-xs opacity-80">Profit</p><p className="text-xl font-bold">{fmtPKR(calc.profit)}</p></div>
          <input className="bg-white/20 text-white text-xs rounded px-2 py-1 outline-none" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <div className="mt-3"><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        <div className="flex justify-end gap-2 mt-4"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={submit} className="btn-primary">Save</button></div>
      </Modal>

      <Modal open={modal==='pay'} onClose={()=>setModal(null)} title="Record Payment" size="sm">
        {selected && <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between"><span>Buy Remaining:</span><span className="text-red-600 font-medium">{fmtPKR(selected.buyRemaining)}</span></div>
            <div className="flex justify-between"><span>Sell Remaining:</span><span className="text-red-600 font-medium">{fmtPKR(selected.sellRemaining)}</span></div>
          </div>
          <div><label className="label">Buy Paid (PKR)</label><input className="input" type="number" value={payForm.buyAmountPaid} onChange={e=>setPayForm({...payForm,buyAmountPaid:e.target.value})}/></div>
          <div><label className="label">Sell Paid (PKR)</label><input className="input" type="number" value={payForm.sellAmountPaid} onChange={e=>setPayForm({...payForm,sellAmountPaid:e.target.value})}/></div>
          <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={pay} className="btn-success">Record</button></div>
        </div>}
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={del} title="Delete Transaction" message="Permanently delete this transaction?" confirmText="Delete" danger/>
    </div>
  )
}
