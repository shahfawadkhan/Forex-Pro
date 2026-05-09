import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdDelete, MdExpandMore, MdExpandLess, MdHandshake } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatPKR, formatAmount, formatDate, today } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyLoan = { date: today(), person: '', direction: 'give', currency: 'PKR', amount: '', notes: '' };
const emptyRepay = { date: today(), amount: '', currency: 'PKR', notes: '' };

export default function Loans() {
  const { persons } = useApp();
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [activeLoan, setActiveLoan] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loanForm, setLoanForm] = useState(emptyLoan);
  const [repayForm, setRepayForm] = useState(emptyRepay);
  const [filterDir, setFilterDir] = useState('');

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const [loansRes, sumRes] = await Promise.all([
        api.get('/loans', { params: filterDir ? { direction: filterDir } : {} }),
        api.get('/reports/loans'),
      ]);
      setLoans(loansRes.data);
      setSummary(sumRes.data);
    } finally { setLoading(false); }
  }, [filterDir]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleAddLoan = async (e) => {
    e.preventDefault();
    if (!loanForm.person || !loanForm.amount) return toast.error('Fill required fields');
    try {
      await api.post('/loans', { ...loanForm, amount: Number(loanForm.amount) });
      toast.success('Loan recorded');
      setShowLoanModal(false); setLoanForm(emptyLoan);
      fetchLoans();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleRepay = async (e) => {
    e.preventDefault();
    if (!repayForm.amount) return toast.error('Amount required');
    try {
      await api.post(`/loans/${activeLoan._id}/repay`, { ...repayForm, amount: Number(repayForm.amount) });
      toast.success('Repayment added');
      setShowRepayModal(false); setRepayForm(emptyRepay); setActiveLoan(null);
      fetchLoans();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleDeleteRepay = async (loan, repayId) => {
    if (!confirm('Delete this repayment?')) return;
    await api.delete(`/loans/${loan._id}/repay/${repayId}`);
    toast.success('Repayment removed');
    fetchLoans();
  };

  const handleDeleteLoan = async (id) => {
    if (!confirm('Delete this loan?')) return;
    await api.delete(`/loans/${id}`);
    toast.success('Loan deleted');
    fetchLoans();
  };

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const given = loans.filter(l => l.direction === 'give');
  const taken = loans.filter(l => l.direction === 'take');
  const display = filterDir === 'give' ? given : filterDir === 'take' ? taken : loans;

  const LoanCard = ({ loan }) => {
    const pct = loan.amount > 0 ? ((loan.amount - (loan.remaining || loan.amount)) / loan.amount) * 100 : 0;
    return (
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{loan.person?.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${loan.direction === 'give' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}>
                {loan.direction === 'give' ? 'We Gave' : 'We Took'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-200 text-white/60">{loan.currency}</span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">{formatDate(loan.date)}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-mono-num font-bold text-white">{formatAmount(loan.amount)}</div>
            <div className={`font-mono-num text-sm font-semibold ${(loan.remaining || 0) > 0 ? 'text-accent-gold' : 'text-accent-green'}`}>
              {(loan.remaining || 0) > 0 ? `${formatAmount(loan.remaining)} left` : '✓ Settled'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-surface-200 rounded-full overflow-hidden">
          <div className="h-full bg-accent-gold rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <div className="text-xs text-white/30 mt-1">{pct.toFixed(0)}% repaid · {loan.repayments?.length || 0} payments</div>

        {loan.notes && <p className="text-xs text-white/30 mt-2">{loan.notes}</p>}

        <div className="flex gap-2 mt-3 pt-3 border-t border-surface-200">
          <button onClick={() => { setActiveLoan(loan); setRepayForm(emptyRepay); setShowRepayModal(true); }}
            className="btn-primary text-xs py-1.5 flex-1">
            + Repayment
          </button>
          <button onClick={() => toggle(loan._id)} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
            {expanded[loan._id] ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
            History
          </button>
          <button onClick={() => handleDeleteLoan(loan._id)} className="btn-danger">
            <MdDelete size={14} />
          </button>
        </div>

        {expanded[loan._id] && loan.repayments?.length > 0 && (
          <div className="mt-3 space-y-2">
            {loan.repayments.map(r => (
              <div key={r._id} className="flex items-center justify-between bg-surface-100 rounded-lg px-3 py-2">
                <div>
                  <span className="text-xs text-white/60">{formatDate(r.date)}</span>
                  {r.notes && <span className="text-xs text-white/30 ml-2">{r.notes}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-num text-sm font-semibold text-accent-green">
                    {formatAmount(r.amount)} {r.currency}
                  </span>
                  <button onClick={() => handleDeleteRepay(loan, r._id)} className="text-white/20 hover:text-accent-red transition-colors">
                    <MdDelete size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {expanded[loan._id] && (!loan.repayments || loan.repayments.length === 0) && (
          <p className="text-xs text-white/30 mt-3 text-center">No repayments recorded yet</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gradient-gold">Loans</h1>
          <p className="text-white/40 text-sm">{loans.length} active loans</p>
        </div>
        <button onClick={() => { setLoanForm(emptyLoan); setShowLoanModal(true); }} className="btn-primary flex items-center gap-2">
          <MdAdd size={18} /> New Loan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-accent-green/20">
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Given</div>
          <div className="font-mono-num text-xl font-bold text-accent-green">{formatPKR(summary.totalGiven || 0)}</div>
          <div className="text-xs text-white/30">Loans we gave out</div>
        </div>
        <div className="stat-card border-accent-gold/20">
          <div className="text-xs text-white/40 uppercase tracking-wider">Outstanding (Receivable)</div>
          <div className="font-mono-num text-xl font-bold text-accent-gold">{formatPKR(summary.totalOutstanding || 0)}</div>
          <div className="text-xs text-white/30">Still owed to us</div>
        </div>
        <div className="stat-card border-accent-red/20">
          <div className="text-xs text-white/40 uppercase tracking-wider">Total Taken</div>
          <div className="font-mono-num text-xl font-bold text-accent-red">{formatPKR(summary.totalTaken || 0)}</div>
          <div className="text-xs text-white/30">Loans we received</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-white/40 uppercase tracking-wider">Payable</div>
          <div className="font-mono-num text-xl font-bold text-accent-red">{formatPKR(summary.totalPayable || 0)}</div>
          <div className="text-xs text-white/30">We still owe</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['', 'All'], ['give', 'Loans Given'], ['take', 'Loans Taken']].map(([val, label]) => (
          <button key={val} onClick={() => setFilterDir(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterDir === val ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Loans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : display.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <MdHandshake size={40} className="mx-auto mb-3 opacity-20" />
          No loans found. Add one!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map(loan => <LoanCard key={loan._id} loan={loan} />)}
        </div>
      )}

      {/* New Loan Modal */}
      <Modal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} title="Record Loan">
        <form onSubmit={handleAddLoan} className="space-y-4">
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={loanForm.date} onChange={e => setLoanForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Person *</label>
            <select className="input" value={loanForm.person} onChange={e => setLoanForm(f => ({ ...f, person: e.target.value }))} required>
              <option value="">Select person</option>
              {persons.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Direction *</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setLoanForm(f => ({ ...f, direction: 'give' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${loanForm.direction === 'give' ? 'bg-accent-green/20 border-accent-green text-accent-green' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                We Gave a Loan
              </button>
              <button type="button" onClick={() => setLoanForm(f => ({ ...f, direction: 'take' }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${loanForm.direction === 'take' ? 'bg-accent-red/20 border-accent-red text-accent-red' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                We Took a Loan
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Currency</label>
              <div className="flex gap-2">
                {['PKR', 'AED', 'SAR'].map(c => (
                  <button type="button" key={c} onClick={() => setLoanForm(f => ({ ...f, currency: c }))}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${loanForm.currency === c ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Amount *</label>
              <input type="number" className="input font-mono-num" value={loanForm.amount} onChange={e => setLoanForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" required />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={loanForm.notes} onChange={e => setLoanForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Record Loan</button>
            <button type="button" onClick={() => setShowLoanModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Repayment Modal */}
      <Modal isOpen={showRepayModal} onClose={() => setShowRepayModal(false)} title={`Repayment — ${activeLoan?.person?.name}`}>
        <form onSubmit={handleRepay} className="space-y-4">
          {activeLoan && (
            <div className="bg-surface-100 rounded-xl p-3 border border-surface-200">
              <div className="text-xs text-white/40">Remaining balance</div>
              <div className="font-mono-num font-bold text-accent-gold">{formatAmount(activeLoan.remaining)} {activeLoan.currency}</div>
            </div>
          )}
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={repayForm.date} onChange={e => setRepayForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Currency</label>
              <div className="flex gap-2">
                {['PKR', 'AED', 'SAR'].map(c => (
                  <button type="button" key={c} onClick={() => setRepayForm(f => ({ ...f, currency: c }))}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${repayForm.currency === c ? 'bg-accent-gold/20 border-accent-gold text-accent-gold' : 'bg-surface-100 border-surface-200 text-white/50'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Amount *</label>
              <input type="number" className="input font-mono-num" value={repayForm.amount} onChange={e => setRepayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" required />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={repayForm.notes} onChange={e => setRepayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Add Repayment</button>
            <button type="button" onClick={() => setShowRepayModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
