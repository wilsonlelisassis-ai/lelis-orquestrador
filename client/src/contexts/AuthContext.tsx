import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'

export const SUPABASE_URL = 'https://rhlzymrsvvxkzjszhftw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobHp5bXJzdnZ4a3pqc3poZnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTIwNTIsImV4cCI6MjA4ODA2ODA1Mn0.bJ5crjdEE8Hx2h3SvuSMald-hHzT7dLZZhZaHDM-oGA'

interface User {
  id: string
  email: string
  name: string
  access_token: string
  refresh_token: string
  expires_at: number // timestamp em ms
  created_at?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  getToken: () => Promise<string | null>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Salvar usuário no estado e localStorage
  const saveUser = useCallback((userData: User) => {
    setUser(userData)
    localStorage.setItem('avatea_user', JSON.stringify(userData))
  }, [])

  // Renovar token usando refresh_token
  const refreshToken = useCallback(async (currentUser: User): Promise<User | null> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: currentUser.refresh_token }),
      })
      if (!res.ok) {
        // Refresh falhou — deslogar
        setUser(null)
        localStorage.removeItem('avatea_user')
        return null
      }
      const data = await res.json()
      const updated: User = {
        ...currentUser,
        access_token: data.access_token,
        refresh_token: data.refresh_token || currentUser.refresh_token,
        expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
      }
      saveUser(updated)
      return updated
    } catch {
      return null
    }
  }, [saveUser])

  // Agendar renovação automática 5 minutos antes de expirar
  const scheduleRefresh = useCallback((expiresAt: number, currentUser: User) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const delay = Math.max(expiresAt - Date.now() - 5 * 60 * 1000, 10000)
    refreshTimerRef.current = setTimeout(async () => {
      const updated = await refreshToken(currentUser)
      if (updated) scheduleRefresh(updated.expires_at, updated)
    }, delay)
  }, [refreshToken])

  // Carregar sessão salva ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('avatea_user')
    if (savedUser) {
      try {
        const parsed: User = JSON.parse(savedUser)
        // Se o token ainda é válido (com margem de 5 min)
        if (parsed.expires_at && parsed.expires_at > Date.now() + 5 * 60 * 1000) {
          setUser(parsed)
          scheduleRefresh(parsed.expires_at, parsed)
        } else if (parsed.refresh_token) {
          // Token expirado — renovar imediatamente
          refreshToken(parsed).then(updated => {
            if (updated) scheduleRefresh(updated.expires_at, updated)
          })
        } else {
          localStorage.removeItem('avatea_user')
        }
      } catch {
        localStorage.removeItem('avatea_user')
      }
    }
    setLoading(false)
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [])

  // Obter token válido (renova se necessário)
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null
    // Se expira em menos de 2 minutos, renovar agora
    if (user.expires_at && user.expires_at < Date.now() + 2 * 60 * 1000) {
      const updated = await refreshToken(user)
      return updated?.access_token ?? null
    }
    return user.access_token
  }, [user, refreshToken])

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error_description || data.msg || 'Erro ao fazer login' }
      
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
        created_at: data.user.created_at,
      }
      saveUser(userData)
      scheduleRefresh(userData.expires_at, userData)
      return {}
    } catch {
      return { error: 'Erro de conexão. Tente novamente.' }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, data: { full_name: name } }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error_description || data.msg || 'Erro ao criar conta' }
      
      if (data.access_token) {
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: name || data.user.user_metadata?.full_name || data.user.email.split('@')[0],
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
          created_at: data.user.created_at,
        }
        saveUser(userData)
        scheduleRefresh(userData.expires_at, userData)
      }
      return {}
    } catch {
      return { error: 'Erro de conexão. Tente novamente.' }
    }
  }

  const signOut = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    setUser(null)
    localStorage.removeItem('avatea_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, getToken, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { SUPABASE_ANON_KEY }
