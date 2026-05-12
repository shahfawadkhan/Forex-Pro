import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, CheckSquare, Square, ArrowRight } from 'lucide-react'
import api from '../utils/api'
import { fmtPKR, fmtQAR, fmtAED } from '../utils/format'
import toast from 'react-hot-toast'

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{label}</button>
)
const SubTab = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 text-xs font-medium rounded-lg transition ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{label}</button>
)

function DirectPaymentTab() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ personName: '', amount: '', rate: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const pkrValue = (Number(form.amount) || 0) * (Number(form.rate) || 0)

  const save = async () => {
    if (!form.personName || !form.amount || !form.rate) return toast.error('Fill Person Name, Amount and Rate')
    setSaving(true)
    try {
      await api.post('/direct-payment/deposit', { personName: form.personName.trim(), amount: Number(form.amount), rate: Number(form.rate), notes: form.notes })
      toast.success('Deposit saved!')
      setForm({ personName: '', amount: '', rate: '', notes: '' })
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">New QAR Deposit Entry</h4>
          <button onClick={() => navigate('/direct-payment')} className="btn-secondary text-xs py-1.5">View All Records <ArrowRight size={12}/></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Person Name</label>
            <input className="input" value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} placeholder="e.g. Zaz, Fawad"/>
            <p className="text-xs text-gray-400 mt-1">If person already has deposits, this entry will be added to their record.</p>
          </div>
          <div><label className="label">Amount (QAR)</label><input className="input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="4000" step="0.01"/></div>
          <div><label className="label">Rate (Rs per QAR)</label><input className="input" type="number" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder="77.60" step="0.01"/></div>
          <div className="col-span-2"><label className="label">Notes (Optional)</label><input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. First batch"/></div>
        </div>
        {form.amount && form.rate && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-600 text-white rounded-xl p-3 text-center"><div className="text-xs opacity-80">Deposited (QAR)</div><div className="text-lg font-bold">{fmtQAR(form.amount)}</div></div>
            <div className="bg-indigo-600 text-white rounded-xl p-3 text-center"><div className="text-xs opacity-80">Rate (Rs/QAR)</div><div className="text-lg font-bold">Rs{Number(form.rate).toFixed(4)}</div></div>
            <div className="bg-green-600 text-white rounded-xl p-3 text-center"><div className="text-xs opacity-80">PKR Value</div><div className="text-lg font-bold">{fmtPKR(pkrValue)}</div></div>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><Plus size={13}/>Save Deposit</>}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
        <div className="flex-1 text-blue-700 dark:text-blue-300">To view, edit or export all deposit records, go to the <strong>Direct Payment</strong> page.</div>
        <button onClick={() => navigate('/direct-payment')} className="btn-primary text-xs py-1.5 flex-shrink-0">Open Records <ArrowRight size={12}/></button>
      </div>
    </div>
  )
}

