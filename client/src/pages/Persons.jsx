import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdEdit, MdDelete, MdArrowForward, MdSearch } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = { name: '', phone: '', address: '', notes: '' };

export default function Persons() {
  const { persons, fetchPersons } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const filtered = persons.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    try {
      if (editItem) {
        await api.put(`/persons/${editItem._id}`, form);
        toast.success('Updated');
      } else {
        await api.post('/persons', form);
        toast.success('Added to Lists');
      }
      setShowModal(false); setEditItem(null); setForm(emptyForm);
      fetchPersons();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove from Lists?')) return;
    await api.delete(`/persons/${id}`);
    toast.success('Removed');
    fetchPersons();
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({ name: p.name, phone: p.phone || '', address: p.address || '', notes: p.notes || '' });
    setShowModal(true);
  };

  const totalReceivable = filtered.reduce((s, p) => p.balance > 0 ? s + p.balance : s, 0);
  const totalPayable    = filtered.reduce((s, p) => p.balance < 0 ? s + Math.abs(p.balance) : s, 0);
  const totalAdvance    = filtered.reduce((s, p) => s + (p.advanceBalance || 0), 0);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Lists</h1>
          <p className="text-white/40 text-sm">{persons.length} registered</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> Add to List
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Receivable</div>
          <div className="font-mono-num text-xl font-bold text-accent-green">{formatPKR(totalReceivable)}</div>
          <div className="text-xs text-white/30">They owe us</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Payable</div>
          <div className="font-mono-num text-xl font-bold text-accent-red">{formatPKR(totalPayable)}</div>
          <div className="text-xs text-white/30">We owe them</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Advance Pending</div>
          <div className="font-mono-num text-xl font-bold text-accent-purple">{formatPKR(totalAdvance)}</div>
          <div className="text-xs text-white/30">Unsettled advances</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          className="input pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="table-head text-left">Name</th>
                <th className="table-head text-left">Phone</th>
                <th className="table-head text-right">Balance</th>
                <th className="table-head text-right">Advance</th>
                <th className="table-head text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-white/30">No entries found</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-200 rounded-full flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.address && <p className="text-xs text-white/30">{p.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-white/60 font-mono-num text-xs">{p.phone || '—'}</td>
                  <td className="table-cell text-right">
                    <span className={`font-mono-num font-semibold ${p.balance > 0 ? 'text-accent-green' : p.balance < 0 ? 'text-accent-red' : 'text-white/30'}`}>
                      {formatPKR(Math.abs(p.balance))}
                    </span>
                    <div className="text-xs text-white/30">
                      {p.balance > 0 ? 'Owes us' : p.balance < 0 ? 'We owe' : 'Settled'}
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    {(p.advanceBalance || 0) !== 0 ? (
                      <span className="font-mono-num text-sm text-accent-purple">{formatPKR(Math.abs(p.advanceBalance))}</span>
                    ) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/persons/${p._id}/ledger`} className="p-1.5 hover:bg-surface-200 rounded-lg transition-colors text-white/40 hover:text-accent-gold" title="View Ledger">
                        <MdArrowForward size={14} />
                      </Link>
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-surface-200 rounded-lg transition-colors text-white/40 hover:text-white">
                        <MdEdit size={14} />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-accent-red/10 rounded-lg transition-colors text-white/40 hover:text-accent-red">
                        <MdDelete size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Edit Entry' : 'Add to List'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input font-mono-num" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. 0300-1234567" />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Add to List'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
