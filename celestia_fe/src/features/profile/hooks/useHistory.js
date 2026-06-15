import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getUser, getHistory, getChatSessions } from '../api'

export function useHistory() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [entries, setEntries] = useState([])
  const [chatSessions, setChatSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getUser(), getHistory(), getChatSessions()])
      .then(([userData, historyData, chatData]) => {
        setUser(userData)
        setEntries(historyData.entries || [])
        setChatSessions(chatData.sessions || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const displayName = user?.username || user?.email || ''
  const initials = displayName.charAt(0).toUpperCase()
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return { user, entries, chatSessions, loading, handleLogout, displayName, initials, memberSince }
}

