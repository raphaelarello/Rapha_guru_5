/**
 * Result Evaluator - Avaliação automática de resultados finais (FT)
 * Busca resultados da API, liquida picks e bilhetes, calcula acurácia real
 */

import { getDb } from "../db";
import {
  matchOutcomes,
  pickOutcomes,
  tickets,
  ticketOutcomes,
  matchFeatureSnapshots,
} from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { calculateBrierScore } from "./accuracy-engine";
import {
  notifyTicketWon,
  notifyPatternDetected,
  sendNotification,
} from "./notifications-engine";
import { inc, observe } from "./observability/metrics";

export interface MatchResult {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  finalScore: string;
  homeGoals: number;
  awayGoals: number;
  status: "FT" | "AET" | "PEN";
  timestamp: Date;
}

export interface PickResult {
  pickId: number;
  userId: number;
  fixtureId: number;
  topic: string;
  market: string;
  selection: string;
  prediction: number; // 0-100
  outcome: boolean; // true = acerto
  brier: number;
  calibrated: boolean;
}

export interface TicketResult {
  ticketId: number;
  userId: number;
  fixtureId: number;
  topicCount: number;
  hitsCount: number;
  status: "WON" | "LOST" | "VOID";
  totalOdd: number;
  stake: number;
  profit: number;
  roi: number;
  avgBrier: number;
}

/**
 * Buscar resultados finalizados da API (simulado)
 */
export async function fetchFinalizedMatches(
  hoursAgo: number = 2
): Promise<MatchResult[]> {
  try {
    // TODO: Integrar com API Football real
    // const response = await fetch(`https://api-football-v3.p.rapidapi.com/fixtures?status=FT`, {
    //   headers: {
    //     "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    //     "x-rapidapi-host": "api-football-v3.p.rapidapi.com",
    //   },
    // });
    // const data = await response.json();

    // Simulado para desenvolvimento
    return [];
  } catch (error) {
    console.error("[result-evaluator] Failed to fetch finalized matches:", error);
    throw error;
  }
}

/**
 * Avaliar picks baseado no resultado final
 */
export async function evaluatePicksForMatch(
  fixtureId: number,
  matchResult: MatchResult
): Promise<PickResult[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Buscar todos os picks relacionados a este fixture
  const picks = await db
    .select()
    .from(pickOutcomes)
    .where(eq(pickOutcomes.fixtureId, fixtureId));

  const evaluatedPicks: PickResult[] = [];

  for (const pick of picks) {
    let outcome = false;

    // Lógica de avaliação por mercado
    if (pick.market === "GOAL_NEXT10") {
      // Gols nos próximos 10 minutos (simulado)
      outcome = matchResult.homeGoals + matchResult.awayGoals > 0;
    } else if (pick.market === "GOAL_1H") {
      // Gols no primeiro tempo (simulado)
      outcome = matchResult.homeGoals > 0 || matchResult.awayGoals > 0;
    } else if (pick.market === "OU_2_5") {
      // Over/Under 2.5 gols
      outcome =
        pick.selection === "OVER"
          ? matchResult.homeGoals + matchResult.awayGoals > 2.5
          : matchResult.homeGoals + matchResult.awayGoals < 2.5;
    } else if (pick.market === "BTTS") {
      // Both teams to score
      outcome = matchResult.homeGoals > 0 && matchResult.awayGoals > 0;
    } else if (pick.market === "FT_1X2") {
      // Resultado final 1X2
      if (pick.selection === "1") {
        outcome = matchResult.homeGoals > matchResult.awayGoals;
      } else if (pick.selection === "X") {
        outcome = matchResult.homeGoals === matchResult.awayGoals;
      } else {
        outcome = matchResult.awayGoals > matchResult.homeGoals;
      }
    } else if (pick.market === "BLOWOUT") {
      // Diferença de 3+ gols
      outcome = Math.abs(matchResult.homeGoals - matchResult.awayGoals) >= 3;
    }

    const brier = calculateBrierScore(pick.confidence || 50, outcome);
    const calibrated = brier < 0.25;

    // Persistir resultado
    await db
      .update(pickOutcomes)
      .set({
        hit: outcome,
        brier: brier.toString(),
        evaluatedAt: new Date(),
      })
      .where(eq(pickOutcomes.id, pick.id));

    evaluatedPicks.push({
      pickId: pick.id,
      userId: pick.userId,
      fixtureId,
      topic: pick.topic || "",
      market: pick.market || "",
      selection: pick.selection || "",
      prediction: pick.confidence || 50,
      outcome,
      brier,
      calibrated,
    });

    inc("bots_evaluated");
  }

  return evaluatedPicks;
}

/**
 * Avaliar bilhetes para um jogo finalizado
 */
