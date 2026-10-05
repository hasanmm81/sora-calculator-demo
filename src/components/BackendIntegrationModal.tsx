import React, { useState } from 'react';
import { X, Check, Copy, Terminal, Server, ArrowRight, Code } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customBackendUrl: string;
  onSaveBackendUrl: (url: string) => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  customBackendUrl,
  onSaveBackendUrl,
}) => {
  const [urlInput, setUrlInput] = useState(customBackendUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'express' | 'python' | 'json_schema'>('express');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestStatus('failed');
      setTestMessage('Please enter a valid URL.');
      return;
    }
    setTestStatus('testing');
    try {
      const res = await fetch(urlInput.trim(), { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTestStatus('success');
      setTestMessage(`Connected successfully! Found ${Array.isArray(data) ? data.length : 1} records.`);
    } catch (e: any) {
      setTestStatus('failed');
      setTestMessage(`Connection test failed: ${e.message}. (Ensure CORS headers are enabled)`);
    }
  };

  const handleSave = () => {
    onSaveBackendUrl(urlInput.trim());
    onClose();
  };

  const expressSnippet = `// server.ts / express endpoint
import express from 'express';
import axios from 'axios';

const app = express();
const MAS_API = 'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf149-308b-4618-9732-75b4fe1335b5&sort=end_of_day%20desc&limit=30';

let cachedSora: any = null;
let lastFetch = 0;

app.get('/api/sora', async (req, res) => {
  try {
    const now = Date.now();
    // Cache for 1 hour to stay under rate limits
    if (cachedSora && now - lastFetch < 3600000) {
      return res.json(cachedSora);
    }

    const response = await axios.get(MAS_API, { timeout: 5000 });
    const records = response.data.result.records.map((r: any) => ({
      date: r.end_of_day,
      overnightRate: parseFloat(r.sora),
      compounded1M: parseFloat(r.comp_sora_1m),
      compounded3M: parseFloat(r.comp_sora_3m),
      compounded6M: parseFloat(r.comp_sora_6m),
      volumeMillionSGD: parseFloat(r.aggregate_volume || 0),
      publishedAt: '09:00 SGT'
    }));

    cachedSora = records;
    lastFetch = now;
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch MAS SORA rates' });
  }
});`;

  const pythonSnippet = `# FastAPI / Flask backend example
from fastapi import FastAPI, HTTPException
import httpx
import time

app = FastAPI()
MAS_API = "https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf149-308b-4618-9732-75b4fe1335b5&sort=end_of_day%20desc&limit=30"

@app.get("/api/sora")
async def get_sora_rates():
    async with httpx.AsyncClient() as client:
        res = await client.get(MAS_API)
        if res.status_code != 200:
            raise HTTPException(status_code=502, detail="MAS API unavailable")
        
        data = res.json()["result"]["records"]
        return [
            {
                "date": row["end_of_day"],
                "overnightRate": float(row["sora"]),
                "compounded1M": float(row["comp_sora_1m"]),
                "compounded3M": float(row["comp_sora_3m"]),
                "compounded6M": float(row["comp_sora_6m"]),
                "volumeMillionSGD": float(row.get("aggregate_volume", 0)),
            }
            for row in data
        ]`;

  const jsonSnippet = `// Expected JSON Response Schema for /api/sora
[
  {
    "date": "2026-10-02",
    "overnightRate": 3.2450,
    "compounded1M": 3.2815,
    "compounded3M": 3.3420,
    "compounded6M": 3.3910,
    "volumeMillionSGD": 4320
  }
]`;

  const getActiveCode = () => {
    if (activeTab === 'express') return expressSnippet;
    if (activeTab === 'python') return pythonSnippet;
    return jsonSnippet;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 text-slate-200 relative shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Backend API Integration Hook
              </h3>
              <p className="text-xs text-slate-400">
                Ready-to-connect endpoints for your future backend proxy or data pipeline
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

        {/* Custom Backend URL input */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
            Connect Custom Backend Endpoint
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="e.g. /api/sora or http://localhost:4000/api/sora"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {testMessage && (
            <p className={`text-[11px] ${testStatus === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {testMessage}
            </p>
          )}
        </div>

        {/* Code Snippets for Quick Copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('express')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'express' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                Express / Node.js
              </button>
              <button
                onClick={() => setActiveTab('python')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'python' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                Python FastAPI
              </button>
              <button
                onClick={() => setActiveTab('json_schema')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeTab === 'json_schema' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                JSON Schema
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed">
            {getActiveCode()}
          </pre>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Save Endpoint
          </button>
        </div>
      </div>
    </div>
  );
};
