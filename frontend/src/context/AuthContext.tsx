import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type AuthUser, type ProfileUpdatePayload } from '../api/client'

type AuthState = {
  user: AuthUser | null
  token: string | null
  authRequired: boolean
  registrationOpen: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (body: { username: string; email: string; password: string; display_name?: string }) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (body: ProfileUpdatePayload) => Promise<void>
  uploadAvatar: (file: File) => Promise<void>
  refreshSession: () => Promise<void>
}

const TOKEN_KEY = 'bettinghud_web_token'
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (tok: string | null) => {
    if (!tok) {
      const me = await api.authMe(null)
      setUser(null)
      setAuthRequired(me.auth_required)
      setRegistrationOpen(!!me.registration_open)
      return
    }
    const me = await api.authMe(tok)
    setRegistrationOpen(!!me.registration_open)
    if (me.authenticated && me.user) {
      setUser(me.user)
      setAuthRequired(me.auth_required)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      setAuthRequired(me.auth_required)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        await refresh(token)
      } finally {
        setLoading(false)
      }
    })()
  }, [token, refresh])

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.authLogin(username, password)
    localStorage.setItem(TOKEN_KEY, res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (body: { username: string; email: string; password: string; display_name?: string }) => {
      const res = await api.authRegister(body)
      localStorage.setItem(TOKEN_KEY, res.token)
      setToken(res.token)
      setUser(res.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    if (token) await api.authLogout(token)
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [token])

  const updateProfile = useCallback(
    async (body: ProfileUpdatePayload) => {
      if (!token) throw new Error('Non connecté')
      const res = await api.authUpdateProfile(token, body)
      setUser(res.user)
    },
    [token],
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!token) throw new Error('Non connecté')
      const res = await api.authUploadAvatar(token, file)
      setUser(res.user)
    },
    [token],
  )

  const refreshSession = useCallback(async () => {
    await refresh(token)
  }, [refresh, token])

  const value = useMemo(
    () => ({
      user,
      token,
      authRequired,
      registrationOpen,
      loading,
      login,
      register,
      logout,
      updateProfile,
      uploadAvatar,
      refreshSession,
    }),
    [
      user,
      token,
      authRequired,
      registrationOpen,
      loading,
      login,
      register,
      logout,
      updateProfile,
      uploadAvatar,
      refreshSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
