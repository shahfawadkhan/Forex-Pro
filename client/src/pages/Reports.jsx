import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { MdDownload, MdPrint, MdTrendingUp, MdTableChart, MdHandshake, MdVilla } from 'react-icons/md';
import api from '../utils/api';
import { formatPKR, formatAmount, formatDate, today, startOfMonth, startOfWeek } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="bg-surface-100 border border-surface-200 rounded-xl p-3 text-xs">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatPKR(p.value)}</p>)}
    </div>
  );
  return null;
};

export default function Reports() {
  const [tab, setTab]             = useState('transactions');
  const [period, setPeriod]       = useState('monthly');
  const [dateRange, setDateRange] = useState({ startDate: startOfMonth(), endDate: today() });
  const [txData, setTxData]       = useState(null);
  const [loanData, setLoanData]   = useState(null);
  const [villageData, setVillageData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading]     = useState(false);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    const end = today();
    const start = p === 'daily' ? today() : p === 'weekly' ? startOfWeek() : startOfMonth();
    setDateRange({ startDate: start, endDate: end });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profitRes, summaryRes, loanRes, villageRes] = await Promise.all([
        api.get('/reports/profit', { params: { startDate: dateRange.startDate, endDate: dateRange.endDate } }),
        api.get('/reports/summary', { params: { months: 3 } }),
        api.get('/reports/loans'),
        api.get('/reports/village'),
      ]);
      setTxData(profitRes.data);
      setLoanData(loanRes.data);
      setVillageData(villageRes.data);
      setChartData(summaryRes.data.map(d => ({
        day: `${d._id.day}/${d._id.month}`,
        Profit: Math.round(d.totalProfit),
        AED: Math.round(d.aedAmount),
        SAR: Math.round(d.sarAmount),
      })));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [dateRange]);

  const handleExcelExport = async (type) => {
    try {
      const params = new URLSearchParams({ startDate: dateRange.startDate, endDate: dateRange.endDate, type });
      const url = `/api/reports/export-excel?${params}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `forexpro_${type}.xlsx`;
      // need auth header — fetch it then create blob
      const token = localStorage.getItem('token');
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch { }
  };

  const handlePrint = () => window.print();

  const TABS = [
    { id: 'transactions', label: 'Transactions', icon: MdTableChart },
    { id: 'loans',        label: 'Loans',        icon: MdHandshake },
    { id: 'village',      label: 'Village',      icon: MdVilla },
  ];

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Reports</h1>
          <p className="text-white/40 text-sm">Profit & performance analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <MdPrint size={16} /> Print
          </button>
          <button onClick={() => handleExcelExport(tab)} className="btn-secondary flex items-center gap-2">
            <MdDownload size={16} /> Export Excel
          </button>
          <button onClick={() => handleExcelExport('all')} className="btn-primary flex items-center gap-2">
            <MdDownload size={16} /> Export All
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 print:hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${tab === id ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── TRANSACTIONS TAB ── */}
      {tab === 'transactions' && (
        <>
          {/* Period Selector */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {[['daily','Today'],['weekly','This Week'],['monthly','This Month'],['custom','Custom']].map(([val, label]) => (
              <button key={val} onClick={() => handlePeriodChange(val)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${period === val ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="card print:hidden">
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
          {txData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card border-accent-gold/20">
                <MdTrendingUp className="text-accent-gold mb-1" size={18} />
                <div className="text-xs text-white/40 uppercase tracking-wider">Total Profit</div>
                <div className={`font-mono-num text-2xl font-bold ${txData.totalProfit >= 0 ? 'text-accent-gold' : 'text-accent-red'}`}>
                  {formatPKR(txData.totalProfit)}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs text-white/40 uppercase tracking-wider">Total Volume</div>
                <div className="font-mono-num text-2xl font-bold">{formatPKR(txData.totalVolume)}</div>
              </div>
              <div className="stat-card">
                <span className="badge-aed mb-2 inline-block">AED</span>
                <div className="text-xs text-white/40 uppercase tracking-wider">AED Traded</div>
                <div className="font-mono-num text-2xl font-bold text-accent-purple">{formatAmount(txData.aedVolume)}</div>
              </div>
              <div className="stat-card">
                <span className="badge-sar mb-2 inline-block">SAR</span>
                <div className="text-xs text-white/40 uppercase tracking-wider">SAR Traded</div>
                <div className="font-mono-num text-2xl font-bold text-accent-green">{formatAmount(txData.sarVolume)}</div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 print:hidden">
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
          {txData?.transactions && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="font-display font-semibold">Transaction Details</h3>
                <span className="text-xs text-white/40">{txData.transactions.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200">
                      <th className="table-head text-left">Date</th>
                      <th className="table-head text-left">Buyer</th>
                      <th className="table-head text-left">Seller</th>
                      <th className="table-head text-center">Currency</th>
                      <th className="table-head text-right">Amount</th>
                      <th className="table-head text-right">Rate</th>
                      <th className="table-head text-right">Total PKR</th>
                      <th className="table-head text-center">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-8 text-white/30">Loading...</td></tr>
                    ) : txData.transactions.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-white/30">No transactions in this period</td></tr>
                    ) : txData.transactions.map(tx => (
                      <tr key={tx._id} className="table-row">
                        <td className="table-cell text-xs text-white/50">{formatDate(tx.date)}</td>
                        <td className="table-cell text-sm">{tx.buyerPerson?.name || '—'}</td>
                        <td className="table-cell text-sm">{tx.sellerPerson?.name || '—'}</td>
                        <td className="table-cell text-center"><span className={tx.currency === 'AED' ? 'badge-aed' : 'badge-sar'}>{tx.currency}</span></td>
                        <td className="table-cell text-right font-mono-num">{formatAmount(tx.amount)}</td>
                        <td className="table-cell text-right font-mono-num text-white/60">{tx.rate?.toFixed(2)}</td>
                        <td className="table-cell text-right font-mono-num">{formatPKR(tx.totalPKR)}</td>
                        <td className="table-cell text-center">
                          {tx.isAdvance && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple">ADV</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {txData.transactions.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-surface-200 bg-surface-100">
                        <td colSpan={6} className="table-cell font-semibold text-white/60">Totals</td>
                        <td className="table-cell text-right font-mono-num font-bold">{formatPKR(txData.totalVolume)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── LOANS TAB ── */}
      {tab === 'loans' && loanData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card border-accent-green/20">
              <div className="text-xs text-white/40 uppercase tracking-wider">Total Given</div>
              <div className="font-mono-num text-2xl font-bold text-accent-green">{formatPKR(loanData.totalGiven)}</div>
            </div>
            <div className="stat-card border-accent-gold/20">
              <div className="text-xs text-white/40 uppercase tracking-wider">Outstanding</div>
              <div className="font-mono-num text-2xl font-bold text-accent-gold">{formatPKR(loanData.totalOutstanding)}</div>
              <div className="text-xs text-white/30">Still owed to us</div>
            </div>
            <div className="stat-card border-accent-red/20">
              <div className="text-xs text-white/40 uppercase tracking-wider">Total Taken</div>
              <div className="font-mono-num text-2xl font-bold text-accent-red">{formatPKR(loanData.totalTaken)}</div>
            </div>
            <div className="stat-card">
              <div className="text-xs text-white/40 uppercase tracking-wider">We Still Owe</div>
              <div className="font-mono-num text-2xl font-bold text-accent-red">{formatPKR(loanData.totalPayable)}</div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-surface-200">
              <h3 className="font-display font-semibold">All Loans</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="table-head text-left">Date</th>
                    <th className="table-head text-left">Person</th>
                    <th className="table-head text-center">Direction</th>
                    <th className="table-head text-center">Currency</th>
                    <th className="table-head text-right">Amount</th>
                    <th className="table-head text-right">Remaining</th>
                    <th className="table-head text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loanData.loans.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-white/30">No loans recorded</td></tr>
                  ) : loanData.loans.map(l => (
                    <tr key={l._id} className="table-row">
                      <td className="table-cell text-xs text-white/50">{formatDate(l.date)}</td>
                      <td className="table-cell font-medium">{l.person?.name}</td>
                      <td className="table-cell text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.direction === 'give' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                          {l.direction === 'give' ? 'Given' : 'Taken'}
                        </span>
                      </td>
                      <td className="table-cell text-center text-xs text-white/60">{l.currency}</td>
                      <td className="table-cell text-right font-mono-num">{formatAmount(l.amount)}</td>
                      <td className="table-cell text-right font-mono-num font-semibold text-accent-gold">{formatAmount(l.remaining || 0)}</td>
                      <td className="table-cell text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(l.remaining || 0) === 0 ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-gold/10 text-accent-gold'}`}>
                          {(l.remaining || 0) === 0 ? 'Settled' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── VILLAGE TAB ── */}
      {tab === 'village' && villageData && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card border-accent-gold/20">
              <div className="text-xs text-white/40 uppercase tracking-wider">Total Village Balance</div>
              <div className="font-mono-num text-2xl font-bold text-accent-gold">{formatPKR(villageData.totalBalance)}</div>
            </div>
            <div className="stat-card">
              <div className="text-xs text-white/40 uppercase tracking-wider">Depositors</div>
              <div className="font-mono-num text-2xl font-bold text-white">{villageData.summary.length}</div>
            </div>
          </div>

          {/* Per-person breakdown */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-surface-200">
              <h3 className="font-display font-semibold">Balance by Depositor</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="table-head text-left">Person</th>
                    <th className="table-head text-right">Total Deposited</th>
                    <th className="table-head text-right">Total Withdrawn</th>
                    <th className="table-head text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {villageData.summary.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-white/30">No village entries</td></tr>
                  ) : villageData.summary.map((s, i) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell font-medium">{s.person?.name}</td>
                      <td className="table-cell text-right font-mono-num text-accent-green">{formatPKR(s.totalDeposited || 0)}</td>
                      <td className="table-cell text-right font-mono-num text-accent-red">{formatPKR(s.totalWithdrawn || 0)}</td>
                      <td className={`table-cell text-right font-mono-num font-bold ${s.balance >= 0 ? 'text-white' : 'text-accent-red'}`}>
                        {formatPKR(s.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All transactions */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-surface-200">
              <h3 className="font-display font-semibold">All Village Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="table-head text-left">Date</th>
                    <th className="table-head text-left">Person</th>
                    <th className="table-head text-center">Type</th>
                    <th className="table-head text-right">Amount</th>
                    <th className="table-head text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {villageData.deposits.map(v => (
                    <tr key={v._id} className="table-row">
                      <td className="table-cell text-xs text-white/50">{formatDate(v.date)}</td>
                      <td className="table-cell font-medium">{v.person?.name}</td>
                      <td className="table-cell text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.direction === 'deposit' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                          {v.direction === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                      <td className={`table-cell text-right font-mono-num font-semibold ${v.direction === 'deposit' ? 'text-accent-green' : 'text-accent-red'}`}>
                        {formatPKR(v.amount)}
                      </td>
                      <td className="table-cell text-xs text-white/40">{v.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
