const BASE_URL = import.meta.env.VITE_API_URL
const ML_URL = import.meta.env.VITE_ML_URL

export async function request(path, body) {
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

export async function mlRequest(path, imageFile) {
  const form = new FormData()
  form.append('image', imageFile)
  const res = await fetch(`${ML_URL}${path}`, { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'ML error')
  return data
}

export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' })
  return res.json()
}

export async function postForm(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something went wrong')
  return data
}
