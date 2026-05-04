import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { MdDownload, MdCalendarToday, MdTrendingUp } from 'react-icons/md';
import api from '../utils/api';
import { formatPKR, formatAmount, formatDate, today, startOfMonth, startOfWeek } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="bg-surface-100 border border-surface-200 rounded-xl p-3 text-xs">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{color:p.color}}>{p.name}: {formatPKR(p.value)}</p>)}
    </div>
  );
  return null;
};

export default function Reports() {
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({ startDate: startOfMonth(), endDate: today() });
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    const end = today();
    let start = today();
    if (p === 'daily') { start = today(); }
    else if (p === 'weekly') { start = startOfWeek(); }
    else { start = startOfMonth(); }
    setDateRange({ startDate: start, endDate: end });
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const [profitRes, summaryRes] = await Promise.all([
        api.get('/reports/profit', { params: { startDate: dateRange.startDate, endDate: dateRange.endDate } }),
        api.get('/reports/summary', { params: { months: 3 } }),
      ]);
      setData(profitRes.data);
      setChartData(summaryRes.data.map(d => ({
        day: `${d._id.day}/${d._id.month}`,
        Profit: Math.round(d.totalProfit),
        Volume: Math.round(d.totalVolume / 1000),
        AED: Math.round(d.aedAmount),
        SAR: Math.round(d.sarAmount),
      })));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [dateRange]);

  const handleExportCSV = () => {
    if (!data?.transactions) return;
    const headers = ['Date', 'Person', 'Type', 'Currency', 'Amount', 'Rate', 'Total PKR', 'Profit'];
    const rows = data.transactions.map(t => [
      formatDate(t.date), t.person?.name, t.type, t.currency,
      t.amount, t.rate, t.totalPKR, t.profit || 0
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report_${dateRange.startDate}_${dateRange.endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Reports</h1>
          <p className="text-white/40 text-sm">Profit & performance analytics</p>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
          <MdDownload size={16} /> Export CSV
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {[['daily', 'Today'], ['weekly', 'This Week'], ['monthly', 'This Month'], ['custom', 'Custom']].map(([val, label]) => (
          <button key={val} onClick={() => handlePeriodChange(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${period === val ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Date Range (for custom or shown always) */}
      <div className="card">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={dateRange.startDate} onChange={e => { setPeriod('custom'); setDateRange(d => ({ ...d, startDate: e.target.value })); }} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={dateRange.endDate} onChange={e => { setPeriod('custom'); setDateRange(d => ({ ...d, endDate: e.target.value })); }} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card border-accent-gold/20">
            <MdTrendingUp className="text-accent-gold mb-1" size={18} />
            <div className="text-xs text-white/40 uppercase tracking-wider">Total Profit</div>
            <div className={`font-mono-num text-2xl font-bold ${data.totalProfit >= 0 ? 'text-accent-gold' : 'text-accent-red'}`}>
              {formatPKR(data.totalProfit)}
            </div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-white/40 uppercase tracking-wider">Total Volume</div>
            <div className="font-mono-num text-2xl font-bold">{formatPKR(data.totalVolume)}</div>
          </div>
          <div className="stat-card">
            <span className="badge-aed mb-2 inline-block">AED</span>
            <div className="text-xs text-white/40 uppercase tracking-wider">AED Traded</div>
            <div className="font-mono-num text-2xl font-bold text-accent-purple">{formatAmount(data.aedVolume)}</div>
          </div>
          <div className="stat-card">
            <span className="badge-sar mb-2 inline-block">SAR</span>
            <div className="text-xs text-white/40 uppercase tracking-wider">SAR Traded</div>
            <div className="font-mono-num text-2xl font-bold text-accent-green">{formatAmount(data.sarVolume)}</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-semibold mb-4">Daily Profit (3 months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Profit" stroke="#d4a843" strokeWidth={2} dot={false} name="Profit (PKR)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-display font-semibold mb-4">AED vs SAR Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
              <Bar dataKey="AED" fill="#8b5cf6" radius={[3,3,0,0]} />
              <Bar dataKey="SAR" fill="#22c55e" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      {data?.transactions && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-surface-200 flex items-center justify-between">
            <h3 className="font-display font-semibold">Transaction Details</h3>
            <span className="text-xs text-white/40">{data.transactions.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="table-head text-left">Date</th>
                  <th className="table-head text-left">Person</th>
                  <th className="table-head text-center">Type</th>
                  <th className="table-head text-center">Currency</th>
                  <th className="table-head text-right">Amount</th>
                  <th className="table-head text-right">Rate</th>
                  <th className="table-head text-right">Total PKR</th>
                  <th className="table-head text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-white/30">Loading...</td></tr>
                ) : data.transactions.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-white/30">No transactions in this period</td></tr>
                ) : data.transactions.map(tx => (
                  <tr key={tx._id} className="table-row">
                    <td className="table-cell text-xs text-white/50">{formatDate(tx.date)}</td>
                    <td className="table-cell">{tx.person?.name}</td>
                    <td className="table-cell text-center"><span className={tx.type==='Buy'?'badge-buy':'badge-sell'}>{tx.type}</span></td>
                    <td className="table-cell text-center"><span className={tx.currency==='AED'?'badge-aed':'badge-sar'}>{tx.currency}</span></td>
                    <td className="table-cell text-right font-mono-num">{formatAmount(tx.amount)}</td>
                    <td className="table-cell text-right font-mono-num text-white/60">{tx.rate?.toFixed(2)}</td>
                    <td className="table-cell text-right font-mono-num">{formatPKR(tx.totalPKR)}</td>
                    <td className={`table-cell text-right font-mono-num font-semibold ${(tx.profit||0)>=0?'text-accent-green':'text-accent-red'}`}>
                      {tx.profit ? formatPKR(tx.profit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {data.transactions.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-surface-200 bg-surface-100">
                    <td colSpan={6} className="table-cell font-semibold text-white/60">Totals</td>
                    <td className="table-cell text-right font-mono-num font-bold">{formatPKR(data.totalVolume)}</td>
                    <td className={`table-cell text-right font-mono-num font-bold ${data.totalProfit>=0?'text-accent-gold':'text-accent-red'}`}>{formatPKR(data.totalProfit)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
