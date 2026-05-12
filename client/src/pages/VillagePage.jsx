import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, FileText, FileSpreadsheet, Home } from 'lucide-react'
import api from '../utils/api'
import Table from '../components/common/Table'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatCard from '../components/common/StatCard'
import { fmtPKR, fmtDate } from '../utils/format'
import { exportVillage as exportVillageExcel } from '../utils/exportExcel'
import { exportToPDF } from '../utils/exportPDF'
import toast from 'react-hot-toast'

const emptyForm = { personName:'', type:'deposit', amount:'', notes:'', date: new Date().toISOString().split('T')[0] }

export default function VillagePage() {
  const [data, setData] = useState([])
  const [stats, setStats] = useState({ balance:0, deposits:0, withdrawals:0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [pages, setPages] = useState(1)
  const [personFilter, setPersonFilter] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit:20, ...(personFilter&&{personName:personFilter}) })
      const { data: r } = await api.get(`/village?${q}`)
      setData(r.data); setPages(r.pages); setStats({ balance:r.balance, deposits:r.deposits, withdrawals:r.withdrawals })
    } finally { setLoading(false) }
  }, [page, personFilter])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!form.personName || !form.amount) return toast.error('Fill all required fields')
    try { await api.post('/village', form); toast.success('Transaction added!'); setModal(false); load() }
    catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const del = async () => {
    try { await api.delete(`/village/${deleteId}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
  }

  const exportPDF = () => exportToPDF({
    title: 'Village Account Statement',
    headers: ['Date','Person','Type','Amount','Balance After','Notes'],
    rows: data.map(t => [fmtDate(t.date), t.personName, t.type, fmtPKR(t.amount), fmtPKR(t.balanceAfter), t.notes||'']),
    filename: 'village-account.pdf'
  })

  const cols = [
    { key:'date', label:'Date', render: v=><span className="text-gray-400 text-xs">{fmtDate(v)}</span> },
    { key:'personName', label:'Person', render: v=><span className="font-medium">{v}</span> },
    { key:'type', label:'Type', render: v=><Badge status={v}/> },
    { key:'amount', label:'Amount', render: (v,row)=><span className={row.type==='deposit'?'text-green-600 font-medium':'text-red-600 font-medium'}>{fmtPKR(v)}</span> },
    { key:'balanceAfter', label:'Balance After', render: v=><span className="font-semibold text-blue-600">{fmtPKR(v)}</span> },
    { key:'notes', label:'Notes', render: v=>v||<span className="text-gray-300">—</span> },
    { key:'_id', label:'Actions', render:(_,row)=>(
      <button onClick={()=>setDeleteId(row._id)} className="p-1.5 rounded hover:bg-red-100 text-red-600 transition"><Trash2 size={13}/></button>
    )}
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Current Balance" value={fmtPKR(stats.balance)} icon={Home} color="purple"/>
        <StatCard label="Total Deposits" value={fmtPKR(stats.deposits)} color="green"/>
        <StatCard label="Total Withdrawals" value={fmtPKR(stats.withdrawals)} color="red"/>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-800 flex-wrap">
          <input value={personFilter} onChange={e=>{setPersonFilter(e.target.value);setPage(1)}} placeholder="Filter by person..." className="input w-48"/>
          <div className="ml-auto flex gap-2 flex-wrap">
            <button onClick={exportPDF} className="btn-secondary text-xs py-1.5"><FileText size={13}/>PDF</button>
            <button onClick={()=>exportVillageExcel(data)} className="btn-secondary text-xs py-1.5"><FileSpreadsheet size={13}/>Excel</button>
            <button onClick={()=>{setForm(emptyForm);setModal(true)}} className="btn-primary text-xs py-1.5"><Plus size={13}/>Add Transaction</button>
          </div>
        </div>
        <Table columns={cols} data={data} loading={loading} page={page} pages={pages} onPageChange={setPage}/>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Village Account Transaction">
        <div className="space-y-3">
          <div><label className="label">Person Name</label><input className="input" value={form.personName} onChange={e=>setForm({...form,personName:e.target.value})} placeholder="Person name"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Transaction Type</label>
              <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="deposit">Deposit (They give us)</option>
                <option value="withdrawal">Withdrawal (We give them)</option>
              </select>
            </div>
            <div><label className="label">Amount (PKR)</label><input className="input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional"/></div>
          </div>
          <div className={`rounded-lg p-3 text-white text-sm ${form.type==='deposit'?'bg-green-600':'bg-red-600'}`}>
            <p className="text-xs opacity-80">{form.type==='deposit'?'Money Coming In':'Money Going Out'}</p>
            <p className="text-lg font-bold">{fmtPKR(form.amount||0)}</p>
          </div>
          <div className="flex justify-end gap-2"><button onClick={()=>setModal(false)} className="btn-secondary">Cancel</button><button onClick={submit} className="btn-primary">Save</button></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={del} title="Delete Transaction" message="Delete this village account entry?" confirmText="Delete" danger/>
    </div>
  )
}
