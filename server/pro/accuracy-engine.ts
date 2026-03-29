/**
 * Accuracy Engine - Avaliação automática de resultados (FT) e cálculo de métricas
 * Persiste snapshots, calcula Brier Score, calibração e ROI
 */

import { getDb } from "../db";
import {
  pickOutcomes,
  matchOutcomes,
  matchFeatureSnapshots,
  tickets,
  ticketOutcomes,
  dailyReports,
} from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { inc, observe } from "./observability/metrics";

export interface PickEvaluation {
  pickId: number;
  topic: string;
  market: string;
  selection: string;
  prediction: number; // 0-100 (confiança)
  outcome: boolean; // true = acerto, false = erro
  brier: number; // (prediction/100 - outcome)^2
  calibrated: boolean;
}

export interface TicketEvaluation {
  ticketId: number;
  userId: number;
  fixtureId: number;
  topicCount: number;
  totalOdd: number;
  stake: number;
  hitsCount: number;
  status: "WON" | "LOST" | "VOID" | "PENDING";
  profit: number;
  roi: number; // profit / stake * 100
  avgConfidence: number;
  avgBrier: number;
}

export interface AccuracyMetrics {
  totalPicks: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number; // 0-100
  avgConfidence: number;
  avgBrier: number; // Calibração
  expectedValue: number; // EV = (hitRate * avgOdd) - 1
  sharpeRatio: number; // Risco/retorno
  byTopic: Record<string, { hits: number; total: number; hitRate: number; brier: number }>;
  byLeague: Record<string, { hits: number; total: number; hitRate: number; brier: number }>;
  byMinute: Record<string, { hits: number; total: number; hitRate: number; brier: number }>;
}

/**
 * Calcular Brier Score (calibração)
 * Brier = (prediction - outcome)^2
 * Menor é melhor (0 = perfeito, 1 = pior)
 */
export function calculateBrierScore(prediction: number, outcome: boolean): number {
  const normalizedPrediction = prediction / 100;
  const outcomeValue = outcome ? 1 : 0;
  return Math.pow(normalizedPrediction - outcomeValue, 2);
}

/**
 * Avaliar um pick individual
 */
export async function evaluatePick(
  pickId: number,
  outcome: boolean,
  prediction: number
): Promise<PickEvaluation> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const brier = calculateBrierScore(prediction, outcome);

  // Atualizar no banco
  await db
    .update(pickOutcomes)
    .set({
      hit: outcome,
      brier: brier.toString(),
    })
    .where(eq(pickOutcomes.id, pickId));

  inc("accuracy_pick_evaluated");

  return {
    pickId,
    topic: "",
    market: "",
    selection: "",
    prediction,
    outcome,
    brier,
    calibrated: brier < 0.25, // Bom se < 0.25
  };
}

/**
 * Avaliar bilhete multi-tópico
 */
export async function evaluateTicket(
  ticketId: number,
  outcomes: Array<{ topicId: number; hit: boolean }>
): Promise<TicketEvaluation> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const ticket = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);

  if (!ticket.length) throw new Error("Ticket not found");

  const t = ticket[0];
  const hitsCount = outcomes.filter((o) => o.hit).length;
  const status =
    hitsCount === outcomes.length
      ? ("WON" as const)
      : hitsCount === 0
        ? ("LOST" as const)
        : ("VOID" as const);

  const totalOdd = Number(t.totalOdd);
  const stake = Number(t.stake);
  const profit =
    status === "WON" ? (totalOdd - 1) * stake : status === "LOST" ? -stake : 0;
  const roi = (profit / stake) * 100;

  // Atualizar ticket
  await db
    .update(tickets)
    .set({
      status,
      profit: profit.toString(),
      roi: roi.toString(),
      finalScore: `${hitsCount}/${outcomes.length}`,
    })
    .where(eq(tickets.id, ticketId));

  // Registrar outcomes
  for (const outcome of outcomes) {
    await db.insert(ticketOutcomes).values({
      ticketId,
      topicId: outcome.topicId,
      hit: outcome.hit,
    });
  }

  inc("accuracy_ticket_evaluated");

  return {
    ticketId,
    userId: t.userId,
    fixtureId: t.fixtureId,
    topicCount: t.topicCount,
    totalOdd,
    stake,
    hitsCount,
    status,
    profit,
    roi,
    avgConfidence: 0, // TODO: calcular de ticketTopics
    avgBrier: 0, // TODO: calcular de pickOutcomes
  };
}

/**
 * Calcular métricas de acurácia para um usuário
 */
