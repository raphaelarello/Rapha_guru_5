/**
 * Realtime Patch Engine - Com dados reais da API-Football
 * Busca snapshots ao vivo, calcula patches e Heat Score real
 */

import {
  fetchLiveMatches,
  fetchMatchesByDate,
  fetchMatchStatistics,
  transformFixtureToSnapshot,
  transformFixtureToMatchResult,
} from "../services/football-api-client";
import { inc, observe } from "./observability/metrics";

export interface RealtimeSnapshot {
  fixtureId: number;
  leagueName?: string;
  homeName: string;
  awayName: string;
  minute: number;
  status: "LIVE" | "UPCOMING" | "FINISHED";
  scoreHome: number;
  scoreAway: number;
  heatScore: number;
  heatLevel: string;
  pressureScore: number;
  next10: any;
  riskFlags: string[];
  lastUpdate: number;
}

export interface RealtimePatch {
  fixtureId: number;
  changes: Record<string, any>;
  timestamp: number;
  highlights: string[];
}

// Cache de snapshots anteriores para calcular patches
const snapshotCache = new Map<number, RealtimeSnapshot>();

/**
 * Calcular patches entre snapshots anterior e atual
 */
function calculatePatches(
  oldSnapshots: RealtimeSnapshot[],
  newSnapshots: RealtimeSnapshot[]
): RealtimePatch[] {
  const patches: RealtimePatch[] = [];
  const newMap = new Map(newSnapshots.map((s) => [s.fixtureId, s]));

  for (const newSnapshot of newSnapshots) {
    const oldSnapshot = snapshotCache.get(newSnapshot.fixtureId);

    if (!oldSnapshot) {
      // Novo jogo ao vivo
      patches.push({
        fixtureId: newSnapshot.fixtureId,
        changes: newSnapshot,
        timestamp: Date.now(),
        highlights: [`⚽ ${newSnapshot.homeName} vs ${newSnapshot.awayName} começou!`],
      });
      continue;
    }

    const changes: Record<string, any> = {};
    const highlights: string[] = [];

    // Detectar mudanças
    if (newSnapshot.scoreHome !== oldSnapshot.scoreHome) {
      changes.scoreHome = newSnapshot.scoreHome;
      highlights.push(`⚽ GOL! ${newSnapshot.homeName} ${newSnapshot.scoreHome}:${newSnapshot.scoreAway}`);
    }

    if (newSnapshot.scoreAway !== oldSnapshot.scoreAway) {
      changes.scoreAway = newSnapshot.scoreAway;
      highlights.push(`⚽ GOL! ${newSnapshot.awayName} ${newSnapshot.scoreHome}:${newSnapshot.scoreAway}`);
    }

    if (newSnapshot.minute !== oldSnapshot.minute) {
      changes.minute = newSnapshot.minute;
    }

    if (newSnapshot.heatScore !== oldSnapshot.heatScore) {
      changes.heatScore = newSnapshot.heatScore;
      if (newSnapshot.heatScore > 75 && oldSnapshot.heatScore <= 75) {
        highlights.push(`🔥 MUITO QUENTE! Heat Score ${newSnapshot.heatScore}%`);
      }
    }

    if (highlights.length > 0) {
      patches.push({
        fixtureId: newSnapshot.fixtureId,
        changes,
        timestamp: Date.now(),
        highlights,
      });
    }
  }

  // Atualizar cache
  for (const snapshot of newSnapshots) {
    snapshotCache.set(snapshot.fixtureId, snapshot);
  }

  return patches;
}

/**
 * Buscar snapshots ao vivo com dados reais da API
 */
export async function getRealtimeSnapshots(date: string): Promise<{
  snapshots: RealtimeSnapshot[];
  patches: RealtimePatch[];
}> {
  try {
    // Buscar jogos ao vivo
    const liveMatches = await fetchLiveMatches();

    if (liveMatches.length === 0) {
      inc("cache_miss");
      return { snapshots: [], patches: [] };
    }

    // Transformar em snapshots
    const snapshots: RealtimeSnapshot[] = [];

    for (const fixture of liveMatches) {
      try {
        // Buscar estatísticas para calcular Heat Score real
        const stats = await fetchMatchStatistics(fixture.fixture.id);

        const snapshot = transformFixtureToSnapshot(fixture, stats);
        snapshots.push(snapshot);
      } catch (error) {
        console.error(`[realtime-patch] Error processing fixture ${fixture.fixture.id}:`, error);
      }
    }

    // Calcular patches
    const oldSnapshots = Array.from(snapshotCache.values());
    const patches = calculatePatches(oldSnapshots, snapshots);

    observe("live_snapshots_count", snapshots.length);
    observe("patches_count", patches.length);
    inc("cache_hit");

    return { snapshots, patches };
  } catch (error) {
    console.error("[realtime-patch] Error getting realtime snapshots:", error);
    inc("api_errors");
    return { snapshots: [], patches: [] };
  }
}

/**
 * Buscar rankings de ligas com dados reais
 */
export async function getLeagueRankings(date: string): Promise<any[]> {
  try {
    const matches = await fetchMatchesByDate(date);

    // Agrupar por liga e calcular estatísticas
    const leagueStats: Record<string, any> = {};

    for (const fixture of matches) {
      const league = fixture.league?.name || "Unknown";
      if (!leagueStats[league]) {
        leagueStats[league] = {
          league,
          totalMatches: 0,
          totalGoals: 0,
          totalCorners: 0,
          totalCards: 0,
          avgHeatScore: 0,
        };
      }

      leagueStats[league].totalMatches += 1;
      leagueStats[league].totalGoals += (fixture.goals?.home || 0) + (fixture.goals?.away || 0);

      // TODO: Buscar estatísticas detalhadas para corners e cartões
    }

    const rankings = Object.values(leagueStats)
      .map((stat: any) => ({
        ...stat,
        avgGoals: (stat.totalGoals / Math.max(1, stat.totalMatches)).toFixed(2),
      }))
      .sort((a: any, b: any) => b.totalGoals - a.totalGoals);

    observe("league_rankings_count", rankings.length);
    inc("cache_hit");

    return rankings;
  } catch (error) {
    console.error("[realtime-patch] Error getting league rankings:", error);
    inc("api_errors");
    return [];
  }
}

/**
 * Buscar jogos do dia
 */
export async function getTodayMatches(date: string): Promise<RealtimeSnapshot[]> {
  try {
    const matches = await fetchMatchesByDate(date);

    const snapshots = matches.map((fixture) => transformFixtureToSnapshot(fixture));

    observe("today_matches_count", snapshots.length);
    inc("cache_hit");

    return snapshots;
  } catch (error) {
    console.error("[realtime-patch] Error getting today matches:", error);
    inc("api_errors");
    return [];
  }
}

/**
 * Limpar cache de snapshots
 */
export function clearSnapshotCache(): void {
  snapshotCache.clear();
  console.log("[realtime-patch] Snapshot cache cleared");
}
