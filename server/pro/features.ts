export type MatchSide = "home" | "away" | "balanced";

export type CoreStats = {
  minute: number;
  scoreHome: number;
  scoreAway: number;
  shotsHome?: number;
  shotsAway?: number;
  sotHome?: number;
  sotAway?: number;
  cornersHome?: number;
  cornersAway?: number;
  possessionHome?: number;
  possessionAway?: number;
  dangerousHome?: number;
  dangerousAway?: number;
  yellowHome?: number;
  yellowAway?: number;
  redHome?: number;
  redAway?: number;
};

export type OddsMarket = {
  key: "OU_25" | "BTTS" | "FT_1X2";
  // best odds
  home?: number;
  draw?: number;
  away?: number;
  over?: number;
  under?: number;
  yes?: number;
  no?: number;
  updatedSecAgo?: number;
  stale?: boolean;
  delta5m?: number;
  bookmaker?: string;
};

export type Next10 = {
  goalProb: number; // 0..100
  cornerProb: number; // 0..100
  cardProb: number; // 0..100
  reasons: string[];
};

export type FeatureVector = {
  pressureScore: number; // 0..100
  pressureSide: MatchSide;
  tempoScore: number; // 0..100
  sotRate10m: number;
  cornersRate10m: number;
  disciplineRisk: number; // 0..100
  comebackProb: { side: MatchSide; prob: number }; // 0..100
  odds: OddsMarket[];
  next10: Next10;
  reasons: string[];
  riskFlags: string[];
};

function clamp(n: number, a = 0, b = 100): number {
  return Math.max(a, Math.min(b, n));
}

function safe(n: unknown): number | undefined {
  const v = typeof n === "number" && Number.isFinite(n) ? n : undefined;
  return v;
}

export function derivePressure(stats: CoreStats): { score: number; side: MatchSide; reasons: string[] } {
  const sotH = safe(stats.sotHome) ?? 0;
  const sotA = safe(stats.sotAway) ?? 0;
  const corH = safe(stats.cornersHome) ?? 0;
  const corA = safe(stats.cornersAway) ?? 0;
  const dangH = safe(stats.dangerousHome);
  const dangA = safe(stats.dangerousAway);

  // fallback: if dangerous not available, approximate with SOT + corners weight
  const hSignal = (dangH ?? sotH * 8 + corH * 2);
  const aSignal = (dangA ?? sotA * 8 + corA * 2);

  const total = Math.max(1, hSignal + aSignal);
  const aPct = (aSignal / total) * 100;
  const hPct = (hSignal / total) * 100;

  let side: MatchSide = "balanced";
  if (hPct >= 58) side = "home";
  if (aPct >= 58) side = "away";

  const score = clamp(Math.max(hPct, aPct));
  const reasons: string[] = [];
  if (dangH == null || dangA == null) reasons.push("Pressão derivada (sem 'Ataques Perigosos')");
  reasons.push(`SOT ${sotH}-${sotA}`);
  reasons.push(`Esc ${corH}-${corA}`);
  return { score, side, reasons: reasons.slice(0, 3) };
}

export function deriveNext10(stats: CoreStats, pressureScore: number): Next10 {
  // heuristic baseline: pressure + minute + score state
  const minute = clamp(stats.minute, 0, 120);
  const scoreDiff = Math.abs((stats.scoreHome ?? 0) - (stats.scoreAway ?? 0));

  const sotT = (safe(stats.sotHome) ?? 0) + (safe(stats.sotAway) ?? 0);
  const corT = (safe(stats.cornersHome) ?? 0) + (safe(stats.cornersAway) ?? 0);
  const yT = (safe(stats.yellowHome) ?? 0) + (safe(stats.yellowAway) ?? 0);

  const goalBase = clamp(pressureScore * 0.6 + clamp(sotT * 6, 0, 30) + clamp((minute / 90) * 15, 0, 15) - scoreDiff * 6);
  const cornerBase = clamp(pressureScore * 0.4 + clamp(corT * 3, 0, 35) + clamp((minute / 90) * 10, 0, 10));
  const cardBase = clamp(clamp(yT * 10, 0, 40) + clamp(pressureScore * 0.3, 0, 30) + clamp((minute / 90) * 15, 0, 15));

  const reasons = [
    `Pressão ${Math.round(pressureScore)}%`,
    `SOT ${(safe(stats.sotHome) ?? 0)}-${(safe(stats.sotAway) ?? 0)}`,
    `Esc ${(safe(stats.cornersHome) ?? 0)}-${(safe(stats.cornersAway) ?? 0)}`,
  ];

  return {
    goalProb: clamp(goalBase),
    cornerProb: clamp(cornerBase),
    cardProb: clamp(cardBase),
    reasons: reasons.slice(0, 3),
  };
}

export function deriveComeback(stats: CoreStats, pressure: { score: number; side: MatchSide }, next10: Next10): { side: MatchSide; prob: number } {
  const minute = clamp(stats.minute, 0, 120);
  const diff = (stats.scoreHome ?? 0) - (stats.scoreAway ?? 0);
  if (diff === 0) return { side: "balanced", prob: 0 };

  const trailing: MatchSide = diff < 0 ? "home" : "away";
  const scoreFactor = clamp(20 - Math.abs(diff) * 10, 0, 20);
  const timeFactor = clamp((minute / 90) * 25, 0, 25);
  const pressureFactor = trailing === pressure.side ? pressure.score * 0.45 : pressure.score * 0.18;
  const next10Factor = next10.goalProb * 0.35;

  const prob = clamp(scoreFactor + timeFactor + pressureFactor + next10Factor, 0, 95);
  return { side: trailing, prob };
}

export function computeFeatures(input: { stats: CoreStats; odds?: OddsMarket[] }): FeatureVector {
  const pressure = derivePressure(input.stats);
  const next10 = deriveNext10(input.stats, pressure.score);
  const comeback = deriveComeback(input.stats, pressure, next10);

  const sotT = (safe(input.stats.sotHome) ?? 0) + (safe(input.stats.sotAway) ?? 0);
  const tempoScore = clamp(pressure.score * 0.6 + clamp(sotT * 8, 0, 40));

  const riskFlags: string[] = [];
  for (const o of input.odds ?? []) {
    if (o.stale) riskFlags.push("ODD_DESATUALIZADA");
  }

  return {
    pressureScore: pressure.score,
    pressureSide: pressure.side,
    tempoScore,
    sotRate10m: sotT / Math.max(1, input.stats.minute / 10),
    cornersRate10m: ((safe(input.stats.cornersHome) ?? 0) + (safe(input.stats.cornersAway) ?? 0)) / Math.max(1, input.stats.minute / 10),
    disciplineRisk: clamp(((safe(input.stats.yellowHome) ?? 0) + (safe(input.stats.yellowAway) ?? 0)) * 10 + (pressure.score * 0.2)),
    comebackProb: comeback,
    odds: input.odds ?? [],
    next10,
    reasons: [...pressure.reasons, ...next10.reasons].slice(0, 4),
    riskFlags: Array.from(new Set(riskFlags)),
  };
}

/**
 * Alias mantido por compatibilidade com o engine de bots.
 */
export function computeMatchFeatures(input: { stats: CoreStats; odds?: OddsMarket[] }): FeatureVector {
  return computeFeatures(input);
}