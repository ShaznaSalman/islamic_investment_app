'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type SystemSettings = {
  primaryCurrency: 'OMR';
  secondaryCurrency: 'USD';
  omrToUsdRate: number;
  showUsdEquivalent: boolean;
};

export type NotificationPreferences = {
  inAppDueReminders: boolean;
  inAppOverdueAlerts: boolean;
  inAppAssignments: boolean;
  inAppCompletions: boolean;
  emailReminders: boolean;
};

export const defaultSystemSettings: SystemSettings = {
  primaryCurrency: 'OMR',
  secondaryCurrency: 'USD',
  omrToUsdRate: 2.6,
  showUsdEquivalent: true,
};

export const defaultNotificationPreferences: NotificationPreferences = {
  inAppDueReminders: true,
  inAppOverdueAlerts: true,
  inAppAssignments: true,
  inAppCompletions: true,
  emailReminders: true,
};

export function useSystemSettings() {
  return useQuery<SystemSettings>({
    queryKey: ['settings', 'system'],
    queryFn: async () => {
      const { data } = await api.get('/api/settings/system');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: defaultSystemSettings,
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      const { data } = await api.put('/api/settings/system', settings);
      return data as SystemSettings;
    },
    onSuccess: (data) => {
      qc.setQueryData(['settings', 'system'], data);
      qc.invalidateQueries({ queryKey: ['settings', 'system'] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: ['settings', 'preferences', 'notifications'],
    queryFn: async () => {
      const { data } = await api.get('/api/settings/preferences');
      return data.notifications;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: defaultNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notifications: NotificationPreferences) => {
      const { data } = await api.put('/api/settings/preferences', { notifications });
      return data.notifications as NotificationPreferences;
    },
    onSuccess: (data) => {
      qc.setQueryData(['settings', 'preferences', 'notifications'], data);
      qc.invalidateQueries({ queryKey: ['settings', 'preferences', 'notifications'] });
    },
  });
}
