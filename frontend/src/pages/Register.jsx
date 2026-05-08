import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusSquare, Mail, Lock, Eye, EyeOff, User, CheckCircle2, Check, UserPlus } from 'lucide-react'
import { registerSchema } from '../utils/validators'
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

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'patient' }
  })

  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    try {
      await registerUser(data)
      navigate('/dashboard')
    } catch {
      // handled by useAuth toast
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' }}>
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
            Join our network of <br />
            <span className="text-teal-200">care and excellence</span>
          </h1>
          
          <ul className="flex flex-col gap-5 text-white/90">
            <li className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-teal-300 shrink-0" />
              <span className="text-lg">Secure patient portals</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-teal-300 shrink-0" />
              <span className="text-lg">Streamlined doctor workflows</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-teal-300 shrink-0" />
              <span className="text-lg">Advanced healthcare analytics</span>
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

      {/* Right — register form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto pt-8 pb-8">
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
            <h2 className="font-display font-bold text-3xl text-[var(--text-primary)] mb-2">Create account</h2>
            <p className="text-[var(--text-secondary)]">Sign up to get started</p>
          </div>

          <motion.form variants={containerVariants} initial="hidden" animate="show" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            
            <motion.div variants={itemVariants} className="flex gap-4 p-1 bg-[var(--bg-secondary)] rounded-xl mb-2">
              <button
                type="button"
                onClick={() => register('role').onChange({ target: { value: 'patient', name: 'role' }})}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${selectedRole === 'patient' ? 'bg-white dark:bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => register('role').onChange({ target: { value: 'doctor', name: 'role' }})}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${selectedRole === 'doctor' ? 'bg-white dark:bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                Doctor
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                icon={User}
                error={errors.name?.message}
                {...register('name')}
                autoComplete="name"
              />
            </motion.div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <Input
                  label="Password"
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
                  autoComplete="new-password"
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Input
                  label="Confirm Password"
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Check}
                  error={errors.confirmPassword?.message}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((p) => !p)}
                      className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                  {...register('confirmPassword')}
                  autoComplete="new-password"
                />
              </motion.div>
            </div>

            <AnimatePresence>
              {selectedRole === 'doctor' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden flex flex-col gap-4"
                >
                  <div className="pt-2 border-t border-[var(--border)] mt-2">
                    <p className="text-xs font-semibold uppercase text-[var(--text-muted)] mb-4">Doctor Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Specialization"
                        placeholder="Cardiology"
                        error={errors.specialization?.message}
                        {...register('specialization')}
                      />
                      <Input
                        label="Years of Experience"
                        type="number"
                        placeholder="5"
                        error={errors.experience?.message}
                        {...register('experience')}
                      />
                    </div>
                    <div className="mt-4">
                      <Input
                        label="License Number"
                        placeholder="MD12345678"
                        error={errors.licenseNumber?.message}
                        {...register('licenseNumber')}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="mt-2 flex items-start gap-2">
              <input type="checkbox" id="terms" className="mt-1" required />
              <label htmlFor="terms" className="text-sm text-[var(--text-secondary)]">
                I agree to the <a href="#" className="text-[var(--accent)] hover:underline">Terms of Service</a> and <a href="#" className="text-[var(--accent)] hover:underline">Privacy Policy</a>
              </label>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-4">
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} icon={UserPlus}>
                Create Account
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-2">
              <p className="text-center text-sm text-[var(--text-secondary)]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  )
}
