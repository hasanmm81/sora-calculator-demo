import React, { useState } from 'react';
import { SoraDataPoint } from '../types/sora';
import { calculateCompoundedSoraInArrears } from '../utils/soraCalculator';
import { X, BookOpen, Calculator, CheckCircle2, ChevronRight } from 'lucide-react';

interface CompoundingInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  history: SoraDataPoint[];
}

export const CompoundingInspector: React.FC<CompoundingInspectorProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  if (!isOpen) return null;

  // Build a sample 7-day lookback series from available history
  const sampleDaily = history.slice(0, 7).map((pt, idx) => {
    // Weekend weight check: if Friday, 3 days, else 1
    const dayOfWeek = new Date(pt.date).getUTCDay();
    const days = dayOfWeek === 5 ? 3 : 1;
    return {
      date: pt.date,
      rate: pt.overnightRate,
      days,
    };
  });

  const simulated = calculateCompoundedSoraInArrears(sampleDaily);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 text-slate-200 relative shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                MAS Compounded SORA Math & Methodology
              </h3>
              <p className="text-xs text-slate-400">
                Official Monetary Authority of Singapore Actual/365 Compounding Standard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formula Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-center">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-2 font-sans font-medium">
            Official MAS Compounded SORA Formula
          </span>
          <div className="text-emerald-400 text-sm sm:text-base font-semibold py-2">
            Compounded SORA = [ &prod;<sub>i=1</sub><sup>d<sub>b</sub></sup> ( 1 + (r<sub>i</sub> &times; n<sub>i</sub>) / 365 ) - 1 ] &times; ( 365 / d ) &times; 100%
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-3 border-t border-slate-900 font-sans text-left">
            <div>
              <strong className="text-slate-300 font-mono">r<sub>i</sub></strong>: SORA rate on business day <em>i</em>
            </div>
            <div>
              <strong className="text-slate-300 font-mono">n<sub>i</sub></strong>: Calendar days rate applies (1 or 3)
            </div>
            <div>
              <strong className="text-slate-300 font-mono">d<sub>b</sub></strong>: Number of business days
            </div>
            <div>
              <strong className="text-slate-300 font-mono">d</strong>: Total calendar days in period
            </div>
          </div>
        </div>

        {/* Explanation Steps */}
        <div className="space-y-3 text-xs text-slate-300">
          <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
            Key Principles of Singapore SORA
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800">
              <span className="font-medium text-emerald-400 block mb-1">1. Publication Schedule</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                MAS publishes SORA daily at <strong>09:00 SGT</strong> on every Singapore business day for transactions concluded on the previous business day.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800">
              <span className="font-medium text-emerald-400 block mb-1">2. Weekend Weighting</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Friday overnight rates carry a weight of 3 calendar days (covering Friday, Saturday, and Sunday) as interbank money markets close over weekends.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800">
              <span className="font-medium text-emerald-400 block mb-1">3. Compounded In-Advance vs Arrears</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Most Singapore retail mortgages (DBS, OCBC, UOB) use <strong>Compounded in Advance</strong> (trailing 30-day or 90-day compounded index published on MAS).
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-800">
              <span className="font-medium text-emerald-400 block mb-1">4. Actual/365 Convention</span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Unlike US SOFR or European EURIBOR which use 360-day conventions, Singapore SGD benchmarks adhere strictly to Actual/365.
              </p>
            </div>
          </div>
        </div>

        {/* Live Lookback Sample Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Sample Daily Overnight Rate Compounding Sequence
            </h4>
            <span className="text-[11px] text-emerald-400 font-mono">
              Result: {simulated.compoundedRate.toFixed(4)}% p.a.
            </span>
          </div>

          <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Overnight SORA</th>
                  <th className="py-2 px-3 text-right">Days (n<sub>i</sub>)</th>
                  <th className="py-2 px-3 text-right">Factor: 1 + (r &times; n)/365</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {sampleDaily.map((item) => {
                  const factor = 1 + ((item.rate / 100) * item.days) / 365;
                  return (
                    <tr key={item.date} className="hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 text-white">{item.date}</td>
                      <td className="py-1.5 px-3 text-right text-emerald-400 tabular-nums">
                        {item.rate.toFixed(4)}%
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums">{item.days}</td>
                      <td className="py-1.5 px-3 text-right text-slate-400 tabular-nums">
                        {factor.toFixed(7)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
