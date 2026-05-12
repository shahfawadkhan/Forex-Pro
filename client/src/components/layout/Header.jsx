import { Bell, Moon, Sun, Search } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleDark } from '../../store/slices/uiSlice'
import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'Dashboard',
  '/new-transaction': 'New Transaction',
  '/riyal': 'Riyal Records',
  '/dirham': 'Dirham Records',
  '/pkr': 'PKR Records',
  '/advance': 'Advance Records',
  '/direct-payment': 'Direct Payment (QAR)',
  '/loans': 'Loan Management',
  '/village': 'Village Account',
  '/profit': 'Profit Management',
  '/reports': 'Reports',
  '/settings': 'Settings'
}

export default function Header() {
  const dispatch = useDispatch()
  const { darkMode } = useSelector(s => s.ui)
  const { pathname } = useLocation()
  const title = titles[pathname] || 'ForexPro'

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-3 flex-shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-gray-400"/>
          <input
            placeholder="Search..."
            className="bg-transparent text-xs w-36 outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => dispatch(toggleDark())}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
        >
          {darkMode ? <Sun size={15}/> : <Moon size={15}/>}
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition relative">
          <Bell size={15}/>
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"/>
        </button>
      </div>
    </header>
  )
}