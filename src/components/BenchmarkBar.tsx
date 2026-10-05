import React from 'react';
import { SoraBenchmarkType, SoraDataPoint } from '../types/sora';
import { Check, Info } from 'lucide-react';

interface BenchmarkBarProps {
  latest: SoraDataPoint;
  selectedBenchmark: SoraBenchmarkType;
  customSoraRate: number | null;
  onSelectBenchmark: (benchmark: SoraBenchmarkType) => void;
}

export const BenchmarkBar: React.FC<BenchmarkBarProps> = ({
  latest,
  selectedBenchmark,
  customSoraRate,
  onSelectBenchmark,
}) => {
  const benchmarks: {
    id: SoraBenchmarkType;
    label: string;
    sublabel: string;
    rate: number;
    popular?: boolean;
    tag: string;
  }[] = [
    {
      id: 'compounded_3m',
      label: '3-Month Compounded',
      sublabel: 'Retail standard (DBS, OCBC, UOB)',
      rate: latest.compounded3M,
      popular: true,
      tag: 'Most Popular SG Mortgages'
    },
    {
      id: 'compounded_1m',
      label: '1-Month Compounded',
      sublabel: 'Adjusts monthly with 30d window',
      rate: latest.compounded1M,
      tag: 'Fast Market Adjustment'
    },
    {
      id: 'compounded_6m',
      label: '6-Month Compounded',
      sublabel: 'Smoother 180-day moving window',
      rate: latest.compounded6M,
      tag: 'Smoothed Rate'
    },
    {
      id: 'overnight_daily',
      label: 'Overnight SORA',
      sublabel: 'Daily interbank unsecured lending',
      rate: latest.overnightRate,
      tag: 'Pure Overnight'
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select MAS Benchmark
          </span>
          <span className="text-xs text-slate-500 font-mono">
            MAS Data Date: {latest.date}
          </span>
        </div>
        {customSoraRate !== null && (
          <span className="text-xs text-amber-400 font-medium">
            (Custom Rate Applied: {customSoraRate.toFixed(3)}%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {benchmarks.map((bm) => {
          const isSelected = selectedBenchmark === bm.id;
          return (
            <button
              key={bm.id}
              type="button"
              onClick={() => onSelectBenchmark(bm.id)}
              className={`p-3.5 rounded-lg text-left transition-all relative border cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/40'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600'
              }`}
            >
              {bm.popular && (
                <div className="absolute top-2.5 right-2.5">
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    Popular
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">
                  {bm.label}
                </span>
              </div>

              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {bm.rate.toFixed(4)}%
                </span>
                <span className="text-xs text-slate-400 font-mono">p.a.</span>
              </div>

              <div className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                {bm.sublabel}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{bm.tag}</span>
                {isSelected && (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
