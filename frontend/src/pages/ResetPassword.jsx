import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Button, Input, Card } from '../components/common'

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetSchema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, {
        password: data.password
      })
      setSuccess(true)
      toast.success('Password reset successful')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)]">
        <Card className="w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-4">Password updated</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Your password has been successfully reset. Redirecting you to the login page...
          </p>
          <Link to="/login">
            <Button variant="primary" className="w-full">Sign In Now</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Set new password</h2>
        <p className="text-[var(--text-secondary)] mb-8">Choose a secure password you haven't used before.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="relative">
            <Input
              label="New Password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              {...register('password')}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          <Input
            label="Confirm New Password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            icon={Lock}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}
