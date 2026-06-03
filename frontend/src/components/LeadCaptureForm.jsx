import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function LeadCaptureForm({ conversationId, profile, language, onComplete }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const isArabic = language === 'ar'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      setError(isArabic ? 'الرجاء إدخال الاسم والبريد الإلكتروني' : 'Please enter your name and email.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await axios.post('/api/lead', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        conversation_id: conversationId,
        vehicle_interest: profile?.vehicle_preferences?.join(', ') || null,
        intent_score: profile?.lead_score || 'warm',
        priorities: profile?.priorities || [],
        budget_level: profile?.budget_level || null,
      })

      setSubmitted(true)
      setTimeout(() => {
        onComplete?.(form.name)
      }, 2000)
    } catch (err) {
      setError(isArabic ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-genesis-panel border border-genesis-copper/30 rounded-lg p-5 text-center"
      >
        <div className="w-10 h-10 rounded-full bg-genesis-copper/20 flex items-center justify-center mx-auto mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#C4956A">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <p className="text-white font-medium mb-1">
          {isArabic ? `شكراً لك، ${form.name}` : `Thank you, ${form.name}`}
        </p>
        <p className="text-genesis-muted text-sm">
          {isArabic ? 'سنتواصل معك قريباً بتوصيات مخصصة.' : "We'll reach out shortly with personalized recommendations."}
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-genesis-panel border border-genesis-copper/30 rounded-lg p-5"
    >
      <p className="text-genesis-copper text-xs tracking-widest uppercase mb-3">
        {isArabic ? 'احصل على معلومات مخصصة' : 'Get Personalized Information'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={isArabic ? 'اسمك الكريم' : 'Your Name'}
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full bg-genesis-dark border border-genesis-border rounded px-3 py-2.5 text-white text-sm placeholder-genesis-muted focus:outline-none focus:border-genesis-copper transition-colors"
          dir={isArabic ? 'rtl' : 'ltr'}
        />
        <input
          type="email"
          placeholder={isArabic ? 'بريدك الإلكتروني' : 'Email Address'}
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full bg-genesis-dark border border-genesis-border rounded px-3 py-2.5 text-white text-sm placeholder-genesis-muted focus:outline-none focus:border-genesis-copper transition-colors"
          dir="ltr"
        />
        <div className="flex gap-2">
          <span className="bg-genesis-dark border border-genesis-border rounded px-3 py-2.5 text-genesis-muted text-sm">
            +971
          </span>
          <input
            type="tel"
            placeholder={isArabic ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="flex-1 bg-genesis-dark border border-genesis-border rounded px-3 py-2.5 text-white text-sm placeholder-genesis-muted focus:outline-none focus:border-genesis-copper transition-colors"
            dir="ltr"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-genesis-copper text-black py-2.5 rounded text-sm font-semibold tracking-wider uppercase hover:bg-genesis-gold transition-colors disabled:opacity-60"
          >
            {submitting
              ? (isArabic ? 'جاري الإرسال...' : 'Sending...')
              : (isArabic ? 'إرسال' : 'Send')
            }
          </button>
          <button
            type="button"
            onClick={() => onComplete?.(null)}
            className="px-4 py-2.5 border border-genesis-border rounded text-genesis-muted text-sm hover:text-genesis-silver transition-colors"
          >
            {isArabic ? 'لاحقاً' : 'Later'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
