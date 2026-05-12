import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import api from '../utils/api'
import { fmtPKR, fmtQAR, fmtAED } from '../utils/format'
import toast from 'react-hot-toast'

// ─── Sub-tab button ────────────────────────────────────────────────────────────
const SubBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-medium rounded-lg transition ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    {label}
  </button>
)

// ─── DIRECT PAYMENT ENTRY ─────────────────────────────────────────────────────
function DirectPaymentTab() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ personName: '', amount: '', rate: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const pkrValue = (Number(form.amount) || 0) * (Number(form.rate) || 0)

  const save = async () => {
    if (!form.personName || !form.amount || !form.rate)
      return toast.error('Fill Person Name, Amount and Rate')
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
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving deposit')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">New QAR Deposit Entry</h4>
          <button onClick={() => navigate('/direct-payment')} className="btn-secondary text-xs py-1.5">
            View All Records <ArrowRight size={12}/>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Person Name</label>
            <input
              className="input"
              value={form.personName}
              onChange={e => setForm({ ...form, personName: e.target.value })}
              placeholder="e.g. Fawad"
            />
            <p className="text-xs text-gray-400 mt-1">
              If person already exists, this deposit will be added to their record.
            </p>
          </div>
          <div>
            <label className="label">Amount (QAR)</label>
            <input
              className="input"
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="4000"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Rate (Rs per QAR)</label>
            <input
              className="input"
              type="number"
              value={form.rate}
              onChange={e => setForm({ ...form, rate: e.target.value })}
              placeholder="77.60"
              step="0.01"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Notes (Optional)</label>
            <input
              className="input"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. First batch"
            />
          </div>
        </div>

        {form.amount && form.rate && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-600 text-white rounded-xl p-3 text-center">
              <div className="text-xs opacity-80">Deposited (QAR)</div>
              <div className="text-lg font-bold">{fmtQAR(form.amount)}</div>
            </div>
            <div className="bg-indigo-600 text-white rounded-xl p-3 text-center">
              <div className="text-xs opacity-80">Rate (Rs/QAR)</div>
              <div className="text-lg font-bold">Rs{Number(form.rate).toFixed(4)}</div>
            </div>
            <div className="bg-green-600 text-white rounded-xl p-3 text-center">
              <div className="text-xs opacity-80">PKR Value</div>
              <div className="text-lg font-bold">{fmtPKR(pkrValue)}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
              : <><Plus size={13}/>Save Deposit</>
            }
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="flex-1 text-sm text-blue-700 dark:text-blue-300">
          To view, edit or export all deposit records, go to the <strong>Direct Payment</strong> page.
        </p>
        <button onClick={() => navigate('/direct-payment')} className="btn-primary text-xs py-1.5 flex-shrink-0">
          Open Records <ArrowRight size={12}/>
        </button>
      </div>
    </div>
  )
}

