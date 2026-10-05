import React from 'react';
import { LoanInputState, CalculationResult } from '../types/sora';
import { calculateMonthlyPayment, formatSGD } from '../utils/soraCalculator';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

interface RateSensitivityProps {
  input: LoanInputState;
  result: CalculationResult;
}

export const RateSensitivity: React.FC<RateSensitivityProps> = ({ input, result }) => {
  const currentEffective = result.effectiveRate;
  const totalMonths = input.tenureYears * 12;

  const scenarios = [
    { label: '-1.00%', delta: -1.00 },
    { label: '-0.50%', delta: -0.50 },
    { label: '-0.25%', delta: -0.25 },
    { label: 'Current Rate', delta: 0, isCurrent: true },
    { label: '+0.50%', delta: +0.50 },
    { label: '+1.00%', delta: +1.00 },
    { label: '+1.50%', delta: +1.50 },
    { label: '+2.00%', delta: +2.00 },
  ];

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            SORA Rate Hike & Cut Sensitivity Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Since SORA floats based on daily MAS interbank transactions, evaluate how rate changes affect your monthly cash flow.
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Base: {currentEffective.toFixed(3)}%
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-700/80">
            <tr>
              <th className="py-2.5 px-3">Scenario</th>
              <th className="py-2.5 px-3 text-right">Effective Rate</th>
              <th className="py-2.5 px-3 text-right">Monthly Installment</th>
              <th className="py-2.5 px-3 text-right">Monthly Delta</th>
              <th className="py-2.5 px-3 text-right">Annual Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {scenarios.map((sc) => {
              const testRate = Math.max(0.1, currentEffective + sc.delta);
              const testPayment = input.repaymentType === 'interest_only'
                ? (input.loanAmount * (testRate / 100)) / 12
                : calculateMonthlyPayment(input.loanAmount, testRate, totalMonths);
              const diff = testPayment - result.monthlyPayment;
              const annualDiff = diff * 12;

              return (
                <tr
                  key={sc.label}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    sc.isCurrent ? 'bg-emerald-500/10 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 flex items-center gap-1.5">
                    {sc.delta > 0 && <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />}
                    {sc.delta < 0 && <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />}
                    {sc.delta === 0 && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                    <span className={sc.isCurrent ? 'text-emerald-400 font-bold' : ''}>
                      {sc.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {testRate.toFixed(3)}% p.a.
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-white font-medium">
                    {formatSGD(testPayment)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {sc.delta === 0 ? (
                      <span className="text-slate-500">—</span>
                    ) : diff > 0 ? (
                      <span className="text-rose-400">+{formatSGD(diff)}</span>
                    ) : (
                      <span className="text-emerald-400">{formatSGD(diff)}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">
                    {sc.delta === 0 ? (
                      '—'
                    ) : annualDiff > 0 ? (
                      <span className="text-rose-300">+{formatSGD(annualDiff)}/yr</span>
                    ) : (
                      <span className="text-emerald-300">{formatSGD(annualDiff)}/yr</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 p-3 bg-slate-900/60 rounded-lg border border-slate-700/40 text-[11px] text-slate-400">
        <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          Tip: Singapore mortgage loans typically feature a 2 or 3-year lock-in period. If interest rates rise rapidly, you may refinance or reprice your loan to a fixed package after the lock-in expires without penalty.
        </span>
      </div>
    </div>
  );
};
