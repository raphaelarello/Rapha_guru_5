# 🚀 Guia de Integração: API-Football.com v3 para Pitacos Engine

Este documento detalha os passos técnicos para substituir os dados simulados do **Pitacos Engine** por dados reais da [API-Football.com](https://www.api-football.com/documentation-v3).

---

## 🔑 1. Configuração de Credenciais

O primeiro passo é configurar as variáveis de ambiente no arquivo `.env` do projeto:

```env
# API-Football.com (RapidAPI ou Direto)
FOOTBALL_API_KEY=seu_api_key_aqui
FOOTBALL_API_HOST=api-football-v3.p.rapidapi.com
FOOTBALL_API_BASE_URL=https://api-football-v3.p.rapidapi.com/v3
```

---

## 📡 2. Mapeamento de Endpoints Críticos

Para que o Pitacos Engine funcione em sua plenitude, os seguintes endpoints devem ser integrados:

| Funcionalidade | Endpoint API-Football | Frequência Recomendada |
| :--- | :--- | :--- |
| **Hoje (Upcoming)** | `/fixtures?date={YYYY-MM-DD}` | 1x a cada 15 min |
| **Ao Vivo (Live)** | `/fixtures?live=all` | **A cada 30-60 segundos** |
| **Estatísticas (Realtime)** | `/fixtures/statistics?fixture={id}` | A cada 60 segundos (jogos quentes) |
| **Eventos (Gols/Cartões)** | `/fixtures/events?fixture={id}` | A cada 60 segundos |
| **Resultados (FT)** | `/fixtures?status=FT&date={YYYY-MM-DD}` | 1x a cada 5 min (pós-jogo) |
| **Odds (Histórico)** | `/odds?fixture={id}` | 1x por jogo (pré-live) |

---

## ⚙️ 3. Refatoração dos Motores (Backend)

### 3.1. `realtime-patch.ts`
Substituir a geração de snapshots randômicos por uma chamada ao endpoint `/fixtures?live=all`.
- **Dica:** Use o campo `events` e `statistics` para calcular o **Heat Score** real.
- **Lógica de Pressão:** Calcule a pressão baseada em `Shots on Goal`, `Corners` e `Dangerous Attacks` dos últimos 5-10 minutos.

### 3.2. `result-evaluator-complete.ts`
Implementar a função `fetchFinalizedMatches` para buscar jogos com status `FT`.
- **Liquidação:** Compare o `finalScore` da API com a `selection` do pick no banco de dados.
- **Automação:** O worker já está agendado para rodar a cada 5 minutos; ele apenas precisa da fonte de dados real.

---

## 🛡️ 4. Estratégia de Cache e Rate Limiting

A API-Football possui limites de requisições. Para o Pitacos Engine ser escalável:

1.  **Cache de 30s:** Nunca chame a API para o mesmo fixture em menos de 30 segundos.
2.  **Batching:** Use o endpoint `/fixtures?live=all` para obter todos os jogos ao vivo em uma única chamada, em vez de chamar um por um.
3.  **Priorização:** Atualize estatísticas detalhadas (chutes, posse) apenas para jogos com **Heat Score > 50**.

---

## 📊 5. Cálculo do Heat Score Real

Para o seu "terminal trader", o Heat Score deve ser calculado assim:

```typescript
// Exemplo de fórmula sugerida
const pressure = (stats.dangerousAttacks * 0.5) + (stats.shotsOnGoal * 2.0) + (stats.corners * 1.5);
const heatScore = Math.min(100, (pressure / matchMinute) * 10);
```

---

## 🛠️ 6. Checklist de Implementação

- [ ] Criar cliente HTTP (Axios/Fetch) com retry logic para a API.
- [ ] Mapear IDs de ligas da API para as ligas internas do Pitacos.
- [ ] Implementar parser de estatísticas (transformar JSON da API em `RealtimeSnapshot`).
- [ ] Validar liquidação de picks `GOAL_NEXT10` usando o timestamp dos eventos da API.
- [ ] Ativar logs de observabilidade para monitorar o consumo da cota da API.

---

**O Pitacos Engine está pronto para receber estes dados. A estrutura de banco de dados e UI já suporta 100% desta integração.** 🚀
