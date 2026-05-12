export default function StatCard({ label, value, sub, icon: Icon, color='blue', onClick }) {
  const colors = { blue:{bg:'bg-blue-50 dark:bg-blue-900/20',text:'text-blue-600',val:'text-blue-700 dark:text-blue-300'}, green:{bg:'bg-green-50 dark:bg-green-900/20',text:'text-green-600',val:'text-green-700 dark:text-green-300'}, red:{bg:'bg-red-50 dark:bg-red-900/20',text:'text-red-600',val:'text-red-700 dark:text-red-300'}, amber:{bg:'bg-amber-50 dark:bg-amber-900/20',text:'text-amber-600',val:'text-amber-700 dark:text-amber-300'}, purple:{bg:'bg-purple-50 dark:bg-purple-900/20',text:'text-purple-600',val:'text-purple-700 dark:text-purple-300'}, teal:{bg:'bg-teal-50 dark:bg-teal-900/20',text:'text-teal-600',val:'text-teal-700 dark:text-teal-300'} }
  const c = colors[color] || colors.blue
  return (
    <div className={`card p-4 ${onClick?'cursor-pointer hover:shadow-md transition':''}`} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-xl font-semibold truncate ${c.val}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && <div className={`${c.bg} p-2 rounded-lg ml-3`}><Icon size={18} className={c.text}/></div>}
      </div>
    </div>
  )
}
