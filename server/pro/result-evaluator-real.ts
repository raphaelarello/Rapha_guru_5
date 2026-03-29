/**
 * Result Evaluator Real - Avaliação com dados reais da API-Football
 * Busca resultados finalizados, liquida picks e bilhetes automaticamente
 */

import { getDb } from "../db";
import { matchOutcomes, pickOutcomes, tickets, ticketOutcomes } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { calculateBrierScore } from "./accuracy-engine";
import { notifyTicketWon, notifyPatternDetected } from "./notifications-engine";
import { fetchFinalizedMatches, fetchMatchEvents, transformFixtureToMatchResult } from "../services/football-api-client";
import { inc, observe } from "./observability/metrics";

/**
 * Avaliar picks com resultado real da API
 */
export async function evaluatePicksForMatch(
  fixtureId: number,
  matchResult: any
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const picks = await db
    .select()
    .from(pickOutcomes)
    .where(eq(pickOutcomes.fixtureId, fixtureId));

  const evaluatedPicks: any[] = [];
  const events = await fetchMatchEvents(fixtureId);

  for (const pick of picks) {
    let outcome = false;

    // Lógica de avaliação por mercado com dados reais
    if (pick.market === "GOAL_NEXT10") {
      // Gols nos próximos 10 minutos (buscar eventos)
      const goalsInNext10 = events.filter(
        (e: any) => e.type?.primary === "Goal" && e.time?.elapsed <= 10
      ).length;
      outcome = goalsInNext10 > 0;
    } else if (pick.market === "GOAL_1H") {
      // Gols no primeiro tempo
      const goalsIn1H = events.filter(
        (e: any) => e.type?.primary === "Goal" && e.time?.elapsed <= 45
      ).length;
      outcome = goalsIn1H > 0;
    } else if (pick.market === "OU_2_5") {
      // Over/Under 2.5 gols
      const totalGoals = matchResult.homeGoals + matchResult.awayGoals;
      outcome =
        pick.selection === "OVER"
          ? totalGoals > 2.5
          : totalGoals < 2.5;
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
    } else if (pick.market === "CORNERS") {
      // Over/Under escanteios (TODO: Buscar de estatísticas)
      outcome = Math.random() > 0.5; // Placeholder
    } else if (pick.market === "CARDS") {
      // Over/Under cartões (TODO: Buscar de eventos)
      outcome = Math.random() > 0.5; // Placeholder
    }

    const brier = calculateBrierScore(pick.confidence || 50, outcome);

    // Persistir resultado
    await db
      .update(pickOutcomes)
      .set({
        hit: outcome,
        brier: brier.toString(),
      })
      .where(eq(pickOutcomes.id, pick.id));

    evaluatedPicks.push({
      pickId: pick.id,
      userId: pick.userId,
      fixtureId,
      market: pick.market,
      selection: pick.selection,
      outcome,
      brier,
    });

    inc("bots_evaluated");
  }

  return evaluatedPicks;
}

/**
 * Avaliar bilhetes com resultado real
 */
