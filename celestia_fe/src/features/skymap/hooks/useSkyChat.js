import { useState } from 'react'
import { chatWithSky } from '../api'

export function useSkyChat(lat, lon, onClose) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your sky-map guide. Ask me where a constellation is right now — like **where is Orion?** — and I'll tell you if it's up, which direction to look, or when it rises.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [visibility, setVisibility] = useState(null)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const updated = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await chatWithSky(updated, lat, lon, new Date().toISOString())
      // Attach the facts to the assistant bubble so a "Show me" button can be
      // gated/rendered on the correct message (purely additive — the top-level
      // visibility state below still drives the rise chip).
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, visibility: res.visibility ?? null }])
      setVisibility(res.visibility ?? null)
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      setVisibility(null)
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
    onClose?.()
  }

  return { messages, input, setInput, loading, visibility, send, onKey, handleClose }
}
