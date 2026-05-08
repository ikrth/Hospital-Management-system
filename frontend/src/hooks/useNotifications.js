import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../api/notifications'

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await getUnreadCount()
      return res.data?.data?.count ?? res.data?.count ?? 0
    },
    refetchInterval: 10000, // Poll every 10s for better responsiveness
  })
}

export const useNotifications = (filters = {}) => {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => getNotifications(filters),
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
