import { ChevronLeft, ChevronRight } from 'lucide-react'
export default function Table({ columns, data, loading, page, pages, onPageChange, emptyMsg='No records found' }) {
  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr>{columns.map(c=><th key={c.key} className="th">{c.label}</th>)}</tr></thead>
          <tbody>
            {data.length===0
              ? <tr><td colSpan={columns.length} className="td text-center py-12 text-gray-400">{emptyMsg}</td></tr>
              : data.map((row,i)=>(
                <tr key={row._id||i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  {columns.map(c=><td key={c.key} className="td">{c.render?c.render(row[c.key],row):row[c.key]}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pages>1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500">Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button onClick={()=>onPageChange(page-1)} disabled={page===1} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronLeft size={14}/></button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={()=>onPageChange(p)} className={`px-2.5 py-1 rounded text-xs font-medium ${p===page?'bg-blue-600 text-white':'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{p}</button>
            ))}
            <button onClick={()=>onPageChange(page+1)} disabled={page===pages} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><ChevronRight size={14}/></button>
          </div>
        </div>
      )}
    </div>
  )
}
