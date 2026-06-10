// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

type AuthUser = {
  id: string
  email: string
  role: 'citizen' | 'admin'
  fullName: string
}

type AuthCtx = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>(null!)

function userFromSession(session: Session): AuthUser {
  const u: User = session.user
  return {
    id: u.id,
    email: u.email ?? '',
    role: (u.user_metadata?.role as 'citizen' | 'admin') ?? 'citizen',
    fullName: (u.user_metadata?.full_name as string) ?? u.email ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? userFromSession(data.session) : null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? userFromSession(session) : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
