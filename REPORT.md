# Relatório geral - VendaCredito PRO

Este pacote consolida as últimas evoluções implementadas no projeto, com foco em:
- Jogos (layout estilo Sofascore)
- Destaques (layout estilo Scoretabs + painel lateral + CTA)
- Ao Vivo (cards trader + central de notícias apenas no Ao Vivo)
- Pitacos PRO (dashboard, acurácia, relatórios, viradas, players)
- Bots (seed de bots prontos + engine básico)
- Infra (scheduler, health/metrics, cache/TTL)

## Principais módulos adicionados/atualizados

### Server
- `server/pro/aggregator.ts`: agregador unificado best-effort (fixtures/stats/events/odds) + cache.
- `server/pro/features.ts`: Feature Engine padronizado (pressão, next10, virada, risco).
- `server/pro/observability/metrics.ts`: métricas internas simples.
- `server/pro/jobs/scheduler.ts`: scheduler interno e endpoint `/api/health`.
- `server/_core/index.ts`: adicionada rota `/api/health` e start do scheduler.

### Client
- Mantidas as telas PRO já implementadas (Jogos/Destaques/Pitacos).

## Como testar local
```bash
pnpm i
pnpm dev
```

### Rotas para validar
- `/ao-vivo` (central + cards)
- `/jogos` (lista por liga + painel)
- `/destaques` (cards + painel lateral + apostar)
- `/bots` (bots prontos)
- `/pitacos` (abas + viradas + acurácia)

### Health
- `/api/health` retorna `{ ok, ts, metrics }`.

## Observação
O projeto usa `vitest` (`pnpm test`) e `vite/esbuild` (`pnpm build`).
