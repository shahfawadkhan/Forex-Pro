import { useEffect, useState } from 'react'
import { Eye, EyeOff, RotateCcw, TrendingUp, Sun, Calendar } from 'lucide-react'
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import api from '../utils/api'
import StatCard from '../components/common/StatCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { fmtPKR, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ProfitPage() {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [resetDialog, setResetDialog] = useState(false)
  const [histPage, setHistPage] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const [summary, hist] = await Promise.all([
        api.get('/profit/summary'),
        api.get('/profit/history?limit=10')
      ])
      setData(summary.data.data)
      setHistory(hist.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggleHide = async () => {
    try { await api.post('/profit/toggle-hide'); setHidden(!hidden) }
    catch { setHidden(!hidden) } // fallback to local toggle
  }

  const resetProfit = async () => {
    try { await api.post('/profit/reset'); toast.success('Profit reset successfully'); load() }
    catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const blur = hidden ? 'filter blur-sm select-none' : ''

  const monthlyTrend = data?.monthlyTrend || []
  const lineData = {
    labels: monthlyTrend.map(m => MONTHS[(m._id?.month||1)-1]),
    datasets: [{ label:'Monthly Profit', data: monthlyTrend.map(m=>m.total), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.1)', fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:'#3b82f6' }]
  }

  const byCurrency = data?.byCurrency || []
  const barData = {
    labels: byCurrency.map(c => c._id?.charAt(0).toUpperCase()+c._id?.slice(1)),
    datasets: [{ label:'Profit by Source', data: byCurrency.map(c=>c.total), backgroundColor:['#3b82f6','#8b5cf6','#f59e0b','#10b981','#ef4444'], borderRadius:8 }]
  }

  const chartOpts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{font:{size:10}}}, y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{font:{size:10},callback:v=>'₨'+v.toLocaleString()}} } }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={toggleHide} className="btn-secondary text-xs py-2">
          {hidden ? <><Eye size={13}/>Show Profit</> : <><EyeOff size={13}/>Hide Profit</>}
        </button>
        <button onClick={()=>setResetDialog(true)} className="btn-danger text-xs py-2"><RotateCcw size={13}/>Reset Profit</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={blur}><StatCard label="Total Profit" value={fmtPKR(data?.total)} icon={TrendingUp} color="green" sub="All time"/></div>
        <div className={blur}><StatCard label="Today" value={fmtPKR(data?.today)} icon={Sun} color="blue"/></div>
        <div className={blur}><StatCard label="This Month" value={fmtPKR(data?.monthly)} icon={Calendar} color="purple"/></div>
        {byCurrency.map(c => (
          <div key={c._id} className={blur}><StatCard label={c._id?.charAt(0).toUpperCase()+c._id?.slice(1)} value={fmtPKR(c.total)} color="teal"/></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-sm font-semibold mb-3">Monthly Profit Trend</h3>
          <div className="h-52"><Line data={lineData} options={chartOpts}/></div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-3">Profit by Source</h3>
          <div className="h-52"><Bar data={barData} options={{...chartOpts, scales:{...chartOpts.scales, y:{...chartOpts.scales.y, ticks:{...chartOpts.scales.y.ticks, callback:v=>'₨'+v.toLocaleString()}}}}}/></div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold">Recent Profit Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th">Date</th><th className="th">Source</th><th className="th">Amount</th><th className="th">Currency</th><th className="th">Notes</th></tr></thead>
            <tbody>
              {history.length===0 && <tr><td colSpan={5} className="td text-center py-8 text-gray-400">No profit records yet</td></tr>}
              {history.map((p,i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="td text-gray-400 text-xs">{fmtDate(p.date)}</td>
                  <td className="td capitalize"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{p.source}</span></td>
                  <td className={`td font-medium ${blur}`}><span className="text-green-600">{fmtPKR(p.amount)}</span></td>
                  <td className="td text-xs">{p.currency}</td>
                  <td className="td text-xs text-gray-400">{p.notes||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog open={resetDialog} onClose={()=>setResetDialog(false)} onConfirm={resetProfit} title="Reset Profit" message="This will mark all current profits as reset. This action cannot be undone. Are you sure?" confirmText="Reset All Profit" danger/>
    </div>
  )
}
