import { useState } from 'react'

export const usePagination = (initialPage = 1, initialLimit = 20) => {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  return { page, limit, setPage, reset: () => setPage(1) }
}
