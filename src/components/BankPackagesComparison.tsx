import React from 'react';
import { LoanInputState, SoraDataPoint, SoraBenchmarkType } from '../types/sora';
import { calculateMonthlyPayment, formatSGD } from '../utils/soraCalculator';
import { Check, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface BankPackagesComparisonProps {
  input: LoanInputState;
  latestSora: SoraDataPoint;
  onApplyPackage: (config: {
    bankSpread: number;
    spreadYear4Onwards?: number;
    hasSteppedSpread: boolean;
    benchmark: SoraBenchmarkType;
    customSoraRate?: number | null;
  }) => void;
}

export const BankPackagesComparison: React.FC<BankPackagesComparisonProps> = ({
  input,
  latestSora,
  onApplyPackage,
}) => {
  const totalMonths = input.tenureYears * 12;

  const packages = [
    {
      name: 'DBS 3M SORA Floating',
      bank: 'DBS Bank',
      benchmark: 'compounded_3m' as SoraBenchmarkType,
      baseRate: latestSora.compounded3M,
      spread: 0.65,
      stepSpread: 0.80,
      hasStep: true,
      lockIn: '2 Years',
      features: ['Free conversion after 24m', 'Waiver due to property sale'],
      isPopular: true,
    },
    {
      name: 'OCBC 1M SORA Eco-Care',
      bank: 'OCBC Bank',
      benchmark: 'compounded_1m' as SoraBenchmarkType,
      baseRate: latestSora.compounded1M,
      spread: 0.68,
      stepSpread: 0.85,
      hasStep: true,
      lockIn: '2 Years',
      features: ['S$2,000 green renovation rebate', 'Monthly rate reset'],
    },
    {
      name: 'UOB 3M SORA Standard',
      bank: 'UOB Bank',
      benchmark: 'compounded_3m' as SoraBenchmarkType,
      baseRate: latestSora.compounded3M,
      spread: 0.70,
      stepSpread: 0.75,
      hasStep: true,
      lockIn: '3 Years',
      features: ['Subsidised legal fees (S$2,500)', 'Free valuation report'],
    },
    {
      name: 'Fixed 2-Year Package',
      bank: 'Commercial Banks',
      benchmark: 'compounded_3m' as SoraBenchmarkType,
      baseRate: 3.10, // Fixed rate
      spread: 0,
      stepSpread: 0.85,
      hasStep: false,
      lockIn: '2 Years',
      features: ['Guaranteed fixed rate for 24 months', 'Protection against rate hikes'],
      isFixed: true,
    },
    {
      name: 'HDB Concessionary Loan',
      bank: 'HDB (CPF OA + 0.1%)',
      benchmark: 'compounded_3m' as SoraBenchmarkType,
      baseRate: 2.60,
      spread: 0,
      stepSpread: 0,
      hasStep: false,
      lockIn: 'None',
      features: ['Fixed at 2.60% (CPF OA pegged)', 'Up to 80% LTV, no early repayment fee'],
      isHdbOnly: true,
    },
  ];

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            Singapore Market Bank Package Benchmark
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare current SORA floating packages against fixed rates and HDB housing loans for a{' '}
            <strong className="text-emerald-400 font-mono">{formatSGD(input.loanAmount)}</strong> loan over{' '}
            <strong className="text-white font-mono">{input.tenureYears} years</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const effectiveRate = pkg.baseRate + pkg.spread;
          const monthlyPayment = calculateMonthlyPayment(input.loanAmount, effectiveRate, totalMonths);
          const first3YearsInterest = Array.from({ length: 36 }).reduce<number>((acc, _, mIdx) => {
            // simplified 3y interest
            const approxMonthlyBalance = input.loanAmount * (1 - (mIdx / totalMonths) * 0.5);
            return acc + (approxMonthlyBalance * (effectiveRate / 100)) / 12;
          }, 0);

          return (
            <div
              key={pkg.name}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                pkg.isPopular
                  ? 'bg-slate-800/90 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400">{pkg.bank}</span>
                  {pkg.isPopular && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Popular
                    </span>
                  )}
                  {pkg.isFixed && (
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      Fixed Rate
                    </span>
                  )}
                  {pkg.isHdbOnly && (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      HDB Flat Only
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-white mb-2">{pkg.name}</h4>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                    {formatSGD(monthlyPayment)}
                  </span>
                  <span className="text-xs text-slate-400">/ mo</span>
                </div>

                <div className="text-xs font-mono text-slate-300 mb-3">
                  Effective: <strong className="text-white">{effectiveRate.toFixed(2)}% p.a.</strong>
                  {!pkg.isFixed && !pkg.isHdbOnly && (
                    <span className="text-slate-400 text-[11px] block">
                      ({pkg.baseRate.toFixed(2)}% SORA + {pkg.spread.toFixed(2)}% margin)
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>Lock-in Period:</span>
                    <span className="text-slate-200 font-medium">{pkg.lockIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. 3-Year Interest:</span>
                    <span className="text-amber-400 font-mono font-medium tabular-nums">
                      {formatSGD(first3YearsInterest)}
                    </span>
                  </div>
                </div>

                <ul className="mt-3 space-y-1 text-[11px] text-slate-400">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (pkg.isFixed || pkg.isHdbOnly) {
                      onApplyPackage({
                        bankSpread: 0,
                        spreadYear4Onwards: 0,
                        hasSteppedSpread: false,
                        benchmark: 'compounded_3m',
                        customSoraRate: pkg.baseRate,
                      });
                    } else {
                      onApplyPackage({
                        bankSpread: pkg.spread,
                        spreadYear4Onwards: pkg.stepSpread,
                        hasSteppedSpread: pkg.hasStep,
                        benchmark: pkg.benchmark,
                        customSoraRate: null,
                      });
                    }
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-slate-700 text-slate-300 hover:text-emerald-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Apply This Rate</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
