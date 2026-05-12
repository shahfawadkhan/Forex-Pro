import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleDark } from '../store/slices/uiSlice'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Moon, Sun, Shield, Building2, Key } from 'lucide-react'

export default function SettingsPage() {
  const dispatch = useDispatch()
  const { darkMode } = useSelector(s => s.ui)
  const { user } = useSelector(s => s.auth)
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [settingsForm, setSettingsForm] = useState({ companyName: user?.companyName || 'ForexPro Exchange', defaultCurrency: user?.settings?.defaultCurrency || 'PKR' })

  const savePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill all fields')
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match')
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    try {
      await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully!'); setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' })
    } catch(e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const saveSettings = async () => {
    try {
      await api.put('/auth/settings', settingsForm)
      toast.success('Settings saved!')
    } catch(e) { toast.error('Failed to save settings') }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 size={15} className="text-blue-600"/>Company Settings</h3>
        <div className="space-y-3">
          <div><label className="label">Company Name</label><input className="input" value={settingsForm.companyName} onChange={e=>setSettingsForm({...settingsForm,companyName:e.target.value})}/></div>
          <div><label className="label">Default Currency</label>
            <select className="input" value={settingsForm.defaultCurrency} onChange={e=>setSettingsForm({...settingsForm,defaultCurrency:e.target.value})}>
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="QAR">QAR - Qatari Riyal</option>
            </select>
          </div>
          <button onClick={saveSettings} className="btn-primary text-xs">Save Settings</button>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          {darkMode ? <Moon size={15} className="text-blue-600"/> : <Sun size={15} className="text-amber-500"/>}
          Appearance
        </h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium">Dark Mode</div>
            <div className="text-xs text-gray-400">Toggle between light and dark theme</div>
          </div>
          <button onClick={()=>dispatch(toggleDark())} className={`relative w-11 h-6 rounded-full transition-colors ${darkMode?'bg-blue-600':'bg-gray-200'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode?'translate-x-5':'translate-x-0.5'}`}/>
          </button>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shield size={15} className="text-blue-600"/>Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-500">Name</span><span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-500">Email</span><span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Role</span><span className="font-medium capitalize px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Key size={15} className="text-blue-600"/>Change Password</h3>
        <div className="space-y-3">
          <div><label className="label">Current Password</label><input className="input" type="password" value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} placeholder="••••••••"/></div>
          <div><label className="label">New Password</label><input className="input" type="password" value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} placeholder="••••••••"/></div>
          <div><label className="label">Confirm New Password</label><input className="input" type="password" value={pwForm.confirmPassword} onChange={e=>setPwForm({...pwForm,confirmPassword:e.target.value})} placeholder="••••••••"/></div>
          <button onClick={savePassword} className="btn-primary text-xs">Change Password</button>
        </div>
      </div>
    </div>
  )
}
