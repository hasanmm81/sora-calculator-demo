import React from 'react';
import { LoanInputState, SoraBenchmarkType } from '../types/sora';
import { formatSGD } from '../utils/soraCalculator';
import { Building2, Home, Landmark, Briefcase, HelpCircle, Sparkles } from 'lucide-react';

interface LoanInputsProps {
  input: LoanInputState;
  benchmarkBaseRate: number;
  onChange: (updated: Partial<LoanInputState>) => void;
  onApplyPackage: (packageConfig: {
    bankSpread: number;
    spreadYear4Onwards?: number;
    hasSteppedSpread: boolean;
    benchmark: SoraBenchmarkType;
  }) => void;
}

export const LoanInputs: React.FC<LoanInputsProps> = ({
  input,
  benchmarkBaseRate,
  onChange,
  onApplyPackage,
}) => {
  const effectiveSora = input.customSoraRate !== null ? input.customSoraRate : benchmarkBaseRate;
  const ltvPercent = Math.round((input.loanAmount / (input.propertyValue || 1)) * 100);

  const propertyPresets = [
    { type: 'hdb' as const, label: 'HDB Flat', value: 650000, loan: 487500, tenure: 25, icon: Home },
    { type: 'condo' as const, label: 'Private Condo', value: 1800000, loan: 1350000, tenure: 30, icon: Building2 },
    { type: 'landed' as const, label: 'Landed', value: 4200000, loan: 3150000, tenure: 30, icon: Landmark },
    { type: 'commercial' as const, label: 'Commercial', value: 2500000, loan: 1875000, tenure: 20, icon: Briefcase },
  ];

  const sgBankPackages = [
    {
      name: 'DBS 3M SORA',
      spread: 0.65,
      stepSpread: 0.80,
      stepped: true,
      bm: 'compounded_3m' as SoraBenchmarkType,
    },
    {
      name: 'OCBC 1M SORA',
      spread: 0.68,
      stepSpread: 0.85,
      stepped: true,
      bm: 'compounded_1m' as SoraBenchmarkType,
    },
    {
      name: 'UOB 3M SORA',
      spread: 0.70,
      stepSpread: 0.75,
      stepped: false,
      bm: 'compounded_3m' as SoraBenchmarkType,
    },
    {
      name: 'Eco Loan Promo',
      spread: 0.55,
      stepSpread: 0.85,
      stepped: true,
      bm: 'compounded_3m' as SoraBenchmarkType,
    },
  ];

  const handlePropertyPreset = (preset: typeof propertyPresets[0]) => {
    onChange({
      propertyType: preset.type,
      propertyValue: preset.value,
      loanAmount: preset.loan,
      tenureYears: preset.tenure,
    });
  };

  const handleLtvChange = (newLtv: number) => {
    const calculatedLoan = Math.round(input.propertyValue * (newLtv / 100));
    onChange({ loanAmount: calculatedLoan });
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-6">
      {/* Property Preset Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Property Category
          </label>
          <span className="text-[11px] text-slate-400">Singapore Residential & Commercial</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {propertyPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = input.propertyType === preset.type;
            return (
              <button
                key={preset.type}
                type="button"
                onClick={() => handlePropertyPreset(preset)}
                className={`py-2 px-3 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-xs font-medium">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Price & Loan Amount */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Property Valuation / Price
              </label>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                {formatSGD(input.propertyValue)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">S$</span>
              <input
                type="number"
                step="10000"
                min="100000"
                value={input.propertyValue}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  const currentLtv = input.loanAmount / (input.propertyValue || 1);
                  onChange({
                    propertyValue: val,
                    loanAmount: Math.round(val * Math.min(0.75, currentLtv || 0.75)),
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Loan Amount
                </label>
                <span className="text-[11px] text-slate-400">({ltvPercent}% LTV)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                {formatSGD(input.loanAmount)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">S$</span>
              <input
                type="number"
                step="10000"
                min="50000"
                max={input.propertyValue}
                value={input.loanAmount}
                onChange={(e) => onChange({ loanAmount: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* LTV Quick Selector */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400 text-[11px]">MAS Loan-to-Value (LTV) Cap:</span>
          <div className="flex items-center gap-1.5">
            {[55, 75, 80].map((ltv) => (
              <button
                key={ltv}
                type="button"
                onClick={() => handleLtvChange(ltv)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  ltvPercent === ltv
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {ltv}% LTV {ltv === 75 ? '(Max 1st Loan)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loan Tenure */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-medium text-slate-300">
            Loan Tenure
          </label>
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            {input.tenureYears} Years ({input.tenureYears * 12} Months)
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="35"
          step="1"
          value={input.tenureYears}
          onChange={(e) => onChange({ tenureYears: Number(e.target.value) })}
          className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[11px] text-slate-400">5y min</span>
          <div className="flex gap-1.5">
            {[15, 20, 25, 30].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => onChange({ tenureYears: yr })}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                  input.tenureYears === yr
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {yr}y
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">35y max</span>
        </div>
      </div>

      {/* SORA Rate & Bank Spread Config */}
      <div className="pt-2 border-t border-slate-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Interest Rate Parameters
          </span>
          {/* Custom Rate Simulation Toggle */}
          <button
            type="button"
            onClick={() => {
              if (input.customSoraRate === null) {
                onChange({ customSoraRate: Number(benchmarkBaseRate.toFixed(4)) });
              } else {
                onChange({ customSoraRate: null });
              }
            }}
            className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            {input.customSoraRate === null ? 'Simulate Custom SORA' : 'Reset to Live MAS'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SORA Benchmark */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                SORA Benchmark Rate
              </label>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                {effectiveSora.toFixed(4)}% p.a.
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="15"
                disabled={input.customSoraRate === null}
                value={effectiveSora}
                onChange={(e) => onChange({ customSoraRate: Number(e.target.value) })}
                className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm font-mono tabular-nums ${
                  input.customSoraRate === null
                    ? 'border-slate-800 text-slate-400 cursor-not-allowed'
                    : 'border-emerald-500 text-emerald-300 focus:outline-none'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">% p.a.</span>
            </div>
          </div>

          {/* Bank Spread / Margin */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Bank Spread {input.hasSteppedSpread ? '(Yr 1 - 3)' : '(Margin)'}
              </label>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                +{input.bankSpread.toFixed(2)}% p.a.
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0"
                max="5"
                value={input.bankSpread}
                onChange={(e) => onChange({ bankSpread: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 tabular-nums"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">% p.a.</span>
            </div>
          </div>
        </div>

        {/* Stepped Spread Toggle */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="steppedSpread"
                type="checkbox"
                checked={input.hasSteppedSpread}
                onChange={(e) => onChange({ hasSteppedSpread: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <label htmlFor="steppedSpread" className="text-xs font-medium text-slate-300 cursor-pointer">
                Stepped Bank Spread (Singapore Package Standard)
              </label>
            </div>
            <span className="text-[11px] text-slate-400">Year 4 onwards margin increase</span>
          </div>

          {input.hasSteppedSpread && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Year 4+ Onwards Margin:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">+</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="5"
                  value={input.spreadYear4Onwards ?? 0.85}
                  onChange={(e) => onChange({ spreadYear4Onwards: Number(e.target.value) })}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-white text-right focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-slate-400">% p.a.</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Bank Package Presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Standard Bank Package Presets
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sgBankPackages.map((pkg) => (
              <button
                key={pkg.name}
                type="button"
                onClick={() =>
                  onApplyPackage({
                    bankSpread: pkg.spread,
                    spreadYear4Onwards: pkg.stepSpread,
                    hasSteppedSpread: pkg.stepped,
                    benchmark: pkg.bm,
                  })
                }
                className="p-2 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-left transition-colors cursor-pointer group"
              >
                <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-300">
                  {pkg.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  +{pkg.spread}% {pkg.stepped ? `(Y4+ +${pkg.stepSpread}%)` : 'flat'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Repayment Type Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
          <label className="text-xs font-medium text-slate-300">Repayment Structure</label>
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-700/80">
            <button
              type="button"
              onClick={() => onChange({ repaymentType: 'amortizing' })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                input.repaymentType === 'amortizing'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Principal + Interest
            </button>
            <button
              type="button"
              onClick={() => onChange({ repaymentType: 'interest_only' })}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                input.repaymentType === 'interest_only'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interest Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
