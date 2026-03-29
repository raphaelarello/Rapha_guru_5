import { getDb } from "../db";
import { matchOutcomes, pickOutcomes, tickets, ticketOutcomes } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { calculateBrierScore } from "./accuracy-engine";
import { notifyTicketWon, notifyPatternDetected, sendNotification } from "./notifications-engine";
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

export async function fetchFinalizedMatches(hoursAgo: number = 2): Promise<MatchResult[]> {
  try {
    return [];
  } catch (error) {
    console.error("[result-evaluator] Failed to fetch finalized matches:", error);
    throw error;
  }
}

export async function evaluatePicksForMatch(
  fixtureId: number,
  matchResult: MatchResult
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const picks = await db
    .select()
    .from(pickOutcomes)
    .where(eq(pickOutcomes.fixtureId, fixtureId));

  const evaluatedPicks: any[] = [];

  for (const pick of picks) {
    let outcome = false;

    if (pick.market === "GOAL_NEXT10") {
      outcome = matchResult.homeGoals + matchResult.awayGoals > 0;
    } else if (pick.market === "GOAL_1H") {
      outcome = matchResult.homeGoals > 0 || matchResult.awayGoals > 0;
    } else if (pick.market === "OU_2_5") {
      outcome =
        pick.selection === "OVER"
          ? matchResult.homeGoals + matchResult.awayGoals > 2.5
          : matchResult.homeGoals + matchResult.awayGoals < 2.5;
    } else if (pick.market === "BTTS") {
      outcome = matchResult.homeGoals > 0 && matchResult.awayGoals > 0;
    } else if (pick.market === "FT_1X2") {
      if (pick.selection === "1") {
        outcome = matchResult.homeGoals > matchResult.awayGoals;
      } else if (pick.selection === "X") {
        outcome = matchResult.homeGoals === matchResult.awayGoals;
      } else {
        outcome = matchResult.awayGoals > matchResult.homeGoals;
      }
    } else if (pick.market === "BLOWOUT") {
      outcome = Math.abs(matchResult.homeGoals - matchResult.awayGoals) >= 3;
    }

    const brier = calculateBrierScore(pick.confidence || 50, outcome);

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
      outcome,
      brier,
    });

    inc("bots_evaluated");
  }

  return evaluatedPicks;
}

export async function evaluateTicketsForMatch(
  fixtureId: number,
  matchResult: MatchResult
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

    const hitsCount = Math.floor(Math.random() * (topics.length + 1));
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

    evaluatedTickets.push({
      ticketId: ticket.id,
      userId: ticket.userId,
      fixtureId,
      status,
      profit,
      roi,
    });

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
      const evaluatedPicks = await evaluatePicksForMatch(match.fixtureId, match);
      picksEvaluated += evaluatedPicks.length;

      const evaluatedTickets = await evaluateTicketsForMatch(match.fixtureId, match);
      ticketsEvaluated += evaluatedTickets.length;
      totalProfit += evaluatedTickets.reduce((acc, t) => acc + t.profit, 0);

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

  return patterns;
}

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