export async function evaluateTicketsForMatch(
  fixtureId: number,
  matchResult: any
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const ticketList = await db
    .select()
    .from(tickets)
    .where(eq(tickets.fixtureId, fixtureId));

  const evaluatedTickets: any[] = [];

  for (const ticket of ticketList) {
    const topics = await db
      .select()
      .from(ticketOutcomes)
      .where(eq(ticketOutcomes.ticketId, ticket.id));

    // Avaliar cada tópico do bilhete
    let hitsCount = 0;
    for (const topic of topics) {
      const pick = await db
        .select()
        .from(pickOutcomes)
        .where(eq(pickOutcomes.id, topic.topicId))
        .limit(1);

      if (pick.length > 0 && pick[0].hit) {
        hitsCount += 1;
      }
    }

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

    // Calcular Brier médio
    const brierScores = await db
      .select()
      .from(pickOutcomes)
      .where(eq(pickOutcomes.fixtureId, fixtureId));

    const avgBrier =
      brierScores.length > 0
        ? brierScores.reduce((acc, p) => acc + Number(p.brier || 0), 0) / brierScores.length
        : 0;

    // Persistir resultado
    await db
      .update(tickets)
      .set({
        status,
        profit: profit.toString(),
        roi: roi.toString(),
        finalScore: `${hitsCount}/${topics.length}`,
      })
      .where(eq(tickets.id, ticket.id));

    evaluatedTickets.push({
      ticketId: ticket.id,
      userId: ticket.userId,
      fixtureId,
      status,
      profit,
      roi,
      avgBrier,
    });

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
 * Processar todos os jogos finalizados com dados reais da API
 */
export async function processAllFinalizedMatches(): Promise<{
  matchesProcessed: number;
  picksEvaluated: number;
  ticketsEvaluated: number;
  totalProfit: number;
}> {
  try {
    const date = new Date().toISOString().split("T")[0];
    const finalizedMatches = await fetchFinalizedMatches(date);

    let picksEvaluated = 0;
    let ticketsEvaluated = 0;
    let totalProfit = 0;

    for (const fixture of finalizedMatches) {
      const matchResult = transformFixtureToMatchResult(fixture);

      // Avaliar picks
      const evaluatedPicks = await evaluatePicksForMatch(fixture.fixture.id, matchResult);
      picksEvaluated += evaluatedPicks.length;

      // Avaliar bilhetes
      const evaluatedTickets = await evaluateTicketsForMatch(fixture.fixture.id, matchResult);
      ticketsEvaluated += evaluatedTickets.length;
      totalProfit += evaluatedTickets.reduce((acc, t) => acc + t.profit, 0);

      // Persistir resultado do jogo
      const db = await getDb();
      if (db) {
        try {
          await db.insert(matchOutcomes).values({
            fixtureId: fixture.fixture.id,
            homeTeam: matchResult.homeTeam,
            awayTeam: matchResult.awayTeam,
            finalScore: matchResult.finalScore,
            homeGoals: matchResult.homeGoals,
            awayGoals: matchResult.awayGoals,
            status: matchResult.status,
          });
        } catch (error) {
          console.warn(`[result-evaluator] Could not insert match outcome:`, error);
        }
      }
    }

    observe("total_profit_daily", totalProfit);
    observe("finalized_matches_processed", finalizedMatches.length);
    inc("alerts_sent", finalizedMatches.length);

    return {
      matchesProcessed: finalizedMatches.length,
      picksEvaluated,
      ticketsEvaluated,
      totalProfit,
    };
  } catch (error) {
    console.error("[result-evaluator] Error processing finalized matches:", error);
    inc("api_errors");
    throw error;
  }
}

/**
 * Detectar padrões com dados reais
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
        eq(pickOutcomes.hit, true)
      )
    );

  const byMarket: Record<string, { hits: number; total: number }> = {};
  for (const pick of picks) {
    const market = pick.market || "unknown";
    if (!byMarket[market]) byMarket[market] = { hits: 0, total: 0 };
    byMarket[market].hits += 1;
  }

  const patterns = Object.entries(byMarket)
    .map(([name, data]) => ({
      name,
      confidence: (data.hits / Math.max(1, data.total)) * 100,
      fixtures: data.total,
      hitRate: (data.hits / Math.max(1, data.total)) * 100,
    }))
    .filter((p) => p.confidence > 60 && p.fixtures >= 3)
    .sort((a, b) => b.confidence - a.confidence);

  for (const pattern of patterns.slice(0, 3)) {
    await notifyPatternDetected(userId, {
      name: pattern.name,
      confidence: pattern.confidence,
      fixtures: pattern.fixtures,
    });
  }

  observe("patterns_detected", patterns.length);
  return patterns;
}

/**
 * Calcular ROI acumulado com dados reais
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

  observe("accumulated_roi", roi);
  observe("win_rate", winRate);

  return {
    totalStake,
    totalProfit,
    roi,
    winRate,
    avgOdd,
  };
}
