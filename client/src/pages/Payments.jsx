import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdDelete, MdArrowDownward, MdArrowUpward } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR, formatDate, today } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = { date: today(), person: '', account: '', direction: 'received', amount: '', notes: '' };

export default function Payments() {
  const { persons, accounts, refresh: refreshApp } = useApp();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', direction: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/payments', { params });
      setPayments(res.data);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.person || !form.account || !form.amount) return toast.error('Fill all required fields');
    try {
      await api.post('/payments', { ...form, amount: Number(form.amount) });
      toast.success('Payment recorded');
      setShowModal(false); setForm(emptyForm);
      fetch(); refreshApp();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment?')) return;
    await api.delete(`/payments/${id}`);
    toast.success('Deleted');
    fetch(); refreshApp();
  };

  const totalReceived = payments.filter(p=>p.direction==='received').reduce((s,p)=>s+p.amount,0);
  const totalPaid = payments.filter(p=>p.direction==='paid').reduce((s,p)=>s+p.amount,0);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Payments</h1>
          <p className="text-white/40 text-sm">{payments.length} records</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> Record Payment
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card border-accent-green/20">
          <div className="flex items-center gap-2 mb-1">
            <MdArrowDownward className="text-accent-green" size={16} />
            <span className="text-xs text-white/40 uppercase tracking-wider">Received</span>
          </div>
          <div className="font-mono-num text-xl font-bold text-accent-green">{formatPKR(totalReceived)}</div>
        </div>
        <div className="stat-card border-accent-red/20">
          <div className="flex items-center gap-2 mb-1">
            <MdArrowUpward className="text-accent-red" size={16} />
            <span className="text-xs text-white/40 uppercase tracking-wider">Paid Out</span>
          </div>
          <div className="font-mono-num text-xl font-bold text-accent-red">{formatPKR(totalPaid)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Direction</label>
            <select className="input" value={filters.direction} onChange={e => setFilters(f => ({ ...f, direction: e.target.value }))}>
              <option value="">All</option>
              <option value="received">Received</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="table-head text-left">Date</th>
                <th className="table-head text-left">Person</th>
                <th className="table-head text-left">Account</th>
                <th className="table-head text-center">Direction</th>
                <th className="table-head text-right">Amount</th>
                <th className="table-head text-left">Notes</th>
                <th className="table-head"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">No payments found</td></tr>
              ) : payments.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-cell text-xs text-white/50">{formatDate(p.date)}</td>
                  <td className="table-cell font-medium">{p.person?.name}</td>
                  <td className="table-cell text-white/60">{p.account?.name}</td>
                  <td className="table-cell text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.direction === 'received' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                      {p.direction === 'received' ? '↓ Received' : '↑ Paid'}
                    </span>
                  </td>
                  <td className={`table-cell text-right font-mono-num font-semibold ${p.direction === 'received' ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatPKR(p.amount)}
                  </td>
                  <td className="table-cell text-xs text-white/40">{p.notes || '—'}</td>
                  <td className="table-cell text-right">
                    <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-accent-red/10 rounded-lg transition-colors text-white/40 hover:text-accent-red">
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment">
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
            <label className="label">Account *</label>
            <select className="input" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} required>
              <option value="">Select account</option>
              {accounts.map(a => <option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Direction *</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'received' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${form.direction === 'received' ? 'bg-accent-green/20 border-accent-green text-accent-green' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                <MdArrowDownward size={16} /> Received from Person
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'paid' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${form.direction === 'paid' ? 'bg-accent-red/20 border-accent-red text-accent-red' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                <MdArrowUpward size={16} /> Paid to Person
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
            <button type="submit" className="btn-primary flex-1">Record Payment</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
