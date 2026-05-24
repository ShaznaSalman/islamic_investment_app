'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import PurificationTracker from '@/components/purification/PurificationTracker';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatOMR } from '@/lib/utils';

// ── Profit Share Calculator ────────────────────────────────────────────────────
function ProfitShareCalc() {
  const [investment, setInvestment] = useState('');
  const [profit, setProfit] = useState('');
  const [ownerRatio, setOwnerRatio] = useState('70');
  const [result, setResult] = useState<{ ownerShare: number; recipientShare: number } | null>(null);

  function calculate() {
    const inv = parseFloat(investment);
    const pr = parseFloat(profit);
    const ratio = parseFloat(ownerRatio);
    if (isNaN(pr) || isNaN(ratio) || ratio < 0 || ratio > 100) return;
    setResult({ ownerShare: (pr * ratio) / 100, recipientShare: (pr * (100 - ratio)) / 100 });
  }

  return (
    <Card>
      <CardHeader
        title="Profit Share Calculator"
        subtitle="Calculate how profit is split between owner and recipient"
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Investment Amount"
            type="number" step="0.001" min="0"
            leftAddon="OMR"
            value={investment}
            onChange={(e) => setInvestment(e.target.value)}
            placeholder="500000"
          />
          <Input
            label="Actual Profit Earned"
            type="number" step="0.001" min="0"
            leftAddon="OMR"
            value={profit}
            onChange={(e) => setProfit(e.target.value)}
            placeholder="80000"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Owner's Profit Ratio (%)"
            type="number" min="0" max="100"
            value={ownerRatio}
            onChange={(e) => setOwnerRatio(e.target.value)}
            placeholder="70"
          />
          <Input
            label="Recipient's Ratio (%)"
            type="number"
            value={String(100 - parseFloat(ownerRatio || '0'))}
            readOnly
            className="bg-gray-50"
          />
        </div>
        <Button onClick={calculate}>Calculate</Button>

        {result && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
              <p className="text-xs text-primary-600 font-medium">Owner Receives</p>
              <p className="text-2xl font-bold text-primary-800 mt-1">{formatOMR(result.ownerShare)}</p>
            </div>
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gold-700 font-medium">Recipient Keeps</p>
              <p className="text-2xl font-bold text-gold-700 mt-1">{formatOMR(result.recipientShare)}</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Projected Return Calculator ────────────────────────────────────────────────
function ProjectedReturnCalc() {
  const [investment, setInvestment] = useState('');
  const [expectedRate, setExpectedRate] = useState('');
  const [ownerRatio, setOwnerRatio] = useState('70');
  const [result, setResult] = useState<{ totalProfit: number; ownerReturn: number; totalReturn: number } | null>(null);

  function calculate() {
    const inv = parseFloat(investment);
    const rate = parseFloat(expectedRate);
    const ratio = parseFloat(ownerRatio);
    if (isNaN(inv) || isNaN(rate) || isNaN(ratio)) return;
    const totalProfit = (inv * rate) / 100;
    const ownerReturn = (totalProfit * ratio) / 100;
    setResult({ totalProfit, ownerReturn, totalReturn: inv + ownerReturn });
  }

  return (
    <Card>
      <CardHeader title="Projected Return Calculator" subtitle="Estimate expected returns before finalising a deal" />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Investment Amount" type="number" step="0.001" leftAddon="OMR" value={investment} onChange={(e) => setInvestment(e.target.value)} placeholder="100000" />
          <Input label="Expected Profit Rate (%)" type="number" min="0" value={expectedRate} onChange={(e) => setExpectedRate(e.target.value)} placeholder="15" />
        </div>
        <Input label="Owner's Profit Ratio (%)" type="number" min="0" max="100" value={ownerRatio} onChange={(e) => setOwnerRatio(e.target.value)} placeholder="70" />
        <Button onClick={calculate}>Calculate</Button>
        {result && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500">Total Profit</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatOMR(result.totalProfit)}</p>
            </div>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
              <p className="text-xs text-primary-600">Owner Return</p>
              <p className="text-lg font-bold text-primary-800 mt-1">{formatOMR(result.ownerReturn)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600">Total Received</p>
              <p className="text-lg font-bold text-green-700 mt-1">{formatOMR(result.totalReturn)}</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Purification Calculator ────────────────────────────────────────────────────
function PurificationCalc() {
  const [totalIncome, setTotalIncome] = useState('');
  const [nonHalalPercent, setNonHalalPercent] = useState('');
  const [result, setResult] = useState<{ amountToPurify: number; halalAmount: number } | null>(null);

  function calculate() {
    const income = parseFloat(totalIncome);
    const percent = parseFloat(nonHalalPercent);
    if (isNaN(income) || isNaN(percent) || percent < 0 || percent > 100) return;
    const amountToPurify = (income * percent) / 100;
    setResult({ amountToPurify, halalAmount: income - amountToPurify });
  }

  return (
    <Card>
      <CardHeader title="Purification Calculator" subtitle="Calculate the amount to donate to charity to purify income" />
      <CardBody className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>Note:</strong> If any portion of income is from non-halal sources, it must be donated to charity (not counted as the owner&apos;s income).
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Total Income" type="number" step="0.001" leftAddon="OMR" value={totalIncome} onChange={(e) => setTotalIncome(e.target.value)} placeholder="50000" />
          <Input label="Non-Halal Portion (%)" type="number" min="0" max="100" value={nonHalalPercent} onChange={(e) => setNonHalalPercent(e.target.value)} placeholder="5" />
        </div>
        <Button onClick={calculate}>Calculate</Button>
        {result && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-xs text-red-600 font-medium">Donate to Charity</p>
              <p className="text-xl font-bold text-red-700 mt-1">{formatOMR(result.amountToPurify)}</p>
              <p className="text-xs text-red-400 mt-1">Must be given away, not kept</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 font-medium">Purified Income</p>
              <p className="text-xl font-bold text-green-700 mt-1">{formatOMR(result.halalAmount)}</p>
              <p className="text-xs text-green-400 mt-1">Permissible to keep</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Installment Calculator ─────────────────────────────────────────────────────
function InstallmentCalc() {
  const [costPrice, setCostPrice] = useState('');
  const [markup, setMarkup] = useState('');
  const [installments, setInstallments] = useState('12');
  const [result, setResult] = useState<{ salePrice: number; installmentAmount: number; schedule: { month: number; amount: number; balance: number }[] } | null>(null);

  function calculate() {
    const cost = parseFloat(costPrice);
    const markupPercent = parseFloat(markup);
    const n = parseInt(installments, 10);
    if (isNaN(cost) || isNaN(markupPercent) || isNaN(n) || n <= 0) return;
    const markupAmount = (cost * markupPercent) / 100;
    const salePrice = cost + markupAmount;
    const installmentAmount = salePrice / n;
    const schedule = Array.from({ length: n }, (_, i) => ({
      month: i + 1,
      amount: installmentAmount,
      balance: salePrice - installmentAmount * (i + 1),
    }));
    setResult({ salePrice, installmentAmount, schedule });
  }

  return (
    <Card>
      <CardHeader title="Installment Calculator (Murabahah)" subtitle="Break down a cost-plus sale into equal installments" />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Input label="Cost Price" type="number" step="0.001" leftAddon="OMR" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="10000" />
          <Input label="Markup (%)" type="number" min="0" value={markup} onChange={(e) => setMarkup(e.target.value)} placeholder="20" />
          <Input label="Number of Installments" type="number" min="1" value={installments} onChange={(e) => setInstallments(e.target.value)} placeholder="12" />
        </div>
        <Button onClick={calculate}>Generate Schedule</Button>
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
                <p className="text-xs text-primary-600">Sale Price (incl. markup)</p>
                <p className="text-xl font-bold text-primary-800 mt-1">{formatOMR(result.salePrice)}</p>
              </div>
              <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gold-700">Monthly Installment</p>
                <p className="text-xl font-bold text-gold-700 mt-1">{formatOMR(result.installmentAmount)}</p>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="min-w-full data-table">
                <thead><tr><th>Month</th><th>Payment</th><th>Remaining Balance</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {result.schedule.map((row) => (
                    <tr key={row.month}>
                      <td>{row.month}</td>
                      <td className="font-medium">{formatOMR(row.amount)}</td>
                      <td className={row.balance <= 0 ? 'text-green-600 font-medium' : ''}>{formatOMR(Math.max(0, row.balance))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CalculatorPage() {
  const tabs = ['Profit Share', 'Projected Return', 'Purification', 'Murabahah Installment'];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      <Header
        title="Calculator Suite"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Calculator' }]}
      />
      <div className="px-6 py-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === i
                  ? 'bg-primary-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={activeTab === 2 ? 'max-w-4xl' : 'max-w-2xl'}>
          {activeTab === 0 && <ProfitShareCalc />}
          {activeTab === 1 && <ProjectedReturnCalc />}
          {activeTab === 2 && (
            <div className="space-y-6">
              <PurificationCalc />
              <PurificationTracker />
            </div>
          )}
          {activeTab === 3 && <InstallmentCalc />}
        </div>
      </div>
    </>
  );
}
