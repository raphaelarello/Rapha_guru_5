
import { apiFootball } from "./api-football";
import { cacheManager } from "./cache-manager";

export type PlayerLeader = {
  playerId: number | null;
  name: string;
  teamName?: string;
  teamLogo?: string;
  value: number;
  label: string;
  games?: number;
  perMatch?: number;
  prob?: number; // 0..100 (ex: chance de marcar / chance de cartão)
};

function safeNum(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace("%", "").trim());
  return Number.isFinite(n) ? n : 0;
}

function poissonProbAtLeastOne(lambda: number): number {
  // P(X>=1) = 1 - e^-lambda
  if (!Number.isFinite(lambda) || lambda <= 0) return 0;
  return 1 - Math.exp(-lambda);
}

function mapTopScorers(arr: any[]): PlayerLeader[] {
  return (arr ?? []).slice(0, 10).map((it: any) => {
    const goals = safeNum(it?.statistics?.[0]?.goals?.total ?? it?.goals?.total);
    const games = safeNum(it?.statistics?.[0]?.games?.appearences ?? it?.statistics?.[0]?.games?.appearances ?? it?.games?.appearences ?? it?.games?.appearances);
    const perMatch = games > 0 ? goals / games : 0;
    // chance de marcar ao menos 1 no jogo (aprox Poisson pelo histórico da temporada)
    const prob = Math.round(Math.max(3, Math.min(85, poissonProbAtLeastOne(perMatch) * 100)));
    return {
      playerId: it?.player?.id ?? null,
      name: it?.player?.name ?? "—",
      teamName: it?.statistics?.[0]?.team?.name ?? it?.team?.name,
      teamLogo: it?.statistics?.[0]?.team?.logo ?? it?.team?.logo,
      value: goals,
      label: "Gols",
      games: games || undefined,
      perMatch: Number.isFinite(perMatch) ? Number(perMatch.toFixed(2)) : undefined,
      prob,
    } satisfies PlayerLeader;
  });
}


function mapTopCards(arr: any[], label: string, path: ("yellow" | "red")): PlayerLeader[] {
  return (arr ?? []).slice(0, 10).map((it: any) => {
    const cards = safeNum(it?.statistics?.[0]?.cards?.[path] ?? it?.cards?.[path]);
    const games = safeNum(it?.statistics?.[0]?.games?.appearences ?? it?.statistics?.[0]?.games?.appearances ?? it?.games?.appearences ?? it?.games?.appearances);
    const perMatch = games > 0 ? cards / games : 0;
    const prob = Math.round(Math.max(2, Math.min(75, poissonProbAtLeastOne(perMatch) * 100)));
    return {
      playerId: it?.player?.id ?? null,
      name: it?.player?.name ?? "—",
      teamName: it?.statistics?.[0]?.team?.name ?? it?.team?.name,
      teamLogo: it?.statistics?.[0]?.team?.logo ?? it?.team?.logo,
      value: cards,
      label,
      games: games || undefined,
      perMatch: Number.isFinite(perMatch) ? Number(perMatch.toFixed(2)) : undefined,
      prob,
    } satisfies PlayerLeader;
  });
}


export async function getSeasonPlayerLeaders(input: { leagueId: number; season: number }) {
  const key = `pitacos:leaders:${input.leagueId}:${input.season}`;
  const cached = cacheManager.get(key);
  if (cached) return cached;

  const [scorers, yellows, reds] = await Promise.all([
    apiFootball.getTopScorers(input.leagueId, input.season).catch(() => []),
    apiFootball.getTopYellowCards(input.leagueId, input.season).catch(() => []),
    apiFootball.getTopRedCards(input.leagueId, input.season).catch(() => []),
  ]);

  const out = {
    scorers: mapTopScorers(scorers),
    yellowCards: mapTopCards(yellows, "Amarelos", "yellow"),
    redCards: mapTopCards(reds, "Vermelhos", "red"),
  };

  cacheManager.set(key, out, 6 * 60 * 60 * 1000);
  return out;
}

export type LivePlayerSignal = {
  name: string;
  teamSide: "home" | "away";
  hotScore: number; // 0..100
  cardRisk: number; // 0..100
  goalProbLive?: number; // 0..100 (chance de marcar - ao vivo)
  cardProbLive?: number; // 0..100 (chance de cartão - ao vivo)
  goals: number;
  shotsOnTarget: number;
  fouls: number;
  yellow: number;
  red: number;
};

export async function getLiveFixturePlayersSignals(input: { fixtureId: number; homeTeamId: number; awayTeamId: number; scorerOddsByPlayer?: Record<string, number> }) {
  const key = `pitacos:fixturePlayers:${input.fixtureId}`;
  const cached = cacheManager.get(key);
  if (cached) return cached;

  const resp = await apiFootball.getFixturePlayers(input.fixtureId).catch(() => []);
  const arr = resp?.response ?? resp ?? [];
  const signals: LivePlayerSignal[] = [];

  for (const teamBlock of arr ?? []) {
    const teamId = teamBlock?.team?.id;
    const side = teamId === input.awayTeamId ? "away" : "home";
    for (const p of teamBlock?.players ?? []) {
      const st = p?.statistics?.[0] ?? {};
      const goals = safeNum(st?.goals?.total ?? 0);
      const shotsOnTarget = safeNum(st?.shots?.on ?? 0);
      const fouls = safeNum(st?.fouls?.committed ?? 0);
      const yellow = safeNum(st?.cards?.yellow ?? 0);
      const red = safeNum(st?.cards?.red ?? 0);

      const hot = clamp01((goals * 0.55) + (shotsOnTarget * 0.25) + (safeNum(st?.dribbles?.success ?? 0) * 0.08) + (safeNum(st?.passes?.key ?? 0) * 0.06));
      const risk = clamp01((fouls * 0.15) + (yellow * 0.55) + (red * 1.0));
      const goalProbLive = Math.round(clamp01(0.05 + (hot * 0.35) + (shotsOnTarget * 0.12) + (goals * 0.3)) * 100);
      const cardProbLive = Math.round(clamp01(0.03 + (risk * 0.6) + (fouls * 0.05) + (yellow * 0.1) + (red * 0.2)) * 100);

      const oddsKey = String(p?.player?.name ?? "").toLowerCase();
      const oddsScorer = input.scorerOddsByPlayer?.[oddsKey];
      const marketProb = oddsScorer && oddsScorer > 1 ? clamp01(1 / oddsScorer) : null;
      const modelProb = clamp01(goalProbLive / 100);
      const goalProbLiveCalibrated = Math.round(
        clamp01(marketProb != null ? (0.55 * marketProb + 0.45 * modelProb) : modelProb) * 100
      );

      signals.push({
        name: p?.player?.name ?? "—",
        teamSide: side,
        hotScore: Math.round(hot * 100),
        cardRisk: Math.round(risk * 100),
        goalProbLive,
        goalProbLiveCalibrated,
        cardProbLive,
        goals,
        shotsOnTarget,
        fouls,
        yellow,
        red,
      });
    }
  }

  // top lists
  const topHot = [...signals].sort((a,b)=>b.hotScore-a.hotScore).slice(0, 6);
  const topRisk = [...signals].sort((a,b)=>b.cardRisk-a.cardRisk).slice(0, 6);

  const out = { topHot, topRisk };
  cacheManager.set(key, out, 30 * 1000);
  return out;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
