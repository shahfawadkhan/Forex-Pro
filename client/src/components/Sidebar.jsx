import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdSwapHoriz, MdPeople, MdAccountBalance,
  MdPayment, MdBarChart, MdLogout, MdMenu, MdClose,
  MdVilla, MdHandshake,
} from 'react-icons/md';
import { useState } from 'react';

const links = [
  { to: '/',            icon: MdDashboard,    label: 'Dashboard'    },
  { to: '/transactions', icon: MdSwapHoriz,  label: 'Transactions' },
  { to: '/persons',     icon: MdPeople,       label: 'Lists'        },
  { to: '/payments',    icon: MdPayment,      label: 'Payments'     },
  { to: '/accounts',    icon: MdAccountBalance, label: 'Accounts'   },
  { to: '/loans',       icon: MdHandshake,    label: 'Loans'        },
  { to: '/village',     icon: MdVilla,        label: 'Village'      },
  { to: '/reports',     icon: MdBarChart,     label: 'Reports'      },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-surface-100 p-2 rounded-xl border border-surface-200"
      >
        {open ? <MdClose size={20} /> : <MdMenu size={20} />}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface-50 border-r border-surface-200
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent-gold rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-sm font-display">FX</span>
            </div>
            <div>
              <div className="font-display font-bold text-white text-gradient-gold">ForexPro</div>
              <div className="text-xs text-white/40">Exchange Management</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-surface-200">
          <div className="flex gap-2 mb-4">
            <span className="badge-aed">AED</span>
            <span className="badge-sar">SAR</span>
            <span className="bg-white/10 text-white/60 text-xs font-semibold px-2 py-0.5 rounded-full">PKR</span>
          </div>
          <button onClick={handleLogout} className="nav-link w-full text-accent-red/70 hover:text-accent-red hover:bg-accent-red/10">
            <MdLogout size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
