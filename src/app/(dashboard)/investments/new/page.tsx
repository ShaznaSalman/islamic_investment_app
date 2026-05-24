'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Header from '@/components/layout/Header';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useCreateInvestment } from '@/hooks/useInvestments';
import { User } from '@/types';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  recipientId: z.string().min(1, 'Please select a recipient'),
  type: z.enum(['MUDARABAH', 'MUSHARAKAH', 'QARD_HASSAN', 'MURABAHAH']),
  principalAmount: z.coerce.number().positive('Amount must be positive'),
  ownerProfitRatio: z.coerce.number().min(0).max(100),
  recipientProfitRatio: z.coerce.number().min(0).max(100),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  shariaAdvisorNotes: z.string().optional(),
  nextRepaymentDate: z.string().optional(),
}).refine((d) => Number(d.ownerProfitRatio) + Number(d.recipientProfitRatio) === 100, {
  message: 'Owner and recipient ratios must sum to 100',
  path: ['recipientProfitRatio'],
});

type FormData = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { value: 'MUDARABAH', label: 'Mudarabah — Profit Sharing' },
  { value: 'MUSHARAKAH', label: 'Musharakah — Partnership' },
  { value: 'QARD_HASSAN', label: 'Qard Hassan — Interest-Free Loan' },
  { value: 'MURABAHAH', label: 'Murabahah — Cost-Plus Sale' },
];

export default function NewInvestmentPage() {
  const router = useRouter();
  const createMutation = useCreateInvestment();

  const { data: usersData } = useQuery({
    queryKey: ['users', 'RECIPIENT'],
    queryFn: async () => {
      const { data } = await api.get('/api/users?role=RECIPIENT');
      return data as User[];
    },
  });

  const recipientOptions = (usersData || []).map((u) => ({ value: u.id, label: u.name }));

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ownerProfitRatio: 70, recipientProfitRatio: 30 },
  });

  const ownerRatio = watch('ownerProfitRatio');
  function handleOwnerRatioChange(val: number) {
    setValue('ownerProfitRatio', val);
    setValue('recipientProfitRatio', 100 - val);
  }

  async function onSubmit(data: FormData) {
    await createMutation.mutateAsync(data);
    router.push('/investments');
  }

  return (
    <>
      <Header
        title="New Investment"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Investments', href: '/investments' },
          { label: 'New' },
        ]}
      />
      <div className="px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
          <Card>
            <CardHeader title="Investment Details" subtitle="Basic information about the investment deal" />
            <CardBody className="space-y-4">
              <Input label="Investment Title" placeholder="e.g. Retail Trade — Ahmed Al-Siyabi" required error={errors.title?.message} {...register('title')} />
              <Select
                label="Recipient"
                options={recipientOptions}
                placeholder="Select a recipient…"
                required
                error={errors.recipientId?.message}
                {...register('recipientId')}
              />
              <Select
                label="Islamic Contract Type"
                options={TYPE_OPTIONS}
                required
                error={errors.type?.message}
                {...register('type')}
              />
              <Input
                label="Principal Amount"
                type="number"
                step="0.001"
                min="0"
                leftAddon="OMR"
                required
                error={errors.principalAmount?.message}
                {...register('principalAmount')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  required
                  error={errors.startDate?.message}
                  {...register('startDate')}
                />
                <Input
                  label="End Date (optional)"
                  type="date"
                  error={errors.endDate?.message}
                  {...register('endDate')}
                />
              </div>
              <Input
                label="Next Repayment Date"
                type="date"
                error={errors.nextRepaymentDate?.message}
                {...register('nextRepaymentDate')}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Profit-Sharing Ratio" subtitle="Agreed split between owner and recipient (must total 100%)" />
            <CardBody className="space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-xs text-primary-700 font-medium mb-3">
                  Profit sharing is based on actual profit — no interest (riba) applies.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Owner's Ratio (%)"
                    type="number"
                    min="0"
                    max="100"
                    required
                    error={errors.ownerProfitRatio?.message}
                    {...register('ownerProfitRatio', {
                      onChange: (e) => handleOwnerRatioChange(Number(e.target.value)),
                    })}
                  />
                  <Input
                    label="Recipient's Ratio (%)"
                    type="number"
                    min="0"
                    max="100"
                    required
                    error={errors.recipientProfitRatio?.message}
                    {...register('recipientProfitRatio')}
                  />
                </div>
                <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-700 transition-all"
                    style={{ width: `${ownerRatio || 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Owner: {ownerRatio || 0}% · Recipient: {100 - (ownerRatio || 0)}%
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Additional Information" />
            <CardBody className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Purpose / Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the purpose of this investment…"
                  className="block w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  {...register('purpose')}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Terms & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any additional terms or notes…"
                  className="block w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  {...register('notes')}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Shariah Advisor Notes</label>
                <textarea
                  rows={2}
                  placeholder="Comments from Shariah advisor, if applicable…"
                  className="block w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  {...register('shariaAdvisorNotes')}
                />
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Investment</Button>
          </div>
        </form>
      </div>
    </>
  );
}
