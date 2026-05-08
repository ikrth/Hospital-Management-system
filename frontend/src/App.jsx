import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import DoctorList from './pages/DoctorList'
import PatientList from './pages/PatientList'
import AITriage from './pages/AITriage'
import Therapy from './pages/Therapy'
import PatientProfile from './pages/PatientProfile'
import MedicalRecords from './pages/MedicalRecords'
import RecordDetail from './pages/RecordDetail'
import Notifications from './pages/Notifications'
import UserManagement from './pages/UserManagement'
import DoctorScheduleManager from './pages/DoctorScheduleManager'
/** Wraps a route that requires authentication. Optionally restricts by role. */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  // Wait for user object to hydrate before checking roles
  if (isAuthenticated && !user) return null 

  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />

  return children
}

/** Redirects already-authenticated users away from login/register */
const PublicOnly = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { isAuthenticated } = useAuthStore()
  
  // Call useAuth to trigger the token rehydration effect
  useAuth()

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />

      {/* Public routes */}
      <Route path="/login"    element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/reset-password/:token" element={<PublicOnly><ResetPassword /></PublicOnly>} />

      {/* Protected routes — all wrapped by AppLayout */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments mode="list" />} />
        <Route path="/appointments/new" element={<Appointments mode="new" />} />
        <Route path="/doctors"      element={<DoctorList />} />
        
        {/* Role-restricted routes inside the layout */}
        <Route path="/patients"     element={<ProtectedRoute roles={['admin', 'receptionist', 'doctor']}><PatientList /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/records"      element={<ProtectedRoute roles={['patient', 'doctor', 'admin']}><MedicalRecords /></ProtectedRoute>} />
        <Route path="/records/:id"  element={<ProtectedRoute roles={['patient', 'doctor', 'admin']}><RecordDetail /></ProtectedRoute>} />
        <Route path="/ai/triage"    element={<ProtectedRoute roles={['patient', 'receptionist']}><AITriage /></ProtectedRoute>} />
        <Route path="/ai/therapy"   element={<ProtectedRoute roles={['patient']}><Therapy /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute roles={['patient']}><PatientProfile /></ProtectedRoute>} />
        <Route path="/admin/users"  element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/schedules" element={<ProtectedRoute roles={['admin', 'receptionist']}><DoctorScheduleManager /></ProtectedRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
