import { useState } from 'react'
import { FileText, FileSpreadsheet, Download, BarChart3 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const reports = [
  { type:'riyal', label:'Riyal Transactions', desc:'All SAR buy/sell records with profit and payment status', color:'blue', icon: FileText },
  { type:'dirham', label:'Dirham Transactions', desc:'All AED buy/sell records with balances and profit', color:'purple', icon: FileText },
  { type:'pkr', label:'PKR Transactions', desc:'All PKR exchange transactions with margin details', color:'amber', icon: FileText },
  { type:'loans', label:'Loan Statement', desc:'Complete loan records — given and taken — with repayment history', color:'red', icon: BarChart3 },
  { type:'village', label:'Village Account', desc:'All deposits and withdrawals with running balance', color:'teal', icon: FileSpreadsheet },
  { type:'profit', label:'Profit Report', desc:'Detailed profit breakdown by source and date', color:'green', icon: BarChart3 },
]

const colorMap = { blue:'border-blue-200 bg-blue-50 dark:bg-blue-900/10', purple:'border-purple-200 bg-purple-50 dark:bg-purple-900/10', amber:'border-amber-200 bg-amber-50 dark:bg-amber-900/10', red:'border-red-200 bg-red-50 dark:bg-red-900/10', teal:'border-teal-200 bg-teal-50 dark:bg-teal-900/10', green:'border-green-200 bg-green-50 dark:bg-green-900/10' }
const iconColorMap = { blue:'text-blue-600', purple:'text-purple-600', amber:'text-amber-600', red:'text-red-600', teal:'text-teal-600', green:'text-green-600' }

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customType, setCustomType] = useState('riyal')
  const [loading, setLoading] = useState('')

  const generateReport = async (type) => {
    setLoading(type)
    try {
      const res = await api.post('/reports/generate', { type, startDate, endDate, format:'xlsx' }, { responseType:'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `${type}-report.xlsx`; a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch(e) { toast.error('Failed to generate report') }
    finally { setLoading('') }
  }

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Download size={15} className="text-blue-600"/>Custom Report Generator</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div><label className="label">From Date</label><input className="input" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></div>
          <div><label className="label">To Date</label><input className="input" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></div>
          <div><label className="label">Report Type</label>
            <select className="input" value={customType} onChange={e=>setCustomType(e.target.value)}>
              {reports.map(r=><option key={r.type} value={r.type}>{r.label}</option>)}
            </select>
          </div>
          <button onClick={()=>generateReport(customType)} disabled={!!loading} className="btn-primary justify-center">
            {loading===customType ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><Download size={13}/>Generate Excel</>}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Quick Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => {
            const Icon = r.icon
            return (
              <div key={r.type} className={`card border p-4 hover:shadow-md transition ${colorMap[r.color]}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold">{r.label}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                  <Icon size={20} className={iconColorMap[r.color]}/>
                </div>
                <button onClick={()=>generateReport(r.type)} disabled={!!loading} className={`w-full btn-secondary text-xs py-2 justify-center border ${colorMap[r.color]}`}>
                  {loading===r.type
                    ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                    : <><FileSpreadsheet size={13}/>Download Excel</>
                  }
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-2">Print Instructions</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Use <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac) to print any page</p>
          <p>• Go to the specific records page (Riyal, Dirham, etc.) and press print for a printable table</p>
          <p>• Excel reports can be opened in Microsoft Excel or Google Sheets</p>
          <p>• PDF reports can be generated using the jsPDF buttons on individual records pages</p>
        </div>
      </div>
    </div>
  )
}
