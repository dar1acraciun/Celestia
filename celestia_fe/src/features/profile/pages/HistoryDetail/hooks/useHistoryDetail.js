import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getHistoryById } from '../api'

export function useHistoryDetail(id) {
 
  const { state } = useLocation()
  const navigate = useNavigate()

  const [entry, setEntry] = useState(state || null)
  const [loading, setLoading] = useState(!state)

  useEffect(() => {
    if (state) return
    getHistoryById(id)
      .then(setEntry)
      .catch(() => navigate('/profile'))
      .finally(() => setLoading(false))
  }, [id])

  return { entry, loading}
}