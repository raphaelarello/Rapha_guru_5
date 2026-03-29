# 📊 Pitacos Engine - Documentação Técnica Completa

**Versão:** 1.0.0  
**Data:** 29 de Março de 2026  
**Status:** ✅ Produção

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Componentes Principais](#componentes-principais)
4. [Guia de Uso](#guia-de-uso)
5. [API Endpoints](#api-endpoints)
6. [Configuração](#configuração)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Pitacos Engine** é um sistema profissional de análise e previsão de resultados de futebol, operando como um "Terminal Trader" em tempo real. Integra dados reais da API-Football.com v3, calcula métricas científicas (Índice de Acurácia/Brier Score) e fornece recomendações de apostas com confiança calibrada.

### Características Principais

- ✅ **Realtime:** Atualização de dados a cada 30 segundos
- ✅ **Termômetro Dinâmico:** Índice de Pressão (🔥 Muito Quente > 75%, 🌡️ Quente 50-75%, ❄️ Frio < 50%)
- ✅ **Índice de Acurácia:** Brier Score para calibração científica
- ✅ **ROI Real:** Cálculo de lucro e taxa de retorno
- ✅ **Modo Telão:** Exibição em TV com auto-rotate a cada 30s
- ✅ **Relatórios Matinais:** Resumo automático às 08:00
- ✅ **Observabilidade:** Dashboard de monitoramento em tempo real
- ✅ **100% Português:** Interface totalmente em português brasileiro

---

## 🏗️ Arquitetura

### Stack Tecnológico

```
Frontend (React + TypeScript)
├── PitacosAdvanced.tsx (6 abas: Hoje, Ao Vivo, Ligas, Jogadores, Acurácia, Telão)
├── PitacosObservability.tsx (Dashboard de monitoramento)
└── PitacosTelao.tsx (Modo TV com auto-rotate)

Backend (Node.js + tRPC)
├── server/services/football-api-client.ts (Cliente HTTP com cache)
├── server/pro/realtime-patch-real.ts (Snapshots em tempo real)
├── server/pro/result-evaluator-real.ts (Avaliação FT automática)
├── server/pro/accuracy-engine.ts (Cálculo de Brier Score)
├── server/pro/notifications-engine.ts (Alertas multi-canal)
├── server/pro/workers.ts (Fila de jobs assíncrona)
└── server/pro/relatorio-matinal.ts (Gerador de relatórios)

Database (Drizzle + MySQL/TiDB)
├── matchOutcomes (Resultados finalizados)
├── pickOutcomes (Análises individuais com Brier Score)
├── tickets (Bilhetes multi-tópico)
├── dailyReports (Relatórios matinais)
└── 7 outras tabelas de suporte
```

---

## 🔧 Componentes Principais

### 1. Cliente da API-Football (`football-api-client.ts`)

**Responsabilidade:** Gerenciar requisições HTTP com cache e retry logic.

```typescript
// Endpoints principais
fetchLiveMatches()          // Jogos ao vivo
fetchMatchesByDate(date)    // Jogos de um dia
fetchMatchStatistics(id)    // Estatísticas de pressão
fetchMatchEvents(id)        // Eventos (gols, cartões)
fetchFinalizedMatches(date) // Jogos finalizados (FT)
```

**Cache:** TTL de 30 segundos para evitar estourar rate limit.

### 2. Motor de Realtime (`realtime-patch-real.ts`)

**Responsabilidade:** Calcular snapshots ao vivo e patches sem flicker.

**Índice de Pressão (Heat Score):**
```
Heat Score = (Chutes a Gol × 2.0) + (Ataques Perigosos × 0.5) + (Escanteios × 1.5)
```

**Saída:** Snapshots com campos:
- `fixtureId`, `leagueName`, `homeName`, `awayName`
- `minute`, `status` (LIVE/UPCOMING/FINISHED)
- `scoreHome`, `scoreAway`
- `heatScore` (0-100), `heatLevel` (🔥/🌡️/❄️)
- `pressureScore`, `riskFlags`

### 3. Avaliador de Resultados (`result-evaluator-real.ts`)

**Responsabilidade:** Liquidar picks e bilhetes automaticamente após FT.

**Lógica por Mercado:**
- `GOAL_NEXT10`: Gols nos primeiros 10 minutos
- `OU_2_5`: Over/Under 2.5 gols
- `BTTS`: Ambos os times marcaram
- `FT_1X2`: Resultado final 1X2
- `BLOWOUT`: Diferença ≥ 3 gols

**Saída:** Atualização de `hit` e `brier` em `pickOutcomes`.

### 4. Motor de Acurácia (`accuracy-engine.ts`)

**Responsabilidade:** Calcular métricas científicas de calibração.

**Índice de Acurácia (Brier Score):**
```
Brier Score = (prediction/100 - outcome)²
```

**Interpretação:**
- < 0.25: Excelente calibração ✅
- 0.25-0.35: Bom ✓
- > 0.35: Requer ajuste ⚠️

**Outras Métricas:**
- **Expected Value (EV):** (hitRate × avgOdd) - 1
- **Sharpe Ratio:** EV / stdDev (risco/retorno)
- **Win Rate:** Bilhetes ganhos / total

### 5. Motor de Notificações (`notifications-engine.ts`)

**Responsabilidade:** Enviar alertas multi-canal.

**Canais Suportados:**
- Telegram
- WhatsApp
- Email
- Web (push notification)

**Anti-spam:** Máximo 3 notificações/minuto por dedupeKey.

### 6. Workers Assíncrono (`workers.ts`)

**Responsabilidade:** Executar tarefas em background.

**Jobs Agendados:**
- `realtime_update`: A cada 30 segundos
- `evaluate_results`: A cada 5 minutos
- `generate_report`: Diariamente às 08:00
- `notify_users`: Sob demanda

**Fila:** MAX_CONCURRENT = 5 jobs simultâneos.

### 7. Gerador de Relatórios (`relatorio-matinal.ts`)

**Responsabilidade:** Produzir relatórios matinais em Markdown/HTML.

**Conteúdo:**
- Resumo geral (total picks, acertos, taxa)
- Resultados financeiros (lucro, ROI, taxa de vitória)
- Análise por mercado (melhor/pior desempenho)
- Padrões detectados (confiança > 70%)
- Próximas oportunidades
- Alertas críticos

---

## 📱 Guia de Uso

### 1. Página "Hoje" (Jogos Futuros)

Exibe todos os jogos do dia com status, odds e análise preliminar.

**Filtros:** Status (Próximos, Ao Vivo, Finalizados)

### 2. Página "Ao Vivo" (Termômetro)

Mostra jogos em tempo real com termômetro dinâmico.

**Atualização:** A cada 30 segundos via patches.

**Cores:**
- 🔥 Vermelho: Heat Score > 75% (muito quente)
- 🌡️ Laranja: Heat Score 50-75% (quente)
- ❄️ Azul: Heat Score < 50% (frio)

### 3. Página "Ligas" (Rankings)

Rankings de ligas por métrica (gols, escanteios, cartões, etc).

**Atualização:** A cada 15 minutos.

### 4. Página "Jogadores" (Quentes/Indisciplinados)

Jogadores em forma ou com histórico de cartões.

### 5. Página "Acurácia" (Índices)

Índice de Acurácia (Brier Score) por mercado.

**Agrupamento:** Por tópico, liga, mês ou minuto.

### 6. Página "Telão" (Modo TV)

Modo fullscreen com auto-rotate a cada 30 segundos.

**Telas:**
1. Jogos Ao Vivo (3x3 grid)
2. Rankings de Ligas (gráficos)
3. Índice de Acurácia (detalhes)
4. Oportunidades Altas (confiança > 80%)
5. Relatório Matinal (resumo 08:00)

---

## 🔌 API Endpoints

### Pitacos Router (`/api/trpc/pitacos.*`)

#### Queries

| Procedure | Input | Output | Descrição |
|-----------|-------|--------|-----------|
| `getTodayGames` | `{date?, status?}` | `RealtimeSnapshot[]` | Jogos do dia |
| `getLiveGames` | `{limit}` | `{snapshots, patches}` | Jogos ao vivo |
| `getLeagueRankings` | `{metric, limit}` | `League[]` | Rankings |
| `getHotPlayers` | `{tipo, limit}` | `Player[]` | Jogadores quentes |
| `getAccuracyMetrics` | `{groupBy, startDate?, endDate?}` | `AccuracyMetrics` | Índices |
| `getScreenData` | `{widget}` | `any` | Dados para telão |
| `getMetricsSnapshot` | - | `Metrics` | Snapshot de métricas |
| `getApiMetrics` | `{timeRange}` | `ApiMetrics` | Métricas da API |
| `getSystemStatus` | - | `SystemStatus` | Status do sistema |
| `getRecentEvents` | `{limit, type}` | `Event[]` | Eventos recentes |
| `getCriticalAlerts` | - | `Alert[]` | Alertas críticos |

#### Mutations

| Procedure | Input | Output | Descrição |
|-----------|-------|--------|-----------|
| `create` | `{jogo, mercado, odd, analise, confianca}` | `Pitaco` | Criar pick |
| `update` | `{id, resultado}` | `Pitaco` | Atualizar resultado |
| `evaluatePick` | `{pickId, outcome, prediction}` | `PickEvaluation` | Avaliar pick |
| `createTicket` | `{fixtureId, topics, stake}` | `Ticket` | Criar bilhete |
| `evaluateTicket` | `{ticketId, finalScore, outcomes}` | `TicketEvaluation` | Avaliar bilhete |
| `generateDailyReport` | `{date?}` | `DailyReport` | Gerar relatório |
| `sendNotification` | `{channels, priority, title, message}` | `Notification` | Enviar alerta |
| `processResults` | - | `ProcessResult` | Processar resultados FT |

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# API-Football.com
FOOTBALL_API_KEY=3d65c1d86af5cf41505092eb69471f41
FOOTBALL_API_HOST=api-football-v3.p.rapidapi.com
FOOTBALL_API_BASE_URL=https://api-football-v3.p.rapidapi.com/v3

# Database
DATABASE_URL=mysql://user:password@localhost/pitacos

# Notificações
TELEGRAM_BOT_TOKEN=seu_token
TELEGRAM_CHAT_ID=seu_chat_id
WHATSAPP_API_KEY=sua_chave
EMAIL_SERVICE=seu_servico
```

### Agendamento de Workers

Workers são agendados automaticamente:

```typescript
// Realtime updates a cada 30s
enqueueJob("realtime_update", userId, { date });

// Avaliação de resultados a cada 5 min
enqueueJob("evaluate_results", userId);

// Relatório matinal às 08:00
enqueueJob("generate_report", userId, { date });
```

---

## 🔍 Troubleshooting

### Problema: Taxa de sucesso da API < 95%

**Solução:**
1. Verificar cota da API (máximo 100 requisições/minuto)
2. Aumentar TTL do cache para 60 segundos
3. Reduzir frequência de atualização de estatísticas detalhadas

### Problema: Heat Score não atualiza

**Solução:**
1. Verificar se `realtime_update` job está na fila
2. Confirmar que `fetchMatchStatistics` retorna dados
3. Validar cálculo: (Chutes × 2.0) + (Ataques × 0.5) + (Escanteios × 1.5)

### Problema: Brier Score > 0.35

**Solução:**
1. Aumentar confiança mínima para picks
2. Revisar calibração de odds
3. Analisar padrões de erro por mercado

### Problema: Fila de workers acumulada

**Solução:**
1. Aumentar `MAX_CONCURRENT` de 5 para 10
2. Reduzir frequência de `realtime_update`
3. Verificar logs de erro em `handleRealtimeUpdate`

---

## 📊 Métricas Importantes

### KPIs de Negócio

- **ROI:** Lucro / Total Apostado
- **Win Rate:** Bilhetes Ganhos / Total
- **Avg Odd:** Multiplicador médio
- **Expected Value:** (Win Rate × Avg Odd) - 1

### KPIs Técnicos

- **API Success Rate:** > 97%
- **Cache Hit Rate:** > 80%
- **Avg Latency:** < 150ms
- **Worker Queue Length:** < 20 jobs

### KPIs de Acurácia

- **Brier Score:** < 0.25 (excelente)
- **Calibration:** Confiança vs. Taxa Real
- **Sharpe Ratio:** EV / StdDev > 1.0

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consultar logs em `server/logs/`
2. Verificar métricas no Dashboard de Observabilidade
3. Revisar documentação técnica
4. Contatar time de desenvolvimento

---

**Desenvolvido com ❤️ pelo Pitacos Engine Team**

*Última atualização: 29 de Março de 2026*
