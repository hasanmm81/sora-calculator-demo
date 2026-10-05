# Chat History & Project Log: Singapore SORA Loan Calculator

**Date:** 2026-10-05  
**Project:** SORA Loan Calculator Singapore  
**Repository:** [https://github.com/hasanmm81/sora-calculator-demo](https://github.com/hasanmm81/sora-calculator-demo)

---

## Turn 1: Initial Application Build

### User Request
> "Build me a simple Singapore based SORA calculator that reads MAS backed overnight rates for calculating interest payment accurately and efficiently. Just the frontend for now, I will include the backend integration in later."

### Summary of Actions Taken
1. **Domain Research & Specification**:
   - Researched Singapore Overnight Rate Average (SORA) administered by Monetary Authority of Singapore (MAS).
   - Mapped Singapore mortgage convention: Actual/365 compounding method, 1M / 3M / 6M Compounded SORA benchmarks, and overnight interbank rates.
   - Identified Singapore residential loan rules: 75% MAS LTV cap for first property loan, stepped bank spreads (Year 1–3 vs Year 4+), and MAS TDSR 4.0% medium-term stress test floor.

2. **Frontend Architecture & Calculations (`src/utils/soraCalculator.ts`)**:
   - Implemented standard amortization formula:
     $$M = P \frac{r(1+r)^n}{(1+r)^n - 1}$$
   - Implemented MAS Compounding in Arrears calculation:
     $$\text{Compounded SORA} = \left[ \prod_{i=1}^{d_b} \left( 1 + \frac{r_i \times n_i}{365} \right) - 1 \right] \times \frac{365}{d} \times 100\%$$
   - Added support for Stepped Bank Spreads (adjusting amortization after Year 3).
   - Added MAS TDSR 4.00% stress testing with monthly installment buffer calculation.
   - Built annual and monthly amortization breakdown with CSV export functionality.

3. **SORA Data Service (`src/services/soraService.ts`)**:
   - Created decoupled service ready for direct MAS open statistics API and custom backend proxy.
   - Provided authentic recent historical baseline rates for offline/fallback resilience.

4. **UI Components & Features**:
   - `Header.tsx`: Real-time MAS status indicator, rate sync button, formula inspector toggle, backend guide drawer.
   - `BenchmarkBar.tsx`: Interactive cards for 1M Compounded, 3M Compounded (Singapore standard), 6M Compounded, and Overnight SORA.
   - `LoanInputs.tsx`: Presets for HDB Flats, Condos, Landed, and Commercial properties; LTV sliders (55%, 75%, 80%); stepped bank spread toggle; custom rate simulation.
   - `ResultsSummary.tsx`: Monthly payment hero, effective interest rate, principal vs. interest visual stacked bar, MAS stress test indicator, and SVG loan balance trajectory chart.
   - `AmortizationTable.tsx`: Filterable annual schedule with drill-down into all 12 monthly payments per year and CSV export.
   - `RateSensitivity.tsx`: Interest rate hike and cut matrix (-1.00% to +2.00%).
   - `BankPackagesComparison.tsx`: Comparison of DBS, OCBC, UOB floating packages against fixed 2-year packages and HDB concessionary loans.
   - `CompoundingInspector.tsx`: Interactive modal demonstrating the exact MAS Actual/365 daily compounding math and weekend weighting.
   - `BackendIntegrationModal.tsx`: Complete code snippets for Express/Node.js and Python FastAPI, JSON schemas, and a live connection tester.

5. **Verification**:
   - Built and verified with `compile_applet` and `lint_applet` with 0 TypeScript/lint errors.

---

## Turn 2: Git Initialization & Push

### User Request
> `git push https://<GITHUB_PERSONAL_ACCESS_TOKEN>@github.com/hasanmm81/sora-calculator-demo.git`

### Summary of Actions Taken
1. Initialized Git repository at the project root (`/app/applet`).
2. Configured user credentials:
   - Name: `hasanmm81`
   - Email: `hasanmushfique1@gmail.com`
3. Staged all source files respecting `.gitignore` (excluding `node_modules`, `dist`, `.env`).
4. Committed: `Initial commit: Singapore SORA Loan Calculator` (`5025131`).
5. Added remote origin and pushed to `main` branch on GitHub:
   - Remote: `https://github.com/hasanmm81/sora-calculator-demo.git`
6. Sanitized stored remote configuration to remove the personal access token from plaintext `.git/config`.

---

## Turn 3: Serverless MAS API Connection

### User Request
> "add a serverless connection that pulls MAS data using the following end points:
> - Store this in /api folder (at project root level) NOT src file
> - include /health.ts and /sora.ts within the same subfolder
> - do not hardcode any api keys, I will include them manually
> # Daily SORA + compounded 1M/3M/6M averages:
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
> # All requests need the header: KeyId: <MAS_KEY_ID>"

### Summary of Actions Taken
1. **Created `/api/health.ts`**:
   - Serverless health check reporting API status, timestamp, environment, and whether `MAS_KEY_ID` is present.
   - Full CORS support.

2. **Created `/api/sora.ts`**:
   - Connects to the MAS API Gateway endpoint:
     `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
   - Dynamically reads `process.env.MAS_KEY_ID` without hardcoding any keys.
   - Passes required header `KeyId: <MAS_KEY_ID>`.
   - Normalizes data: Overnight SORA, 1M Compounded, 3M Compounded, 6M Compounded, SORA Index, volume.
   - Implemented 15-minute in-memory caching to avoid MAS rate limiting.
   - Included graceful baseline fallback when `MAS_KEY_ID` has not yet been populated by the user.

3. **Created `server.ts` & Scripts**:
   - Full-stack Express runner mounting `/api/health` and `/api/sora` serverless handlers.
   - Integrated with Vite development middleware.
   - Updated `package.json` scripts: `"dev": "tsx server.ts"`, `"start": "tsx server.ts"`.

4. **Updated Frontend Service & Header**:
   - `src/services/soraService.ts` updated to query `/api/sora` by default.
   - `src/components/Header.tsx` updated with `Serverless MAS Gateway` status indicator.
   - Added `MAS_KEY_ID="MY_MAS_KEY_ID"` placeholder to `.env.example`.

5. **Testing & Verification**:
   - Linted and verified compilation (`lint_applet` and `compile_applet`).
   - Verified via `curl` against `http://127.0.0.1:3000/api/health` and `/api/sora`.
   - Committed (`f7267fb`) and pushed to `main` on GitHub.

---

## Turn 4: Export Chat

### User Request
> "export the entire chat as a .md file"

### Action Taken
- Generated `CHAT_HISTORY.md` at project root with complete record of user queries, technical specifications, and executed changes.
