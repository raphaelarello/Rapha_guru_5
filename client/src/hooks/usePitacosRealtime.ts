/**
 * Hook para Pitacos Realtime - Atualização com patches sem flicker
 * Usa setQueryData do React Query para aplicar patches incrementais
 */

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

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

/**
 * Aplicar patches ao estado anterior sem recarregar
 */
function applyPatches(
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
 * Hook para atualizar snapshots ao vivo com patches
 */
export function usePitacosRealtime(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const liveGamesQuery = trpc.pitacos.getLiveGames.useQuery(
    { limit: 20 },
    { enabled, refetchInterval: false } // Desabilitar refetch automático
  );

  // Polling manual a cada 30s
  const pollLiveGames = useCallback(async () => {
    try {
      const result = await trpc.pitacos.getLiveGames.fetch({ limit: 20 });

      if (result && result.snapshots) {
        // Aplicar patches ao cache
        queryClient.setQueryData(
          [["pitacos", "getLiveGames"], { input: { limit: 20 }, type: "query" }],
          (oldData: any) => {
            if (!oldData) return result;

            // Aplicar patches para atualização incremental
            const updated = applyPatches(oldData.snapshots, result.patches || []);

            // Highlight mudanças por 2s
            if (result.patches && result.patches.length > 0) {
              for (const patch of result.patches) {
                if (patch.highlights.length > 0) {
                  console.log(`[realtime] ${patch.highlights.join(", ")}`);
                }
              }
            }

            return { snapshots: updated, patches: result.patches };
          }
        );

        lastUpdateRef.current = Date.now();
      }
    } catch (error) {
      console.error("[usePitacosRealtime] Polling error:", error);
    }
  }, [queryClient]);

  // Iniciar polling
  useEffect(() => {
    if (!enabled) return;

    // Fetch inicial
    pollLiveGames();

    // Polling a cada 30s
    intervalRef.current = setInterval(pollLiveGames, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, pollLiveGames]);

  return {
    data: liveGamesQuery.data?.snapshots || [],
    patches: liveGamesQuery.data?.patches || [],
    isLoading: liveGamesQuery.isLoading,
    error: liveGamesQuery.error,
    lastUpdate: lastUpdateRef.current,
  };
}

/**
 * Hook para termômetro com animação
 */
export function useHeatScoreAnimation(heatScore: number) {
  const getHeatColor = useCallback((score: number): string => {
    if (score > 75) return "bg-red-600"; // 🔥 Muito quente
    if (score > 50) return "bg-orange-500"; // 🌡️ Quente
    return "bg-blue-500"; // ❄️ Frio
  }, []);

  const getHeatLabel = useCallback((score: number): string => {
    if (score > 75) return "🔥 MUITO QUENTE";
    if (score > 50) return "🌡️ QUENTE";
    return "❄️ FRIO";
  }, []);

  return {
    color: getHeatColor(heatScore),
    label: getHeatLabel(heatScore),
    percentage: Math.min(100, heatScore),
  };
}

/**
 * Hook para notificações de highlights
 */
export function useHighlightNotifications() {
  const highlightQueueRef = useRef<string[]>([]);
  const displayTimeRef = useRef<NodeJS.Timeout | null>(null);

  const showHighlight = useCallback((highlights: string[]) => {
    highlightQueueRef.current = highlights;

    // Limpar timeout anterior
    if (displayTimeRef.current) clearTimeout(displayTimeRef.current);

    // Mostrar por 2s
    displayTimeRef.current = setTimeout(() => {
      highlightQueueRef.current = [];
    }, 2000);
  }, []);

  return {
    highlights: highlightQueueRef.current,
    showHighlight,
  };
}

/**
 * Hook para cache de snapshots com histórico
 */
export function useSnapshotHistory(limit: number = 100) {
  const historyRef = useRef<Map<number, RealtimeSnapshot[]>>(new Map());

  const addSnapshot = useCallback((snapshot: RealtimeSnapshot) => {
    const fixtureId = snapshot.fixtureId;
    const history = historyRef.current.get(fixtureId) || [];

    history.push(snapshot);

    // Manter apenas últimos N snapshots
    if (history.length > limit) {
      history.shift();
    }

    historyRef.current.set(fixtureId, history);
  }, [limit]);

  const getHistory = useCallback((fixtureId: number): RealtimeSnapshot[] => {
    return historyRef.current.get(fixtureId) || [];
  }, []);

  const getSnapshot = useCallback(
    (fixtureId: number, minutesAgo: number = 0): RealtimeSnapshot | undefined => {
      const history = getHistory(fixtureId);
      if (history.length === 0) return undefined;

      const targetTime = Date.now() - minutesAgo * 60_000;
      return history.reduce((closest, current) => {
        const closestDiff = Math.abs(closest.lastUpdate - targetTime);
        const currentDiff = Math.abs(current.lastUpdate - targetTime);
        return currentDiff < closestDiff ? current : closest;
      });
    },
    [getHistory]
  );

  return {
    addSnapshot,
    getHistory,
    getSnapshot,
  };
}
