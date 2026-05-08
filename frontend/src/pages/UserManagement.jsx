import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUser, deleteUser } from '../api/users'
import { 
  Users, 
  Search, 
  Shield, 
  User as UserIcon, 
  Stethoscope, 
  MoreVertical,
  UserX,
  UserCheck,
  Trash2,
  Filter
} from 'lucide-react'
import { Card, Button, Input, Badge, Skeleton, Select } from '../components/common'
import { useDebounce } from '../hooks/useDebounce'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebounce(query, 300)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, debouncedQuery, role],
    queryFn: () => getUsers({ page, limit: 10, q: debouncedQuery, role }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user')
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user')
  })

  const users = data?.data?.data?.users || data?.data?.users || []
  const meta  = data?.data?.data?.meta  || data?.data?.meta  || {}

  const handleStatusToggle = (user) => {
    updateMutation.mutate({ 
      id: user._id, 
      data: { isActive: !user.isActive } 
    })
  }

  const handleRoleChange = (id, newRole) => {
    updateMutation.mutate({ 
      id, 
      data: { role: newRole } 
    })
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Shield className="text-[var(--accent)]" /> User Management
          </h2>
          <p className="text-[var(--text-secondary)]">Manage system access, roles, and account status</p>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-center bg-[var(--bg-secondary)]/50">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input 
            className="pl-10" 
            placeholder="Search name or email..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select 
          className="w-48"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[
            { label: 'All Roles', value: '' },
            { label: 'Admin', value: 'admin' },
            { label: 'Doctor', value: 'doctor' },
            { label: 'Patient', value: 'patient' },
            { label: 'Receptionist', value: 'receptionist' },
          ]}
        />
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">User</th>
              <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Role</th>
              <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase">Joined</th>
              <th className="p-4 text-xs font-bold text-[var(--text-muted)] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center text-[var(--text-muted)]">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center font-bold">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-[var(--text-primary)]">{u.name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <select 
                    value={u.role} 
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="bg-transparent text-xs font-bold border-none focus:ring-0 cursor-pointer text-[var(--text-primary)]"
                  >
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </td>
                <td className="p-4">
                  <Badge variant={u.isActive ? 'teal' : 'red'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="p-4 text-xs text-[var(--text-secondary)]">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleStatusToggle(u)}
                      icon={u.isActive ? UserX : UserCheck}
                      className={u.isActive ? "text-orange-500" : "text-green-500"}
                      title={u.isActive ? "Deactivate" : "Activate"}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (confirm('Delete this user permanently?')) deleteMutation.mutate(u._id)
                      }}
                      icon={Trash2}
                      className="text-red-500"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-xs font-bold px-4">Page {page} of {meta.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
