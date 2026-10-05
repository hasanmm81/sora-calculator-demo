import React, { useState, useEffect, useMemo } from 'react';
import {
  SoraBenchmarkType,
  LoanInputState,
  CalculationResult
} from './types/sora';
import {
  fetchSoraRates,
  getBenchmarkRate,
  FetchSoraResult,
  FALLBACK_SORA_HISTORY
} from './services/soraService';
import { calculateSoraLoan } from './utils/soraCalculator';
import { Header } from './components/Header';
import { BenchmarkBar } from './components/BenchmarkBar';
import { LoanInputs } from './components/LoanInputs';
import { ResultsSummary } from './components/ResultsSummary';
import { AmortizationTable } from './components/AmortizationTable';
import { RateSensitivity } from './components/RateSensitivity';
import { BankPackagesComparison } from './components/BankPackagesComparison';
import { CompoundingInspector } from './components/CompoundingInspector';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import {
  Calculator,
  TableProperties,
  TrendingDown,
  Building,
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [soraMeta, setSoraMeta] = useState<FetchSoraResult>({
    source: 'mas_cached_baseline',
    data: FALLBACK_SORA_HISTORY,
    latest: FALLBACK_SORA_HISTORY[0],
    lastUpdated: '09:00 SGT',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [customBackendUrl, setCustomBackendUrl] = useState('');

  // Modals
  const [backendModalOpen, setBackendModalOpen] = useState(false);
  const [compoundingModalOpen, setCompoundingModalOpen] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'amortization' | 'sensitivity' | 'packages'>('overview');

  // Core loan input state
  const [input, setInput] = useState<LoanInputState>({
    propertyType: 'condo',
    propertyValue: 1800000,
    loanAmount: 1350000,
    tenureYears: 30,
    benchmark: 'compounded_3m',
    customSoraRate: null,
    bankSpread: 0.65,
    spreadYear4Onwards: 0.80,
    hasSteppedSpread: true,
    repaymentType: 'amortizing',
    stressTestRate: 4.00,
  });

  // Initial load of MAS rates
  useEffect(() => {
    loadSoraRates();
  }, []);

  const loadSoraRates = async (overrideUrl?: string) => {
    setIsLoading(true);
    try {
      const result = await fetchSoraRates(overrideUrl || customBackendUrl);
      setSoraMeta(result);
    } catch (e) {
      console.error('Failed to load SORA rates', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSoraRates();
  };

  const handleUpdateInput = (updated: Partial<LoanInputState>) => {
    setInput((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectBenchmark = (benchmark: SoraBenchmarkType) => {
    setInput((prev) => ({
      ...prev,
      benchmark,
      customSoraRate: null, // Reset custom rate to follow chosen benchmark
    }));
  };

  const handleApplyPackage = (config: {
    bankSpread: number;
    spreadYear4Onwards?: number;
    hasSteppedSpread: boolean;
    benchmark: SoraBenchmarkType;
    customSoraRate?: number | null;
  }) => {
    setInput((prev) => ({
      ...prev,
      bankSpread: config.bankSpread,
      spreadYear4Onwards: config.spreadYear4Onwards,
      hasSteppedSpread: config.hasSteppedSpread,
      benchmark: config.benchmark,
      customSoraRate: config.customSoraRate !== undefined ? config.customSoraRate : prev.customSoraRate,
    }));
  };

  // Current base SORA rate for the selected benchmark
  const benchmarkBaseRate = useMemo(() => {
    return getBenchmarkRate(soraMeta.latest, input.benchmark);
  }, [soraMeta.latest, input.benchmark]);

  // Main calculation result
  const result: CalculationResult = useMemo(() => {
    return calculateSoraLoan(input, benchmarkBaseRate);
  }, [input, benchmarkBaseRate]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Status */}
      <Header
        soraMeta={soraMeta}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onOpenBackendModal={() => setBackendModalOpen(true)}
        onOpenCompoundingModal={() => setCompoundingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Benchmark Selector Bar */}
        <BenchmarkBar
          latest={soraMeta.latest}
          selectedBenchmark={input.benchmark}
          customSoraRate={input.customSoraRate}
          onSelectBenchmark={handleSelectBenchmark}
        />

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 border border-slate-700/60 rounded-xl mb-6 max-w-fit overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Loan Calculator & Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('amortization')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'amortization'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Amortization Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('sensitivity')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'sensitivity'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Rate Hike / Cut Sensitivity</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'packages'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>SG Bank Comparison</span>
          </button>
        </div>

        {/* Tab 1: Overview & Primary Workspace */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Loan Inputs */}
            <div className="lg:col-span-5 space-y-6">
              <LoanInputs
                input={input}
                benchmarkBaseRate={benchmarkBaseRate}
                onChange={handleUpdateInput}
                onApplyPackage={handleApplyPackage}
              />
            </div>

            {/* Right Column: Calculations & Insights */}
            <div className="lg:col-span-7">
              <ResultsSummary result={result} input={input} />
            </div>
          </div>
        )}

        {/* Tab 2: Full Amortization Table */}
        {activeTab === 'amortization' && (
          <div className="space-y-6">
            <AmortizationTable
              annualSchedule={result.annualSchedule}
              monthlySchedule={result.monthlySchedule}
              loanAmount={input.loanAmount}
            />
          </div>
        )}

        {/* Tab 3: Rate Sensitivity */}
        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <RateSensitivity input={input} result={result} />
          </div>
        )}

        {/* Tab 4: Bank Package Comparison */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <BankPackagesComparison
              input={input}
              latestSora={soraMeta.latest}
              onApplyPackage={handleApplyPackage}
            />
          </div>
        )}

        {/* Informational MAS Notes Strip */}
        <div className="mt-8 p-4 rounded-xl bg-slate-850/50 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Regulatory & Methodology Compliance</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            SORA (Singapore Overnight Rate Average) is the volume-weighted average rate of unsecured overnight interbank SGD transactions administered by the Monetary Authority of Singapore (MAS). Daily SORA is published at 09:00 SGT on Singapore business days. Compounding conventions follow the MAS Actual/365 standard. This tool is built frontend-first with decoupled interfaces ready for backend integration via <code className="text-emerald-400 font-mono">/api/sora</code>.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-900/60 py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Singapore SORA Mortgage & Loan Calculator</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>MAS Statistics Dataset Resource: <code className="text-slate-400 font-mono text-[10px]">9a0bf149</code></span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setCompoundingModalOpen(true)}
              className="hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Formula Methodology
            </button>
            <button
              onClick={() => setBackendModalOpen(true)}
              className="hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Backend API Hook
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CompoundingInspector
        isOpen={compoundingModalOpen}
        onClose={() => setCompoundingModalOpen(false)}
        history={soraMeta.data}
      />

      <BackendIntegrationModal
        isOpen={backendModalOpen}
        onClose={() => setBackendModalOpen(false)}
        customBackendUrl={customBackendUrl}
        onSaveBackendUrl={(url) => {
          setCustomBackendUrl(url);
          if (url) loadSoraRates(url);
        }}
      />
    </div>
  );
}
