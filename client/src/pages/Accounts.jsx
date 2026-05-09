import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdAccountBalance, MdAttachMoney } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = { name: '', type: 'Cash', balance: '', bankName: '', accountNumber: '' };

export default function Accounts() {
  const { accounts, fetchAccounts } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const cashAccounts = accounts.filter(a => a.type === 'Cash');
  const bankAccounts = accounts.filter(a => a.type === 'Bank');
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name required');
    try {
      if (editItem) {
        await api.put(`/accounts/${editItem._id}`, form);
        toast.success('Updated');
      } else {
        await api.post('/accounts', { ...form, balance: Number(form.balance) || 0 });
        toast.success('Account created');
      }
      setShowModal(false); setEditItem(null); setForm(emptyForm);
      fetchAccounts();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    await api.delete(`/accounts/${id}`);
    toast.success('Deleted');
    fetchAccounts();
  };

  const openEdit = (a) => {
    setEditItem(a);
    setForm({ name: a.name, type: a.type, balance: a.balance, bankName: a.bankName || '', accountNumber: a.accountNumber || '' });
    setShowModal(true);
  };

  const AccountCard = ({ account }) => (
    <div className="card hover:border-accent-gold/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${account.type === 'Bank' ? 'bg-accent-blue/20 border border-accent-blue/20' : 'bg-accent-gold/20 border border-accent-gold/20'}`}>
            {account.type === 'Bank' ? <MdAccountBalance size={18} className="text-accent-blue" /> : <MdAttachMoney size={18} className="text-accent-gold" />}
          </div>
          <div>
            <p className="font-semibold">{account.name}</p>
            <p className="text-xs text-white/40">{account.type}{account.bankName ? ` · ${account.bankName}` : ''}</p>
            {account.accountNumber && <p className="text-xs text-white/30 font-mono-num">{account.accountNumber}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => openEdit(account)} className="p-1.5 hover:bg-surface-200 rounded-lg transition-colors text-white/40 hover:text-white">
            <MdEdit size={14} />
          </button>
          <button onClick={() => handleDelete(account._id)} className="p-1.5 hover:bg-accent-red/10 rounded-lg transition-colors text-white/40 hover:text-accent-red">
            <MdDelete size={14} />
          </button>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-surface-200">
        <div className="text-xs text-white/40 mb-1">Balance</div>
        <div className={`font-mono-num text-2xl font-bold ${account.balance >= 0 ? 'text-white' : 'text-accent-red'}`}>
          {formatPKR(account.balance)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Accounts</h1>
          <p className="text-white/40 text-sm">Cash & Bank management</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> Add Account
        </button>
      </div>

      {/* Total */}
      <div className="card border-accent-gold/20 glow-gold">
        <div className="text-sm text-white/40">Total Balance (All Accounts)</div>
        <div className={`font-mono-num text-4xl font-bold mt-2 ${totalBalance >= 0 ? 'text-white' : 'text-accent-red'}`}>
          {formatPKR(totalBalance)}
        </div>
        <div className="flex gap-4 mt-3">
          <span className="text-xs text-white/40">{cashAccounts.length} Cash · {formatPKR(cashAccounts.reduce((s,a)=>s+a.balance,0))}</span>
          <span className="text-xs text-white/40">{bankAccounts.length} Bank · {formatPKR(bankAccounts.reduce((s,a)=>s+a.balance,0))}</span>
        </div>
      </div>

      {cashAccounts.length > 0 && (
        <>
          <h2 className="font-display font-semibold text-white/60 text-sm uppercase tracking-wider">Cash Accounts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashAccounts.map(a => <AccountCard key={a._id} account={a} />)}
          </div>
        </>
      )}

      {bankAccounts.length > 0 && (
        <>
          <h2 className="font-display font-semibold text-white/60 text-sm uppercase tracking-wider">Bank Accounts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(a => <AccountCard key={a._id} account={a} />)}
          </div>
        </>
      )}

      {accounts.length === 0 && (
        <div className="text-center py-16 text-white/30">No accounts yet. Add one!</div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Account' : 'Add Account'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Account Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Peshawar Cash, HBL Bank" required />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              {['Cash', 'Bank'].map(t => (
                <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-all ${form.type === t ? (t === 'Bank' ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-accent-gold/20 border-accent-gold text-accent-gold') : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {!editItem && (
            <div>
              <label className="label">Opening Balance (PKR)</label>
              <input type="number" className="input font-mono-num" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" />
            </div>
          )}
          {form.type === 'Bank' && (
            <>
              <div>
                <label className="label">Bank Name</label>
                <input className="input" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. HBL, Meezan, UBL" />
              </div>
              <div>
                <label className="label">Account Number</label>
                <input className="input font-mono-num" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="IBAN or account number" />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Create Account'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
