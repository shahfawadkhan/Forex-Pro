import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Banknote, Coins, Wallet, Phone, MapPin, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../utils/api'
import { fmtPKR, fmtAED, fmtDate } from '../utils/format'
import Badge from '../components/common/Badge'
import toast from 'react-hot-toast'

function CurrencySection({ title, icon: Icon, color, ledger, transactions, columns, expanded, onToggle }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-600',   light: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600',   border: 'border-blue-200 dark:border-blue-800' },
    amber:  { bg: 'bg-amber-600',  light: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600',  border: 'border-amber-200 dark:border-amber-800' },
    green:  { bg: 'bg-green-600',  light: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-600',  border: 'border-green-200 dark:border-green-800' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`card border ${c.border}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <div className={`${c.bg} p-2 rounded-lg`}>
            <Icon size={16} className="text-white"/>
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm text-gray-800 dark:text-white">{title}</p>
            <p className="text-xs text-gray-400">{ledger.txCount} transaction{ledger.txCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mr-2">
          <div className="text-right">
            <p className="text-[10px] text-gray-400">We Owe</p>
            <p className="text-sm font-medium text-red-600">{fmtPKR(ledger.owes)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">They Owe</p>
            <p className="text-sm font-medium text-green-600">{fmtPKR(ledger.owed)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Profit</p>
            <p className="text-sm font-medium text-blue-600">{fmtPKR(ledger.profit)}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No transactions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    {columns.map(col => (
                      <th key={col.key} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide text-[10px]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.map(tx => (
                    <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                      {columns.map(col => (
                        <td key={col.key} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                          {col.render ? col.render(tx[col.key], tx) : tx[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PersonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [person, setPerson]   = useState(null)
  const [ledger, setLedger]   = useState({})
  const [txns, setTxns]       = useState({})
  const [open, setOpen]       = useState({ dirham: true, riyal: false, pkr: false })

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const { data: r } = await api.get(`/persons/${id}`)
        setPerson(r.data); setLedger(r.ledger); setTxns(r.transactions)
      } catch { toast.error('Failed to load person'); navigate('/persons') }
      finally { setLoading(false) }
    })()
  }, [id])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"/>
      <div className="card p-6 h-32"/>
      <div className="card p-6 h-48"/>
    </div>
  )

  if (!person) return null

  const totalOwes   = (ledger.dirham?.owes  || 0) + (ledger.riyal?.owes  || 0) + (ledger.pkr?.owes  || 0)
  const totalOwed   = (ledger.dirham?.owed  || 0) + (ledger.riyal?.owed  || 0) + (ledger.pkr?.owed  || 0)
  const totalProfit = (ledger.dirham?.profit || 0) + (ledger.riyal?.profit || 0) + (ledger.pkr?.profit || 0)
  const totalTx     = (ledger.dirham?.txCount || 0) + (ledger.riyal?.txCount || 0) + (ledger.pkr?.txCount || 0)

  const dirhamCols = [
    { key: 'date',          label: 'Date',       render: v => <span className="text-gray-400">{fmtDate(v)}</span> },
    { key: 'role',          label: 'Role',        render: (_, tx) => {
      const isBuyer  = tx.buyPerson?.toLowerCase()  === person.name.toLowerCase()
      const isSeller = tx.sellPerson?.toLowerCase() === person.name.toLowerCase()
      return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isBuyer && isSeller ? 'bg-purple-100 text-purple-700' : isBuyer ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
        {isBuyer && isSeller ? 'Both' : isBuyer ? 'Buyer' : 'Seller'}
      </span>
    }},
    { key: 'buyPerson',  label: 'Buy From' },
    { key: 'sellPerson', label: 'Sell To' },
    { key: 'buyAmount',  label: 'Buy AED',    render: v => fmtAED(v) },
    { key: 'buyRate',    label: 'Buy Rate',   render: v => v?.toFixed(4) },
    { key: 'sellAmount', label: 'Sell AED',   render: v => fmtAED(v) },
    { key: 'sellRate',   label: 'Sell Rate',  render: v => v?.toFixed(4) },
    { key: 'profit',     label: 'Profit',     render: v => <span className="text-green-600 font-medium">{fmtPKR(v)}</span> },
    { key: 'paymentStatus', label: 'Status',  render: v => <Badge status={v}/> },
  ]

  const riyalCols = [
    { key: 'date',          label: 'Date',       render: v => <span className="text-gray-400">{fmtDate(v)}</span> },
    { key: 'role',          label: 'Role',        render: (_, tx) => {
      const isBuyer  = tx.buyPerson?.toLowerCase()  === person.name.toLowerCase()
      const isSeller = tx.sellPerson?.toLowerCase() === person.name.toLowerCase()
      return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isBuyer && isSeller ? 'bg-purple-100 text-purple-700' : isBuyer ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
        {isBuyer && isSeller ? 'Both' : isBuyer ? 'Buyer' : 'Seller'}
      </span>
    }},
    { key: 'buyPerson',  label: 'Buy From' },
    { key: 'sellPerson', label: 'Sell To' },
    { key: 'transactionType', label: 'Type', render: v => <span className="capitalize text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{v}</span> },
    { key: 'buyAmount',  label: 'Buy Amt',   render: v => fmtPKR(v) },
    { key: 'sellAmount', label: 'Sell Amt',  render: v => fmtPKR(v) },
    { key: 'profit',     label: 'Profit',    render: v => <span className="text-green-600 font-medium">{fmtPKR(v)}</span> },
    { key: 'paymentStatus', label: 'Status', render: v => <Badge status={v}/> },
  ]

  const pkrCols = [
    { key: 'date',       label: 'Date',       render: v => <span className="text-gray-400">{fmtDate(v)}</span> },
    { key: 'role',       label: 'Role',        render: (_, tx) => {
      const isBuyer  = tx.buyPerson?.toLowerCase()  === person.name.toLowerCase()
      const isSeller = tx.sellPerson?.toLowerCase() === person.name.toLowerCase()
      return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isBuyer && isSeller ? 'bg-purple-100 text-purple-700' : isBuyer ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
        {isBuyer && isSeller ? 'Both' : isBuyer ? 'Buyer' : 'Seller'}
      </span>
    }},
    { key: 'buyPerson',  label: 'Buy From' },
    { key: 'sellPerson', label: 'Sell To' },
    { key: 'amount',     label: 'Amount',    render: v => fmtPKR(v) },
    { key: 'marginPercent', label: 'Margin %', render: v => `${v}%` },
    { key: 'profit',     label: 'Profit',    render: v => <span className="text-green-600 font-medium">{fmtPKR(v)}</span> },
    { key: 'paymentStatus', label: 'Status', render: v => <Badge status={v}/> },
  ]

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={() => navigate('/persons')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
        <ArrowLeft size={15}/> Back to Persons
      </button>

      {/* Person card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {person.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{person.name}</h1>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${person.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {person.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {person.phone && <span className="flex items-center gap-1"><Phone size={12}/>{person.phone}</span>}
              {person.city  && <span className="flex items-center gap-1"><MapPin size={12}/>{person.city}</span>}
              {person.notes && <span className="flex items-center gap-1"><AlertCircle size={12}/>{person.notes}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Member since</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{fmtDate(person.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{totalTx}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">We Owe (Total)</p>
          <p className="text-lg font-bold text-red-600">{fmtPKR(totalOwes)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">They Owe (Total)</p>
          <p className="text-lg font-bold text-green-600">{fmtPKR(totalOwed)}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Total Profit</p>
          <p className="text-lg font-bold text-indigo-600">{fmtPKR(totalProfit)}</p>
        </div>
      </div>

      {/* Per-currency sections */}
      <CurrencySection
        title="Dirham (AED) Transactions"
        icon={Banknote}
        color="blue"
        ledger={ledger.dirham || {}}
        transactions={txns.dirham || []}
        columns={dirhamCols}
        expanded={open.dirham}
        onToggle={() => setOpen(o => ({ ...o, dirham: !o.dirham }))}
      />
      <CurrencySection
        title="Riyal (SAR / QAR) Transactions"
        icon={Coins}
        color="amber"
        ledger={ledger.riyal || {}}
        transactions={txns.riyal || []}
        columns={riyalCols}
        expanded={open.riyal}
        onToggle={() => setOpen(o => ({ ...o, riyal: !o.riyal }))}
      />
      <CurrencySection
        title="PKR Transactions"
        icon={Wallet}
        color="green"
        ledger={ledger.pkr || {}}
        transactions={txns.pkr || []}
        columns={pkrCols}
        expanded={open.pkr}
        onToggle={() => setOpen(o => ({ ...o, pkr: !o.pkr }))}
      />
    </div>
  )
}
