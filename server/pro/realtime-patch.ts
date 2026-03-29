/**
 * Realtime Patch Engine - Atualização a cada 30s sem flicker
 * Usa diff/patch no cache do front via setQueryData
 */

import { cacheManager } from "../cache-manager";
import { aggregateForPitacos, AggregatedFixture } from "./aggregator";
import { computeFeatures } from "./features";
import { inc } from "./observability/metrics";

export type RealtimePatch = {
  fixtureId: number;
  changes: {
    minute?: number;
    scoreHome?: number;
    scoreAway?: number;
    pressureScore?: number;
    heatScore?: number;
    next10?: any;
    riskFlags?: string[];
  };
  timestamp: number;
  highlights: string[]; // O que mudou (para highlight 2s)
};

export type RealtimeSnapshot = {
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
};

const REALTIME_CACHE_KEY = "realtime:fixtures";
const REALTIME_TTL = 35_000; // 35s para cobrir 30s + margem

/**
 * Calcular heat score (0-100) para termômetro
 */
function calculateHeatScore(fixture: AggregatedFixture): number {
  if (!fixture.features) return 0;
  const features = fixture.features;
  const pressureWeight = 0.6;
  const goalProbWeight = 0.4;
  const goalProb = (features.next10 as any)?.goalProb || 0;
  const heatScore = (features.pressureScore * pressureWeight + goalProb * goalProbWeight);
  return Math.round(Math.max(0, Math.min(100, heatScore)));
}

/**
 * Converter fixture para snapshot realtime
 */
function fixtureToSnapshot(fixture: AggregatedFixture): RealtimeSnapshot {
  const heatScore = calculateHeatScore(fixture);
  const heatLevel =
    heatScore > 75
      ? "🔥 MUITO QUENTE"
      : heatScore > 50
        ? "🌡️ QUENTE"
        : "❄️ FRIO";

  return {
    fixtureId: fixture.fixtureId,
    leagueName: fixture.leagueName,
    homeName: fixture.homeName,
    awayName: fixture.awayName,
    minute: fixture.minute,
    status: fixture.status,
    scoreHome: fixture.scoreHome,
    scoreAway: fixture.scoreAway,
    heatScore,
    heatLevel,
    pressureScore: fixture.features?.pressureScore || 0,
    next10: fixture.features?.next10 || {},
    riskFlags: fixture.features?.riskFlags || [],
    lastUpdate: Date.now(),
  };
}

/**
 * Detectar mudanças entre dois snapshots
 */
function detectChanges(
  oldSnapshot: RealtimeSnapshot | undefined,
  newSnapshot: RealtimeSnapshot
): { patch: RealtimePatch; highlights: string[] } {
  const highlights: string[] = [];
  const changes: RealtimePatch["changes"] = {};

  if (!oldSnapshot) {
    // Primeira atualização
    return {
      patch: {
        fixtureId: newSnapshot.fixtureId,
        changes: {
          minute: newSnapshot.minute,
          scoreHome: newSnapshot.scoreHome,
          scoreAway: newSnapshot.scoreAway,
          pressureScore: newSnapshot.pressureScore,
          heatScore: newSnapshot.heatScore,
        },
        timestamp: newSnapshot.lastUpdate,
        highlights: ["Jogo iniciado"],
      },
      highlights: ["Jogo iniciado"],
    };
  }

  // Detectar mudanças
  if (oldSnapshot.minute !== newSnapshot.minute) {
    changes.minute = newSnapshot.minute;
    highlights.push(`⏱️ ${newSnapshot.minute}'`);
  }

  if (oldSnapshot.scoreHome !== newSnapshot.scoreHome) {
    changes.scoreHome = newSnapshot.scoreHome;
    highlights.push(`⚽ ${newSnapshot.homeName} marcou!`);
  }

  if (oldSnapshot.scoreAway !== newSnapshot.scoreAway) {
    changes.scoreAway = newSnapshot.scoreAway;
    highlights.push(`⚽ ${newSnapshot.awayName} marcou!`);
  }

  if (Math.abs(oldSnapshot.pressureScore - newSnapshot.pressureScore) > 10) {
    changes.pressureScore = newSnapshot.pressureScore;
    highlights.push(`📊 Pressão mudou para ${newSnapshot.pressureScore}%`);
  }

  if (oldSnapshot.heatScore !== newSnapshot.heatScore) {
    changes.heatScore = newSnapshot.heatScore;
    highlights.push(`🌡️ Heat: ${newSnapshot.heatLevel}`);
  }

  if (JSON.stringify(oldSnapshot.riskFlags) !== JSON.stringify(newSnapshot.riskFlags)) {
    changes.riskFlags = newSnapshot.riskFlags;
    if (newSnapshot.riskFlags.length > 0) {
      highlights.push(`⚠️ ${newSnapshot.riskFlags[0]}`);
    }
  }

  return {
    patch: {
      fixtureId: newSnapshot.fixtureId,
      changes,
      timestamp: newSnapshot.lastUpdate,
      highlights,
    },
    highlights,
  };
}

