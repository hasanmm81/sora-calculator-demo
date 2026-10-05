import {
  LoanInputState,
  CalculationResult,
  AnnualAmortizationRow,
  MonthlyAmortizationRow
} from '../types/sora';

/**
 * Calculates standard monthly mortgage payment using the standard amortizing formula
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePct: number,
  totalMonths: number
): number {
  if (principal <= 0 || totalMonths <= 0) return 0;
  if (annualRatePct <= 0) return principal / totalMonths;

  const monthlyRate = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * (monthlyRate * factor)) / (factor - 1);
}

/**
 * Full SORA Loan Payment calculation
 */
export function calculateSoraLoan(
  input: LoanInputState,
  baseSoraRate: number
): CalculationResult {
  const benchmarkRate = input.customSoraRate !== null ? input.customSoraRate : baseSoraRate;
  const initialEffectiveRate = Math.max(0, benchmarkRate + input.bankSpread);
  
  const hasStep = input.hasSteppedSpread && typeof input.spreadYear4Onwards === 'number';
  const year4EffectiveRate = hasStep 
    ? Math.max(0, benchmarkRate + (input.spreadYear4Onwards ?? input.bankSpread))
    : initialEffectiveRate;

  const totalMonths = input.tenureYears * 12;
  const initialPrincipal = input.loanAmount;

  // Monthly payment for Year 1-3
  let initialMonthlyPayment = 0;
  let year4MonthlyPayment = 0;

  if (input.repaymentType === 'interest_only') {
    initialMonthlyPayment = (initialPrincipal * (initialEffectiveRate / 100)) / 12;
    year4MonthlyPayment = (initialPrincipal * (year4EffectiveRate / 100)) / 12;
  } else {
    initialMonthlyPayment = calculateMonthlyPayment(initialPrincipal, initialEffectiveRate, totalMonths);
  }

  // Generate monthly and annual schedules
  const monthlySchedule: MonthlyAmortizationRow[] = [];
  const annualSchedule: AnnualAmortizationRow[] = [];

  let balance = initialPrincipal;
  let accumulatedInterest = 0;
  let currentAnnualPayment = 0;
  let currentAnnualPrincipal = 0;
  let currentAnnualInterest = 0;

  const stepMonthThreshold = 36; // 3 years

  for (let m = 1; m <= totalMonths; m++) {
    const isStepPhase = hasStep && m > stepMonthThreshold;
    const applicableRate = isStepPhase ? year4EffectiveRate : initialEffectiveRate;

    // Recalculate payment for remaining tenure at month 37 if stepped rate
    if (m === stepMonthThreshold + 1 && hasStep && input.repaymentType !== 'interest_only') {
      const remainingMonths = totalMonths - stepMonthThreshold;
      year4MonthlyPayment = calculateMonthlyPayment(balance, year4EffectiveRate, remainingMonths);
    }

    const currentMonthlyPayment = isStepPhase && hasStep
      ? (input.repaymentType === 'interest_only' ? (balance * (applicableRate / 100)) / 12 : year4MonthlyPayment)
      : initialMonthlyPayment;

    const monthlyInterest = (balance * (applicableRate / 100)) / 12;
    let monthlyPrincipal = 0;

    if (input.repaymentType === 'interest_only') {
      monthlyPrincipal = 0;
    } else {
      monthlyPrincipal = Math.min(balance, currentMonthlyPayment - monthlyInterest);
    }

    balance = Math.max(0, balance - monthlyPrincipal);
    accumulatedInterest += monthlyInterest;

    const currentYear = Math.ceil(m / 12);

    monthlySchedule.push({
      month: m,
      year: currentYear,
      payment: currentMonthlyPayment,
      principal: monthlyPrincipal,
      interest: monthlyInterest,
      remainingBalance: balance,
      accumulatedInterest,
      applicableRate
    });

    currentAnnualPayment += currentMonthlyPayment;
    currentAnnualPrincipal += monthlyPrincipal;
    currentAnnualInterest += monthlyInterest;

    // At end of each 12-month period or end of loan
    if (m % 12 === 0 || m === totalMonths) {
      annualSchedule.push({
        year: currentYear,
        annualPayment: currentAnnualPayment,
        principalPaid: currentAnnualPrincipal,
        interestPaid: currentAnnualInterest,
        endingBalance: balance,
        applicableRate
      });

      currentAnnualPayment = 0;
      currentAnnualPrincipal = 0;
      currentAnnualInterest = 0;
    }
  }

  // Summary statistics
  const totalInterest = accumulatedInterest;
  const totalPayment = input.repaymentType === 'interest_only'
    ? totalInterest + initialPrincipal
    : initialPrincipal + totalInterest;

  const firstYearInterest = annualSchedule[0]?.interestPaid || 0;
  const firstYearPrincipal = annualSchedule[0]?.principalPaid || 0;

  // MAS Stress Testing: MAS requires 4.0% floor or effective rate + buffer
  const stressRate = Math.max(input.stressTestRate, initialEffectiveRate);
  const stressTestPayment = input.repaymentType === 'interest_only'
    ? (initialPrincipal * (stressRate / 100)) / 12
    : calculateMonthlyPayment(initialPrincipal, stressRate, totalMonths);
  const stressTestPaymentDiff = stressTestPayment - initialMonthlyPayment;

  return {
    monthlyPayment: initialMonthlyPayment,
    monthlyPaymentYear4: hasStep ? year4MonthlyPayment : undefined,
    totalInterest,
    totalPayment,
    effectiveRate: initialEffectiveRate,
    benchmarkRate,
    bankMargin: input.bankSpread,
    firstYearInterest,
    firstYearPrincipal,
    stressTestPayment,
    stressTestPaymentDiff,
    stressRateEffective: stressRate,
    annualSchedule,
    monthlySchedule
  };
}

/**
 * Simulate MAS Compounding in Arrears formula given an array of daily rates
 * Formula: [Product(1 + (r_i * n_i)/365) - 1] * (365 / d) * 100
 */
export function calculateCompoundedSoraInArrears(
  dailyRates: { rate: number; days: number }[]
): { compoundedRate: number; totalDays: number } {
  let product = 1;
  let totalDays = 0;

  for (const item of dailyRates) {
    const rateDecimal = item.rate / 100;
    product *= 1 + (rateDecimal * item.days) / 365;
    totalDays += item.days;
  }

  if (totalDays === 0) return { compoundedRate: 0, totalDays: 0 };
  const compounded = (product - 1) * (365 / totalDays) * 100;

  return {
    compoundedRate: Number(compounded.toFixed(4)),
    totalDays
  };
}

/**
 * Format currency in Singapore Dollars (SGD)
 */
export function formatSGD(amount: number, compact: boolean = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `S$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `S$${(amount / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Export Amortization Table to CSV
 */
export function exportAmortizationToCSV(schedule: AnnualAmortizationRow[], loanAmount: number): void {
  const headers = ['Year', 'Annual Payment (SGD)', 'Principal Paid (SGD)', 'Interest Paid (SGD)', 'Ending Balance (SGD)', 'Interest Rate (%)'];
  const rows = schedule.map(row => [
    row.year,
    row.annualPayment.toFixed(2),
    row.principalPaid.toFixed(2),
    row.interestPaid.toFixed(2),
    row.endingBalance.toFixed(2),
    row.applicableRate.toFixed(2)
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + 
    [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `SORA_Loan_Amortization_SGD_${loanAmount}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
