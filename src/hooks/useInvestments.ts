'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Investment, InvestmentFormData, RepaymentFormData } from '@/types';
import toast from 'react-hot-toast';

export function useInvestments(params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['investments', params],
    queryFn: async () => {
      const { data } = await api.get(`/api/investments?${query}`);
      return data as { investments: Investment[]; total: number; page: number; totalPages: number };
    },
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/investments/${id}`);
      return data as Investment;
    },
    enabled: !!id,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InvestmentFormData) => api.post('/api/investments', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investments'] }); toast.success('Investment created'); },
    onError: () => toast.error('Failed to create investment'),
  });
}

export function useUpdateInvestment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InvestmentFormData> & { status?: string }) =>
      api.put(`/api/investments/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] });
      qc.invalidateQueries({ queryKey: ['investment', id] });
      toast.success('Investment updated');
    },
    onError: () => toast.error('Failed to update investment'),
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/investments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['investments'] }); toast.success('Investment deleted'); },
    onError: () => toast.error('Failed to delete investment'),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const { data } = await api.get('/api/investments/stats/dashboard');
      return data;
    },
  });
}

export function useRepayments(investmentId: string) {
  return useQuery({
    queryKey: ['repayments', investmentId],
    queryFn: async () => {
      const { data } = await api.get(`/api/investments/${investmentId}/repayments`);
      return data;
    },
    enabled: !!investmentId,
  });
}

export function useCreateRepayment(investmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RepaymentFormData | FormData) =>
      api.post(`/api/investments/${investmentId}/repayments`, data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repayments', investmentId] });
      qc.invalidateQueries({ queryKey: ['investment', investmentId] });
      qc.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Repayment recorded');
    },
    onError: () => toast.error('Failed to record repayment'),
  });
}

export function useDeleteRepayment(investmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/investments/${investmentId}/repayments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repayments', investmentId] });
      qc.invalidateQueries({ queryKey: ['investment', investmentId] });
      toast.success('Repayment deleted');
    },
    onError: () => toast.error('Failed to delete repayment'),
  });
}
