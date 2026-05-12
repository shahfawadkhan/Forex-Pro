// ─── CONVERSION TAB ───────────────────────────────────────────────────────────
// Workflow:
// 1. Select person from Direct Payment (we owe them QAR)
// 2. Enter amount to pay → auto × 0.95
// 3. Select advance record to pay FROM (Ihsan's AED)
// 4. Profit = (advance_rate - direct_rate) × converted_amount
// 5. Confirm → both Direct Payment and Advance records update

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import api from '../utils/api'
import { fmtPKR, fmtQAR, fmtAED } from '../utils/format'
import toast from 'react-hot-toast'

export default function ConversionTab() {
  const [persons, setPersons] = useState([])       // Direct Payment records
  const [advances, setAdvances] = useState([])     // Advance records
  const [loadingData, setLoadingData] = useState(true)

  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [inputAmount, setInputAmount] = useState('')
  const [factor] = useState(0.95)

  const [selectedAdvanceId, setSelectedAdvanceId] = useState('')
  const [selectedAdvance, setSelectedAdvance] = useState(null)

  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState(null)

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [dp, adv] = await Promise.all([
        api.get('/direct-payment'),
        api.get('/advance')
      ])
      setPersons(dp.data.data || [])
      setAdvances(adv.data.data || [])
    } catch { toast.error('Failed to load records') }
    finally { setLoadingData(false) }
  }

  useEffect(() => { loadData() }, [])

  // When person changes
  useEffect(() => {
    setSelectedPerson(selectedPersonId ? persons.find(p => p._id === selectedPersonId) || null : null)
    setResult(null)
  }, [selectedPersonId, persons])

  // When advance changes
  useEffect(() => {
    setSelectedAdvance(selectedAdvanceId ? advances.find(a => a._id === selectedAdvanceId) || null : null)
    setResult(null)
  }, [selectedAdvanceId, advances])

  // ── Calculations ──
  const amt         = Number(inputAmount) || 0
  const converted   = +(amt * factor).toFixed(2)           // 5000 × 0.95 = 4750

  // We bought at direct payment rate (QAR rate)
  const buyRate     = selectedPerson?.weightedAvgRate || 0  // e.g. 76.30

  // We sell from advance rate (AED rate)
  const sellRate    = selectedAdvance?.rate || 0             // e.g. 76.60

  // Cost to us: converted × buyRate  (what we owe Fawad in PKR)
  const costPKR     = converted * buyRate

  // Revenue: converted × sellRate  (what Ihsan owes us in PKR from advance)
  const revenuePKR  = converted * sellRate

  // Profit = revenue - cost  (positive when sell rate > buy rate)
  const profitPKR   = revenuePKR - costPKR

  // Validation
  const exceedsDP   = amt > 0 && selectedPerson  && amt > (selectedPerson.remainingBalance  || 0)
  const exceedsAdv  = converted > 0 && selectedAdvance && converted > (selectedAdvance.remainingAmount || 0)
  const canConfirm  = amt > 0 && selectedPersonId && selectedAdvanceId && !exceedsDP && !exceedsAdv

  const doConvert = async () => {
    if (!canConfirm) return
    setConverting(true)
    try {
      const { data } = await api.post('/direct-payment/convert', {
        personId: selectedPersonId,
        inputAmount: amt,
        factor,
        advanceDeductions: [{ advanceId: selectedAdvanceId, aedAmount: converted }]
      })
      setResult(data.data)
      toast.success('Conversion done!')
      // Refresh
      const [dp, adv] = await Promise.all([api.get('/direct-payment'), api.get('/advance')])
      setPersons(dp.data.data || []); setAdvances(adv.data.data || [])
      setInputAmount(''); setSelectedPersonId(''); setSelectedAdvanceId('')
    } catch(e) { toast.error(e.response?.data?.message || 'Conversion failed') }
    finally { setConverting(false) }
  }

  if (loadingData) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  const availablePersons  = persons.filter(p  => (p.remainingBalance  || 0) > 0)
  const availableAdvances = advances.filter(a => (a.remainingAmount || 0) > 0)

  return (
    <div className="space-y-4 max-w-3xl">

      {/* ── Row 1: Select person (Direct Payment) ── */}
      <div className="card p-4 space-y-3">
        <h4 className="text-sm font-semibold">Step 1 — Who to Pay (Direct Payment)</h4>

        {availablePersons.length === 0 ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 text-sm rounded-xl p-3">
            No persons with remaining QAR balance. Add deposits first.
          </div>
        ) : (
          <>
            <div>
              <label className="label">Select Person (Direct Payment Record)</label>
              <select className="input" value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)}>
                <option value="">— Select Person —</option>
                {availablePersons.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.personName} — QAR {p.remainingBalance?.toLocaleString()} remaining @ Rs{p.weightedAvgRate?.toFixed(4)}
                  </option>
                ))}
              </select>
            </div>

            {selectedPerson && (
              <div className="grid grid-cols-3 gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                <div>
                  <div className="text-gray-400">Total Deposited</div>
                  <div className="font-semibold">{fmtQAR(selectedPerson.totalDeposited)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Remaining (We owe them)</div>
                  <div className="font-semibold text-blue-600">{fmtQAR(selectedPerson.remainingBalance)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Buy Rate (Avg)</div>
                  <div className="font-semibold text-blue-600">Rs{buyRate.toFixed(4)}</div>
                </div>
              </div>
            )}

            <div>
              <label className="label">Amount to Pay (QAR)</label>
              <input
                className="input"
                type="number"
                value={inputAmount}
                onChange={e => { setInputAmount(e.target.value); setResult(null) }}
                placeholder="e.g. 3800"
                step="0.01"
              />
              {exceedsDP && (
                <p className="text-xs text-red-500 mt-1">
                  Exceeds remaining balance ({fmtQAR(selectedPerson.remainingBalance)})
                </p>
              )}
            </div>

            {amt > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="font-mono text-blue-600 font-semibold">{fmtQAR(amt)}</span>
                  <span>×</span>
                  <span className="font-mono text-purple-600 font-semibold">{factor}</span>
                  <span>=</span>
                  <span className="font-mono text-green-600 font-semibold text-sm">{fmtQAR(converted)}</span>
                  <span className="text-gray-400 ml-1">(amount to deduct from advance)</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Row 2: Select advance record to pay from ── */}
      {amt > 0 && selectedPerson && !exceedsDP && (
        <div className="card p-4 space-y-3">
          <h4 className="text-sm font-semibold">Step 2 — Pay From (Advance Record)</h4>
          <p className="text-xs text-gray-400">
            {fmtQAR(converted)} will be deducted from the selected advance record.
          </p>

          {availableAdvances.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 text-sm rounded-xl p-3">
              No advance records with remaining balance. Add advance records first.
            </div>
          ) : (
            <>
              <div>
                <label className="label">Select Advance Record</label>
                <select className="input" value={selectedAdvanceId} onChange={e => setSelectedAdvanceId(e.target.value)}>
                  <option value="">— Select Advance Record —</option>
                  {availableAdvances.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.personName} — AED {a.remainingAmount?.toLocaleString()} available @ Rs{a.rate?.toFixed(4)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAdvance && (
                <div className="grid grid-cols-3 gap-2 text-xs bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                  <div>
                    <div className="text-gray-400">Total Advance</div>
                    <div className="font-semibold">{fmtAED(selectedAdvance.aedAmount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Available</div>
                    <div className="font-semibold text-green-600">{fmtAED(selectedAdvance.remainingAmount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Sell Rate</div>
                    <div className="font-semibold text-green-600">Rs{sellRate.toFixed(4)}</div>
                  </div>
                </div>
              )}

              {exceedsAdv && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
                  ⚠ Converted amount ({fmtAED(converted)}) exceeds available advance balance ({fmtAED(selectedAdvance?.remainingAmount)}).
                  Please select a different advance record or reduce input amount.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Row 3: Profit calculation ── */}
      {amt > 0 && selectedPerson && selectedAdvance && !exceedsDP && !exceedsAdv && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <RefreshCw size={14} className="text-blue-600"/> Profit Calculation
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-blue-600 text-white rounded-xl p-3">
              <div className="text-xs opacity-80">Pay to {selectedPerson.personName}</div>
              <div className="text-lg font-bold">{fmtQAR(amt)}</div>
              <div className="text-xs opacity-70 mt-1">× {factor} = {fmtQAR(converted)}</div>
            </div>
            <div className="bg-indigo-600 text-white rounded-xl p-3">
              <div className="text-xs opacity-80">Cost (Buy Rate)</div>
              <div className="text-lg font-bold">{fmtPKR(costPKR)}</div>
              <div className="text-xs opacity-70 mt-1">{fmtQAR(converted)} × Rs{buyRate.toFixed(2)}</div>
            </div>
            <div className="bg-purple-600 text-white rounded-xl p-3">
              <div className="text-xs opacity-80">Revenue (Sell Rate)</div>
              <div className="text-lg font-bold">{fmtPKR(revenuePKR)}</div>
              <div className="text-xs opacity-70 mt-1">{fmtAED(converted)} × Rs{sellRate.toFixed(2)}</div>
            </div>
            <div className={`${profitPKR >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white rounded-xl p-3`}>
              <div className="text-xs opacity-80">Net Profit</div>
              <div className="text-lg font-bold">{fmtPKR(profitPKR)}</div>
              <div className="text-xs opacity-70 mt-1">
                Rs{(sellRate - buyRate).toFixed(4)} × {fmtQAR(converted)}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            Profit = ({fmtAED(converted)} × Rs{sellRate.toFixed(4)}) − ({fmtQAR(converted)} × Rs{buyRate.toFixed(4)}) = <strong className={profitPKR >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtPKR(profitPKR)}</strong>
          </div>
        </div>
      )}

      {/* ── Row 4: Confirm ── */}
      {amt > 0 && selectedPerson && selectedAdvance && !exceedsDP && !exceedsAdv && (
        <div className="card p-4">
          <h4 className="text-sm font-semibold mb-3">Confirm Transaction</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
            {/* Left: Direct Payment side */}
            <div className="space-y-1">
              <div className="font-semibold text-blue-600 mb-2 uppercase tracking-wide text-[10px]">Direct Payment (Buy Side)</div>
              <div className="flex justify-between"><span className="text-gray-400">Person:</span><strong>{selectedPerson.personName}</strong></div>
              <div className="flex justify-between"><span className="text-gray-400">Input Amount:</span><strong>{fmtQAR(amt)}</strong></div>
              <div className="flex justify-between"><span className="text-gray-400">After × {factor}:</span><strong>{fmtQAR(converted)}</strong></div>
              <div className="flex justify-between"><span className="text-gray-400">Buy Rate:</span><strong>Rs{buyRate.toFixed(4)}</strong></div>
              <div className="flex justify-between"><span className="text-gray-400">Remaining after:</span><strong className="text-blue-600">{fmtQAR((selectedPerson.remainingBalance || 0) - amt)}</strong></div>
            </div>
            {/* Right: Advance side */}
            <div className="space-y-1">
              <div className="font-semibold text-green-600 mb-2 uppercase tracking-wide text-[10px]">Advance (Sell Side)</div>
              <div className="flex justify-between"><span className="text-gray-400">Person:</span><strong>{selectedAdvance.personName}</strong></div>
              <div className="flex justify-between"><span className="text-gray-400">Deduct Amount:</span><strong>{fmtAED(converted)}</strong></div>
              <div className="flex justify-between"><span className="text-gray-400">Sell Rate:</span><strong>Rs{sellRate.toFixed(4)}</strong></div>
              <div className="flex justify-between"><span className="text-gray-400">Remaining after:</span><strong className="text-green-600">{fmtAED((selectedAdvance.remainingAmount || 0) - converted)}</strong></div>
            </div>
            {/* Profit row full width */}
            <div className="col-span-2 pt-2 mt-1 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm font-bold">
              <span>Net Profit:</span>
              <strong className={profitPKR >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtPKR(profitPKR)}</strong>
            </div>
          </div>

          <button
            onClick={doConvert}
            disabled={converting}
            className="btn-primary w-full justify-center py-3 text-sm"
          >
            {converting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Processing...</>
              : <>✓ Confirm — Pay {fmtQAR(converted)} from {selectedAdvance.personName}'s Advance</>
            }
          </button>
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">✓ Conversion Successful!</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><div className="text-green-600 mb-0.5">Input (QAR)</div><div className="font-semibold">{fmtQAR(result.inputAmount)}</div></div>
            <div><div className="text-green-600 mb-0.5">Converted (AED)</div><div className="font-semibold">{fmtAED(result.convertedAmount)}</div></div>
            <div><div className="text-green-600 mb-0.5">PKR Value</div><div className="font-semibold">{fmtPKR(result.pkrValue)}</div></div>
            <div><div className="text-green-600 mb-0.5">Net Profit</div><div className="font-semibold">{fmtPKR(result.netProfit)}</div></div>
          </div>
          <button onClick={() => setResult(null)} className="mt-3 btn-secondary text-xs py-1.5">New Conversion</button>
        </div>
      )}
    </div>
  )
}