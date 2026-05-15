import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react'
import api from '../utils/api'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { fmtPKR, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'
import PersonSelect from '../components/common/PersonSelect'

const emptyForm = { buyPerson:'', sellPerson:'', amount:'', marginPercent:'0.5', notes:'', date: new Date().toISOString().split('T')[0] }

export default function PKRPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [pages, setPages] = useState(1)
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null); const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState(null)
  const [payAmount, setPayAmount] = useState('')

  const profit = ((form.amount||0) * (form.marginPercent||0)) / 100

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit:20, ...(search&&{search}), ...(status&&{status}) })
      const { data: r } = await api.get(`/pkr?${q}`)
      setData(r.data); setPages(r.pages)
    } finally { setLoading(false) }
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    try { if (selected) await api.put(`/pkr/${selected._id}`, form); else await api.post('/pkr', form); toast.success('Saved!'); setModal(null); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }
  const del = async () => { try { await api.delete(`/pkr/${deleteId}`); toast.success('Deleted'); load() } catch { toast.error('Failed') } }
  const pay = async () => {
    try { await api.post(`/pkr/${selected._id}/payment`, { amountPaid: payAmount }); toast.success('Payment recorded!'); setModal(null); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  const cols = [
    { key:'date', label:'Date', render: v=><span className="text-gray-400 text-xs">{fmtDate(v)}</span> },
    { key:'buyPerson', label:'Buy From' }, { key:'sellPerson', label:'Sell To' },
    { key:'amount', label:'Amount (PKR)', render: v=><span className="font-medium">{fmtPKR(v)}</span> },
    { key:'marginPercent', label:'Margin %', render: v=>`${v}%` },
    { key:'profit', label:'Profit', render: v=><span className="text-green-600 font-medium">{fmtPKR(v)}</span> },
    { key:'paymentStatus', label:'Status', render: v=><Badge status={v}/> },
    { key:'remaining', label:'Remaining', render: v=>v>0?<span className="text-red-500 text-xs">{fmtPKR(v)}</span>:<span className="text-gray-300">—</span> },
    { key:'_id', label:'Actions', render:(_,row)=>(
      <div className="flex gap-1">
        <button onClick={()=>{setSelected(row);setPayAmount('');setModal('pay')}} className="p-1.5 rounded hover:bg-green-100 text-green-600"><DollarSign size={13}/></button>
        <button onClick={()=>{setSelected(row);setForm({buyPerson:row.buyPerson,sellPerson:row.sellPerson,amount:row.amount,marginPercent:row.marginPercent,notes:row.notes||'',date:row.date?.split('T')[0]||''});setModal('edit')}} className="p-1.5 rounded hover:bg-blue-100 text-blue-600"><Pencil size={13}/></button>
        <button onClick={()=>setDeleteId(row._id)} className="p-1.5 rounded hover:bg-red-100 text-red-600"><Trash2 size={13}/></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-800 flex-wrap">
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search person..." className="input w-48"/>
          <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}} className="input w-32">
            <option value="">All Status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option>
          </select>
          <button onClick={()=>{setSelected(null);setForm(emptyForm);setModal('add')}} className="btn-primary text-xs py-1.5 ml-auto"><Plus size={13}/>New PKR</button>
        </div>
        <Table columns={cols} data={data} loading={loading} page={page} pages={pages} onPageChange={setPage}/>
      </div>

      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)} title={modal==='edit'?'Edit PKR Transaction':'New PKR Transaction'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Buy From</label><PersonSelect value={form.buyPerson} onChange={v=>setForm({...form,buyPerson:v})} placeholder="Select buyer"/></div>
            <div><label className="label">Sell To</label><PersonSelect value={form.sellPerson} onChange={v=>setForm({...form,sellPerson:v})} placeholder="Select seller"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Amount (PKR)</label><input className="input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="100000"/></div>
            <div><label className="label">Margin (%)</label><input className="input" type="number" value={form.marginPercent} onChange={e=>setForm({...form,marginPercent:e.target.value})} step="0.1" placeholder="0.5"/></div>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-3 flex justify-between">
            <div><p className="text-xs opacity-80">Profit</p><p className="text-lg font-semibold">{fmtPKR(profit)}</p></div>
            <div><label className="text-xs opacity-80">Date</label><input className="bg-white/20 text-white text-xs rounded px-2 py-1 outline-none block mt-1" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          </div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes"/></div>
          <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={submit} className="btn-primary">Save</button></div>
        </div>
      </Modal>

      <Modal open={modal==='pay'} onClose={()=>setModal(null)} title="Record Payment" size="sm">
        {selected && <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs">
            <div className="flex justify-between"><span>Remaining:</span><span className="text-red-600 font-medium">{fmtPKR(selected.remaining)}</span></div>
          </div>
          <div><label className="label">Amount Paid (PKR)</label><input className="input" type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="0"/></div>
          <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={pay} className="btn-success">Record</button></div>
        </div>}
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={del} title="Delete" message="Delete this PKR transaction?" confirmText="Delete" danger/>
    </div>
  )
}
