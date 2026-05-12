import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, DollarSign, FileText, FileSpreadsheet, Building2 } from 'lucide-react'
import api from '../utils/api'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import StatCard from '../components/common/StatCard'
import { fmtPKR, fmtDate } from '../utils/format'
import { exportLoansPDF } from '../utils/exportPDF'
import { exportLoansExcel } from '../utils/exportExcel'
import toast from 'react-hot-toast'

const emptyForm = { personName:'', loanType:'given', amount:'', currency:'PKR', interestRate:'0', notes:'', dueDate:'', date: new Date().toISOString().split('T')[0] }

export default function LoansPage() {
  const [data, setData] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [pages, setPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [repayForm, setRepayForm] = useState({ amount:'', method:'cash', notes:'' })
  const [deleteId, setDeleteId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page, limit:20, ...(typeFilter&&{type:typeFilter}), ...(statusFilter&&{status:statusFilter}) })
      const { data: r } = await api.get(`/loans?${q}`)
      setData(r.data); setPages(r.pages); setSummary(r.summary||[])
    } finally { setLoading(false) }
  }, [page, typeFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    try {
      if (selected) await api.put(`/loans/${selected._id}`, form)
      else await api.post('/loans', form)
      toast.success(selected ? 'Updated!' : 'Loan saved!'); setModal(null); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const del = async () => {
    try { await api.delete(`/loans/${deleteId}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed') }
  }

  const repay = async () => {
    try {
      await api.post(`/loans/${selected._id}/repay`, repayForm)
      toast.success('Repayment recorded!'); setModal(null); load()
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const openEdit = (row) => {
    setSelected(row)
    setForm({ personName:row.personName, loanType:row.loanType, amount:row.amount, currency:row.currency, interestRate:row.interestRate||0, notes:row.notes||'', dueDate:row.dueDate?.split('T')[0]||'', date:row.date?.split('T')[0]||'' })
    setModal('edit')
  }

  const loansGiven = summary.find(s=>s._id==='given') || {}
  const loansTaken = summary.find(s=>s._id==='taken') || {}

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Given" value={fmtPKR(loansGiven.total)} icon={Building2} color="blue"/>
        <StatCard label="Given Remaining" value={fmtPKR(loansGiven.remaining)} color="red"/>
        <StatCard label="Total Taken" value={fmtPKR(loansTaken.total)} color="amber"/>
        <StatCard label="Taken Remaining" value={fmtPKR(loansTaken.remaining)} color="purple"/>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-800 flex-wrap">
          <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1)}} className="input w-32">
            <option value="">All Types</option>
            <option value="given">Given</option>
            <option value="taken">Taken</option>
          </select>
          <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1)}} className="input w-32">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <div className="ml-auto flex gap-2 flex-wrap">
            <button onClick={()=>exportLoansPDF(data)} className="btn-secondary text-xs py-1.5"><FileText size={13}/>PDF</button>
            <button onClick={()=>exportLoansExcel(data)} className="btn-secondary text-xs py-1.5"><FileSpreadsheet size={13}/>Excel</button>
            <button onClick={()=>{setSelected(null);setForm(emptyForm);setModal('add')}} className="btn-primary text-xs py-1.5"><Plus size={13}/>New Loan</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No loans found</div>}
            {data.map(loan => {
              const pct = loan.amount > 0 ? Math.min(100, (loan.totalRepaid / loan.amount) * 100) : 0
              return (
                <div key={loan._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${loan.loanType==='given'?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>
                      {loan.personName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{loan.personName}</span>
                        <Badge status={loan.loanType}/>
                        <Badge status={loan.status}/>
                        <span className="text-xs text-gray-400">{fmtDate(loan.date)}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>Total: <strong>{fmtPKR(loan.amount)}</strong></span>
                        <span>Repaid: <strong className="text-green-600">{fmtPKR(loan.totalRepaid)}</strong></span>
                        <span>Remaining: <strong className="text-red-600">{fmtPKR(loan.remaining)}</strong></span>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{width:`${pct}%`}}/>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% repaid</div>
                      {loan.notes && <div className="text-xs text-gray-400 mt-1">{loan.notes}</div>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={()=>{setSelected(loan);setRepayForm({amount:'',method:'cash',notes:''});setModal('repay')}} className="p-1.5 rounded hover:bg-green-100 text-green-600 transition" title="Record Repayment"><DollarSign size={14}/></button>
                      <button onClick={()=>openEdit(loan)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition"><Pencil size={14}/></button>
                      <button onClick={()=>setDeleteId(loan._id)} className="p-1.5 rounded hover:bg-red-100 text-red-600 transition"><Trash2 size={14}/></button>
                    </div>
                  </div>

                  {loan.repayments?.length > 0 && (
                    <div className="mt-3 ml-12 pl-12">
                      <details className="ml-12">
                        <summary className="text-xs text-blue-600 cursor-pointer ml-12">View {loan.repayments.length} repayments</summary>
                        <div className="mt-2 space-y-1">
                          {loan.repayments.map((r,i) => (
                            <div key={i} className="flex items-center gap-3 text-xs text-gray-500 pl-2 border-l-2 border-gray-200">
                              <span className="text-gray-400">{fmtDate(r.date)}</span>
                              <span className="font-medium text-green-600">{fmtPKR(r.amount)}</span>
                              <span className="capitalize">{r.method}</span>
                              {r.notes && <span className="text-gray-400">{r.notes}</span>}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {pages > 1 && (
          <div className="flex justify-center gap-1 p-3 border-t border-gray-100 dark:border-gray-800">
            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>setPage(p)} className={`px-3 py-1 rounded text-xs ${p===page?'bg-blue-600 text-white':'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal==='add'||modal==='edit'} onClose={()=>setModal(null)} title={modal==='edit'?'Edit Loan':'New Loan'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Person Name</label><input className="input" value={form.personName} onChange={e=>setForm({...form,personName:e.target.value})} placeholder="Person name"/></div>
            <div><label className="label">Loan Type</label>
              <select className="input" value={form.loanType} onChange={e=>setForm({...form,loanType:e.target.value})}>
                <option value="given">Given (We gave)</option>
                <option value="taken">Taken (We took)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Amount</label><input className="input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/></div>
            <div><label className="label">Currency</label>
              <select className="input" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                <option>PKR</option><option>SAR</option><option>AED</option><option>QAR</option>
              </select>
            </div>
            <div><label className="label">Interest Rate (%)</label><input className="input" type="number" value={form.interestRate} onChange={e=>setForm({...form,interestRate:e.target.value})} step="0.1" placeholder="0"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div><label className="label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
          </div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes"/></div>
          <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={submit} className="btn-primary">Save Loan</button></div>
        </div>
      </Modal>

      <Modal open={modal==='repay'} onClose={()=>setModal(null)} title="Record Repayment" size="sm">
        {selected && (
          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs space-y-1">
              <div className="font-medium">{selected.personName}</div>
              <div className="flex justify-between"><span>Remaining:</span><span className="text-red-600 font-semibold">{fmtPKR(selected.remaining)}</span></div>
            </div>
            <div><label className="label">Repayment Amount</label><input className="input" type="number" value={repayForm.amount} onChange={e=>setRepayForm({...repayForm,amount:e.target.value})} placeholder={`Max: ${selected.remaining}`}/></div>
            <div><label className="label">Payment Method</label>
              <select className="input" value={repayForm.method} onChange={e=>setRepayForm({...repayForm,method:e.target.value})}>
                <option value="cash">Cash</option>
                <option value="village-account">Village Account</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><label className="label">Notes</label><input className="input" value={repayForm.notes} onChange={e=>setRepayForm({...repayForm,notes:e.target.value})} placeholder="Payment note"/></div>
            <div className="flex justify-end gap-2"><button onClick={()=>setModal(null)} className="btn-secondary">Cancel</button><button onClick={repay} className="btn-success">Record</button></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={del} title="Delete Loan" message="Permanently delete this loan record?" confirmText="Delete" danger/>
    </div>
  )
}
