'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: async () => {
      const { data } = await api.get(`/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
      return data as { notifications: unknown[]; unreadCount: number };
    },
    refetchInterval: 60_000, // poll every 60s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/api/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/api/notifications/read-all'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); },
  });
}
