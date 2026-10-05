import React, { useState } from 'react';
import { CalculationResult, LoanInputState } from '../types/sora';
import { formatSGD, exportAmortizationToCSV } from '../utils/soraCalculator';
import { ShieldAlert, TrendingUp, Download, Copy, Check, PieChart, Info } from 'lucide-react';

interface ResultsSummaryProps {
  result: CalculationResult;
  input: LoanInputState;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({ result, input }) => {
  const [copied, setCopied] = useState(false);

  const interestPercentage = Math.round(
    (result.totalInterest / (result.totalPayment || 1)) * 100
  );
  const principalPercentage = 100 - interestPercentage;

  const firstYearInterestPct = Math.round(
    (result.firstYearInterest / ((result.firstYearInterest + result.firstYearPrincipal) || 1)) * 100
  );
  const firstYearPrincipalPct = 100 - firstYearInterestPct;

  const handleCopy = () => {
    const summaryText = `--- SORA Mortgage Calculation Summary ---
Loan Amount: ${formatSGD(input.loanAmount)}
Tenure: ${input.tenureYears} Years (${input.tenureYears * 12} months)
SORA Benchmark: ${result.benchmarkRate.toFixed(4)}% p.a.
Bank Margin: +${result.bankMargin.toFixed(2)}% p.a.
Effective Rate: ${result.effectiveRate.toFixed(4)}% p.a.
Monthly Payment: ${formatSGD(result.monthlyPayment)} / month
${result.monthlyPaymentYear4 ? `Year 4+ Payment: ${formatSGD(result.monthlyPaymentYear4)} / month\n` : ''}
Total Interest Payable: ${formatSGD(result.totalInterest)}
Total Payment: ${formatSGD(result.totalPayment)}
MAS 4.0% Stress Test Payment: ${formatSGD(result.stressTestPayment)} / month (+${formatSGD(result.stressTestPaymentDiff)})
Generated via Singapore SORA Calculator (MAS Overnight Rate Engine)`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SVG Chart points calculation for Amortization trajectory
  const schedule = result.annualSchedule;
  const chartWidth = 500;
  const chartHeight = 160;
  const padding = 20;

  const maxVal = Math.max(input.loanAmount, result.totalInterest, 1);
  const numYears = schedule.length || 1;

  const balancePoints = schedule.map((row, idx) => {
    const x = padding + (idx / (numYears - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (row.endingBalance / maxVal) * (chartHeight - padding * 2);
    return `${x},${y}`;
  });

  const cumulativeInterestPoints = schedule.map((_, idx) => {
    const accum = schedule.slice(0, idx + 1).reduce((sum, r) => sum + r.interestPaid, 0);
    const x = padding + (idx / (numYears - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (accum / maxVal) * (chartHeight - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="space-y-6">
      {/* Primary Hero Monthly Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/90 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden shadow-xl shadow-slate-950/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Estimated Monthly Installment
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold font-mono text-white tracking-tight tabular-nums">
                {formatSGD(result.monthlyPayment)}
              </span>
              <span className="text-sm font-medium text-slate-400">/ month</span>
            </div>
            {result.monthlyPaymentYear4 && (
              <p className="mt-1 text-xs text-amber-300 font-mono">
                Yr 4 onwards: {formatSGD(result.monthlyPaymentYear4)} / mo (stepped bank margin)
              </p>
            )}
          </div>

          <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 sm:text-right">
            <span className="text-[11px] text-slate-400 block">Effective Interest Rate</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {result.effectiveRate.toFixed(3)}%
            </span>
            <span className="text-xs text-slate-400 font-mono block mt-0.5">
              ({result.benchmarkRate.toFixed(3)}% SORA + {result.bankMargin.toFixed(2)}% Spread)
            </span>
          </div>
        </div>

        {/* Quick Share / Export Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Loan: {formatSGD(input.loanAmount)}</span>
            <span aria-hidden="true">·</span>
            <span>Tenure: {input.tenureYears}y</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{input.repaymentType.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => exportAmortizationToCSV(result.annualSchedule, input.loanAmount)}
              className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Numbers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Interest */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400 block">Total Interest Payable</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block tabular-nums">
            {formatSGD(result.totalInterest)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {interestPercentage}% of total repayment
          </span>
        </div>

        {/* Total Repayment */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400 block">Total Loan Repayment</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block tabular-nums">
            {formatSGD(result.totalPayment)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Principal ({principalPercentage}%) + Interest ({interestPercentage}%)
          </span>
        </div>

        {/* First Year Breakdown */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400 block">Year 1 Interest / Principal</span>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {formatSGD(result.firstYearInterest)} <span className="text-xs font-normal text-slate-400 font-sans">int.</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">
            {firstYearInterestPct}% interest · {firstYearPrincipalPct}% principal
          </span>
        </div>
      </div>

      {/* Visual Composition Bar */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-emerald-400" /> Total Repayment Composition
          </span>
          <span className="text-slate-400 font-mono">
            {formatSGD(result.totalPayment)}
          </span>
        </div>

        {/* Stacked Bar */}
        <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
          <div
            style={{ width: `${principalPercentage}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title={`Principal: ${formatSGD(input.loanAmount)} (${principalPercentage}%)`}
          />
          <div
            style={{ width: `${interestPercentage}%` }}
            className="h-full bg-amber-500 transition-all duration-500"
            title={`Interest: ${formatSGD(result.totalInterest)} (${interestPercentage}%)`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Principal: {formatSGD(input.loanAmount)} ({principalPercentage}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Interest: {formatSGD(result.totalInterest)} ({interestPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* MAS TDSR Regulatory Stress Test Banner */}
      <div className="bg-slate-800/40 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                MAS TDSR Stress Test Assessment
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">(4.00% Floor Rule)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Monetary Authority of Singapore requires financial institutions to stress-test your monthly mortgage at a minimum of{' '}
              <strong className="text-white font-mono">{result.stressRateEffective.toFixed(2)}% p.a.</strong> under the Total Debt Servicing Ratio (TDSR 55% cap).
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400">Stress Payment: </span>
                <span className="text-amber-300 font-bold tabular-nums">
                  {formatSGD(result.stressTestPayment)} / mo
                </span>
              </div>
              <div>
                <span className="text-slate-400">Required Safety Buffer: </span>
                <span className="text-amber-400 font-semibold tabular-nums">
                  +{formatSGD(result.stressTestPaymentDiff)} / mo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Trajectory Graph */}
      {schedule.length > 1 && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Loan Balance Trajectory Over {input.tenureYears} Years
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Remaining Loan
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-0.5 bg-amber-400 inline-block" /> Cumulative Interest
              </span>
            </div>
          </div>

          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-36 stroke-line-cap-round"
            >
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.5" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#475569" strokeWidth="1" />

              {/* Principal Remaining Line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={balancePoints.join(' ')}
              />

              {/* Cumulative Interest Line */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
                points={cumulativeInterestPoints.join(' ')}
              />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1 px-2">
            <span>Year 1</span>
            <span>Year {Math.round(input.tenureYears / 2)}</span>
            <span>Year {input.tenureYears} (Maturity)</span>
          </div>
        </div>
      )}
    </div>
  );
};
