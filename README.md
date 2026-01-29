# Brno Reservoir Ice Skating Status Page

Next.js app that scrapes ice conditions for Brněnská přehrada (Prygl) from prygl.net and presents a clear, color-coded skating status with Czech/English toggle.

## Features
- Server-side scraping of prygl.net (Windows-1250 decoding)
- Status logic: safe / not ready / off-season (stale data becomes off-season)
- Seasonal off-season messaging
- Czech + English UI with remembered language
- Auto-refresh in the browser every 10 minutes
- Debug dashboard for mock data overrides

## Requirements
- Node.js 18+

## Setup
```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Debug mode
```bash
DEBUG_MODE=1 npm run dev
```
Open http://localhost:3000/debug to override status data.

## Configuration
Environment variables:
- `MIN_SAFE_CM` (default: 12)
- `MIN_CAUTION_CM` (default: 10)
- `STALE_DAYS` (default: 7)
- `CACHE_TTL_MS` (default: 43200000)
- `DEBUG_MODE=1` to enable the debug dashboard at `/debug`

## Endpoints
- `GET /api/status` – JSON status
- `POST /api/refresh` – manual refresh
- `GET/POST /api/debug` – debug overrides (DEBUG_MODE only)
- `POST /api/debug/reset` – reset debug overrides (DEBUG_MODE only)

## Notes
The scraper looks for the “Stav ledu na přehradě” section on prygl.net. If the page layout changes, update `lib/status.ts` parsing logic.
