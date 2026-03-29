import { useEffect, useRef, useState, useCallback } from "react";
import type { MatchSummary } from "@/components/live/match-helpers";

type NotificationPrefs = {
  enabled: boolean;
  gols: boolean;
  cartaoVermelho: boolean;
  oportunidades: boolean;
};

const STORAGE_KEY = "rapha_notif_prefs";
const SEEN_KEY = "rapha_notif_seen";

function getPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, gols: true, cartaoVermelho: true, oportunidades: true };
}

function savePrefs(p: NotificationPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function addSeenId(id: string) {
  const seen = getSeenIds();
  seen.add(id);
  // Keep only last 500 to avoid bloat
  const arr = Array.from(seen).slice(-500);
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

async function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function sendNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: `rapha-${Date.now()}`,
      silent: false,
    });
  } catch {}
}

export function useGoalNotifications(matches: MatchSummary[]) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(getPrefs);
  const [permissionGranted, setPermissionGranted] = useState(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );
  const prevMatchesRef = useRef<Map<number, { homeScore: number; awayScore: number; redCards: number }>>(new Map());

  const toggleEnabled = useCallback(async () => {
    if (!prefs.enabled) {
      const granted = await requestPermission();
      setPermissionGranted(granted);
      if (granted) {
        const newPrefs = { ...prefs, enabled: true };
        setPrefs(newPrefs);
        savePrefs(newPrefs);
        sendNotification("RaphaGuru", "Notificações ativadas! Você receberá alertas de gols e oportunidades.");
      }
    } else {
      const newPrefs = { ...prefs, enabled: false };
      setPrefs(newPrefs);
      savePrefs(newPrefs);
    }
  }, [prefs]);

  const updatePref = useCallback((key: keyof Omit<NotificationPrefs, "enabled">, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    savePrefs(newPrefs);
  }, [prefs]);

  // Detect changes in matches and send notifications
  useEffect(() => {
    if (!prefs.enabled || !permissionGranted) return;

    const prevMap = prevMatchesRef.current;
    const newMap = new Map<number, { homeScore: number; awayScore: number; redCards: number }>();

    for (const m of matches) {
      const homeScore = m.homeScore ?? 0;
      const awayScore = m.awayScore ?? 0;
      const redCards = (m.eventosResumo?.vermelhosCasa ?? 0) + (m.eventosResumo?.vermelhosFora ?? 0);
      newMap.set(m.id, { homeScore, awayScore, redCards });

      const prev = prevMap.get(m.id);
      if (!prev) continue; // First time seeing this match, skip

      const homeName = m.homeTeam?.name || "Casa";
      const awayName = m.awayTeam?.name || "Fora";

      // Detect new goals
      if (prefs.gols) {
        const prevTotal = prev.homeScore + prev.awayScore;
        const newTotal = homeScore + awayScore;
        if (newTotal > prevTotal) {
          const notifId = `gol-${m.id}-${newTotal}`;
          if (!getSeenIds().has(notifId)) {
            addSeenId(notifId);
            const scorer = homeScore > prev.homeScore ? homeName : awayName;
            sendNotification(
              `⚽ GOL! ${homeName} ${homeScore} x ${awayScore} ${awayName}`,
              `${scorer} marcou! ${m.league || ""} • ${m.minute || 0}'`,
              m.homeTeam?.logo || undefined,
            );
          }
        }
      }

      // Detect red cards
      if (prefs.cartaoVermelho && redCards > prev.redCards) {
        const notifId = `red-${m.id}-${redCards}`;
        if (!getSeenIds().has(notifId)) {
          addSeenId(notifId);
          sendNotification(
            `🟥 Cartão Vermelho! ${homeName} x ${awayName}`,
            `Expulsão no jogo! ${m.league || ""} • ${m.minute || 0}'`,
          );
        }
      }
    }

    prevMatchesRef.current = newMap;
  }, [matches, prefs, permissionGranted]);

  return {
    prefs,
    permissionGranted,
    toggleEnabled,
    updatePref,
    notificationsSupported: typeof window !== "undefined" && "Notification" in window,
  };
}
