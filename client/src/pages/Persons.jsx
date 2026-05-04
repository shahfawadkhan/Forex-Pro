import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdEdit, MdDelete, MdPerson, MdPhone, MdArrowForward } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = { name: '', phone: '', address: '', type: 'Both', notes: '' };

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
        toast.success('Person updated');
      } else {
        await api.post('/persons', form);
        toast.success('Person added');
      }
      setShowModal(false); setEditItem(null); setForm(emptyForm);
      fetchPersons();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this person?')) return;
    await api.delete(`/persons/${id}`);
    toast.success('Deleted');
    fetchPersons();
  };

  const openEdit = (p) => {
    setEditItem(p);
    setForm({ name: p.name, phone: p.phone || '', address: p.address || '', type: p.type, notes: p.notes || '' });
    setShowModal(true);
  };

  const totalReceivable = filtered.reduce((s, p) => p.balance > 0 ? s + p.balance : s, 0);
  const totalPayable = filtered.reduce((s, p) => p.balance < 0 ? s + Math.abs(p.balance) : s, 0);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Persons</h1>
          <p className="text-white/40 text-sm">{persons.length} registered</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> Add Person
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Receivable</div>
          <div className="font-mono-num text-xl font-bold text-accent-green">{formatPKR(totalReceivable)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Payable</div>
          <div className="font-mono-num text-xl font-bold text-accent-red">{formatPKR(totalPayable)}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input className="input pl-10" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p._id} className="card hover:border-accent-gold/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 border border-accent-gold/20 rounded-xl flex items-center justify-center font-display font-bold text-accent-gold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-surface-200 text-white/50 px-1.5 py-0.5 rounded-full">{p.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-surface-200 rounded-lg transition-colors text-white/40 hover:text-white">
                  <MdEdit size={14} />
                </button>
                <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-accent-red/10 rounded-lg transition-colors text-white/40 hover:text-accent-red">
                  <MdDelete size={14} />
                </button>
              </div>
            </div>

            {p.phone && (
              <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                <MdPhone size={12} /> {p.phone}
              </div>
            )}

            <div className="border-t border-surface-200 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/30 mb-0.5">Balance</div>
                  <div className={`font-mono-num font-bold text-lg ${p.balance > 0 ? 'text-accent-green' : p.balance < 0 ? 'text-accent-red' : 'text-white/40'}`}>
                    {formatPKR(Math.abs(p.balance))}
                  </div>
                  <div className="text-xs text-white/30">
                    {p.balance > 0 ? 'owes us' : p.balance < 0 ? 'we owe' : 'settled'}
                  </div>
                </div>
                <Link to={`/persons/${p._id}/ledger`} className="flex items-center gap-1 text-xs text-accent-gold hover:underline">
                  Ledger <MdArrowForward size={12} />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-white/30">
            {search ? 'No matches found' : 'No persons yet. Add one!'}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Person' : 'Add Person'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92 300 0000000" />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {['Buyer', 'Seller', 'Both'].map(t => (
                <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-all ${form.type === t ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Add Person'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
