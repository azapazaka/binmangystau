// src/pages/citizen/ReportWizard.tsx
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { createReport } from '@/lib/api'
import { env } from '@/lib/env'
import { CATEGORY_META } from '@/lib/constants'
import { Upload, MapPin, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import type { ReportCategory } from '@/types'

type Step = 1 | 2 | 3 | 4 | 5
const STEP_LABELS = ['Фото', 'Место', 'Категория', 'Детали', 'Отправка']
const CATEGORIES = Object.keys(CATEGORY_META) as ReportCategory[]

export default function ReportWizard() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [lat, setLat] = useState(env.defaultLat)
  const [lng, setLng] = useState(env.defaultLng)
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState<ReportCategory>('road')
  const [aiConfidence] = useState(84) // mock
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  const geolocate = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude)
      setLng(pos.coords.longitude)
      setAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
    })
  }

  const submit = async () => {
    if (!photo || !user) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createReport({
        photo, userCategory: category,
        description, lat, lng, address,
        submittedBy: user.id,
      })
      setDone(true)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Ошибка при отправке')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Обращение отправлено!</h2>
      <p className="text-sm text-slate-500">Ваш запрос принят и будет обработан городской службой.</p>
      <button onClick={() => nav('/citizen/my-reports')} className="btn-primary">
        Мои обращения
      </button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step
            return (
              <div key={n} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  n < step ? 'bg-green-600 text-white' :
                  n === step ? 'bg-green-600 text-white ring-4 ring-green-100' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {n < step ? '✓' : n}
                </div>
                <span className={`text-[10px] font-medium ${n === step ? 'text-green-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="relative h-1 bg-slate-100 rounded-full">
          <div className="absolute h-1 bg-green-600 rounded-full transition-all"
            style={{ width: `${((step - 1) / 4) * 100}%` }} />
        </div>
      </div>

      <div className="card p-6">
        {/* Step 1: Photo */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Добавьте фото</h3>
            <p className="text-sm text-slate-500 mb-5">Сделайте или загрузите фото проблемы</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="" className="w-full h-64 object-cover rounded-xl" />
                <button onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-slate-500 hover:text-red-500">
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-green-400 hover:bg-green-50 transition-colors">
                <Upload size={28} className="text-slate-300" />
                <span className="text-sm text-slate-400">Нажмите для загрузки фото</span>
              </button>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Подтвердите место</h3>
            <p className="text-sm text-slate-500 mb-5">Укажите, где находится проблема</p>
            <div className="h-48 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <div className="text-slate-400 text-sm text-center p-4">
                <MapPin size={28} className="mx-auto mb-2 text-green-400" />
                <p>Карта: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Введите адрес вручную"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600" />
              <button onClick={geolocate} className="btn-ghost shrink-0 flex items-center gap-1.5 px-3">
                <MapPin size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Category */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Категория</h3>
            <p className="text-sm text-slate-500 mb-4">AI определил категорию. Вы можете изменить.</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-green-700">AI определил:</p>
                <CategoryBadge category={category} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-green-100 rounded-full">
                  <div className="h-2 bg-green-600 rounded-full" style={{ width: `${aiConfidence}%` }} />
                </div>
                <span className="text-xs font-bold text-green-700">{aiConfidence}%</span>
              </div>
              <p className="text-[11px] text-green-600 mt-1">Уверенность AI</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(c => {
                const m = CATEGORY_META[c]
                return (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      category === c
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <div className="w-3 h-3 rounded-full mb-2" style={{ background: m.color }} />
                    <p className="text-xs font-semibold text-slate-900">{m.label}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Details */}
        {step === 4 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Детали (необязательно)</h3>
            <p className="text-sm text-slate-500 mb-5">Опишите проблему подробнее</p>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={5} placeholder="Опишите проблему…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 resize-none" />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Проверьте и отправьте</h3>
            <p className="text-sm text-slate-500 mb-5">Убедитесь, что всё верно</p>
            <div className="flex gap-4">
              {photoPreview && (
                <img src={photoPreview} alt="" className="w-24 h-24 object-cover rounded-xl shrink-0" />
              )}
              <div className="flex flex-col gap-1.5 text-sm">
                <div><span className="text-slate-400">Место:</span> <span className="font-medium">{address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</span></div>
                <div className="flex items-center gap-2"><span className="text-slate-400">Категория:</span> <CategoryBadge category={category} /></div>
                {description && <div><span className="text-slate-400">Описание:</span> <span>{description}</span></div>}
              </div>
            </div>
            {submitError && (
              <p className="mt-4 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{submitError}</p>
            )}
            <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-700 font-medium">
                ✓ Данные будут переданы в городскую службу и обработаны AI-системой
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <button onClick={() => setStep(s => (s > 1 ? s - 1 : s) as Step)}
          disabled={step === 1}
          className="btn-ghost flex items-center gap-2 disabled:opacity-40">
          <ChevronLeft size={16} /> Назад
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(s => (s + 1) as Step)}
            disabled={step === 1 && !photo}
            className="btn-primary flex items-center gap-2 disabled:opacity-40">
            Далее <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={submit} disabled={submitting || !photo} className="btn-primary disabled:opacity-40">
            {submitting ? 'Отправка…' : 'Отправить обращение'}
          </button>
        )}
      </div>
    </div>
  )
}
