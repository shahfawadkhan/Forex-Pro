import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdDelete, MdEdit, MdSwapHoriz, MdInfo } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR, formatAmount, formatDate, today } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const SAR_TO_AED = 0.95;
const emptyForm = {
  date: today(),
  buyerPerson: '', sellerPerson: '',
  currency: 'AED', amount: '', rate: '',
  isAdvance: false,
  paymentMethod: 'Cash',
  account: '', notes: '',
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
  const [filters, setFilters] = useState({ startDate: '', endDate: '', person: '', currency: '', isAdvance: '' });

  const fetchTx = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, ...filters };
      Object.keys(params).forEach(k => { if (params[k] === '') delete params[k]; });
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.buyerPerson || !form.sellerPerson) return toast.error('Select both Buyer and Seller');
    if (form.buyerPerson === form.sellerPerson) return toast.error('Buyer and Seller must be different');
    if (!form.amount || !form.rate) return toast.error('Amount and Rate are required');
    try {
      const payload = {
        ...form,
        amount:   Number(form.amount),
        rate:     Number(form.rate),
        totalPKR: Number(form.amount) * Number(form.rate),
        account:  form.account || null,
      };
      if (editItem) {
        await api.put(`/transactions/${editItem._id}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success(form.currency === 'SAR' ? 'SAR transaction added + AED shadow record created' : 'Transaction added');
      }
      setShowModal(false); setEditItem(null); setForm(emptyForm);
      fetchTx(); refreshApp();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction? (SAR shadow record will also be removed)')) return;
    await api.delete(`/transactions/${id}`);
    toast.success('Deleted');
    fetchTx(); refreshApp();
  };

  const openEdit = (tx) => {
    setEditItem(tx);
    setForm({
      date:          tx.date.split('T')[0],
      buyerPerson:   tx.buyerPerson?._id || tx.buyerPerson,
      sellerPerson:  tx.sellerPerson?._id || tx.sellerPerson,
      currency:      tx.currency,
      amount:        tx.amount,
      rate:          tx.rate,
      isAdvance:     tx.isAdvance || false,
      paymentMethod: tx.paymentMethod || 'Cash',
      account:       tx.account?._id || tx.account || '',
      notes:         tx.notes || '',
    });
    setShowModal(true);
  };

  const totalPKR = form.amount && form.rate ? Number(form.amount) * Number(form.rate) : 0;
  const sarAedEquiv = form.currency === 'SAR' && form.amount ? Number(form.amount) * SAR_TO_AED : null;

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

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
            <label className="label">Person (Buyer/Seller)</label>
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
            <select className="input" value={filters.isAdvance} onChange={e => setFilters(f => ({ ...f, isAdvance: e.target.value }))}>
              <option value="">All</option>
              <option value="false">Regular</option>
              <option value="true">Advance</option>
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
                <th className="table-head text-left">Buyer</th>
                <th className="table-head text-left">Seller</th>
                <th className="table-head text-center">Currency</th>
                <th className="table-head text-right">Amount</th>
                <th className="table-head text-right">Rate</th>
                <th className="table-head text-right">Total PKR</th>
                <th className="table-head text-center">Flags</th>
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
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue font-semibold">B</span>
                      <span className="font-medium">{tx.buyerPerson?.name}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent-gold/20 text-accent-gold font-semibold">S</span>
                      <span className="font-medium">{tx.sellerPerson?.name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span className={tx.currency === 'AED' ? 'badge-aed' : 'badge-sar'}>{tx.currency}</span>
                  </td>
                  <td className="table-cell text-right font-mono-num">{formatAmount(tx.amount)}</td>
                  <td className="table-cell text-right font-mono-num text-white/70">{tx.rate?.toFixed(2)}</td>
                  <td className="table-cell text-right font-mono-num font-medium">{formatPKR(tx.totalPKR)}</td>
                  <td className="table-cell text-center">
                    {tx.isAdvance && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple font-semibold border border-accent-purple/30">ADV</span>
                    )}
                    {tx.currency === 'SAR' && (
                      <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 font-semibold" title="SAR→AED shadow record created">≈AED</span>
                    )}
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
        {total > 30 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-surface-200">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40">Prev</button>
            <span className="text-sm text-white/40">Page {page} of {Math.ceil(total / 30)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 30)} className="btn-secondary disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Edit Transaction' : 'New Transaction'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date + Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={e => setF('date', e.target.value)} required />
            </div>
            <div>
              <label className="label">Currency *</label>
              <div className="flex gap-2">
                {['AED', 'SAR'].map(c => (
                  <button type="button" key={c} onClick={() => setF('currency', c)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${form.currency === c ? (c === 'AED' ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'bg-accent-green/20 border-accent-green text-accent-green') : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Buyer + Seller */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="inline-block w-4 h-4 text-center rounded text-xs bg-accent-blue/20 text-accent-blue font-bold mr-1">B</span>
                Buyer Person *
              </label>
              <select className="input" value={form.buyerPerson} onChange={e => setF('buyerPerson', e.target.value)} required>
                <option value="">Select buyer</option>
                {persons.filter(p => p._id !== form.sellerPerson).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">
                <span className="inline-block w-4 h-4 text-center rounded text-xs bg-accent-gold/20 text-accent-gold font-bold mr-1">S</span>
                Seller Person *
              </label>
              <select className="input" value={form.sellerPerson} onChange={e => setF('sellerPerson', e.target.value)} required>
                <option value="">Select seller</option>
                {persons.filter(p => p._id !== form.buyerPerson).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Amount + Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ({form.currency}) *</label>
              <input type="number" className="input font-mono-num" value={form.amount} onChange={e => setF('amount', e.target.value)} placeholder="0" step="0.01" required />
            </div>
            <div>
              <label className="label">Rate (PKR/{form.currency}) *</label>
              <input type="number" className="input font-mono-num" value={form.rate} onChange={e => setF('rate', e.target.value)} placeholder="0.00" step="0.01" required />
            </div>
          </div>

          {/* Preview */}
          {totalPKR > 0 && (
            <div className="bg-surface-100 rounded-xl p-4 border border-surface-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Total PKR</span>
                <span className="font-mono-num font-bold text-white">{formatPKR(totalPKR)}</span>
              </div>
              {sarAedEquiv !== null && (
                <div className="flex items-center gap-2 pt-2 border-t border-surface-200">
                  <MdInfo size={14} className="text-accent-green flex-shrink-0" />
                  <span className="text-xs text-accent-green">
                    SAR → AED: {formatAmount(sarAedEquiv, 2)} AED equivalent will be created automatically (×{SAR_TO_AED})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Advance + Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Method</label>
              <div className="flex gap-2">
                {['Cash', 'Bank', 'Village'].map(m => (
                  <button type="button" key={m} onClick={() => setF('paymentMethod', m)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${form.paymentMethod === m ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Advance Deal?</label>
              <button type="button" onClick={() => setF('isAdvance', !form.isAdvance)}
                className={`w-full py-1.5 rounded-xl text-xs font-semibold border transition-all ${form.isAdvance ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'bg-surface-100 border-surface-200 text-white/40'}`}>
                {form.isAdvance ? '✓ Advance — Pending Settlement' : 'Regular Transaction'}
              </button>
            </div>
          </div>

          {/* Account */}
          {(form.paymentMethod === 'Bank' || form.paymentMethod === 'Village') && (
            <div>
              <label className="label">Account</label>
              <select className="input" value={form.account} onChange={e => setF('account', e.target.value)}>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Optional notes..." />
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
