'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, UserCheck, UserX, KeyRound } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['OWNER', 'RECIPIENT']),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function RecipientsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetUserName, setResetUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/api/users');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/api/users', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); setModalOpen(false); reset(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create user';
      toast.error(msg);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/api/users/${id}`, { isActive }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  async function submitResetPassword() {
    if (!resetUserId || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setResetSubmitting(true);
    try {
      await api.put(`/api/users/${resetUserId}/reset-password`, { password: newPassword });
      toast.success('Password reset successfully');
      setResetModalOpen(false);
      setNewPassword('');
      setResetUserId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to reset password';
      toast.error(msg);
    } finally {
      setResetSubmitting(false);
    }
  }

  function openResetModal(row: User) {
    setResetUserId(row.id);
    setResetUserName(row.name);
    setNewPassword('');
    setResetModalOpen(true);
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'RECIPIENT' },
  });

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-xs font-bold">
            {row.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (row: User) => (
      <Badge variant={row.role === 'OWNER' ? 'primary' : 'neutral'}>{row.role}</Badge>
    ) },
    { key: 'phone', header: 'Phone', render: (row: User) => row.phone || '—' },
    { key: 'createdAt', header: 'Member Since', render: (row: User) => formatDate(row.createdAt) },
    { key: 'isActive', header: 'Status', render: (row: User) => (
      <Badge variant={row.isActive ? 'success' : 'error'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
    ) },
    {
      key: 'actions',
      header: '',
      render: (row: User) => (
        <div className="flex items-center gap-1">
          {row.role === 'RECIPIENT' && (
            <button
              onClick={() => openResetModal(row)}
              className="p-1.5 text-gray-400 hover:text-primary-700 transition-colors"
              title="Reset password"
            >
              <KeyRound size={15} />
            </button>
          )}
          <button
            onClick={() => toggleActiveMutation.mutate({ id: row.id, isActive: !row.isActive })}
            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="User Management"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users' }]}
      />
      <div className="px-6 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add User
          </Button>
        </div>

        <Card>
          <Table columns={columns} data={filtered} keyField="id" isLoading={isLoading} emptyMessage="No users found." />
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title="Add New User"
        footer={
          <>
            <Button variant="outline" onClick={() => { setModalOpen(false); reset(); }}>Cancel</Button>
            <Button form="user-form" type="submit" loading={isSubmitting}>Create User</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Input label="Full Name" required error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" required hint="Minimum 8 characters" error={errors.password?.message} {...register('password')} />
          <Input label="Phone (optional)" type="tel" {...register('phone')} />
          <Select
            label="Role"
            required
            options={[{ value: 'RECIPIENT', label: 'Recipient' }, { value: 'OWNER', label: 'Owner' }]}
            error={errors.role?.message}
            {...register('role')}
          />
        </form>
      </Modal>

      <Modal
        open={resetModalOpen}
        onClose={() => { setResetModalOpen(false); setNewPassword(''); }}
        title={`Reset password — ${resetUserName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>Cancel</Button>
            <Button onClick={submitResetPassword} loading={resetSubmitting}>Reset password</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Set a new password for this recipient. They will use it on their next login.
        </p>
        <Input
          label="New password"
          type="password"
          required
          hint="Minimum 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>
    </>
  );
}