function ConversionTab() {
  const [persons, setPersons] = useState([])
  const [advances, setAdvances] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [inputAmount, setInputAmount] = useState('')
  const [factor, setFactor] = useState('0.95000')
  const [selectedAdvances, setSelectedAdvances] = useState([])
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/direct-payment'), api.get('/advance')])
      .then(([dp, adv]) => { setPersons(dp.data.data || []); setAdvances(adv.data.data || []) })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoadingData(false))
  }, [])

  useEffect(() => {
    setSelectedPerson(selectedPersonId ? persons.find(p => p._id === selectedPersonId) || null : null)
    setResult(null)
  }, [selectedPersonId, persons])

  const amt = Number(inputAmount) || 0
  const fct = Number(factor) || 0.95
  const convertedQAR = amt * fct
  const avgRate = selectedPerson?.weightedAvgRate || 0
  const qarPKRValue = convertedQAR * avgRate
  const totalAdvancePKR = selectedAdvances.reduce((sum, sa) => {
    const adv = advances.find(a => a._id === sa.advanceId)
    return sum + (Number(sa.aedAmount) || 0) * (adv?.rate || 0)
  }, 0)
  const netProfit = qarPKRValue - totalAdvancePKR

  const toggleAdvance = (advId) => {
    setSelectedAdvances(prev => {
      const exists = prev.find(s => s.advanceId === advId)
      if (exists) return prev.filter(s => s.advanceId !== advId)
      const adv = advances.find(a => a._id === advId)
      return [...prev, { advanceId: advId, aedAmount: adv?.remainingAmount || 0 }]
    })
    setResult(null)
  }

  const updateAdvanceAmount = (advId, val) => {
    setSelectedAdvances(prev => prev.map(s => s.advanceId === advId ? { ...s, aedAmount: val } : s))
    setResult(null)
  }

  const doConvert = async () => {
    if (!selectedPersonId) return toast.error('Select a person first')
    if (!inputAmount || amt <= 0) return toast.error('Enter a valid amount')
    if (amt > (selectedPerson?.remainingBalance || 0)) return toast.error(`Exceeds remaining (${fmtQAR(selectedPerson?.remainingBalance)})`)
    for (const sa of selectedAdvances) {
      const adv = advances.find(a => a._id === sa.advanceId)
      if (Number(sa.aedAmount) > (adv?.remainingAmount || 0)) return toast.error(`Deduction exceeds remaining for ${adv?.personName}`)
    }
    setConverting(true)
    try {
      const { data } = await api.post('/direct-payment/convert', { personId: selectedPersonId, inputAmount: amt, factor: fct, advanceDeductions: selectedAdvances.map(sa => ({ advanceId: sa.advanceId, aedAmount: Number(sa.aedAmount) })) })
      setResult(data.data)
      toast.success('Conversion completed!')
      const [dp, adv] = await Promise.all([api.get('/direct-payment'), api.get('/advance')])
      setPersons(dp.data.data || []); setAdvances(adv.data.data || [])
      setSelectedAdvances([]); setInputAmount(''); setSelectedPersonId('')
    } catch(e) { toast.error(e.response?.data?.message || 'Conversion failed') }
    finally { setConverting(false) }
  }

  if (loadingData) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>

  const availablePersons = persons.filter(p => (p.remainingBalance || 0) > 0)

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h4 className="text-sm font-semibold mb-3">Step 1 — Select Person & Amount</h4>
        {availablePersons.length === 0 ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 text-sm rounded-xl p-4">No persons with remaining QAR balance. Add deposits in the "Direct Payment" tab first.</div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="label">Select Person</label>
              <select className="input" value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)}>
                <option value="">— Select Person —</option>
                {availablePersons.map(p => <option key={p._id} value={p._id}>{p.personName} — Remaining: {fmtQAR(p.remainingBalance)} @ avg Rs{p.weightedAvgRate?.toFixed(4)}</option>)}
              </select>
            </div>
            {selectedPerson && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">
                <div><div className="text-gray-400 mb-0.5">Total Deposited</div><div className="font-semibold text-sm">{fmtQAR(selectedPerson.totalDeposited)}</div></div>
                <div><div className="text-gray-400 mb-0.5">Remaining</div><div className="font-semibold text-sm text-green-600">{fmtQAR(selectedPerson.remainingBalance)}</div></div>
                <div><div className="text-gray-400 mb-0.5">Weighted Avg Rate</div><div className="font-semibold text-sm text-blue-600">Rs{selectedPerson.weightedAvgRate?.toFixed(4)}</div></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount to Convert (QAR)</label>
                <input className="input" type="number" value={inputAmount} onChange={e => { setInputAmount(e.target.value); setResult(null) }} placeholder="e.g. 5000" step="0.01"/>
                {selectedPerson && amt > 0 && amt > selectedPerson.remainingBalance && <p className="text-xs text-red-500 mt-1">Exceeds remaining ({fmtQAR(selectedPerson.remainingBalance)})</p>}
              </div>
              <div>
                <label className="label">Conversion Factor</label>
                <input className="input" type="number" value={factor} onChange={e => { setFactor(e.target.value); setResult(null) }} step="0.00001" placeholder="0.95000"/>
                <p className="text-xs text-gray-400 mt-1">Standard: 0.95000</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {amt > 0 && selectedPerson && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><RefreshCw size={14} className="text-blue-600"/>Step 2 — Conversion Calculation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-600 text-white rounded-xl p-3"><div className="text-xs opacity-80">Input (QAR)</div><div className="text-lg font-bold">{fmtQAR(amt)}</div></div>
            <div className="bg-purple-600 text-white rounded-xl p-3"><div className="text-xs opacity-80">{amt} x {fct}</div><div className="text-lg font-bold">{fmtQAR(convertedQAR)}</div></div>
            <div className="bg-indigo-600 text-white rounded-xl p-3"><div className="text-xs opacity-80">x Rate Rs{avgRate?.toFixed(4)}</div><div className="text-lg font-bold">{fmtPKR(qarPKRValue)}</div></div>
            <div className={`${netProfit >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white rounded-xl p-3`}><div className="text-xs opacity-80">Net Profit</div><div className="text-lg font-bold">{fmtPKR(netProfit)}</div></div>
          </div>
        </div>
      )}

      {amt > 0 && selectedPerson && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-1">Step 3 — Advance Deductions <span className="text-gray-400 font-normal text-xs">(Optional)</span></h4>
          <p className="text-xs text-gray-400 mb-3">Select advance records to deduct from this conversion.</p>
          {advances.filter(a => (a.remainingAmount || 0) > 0).length === 0 ? (
            <div className="text-xs text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">No advance records with remaining balance.</div>
          ) : (
            <div className="space-y-2">
              {advances.filter(a => (a.remainingAmount || 0) > 0).map(adv => {
                const isSelected = !!selectedAdvances.find(s => s.advanceId === adv._id)
                const selEntry = selectedAdvances.find(s => s.advanceId === adv._id)
                return (
                  <div key={adv._id} className={`border rounded-xl p-3 transition ${isSelected ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleAdvance(adv._id)} className="mt-0.5 flex-shrink-0">
                        {isSelected ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16} className="text-gray-400"/>}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-sm font-medium">{adv.personName}</span>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Available: <strong className="text-green-600">{fmtAED(adv.remainingAmount)}</strong></span>
                            <span>Rate: <strong>Rs{adv.rate?.toFixed(4)}</strong></span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            <div><label className="label">Deduct Amount (AED)</label><input className="input" type="number" value={selEntry?.aedAmount || ''} max={adv.remainingAmount} onChange={e => updateAdvanceAmount(adv._id, e.target.value)} placeholder={`Max: ${adv.remainingAmount}`}/></div>
                            <div className="text-xs pt-5"><div className="text-gray-400">PKR deducted</div><div className="font-semibold text-red-600 text-sm">{fmtPKR((Number(selEntry?.aedAmount)||0)*(adv.rate||0))}</div></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {amt > 0 && selectedPerson && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-3">Step 4 — Confirm Conversion</h4>
          <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
            <div className="flex justify-between py-0.5"><span>Person:</span><strong>{selectedPerson.personName}</strong></div>
            <div className="flex justify-between py-0.5"><span>Input Amount:</span><strong>{fmtQAR(amt)}</strong></div>
            <div className="flex justify-between py-0.5"><span>After {fct} factor:</span><strong>{fmtQAR(convertedQAR)}</strong></div>
            <div className="flex justify-between py-0.5"><span>Weighted Avg Rate:</span><strong>Rs{avgRate?.toFixed(4)}</strong></div>
            <div className="flex justify-between py-0.5"><span>QAR to PKR:</span><strong>{fmtPKR(qarPKRValue)}</strong></div>
            {selectedAdvances.length > 0 && <div className="flex justify-between py-0.5 text-red-600"><span>Advance Deductions:</span><strong>- {fmtPKR(totalAdvancePKR)}</strong></div>}
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 text-sm font-bold">
              <span>Net Profit:</span><strong className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtPKR(netProfit)}</strong>
            </div>
          </div>
          <button onClick={doConvert} disabled={converting || amt > (selectedPerson?.remainingBalance || 0)} className="btn-primary w-full justify-center py-2.5">
            {converting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Processing...</> : <>Confirm Conversion</>}
          </button>
        </div>
      )}

      {result && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">Conversion Successful!</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><div className="text-green-600">Input (QAR)</div><div className="font-semibold">{fmtQAR(result.inputAmount)}</div></div>
            <div><div className="text-green-600">Converted</div><div className="font-semibold">{fmtQAR(result.convertedAmount)}</div></div>
            <div><div className="text-green-600">PKR Value</div><div className="font-semibold">{fmtPKR(result.pkrValue)}</div></div>
            <div><div className="text-green-600">Net Profit</div><div className="font-semibold text-green-700">{fmtPKR(result.netProfit)}</div></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NewTransactionPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('riyal')
  const [riyalSub, setRiyalSub] = useState('r2r')
  const [saudiSub, setSaudiSub] = useState('direct')
  const [loading, setLoading] = useState(false)

  const [r2r, setR2r] = useState({ buyPerson:'', buyAmount:'', buyRate:'', sellPerson:'', sellAmount:'', sellRate:'', notes:'', date: new Date().toISOString().split('T')[0] })
  const r2rCalc = { buyTotal:(r2r.buyAmount||0)*(r2r.buyRate||0), sellTotal:(r2r.sellAmount||0)*(r2r.sellRate||0) }
  r2rCalc.profit = r2rCalc.sellTotal - r2rCalc.buyTotal

  const [dirham, setDirham] = useState({ buyPerson:'', buyAmount:'', buyRate:'', sellPerson:'', sellAmount:'', sellRate:'', notes:'', date: new Date().toISOString().split('T')[0] })
  const dCalc = { buyTotal:(dirham.buyAmount||0)*(dirham.buyRate||0), sellTotal:(dirham.sellAmount||0)*(dirham.sellRate||0) }
  dCalc.profit = dCalc.sellTotal - dCalc.buyTotal

  const [pkr, setPkr] = useState({ buyPerson:'', sellPerson:'', amount:'', marginPercent:'0.5', notes:'', date: new Date().toISOString().split('T')[0] })
  const pkrProfit = ((pkr.amount||0)*(pkr.marginPercent||0))/100

  const [adv, setAdv] = useState({ personName:'', aedAmount:'', rate:'', notes:'', date: new Date().toISOString().split('T')[0] })
  const advPKR = (adv.aedAmount||0)*(adv.rate||0)

  const saveR2R = async () => {
    if (!r2r.buyPerson||!r2r.sellPerson||!r2r.buyAmount||!r2r.sellAmount) return toast.error('Fill all required fields')
    setLoading(true)
    try { await api.post('/riyal', { ...r2r, transactionType:'riyal-to-riyal' }); toast.success('Saved!'); navigate('/riyal') }
    catch(e) { toast.error(e.response?.data?.message||'Error') } finally { setLoading(false) }
  }
  const saveDirham = async () => {
    if (!dirham.buyPerson||!dirham.sellPerson||!dirham.buyAmount||!dirham.sellAmount) return toast.error('Fill all required fields')
    setLoading(true)
    try { await api.post('/dirham', dirham); toast.success('Saved!'); navigate('/dirham') }
    catch(e) { toast.error(e.response?.data?.message||'Error') } finally { setLoading(false) }
  }
  const savePKR = async () => {
    if (!pkr.buyPerson||!pkr.sellPerson||!pkr.amount) return toast.error('Fill all required fields')
    setLoading(true)
    try { await api.post('/pkr', pkr); toast.success('Saved!'); navigate('/pkr') }
    catch(e) { toast.error(e.response?.data?.message||'Error') } finally { setLoading(false) }
  }
  const saveAdvance = async () => {
    if (!adv.personName||!adv.aedAmount||!adv.rate) return toast.error('Fill all required fields')
    setLoading(true)
    try { await api.post('/advance', adv); toast.success('Saved!'); navigate('/advance') }
    catch(e) { toast.error(e.response?.data?.message||'Error') } finally { setLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="card">
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-2">
          {['riyal','dirham','pkr','advance'].map(t => <Tab key={t} label={t.charAt(0).toUpperCase()+t.slice(1)} active={tab===t} onClick={()=>setTab(t)}/>)}
        </div>

        {tab==='riyal' && (
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <SubTab label="Riyal to Riyal" active={riyalSub==='r2r'} onClick={()=>setRiyalSub('r2r')}/>
              <SubTab label="Riyal to Saudi" active={riyalSub==='saudi'} onClick={()=>setRiyalSub('saudi')}/>
            </div>
            {riyalSub==='r2r' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-red-600 uppercase">Down Buy Section</h4>
                    <div><label className="label">Buy From</label><input className="input" value={r2r.buyPerson} onChange={e=>setR2r({...r2r,buyPerson:e.target.value})} placeholder="Person name"/></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="label">Amount (SAR)</label><input className="input" type="number" value={r2r.buyAmount} onChange={e=>setR2r({...r2r,buyAmount:e.target.value})} placeholder="0"/></div>
                      <div><label className="label">Buy Rate (Rs)</label><input className="input" type="number" value={r2r.buyRate} onChange={e=>setR2r({...r2r,buyRate:e.target.value})} placeholder="73.00" step="0.0001"/></div>
                    </div>
                    <div className="bg-red-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Buy Total</p><p className="text-xl font-bold">{fmtPKR(r2rCalc.buyTotal)}</p></div>
                  </div>
                  <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-green-600 uppercase">Up Sell Section</h4>
                    <div><label className="label">Sell To</label><input className="input" value={r2r.sellPerson} onChange={e=>setR2r({...r2r,sellPerson:e.target.value})} placeholder="Person name"/></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="label">Amount (SAR)</label><input className="input" type="number" value={r2r.sellAmount} onChange={e=>setR2r({...r2r,sellAmount:e.target.value})} placeholder="0"/></div>
                      <div><label className="label">Sell Rate (Rs)</label><input className="input" type="number" value={r2r.sellRate} onChange={e=>setR2r({...r2r,sellRate:e.target.value})} placeholder="73.20" step="0.0001"/></div>
                    </div>
                    <div className="bg-green-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Sell Total</p><p className="text-xl font-bold">{fmtPKR(r2rCalc.sellTotal)}</p></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 grid grid-cols-3 gap-4">
                  <div><p className="text-xs opacity-80 uppercase">Profit</p><p className="text-2xl font-bold">{fmtPKR(r2rCalc.profit)}</p></div>
                  <div><p className="text-xs opacity-80 uppercase">We Owe Them</p><p className="text-xl font-semibold">{fmtPKR(Math.max(0,-r2rCalc.profit))}</p></div>
                  <div><p className="text-xs opacity-80">Date</p><input className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none mt-1" type="date" value={r2r.date} onChange={e=>setR2r({...r2r,date:e.target.value})}/></div>
                </div>
                <div><label className="label">Notes</label><input className="input" value={r2r.notes} onChange={e=>setR2r({...r2r,notes:e.target.value})} placeholder="Optional"/></div>
                <div className="flex justify-end"><button onClick={saveR2R} disabled={loading} className="btn-primary">{loading?'Saving...':'Save Transaction'}</button></div>
              </div>
            )}
            {riyalSub==='saudi' && (
              <div>
                <div className="flex gap-2 mb-4">
                  <SubTab label="Direct Payment" active={saudiSub==='direct'} onClick={()=>setSaudiSub('direct')}/>
                  <SubTab label="Conversion (x0.95)" active={saudiSub==='conversion'} onClick={()=>setSaudiSub('conversion')}/>
                </div>
                {saudiSub==='direct' && <DirectPaymentTab/>}
                {saudiSub==='conversion' && <ConversionTab/>}
              </div>
            )}
          </div>
        )}

        {tab==='dirham' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-red-600 uppercase">Buy Dirham</h4>
                <div><label className="label">Buy From</label><input className="input" value={dirham.buyPerson} onChange={e=>setDirham({...dirham,buyPerson:e.target.value})} placeholder="Person name"/></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">Amount (AED)</label><input className="input" type="number" value={dirham.buyAmount} onChange={e=>setDirham({...dirham,buyAmount:e.target.value})} placeholder="0"/></div>
                  <div><label className="label">Buy Rate (Rs)</label><input className="input" type="number" value={dirham.buyRate} onChange={e=>setDirham({...dirham,buyRate:e.target.value})} placeholder="76.00" step="0.0001"/></div>
                </div>
                <div className="bg-red-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Buy Total</p><p className="text-xl font-bold">{fmtPKR(dCalc.buyTotal)}</p></div>
              </div>
              <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-green-600 uppercase">Sell Dirham</h4>
                <div><label className="label">Sell To</label><input className="input" value={dirham.sellPerson} onChange={e=>setDirham({...dirham,sellPerson:e.target.value})} placeholder="Person name"/></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">Amount (AED)</label><input className="input" type="number" value={dirham.sellAmount} onChange={e=>setDirham({...dirham,sellAmount:e.target.value})} placeholder="0"/></div>
                  <div><label className="label">Sell Rate (Rs)</label><input className="input" type="number" value={dirham.sellRate} onChange={e=>setDirham({...dirham,sellRate:e.target.value})} placeholder="76.50" step="0.0001"/></div>
                </div>
                <div className="bg-green-600 text-white rounded-lg p-3"><p className="text-xs opacity-80">Sell Total</p><p className="text-xl font-bold">{fmtPKR(dCalc.sellTotal)}</p></div>
              </div>
            </div>
            <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
              <div><p className="text-xs opacity-80">Profit</p><p className="text-2xl font-bold">{fmtPKR(dCalc.profit)}</p></div>
              <input className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none" type="date" value={dirham.date} onChange={e=>setDirham({...dirham,date:e.target.value})}/>
            </div>
            <div><label className="label">Notes</label><input className="input" value={dirham.notes} onChange={e=>setDirham({...dirham,notes:e.target.value})}/></div>
            <div className="flex justify-end"><button onClick={saveDirham} disabled={loading} className="btn-primary">{loading?'Saving...':'Save Dirham'}</button></div>
          </div>
        )}

        {tab==='pkr' && (
          <div className="p-4 space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Buy From</label><input className="input" value={pkr.buyPerson} onChange={e=>setPkr({...pkr,buyPerson:e.target.value})} placeholder="Person name"/></div>
              <div><label className="label">Sell To</label><input className="input" value={pkr.sellPerson} onChange={e=>setPkr({...pkr,sellPerson:e.target.value})} placeholder="Person name"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Amount (PKR)</label><input className="input" type="number" value={pkr.amount} onChange={e=>setPkr({...pkr,amount:e.target.value})} placeholder="100000"/></div>
              <div><label className="label">Margin (%)</label><input className="input" type="number" value={pkr.marginPercent} onChange={e=>setPkr({...pkr,marginPercent:e.target.value})} step="0.1" placeholder="0.5"/></div>
            </div>
            <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
              <div><p className="text-xs opacity-80">Profit</p><p className="text-2xl font-bold">{fmtPKR(pkrProfit)}</p></div>
              <input className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none" type="date" value={pkr.date} onChange={e=>setPkr({...pkr,date:e.target.value})}/>
            </div>
            <div><label className="label">Notes</label><input className="input" value={pkr.notes} onChange={e=>setPkr({...pkr,notes:e.target.value})}/></div>
            <div className="flex justify-end"><button onClick={savePKR} disabled={loading} className="btn-primary">{loading?'Saving...':'Save PKR'}</button></div>
          </div>
        )}

        {tab==='advance' && (
          <div className="p-4 space-y-4 max-w-lg">
            <div><label className="label">Person Name</label><input className="input" value={adv.personName} onChange={e=>setAdv({...adv,personName:e.target.value})} placeholder="Person name"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Amount (AED)</label><input className="input" type="number" value={adv.aedAmount} onChange={e=>setAdv({...adv,aedAmount:e.target.value})} placeholder="5000"/></div>
              <div><label className="label">Rate (Rs per AED)</label><input className="input" type="number" value={adv.rate} onChange={e=>setAdv({...adv,rate:e.target.value})} placeholder="76.50" step="0.0001"/></div>
            </div>
            <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
              <div><p className="text-xs opacity-80">PKR Equivalent</p><p className="text-2xl font-bold">{fmtPKR(advPKR)}</p></div>
              <input className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none" type="date" value={adv.date} onChange={e=>setAdv({...adv,date:e.target.value})}/>
            </div>
            <div><label className="label">Notes</label><input className="input" value={adv.notes} onChange={e=>setAdv({...adv,notes:e.target.value})}/></div>
            <div className="flex justify-end"><button onClick={saveAdvance} disabled={loading} className="btn-primary">{loading?'Saving...':'Save Advance'}</button></div>
          </div>
        )}
      </div>
    </div>
  )
}