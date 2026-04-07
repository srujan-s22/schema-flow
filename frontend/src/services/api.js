const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "http://localhost:5001/api";

/**
 * Lightweight fetch wrapper for backend API calls.
 */

export async function get(path) {
  const res = await fetch(`${API_BASE}${path}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `GET ${path} failed`)
  return data
}

export async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `POST ${path} failed`)
  return data
}

/**
 * GET with Authorization header from localStorage.
 */
export async function authGet(path) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `GET ${path} failed`)
  return data
}

/**
 * POST with Authorization header from localStorage.
 */
export async function authPost(path, body) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `POST ${path} failed`)
  return data
}

/**
 * POST with FormData (for file uploads) with Authorization header.
 */
export async function authPostMultipart(path, formData) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type here; browser sets it with boundary automatically for FormData
    },
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `POST ${path} failed`)
  return data
}

/**
 * DELETE with Authorization header from localStorage.
 */
export async function authDelete(path) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  // Prevent "Unexpected token <" HTML drops when the server hasn't restarted yet
  if (!res.ok) {
    let errorMsg = `DELETE ${path} failed (${res.status} ${res.statusText})`
    try {
      // Attempt to read JSON error payload natively
      const errPayload = await res.json()
      if (errPayload.error) errorMsg = errPayload.error
    } catch (parseErr) {
      console.error('Failed to parse error response as JSON. Server might have returned HTML or 404.')
    }
    throw new Error(errorMsg)
  }

  const text = await res.text()
  console.log('Raw DELETE response:', text) // Debugly logging as requested

  if (!text) return {} // Handling empty OK bodies occasionally
  
  try {
    return JSON.parse(text)
  } catch (parseErr) {
    throw new Error(`Invalid JSON format upon DELETE ${path}`)
  }
}

/**
 * Helper to get stored user info.
 */
export function getStoredUser() {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function getStoredToken() {
  return localStorage.getItem('token')
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
