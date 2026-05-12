import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, Coins, Banknote, Wallet,
  CreditCard, Building2, Home, TrendingUp, FileText,
  Settings, LogOut, ChevronLeft, ChevronRight, ArrowLeftRight
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toggleSidebar } from '../../store/slices/uiSlice'

const nav = [
  {
    group: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/new-transaction', icon: PlusCircle, label: 'New Transaction' }
    ]
  },
  {
    group: 'Records',
    items: [
      { to: '/riyal', icon: Coins, label: 'Riyal Records' },
      { to: '/dirham', icon: Banknote, label: 'Dirham Records' },
      { to: '/pkr', icon: Wallet, label: 'PKR Records' },
      { to: '/advance', icon: CreditCard, label: 'Advance Records' },
      { to: '/direct-payment', icon: ArrowLeftRight, label: 'Direct Payment' }
    ]
  },
  {
    group: 'Finance',
    items: [
      { to: '/loans', icon: Building2, label: 'Loan Management' },
      { to: '/village', icon: Home, label: 'Village Account' },
      { to: '/profit', icon: TrendingUp, label: 'Profit Management' },
      { to: '/reports', icon: FileText, label: 'Reports' }
    ]
  },
  {
    group: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' }
    ]
  }
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { sidebarOpen } = useSelector(s => s.ui)

  return (
    <div className={`${sidebarOpen ? 'w-52' : 'w-14'} bg-[#0f2540] flex flex-col transition-all duration-200 flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        {sidebarOpen && (
          <div>
            <div className="text-white font-semibold text-sm">💱 ForexPro</div>
            <div className="text-blue-300 text-[10px] uppercase tracking-widest">Exchange Mgmt</div>
          </div>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="text-blue-300 hover:text-white transition ml-auto"
        >
          {sidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {nav.map(g => (
          <div key={g.group}>
            {sidebarOpen && (
              <div className="px-4 py-2 text-[9px] uppercase tracking-widest text-blue-400/50 font-medium">
                {g.group}
              </div>
            )}
            {g.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2 text-sm transition border-l-2 ${
                    isActive
                      ? 'text-white border-blue-400 bg-white/5'
                      : 'text-blue-300 border-transparent hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={16} className="flex-shrink-0"/>
                {sidebarOpen && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.name}</div>
              <div className="text-blue-300 text-[10px] capitalize">{user?.role}</div>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="text-blue-300 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut size={14}/>
            </button>
          </div>
        ) : (
          <button
            onClick={() => dispatch(logout())}
            className="text-blue-300 hover:text-red-400 transition"
            title="Logout"
          >
            <LogOut size={16}/>
          </button>
        )}
      </div>
    </div>
  )
}