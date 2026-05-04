import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Persons from './pages/Persons';
import PersonLedger from './pages/PersonLedger';
import Payments from './pages/Payments';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Login from './pages/Login';

const isAuthenticated = () => !!localStorage.getItem('token');

function ProtectedRoute() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: { background: '#1a1d27', color: '#fff', border: '1px solid #2a2e42', fontSize: '13px' },
          success: { iconTheme: { primary: '#d4a843', secondary: '#000' } },
        }}
      />
      <Routes>
        <Route path="/login" element={isAuthenticated() ? <Navigate to="/" /> : <Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/persons/:id/ledger" element={<PersonLedger />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