export async function calculateAccuracyMetrics(
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<AccuracyMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const conditions = [eq(pickOutcomes.userId, userId)];

  if (startDate && endDate) {
    conditions.push(gte(pickOutcomes.createdAt, startDate));
    conditions.push(lte(pickOutcomes.createdAt, endDate));
  }

  const picks = await db
    .select()
    .from(pickOutcomes)
    .where(and(...conditions));

  const totalPicks = picks.length;
  const totalHits = picks.filter((p) => p.hit).length;
  const totalMisses = totalPicks - totalHits;
  const hitRate = totalPicks > 0 ? (totalHits / totalPicks) * 100 : 0;

  const avgConfidence = totalPicks > 0
    ? picks.reduce((acc, p) => acc + (p.confidence || 0), 0) / totalPicks
    : 0;

  const avgBrier = totalPicks > 0
    ? picks.reduce((acc, p) => acc + (Number(p.brier) || 0), 0) / totalPicks
    : 0;

  // Agrupar por tópico, liga, minuto
  const byTopic: Record<string, any> = {};
  const byLeague: Record<string, any> = {};
  const byMinute: Record<string, any> = {};

  for (const pick of picks) {
    // Por tópico
    const topic = pick.topic || "unknown";
    if (!byTopic[topic]) byTopic[topic] = { hits: 0, total: 0, brierSum: 0 };
    byTopic[topic].total += 1;
    if (pick.hit) byTopic[topic].hits += 1;
    byTopic[topic].brierSum += Number(pick.brier) || 0;

    // Por liga
    const league = pick.market || "unknown";
    if (!byLeague[league]) byLeague[league] = { hits: 0, total: 0, brierSum: 0 };
    byLeague[league].total += 1;
    if (pick.hit) byLeague[league].hits += 1;
    byLeague[league].brierSum += Number(pick.brier) || 0;

    // Por minuto
    const minute = new Date(pick.createdAt).getMinutes();
    const minuteKey = `${Math.floor(minute / 10) * 10}-${Math.floor(minute / 10) * 10 + 10}`;
    if (!byMinute[minuteKey]) byMinute[minuteKey] = { hits: 0, total: 0, brierSum: 0 };
    byMinute[minuteKey].total += 1;
    if (pick.hit) byMinute[minuteKey].hits += 1;
    byMinute[minuteKey].brierSum += Number(pick.brier) || 0;
  }

  // Calcular hit rates e brier por grupo
  const byTopicFormatted: Record<string, any> = {};
  for (const [key, data] of Object.entries(byTopic)) {
    byTopicFormatted[key] = {
      hits: data.hits,
      total: data.total,
      hitRate: (data.hits / data.total) * 100,
      brier: data.brierSum / data.total,
    };
  }

  const byLeagueFormatted: Record<string, any> = {};
  for (const [key, data] of Object.entries(byLeague)) {
    byLeagueFormatted[key] = {
      hits: data.hits,
      total: data.total,
      hitRate: (data.hits / data.total) * 100,
      brier: data.brierSum / data.total,
    };
  }

  const byMinuteFormatted: Record<string, any> = {};
  for (const [key, data] of Object.entries(byMinute)) {
    byMinuteFormatted[key] = {
      hits: data.hits,
      total: data.total,
      hitRate: (data.hits / data.total) * 100,
      brier: data.brierSum / data.total,
    };
  }

  // Calcular Expected Value (EV)
  const avgOdd = 1.8; // TODO: calcular real do banco
  const expectedValue = (hitRate / 100) * avgOdd - 1;

  // Calcular Sharpe Ratio (simplificado)
  const variance = picks.length > 0
    ? picks.reduce((acc, p) => acc + Math.pow((p.hit ? 1 : 0) - hitRate / 100, 2), 0) /
      picks.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? expectedValue / stdDev : 0;

  inc("accuracy_metrics_calculated");
  observe("accuracy_hit_rate", hitRate);
  observe("accuracy_brier_score", avgBrier);

  return {
    totalPicks,
    totalHits,
    totalMisses,
    hitRate,
    avgConfidence,
    avgBrier,
    expectedValue,
    sharpeRatio,
    byTopic: byTopicFormatted,
    byLeague: byLeagueFormatted,
    byMinute: byMinuteFormatted,
  };
}

/**
 * Gerar relatório diário (08:00)
 */
export async function generateDailyReport(
  userId: number,
  reportDate: Date
): Promise<{
  totalPicks: number;
  totalHits: number;
  hitRate: number;
  avgConfidence: number;
  avgBrier: number;
  topTopics: Array<{ name: string; hitRate: number }>;
}> {
  const startOfDay = new Date(reportDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(reportDate);
  endOfDay.setHours(23, 59, 59, 999);

  const metrics = await calculateAccuracyMetrics(userId, startOfDay, endOfDay);

  // Top 5 tópicos por hit rate
  const topTopics = Object.entries(metrics.byTopic)
    .map(([name, data]) => ({ name, hitRate: data.hitRate }))
    .sort((a, b) => b.hitRate - a.hitRate)
    .slice(0, 5);

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Persistir relatório
  await db.insert(dailyReports).values({
    userId,
    reportDate,
    totalMatches: metrics.totalPicks,
    totalPicks: metrics.totalPicks,
    totalHits: metrics.totalHits,
    totalMisses: metrics.totalMisses,
    hitRate: metrics.hitRate.toString(),
    byLeague: JSON.stringify(metrics.byLeague),
    byMarket: JSON.stringify(metrics.byTopic),
    avgConfidence: metrics.avgConfidence.toString(),
    avgBrier: metrics.avgBrier.toString(),
  });

  inc("daily_report_generated");

  return {
    totalPicks: metrics.totalPicks,
    totalHits: metrics.totalHits,
    hitRate: metrics.hitRate,
    avgConfidence: metrics.avgConfidence,
    avgBrier: metrics.avgBrier,
    topTopics,
  };
}

/**
 * Persistir snapshot de features para análise posterior
 */
export async function persistFeatureSnapshot(
  fixtureId: number,
  features: any,
  minute: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(matchFeatureSnapshots).values({
    fixtureId,
    minute,
    features: JSON.stringify(features),
    createdAt: new Date(),
  });

  inc("feature_snapshot_persisted");
}
