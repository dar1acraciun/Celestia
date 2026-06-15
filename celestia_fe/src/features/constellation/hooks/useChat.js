import { useState, useRef, useEffect } from 'react'
import { chatWithConstellation, saveChatSession } from '../api'
import { useAuth } from '../../../context/AuthContext'

export function useChat(constellationName, onClose) {
  const { isLoggedIn } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your astronomy guide for **${constellationName}**. Ask me anything — stars, mythology, how to find it in the sky, or anything else!`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const updated = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const { reply } = await chatWithConstellation(constellationName, updated)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handleClose = () => {
    const current = messagesRef.current
    const hasUserMessage = current.some((m) => m.role === 'user')
    if (isLoggedIn && hasUserMessage) {
      saveChatSession(constellationName, current).catch(() => {})
    }
    onClose()
  }

  return { messages, input, setInput, loading, send, onKey, handleClose }
}