// ─── CONVERSION TAB ───────────────────────────────────────────────────────────
function ConversionTab() {
  const [dpPersons, setDpPersons] = useState([])
  const [advRecords, setAdvRecords] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [dpId, setDpId] = useState('')
  const [dpPerson, setDpPerson] = useState(null)
  const [inputQAR, setInputQAR] = useState('')

  const [advId, setAdvId] = useState('')
  const [advRecord, setAdvRecord] = useState(null)

  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    setLoadingData(true)
    Promise.all([
      api.get('/direct-payment'),
      api.get('/advance')
    ])
      .then(([dp, adv]) => {
        setDpPersons(dp.data.data || [])
        setAdvRecords(adv.data.data || [])
      })
      .catch(() => toast.error('Failed to load records'))
      .finally(() => setLoadingData(false))
  }, [])

  useEffect(() => {
    setDpPerson(dpId ? dpPersons.find(p => p._id === dpId) || null : null)
    setResult(null)
  }, [dpId, dpPersons])

  useEffect(() => {
    setAdvRecord(advId ? advRecords.find(a => a._id === advId) || null : null)
    setResult(null)
  }, [advId, advRecords])

  const qar       = Number(inputQAR) || 0
  const factor    = 0.95
  const converted = +(qar * factor).toFixed(4)

  const buyRate   = dpPerson?.weightedAvgRate || 0
  const sellRate  = advRecord?.rate || 0

  const costPKR    = converted * buyRate
  const revenuePKR = converted * sellRate
  const profit     = revenuePKR - costPKR

  const exceedsDp  = qar > 0 && dpPerson  && qar > (dpPerson.remainingBalance || 0)
  const exceedsAdv = converted > 0 && advRecord && converted > (advRecord.remainingAmount || 0)
  const canConfirm = qar > 0 && dpId && advId && !exceedsDp && !exceedsAdv

  const doConvert = async () => {
    if (!canConfirm) return
    setConverting(true)
    try {
      const { data } = await api.post('/direct-payment/convert', {
        personId: dpId,
        inputAmount: qar,
        factor,
        advanceDeductions: [{ advanceId: advId, aedAmount: converted }]
      })
      setResult(data.data)
      toast.success('Conversion completed!')
      const [dp, adv] = await Promise.all([api.get('/direct-payment'), api.get('/advance')])
      setDpPersons(dp.data.data || [])
      setAdvRecords(adv.data.data || [])
      setDpId(''); setAdvId(''); setInputQAR('')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Conversion failed')
    } finally { setConverting(false) }
  }

  if (loadingData) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  const availableDp  = dpPersons.filter(p  => (p.remainingBalance  || 0) > 0)
  const availableAdv = advRecords.filter(a => (a.remainingAmount   || 0) > 0)

  return (
    <div className="space-y-4 max-w-3xl">

      {/* ── SIDE-BY-SIDE PANEL ── */}
      <div className="card overflow-hidden p-0">

        {/* Column headers */}
        <div className="grid grid-cols-2">
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-r border-blue-100 dark:border-blue-800/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600"/>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Buy Side — Direct Payment</span>
          </div>
          <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600"/>
            <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Sell Side — Advance Record</span>
          </div>
        </div>

        {/* Main two-column body */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">

          {/* ── LEFT: Direct Payment ── */}
          <div className="p-4 space-y-3">
            {availableDp.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm rounded-xl p-3">
                No persons with remaining QAR balance. Add a deposit first.
              </div>
            ) : (
              <>
                <div>
                  <label className="label">Select Person</label>
                  <select
                    className="input"
                    value={dpId}
                    onChange={e => { setDpId(e.target.value); setInputQAR('') }}
                  >
                    <option value="">— Select Person —</option>
                    {availableDp.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.personName} — {fmtQAR(p.remainingBalance)} remaining
                      </option>
                    ))}
                  </select>
                </div>

                {dpPerson && (
                  <div className="rounded-xl border border-blue-100 dark:border-blue-800/50 divide-y divide-blue-100 dark:divide-blue-800/50 text-xs overflow-hidden">
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-gray-400">Total deposited</span>
                      <span className="font-semibold">{fmtQAR(dpPerson.totalDeposited)}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20">
                      <span className="text-gray-400">Remaining (we owe)</span>
                      <span className="font-semibold text-blue-600">{fmtQAR(dpPerson.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-gray-400">Avg buy rate</span>
                      <span className="font-semibold text-blue-600">Rs{buyRate.toFixed(4)}</span>
                    </div>
                  </div>
                )}

                {dpPerson && (
                  <div>
                    <label className="label">Amount to Pay (QAR)</label>
                    <input
                      className="input"
                      type="number"
                      value={inputQAR}
                      onChange={e => { setInputQAR(e.target.value); setResult(null) }}
                      placeholder={`Max: ${dpPerson.remainingBalance}`}
                      step="0.01"
                    />
                    {exceedsDp && (
                      <p className="text-xs text-red-500 mt-1">
                        Exceeds remaining balance ({fmtQAR(dpPerson.remainingBalance)})
                      </p>
                    )}
                  </div>
                )}

                {qar > 0 && !exceedsDp && (
                  <div className="bg-blue-600 text-white rounded-xl p-3 text-center">
                    <div className="text-xs opacity-70 mb-0.5">Paying out</div>
                    <div className="text-xl font-bold font-mono">{fmtQAR(qar)}</div>
                    <div className="text-xs opacity-60 mt-0.5">@ Rs{buyRate.toFixed(4)} / QAR</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT: Advance Record ── */}
          <div className={`p-4 space-y-3 transition-opacity ${(!qar || !dpPerson || exceedsDp) ? 'opacity-40 pointer-events-none' : ''}`}>
            {availableAdv.length === 0 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm rounded-xl p-3">
                No advance records with remaining balance.
              </div>
            ) : (
              <>
                <div>
                  <label className="label">Select Advance Record</label>
                  <select
                    className="input"
                    value={advId}
                    onChange={e => setAdvId(e.target.value)}
                  >
                    <option value="">— Select Record —</option>
                    {availableAdv.map(a => (
                      <option key={a._id} value={a._id}>
                        {a.personName} — {fmtAED(a.remainingAmount)} available
                      </option>
                    ))}
                  </select>
                </div>

                {advRecord && (
                  <div className="rounded-xl border border-green-100 dark:border-green-800/50 divide-y divide-green-100 dark:divide-green-800/50 text-xs overflow-hidden">
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-gray-400">Total advance</span>
                      <span className="font-semibold">{fmtAED(advRecord.aedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 bg-green-50 dark:bg-green-900/20">
                      <span className="text-gray-400">Available</span>
                      <span className="font-semibold text-green-600">{fmtAED(advRecord.remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-gray-400">Sell rate</span>
                      <span className="font-semibold text-green-600">Rs{sellRate.toFixed(4)}</span>
                    </div>
                  </div>
                )}

                {converted > 0 && advRecord && !exceedsAdv && (
                  <div className="bg-green-600 text-white rounded-xl p-3 text-center">
                    <div className="text-xs opacity-70 mb-0.5">Deducting</div>
                    <div className="text-xl font-bold font-mono">{fmtAED(converted)}</div>
                    <div className="text-xs opacity-60 mt-0.5">@ Rs{sellRate.toFixed(4)} / AED</div>
                  </div>
                )}

                {exceedsAdv && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl p-3">
                    {fmtAED(converted)} exceeds available balance ({fmtAED(advRecord?.remainingAmount)}).
                    Select a different record or reduce the QAR amount.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── CONVERSION FORMULA STRIP ── */}
        {qar > 0 && !exceedsDp && (
          <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 flex items-center justify-center gap-2.5">
            <span className="text-blue-600 font-semibold font-mono text-sm">{fmtQAR(qar)}</span>
            <span className="text-gray-400 text-sm">×</span>
            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">0.95</span>
            <span className="text-gray-400 text-sm">=</span>
            <span className="text-green-600 font-bold font-mono text-sm">{fmtAED(converted)}</span>
            <span className="text-xs text-gray-400 hidden sm:inline">to deduct from advance</span>
          </div>
        )}
      </div>

      {/* ── PROFIT SUMMARY ── */}
      {qar > 0 && dpPerson && advRecord && !exceedsDp && !exceedsAdv && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-3">Profit Calculation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-blue-600 text-white rounded-xl p-3">
              <div className="text-xs opacity-80">Pay (QAR → AED)</div>
              <div className="text-base font-bold">{fmtQAR(qar)}</div>
              <div className="text-xs opacity-60 mt-1">× 0.95 = {fmtAED(converted)}</div>
            </div>
            <div className="bg-red-500 text-white rounded-xl p-3">
              <div className="text-xs opacity-80">Cost (Buy @ Rs{buyRate.toFixed(2)})</div>
              <div className="text-base font-bold">{fmtPKR(costPKR)}</div>
              <div className="text-xs opacity-60 mt-1">{fmtAED(converted)} × {buyRate.toFixed(4)}</div>
            </div>
            <div className="bg-green-600 text-white rounded-xl p-3">
              <div className="text-xs opacity-80">Revenue (Sell @ Rs{sellRate.toFixed(2)})</div>
              <div className="text-base font-bold">{fmtPKR(revenuePKR)}</div>
              <div className="text-xs opacity-60 mt-1">{fmtAED(converted)} × {sellRate.toFixed(4)}</div>
            </div>
            <div className={`${profit >= 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white rounded-xl p-3`}>
              <div className="text-xs opacity-80">Net Profit</div>
              <div className="text-base font-bold">{fmtPKR(profit)}</div>
              <div className="text-xs opacity-60 mt-1">
                Rs{(sellRate - buyRate).toFixed(4)} × {fmtAED(converted)}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 font-mono">
            ({fmtAED(converted)} × Rs{sellRate.toFixed(4)}) − ({fmtAED(converted)} × Rs{buyRate.toFixed(4)}) = {' '}
            <strong className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtPKR(profit)}</strong>
          </div>
        </div>
      )}

      {/* ── CONFIRM ── */}
      {qar > 0 && dpPerson && advRecord && !exceedsDp && !exceedsAdv && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-3">Confirm Transaction</h4>
          <div className="grid grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 text-xs">
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Buy Side (Direct Payment)</div>
              <div className="flex justify-between">
                <span className="text-gray-400">Person:</span>
                <strong>{dpPerson.personName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">We Pay:</span>
                <strong>{fmtQAR(qar)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">After × 0.95:</span>
                <strong>{fmtAED(converted)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Buy Rate:</span>
                <strong>Rs{buyRate.toFixed(4)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Remaining after:</span>
                <strong className="text-blue-600">
                  {fmtQAR(Math.max(0, (dpPerson.remainingBalance || 0) - qar))}
                </strong>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">Sell Side (Advance)</div>
              <div className="flex justify-between">
                <span className="text-gray-400">Person:</span>
                <strong>{advRecord.personName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Deduct:</span>
                <strong>{fmtAED(converted)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sell Rate:</span>
                <strong>Rs{sellRate.toFixed(4)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Remaining after:</span>
                <strong className="text-green-600">
                  {fmtAED(Math.max(0, (advRecord.remainingAmount || 0) - converted))}
                </strong>
              </div>
            </div>
            <div className="col-span-2 flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 text-sm font-bold">
              <span>Net Profit:</span>
              <strong className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {fmtPKR(profit)}
              </strong>
            </div>
          </div>

          <button
            onClick={doConvert}
            disabled={converting}
            className="btn-primary w-full justify-center py-3"
          >
            {converting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Processing...</>
              : <>✓ Confirm — Pay {fmtAED(converted)} from {advRecord.personName}'s Advance</>
            }
          </button>
        </div>
      )}

      {/* ── RESULT ── */}
      {result && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
            ✓ Conversion Successful!
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-green-600 mb-0.5">Input (QAR)</div>
              <div className="font-semibold">{fmtQAR(result.inputAmount)}</div>
            </div>
            <div>
              <div className="text-green-600 mb-0.5">Converted (AED)</div>
              <div className="font-semibold">{fmtAED(result.convertedAmount)}</div>
            </div>
            <div>
              <div className="text-green-600 mb-0.5">Buy Rate</div>
              <div className="font-semibold">Rs{result.buyRate?.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-green-600 mb-0.5">Sell Rate</div>
              <div className="font-semibold">Rs{result.sellRate?.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-green-600 mb-0.5">Cost (PKR)</div>
              <div className="font-semibold">{fmtPKR(result.costPKR)}</div>
            </div>
            <div>
              <div className="text-green-600 mb-0.5">Revenue (PKR)</div>
              <div className="font-semibold">{fmtPKR(result.revenuePKR)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-green-600 mb-0.5">Net Profit</div>
              <div className={`font-bold text-sm ${result.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {fmtPKR(result.netProfit)}
              </div>
            </div>
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-3 btn-secondary text-xs py-1.5"
          >
            New Conversion
          </button>
        </div>
      )}
    </div>
  )
}

// ─── RIYAL TAB (main export) ──────────────────────────────────────────────────
export default function RiyalTab({ loading, setLoading }) {
  const navigate = useNavigate()
  const [riyalSub, setRiyalSub] = useState('r2r')
  const [saudiSub, setSaudiSub] = useState('direct')

  const [r2r, setR2r] = useState({
    buyPerson: '', buyAmount: '', buyRate: '',
    sellPerson: '', sellAmount: '', sellRate: '',
    notes: '', date: new Date().toISOString().split('T')[0]
  })

  const r2rBuyTotal  = (Number(r2r.buyAmount)  || 0) * (Number(r2r.buyRate)  || 0)
  const r2rSellTotal = (Number(r2r.sellAmount) || 0) * (Number(r2r.sellRate) || 0)
  const r2rProfit    = r2rSellTotal - r2rBuyTotal

  const saveR2R = async () => {
    if (!r2r.buyPerson || !r2r.sellPerson || !r2r.buyAmount || !r2r.sellAmount)
      return toast.error('Fill all required fields')
    setLoading(true)
    try {
      await api.post('/riyal', { ...r2r, transactionType: 'riyal-to-riyal' })
      toast.success('Riyal transaction saved!')
      navigate('/riyal')
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-5">
        <SubBtn label="Riyal to Riyal"  active={riyalSub === 'r2r'}   onClick={() => setRiyalSub('r2r')}/>
        <SubBtn label="Riyal to Saudi"  active={riyalSub === 'saudi'} onClick={() => setRiyalSub('saudi')}/>
      </div>

      {riyalSub === 'r2r' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Buy */}
            <div className="border border-red-200 dark:border-red-800/50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide">↓ Buy Section</h4>
              <div>
                <label className="label">Buy From</label>
                <input className="input" value={r2r.buyPerson} onChange={e => setR2r({ ...r2r, buyPerson: e.target.value })} placeholder="Person name"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Amount (SAR)</label>
                  <input className="input" type="number" value={r2r.buyAmount} onChange={e => setR2r({ ...r2r, buyAmount: e.target.value })} placeholder="0"/>
                </div>
                <div>
                  <label className="label">Buy Rate (Rs)</label>
                  <input className="input" type="number" value={r2r.buyRate} onChange={e => setR2r({ ...r2r, buyRate: e.target.value })} placeholder="73.00" step="0.0001"/>
                </div>
              </div>
              <div className="bg-red-600 text-white rounded-lg p-3">
                <p className="text-xs opacity-80">Buy Total</p>
                <p className="text-xl font-bold">{fmtPKR(r2rBuyTotal)}</p>
              </div>
            </div>
            {/* Sell */}
            <div className="border border-green-200 dark:border-green-800/50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-green-600 uppercase tracking-wide">↑ Sell Section</h4>
              <div>
                <label className="label">Sell To</label>
                <input className="input" value={r2r.sellPerson} onChange={e => setR2r({ ...r2r, sellPerson: e.target.value })} placeholder="Person name"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Amount (SAR)</label>
                  <input className="input" type="number" value={r2r.sellAmount} onChange={e => setR2r({ ...r2r, sellAmount: e.target.value })} placeholder="0"/>
                </div>
                <div>
                  <label className="label">Sell Rate (Rs)</label>
                  <input className="input" type="number" value={r2r.sellRate} onChange={e => setR2r({ ...r2r, sellRate: e.target.value })} placeholder="73.20" step="0.0001"/>
                </div>
              </div>
              <div className="bg-green-600 text-white rounded-lg p-3">
                <p className="text-xs opacity-80">Sell Total</p>
                <p className="text-xl font-bold">{fmtPKR(r2rSellTotal)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs opacity-80 uppercase tracking-wide">Profit</p>
              <p className="text-2xl font-bold">{fmtPKR(r2rProfit)}</p>
            </div>
            <div>
              <p className="text-xs opacity-80 uppercase tracking-wide">We Owe Them</p>
              <p className="text-xl font-semibold">{fmtPKR(Math.max(0, -r2rProfit))}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Date</p>
              <input
                className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none mt-1"
                type="date"
                value={r2r.date}
                onChange={e => setR2r({ ...r2r, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <input className="input" value={r2r.notes} onChange={e => setR2r({ ...r2r, notes: e.target.value })} placeholder="Optional"/>
          </div>

          <div className="flex justify-end">
            <button onClick={saveR2R} disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </div>
      )}

      {riyalSub === 'saudi' && (
        <div>
          <div className="flex gap-2 mb-4">
            <SubBtn label="Direct Payment"     active={saudiSub === 'direct'}     onClick={() => setSaudiSub('direct')}/>
            <SubBtn label="Conversion (×0.95)" active={saudiSub === 'conversion'} onClick={() => setSaudiSub('conversion')}/>
          </div>
          {saudiSub === 'direct'     && <DirectPaymentTab/>}
          {saudiSub === 'conversion' && <ConversionTab/>}
        </div>
      )}
    </div>  
  )
}