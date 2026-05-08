import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { Button, Input, Card } from '../components/common'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)]">
        <Card className="w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-4">Check your email</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            We've sent password reset instructions to <strong>{email}</strong>. 
            If it doesn't arrive soon, check your spam folder.
          </p>
          <Link to="/login">
            <Button variant="primary" className="w-full">Return to login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Forgot password?</h2>
        <p className="text-[var(--text-secondary)] mb-8">No worries, we'll send you reset instructions.</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
            Reset password
          </Button>
        </form>
      </div>
    </div>
  )
}
