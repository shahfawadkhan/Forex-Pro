import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const call = useCallback(async (fn, options = {}) => {
    setLoading(true); setError(null)
    try {
      const result = await fn()
      if (options.successMsg) toast.success(options.successMsg)
      return result
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error occurred'
      setError(msg)
      if (options.errorMsg !== false) toast.error(options.errorMsg || msg)
      throw err
    } finally { setLoading(false) }
  }, [])

  return { loading, error, call }
}
