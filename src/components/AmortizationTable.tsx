import React, { useState } from 'react';
import { AnnualAmortizationRow, MonthlyAmortizationRow } from '../types/sora';
import { formatSGD, exportAmortizationToCSV } from '../utils/soraCalculator';
import { ChevronDown, ChevronRight, Download, Filter } from 'lucide-react';

interface AmortizationTableProps {
  annualSchedule: AnnualAmortizationRow[];
  monthlySchedule: MonthlyAmortizationRow[];
  loanAmount: number;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  annualSchedule,
  monthlySchedule,
  loanAmount,
}) => {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [filterYearRange, setFilterYearRange] = useState<'all' | 'first5' | 'first10'>('all');

  const displayedAnnual = annualSchedule.filter((row) => {
    if (filterYearRange === 'first5') return row.year <= 5;
    if (filterYearRange === 'first10') return row.year <= 10;
    return true;
  });

  const toggleYear = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Full Amortization Schedule
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Yearly breakdown of principal reduction, interest paid, and remaining balance. Click any year to inspect 12 monthly payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter options */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setFilterYearRange('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterYearRange === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Years
            </button>
            <button
              onClick={() => setFilterYearRange('first5')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterYearRange === 'first5'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Years 1–5
            </button>
            <button
              onClick={() => setFilterYearRange('first10')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterYearRange === 'first10'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Years 1–10
            </button>
          </div>

          <button
            onClick={() => exportAmortizationToCSV(annualSchedule, loanAmount)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[520px]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] tracking-wider sticky top-0 z-10 border-b border-slate-700/80">
            <tr>
              <th className="py-3 px-4 w-16">Year</th>
              <th className="py-3 px-4 text-right">Annual Payment</th>
              <th className="py-3 px-4 text-right">Principal Paid</th>
              <th className="py-3 px-4 text-right">Interest Paid</th>
              <th className="py-3 px-4 text-right">Ending Balance</th>
              <th className="py-3 px-4 text-right">Rate</th>
              <th className="py-3 px-4 w-12 text-center">Months</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {displayedAnnual.map((row) => {
              const isExpanded = expandedYear === row.year;
              const yearMonths = monthlySchedule.filter((m) => m.year === row.year);

              return (
                <React.Fragment key={row.year}>
                  <tr
                    onClick={() => toggleYear(row.year)}
                    className="hover:bg-slate-800/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-emerald-400 flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      Yr {row.year}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-white">
                      {formatSGD(row.annualPayment)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-400">
                      {formatSGD(row.principalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-amber-400">
                      {formatSGD(row.interestPaid)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-white">
                      {formatSGD(row.endingBalance)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-400">
                      {row.applicableRate.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 text-[11px]">
                      {isExpanded ? 'Hide' : 'View'}
                    </td>
                  </tr>

                  {/* Expanded Monthly Sub-Table */}
                  {isExpanded && (
                    <tr className="bg-slate-900/60">
                      <td colSpan={7} className="p-0">
                        <div className="p-3 bg-slate-900/80 border-y border-slate-700/50">
                          <div className="text-[11px] font-sans text-slate-400 mb-2 font-medium">
                            Month-by-Month Breakdown for Year {row.year}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] font-mono text-slate-300">
                              <thead>
                                <tr className="text-slate-500 border-b border-slate-800">
                                  <th className="py-1.5 px-3">Month</th>
                                  <th className="py-1.5 px-3 text-right">Payment</th>
                                  <th className="py-1.5 px-3 text-right">Principal</th>
                                  <th className="py-1.5 px-3 text-right">Interest</th>
                                  <th className="py-1.5 px-3 text-right">Remaining Balance</th>
                                  <th className="py-1.5 px-3 text-right">Cum. Interest</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/40">
                                {yearMonths.map((m) => (
                                  <tr key={m.month} className="hover:bg-slate-800/40">
                                    <td className="py-1.5 px-3 text-slate-400">Month {m.month}</td>
                                    <td className="py-1.5 px-3 text-right tabular-nums">{formatSGD(m.payment)}</td>
                                    <td className="py-1.5 px-3 text-right text-emerald-400 tabular-nums">{formatSGD(m.principal)}</td>
                                    <td className="py-1.5 px-3 text-right text-amber-400 tabular-nums">{formatSGD(m.interest)}</td>
                                    <td className="py-1.5 px-3 text-right font-medium text-white tabular-nums">{formatSGD(m.remainingBalance)}</td>
                                    <td className="py-1.5 px-3 text-right text-slate-400 tabular-nums">{formatSGD(m.accumulatedInterest)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
