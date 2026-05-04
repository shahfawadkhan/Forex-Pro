import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdArrowBack, MdDownload } from 'react-icons/md';
import api from '../utils/api';
import { formatPKR, formatDate } from '../utils/formatters';

export default function PersonLedger() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/persons/${id}/ledger`, { params: dateFilter });
      setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id, dateFilter]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-white/40 text-center py-16">Person not found</div>;

  const { person, ledger, currentBalance } = data;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center gap-4">
        <Link to="/persons" className="btn-secondary flex items-center gap-2">
          <MdArrowBack size={16} /> Back
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl text-gradient-gold">{person.name}</h1>
          <p className="text-white/40 text-sm">{person.phone} · {person.type}</p>
        </div>
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
          <MdDownload size={16} /> Print
        </button>
      </div>

      {/* Balance Card */}
      <div className={`card border-2 ${currentBalance > 0 ? 'border-accent-green/30' : currentBalance < 0 ? 'border-accent-red/30' : 'border-surface-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/40">Current Balance</div>
            <div className={`font-mono-num text-3xl font-bold mt-1 ${currentBalance > 0 ? 'text-accent-green' : currentBalance < 0 ? 'text-accent-red' : 'text-white/40'}`}>
              {formatPKR(Math.abs(currentBalance))}
            </div>
            <div className="text-sm text-white/40 mt-1">
              {currentBalance > 0 ? `${person.name} owes us` : currentBalance < 0 ? `We owe ${person.name}` : 'Settled'}
            </div>
          </div>
          <div className={`text-6xl opacity-10 font-display font-bold ${currentBalance >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {currentBalance >= 0 ? 'DR' : 'CR'}
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">From</label>
          <input type="date" className="input" value={dateFilter.startDate} onChange={e => setDateFilter(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label className="label">To</label>
          <input type="date" className="input" value={dateFilter.endDate} onChange={e => setDateFilter(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <div className="flex items-end">
          <button onClick={() => setDateFilter({ startDate: '', endDate: '' })} className="btn-secondary">Reset</button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="table-head text-left">Date</th>
                <th className="table-head text-left">Description</th>
                <th className="table-head text-right">Debit (They Owe)</th>
                <th className="table-head text-right">Credit (We Owe)</th>
                <th className="table-head text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-white/30">No entries found</td></tr>
              ) : ledger.map((entry, i) => (
                <tr key={entry._id + i} className="table-row">
                  <td className="table-cell text-xs text-white/50">{formatDate(entry.date)}</td>
                  <td className="table-cell">
                    {entry.type === 'transaction' ? (
                      <div>
                        <span className={entry.transactionType === 'Buy' ? 'badge-buy' : 'badge-sell'}>{entry.transactionType}</span>
                        <span className={`ml-2 ${entry.currency === 'AED' ? 'badge-aed' : 'badge-sar'}`}>{entry.currency}</span>
                        <span className="ml-2 text-xs text-white/50">
                          {new Intl.NumberFormat().format(entry.amount)} @ {entry.rate}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.direction === 'received' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                          Payment {entry.direction === 'received' ? 'Received' : 'Paid'}
                        </span>
                        {entry.accountName && <span className="ml-2 text-xs text-white/40">via {entry.accountName}</span>}
                      </div>
                    )}
                    {entry.notes && <p className="text-xs text-white/30 mt-0.5">{entry.notes}</p>}
                  </td>
                  <td className="table-cell text-right font-mono-num text-accent-green">
                    {entry.debit ? formatPKR(entry.debit) : '—'}
                  </td>
                  <td className="table-cell text-right font-mono-num text-accent-red">
                    {entry.credit ? formatPKR(entry.credit) : '—'}
                  </td>
                  <td className={`table-cell text-right font-mono-num font-semibold ${entry.balance > 0 ? 'text-accent-green' : entry.balance < 0 ? 'text-accent-red' : 'text-white/40'}`}>
                    {formatPKR(Math.abs(entry.balance))}
                    <span className="text-xs text-white/30 ml-1">{entry.balance > 0 ? 'Dr' : entry.balance < 0 ? 'Cr' : ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
