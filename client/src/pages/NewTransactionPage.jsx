import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { fmtPKR, fmtAED } from '../utils/format'
import toast from 'react-hot-toast'
import RiyalTab from '../components/RiyalTab'

// ─── Tab button ────────────────────────────────────────────────────────────────
const MainTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
    }`}
  >
    {label}
  </button>
)

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function NewTransactionPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('riyal')
  const [loading, setLoading] = useState(false)

  // Dirham form
  const [dirham, setDirham] = useState({
    buyPerson: '', buyAmount: '', buyRate: '',
    sellPerson: '', sellAmount: '', sellRate: '',
    notes: '', date: new Date().toISOString().split('T')[0]
  })
  const dBuyTotal  = (Number(dirham.buyAmount)  || 0) * (Number(dirham.buyRate)  || 0)
  const dSellTotal = (Number(dirham.sellAmount) || 0) * (Number(dirham.sellRate) || 0)
  const dProfit    = dSellTotal - dBuyTotal

  // PKR form
  const [pkr, setPkr] = useState({
    buyPerson: '', sellPerson: '', amount: '',
    marginPercent: '0.5', notes: '',
    date: new Date().toISOString().split('T')[0]
  })
  const pkrProfit = ((Number(pkr.amount) || 0) * (Number(pkr.marginPercent) || 0)) / 100

  // Advance form
  const [adv, setAdv] = useState({
    personName: '', aedAmount: '', rate: '',
    notes: '', date: new Date().toISOString().split('T')[0]
  })
  const advPKR = (Number(adv.aedAmount) || 0) * (Number(adv.rate) || 0)

  const saveDirham = async () => {
    if (!dirham.buyPerson || !dirham.sellPerson || !dirham.buyAmount || !dirham.sellAmount)
      return toast.error('Fill all required fields')
    setLoading(true)
    try {
      await api.post('/dirham', dirham)
      toast.success('Dirham transaction saved!')
      navigate('/dirham')
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  const savePKR = async () => {
    if (!pkr.buyPerson || !pkr.sellPerson || !pkr.amount)
      return toast.error('Fill all required fields')
    setLoading(true)
    try {
      await api.post('/pkr', pkr)
      toast.success('PKR transaction saved!')
      navigate('/pkr')
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  const saveAdvance = async () => {
    if (!adv.personName || !adv.aedAmount || !adv.rate)
      return toast.error('Fill all required fields')
    setLoading(true)
    try {
      await api.post('/advance', adv)
      toast.success('Advance saved!')
      navigate('/advance')
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="card">
        {/* Main tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 px-2">
          {['riyal', 'dirham', 'pkr', 'advance'].map(t => (
            <MainTab
              key={t}
              label={t.charAt(0).toUpperCase() + t.slice(1)}
              active={tab === t}
              onClick={() => setTab(t)}
            />
          ))}
        </div>

        {/* ════ RIYAL TAB ════ */}
        {tab === 'riyal' && (
          <RiyalTab loading={loading} setLoading={setLoading} />
        )}

        {/* ════ DIRHAM TAB ════ */}
        {tab === 'dirham' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-red-200 dark:border-red-800/50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-red-600 uppercase">↓ Buy Dirham</h4>
                <div>
                  <label className="label">Buy From</label>
                  <input className="input" value={dirham.buyPerson} onChange={e => setDirham({ ...dirham, buyPerson: e.target.value })} placeholder="Person name"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Amount (AED)</label>
                    <input className="input" type="number" value={dirham.buyAmount} onChange={e => setDirham({ ...dirham, buyAmount: e.target.value })} placeholder="0"/>
                  </div>
                  <div>
                    <label className="label">Buy Rate (Rs)</label>
                    <input className="input" type="number" value={dirham.buyRate} onChange={e => setDirham({ ...dirham, buyRate: e.target.value })} placeholder="76.00" step="0.0001"/>
                  </div>
                </div>
                <div className="bg-red-600 text-white rounded-lg p-3">
                  <p className="text-xs opacity-80">Buy Total</p>
                  <p className="text-xl font-bold">{fmtPKR(dBuyTotal)}</p>
                </div>
              </div>
              <div className="border border-green-200 dark:border-green-800/50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-green-600 uppercase">↑ Sell Dirham</h4>
                <div>
                  <label className="label">Sell To</label>
                  <input className="input" value={dirham.sellPerson} onChange={e => setDirham({ ...dirham, sellPerson: e.target.value })} placeholder="Person name"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Amount (AED)</label>
                    <input className="input" type="number" value={dirham.sellAmount} onChange={e => setDirham({ ...dirham, sellAmount: e.target.value })} placeholder="0"/>
                  </div>
                  <div>
                    <label className="label">Sell Rate (Rs)</label>
                    <input className="input" type="number" value={dirham.sellRate} onChange={e => setDirham({ ...dirham, sellRate: e.target.value })} placeholder="76.50" step="0.0001"/>
                  </div>
                </div>
                <div className="bg-green-600 text-white rounded-lg p-3">
                  <p className="text-xs opacity-80">Sell Total</p>
                  <p className="text-xl font-bold">{fmtPKR(dSellTotal)}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs opacity-80">Profit</p>
                <p className="text-2xl font-bold">{fmtPKR(dProfit)}</p>
              </div>
              <input
                className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none"
                type="date"
                value={dirham.date}
                onChange={e => setDirham({ ...dirham, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={dirham.notes} onChange={e => setDirham({ ...dirham, notes: e.target.value })}/>
            </div>
            <div className="flex justify-end">
              <button onClick={saveDirham} disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Dirham'}
              </button>
            </div>
          </div>
        )}

        {/* ════ PKR TAB ════ */}
        {tab === 'pkr' && (
          <div className="p-4 space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Buy From</label>
                <input className="input" value={pkr.buyPerson} onChange={e => setPkr({ ...pkr, buyPerson: e.target.value })} placeholder="Person name"/>
              </div>
              <div>
                <label className="label">Sell To</label>
                <input className="input" value={pkr.sellPerson} onChange={e => setPkr({ ...pkr, sellPerson: e.target.value })} placeholder="Person name"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (PKR)</label>
                <input className="input" type="number" value={pkr.amount} onChange={e => setPkr({ ...pkr, amount: e.target.value })} placeholder="100000"/>
              </div>
              <div>
                <label className="label">Margin (%)</label>
                <input className="input" type="number" value={pkr.marginPercent} onChange={e => setPkr({ ...pkr, marginPercent: e.target.value })} step="0.1" placeholder="0.5"/>
              </div>
            </div>
            <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs opacity-80">Profit</p>
                <p className="text-2xl font-bold">{fmtPKR(pkrProfit)}</p>
              </div>
              <input
                className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none"
                type="date"
                value={pkr.date}
                onChange={e => setPkr({ ...pkr, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={pkr.notes} onChange={e => setPkr({ ...pkr, notes: e.target.value })}/>
            </div>
            <div className="flex justify-end">
              <button onClick={savePKR} disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save PKR'}
              </button>
            </div>
          </div>
        )}

        {/* ════ ADVANCE TAB ════ */}
        {tab === 'advance' && (
          <div className="p-4 space-y-4 max-w-lg">
            <div>
              <label className="label">Person Name</label>
              <input className="input" value={adv.personName} onChange={e => setAdv({ ...adv, personName: e.target.value })} placeholder="Person name"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (AED)</label>
                <input className="input" type="number" value={adv.aedAmount} onChange={e => setAdv({ ...adv, aedAmount: e.target.value })} placeholder="5000"/>
              </div>
              <div>
                <label className="label">Rate (Rs per AED)</label>
                <input className="input" type="number" value={adv.rate} onChange={e => setAdv({ ...adv, rate: e.target.value })} placeholder="76.50" step="0.0001"/>
              </div>
            </div>
            <div className="bg-blue-600 text-white rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs opacity-80">PKR Equivalent</p>
                <p className="text-2xl font-bold">{fmtPKR(advPKR)}</p>
              </div>
              <input
                className="bg-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none"
                type="date"
                value={adv.date}
                onChange={e => setAdv({ ...adv, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={adv.notes} onChange={e => setAdv({ ...adv, notes: e.target.value })}/>
            </div>
            <div className="flex justify-end">
              <button onClick={saveAdvance} disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Advance'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}