/**
 * Obter snapshots ao vivo com patches (realtime)
 */
export async function getRealtimeSnapshots(
  date: string
): Promise<{ snapshots: RealtimeSnapshot[]; patches: RealtimePatch[] }> {
  try {
    // Tentar cache primeiro
    const cached = cacheManager.get(REALTIME_CACHE_KEY) as
      | { snapshots: RealtimeSnapshot[]; patches: RealtimePatch[]; timestamp: number }
      | undefined;

    const fixtures = await aggregateForPitacos(date);
    const liveFixtures = fixtures.filter((f) => f.status === "LIVE");

    const newSnapshots = liveFixtures.map(fixtureToSnapshot);
    const patches: RealtimePatch[] = [];

    if (cached && Date.now() - cached.timestamp < 2000) {
      // Cache ainda válido, calcular patches
      const oldSnapshotMap = new Map(cached.snapshots.map((s) => [s.fixtureId, s]));

      for (const newSnapshot of newSnapshots) {
        const oldSnapshot = oldSnapshotMap.get(newSnapshot.fixtureId);
        const { patch } = detectChanges(oldSnapshot, newSnapshot);
        if (Object.keys(patch.changes).length > 0) {
          patches.push(patch);
        }
      }

      inc("realtime_patch_hit");
    } else {
      // Cache expirado ou não existe, retornar snapshots completos
      inc("realtime_patch_miss");
    }

    const result = { snapshots: newSnapshots, patches };
    cacheManager.set(REALTIME_CACHE_KEY, { ...result, timestamp: Date.now() }, REALTIME_TTL);

    return result;
  } catch (error) {
    console.error("[realtime-patch] Error:", error);
    throw error;
  }
}

/**
 * Aplicar patches no front (pseudo-código para o frontend)
 * No frontend: queryClient.setQueryData(['pitacos', 'getLiveGames'], (old) => applyPatches(old, patches))
 */
export function applyPatches(
  oldSnapshots: RealtimeSnapshot[],
  patches: RealtimePatch[]
): RealtimeSnapshot[] {
  const snapshotMap = new Map(oldSnapshots.map((s) => [s.fixtureId, s]));

  for (const patch of patches) {
    const snapshot = snapshotMap.get(patch.fixtureId);
    if (snapshot) {
      snapshotMap.set(patch.fixtureId, {
        ...snapshot,
        ...patch.changes,
        lastUpdate: patch.timestamp,
      });
    }
  }

  return Array.from(snapshotMap.values());
}

/**
 * Ranking dinâmico por liga/horário (top performers)
 */
export interface LeagueRanking {
  leagueName: string;
  totalMatches: number;
  hotMatches: number; // heat > 75
  avgHeatScore: number;
  topFixtures: RealtimeSnapshot[];
}

export async function getLeagueRankings(date: string): Promise<LeagueRanking[]> {
  const { snapshots } = await getRealtimeSnapshots(date);

  const byLeague = new Map<string, RealtimeSnapshot[]>();
  for (const snapshot of snapshots) {
    const league = snapshot.leagueName || "Unknown";
    if (!byLeague.has(league)) {
      byLeague.set(league, []);
    }
    byLeague.get(league)!.push(snapshot);
  }

  const rankings: LeagueRanking[] = [];
  for (const [league, fixtures] of byLeague.entries()) {
    const hotMatches = fixtures.filter((f) => f.heatScore > 75).length;
    const avgHeatScore = fixtures.reduce((acc, f) => acc + f.heatScore, 0) / fixtures.length;
    const topFixtures = fixtures.sort((a, b) => b.heatScore - a.heatScore).slice(0, 3);

    rankings.push({
      leagueName: league,
      totalMatches: fixtures.length,
      hotMatches,
      avgHeatScore: Math.round(avgHeatScore),
      topFixtures,
    });
  }

  return rankings.sort((a, b) => b.avgHeatScore - a.avgHeatScore);
}
