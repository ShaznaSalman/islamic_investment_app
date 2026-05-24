'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInvestment, useUpdateInvestment, useRepayments, useCreateRepayment, useDeleteRepayment } from '@/hooks/useInvestments';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import CurrencyAmount from '@/components/ui/CurrencyAmount';
import {
  formatDate, investmentStatusLabels, investmentTypeLabels,
  calculateOutstanding, repaymentProgress, isOverdue,
} from '@/lib/utils';
import { Repayment, InvestmentStatus } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Plus, FileText } from 'lucide-react';

const repaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  principalPortion: z.coerce.number().min(0),
  profitPortion: z.coerce.number().min(0),
  paymentDate: z.string().min(1),
  notes: z.string().optional(),
});
type RepaymentForm = z.infer<typeof repaymentSchema>;

const STATUS_OPTIONS: { value: InvestmentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DEFAULTED', label: 'Defaulted' },
];

export default function InvestmentDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  const { data: investment, isLoading } = useInvestment(id);
  const { data: repayments = [] } = useRepayments(id);
  const updateMutation = useUpdateInvestment(id);
  const createRepaymentMutation = useCreateRepayment(id);
  const deleteRepaymentMutation = useDeleteRepayment(id);

  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const receiptRef = useRef<HTMLInputElement>(null);

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<RepaymentForm>({ resolver: zodResolver(repaymentSchema) });

  async function onRepaymentSubmit(data: RepaymentForm) {
    const fd = new FormData();
    fd.append('amount', String(data.amount));
    fd.append('principalPortion', String(data.principalPortion));
    fd.append('profitPortion', String(data.profitPortion));
    fd.append('paymentDate', data.paymentDate);
    if (data.notes) fd.append('notes', data.notes);
    const receipt = receiptRef.current?.files?.[0];
    if (receipt) fd.append('receipt', receipt);
    await createRepaymentMutation.mutateAsync(fd);
    setRepayModalOpen(false);
    reset();
    if (receiptRef.current) receiptRef.current.value = '';
  }

  if (isLoading) {
    return (
      <>
        <Header title="Investment Detail" />
        <div className="px-6 py-10 text-center text-gray-400">Loading…</div>
      </>
    );
  }

  if (!investment) {
    return (
      <>
        <Header title="Not Found" />
        <div className="px-6 py-10 text-center text-gray-400">Investment not found.</div>
      </>
    );
  }

  const outstanding = calculateOutstanding(Number(investment.principalAmount), Number(investment.totalRepaid));
  const progress = repaymentProgress(Number(investment.principalAmount), Number(investment.totalRepaid));
  const overdue = isOverdue(investment.nextRepaymentDate);

  const statusBadgeVariant = (s: InvestmentStatus) =>
    s === 'ACTIVE' ? 'success' : s === 'COMPLETED' ? 'info' : s === 'DEFAULTED' ? 'error' : 'warning';

  return (
    <>
      <Header
        title={investment.title}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Investments', href: '/investments' },
          { label: investment.title },
        ]}
      />
      <div className="space-y-6 px-4 py-4 sm:px-6 sm:py-6">
        {/* Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Investment Overview"
              action={
                user?.role === 'OWNER' && (
                  <Select
                    options={STATUS_OPTIONS}
                    value={investment.status}
                    onChange={(e) => updateMutation.mutate({ status: e.target.value as InvestmentStatus })}
                    className="w-full sm:w-36"
                  />
                )
              }
            />
            <CardBody>
              <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Recipient</p>
                  <p className="font-medium">{investment.recipient?.name}</p>
                  <p className="text-xs text-gray-400">{investment.recipient?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Contract Type</p>
                  <p className="font-medium">{investmentTypeLabels[investment.type]}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Principal Amount</p>
                  <p className="text-lg font-bold text-primary-800">
                    <CurrencyAmount amount={investment.principalAmount} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Profit Split</p>
                  <p className="font-semibold">{investment.ownerProfitRatio}% Owner / {investment.recipientProfitRatio}% Recipient</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Start Date</p>
                  <p className="font-medium">{formatDate(investment.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">End Date</p>
                  <p className="font-medium">{formatDate(investment.endDate)}</p>
                </div>
                {investment.purpose && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-400">Purpose</p>
                    <p className="font-medium">{investment.purpose}</p>
                  </div>
                )}
                {investment.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-400">Notes</p>
                    <p className="text-gray-600">{investment.notes}</p>
                  </div>
                )}
                {investment.shariaAdvisorNotes && (
                  <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 sm:col-span-2">
                    <p className="text-xs text-primary-600 font-medium">Shariah Advisor Notes</p>
                    <p className="text-sm text-primary-800 mt-1">{investment.shariaAdvisorNotes}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Repayment progress */}
          <div className="space-y-4">
            <Card>
              <CardBody>
                <p className="text-xs text-gray-400 mb-1">Repayment Progress</p>
                <p className="text-2xl font-bold text-primary-800">{progress.toFixed(0)}%</p>
                <div className="h-2.5 bg-gray-100 rounded-full mt-2">
                  <div
                    className="h-full bg-primary-700 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Repaid</span>
                    <span className="font-semibold"><CurrencyAmount amount={investment.totalRepaid} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Outstanding</span>
                    <span className="font-semibold text-red-600"><CurrencyAmount amount={outstanding} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profit Received</span>
                    <span className="font-semibold text-primary-700"><CurrencyAmount amount={investment.totalProfitReceived} /></span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {investment.nextRepaymentDate && (
              <Card>
                <CardBody>
                  <p className="text-xs text-gray-400">Next Repayment Due</p>
                  <p className={`font-bold mt-1 ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(investment.nextRepaymentDate)}
                  </p>
                  {overdue && (
                    <p className="text-xs text-red-500 mt-1">⚠ Overdue</p>
                  )}
                </CardBody>
              </Card>
            )}

            <div className="flex flex-col gap-2">
              <Badge variant={statusBadgeVariant(investment.status)} className="self-start">
                {investmentStatusLabels[investment.status]}
              </Badge>
              {user?.role === 'OWNER' && (
                <Button size="sm" onClick={() => setRepayModalOpen(true)}>
                  <Plus size={15} /> Log Repayment
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => router.push(`/documents?investmentId=${id}`)}>
                <FileText size={15} /> View Documents
              </Button>
            </div>
          </div>
        </div>

        {/* Repayment history */}
        <Card>
          <CardHeader
            title="Repayment History"
            subtitle={`${(repayments as Repayment[]).length} payment(s) recorded`}
            action={
              user?.role === 'OWNER' && (
                <Button size="sm" onClick={() => setRepayModalOpen(true)}>
                  <Plus size={14} /> Add
                </Button>
              )
            }
          />
          <CardBody className="p-0">
            {(repayments as Repayment[]).length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-6 text-center">No repayments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="min-w-[52rem] data-table sm:min-w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Principal Portion</th>
                    <th>Profit Portion</th>
                    <th>Notes</th>
                    <th>Receipt</th>
                    {user?.role === 'OWNER' && <th></th>}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(repayments as Repayment[]).map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.paymentDate)}</td>
                      <td className="font-medium"><CurrencyAmount amount={r.amount} /></td>
                      <td><CurrencyAmount amount={r.principalPortion} /></td>
                      <td className="text-primary-700 font-medium"><CurrencyAmount amount={r.profitPortion} /></td>
                      <td className="text-gray-400">{r.notes || '—'}</td>
                      <td>
                        {r.receiptUrl ? (
                          <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary-700 text-xs hover:underline">
                            View
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      {user?.role === 'OWNER' && (
                        <td>
                          <button
                            onClick={() => { if (confirm('Delete this repayment?')) deleteRepaymentMutation.mutate(r.id); }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Repayment modal */}
      <Modal
        open={repayModalOpen}
        onClose={() => { setRepayModalOpen(false); reset(); }}
        title="Log Repayment"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setRepayModalOpen(false); reset(); }}>Cancel</Button>
            <Button form="repayment-form" type="submit" loading={isSubmitting}>Save</Button>
          </>
        }
      >
        <form id="repayment-form" onSubmit={handleSubmit(onRepaymentSubmit)} className="space-y-4">
          <Input label="Payment Date" type="date" required error={errors.paymentDate?.message} {...register('paymentDate')} />
          <Input label="Total Amount" type="number" step="0.001" min="0" leftAddon="OMR" required error={errors.amount?.message} {...register('amount')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Principal Portion" type="number" step="0.001" min="0" leftAddon="OMR" error={errors.principalPortion?.message} {...register('principalPortion')} />
            <Input label="Profit Portion" type="number" step="0.001" min="0" leftAddon="OMR" error={errors.profitPortion?.message} {...register('profitPortion')} />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Receipt (optional)</label>
            <input
              ref={receiptRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea rows={2} className="block w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600" {...register('notes')} />
          </div>
        </form>
      </Modal>
    </>
  );
}
