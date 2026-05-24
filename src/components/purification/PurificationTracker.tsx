'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  useCreatePurificationRecord,
  useDeletePurificationRecord,
  usePurificationRecords,
} from '@/hooks/usePurification';
import { formatOMR, formatDate } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export default function PurificationTracker() {
  const { data, isLoading } = usePurificationRecords();
  const createMutation = useCreatePurificationRecord();
  const deleteMutation = useDeletePurificationRecord();

  const [amount, setAmount] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().slice(0, 10));
  const [donatedTo, setDonatedTo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  async function saveRecord() {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !donationDate) return;
    await createMutation.mutateAsync({
      amount: num,
      donationDate,
      donatedTo: donatedTo || undefined,
      purpose: purpose || undefined,
      notes: notes || undefined,
    });
    setAmount('');
    setDonatedTo('');
    setPurpose('');
    setNotes('');
  }

  return (
    <Card>
      <CardHeader
        title="Purification Tracker"
        subtitle={`${data?.summary.count ?? 0} donations recorded · ${formatOMR(data?.summary.totalPurified ?? 0)} total purified`}
      />
      <CardBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Input label="Amount Donated" type="number" step="0.001" leftAddon="OMR" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Donation Date" type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} />
          <Input label="Donated To (charity)" value={donatedTo} onChange={(e) => setDonatedTo(e.target.value)} placeholder="Charity name" />
          <Input label="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Non-halal income purification" className="sm:col-span-2" />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>
        <Button onClick={saveRecord} loading={createMutation.isPending} className="w-full sm:w-auto">Save Donation Record</Button>

        {isLoading ? (
          <div className="h-24 animate-pulse bg-gray-100 rounded-xl" />
        ) : !data?.records.length ? (
          <p className="text-sm text-gray-400 text-center py-4">No purification records yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-[42rem] data-table sm:min-w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Donated To</th>
                  <th>Purpose</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.donationDate)}</td>
                    <td className="font-semibold text-red-700">{formatOMR(r.amount)}</td>
                    <td>{r.donatedTo || '—'}</td>
                    <td className="text-gray-500">{r.purpose || '—'}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(r.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
