import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, clearError } from '../store/slices/authSlice'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email: 'admin@forexpro.com', password: 'password123' })
  const [show, setShow] = useState(false)

  useEffect(() => { if (token) navigate('/') }, [token])
  useEffect(() => { return () => dispatch(clearError()) }, [])

  const submit = (e) => { e.preventDefault(); dispatch(login(form)) }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2540] via-[#1a3a5c] to-[#0f2540] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <TrendingUp size={28} className="text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-white">ForexPro</h1>
          <p className="text-blue-300 text-sm mt-1">Exchange Management System</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Sign In</h2>
          <p className="text-xs text-gray-400 mb-5">Enter your credentials to access the system</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-4">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="admin@forexpro.com" required/>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={show?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required/>
                <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Sign In'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">Default: admin@forexpro.com / password123</p>
        </div>
      </div>
    </div>
  )
}
