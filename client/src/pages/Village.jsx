import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdDelete, MdArrowDownward, MdArrowUpward, MdVilla } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR, formatDate, today } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = { date: today(), person: '', direction: 'deposit', amount: '', notes: '' };

export default function Village() {
  const { persons } = useApp();
  const [data, setData]     = useState({ deposits: [], summary: [], totalBalance: 0 });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]     = useState(emptyForm);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', person: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const res = await api.get('/village', { params });
      setData(res.data);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.person || !form.amount) return toast.error('Fill all required fields');
    try {
      await api.post('/village', { ...form, amount: Number(form.amount) });
      toast.success(form.direction === 'deposit' ? 'Deposit recorded' : 'Withdrawal recorded');
      setShowModal(false); setForm(emptyForm);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/village/${id}`);
    toast.success('Deleted');
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Village Account</h1>
          <p className="text-white/40 text-sm">Deposits & withdrawals from village</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> New Entry
        </button>
      </div>

      {/* Total Village Balance */}
      <div className="card border-accent-gold/20 glow-gold">
        <div className="text-sm text-white/40">Total Village Balance</div>
        <div className={`font-mono-num text-4xl font-bold mt-2 ${data.totalBalance >= 0 ? 'text-white' : 'text-accent-red'}`}>
          {formatPKR(data.totalBalance)}
        </div>
        <div className="text-xs text-white/30 mt-1">{data.summary.length} depositors</div>
      </div>

      {/* Per-Person Summary */}
      {data.summary.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-surface-200">
            <h3 className="font-display font-semibold">Balance by Person</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="table-head text-left">Person</th>
                  <th className="table-head text-right">Total Deposited</th>
                  <th className="table-head text-right">Total Withdrawn</th>
                  <th className="table-head text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.summary.map((s, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell font-medium">{s.person?.name}</td>
                    <td className="table-cell text-right font-mono-num text-accent-green">{formatPKR(s.deposits || 0)}</td>
                    <td className="table-cell text-right font-mono-num text-accent-red">{formatPKR(s.withdrawals || 0)}</td>
                    <td className={`table-cell text-right font-mono-num font-bold ${s.balance >= 0 ? 'text-white' : 'text-accent-red'}`}>
                      {formatPKR(s.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Person</label>
            <select className="input" value={filters.person} onChange={e => setFilters(f => ({ ...f, person: e.target.value }))}>
              <option value="">All</option>
              {persons.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-surface-200">
          <h3 className="font-display font-semibold">Transaction History</h3>
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
                <th className="table-head"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-white/30">Loading...</td></tr>
              ) : data.deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-white/30">
                    <MdVilla size={36} className="mx-auto mb-2 opacity-20" />
                    No village entries yet
                  </td>
                </tr>
              ) : data.deposits.map(v => (
                <tr key={v._id} className="table-row">
                  <td className="table-cell text-xs text-white/50">{formatDate(v.date)}</td>
                  <td className="table-cell font-medium">{v.person?.name}</td>
                  <td className="table-cell text-center">
                    <span className={`flex items-center justify-center gap-1 text-xs font-semibold w-fit mx-auto px-2 py-0.5 rounded-full ${v.direction === 'deposit' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                      {v.direction === 'deposit'
                        ? <><MdArrowDownward size={11} /> Deposit</>
                        : <><MdArrowUpward size={11} /> Withdrawal</>}
                    </span>
                  </td>
                  <td className={`table-cell text-right font-mono-num font-semibold ${v.direction === 'deposit' ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatPKR(v.amount)}
                  </td>
                  <td className="table-cell text-xs text-white/40">{v.notes || '—'}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => handleDelete(v._id)} className="p-1.5 hover:bg-accent-red/10 rounded-lg transition-colors text-white/30 hover:text-accent-red">
                      <MdDelete size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Village Entry">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Person *</label>
            <select className="input" value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))} required>
              <option value="">Select person</option>
              {persons.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type *</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'deposit' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${form.direction === 'deposit' ? 'bg-accent-green/20 border-accent-green text-accent-green' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                <MdArrowDownward size={16} /> Deposit (Money In)
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'withdrawal' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${form.direction === 'withdrawal' ? 'bg-accent-red/20 border-accent-red text-accent-red' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                <MdArrowUpward size={16} /> Withdrawal (Money Out)
              </button>
            </div>
          </div>
          <div>
            <label className="label">Amount (PKR) *</label>
            <input type="number" className="input font-mono-num" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" required />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Record Entry</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
