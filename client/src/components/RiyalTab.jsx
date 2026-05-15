import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, Banknote } from 'lucide-react'
import api from '../utils/api'
import { fmtPKR, fmtAED } from '../utils/format'
import toast from 'react-hot-toast'
import PersonSelect from './common/PersonSelect'

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

// ─── SAUDI-RIYAL SECTION ──────────────────────────────────────────────────────
function SaudiRiyalSection({ loading, setLoading }) {
  const navigate = useNavigate()

  // ── Buy side
  const [buyPerson, setBuyPerson] = useState('')
  const [buyAmount, setBuyAmount] = useState('')   // QAR
  const [buyRate,   setBuyRate]   = useState('')   // Rs per QAR

  // ── Sell side
  const [sellPerson, setSellPerson] = useState('')
  const [sellRate,   setSellRate]   = useState('')  // Rs per AED

  // ── Advance pool (separate section)
  const [advanceRecords, setAdvanceRecords] = useState([])
  const [advLoading,     setAdvLoading]     = useState(true)
  const [selectedAdv,    setSelectedAdv]    = useState(null)

  // ── Meta
  const [notes, setNotes] = useState('')
  const [date,  setDate]  = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    setAdvLoading(true)
    api.get('/advance')
      .then(({ data: r }) =>
        setAdvanceRecords((r.data || []).filter(a => (a.remainingAmount || 0) > 0))
      )
      .catch(() => toast.error('Failed to load advance records'))
      .finally(() => setAdvLoading(false))
  }, [])

  // ── Derived values
  const qar       = Number(buyAmount) || 0
  const bRate     = Number(buyRate)   || 0
  const sRate     = Number(sellRate)  || 0
  const deductAED = +(qar * 0.95).toFixed(4)      // AED given to sell person
  const wePayPKR  = qar * bRate                   // PKR we owe buy person
  const theyPayPKR= deductAED * sRate             // PKR sell person owes us
  const profit    = theyPayPKR - wePayPKR

  const exceeds   = selectedAdv && deductAED > (selectedAdv.remainingAmount || 0)
  const canSave   = buyPerson && sellPerson && qar > 0 && bRate > 0 && sRate > 0 && selectedAdv && !exceeds

  // ── Save
  const save = async () => {
    if (!canSave) return toast.error('Please fill all required fields')
    setLoading(true)
    try {
      const tx = await api.post('/riyal', {
        transactionType: 'riyal-to-saudi',
        buyPerson,  buyAmount: qar,      buyRate: bRate,  buyTotal: wePayPKR,
        sellPerson, sellAmount: deductAED, sellRate: sRate, sellTotal: theyPayPKR,
        profit, notes, date,
      })
      await api.post(`/advance/${selectedAdv._id}/deduct`, {
        aedAmount: deductAED,
        linkedConversionId: tx.data.data?._id,
        notes: `Saudi-Riyal — sold to ${sellPerson}, bought from ${buyPerson}`,
      })
      toast.success('Transaction saved & advance deducted!')
      setBuyPerson(''); setBuyAmount(''); setBuyRate('')
      setSellPerson(''); setSellRate('')
      setSelectedAdv(null); setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      const { data: r } = await api.get('/advance')
      setAdvanceRecords((r.data || []).filter(a => (a.remainingAmount || 0) > 0))
      navigate('/riyal')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving transaction')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════
          SECTION 1 — BUY & SELL (transaction sides)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── BUY SIDE ── */}
        <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/50 overflow-hidden">
          <div className="bg-red-600 px-4 py-3 flex items-center gap-2 text-white">
            <span className="text-lg">↓</span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">Buy Side</p>
              <p className="text-[10px] text-red-200">We buy QAR — will pay them PKR</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="label">Buy From (Person)</label>
              <PersonSelect value={buyPerson} onChange={setBuyPerson} placeholder="Select person we buy from"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (QAR)</label>
                <input
                  className="input" type="number" value={buyAmount}
                  onChange={e => setBuyAmount(e.target.value)}
                  placeholder="e.g. 5000" step="0.01"
                />
              </div>
              <div>
                <label className="label">Buy Rate (Rs / QAR)</label>
                <input
                  className="input" type="number" value={buyRate}
                  onChange={e => setBuyRate(e.target.value)}
                  placeholder="e.g. 76.50" step="0.0001"
                />
              </div>
            </div>

            {/* Summary */}
            <div className={`rounded-xl p-4 text-center transition-all ${wePayPKR > 0 ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${wePayPKR > 0 ? 'text-red-200' : 'text-gray-400'}`}>
                We Will Pay Them
              </p>
              <p className={`text-2xl font-bold ${wePayPKR === 0 ? 'text-gray-400' : ''}`}>
                {wePayPKR > 0 ? fmtPKR(wePayPKR) : '—'}
              </p>
              {wePayPKR > 0 && (
                <p className="text-[10px] text-red-200 mt-1">{qar} QAR × ₨{bRate} = {fmtPKR(wePayPKR)}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── SELL SIDE ── */}
        <div className="rounded-2xl border-2 border-green-200 dark:border-green-900/50 overflow-hidden">
          <div className="bg-green-600 px-4 py-3 flex items-center gap-2 text-white">
            <span className="text-lg">↑</span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">Sell Side</p>
              <p className="text-[10px] text-green-200">We give them Dirham — they pay us PKR</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="label">Sell To (Person)</label>
              <PersonSelect value={sellPerson} onChange={setSellPerson} placeholder="Select person we sell to"/>
            </div>
            <div>
              <label className="label">Sell Rate (Rs / AED)</label>
              <input
                className="input" type="number" value={sellRate}
                onChange={e => setSellRate(e.target.value)}
                placeholder="e.g. 79.50" step="0.0001"
              />
            </div>

            {/* AED they will receive */}
            {qar > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">QAR bought</span>
                  <span className="font-semibold">{qar.toLocaleString()} QAR</span>
                </div>
                <div className="flex justify-between items-center border-t border-amber-200 dark:border-amber-800/40 pt-1.5">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Banknote size={11}/> Dirham they receive <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1 rounded font-bold">× 0.95</span>
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{fmtAED(deductAED)}</span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className={`rounded-xl p-4 text-center transition-all ${theyPayPKR > 0 ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${theyPayPKR > 0 ? 'text-green-200' : 'text-gray-400'}`}>
                They Will Pay Us
              </p>
              <p className={`text-2xl font-bold ${theyPayPKR === 0 ? 'text-gray-400' : ''}`}>
                {theyPayPKR > 0 ? fmtPKR(theyPayPKR) : '—'}
              </p>
              {theyPayPKR > 0 && (
                <p className="text-[10px] text-green-200 mt-1">{deductAED} AED × ₨{sRate} = {fmtPKR(theyPayPKR)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversion formula strip */}
      {qar > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 flex-wrap text-sm">
          <span className="text-blue-600 font-mono font-semibold">{qar} QAR</span>
          <span className="text-gray-400">×</span>
          <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">0.95</span>
          <span className="text-gray-400">=</span>
          <span className="text-amber-600 font-mono font-bold">{deductAED} AED</span>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-gray-400 text-xs">This dirham amount is deducted from the advance pool below</span>
        </div>
      )}

      {/* ════════════════════════════════════════════
          SECTION 2 — ADVANCE POOL (separate)
          ════════════════════════════════════════════ */}
      <div className="card overflow-hidden p-0">
        {/* Header */}
        <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600"/>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
              Advance Pool — Select Dirham Source
            </span>
          </div>
          {deductAED > 0 && (
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
              Need to deduct: {fmtAED(deductAED)}
            </span>
          )}
        </div>

        <div className="p-4">
          {advLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"/>)}
            </div>
          ) : advanceRecords.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">No advance records with remaining balance</p>
              <button onClick={() => navigate('/advance')} className="text-xs text-amber-600 underline mt-1">
                Go to Advance page to add records →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {advanceRecords.map(adv => {
                const isSelected  = selectedAdv?._id === adv._id
                const wouldExceed = deductAED > 0 && deductAED > (adv.remainingAmount || 0)
                const pct         = Math.min(100, ((adv.remainingAmount / adv.aedAmount) * 100))

                return (
                  <button
                    key={adv._id}
                    onClick={() => setSelectedAdv(isSelected ? null : adv)}
                    disabled={wouldExceed && !isSelected}
                    className={`text-left rounded-xl border-2 p-3 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm'
                        : wouldExceed
                        ? 'border-gray-100 dark:border-gray-800 opacity-35 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">{adv.personName}</p>
                      </div>
                      {wouldExceed && !isSelected && (
                        <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5"/>
                      )}
                    </div>

                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400">Available</span>
                      <span className="font-bold text-indigo-600">{fmtAED(adv.remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                      <span>of {fmtAED(adv.aedAmount)} total</span>
                      <span>₨{adv.rate?.toFixed(2)}/AED</span>
                    </div>

                    {/* Progress */}
                    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isSelected ? 'bg-indigo-500' : 'bg-green-500'}`}
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>

                    {/* After-deduction preview */}
                    {isSelected && deductAED > 0 && !wouldExceed && (
                      <div className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-800 flex justify-between text-[10px]">
                        <span className="text-gray-400">After deduction:</span>
                        <span className="font-semibold text-indigo-600">
                          {fmtAED(Math.max(0, (adv.remainingAmount || 0) - deductAED))} left
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {exceeds && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle size={14} className="flex-shrink-0"/>
              Deduction needed ({fmtAED(deductAED)}) exceeds this record's available balance ({fmtAED(selectedAdv?.remainingAmount)})
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          SECTION 3 — PROFIT SUMMARY
          ════════════════════════════════════════════ */}
      {wePayPKR > 0 && theyPayPKR > 0 && !exceeds && (
        <div className="card p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Profit Summary</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase mb-1">We Pay (Buy)</p>
              <p className="text-base font-bold text-red-700 dark:text-red-400">{fmtPKR(wePayPKR)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{qar} QAR × ₨{bRate}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase mb-1">We Receive (Sell)</p>
              <p className="text-base font-bold text-green-700 dark:text-green-400">{fmtPKR(theyPayPKR)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{deductAED} AED × ₨{sRate}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase mb-1">Dirham Used</p>
              <p className="text-base font-bold text-amber-700 dark:text-amber-400">{fmtAED(deductAED)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">from {selectedAdv?.personName || 'advance'}</p>
            </div>
            <div className={`rounded-xl p-3 border ${profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40'}`}>
              <p className="text-[10px] text-gray-400 uppercase mb-1">Net Profit</p>
              <p className={`text-base font-bold ${profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                {fmtPKR(profit)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{profit >= 0 ? '▲ Gain' : '▼ Loss'}</p>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            ({deductAED} AED × ₨{sRate}) − ({qar} QAR × ₨{bRate}) ={' '}
            <strong className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmtPKR(profit)}</strong>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          SECTION 4 — NOTES + SAVE
          ════════════════════════════════════════════ */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Fawad → Ihsan"/>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)}/>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-wrap gap-2">
          {[
            { ok: !!buyPerson,   label: 'Buy person' },
            { ok: qar > 0,       label: 'QAR amount' },
            { ok: bRate > 0,     label: 'Buy rate' },
            { ok: !!sellPerson,  label: 'Sell person' },
            { ok: sRate > 0,     label: 'Sell rate' },
            { ok: !!selectedAdv, label: 'Advance selected' },
            { ok: !exceeds,      label: 'Fits balance' },
          ].map(({ ok, label }) => (
            <span key={label} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              ok ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                 : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}>
              {ok
                ? <CheckCircle2 size={10}/>
                : <div className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600"/>
              }
              {label}
            </span>
          ))}
        </div>

        <button
          onClick={save}
          disabled={!canSave || loading}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
            canSave && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>Saving…</>
            : `✓ Save Saudi-Riyal Transaction${selectedAdv ? ` — Deduct ${fmtAED(deductAED)} from ${selectedAdv.personName}` : ''}`
          }
        </button>
      </div>
    </div>
  )
}

// ─── RIYAL TAB (main export) ──────────────────────────────────────────────────
export default function RiyalTab({ loading, setLoading }) {
  const navigate   = useNavigate()
  const [riyalSub, setRiyalSub] = useState('r2r')

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
        <SubBtn label="Riyal to Riyal" active={riyalSub === 'r2r'}   onClick={() => setRiyalSub('r2r')}/>
        <SubBtn label="Saudi-Riyal"    active={riyalSub === 'saudi'} onClick={() => setRiyalSub('saudi')}/>
      </div>

      {/* ── Riyal to Riyal ── */}
      {riyalSub === 'r2r' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-red-200 dark:border-red-800/50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide">↓ Buy Section</h4>
              <div>
                <label className="label">Buy From</label>
                <PersonSelect value={r2r.buyPerson} onChange={v => setR2r({ ...r2r, buyPerson: v })} placeholder="Select buyer"/>
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

            <div className="border border-green-200 dark:border-green-800/50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-green-600 uppercase tracking-wide">↑ Sell Section</h4>
              <div>
                <label className="label">Sell To</label>
                <PersonSelect value={r2r.sellPerson} onChange={v => setR2r({ ...r2r, sellPerson: v })} placeholder="Select seller"/>
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
                type="date" value={r2r.date}
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
        <SaudiRiyalSection loading={loading} setLoading={setLoading}/>
      )}
    </div>
  )
}
