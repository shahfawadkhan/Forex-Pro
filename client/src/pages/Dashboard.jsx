import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MdTrendingUp, MdTrendingDown, MdAccountBalance, MdPeople, MdSwapHoriz, MdArrowForward } from 'react-icons/md';
import api from '../utils/api';
import { formatPKR, formatAmount, formatDate } from '../utils/formatters';
import { useApp } from '../context/AppContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-100 border border-surface-200 rounded-xl p-3 text-xs">
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatPKR(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { accounts } = useApp();

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/reports/summary?months=1')
    ]).then(([dash, summary]) => {
      setData(dash.data);
      const formatted = summary.data.map(d => ({
        day: `${d._id.day}/${d._id.month}`,
        Profit: Math.round(d.totalProfit),
        Volume: Math.round(d.totalVolume / 1000),
        label: `${d._id.day}/${d._id.month}/${d._id.year}`
      }));
      setChartData(formatted);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-gradient-gold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Currency Exchange Overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card glow-gold">
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Receivable</div>
          <div className="font-mono-num text-xl font-semibold text-accent-green mt-1">
            {formatPKR(data?.totalReceivable)}
          </div>
          <div className="text-xs text-white/30">People owe us</div>
        </div>

        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Payable</div>
          <div className="font-mono-num text-xl font-semibold text-accent-red mt-1">
            {formatPKR(data?.totalPayable)}
          </div>
          <div className="text-xs text-white/30">We owe people</div>
        </div>

        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Net Position</div>
          <div className={`font-mono-num text-xl font-semibold mt-1 ${data?.netBalance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {formatPKR(data?.netBalance)}
          </div>
          <div className="text-xs text-white/30">{data?.netBalance >= 0 ? 'Net Receivable' : 'Net Payable'}</div>
        </div>

        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Cash & Bank</div>
          <div className="font-mono-num text-xl font-semibold text-accent-blue mt-1">
            {formatPKR(data?.totalAccountBalance)}
          </div>
          <div className="text-xs text-white/30">All accounts</div>
        </div>
      </div>

      {/* Today & Month Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-accent-gold/20">
          <MdTrendingUp className="text-accent-gold mb-2" size={20} />
          <div className="text-xs text-white/40 uppercase tracking-wider">Today's Profit</div>
          <div className="font-mono-num text-lg font-semibold text-accent-gold">
            {formatPKR(data?.todayProfit)}
          </div>
        </div>
        <div className="stat-card">
          <MdSwapHoriz className="text-white/40 mb-2" size={20} />
          <div className="text-xs text-white/40 uppercase tracking-wider">Today's Volume</div>
          <div className="font-mono-num text-lg font-semibold">{formatPKR(data?.todayVolume)}</div>
          <div className="text-xs text-white/30">{data?.todayTxCount} transactions</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Month Profit</div>
          <div className="font-mono-num text-lg font-semibold text-accent-green">{formatPKR(data?.monthProfit)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Month Volume</div>
          <div className="font-mono-num text-lg font-semibold">{formatPKR(data?.monthVolume)}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profit Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Daily Profit</h3>
              <p className="text-xs text-white/40">Last 30 days</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a843" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4a843" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Profit" stroke="#d4a843" strokeWidth={2} fill="url(#profitGrad)" name="Profit (PKR)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-white/30 text-sm">No data yet</div>
          )}
        </div>

        {/* Volume Bar Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Volume (000s PKR)</h3>
              <p className="text-xs text-white/40">Last 30 days</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Volume (K PKR)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-white/30 text-sm">No data yet</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Account Balances</h3>
            <Link to="/accounts" className="text-xs text-accent-gold hover:underline flex items-center gap-1">
              Manage <MdArrowForward size={14} />
            </Link>
          </div>
          {accounts.length === 0 ? (
            <p className="text-white/30 text-sm">No accounts yet.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map(acc => (
                <div key={acc._id} className="flex items-center justify-between py-2 border-b border-surface-200 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${acc.type === 'Bank' ? 'bg-accent-blue' : 'bg-accent-gold'}`} />
                    <span className="text-sm">{acc.name}</span>
                    <span className="text-xs text-white/30">{acc.type}</span>
                  </div>
                  <span className={`font-mono-num text-sm font-semibold ${acc.balance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatPKR(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Persons */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Top Balances</h3>
            <Link to="/persons" className="text-xs text-accent-gold hover:underline flex items-center gap-1">
              All Persons <MdArrowForward size={14} />
            </Link>
          </div>
          {!data?.topPersons?.length ? (
            <p className="text-white/30 text-sm">No persons yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topPersons.map(p => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-surface-200 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-surface-200 rounded-full flex items-center justify-center text-xs font-bold text-white/60">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm">{p.name}</p>
                      <p className="text-xs text-white/30">{p.type}</p>
                    </div>
                  </div>
                  <span className={`font-mono-num text-sm font-semibold ${p.balance > 0 ? 'text-accent-green' : p.balance < 0 ? 'text-accent-red' : 'text-white/40'}`}>
                    {formatPKR(Math.abs(p.balance))}
                    <span className="text-xs ml-1 text-white/30">{p.balance > 0 ? 'owes' : p.balance < 0 ? 'owed' : ''}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
