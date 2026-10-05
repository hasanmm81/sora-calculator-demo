export interface SoraDataPoint {
  date: string; // YYYY-MM-DD
  overnightRate: number; // in %
  compounded1M: number; // in %
  compounded3M: number; // in %
  compounded6M: number; // in %
  soraIndex?: number;
  volumeMillionSGD?: number;
  publishedAt?: string;
}

export type SoraBenchmarkType = 'compounded_1m' | 'compounded_3m' | 'compounded_6m' | 'overnight_daily';

export interface BankPackageConfig {
  name: string;
  bankName: string;
  benchmark: SoraBenchmarkType;
  spreadYear1to3: number; // e.g. 0.70%
  spreadYear4Onwards: number; // e.g. 0.85%
  lockInYears: number;
  type: 'floating' | 'fixed';
  fixedRate?: number; // for fixed rate packages
}

export interface LoanInputState {
  propertyType: 'hdb' | 'condo' | 'landed' | 'commercial';
  propertyValue: number;
  loanAmount: number;
  tenureYears: number;
  benchmark: SoraBenchmarkType;
  customSoraRate: number | null; // null means use live/benchmark rate
  bankSpread: number; // % p.a.
  spreadYear4Onwards?: number;
  hasSteppedSpread: boolean;
  repaymentType: 'amortizing' | 'interest_only';
  stressTestRate: number; // MAS medium term rate floor e.g. 4.0%
}

export interface MonthlyAmortizationRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  accumulatedInterest: number;
  applicableRate: number;
}

export interface AnnualAmortizationRow {
  year: number;
  annualPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  applicableRate: number;
}

export interface CalculationResult {
  monthlyPayment: number;
  monthlyPaymentYear4?: number;
  totalInterest: number;
  totalPayment: number;
  effectiveRate: number;
  benchmarkRate: number;
  bankMargin: number;
  firstYearInterest: number;
  firstYearPrincipal: number;
  stressTestPayment: number;
  stressTestPaymentDiff: number;
  stressRateEffective: number;
  annualSchedule: AnnualAmortizationRow[];
  monthlySchedule: MonthlyAmortizationRow[];
}
