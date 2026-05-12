import { useEffect, useState } from 'react'
import { TrendingUp, Sun, Clock, Building2, Home, CreditCard } from 'lucide-react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import api from '../utils/api'
import StatCard from '../components/common/StatCard'
import Badge from '../components/common/Badge'
import { fmtPKR, fmtAED, fmtDate } from '../utils/format'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(r => { setData(r.data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!data) return (
    <div className="text-center text-gray-400 py-16">
      <p className="text-lg font-medium mb-1">No data available</p>
      <p className="text-sm">Make sure your server is running and MongoDB is connected.</p>
    </div>
  )

  const barData = {
    labels: (data.dailyProfit || []).map(d => d._id ? d._id.slice(5) : ''),
    datasets: [{
      label: 'Profit (PKR)',
      data: (data.dailyProfit || []).map(d => d.total),
      backgroundColor: '#3b82f6',
      borderRadius: 6
    }]
  }

  const donutData = {
    labels: ['Riyal', 'Dirham', 'PKR'],
    datasets: [{ data: [45, 35, 20], backgroundColor: ['#3b82f6','#8b5cf6','#f59e0b'], borderWidth: 0 }]
  }

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, callback: v => '₨' + v.toLocaleString() } }
    }
  }

  const recent = data.recentTransactions || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Profit" value={fmtPKR(data.totalProfit)} sub="All time" icon={TrendingUp} color="green"/>
        <StatCard label="Today's Profit" value={fmtPKR(data.todayProfit)} icon={Sun} color="blue"/>
        <StatCard label="Pending" value={fmtPKR(data.pendingPayments)} sub="Unpaid + partial" icon={Clock} color="amber"/>
        <StatCard label="Loans Given" value={fmtPKR(data.loansGiven)} icon={Building2} color="red"/>
        <StatCard label="Village Balance" value={fmtPKR(data.villageBalance)} icon={Home} color="purple"/>
        <StatCard label="Advance (AED)" value={fmtAED(data.advanceBalance)} icon={CreditCard} color="teal"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <h3 className="text-sm font-semibold mb-3">Daily Profit (Last 10 Days)</h3>
          <div className="h-48">
            {barData.labels.length > 0
              ? <Bar data={barData} options={chartOpts}/>
              : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No profit data yet</div>
            }
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-semibold mb-3">Currency Volume</h3>
          <div className="h-36">
            <Doughnut data={donutData} options={{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ display:true, position:'bottom', labels:{ font:{ size:10 }, boxWidth:10 } } } }}/>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold">Recent Transactions</h3>
          <span className="text-xs text-gray-400">Latest records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Date</th>
                <th className="th">Type</th>
                <th className="th">Buy Person</th>
                <th className="th">Sell Person</th>
                <th className="th">Profit</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0
                ? <tr><td colSpan={6} className="td text-center py-8 text-gray-400">No recent transactions</td></tr>
                : recent.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="td text-gray-400 text-xs">{fmtDate(t.date)}</td>
                    <td className="td"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{t.currency || 'SAR'}</span></td>
                    <td className="td">{t.buyPerson}</td>
                    <td className="td">{t.sellPerson}</td>
                    <td className="td text-green-600 font-medium">{fmtPKR(t.profit)}</td>
                    <td className="td"><Badge status={t.paymentStatus}/></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
