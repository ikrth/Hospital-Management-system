import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Calendar, CheckCircle, Users, FileText, Brain, Heart, Stethoscope,
  Clock, AlertTriangle, UserCheck, Eye, RefreshCw, TrendingUp, Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { getAppointments, updateAppointmentStatus } from '../api/appointments'
import { getAdminStats, getDoctorStats } from '../api/analytics'
import { Button, Card, Badge, Modal, Skeleton, priorityVariant, statusVariant } from '../components/common'
import CreateRecordModal from '../components/records/CreateRecordModal'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts'

/* ─── Animation Variants ────────────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

/* ─── Helper Components ─────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <motion.div variants={itemVariants}>
      <Card padding="md" hover className="h-full flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `var(--accent-light, rgba(13, 148, 136, 0.1))` }}
        >
          <Icon size={24} style={{ color: `var(--accent, #0D9488)` }} />
        </div>
        <div>
          {loading ? (
            <Skeleton variant="text" className="w-16 h-8 mb-1" />
          ) : (
            <p className="text-3xl font-display font-bold text-[var(--text-primary)]">
              {value ?? '0'}
            </p>
          )}
          <p className="text-sm text-[var(--text-secondary)] font-medium">{label}</p>
        </div>
      </Card>
    </motion.div>
  )
}

/* ─── PATIENT DASHBOARD ─────────────────────────────────────────────────── */
function PatientDashboard({ user }) {
  const { data: upcomingData, isLoading } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => getAppointments({ status: 'confirmed', limit: 3, sort: 'date' }),
  })

  const upcomingAppointments = upcomingData?.data?.data || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Here's what's happening with your health</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm font-medium text-[var(--accent)] hover:underline">View All</Link>
          </div>
          
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
                  <Calendar size={32} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-secondary)]">No upcoming appointments</p>
                <Link to="/appointments/new"><Button variant="primary">Book Appointment</Button></Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {upcomingAppointments.map((appt) => (
                  <div key={appt._id} className="p-5 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center font-bold">
                        {appt.doctor?.user?.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold">Dr. {appt.doctor?.user?.name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(appt.status)}>{appt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <Link to="/ai/triage">
            <Card hover className="p-5 border-l-4 border-l-[var(--accent)] bg-teal-50/20 dark:bg-teal-900/10">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-[var(--accent)] text-white rounded-lg"><Brain size={20} /></div>
                <div>
                  <h4 className="font-bold text-sm">AI Symptom Triage</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Check symptoms and get recommendations</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to="/records">
            <Card hover className="p-5 border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-900/10">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500 text-white rounded-lg"><FileText size={20} /></div>
                <div>
                  <h4 className="font-bold text-sm">Medical Records</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">View your prescriptions and lab results</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── DOCTOR DASHBOARD ──────────────────────────────────────────────────── */
function DoctorDashboard({ user }) {
  const { data: stats, isLoading: loadStats } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: () => getDoctorStats(),
  })

  const { data: appts, isLoading: loadAppts } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => getAppointments({ date: new Date().toISOString().split('T')[0] }),
  })

  const summary = stats?.data || {}
  const todaysAppointments = appts?.data?.data || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-3xl font-bold">Good day, Dr. {user?.name?.split(' ')[0]} 🩺</h1>
        <p className="text-[var(--text-secondary)] mt-1">You have {todaysAppointments.length} appointments scheduled for today.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Patients" value={todaysAppointments.length} icon={Users} loading={loadAppts} />
        <StatCard label="Upcoming" value={summary.upcomingAppointments} icon={Calendar} loading={loadStats} />
        <StatCard label="Total Records" value={summary.totalRecords} icon={FileText} loading={loadStats} />
        <StatCard label="Completion Rate" value="94%" icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Patient Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.statusDistribution || []}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {(summary.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0D9488', '#0EA5E9', '#F59E0B', '#EF4444'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Today's Schedule</h2>
          <div className="space-y-4">
            {todaysAppointments.length === 0 ? (
              <p className="text-center py-8 text-[var(--text-muted)] italic">No appointments today</p>
            ) : (
              todaysAppointments.map((appt) => (
                <div key={appt._id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-[var(--accent)] w-12">{appt.timeSlot}</div>
                    <span className="font-semibold text-sm">{appt.patient?.user?.name}</span>
                  </div>
                  <Badge variant={priorityVariant(appt.priorityLevel)} size="sm">{appt.priorityLevel}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

/* ─── ADMIN DASHBOARD ──────────────────────────────────────────────────── */
function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => getAdminStats(),
  })

  const data = stats?.data || {}
  const chartData = (data.monthlyAppointments || []).map(m => ({
    name: new Date(2000, m._id.month - 1).toLocaleString('default', { month: 'short' }),
    count: m.count
  }))

  const priorityData = (data.priorityDistribution || []).map(p => ({
    name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
    count: p.count
  }))

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-8">
      <motion.div variants={itemVariants}>
        <h1 className="font-display text-3xl font-bold">Hospital Overview 🏥</h1>
        <p className="text-[var(--text-secondary)] mt-1">Real-time system health and analytics</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={data.summary?.totalPatients} icon={Users} loading={isLoading} />
        <StatCard label="Total Doctors" value={data.summary?.totalDoctors} icon={Stethoscope} loading={isLoading} />
        <StatCard label="Appointments" value={data.summary?.totalAppointments} icon={Calendar} loading={isLoading} />
        <StatCard label="Med Records" value={data.summary?.totalRecords} icon={FileText} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Appointment Trends</h2>
            <Badge variant="teal" icon={TrendingUp}>+12.5%</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-muted)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-muted)'}} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-8">Urgency Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-muted)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-muted)'}} />
                <Tooltip 
                  cursor={{fill: 'var(--bg-secondary)'}}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

/* ─── MAIN EXPORT ───────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuthStore()
  const role = user?.role

  if (role === 'patient') return <PatientDashboard user={user} />
  if (role === 'doctor') return <DoctorDashboard user={user} />
  if (role === 'admin' || role === 'receptionist') return <AdminDashboard />

  return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw className="animate-spin text-[var(--accent)]" size={40} />
    </div>
  )
}
