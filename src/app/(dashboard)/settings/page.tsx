'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getUsdRate, setUsdRate, formatDate } from '@/lib/utils';
import Image from 'next/image';

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface AuditLogRow {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  details: unknown;
  createdAt: string;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'system'>('profile');
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [usdRate, setUsdRateState] = useState('2.6');
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsdRateState(String(getUsdRate()));
  }, []);

  const {
    register: rProfile, handleSubmit: hsProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  const {
    register: rPass, handleSubmit: hsPass, reset: resetPass,
    formState: { errors: passErrors, isSubmitting: passSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<AuditLogRow[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await api.get('/api/audit-logs?limit=50');
      return data;
    },
    enabled: user?.role === 'OWNER' && activeSection === 'system',
  });

  async function onProfileSubmit(data: ProfileForm) {
    const { data: updated } = await api.put('/api/auth/me', data);
    refreshUser(updated);
    toast.success('Profile updated');
  }

  async function onPhotoUpload() {
    const file = photoRef.current?.files?.[0];
    if (!file) {
      toast.error('Choose an image first');
      return;
    }
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data: updated } = await api.post('/api/auth/me/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refreshUser(updated);
      toast.success('Profile photo updated');
      if (photoRef.current) photoRef.current.value = '';
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setPhotoUploading(false);
    }
  }

  function saveUsdRate() {
    const n = parseFloat(usdRate);
    if (isNaN(n) || n <= 0) {
      toast.error('Enter a valid exchange rate');
      return;
    }
    setUsdRate(n);
    toast.success('USD rate saved for this browser');
  }

  async function onPasswordSubmit(data: PasswordForm) {
    await api.put('/api/auth/me/password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    toast.success('Password changed successfully');
    resetPass();
  }

  async function runNotificationCheck() {
    setCronRunning(true);
    setCronResult(null);
    try {
      const { data } = await api.post('/api/notifications/run-check');
      setCronResult(`Due reminders: ${data.dueReminders}, overdue alerts: ${data.overdueAlerts}, marked defaulted: ${data.defaulted}`);
      toast.success('Notification check completed');
    } catch {
      toast.error('Notification check failed');
    } finally {
      setCronRunning(false);
    }
  }

  type SectionId = 'profile' | 'password' | 'system';
  const sections: { id: SectionId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Change Password' },
    ...(user?.role === 'OWNER' ? [{ id: 'system' as const, label: 'System' }] : []),
  ];

  return (
    <>
      <Header
        title="Settings"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
      />
      <div className="px-6 py-6 flex gap-6">
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? 'bg-primary-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 max-w-2xl space-y-6">
          {activeSection === 'profile' && (
            <Card>
              <CardHeader title="Profile Information" />
              <CardBody>
                <form onSubmit={hsProfile(onProfileSubmit)} className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    {user?.photoUrl ? (
                      <Image
                        src={user.photoUrl}
                        alt={user.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-800">
                        {user?.name?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          ref={photoRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="text-xs text-gray-500"
                        />
                        <Button type="button" size="sm" variant="outline" onClick={onPhotoUpload} loading={photoUploading}>
                          Upload photo
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Input label="Full Name" required error={profileErrors.name?.message} {...rProfile('name')} />
                  <Input label="Phone Number" type="tel" {...rProfile('phone')} />
                  <Input label="Email Address" type="email" value={user?.email || ''} readOnly className="bg-gray-50" hint="Email cannot be changed" />
                  <Button type="submit" loading={profileSubmitting}>Save Changes</Button>
                </form>
              </CardBody>
            </Card>
          )}

          {activeSection === 'password' && (
            <Card>
              <CardHeader title="Change Password" />
              <CardBody>
                <form onSubmit={hsPass(onPasswordSubmit)} className="space-y-4">
                  <Input label="Current Password" type="password" required error={passErrors.currentPassword?.message} {...rPass('currentPassword')} />
                  <Input label="New Password" type="password" required hint="Minimum 8 characters" error={passErrors.newPassword?.message} {...rPass('newPassword')} />
                  <Input label="Confirm New Password" type="password" required error={passErrors.confirmPassword?.message} {...rPass('confirmPassword')} />
                  <Button type="submit" loading={passSubmitting}>Change Password</Button>
                </form>
              </CardBody>
            </Card>
          )}

          {activeSection === 'system' && user?.role === 'OWNER' && (
            <>
              <Card>
                <CardHeader title="Currency Display" subtitle="OMR is primary; USD is shown as reference" />
                <CardBody className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Primary currency</span>
                    <span className="font-semibold text-primary-800">OMR — Omani Rial</span>
                  </div>
                  <div className="flex gap-3 items-end">
                    <Input
                      label="OMR → USD rate"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={usdRate}
                      onChange={(e) => setUsdRateState(e.target.value)}
                      hint="Used for ≈ USD amounts across the app (saved in this browser)"
                    />
                    <Button type="button" onClick={saveUsdRate}>Save rate</Button>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Automated Notifications" />
                <CardBody className="space-y-3">
                  <p className="text-xs text-gray-600">
                    Schedule a daily POST to <code className="bg-gray-100 px-1 rounded">/api/cron/notifications</code> with
                    header <code className="bg-gray-100 px-1 rounded">Authorization: Bearer CRON_SECRET</code>.
                  </p>
                  <Button size="sm" variant="outline" onClick={runNotificationCheck} loading={cronRunning}>
                    Run notification check now
                  </Button>
                  {cronResult && <p className="text-xs text-gray-600">{cronResult}</p>}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Audit Log" subtitle="Recent system activity (last 50)" />
                <CardBody className="p-0">
                  {auditLoading ? (
                    <p className="p-4 text-sm text-gray-400">Loading…</p>
                  ) : auditLogs.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400">No audit entries yet.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="min-w-full text-xs data-table">
                        <thead>
                          <tr>
                            <th>When</th>
                            <th>Action</th>
                            <th>Entity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="whitespace-nowrap">{formatDate(log.createdAt, true)}</td>
                              <td>{log.action}</td>
                              <td className="text-gray-500">{log.entity}{log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
