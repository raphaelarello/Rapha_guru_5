import type { CoreStats } from "../features";

function safeNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.trim().replace("%", "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pickStat(statistics: any[], names: string[]): number {
  const map = new Map<string, any>();
  for (const s of statistics || []) map.set(s.type, s.value);
  for (const n of names) {
    if (map.has(n)) return safeNum(map.get(n));
  }
  return 0;
}

export function buildCoreStatsFromApiFootball(input: {
  minute: number;
  scoreHome: number;
  scoreAway: number;
  statistics?: any[]; // fixtures/statistics response
  events?: any[]; // fixtures/events response
}): CoreStats {
  const stats = input.statistics || [];
  const home = stats?.[0]?.statistics || [];
  const away = stats?.[1]?.statistics || [];

  const yellowHome = (input.events || []).filter((e) => (e.type || "").toLowerCase() === "card" && (e.detail || "").toLowerCase().includes("yellow") && e.team?.id === stats?.[0]?.team?.id).length;
  const yellowAway = (input.events || []).filter((e) => (e.type || "").toLowerCase() === "card" && (e.detail || "").toLowerCase().includes("yellow") && e.team?.id === stats?.[1]?.team?.id).length;
  const redHome = (input.events || []).filter((e) => (e.type || "").toLowerCase() === "card" && (e.detail || "").toLowerCase().includes("red") && e.team?.id === stats?.[0]?.team?.id).length;
  const redAway = (input.events || []).filter((e) => (e.type || "").toLowerCase() === "card" && (e.detail || "").toLowerCase().includes("red") && e.team?.id === stats?.[1]?.team?.id).length;

  return {
    minute: input.minute,
    scoreHome: input.scoreHome,
    scoreAway: input.scoreAway,
    shotsHome: pickStat(home, ["Total Shots", "Shots Total"]),
    shotsAway: pickStat(away, ["Total Shots", "Shots Total"]),
    sotHome: pickStat(home, ["Shots on Goal", "Shots On Goal"]),
    sotAway: pickStat(away, ["Shots on Goal", "Shots On Goal"]),
    cornersHome: pickStat(home, ["Corner Kicks", "Corners"]),
    cornersAway: pickStat(away, ["Corner Kicks", "Corners"]),
    possessionHome: pickStat(home, ["Ball Possession"]),
    possessionAway: pickStat(away, ["Ball Possession"]),
    dangerousHome: pickStat(home, ["Dangerous Attacks"]),
    dangerousAway: pickStat(away, ["Dangerous Attacks"]),
    yellowHome,
    yellowAway,
    redHome,
    redAway,
  };
}
