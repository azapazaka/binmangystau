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
  registerCitizen: (input: {
    fullName: string
    email: string
    password: string
  }) => Promise<
    | { status: 'signed_in' }
    | { status: 'confirm_email'; message: string }
    | { status: 'error'; message: string }
  >
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

  const registerCitizen: AuthCtx['registerCitizen'] = async ({
    fullName,
    email,
    password,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'citizen',
          full_name: fullName.trim(),
        },
      },
    })

    if (error) {
      return { status: 'error', message: error.message }
    }

    if (data.session) {
      setUser(userFromSession(data.session))
      return { status: 'signed_in' }
    }

    return {
      status: 'confirm_email',
      message: 'Account created. Confirm your email, then sign in to continue.',
    }
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return <AuthContext.Provider value={{ user, loading, signIn, registerCitizen, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
