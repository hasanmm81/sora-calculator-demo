import type { Request, Response } from 'express';

/**
 * Serverless connection for Monetary Authority of Singapore (MAS) API
 * Endpoint: domestic_interest_rates_daily
 * 
 * Fetches:
 * - Daily SORA overnight rate
 * - 1-Month Compounded SORA
 * - 3-Month Compounded SORA
 * - 6-Month Compounded SORA
 * 
 * Target MAS API:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 * Header required: KeyId: <MAS_KEY_ID>
 */

const MAS_API_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

// In-memory cache to prevent hitting MAS gateway rate limits repeatedly
let cache: {
  timestamp: number;
  data: any[];
} | null = null;

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface NormalizedSoraRecord {
  date: string;
  overnightRate: number;
  compounded1M: number;
  compounded3M: number;
  compounded6M: number;
  soraIndex?: number;
  volumeMillionSGD?: number;
  publishedAt: string;
}

export default async function handler(req: Request, res: Response) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const masKeyId = process.env.MAS_KEY_ID;
  const allowFallback = req.query.fallback !== 'false';
  const forceRefresh = req.query.fresh === 'true';

  // Check if MAS_KEY_ID is present
  if (!masKeyId || masKeyId === 'MY_MAS_KEY_ID') {
    if (!allowFallback) {
      return res.status(401).json({
        error: 'MAS_KEY_ID environment variable is missing or placeholder.',
        message: 'Please set MAS_KEY_ID in your environment (.env file or serverless configuration).',
        docs: 'Requests to MAS API Gateway require the header: KeyId: <MAS_KEY_ID>'
      });
    }

    // Return structured warning with fallback baseline so frontend works gracefully
    return res.status(200).json({
      source: 'unconfigured_key_notice',
      warning: 'MAS_KEY_ID is not configured in the environment. Set MAS_KEY_ID to connect directly to the MAS API Gateway.',
      records: getBaselineFallback(),
      lastUpdated: new Date().toISOString()
    });
  }

  // Check cache first (unless forceRefresh is requested)
  const now = Date.now();
  if (!forceRefresh && cache && (now - cache.timestamp < CACHE_TTL_MS)) {
    return res.status(200).json({
      source: 'cache',
      cachedAt: new Date(cache.timestamp).toISOString(),
      records: cache.data,
      count: cache.data.length
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const rowsParam = typeof req.query.rows === 'string' ? req.query.rows : '30';
    const targetUrl = new URL(MAS_API_ENDPOINT);
    targetUrl.searchParams.set('rows', rowsParam);

    const masResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'KeyId': masKeyId
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!masResponse.ok) {
      const errorText = await masResponse.text();
      console.error(`MAS Gateway returned HTTP ${masResponse.status}:`, errorText);

      if (allowFallback) {
        return res.status(200).json({
          source: 'mas_error_fallback',
          warning: `MAS API returned HTTP ${masResponse.status}. Serving baseline dataset.`,
          statusCode: masResponse.status,
          records: getBaselineFallback()
        });
      }

      return res.status(masResponse.status).json({
        error: 'MAS API Gateway request failed',
        statusCode: masResponse.status,
        details: errorText
      });
    }

    const json = await masResponse.json();
    const rawRecords = extractRecords(json);
    const normalized = normalizeMasRecords(rawRecords);

    // Update in-memory cache
    if (normalized.length > 0) {
      cache = {
        timestamp: now,
        data: normalized
      };
    }

    return res.status(200).json({
      source: 'mas_live_gateway',
      fetchedAt: new Date().toISOString(),
      count: normalized.length,
      records: normalized
    });

  } catch (err: any) {
    console.error('Failed to communicate with MAS API gateway:', err);

    if (allowFallback) {
      return res.status(200).json({
        source: 'network_fallback',
        warning: 'Could not connect to MAS gateway. Serving baseline dataset.',
        error: err.message || 'Network timeout or connection error',
        records: getBaselineFallback()
      });
    }

    return res.status(502).json({
      error: 'Gateway connection error',
      message: err.message || 'Unknown network error occurred while calling MAS endpoint'
    });
  }
}

/**
 * Extract records from varying MAS API response formats
 */
function extractRecords(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json?.result?.records && Array.isArray(json.result.records)) return json.result.records;
  if (json?.data?.records && Array.isArray(json.data.records)) return json.data.records;
  if (json?.data && Array.isArray(json.data)) return json.data;
  if (json?.records && Array.isArray(json.records)) return json.records;
  return [];
}

/**
 * Normalize MAS response fields into standardized SORA format
 */
function normalizeMasRecords(records: any[]): NormalizedSoraRecord[] {
  return records
    .map((r: any) => {
      const date = r.end_of_day || r.date || r.eod || '';
      const overnightRate = parseFloat(r.sora ?? r.overnight_rate ?? r.sora_rate ?? '0');
      const compounded1M = parseFloat(
        r.comp_sora_1m ?? r.compounded_sora_1m ?? r.sora_comp_1m ?? r.compounded_1m ?? '0'
      );
      const compounded3M = parseFloat(
        r.comp_sora_3m ?? r.compounded_sora_3m ?? r.sora_comp_3m ?? r.compounded_3m ?? '0'
      );
      const compounded6M = parseFloat(
        r.comp_sora_6m ?? r.compounded_sora_6m ?? r.sora_comp_6m ?? r.compounded_6m ?? '0'
      );
      const soraIndex = r.sora_index ? parseFloat(r.sora_index) : undefined;
      const volume = r.aggregate_volume ?? r.volume;
      const volumeMillionSGD = volume ? parseFloat(volume) : undefined;

      return {
        date,
        overnightRate,
        compounded1M,
        compounded3M,
        compounded6M,
        soraIndex,
        volumeMillionSGD,
        publishedAt: '09:00 SGT'
      };
    })
    .filter((r) => r.date && !isNaN(r.overnightRate));
}

function getBaselineFallback(): NormalizedSoraRecord[] {
  return [
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
      overnightRate: 3.4800,
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
    }
  ];
}
