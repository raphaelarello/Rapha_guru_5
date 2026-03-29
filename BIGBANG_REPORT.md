# Big Bang Package Status

Generated: 2026-03-29T00:33:34.745295Z

This package adds *dual-mode workers* (embedded or separate processes) and a WhatsApp provider scaffolding (Baileys + whatsapp-web.js) behind a plug-in interface.

## Workers

- `WORKERS_MODE=embedded` (default):
  - Web process starts:
    - `startScheduler()` (pro/jobs/scheduler)
    - `startPitacosScheduler()` (daily 08:00 + eval 30m)
    - `botCron.start()` (bots tick)

- `WORKERS_MODE=separate`:
  - Web process disables internal schedulers.
  - Run workers separately using:
    - `pnpm worker:bots`
    - `pnpm worker:pitacos`
    - `pnpm worker:all`

## WhatsApp Provider Plug-in

Scaffolding added:
- `server/bots/providers/whatsapp/provider.ts` (interface)
- `BaileysProvider` and `WebJsProvider` placeholders
- `getWhatsAppProvider()` reads `WHATSAPP_PROVIDER=baileys|webjs`

> To fully enable WhatsApp QR flow, you still need to install the provider deps and implement session persistence + QR streaming endpoints.

## What is still pending for a true "planet #1" release

The following large items are **not fully implemented** in this package:

1) Full Feature Engine unification across all routers/telas (some calculations remain duplicated)
2) Realtime **diff apply** everywhere (some screens still refetch)
3) Production-grade Bots delivery hub:
   - queue/retry/dead-letter
   - rate limits per user/channel
   - WhatsApp QR sessions
4) Historical ingestion worker for full-season datasets (requires quota + long-running jobs)
5) "Acurácia por bilhete" advanced scoring across multi-topic tickets
6) Full observability: quotas, p95 latency, cache hit rate, dashboards

This report is included so you can verify scope and avoid false assumptions.
