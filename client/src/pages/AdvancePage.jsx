import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, MinusCircle } from 'lucide-react'
import api from '../utils/api'
import Table from '../components/common/Table'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatCard from '../components/common/StatCard'
import { fmtPKR, fmtAED, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'
import PersonSelect from '../components/common/PersonSelect'
import { CreditCard } from 'lucide-react'

const emptyForm = { personName:'', aedAmount:'', rate:'', notes:'', date: new Date().toISOString().split('T')[0] }

export default function AdvancePage() {
  const [data, setData] = useState([])
  const [totals, setTotals] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deductForm, setDeductForm] = useState({ aedAmount:'', notes:'' })
  const [deleteId, setDeleteId] = useState(null)

  const pkrEq = (form.aedAmount||0) * (form.rate||0)

  const load = useCallback(async () => {
    setLoading(true)
    try { const { data: r } = await api.get('/advance'); setData(r.data); setTotals(r.totals||{}) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    try {
      if (selected) await api.put(`/advance/${selected._id}`, form)
      else await api.post('/advance', form)
      toast.success('Saved!'); setModal(null); load()
    } catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  const del = async () => { try { await api.delete(`/advance/${deleteId}`); toast.success('Deleted'); load() } catch { toast.error('Failed') } }

  const deduct = async () => {
    try { await api.post(`/advance/${selected._id}/deduct`, deductForm); toast.success('Deducted!'); setModal(null); load() }
    catch(e) { toast.error(e.response?.data?.message||'Error') }
  }

  const openEdit = (row) => { setSelected(row); setForm({ personName:row.personName, aedAmount:row.aedAmount, rate:row.rate, notes:row.notes||'', date:row.date?.split('T')[0]||'' }); setModal('edit') }

  const cols = [
    { key:'date', label:'Date', render: v=><span className="text-gray-400 text-xs">{fmtDate(v)}</span> },
    { key:'personName', label:'Person' },
    { key:'aedAmount', label:'AED Amount', render: v=><span className="font-medium">{fmtAED(v)}</span> },
    { key:'rate', label:'Rate (₨)', render: v=>v?.toFixed(4) },
    { key:'pkrEquivalent', label:'PKR Value', render: v=><span className="text-blue-600">{fmtPKR(v)}</span> },
    { key:'usedAmount', label:'Used (AED)', render: v=><span className="text-red-500">{fmtAED(v)}</span> },
    { key:'remainingAmount', label:'Remaining', render: v=><span className="text-green-600 font-medium">{fmtAED(v)}</span> },
    { key:'notes', label:'Notes', render: v=>v||<span className="text-gray-300">—</span> },
    { key:'_id', label:'Actions', render:(_,row)=>(
      <div className="flex gap-1">
        <button onClick={()=>{setSelected(row);setDeductForm({aedAmount:'',notes:''});setModal('deduct')}} title="Deduct" className="p-1.5 rounded hover:bg-amber-100 text-amber-600"><MinusCircle size={13}/></button>
        <button onClick={()=>openEdit(row)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600"><Pencil size={13}/></button>
        <button onClick={()=>setDeleteId(row._id)} className="p-1.5 rounded hover:bg-red-100 text-red-600"><Trash2 size={13}/></button>
      </div>
    )}
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Advance" value={fmtAED(totals.totalAED)} icon={CreditCard} color="blue"/>
        <StatCard label="Used Amount" value={fmtAED(totals.totalUsed)} color="red"/>
        <StatCard label="Available" value={fmtAED(totals.totalRemaining)} color="green"/>
      </div>
      <div className="card">
        <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold">Advance Records (Dirham)</h3>
          <button onClick={()=>{setSelected(null);setForm(emptyForm);setModal('add')}} className="btn-primary text-xs py-1.5"><Plus size={13}/>New Advance</button>
        </div>
        <Table columns={cols} data={data} loading={loading} page={1} pages={1} onPageChange={()=>{}}/>
      </div>

      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)} title={modal==='edit'?'Edit Advance':'New Advance Entry'}>
        <div className="space-y-3">
          <div><label className="label">Person Name</label><PersonSelect value={form.personName} onChange={v=>setForm({...form,personName:v})} placeholder="Select person"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Amount (AED)</label><input className="input" type="number" value={form.aedAmount} onChange={e=>setForm({...form,aedAmount:e.target.value})} placeholder="5000"/></div>
            <div><label className="label">Rate (₨ per AED)</label><input className="input" type="number" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})} placeholder="76.50"/></div>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-3 flex justify-between items-center">
            <div><p className="text-xs opacity-80">PKR Equivalent</p><p className="text-lg font-semibold">{fmtPKR(pkrEq)}</p></div>
            <input className="bg-white/20 text-white text-xs rounded px-2 py-1 outline-none" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          </div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional"/></div>
          <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={submit} className="btn-primary">Save</button></div>
        </div>
      </Modal>

      <Modal open={modal==='deduct'} onClose={()=>setModal(null)} title="Deduct from Advance" size="sm">
        {selected && <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs">
            <p className="font-medium mb-1">{selected.personName}</p>
            <div className="flex justify-between"><span>Remaining:</span><span className="text-green-600 font-medium">{fmtAED(selected.remainingAmount)}</span></div>
          </div>
          <div><label className="label">Deduct Amount (AED)</label><input className="input" type="number" value={deductForm.aedAmount} onChange={e=>setDeductForm({...deductForm,aedAmount:e.target.value})} placeholder={`Max: ${selected.remainingAmount}`}/></div>
          <div><label className="label">Notes</label><input className="input" value={deductForm.notes} onChange={e=>setDeductForm({...deductForm,notes:e.target.value})} placeholder="Reason for deduction"/></div>
          <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={deduct} className="btn-danger">Deduct</button></div>
        </div>}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={del} title="Delete" message="Delete this advance record?" confirmText="Delete" danger/>
    </div>
  )
}
