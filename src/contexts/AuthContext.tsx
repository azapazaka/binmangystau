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

function authErrorMessage(error: { message?: string } | null | undefined): string | null {
  const message = error?.message?.trim()
  if (!message) return null

  const normalized = message.toLowerCase()
  if (normalized.includes('email not confirmed')) return 'Подтвердите адрес электронной почты и войдите снова.'
  if (normalized.includes('invalid login credentials')) return 'Неверный email или пароль.'
  if (normalized.includes('user already registered')) return 'Пользователь с таким email уже зарегистрирован.'
  if (normalized.includes('email address is invalid') || normalized.includes('invalid email')) {
    return 'Введите корректный email.'
  }
  if (normalized.includes('password')) return 'Пароль не соответствует требованиям.'

  return message
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
    return authErrorMessage(error)
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
      return { status: 'error', message: authErrorMessage(error) ?? error.message }
    }

    if (data.session) {
      setUser(userFromSession(data.session))
      return { status: 'signed_in' }
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInData.session) {
      setUser(userFromSession(signInData.session))
      return { status: 'signed_in' }
    }

    const rawSignInMessage = signInError?.message?.trim() ?? ''
    if (rawSignInMessage.toLowerCase().includes('email not confirmed')) {
      return {
        status: 'confirm_email',
        message: 'Аккаунт создан. Подтвердите email и войдите снова.',
      }
    }

    return {
      status: 'error',
      message: authErrorMessage(signInError) ?? rawSignInMessage,
    }
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return <AuthContext.Provider value={{ user, loading, signIn, registerCitizen, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
