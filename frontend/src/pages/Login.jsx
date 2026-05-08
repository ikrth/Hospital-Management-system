import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Activity, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, PlusSquare } from 'lucide-react'
import { loginSchema } from '../utils/validators'
import { useAuth } from '../hooks/useAuth'
import { Button, Input } from '../components/common'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data) => {
    setLoginError('')
    try {
      await login(data)
      navigate('/dashboard')
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || 'Failed to login')
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)' }}>
        {/* Background decorative circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
              <PlusSquare size={64} className="text-white" />
            </div>
            <span className="font-display font-bold text-[48px] text-white">MediCare</span>
          </div>

          <h1 className="text-white text-5xl font-display font-bold leading-tight mb-6">
            Your health, <br />
            <span className="text-indigo-200">intelligently managed</span>
          </h1>
          
          <ul className="flex flex-col gap-5 text-white/90">
            <li className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-indigo-300 shrink-0" />
              <span className="text-lg">AI-powered symptom triage</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-indigo-300 shrink-0" />
              <span className="text-lg">24/7 therapy support</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-indigo-300 shrink-0" />
              <span className="text-lg">Instant appointment booking</span>
            </li>
          </ul>
        </div>

        <div className="relative z-10 flex gap-3 text-white/60 text-sm font-medium">
          <span>Admin</span>
          <span>•</span>
          <span>Doctor</span>
          <span>•</span>
          <span>Patient</span>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent)]">
              <PlusSquare size={24} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-[var(--text-primary)]">
              MediCare
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-[var(--text-primary)] mb-2">Welcome back</h2>
            <p className="text-[var(--text-secondary)]">Sign in to your account</p>
          </div>

          {loginError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="text-red-500 shrink-0" />
              <p className="text-red-700 dark:text-red-400 font-medium text-sm">{loginError}</p>
            </motion.div>
          )}

          <motion.form variants={containerVariants} initial="hidden" animate="show" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <motion.div variants={itemVariants}>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
                autoComplete="email"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-[var(--accent)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                {...register('password')}
                autoComplete="current-password"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="mt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                Sign In
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <span className="relative px-4 text-xs font-medium uppercase text-[var(--text-muted)] bg-[var(--bg-primary)]">
                Or
              </span>
            </motion.div>

            <motion.div variants={itemVariants}>
              <p className="text-center text-sm text-[var(--text-secondary)]">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
                  Register
                </Link>
              </p>
            </motion.div>
          </motion.form>

          {/* Demo credentials hint */}
          <div className="mt-10 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm">
            <p className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
              <Activity size={16} className="text-[var(--text-muted)]" />
              Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-[var(--text-secondary)]">
              <div>Admin:</div><div className="font-mono text-xs">admin@hospital.com / Admin@123</div>
              <div>Doctor:</div><div className="font-mono text-xs">dr.ahmed@hospital.com / Doctor@123</div>
              <div>Patient:</div><div className="font-mono text-xs">ali@patient.com / Patient@123</div>
              <div>Reception:</div><div className="font-mono text-xs">reception@hospital.com / Reception@123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
