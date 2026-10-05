import React from 'react';
import { RefreshCw, ShieldCheck, Database, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { FetchSoraResult } from '../services/soraService';

interface HeaderProps {
  soraMeta: FetchSoraResult;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenBackendModal: () => void;
  onOpenCompoundingModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soraMeta,
  isLoading,
  onRefresh,
  onOpenBackendModal,
  onOpenCompoundingModal,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg font-mono">
              S$
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white">
                  SORA Loan Calculator
                </h1>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Singapore</span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>MAS Overnight Benchmark (Monetary Authority of Singapore)</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-400 font-mono text-[11px]">Actual/365</span>
              </p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Live Data Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  soraMeta.source === 'serverless_mas_gateway'
                    ? 'bg-emerald-400 animate-pulse'
                    : soraMeta.source === 'mas_live_api'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <span className="font-mono text-[11px] text-slate-300">
                {soraMeta.latest.date}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">
                {soraMeta.source === 'serverless_mas_gateway'
                  ? 'Serverless MAS Gateway'
                  : soraMeta.source === 'mas_live_api'
                  ? 'Live MAS API'
                  : 'MAS Baseline'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh MAS SORA rates"
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Sync Rates</span>
            </button>

            {/* Formula Inspector */}
            <button
              onClick={onOpenCompoundingModal}
              className="px-2.5 py-1.5 rounded-md bg-slate-800/70 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Compounding Math</span>
            </button>

            {/* Backend Integration Ready */}
            <button
              onClick={onOpenBackendModal}
              className="px-2.5 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backend API</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
