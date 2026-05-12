import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getMe } from './store/slices/authSlice'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewTransactionPage from './pages/NewTransactionPage'
import RiyalPage from './pages/RiyalPage'
import DirhamPage from './pages/DirhamPage'
import PKRPage from './pages/PKRPage'
import AdvancePage from './pages/AdvancePage'
import DirectPaymentPage from './pages/DirectPaymentPage'
import RiyalSaudiPage from './pages/RiyalsaudiPage'
import LoansPage from './pages/LoansPage'
import VillagePage from './pages/VillagePage'
import ProfitPage from './pages/ProfitPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }) {
  const { token } = useSelector(s => s.auth)
  if (!token) return <Navigate to="/login" replace/>
  return children
}

export default function App() {
  const dispatch = useDispatch()
  const { token } = useSelector(s => s.auth)
  useEffect(() => { if (token) dispatch(getMe()) }, [token])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/"                  element={<DashboardPage/>}/>
              <Route path="/new-transaction"   element={<NewTransactionPage/>}/>
              <Route path="/riyal"             element={<RiyalPage/>}/>
              <Route path="/dirham"            element={<DirhamPage/>}/>
              <Route path="/pkr"               element={<PKRPage/>}/>
              <Route path="/advance"           element={<AdvancePage/>}/>
              <Route path="/direct-payment"    element={<DirectPaymentPage/>}/>
              <Route path="/riyal-saudi"       element={<RiyalSaudiPage/>}/>
              <Route path="/loans"             element={<LoansPage/>}/>
              <Route path="/village"           element={<VillagePage/>}/>
              <Route path="/profit"            element={<ProfitPage/>}/>
              <Route path="/reports"           element={<ReportsPage/>}/>
              <Route path="/settings"          element={<SettingsPage/>}/>
              <Route path="*"                  element={<Navigate to="/" replace/>}/>
            </Routes>
          </Layout>
        </ProtectedRoute>
      }/>
    </Routes>
  )
}