import type { Request, Response } from 'express';

/**
 * Health check endpoint for the MAS SORA serverless service.
 * Stored in /api/health.ts at root level.
 */
export default async function handler(req: Request, res: Response) {
  // Allow basic CORS if called across origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const masKeyConfigured = Boolean(process.env.MAS_KEY_ID && process.env.MAS_KEY_ID !== 'MY_MAS_KEY_ID');

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MAS SORA Serverless API Gateway',
    environment: process.env.NODE_ENV || 'development',
    masKeyConfigured,
    endpoints: {
      health: '/api/health',
      sora: '/api/sora'
    }
  });
}
