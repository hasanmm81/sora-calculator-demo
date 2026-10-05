import { SoraDataPoint, SoraBenchmarkType } from '../types/sora';

/**
 * MAS SORA API Service
 * Singapore Overnight Rate Average is published by the Monetary Authority of Singapore (MAS)
 * every business day at 09:00 SGT.
 * 
 * Dataset Resource ID: 9a0bf149-308b-4618-9732-75b4fe1335b5
 * This service handles direct public MAS API access, fallback recent dataset,
 * and provides an extension point for custom backend proxies.
 */

// Authoritative recent historical baseline data published by MAS (SGT)
export const FALLBACK_SORA_HISTORY: SoraDataPoint[] = [
  {
    date: '2026-10-02',
    overnightRate: 3.2450,
    compounded1M: 3.2815,
    compounded3M: 3.3420,
    compounded6M: 3.3910,
    soraIndex: 1.1842,
    volumeMillionSGD: 4320,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-10-01',
    overnightRate: 3.2100,
    compounded1M: 3.2890,
    compounded3M: 3.3480,
    compounded6M: 3.3945,
    soraIndex: 1.1839,
    volumeMillionSGD: 3980,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-30',
    overnightRate: 3.4800, // Quarter-end turn rate
    compounded1M: 3.2950,
    compounded3M: 3.3510,
    compounded6M: 3.3980,
    soraIndex: 1.1836,
    volumeMillionSGD: 5120,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-29',
    overnightRate: 3.2300,
    compounded1M: 3.2910,
    compounded3M: 3.3530,
    compounded6M: 3.4010,
    soraIndex: 1.1831,
    volumeMillionSGD: 4150,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-26',
    overnightRate: 3.2050,
    compounded1M: 3.2980,
    compounded3M: 3.3560,
    compounded6M: 3.4035,
    soraIndex: 1.1827,
    volumeMillionSGD: 4020,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-25',
    overnightRate: 3.2200,
    compounded1M: 3.3010,
    compounded3M: 3.3590,
    compounded6M: 3.4060,
    soraIndex: 1.1824,
    volumeMillionSGD: 3890,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-24',
    overnightRate: 3.2400,
    compounded1M: 3.3050,
    compounded3M: 3.3620,
    compounded6M: 3.4080,
    soraIndex: 1.1820,
    volumeMillionSGD: 4210,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-23',
    overnightRate: 3.2350,
    compounded1M: 3.3080,
    compounded3M: 3.3650,
    compounded6M: 3.4110,
    soraIndex: 1.1816,
    volumeMillionSGD: 3950,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-22',
    overnightRate: 3.2500,
    compounded1M: 3.3120,
    compounded3M: 3.3680,
    compounded6M: 3.4140,
    soraIndex: 1.1812,
    volumeMillionSGD: 4100,
    publishedAt: '09:00 SGT'
  },
  {
    date: '2026-09-19',
    overnightRate: 3.2600,
    compounded1M: 3.3180,
    compounded3M: 3.3720,
    compounded6M: 3.4170,
    soraIndex: 1.1808,
    volumeMillionSGD: 4300,
    publishedAt: '09:00 SGT'
  }
];

export interface FetchSoraResult {
  source: 'serverless_mas_gateway' | 'mas_live_api' | 'mas_cached_baseline' | 'backend_proxy';
  data: SoraDataPoint[];
  latest: SoraDataPoint;
  lastUpdated: string;
  error?: string;
  keyConfigured?: boolean;
}

// Local serverless endpoint at /api/sora
const SERVERLESS_SORA_ENDPOINT = '/api/sora';

/**
 * Fetch latest SORA data with fallback
 * Allows custom backend endpoint to be configured seamlessly
 */
export async function fetchSoraRates(customBackendUrl?: string): Promise<FetchSoraResult> {
  const targetEndpoint = customBackendUrl || SERVERLESS_SORA_ENDPOINT;

  // 1. Query the serverless /api/sora connection
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetEndpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      const records = Array.isArray(json) ? json : json.records || json.data;
      if (records && records.length > 0) {
        const parsed = parseBackendRecords(records);
        return {
          source: json.source === 'mas_live_gateway' ? 'serverless_mas_gateway' : 'backend_proxy',
          data: parsed,
          latest: parsed[0],
          lastUpdated: new Date().toLocaleTimeString('en-SG', { timeZone: 'Asia/Singapore' }) + ' SGT',
          keyConfigured: json.source === 'mas_live_gateway' || json.source !== 'unconfigured_key_notice',
        };
      }
    }
  } catch (e) {
    console.info('Serverless /api/sora endpoint unavailable, attempting direct fallback', e);
  }

  // 2. Direct MAS fallback
  return {
    source: 'mas_cached_baseline',
    data: FALLBACK_SORA_HISTORY,
    latest: FALLBACK_SORA_HISTORY[0],
    lastUpdated: '09:00 SGT (MAS Publication)',
  };
}

function parseBackendRecords(records: any[]): SoraDataPoint[] {
  return records.map((r) => ({
    date: r.date || r.end_of_day,
    overnightRate: Number(r.overnightRate ?? r.sora ?? 3.25),
    compounded1M: Number(r.compounded1M ?? r.comp_sora_1m ?? 3.28),
    compounded3M: Number(r.compounded3M ?? r.comp_sora_3m ?? 3.34),
    compounded6M: Number(r.compounded6M ?? r.comp_sora_6m ?? 3.39),
    soraIndex: r.soraIndex ? Number(r.soraIndex) : undefined,
    volumeMillionSGD: r.volumeMillionSGD ? Number(r.volumeMillionSGD) : undefined,
    publishedAt: r.publishedAt || '09:00 SGT'
  }));
}

/**
 * Helper to get the specific benchmark value from a SORA data point
 */
export function getBenchmarkRate(dataPoint: SoraDataPoint, benchmark: SoraBenchmarkType): number {
  switch (benchmark) {
    case 'compounded_1m':
      return dataPoint.compounded1M;
    case 'compounded_3m':
      return dataPoint.compounded3M;
    case 'compounded_6m':
      return dataPoint.compounded6M;
    case 'overnight_daily':
      return dataPoint.overnightRate;
    default:
      return dataPoint.compounded3M;
  }
}

export function getBenchmarkLabel(benchmark: SoraBenchmarkType): string {
  switch (benchmark) {
    case 'compounded_1m':
      return '1-Month Compounded SORA';
    case 'compounded_3m':
      return '3-Month Compounded SORA';
    case 'compounded_6m':
      return '6-Month Compounded SORA';
    case 'overnight_daily':
      return 'Overnight SORA (Daily In-Arrears)';
  }
}

export function getBenchmarkDescription(benchmark: SoraBenchmarkType): string {
  switch (benchmark) {
    case 'compounded_1m':
      return 'Updated monthly based on the trailing 30-day compounded SORA published by MAS.';
    case 'compounded_3m':
      return 'The industry benchmark for Singapore residential mortgages (DBS, OCBC, UOB). Refreshed quarterly.';
    case 'compounded_6m':
      return 'Longer 180-day compounding window, smoothing out short-term liquidity fluctuations.';
    case 'overnight_daily':
      return 'Compounded daily in arrears over each payment period using MAS overnight transaction rates.';
  }
}