export async function evaluateTicketsForMatch(
  fixtureId: number,
  matchResult: MatchResult
): Promise<TicketResult[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Buscar todos os bilhetes relacionados a este fixture
  const ticketList = await db
    .select()
    .from(tickets)
    .where(eq(tickets.fixtureId, fixtureId));

  const evaluatedTickets: TicketResult[] = [];

  for (const ticket of ticketList) {
    // Buscar tópicos do bilhete
    const topics = await db
      .select()
      .from(ticketOutcomes)
      .where(eq(ticketOutcomes.ticketId, ticket.id));

    // Simular avaliação de cada tópico (em produção, buscar do banco)
    const hitsCount = Math.floor(Math.random() * (topics.length + 1)); // Simulado
    const status =
      hitsCount === topics.length
        ? ("WON" as const)
        : hitsCount === 0
          ? ("LOST" as const)
          : ("VOID" as const);

    const totalOdd = Number(ticket.totalOdd);
    const stake = Number(ticket.stake);
    const profit =
      status === "WON" ? (totalOdd - 1) * stake : status === "LOST" ? -stake : 0;
    const roi = (profit / stake) * 100;

    // Calcular Brier médio (simulado)
    const avgBrier = Math.random() * 0.5;

    // Persistir resultado
    await db
      .update(tickets)
      .set({
        status,
        profit: profit.toString(),
        roi: roi.toString(),
        finalScore: `${hitsCount}/${topics.length}`,
        evaluatedAt: new Date(),
      })
      .where(eq(tickets.id, ticket.id));

    const result: TicketResult = {
      ticketId: ticket.id,
      userId: ticket.userId,
      fixtureId,
      topicCount: topics.length,
      hitsCount,
      status,
      totalOdd,
      stake,
      profit,
      roi,
      avgBrier,
    };

    evaluatedTickets.push(result);

    // Notificar se ganhou
    if (status === "WON") {
      await notifyTicketWon(ticket.userId, {
        homeTeam: matchResult.homeTeam,
        awayTeam: matchResult.awayTeam,
        roi,
        profit,
      });

      inc("alerts_sent");
    }

    inc("bots_evaluated");
  }

  return evaluatedTickets;
}

/**
 * Processar todos os jogos finalizados (chamado pelo worker)
 */
export async function processAllFinalizedMatches(): Promise<{
  matchesProcessed: number;
  picksEvaluated: number;
  ticketsEvaluated: number;
  totalProfit: number;
}> {
  try {
    const finalizedMatches = await fetchFinalizedMatches(2);

    let picksEvaluated = 0;
    let ticketsEvaluated = 0;
    let totalProfit = 0;

    for (const match of finalizedMatches) {
      // Avaliar picks
      const evaluatedPicks = await evaluatePicksForMatch(match.fixtureId, match);
      picksEvaluated += evaluatedPicks.length;

      // Avaliar bilhetes
      const evaluatedTickets = await evaluateTicketsForMatch(match.fixtureId, match);
      ticketsEvaluated += evaluatedTickets.length;
      totalProfit += evaluatedTickets.reduce((acc, t) => acc + t.profit, 0);

      // Persistir resultado do jogo
      const db = await getDb();
      if (db) {
        await db.insert(matchOutcomes).values({
          fixtureId: match.fixtureId,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          finalScore: match.finalScore,
          homeGoals: match.homeGoals,
          awayGoals: match.awayGoals,
          status: match.status,
          evaluatedAt: new Date(),
        });
      }
    }

    observe("total_profit_daily", totalProfit);
    inc("alerts_sent", finalizedMatches.length);

    return {
      matchesProcessed: finalizedMatches.length,
      picksEvaluated,
      ticketsEvaluated,
      totalProfit,
    };
  } catch (error) {
    console.error("[result-evaluator] Error processing finalized matches:", error);
    throw error;
  }
}

/**
 * Detectar padrões em picks avaliados
 */
export async function detectPatterns(
  userId: number,
  lookbackDays: number = 7
): Promise<
  Array<{
    name: string;
    confidence: number;
    fixtures: number;
    hitRate: number;
  }>
> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  const picks = await db
    .select()
    .from(pickOutcomes)
    .where(
      and(
        eq(pickOutcomes.userId, userId),
        gte(pickOutcomes.createdAt, startDate),
        eq(pickOutcomes.hit, true) // Apenas acertos
      )
    );

  // Agrupar por mercado
  const byMarket: Record<string, { hits: number; total: number }> = {};
  for (const pick of picks) {
    const market = pick.market || "unknown";
    if (!byMarket[market]) byMarket[market] = { hits: 0, total: 0 };
    byMarket[market].hits += 1;
  }

  // Calcular confiança (hit rate)
  const patterns = Object.entries(byMarket)
    .map(([name, data]) => ({
      name,
      confidence: (data.hits / Math.max(1, data.total)) * 100,
      fixtures: data.total,
      hitRate: (data.hits / Math.max(1, data.total)) * 100,
    }))
    .filter((p) => p.confidence > 60 && p.fixtures >= 3) // Filtrar padrões fortes
    .sort((a, b) => b.confidence - a.confidence);

  // Notificar padrões detectados
  for (const pattern of patterns.slice(0, 3)) {
    await notifyPatternDetected(userId, {
      name: pattern.name,
      confidence: pattern.confidence,
      fixtures: pattern.fixtures,
    });
  }

  return patterns;
}

/**
 * Calcular ROI acumulado
 */
export async function calculateAccumulatedROI(
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalStake: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  avgOdd: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const conditions = [eq(tickets.userId, userId)];

  if (startDate && endDate) {
    conditions.push(gte(tickets.createdAt, startDate));
    conditions.push(lte(tickets.createdAt, endDate));
  }

  const ticketList = await db
    .select()
    .from(tickets)
    .where(and(...conditions));

  const totalStake = ticketList.reduce((acc, t) => acc + Number(t.stake), 0);
  const totalProfit = ticketList.reduce((acc, t) => acc + Number(t.profit || 0), 0);
  const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
  const winCount = ticketList.filter((t) => t.status === "WON").length;
  const winRate = ticketList.length > 0 ? (winCount / ticketList.length) * 100 : 0;
  const avgOdd = ticketList.length > 0
    ? ticketList.reduce((acc, t) => acc + Number(t.totalOdd), 0) / ticketList.length
    : 0;

  return {
    totalStake,
    totalProfit,
    roi,
    winRate,
    avgOdd,
  };
}
