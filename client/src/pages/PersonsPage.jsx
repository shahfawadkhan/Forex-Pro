import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, Pencil, Trash2, Eye, Phone, MapPin, Search } from 'lucide-react'
import api from '../utils/api'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { fmtDate } from '../utils/format'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const emptyForm = { name: '', phone: '', city: '', notes: '', active: true }

export default function PersonsPage() {
  const navigate = useNavigate()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [selected, setSelected] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ ...(search && { search }) })
      const { data: r } = await api.get(`/persons?${q}`)
      setData(r.data)
    } catch { toast.error('Failed to load persons') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setSelected(null); setForm(emptyForm); setModal('form') }
  const openEdit = (p) => { setSelected(p); setForm({ name: p.name, phone: p.phone, city: p.city, notes: p.notes, active: p.active }); setModal('form') }

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    try {
      if (selected) await api.put(`/persons/${selected._id}`, form)
      else          await api.post('/persons', form)
      toast.success(selected ? 'Updated!' : 'Person added!')
      setModal(null); load()
    } catch (e) { toast.error(e.response?.data?.message || 'Error') }
  }

  const del = async () => {
    try { await api.delete(`/persons/${deleteId}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
    finally { setDeleteId(null) }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-blue-600"/>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Persons</h1>
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{data.length}</span>
        </div>
        <button onClick={openAdd} className="btn-primary text-xs py-1.5 flex items-center gap-1">
          <Plus size={13}/> Add Person
        </button>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="input pl-8"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"/>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"/>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30"/>
            <p className="text-sm">No persons yet. Add your first person.</p>
          </div>
        ) : data.map(p => (
          <div key={p._id} className="card p-4 hover:shadow-md transition group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {p.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800 dark:text-white leading-tight">{p.name}</p>
                  {p.city && <p className="text-xs text-gray-400 flex items-center gap-0.5"><MapPin size={10}/>{p.city}</p>}
                </div>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {p.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                <Phone size={10}/> {p.phone}
              </p>
            )}
            {p.notes && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{p.notes}</p>}

            <p className="text-[10px] text-gray-300 mb-3">Added {fmtDate(p.createdAt)}</p>

            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => navigate(`/persons/${p._id}`)}
                className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              >
                <Eye size={12}/> View
              </button>
              <button
                onClick={() => openEdit(p)}
                className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Pencil size={12}/> Edit
              </button>
              <button
                onClick={() => setDeleteId(p._id)}
                className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
              >
                <Trash2 size={12}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={selected ? 'Edit Person' : 'Add Person'}>
        <div className="space-y-3">
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92..."/>
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City"/>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes"/>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded"/>
            <label htmlFor="active" className="text-sm text-gray-600 dark:text-gray-300">Active</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={submit} className="btn-primary flex-1">{selected ? 'Update' : 'Add Person'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={del}
        message="Delete this person? Their transaction history will remain."
      />
    </div>
  )
}
