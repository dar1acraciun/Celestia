const BASE_URL = import.meta.env.VITE_API_URL
const ML_URL = import.meta.env.VITE_ML_URL

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

export const getHistory = (page = 0, limit = 10) =>
  fetch(`${BASE_URL}/history?page=${page}&limit=${limit}`, {
    method: 'GET',
    credentials: 'include',
  }).then(res => res.json())

export const getUser = () =>
  fetch(`${BASE_URL}/users/me`, {
    method: 'GET',
    credentials: 'include',
  }).then(res => res.json())

export const getHistoryById = (id) =>
  fetch(`${BASE_URL}/history/${id}`, {
    method: 'GET',
    credentials: 'include',
  }).then(res => res.json())

  export const addHistory = (gnn, astrometry, imageName) =>
  request('/history', { gnn, astrometry, imageName, })

export const uploadImage = async (imageFile) => {
  const form = new FormData()
  form.append('file', imageFile)
  const res = await fetch(`${BASE_URL}/images/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Upload failed')
  return data
}

async function mlRequest(path, imageFile) {
  const form = new FormData()
  form.append('image', imageFile)
  const res = await fetch(`${ML_URL}${path}`, { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'ML error')
  return data
}

export const predictGNN = (imageFile) => mlRequest('/predict', imageFile)
export const predictAstrometry = (imageFile) => mlRequest('/predict/astrometry', imageFile)
export const predictAll = (imageFile) => mlRequest('/predict/all', imageFile)

export const getAllConstellations = () =>
  fetch(`${BASE_URL}/constellations`).then(res => res.json())

export const getConstellation = (name) =>
  fetch(`${BASE_URL}/constellations/${encodeURIComponent(name)}`).then(res => res.json())

export const chatWithConstellation = (name, messages) =>
  fetch(`${BASE_URL}/constellations/${encodeURIComponent(name)}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  }).then(res => res.json())
