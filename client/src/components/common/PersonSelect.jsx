import { useEffect, useState } from 'react'
import api from '../../utils/api'

// Shared cache so we don't hammer the API on every mount
let _cache = null
let _cacheTime = 0
const CACHE_MS = 30_000

export function usePersons() {
  const [persons, setPersons] = useState(_cache || [])
  const [loading, setLoading] = useState(!_cache)

  useEffect(() => {
    if (_cache && Date.now() - _cacheTime < CACHE_MS) {
      setPersons(_cache); setLoading(false); return
    }
    api.get('/persons?active=true').then(({ data: r }) => {
      _cache = r.data; _cacheTime = Date.now()
      setPersons(r.data)
    }).finally(() => setLoading(false))
  }, [])

  // Call this after adding a new person to bust cache
  const refresh = () => { _cache = null; _cacheTime = 0 }

  return { persons, loading, refresh }
}

export default function PersonSelect({ value, onChange, placeholder = 'Select person', className = '' }) {
  const { persons, loading } = usePersons()

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`input ${className}`}
      disabled={loading}
    >
      <option value="">{loading ? 'Loading…' : placeholder}</option>
      {persons.map(p => (
        <option key={p._id} value={p.name}>{p.name}{p.city ? ` — ${p.city}` : ''}</option>
      ))}
    </select>
  )
}
