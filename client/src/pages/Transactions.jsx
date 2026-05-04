import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdFilterList, MdDelete, MdEdit, MdSearch } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR, formatAmount, formatDate, today } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = {
  date: today(), person: '', currency: 'AED', type: 'Sell',
  amount: '', rate: '', buyingRate: '', notes: '',
};

export default function Transactions() {
  const { persons, accounts, refresh: refreshApp } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', person: '', currency: '', type: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.person || !form.amount || !form.rate) return toast.error('Fill required fields');
    try {
      const payload = { ...form, totalPKR: form.amount * form.rate };
      if (editItem) {
        await api.put(`/transactions/${editItem._id}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction added');
      }
      setShowModal(false); setEditItem(null); setForm(emptyForm);
      fetch(); refreshApp();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    toast.success('Deleted');
    fetch(); refreshApp();
  };

  const openEdit = (tx) => {
    setEditItem(tx);
    setForm({
      date: tx.date.split('T')[0], person: tx.person._id || tx.person,
      currency: tx.currency, type: tx.type, amount: tx.amount,
      rate: tx.rate, buyingRate: tx.buyingRate || '', notes: tx.notes || '',
    });
    setShowModal(true);
  };

  const totalPKR = form.amount && form.rate ? form.amount * form.rate : 0;
  const estProfit = form.type === 'Sell' && form.buyingRate && form.amount
    ? (form.rate - form.buyingRate) * form.amount : null;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Transactions</h1>
          <p className="text-white/40 text-sm">{total} records</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> New Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
          <div>
            <label className="label">Currency</label>
            <select className="input" value={filters.currency} onChange={e => setFilters(f => ({ ...f, currency: e.target.value }))}>
              <option value="">All</option>
              <option>AED</option><option>SAR</option>
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">All</option>
              <option>Buy</option><option>Sell</option>
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
                <th className="table-head text-center">Type</th>
                <th className="table-head text-center">Currency</th>
                <th className="table-head text-right">Amount</th>
                <th className="table-head text-right">Rate</th>
                <th className="table-head text-right">Total PKR</th>
                <th className="table-head text-right">Profit</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-white/30">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-white/30">No transactions found</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx._id} className="table-row">
                  <td className="table-cell text-white/60 text-xs">{formatDate(tx.date)}</td>
                  <td className="table-cell font-medium">{tx.person?.name}</td>
                  <td className="table-cell text-center">
                    <span className={tx.type === 'Buy' ? 'badge-buy' : 'badge-sell'}>{tx.type}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={tx.currency === 'AED' ? 'badge-aed' : 'badge-sar'}>{tx.currency}</span>
                  </td>
                  <td className="table-cell text-right font-mono-num">{formatAmount(tx.amount)}</td>
                  <td className="table-cell text-right font-mono-num text-white/70">{tx.rate?.toFixed(2)}</td>
                  <td className="table-cell text-right font-mono-num font-medium">{formatPKR(tx.totalPKR)}</td>
                  <td className={`table-cell text-right font-mono-num font-semibold ${(tx.profit || 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {tx.profit ? formatPKR(tx.profit) : '—'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(tx)} className="p-1.5 hover:bg-surface-200 rounded-lg transition-colors text-white/40 hover:text-white">
                        <MdEdit size={14} />
                      </button>
                      <button onClick={() => handleDelete(tx._id)} className="p-1.5 hover:bg-accent-red/10 rounded-lg transition-colors text-white/40 hover:text-accent-red">
                        <MdDelete size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 30 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-surface-200">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary disabled:opacity-40">Prev</button>
            <span className="text-sm text-white/40">Page {page} of {Math.ceil(total/30)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/30)} className="btn-secondary disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Edit Transaction' : 'New Transaction'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Person *</label>
              <select className="input" value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))} required>
                <option value="">Select person</option>
                {persons.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Transaction Type *</label>
              <div className="flex gap-2">
                {['Buy', 'Sell'].map(t => (
                  <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${form.type === t ? (t === 'Buy' ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-accent-gold/20 border-accent-gold text-accent-gold') : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Currency *</label>
              <div className="flex gap-2">
                {['AED', 'SAR'].map(c => (
                  <button type="button" key={c} onClick={() => setForm(f => ({ ...f, currency: c }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${form.currency === c ? (c === 'AED' ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'bg-accent-green/20 border-accent-green text-accent-green') : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Amount ({form.currency}) *</label>
              <input type="number" className="input font-mono-num" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" step="0.01" required />
            </div>
            <div>
              <label className="label">Rate (PKR/{form.currency}) *</label>
              <input type="number" className="input font-mono-num" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="0.00" step="0.01" required />
            </div>
            <div>
              <label className="label">Buying Rate (for profit)</label>
              <input type="number" className="input font-mono-num" value={form.buyingRate} onChange={e => setForm(f => ({ ...f, buyingRate: e.target.value }))} placeholder="0.00" step="0.01" />
            </div>
          </div>

          {/* Auto-calculated preview */}
          {totalPKR > 0 && (
            <div className="bg-surface-100 rounded-xl p-4 border border-surface-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/40 mb-1">Total PKR</div>
                  <div className="font-mono-num text-lg font-bold text-white">{formatPKR(totalPKR)}</div>
                </div>
                {estProfit !== null && (
                  <div>
                    <div className="text-xs text-white/40 mb-1">Est. Profit</div>
                    <div className={`font-mono-num text-lg font-bold ${estProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {formatPKR(estProfit)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editItem ? 'Update Transaction' : 'Add Transaction'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
