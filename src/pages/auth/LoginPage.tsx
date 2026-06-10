// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { MapPin, Eye, EyeOff } from 'lucide-react'
import { APP_NAME, DEMO_ACCOUNTS } from '@/lib/constants'

export default function LoginPage() {
  const { role = 'citizen' } = useParams<{ role: 'citizen' | 'admin' }>()
  const { signIn } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fill = () => {
    const acc = DEMO_ACCOUNTS[role as 'citizen' | 'admin']
    setEmail(acc.email)
    setPassword(acc.password)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err); return }
    nav(from ?? (role === 'admin' ? '/admin' : '/citizen/report'), { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
            <MapPin size={18} className="text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900">{APP_NAME}</span>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {role === 'admin' ? 'Вход для администратора' : 'Вход для гражданина'}
          </h2>
          <p className="text-sm text-slate-500 mb-5">Введите email и пароль для входа</p>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Пароль</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-1">
              {loading ? 'Вход…' : 'Войти'}
            </button>
          </form>

          <button
            onClick={fill}
            className="mt-3 w-full text-center text-xs text-slate-400 hover:text-green-600"
          >
            Использовать демо-аккаунт
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          {role === 'admin'
            ? <a href="/login/citizen" className="hover:underline">Войти как гражданин →</a>
            : <a href="/login/admin" className="hover:underline">Войти как администратор →</a>}
        </p>
      </div>
    </div>
  )
}
