'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export type PurificationRecord = {
  id: string;
  amount: number;
  currencyCode: string;
  donationDate: string;
  donatedTo: string | null;
  purpose: string | null;
  notes: string | null;
  createdAt: string;
};

export function usePurificationRecords() {
  return useQuery({
    queryKey: ['purification'],
    queryFn: async () => {
      const { data } = await api.get('/api/purification');
      return data as {
        records: PurificationRecord[];
        summary: { totalPurified: number; count: number };
      };
    },
  });
}

export function useCreatePurificationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      amount: number;
      donationDate: string;
      donatedTo?: string;
      purpose?: string;
      notes?: string;
    }) => api.post('/api/purification', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purification'] });
      toast.success('Purification record saved');
    },
    onError: () => toast.error('Failed to save record'),
  });
}

export function useDeletePurificationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/purification/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purification'] });
      toast.success('Record deleted');
    },
    onError: () => toast.error('Failed to delete record'),
  });
}
