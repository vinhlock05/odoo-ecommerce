'use client'

/**
 * JWT auth helpers — safe for SSR (checks typeof window before accessing localStorage).
 */

const TOKEN_KEY = 'fashionos_token'
const USER_KEY = 'fashionos_user'

export interface StoredUser {
  partner_id: number
  name: string
  email: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (!isBrowser()) return
  localStorage.setItem(TOKEN_KEY, token)
  window.dispatchEvent(new CustomEvent('fashionos:auth'))
}

export function clearToken(): void {
  if (!isBrowser()) return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isLoggedIn(): boolean {
  return getToken() !== null
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export function setUser(user: StoredUser): void {
  if (!isBrowser()) return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser(): StoredUser | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export function logout(): void {
  clearToken()
  if (isBrowser()) window.dispatchEvent(new CustomEvent('fashionos:auth'))
}
