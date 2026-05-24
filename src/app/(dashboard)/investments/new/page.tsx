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
  lossHandlingNotes: z.string().min(10, 'Loss handling notes are required'),
  lossHandlingAcknowledged: z.boolean().refine((value) => value, 'Please acknowledge the loss handling rule'),
}).refine((d) => Number(d.ownerProfitRatio) + Number(d.recipientProfitRatio) === 100, {
  message: 'Owner and recipient ratios must sum to 100',
  path: ['recipientProfitRatio'],
});

type FormData = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { value: 'MUDARABAH', label: 'Mudarabah - Profit Sharing' },
  { value: 'MUSHARAKAH', label: 'Musharakah - Partnership' },
  { value: 'QARD_HASSAN', label: 'Qard Hassan - Interest-Free Loan' },
  { value: 'MURABAHAH', label: 'Murabahah - Cost-Plus Sale' },
];

const LOSS_RULES = {
  MUDARABAH: 'Losses are borne by the owner unless caused by recipient negligence or breach.',
  MUSHARAKAH: 'Losses are shared according to capital contribution and agreed partnership terms.',
  QARD_HASSAN: 'Only the principal is repaid. No profit, interest, or extra benefit is charged.',
  MURABAHAH: 'The sale price is fixed upfront. Installment obligations follow the agreed sale contract.',
} as const;

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
    defaultValues: {
      ownerProfitRatio: 70,
      recipientProfitRatio: 30,
      lossHandlingAcknowledged: false,
      lossHandlingNotes: LOSS_RULES.MUDARABAH,
    },
  });

  const ownerRatio = watch('ownerProfitRatio');
  const selectedType = watch('type') || 'MUDARABAH';
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
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
          <Card className="self-start">
            <CardHeader title="Investment Details" subtitle="Basic information about the investment deal" />
            <CardBody>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input label="Investment Title" placeholder="e.g. Retail Trade - Ahmed Al-Siyabi" required error={errors.title?.message} {...register('title')} />
                </div>
                <Select
                  label="Recipient"
                  options={recipientOptions}
                  placeholder="Select a recipient..."
                  compact
                  required
                  error={errors.recipientId?.message}
                  {...register('recipientId')}
                />
                <Select
                  label="Islamic Contract Type"
                  options={TYPE_OPTIONS}
                  compact
                  required
                  error={errors.type?.message}
                  {...register('type', {
                    onChange: (e) => {
                      setValue('lossHandlingNotes', LOSS_RULES[e.target.value as keyof typeof LOSS_RULES]);
                    },
                  })}
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
                <Input
                  label="Next Repayment Date"
                  type="date"
                  error={errors.nextRepaymentDate?.message}
                  {...register('nextRepaymentDate')}
                />
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
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Profit-Sharing Ratio" subtitle="Must total 100%" />
              <CardBody>
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                  <p className="mb-3 text-xs font-medium text-primary-700">
                    Profit sharing is based on actual profit - no interest (riba) applies.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-primary-700 transition-all"
                      style={{ width: `${ownerRatio || 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-xs text-gray-500">
                    Owner: {ownerRatio || 0}% - Recipient: {100 - (ownerRatio || 0)}%
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Additional Information" />
              <CardBody className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">Loss Handling Rule</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">{LOSS_RULES[selectedType]}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Agreed Loss Handling Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                    {...register('lossHandlingNotes')}
                  />
                  {errors.lossHandlingNotes && <p className="text-xs text-red-600">{errors.lossHandlingNotes.message}</p>}
                </div>
                <label className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-600"
                    {...register('lossHandlingAcknowledged')}
                  />
                  <span>
                    I confirm the parties have agreed to the loss handling rule for this Islamic contract.
                    {errors.lossHandlingAcknowledged && (
                      <span className="mt-1 block text-xs text-red-600">{errors.lossHandlingAcknowledged.message}</span>
                    )}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Purpose / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the purpose of this investment..."
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                    {...register('purpose')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Terms & Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any additional terms or notes..."
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                    {...register('notes')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Shariah Advisor Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Comments from Shariah advisor, if applicable..."
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                    {...register('shariaAdvisorNotes')}
                  />
                </div>
              </CardBody>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Create Investment</Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
