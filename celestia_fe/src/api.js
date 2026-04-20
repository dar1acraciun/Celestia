const BASE_URL = import.meta.env.VITE_API_URL

async function request(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

export const loginUser = (email, password) =>
  request('/auth/login', { email, password })

export const registerUser = (email, password) =>
  request('/auth/register', { email, password })

export const logoutUser = () =>
  fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
