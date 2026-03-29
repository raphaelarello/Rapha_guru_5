import { apiFootball } from "../api-football";
import { getActiveBots, createAlerta } from "../db";
import { computeMatchFeatures } from "../pro/features";
import { buildCoreStatsFromApiFootball } from "../pro/adapters/apiFootball";

export type BotMatch = {
  botId: number;
  fixtureId: number;
  titulo: string;
  mensagem: string;
  prioridade: "low" | "medium" | "high";
  payload: Record<string, unknown>;
};

type LiveFixture = any;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type DedupeKey = string;

const lastFireAtByKey = new Map<DedupeKey, number>();
const lastRedCountByFixture = new Map<number, { home: number; away: number; ts: number }>();

function shouldFire(key: DedupeKey, cooldownMs: number): boolean {
  const now = Date.now();
  const last = lastFireAtByKey.get(key) ?? 0;
  if (now - last < cooldownMs) return false;
  lastFireAtByKey.set(key, now);
  return true;
}

function fixtureMinute(f: any): number {
  const m = f?.fixture?.status?.elapsed ?? f?.fixture?.status?.elapsedTime ?? 0;
  return typeof m === "number" && Number.isFinite(m) ? m : 0;
}

function scoreHomeAway(f: any): { home: number; away: number } {
  return { home: Number(f?.goals?.home ?? 0) || 0, away: Number(f?.goals?.away ?? 0) || 0 };
}

function pickTemplate(bot: any): string | null {
  if (typeof bot?.templateId === "string" && bot.templateId.trim()) return bot.templateId;
  return null;
}

function buildExplainPayload(input: {
  bot: any;
  fixture: LiveFixture;
  feats: ReturnType<typeof computeMatchFeatures>;
  templateId: string;
}): BotMatch {
  const f = input.fixture;
  const minute = input.feats.minute;
  const jogo = `${f?.teams?.home?.name ?? "Casa"} x ${f?.teams?.away?.name ?? "Fora"}`;
  const liga = f?.league?.name ?? null;

  return {
    botId: input.bot.id,
    fixtureId: f?.fixture?.id,
    titulo: input.bot.nome,
    mensagem: input.feats.reasons.join(" • "),
    prioridade: input.feats.next10.goalProb >= 75 ? "high" : input.feats.next10.goalProb >= 60 ? "medium" : "low",
    payload: {
      templateId: input.templateId,
      minute,
      jogo,
      liga,
      score: { home: input.feats.scoreHome, away: input.feats.scoreAway },
      next10: input.feats.next10,
      pressure: input.feats.pressure,
      riskFlags: input.feats.riskFlags,
      reasons: input.feats.reasons,
      markets: input.feats.odds,
    },
  };
}

function matchBotTemplate(input: {
  bot: any;
  fixture: LiveFixture;
  feats: ReturnType<typeof computeMatchFeatures>;
  templateId: string;
}): boolean {
  const { feats, templateId, fixture } = input;

  if (templateId === "over05_55_75") {
    const total = feats.scoreHome + feats.scoreAway;
    if (feats.minute < 55 || feats.minute > 75) return false;
    if (total > 2) return false;
    if (feats.next10.goalProb < 65) return false;
    if (feats.pressure.score < 70) return false;
    if (feats.riskFlags.includes("ODDS_STALE")) return false;
    return true;
  }

  if (templateId === "corners_live") {
    if (feats.minute < 20 || feats.minute > 85) return false;
    if (feats.next10.cornerProb < 60) return false;
    // corners pace heuristic
    const cornersTotal = (feats.stats.cornersHome ?? 0) + (feats.stats.cornersAway ?? 0);
    const pace = cornersTotal / Math.max(1, feats.minute);
    if (pace < 0.12) return false;
    return true;
  }

  if (templateId === "red_card") {
    const fid = fixture?.fixture?.id;
    if (!fid) return false;
    const prev = lastRedCountByFixture.get(fid);
    const nowCounts = { home: feats.stats.redHome ?? 0, away: feats.stats.redAway ?? 0, ts: Date.now() };
    lastRedCountByFixture.set(fid, nowCounts);
    if (!prev) return false;
    const changed = (nowCounts.home > prev.home) || (nowCounts.away > prev.away);
    if (!changed) return false;
    return true;
  }

  return false;
}

export async function runBotsTick(): Promise<{ processed: number; alerts: number }> {
  const bots = await getActiveBots();
  if (!bots.length) return { processed: 0, alerts: 0 };

  const liveFixtures = (await apiFootball.getLiveFixtures()) as any[];
  const topFixtures = (liveFixtures || []).slice(0, 20);

  let alerts = 0;

  for (const f of topFixtures) {
    const fixtureId = f?.fixture?.id;
    if (!fixtureId) continue;

    const minute = fixtureMinute(f);
    const score = scoreHomeAway(f);

    // Fetch stats/events best-effort
    const [statistics, events] = await Promise.all([
      apiFootball.getFixtureStatistics(fixtureId).catch(() => null),
      apiFootball.getFixtureEvents(fixtureId).catch(() => null),
    ]);

    const stats = buildCoreStatsFromApiFootball({
      minute,
      scoreHome: score.home,
      scoreAway: score.away,
      statistics: statistics as any,
      events: events as any,
    });

    const feats = computeMatchFeatures({ stats });

    for (const bot of bots) {
      const templateId = pickTemplate(bot);
      if (!templateId) continue;

      const key = `${bot.id}:${fixtureId}:${templateId}`;
      // cooldown 20 min
      if (!shouldFire(key, 20 * 60 * 1000)) continue;

      const ok = matchBotTemplate({ bot, fixture: f, feats, templateId });
      if (!ok) continue;

      const match = buildExplainPayload({ bot, fixture: f, feats, templateId });

      await createAlerta({
        userId: bot.userId,
        botId: bot.id,
        fixtureId,
        titulo: match.titulo,
        mensagem: match.mensagem,
        prioridade: match.prioridade,
        payload: match.payload,
        jogo: match.payload.jogo as string,
        liga: match.payload.liga as any,
        mercado: templateId,
        odd: null,
        ev: null,
        confianca: Math.round(clamp(feats.pressure.score, 50, 95)),
        motivos: feats.reasons,
        canaisEnviados: [],
        enviado: false,
      });

      alerts++;
    }
  }

  return { processed: bots.length, alerts };
}

export async function simulateBotsNow(userId: number): Promise<BotMatch[]> {
  const bots = (await getActiveBots()).filter((b: any) => b.userId === userId);
  const liveFixtures = (await apiFootball.getLiveFixtures()) as any[];
  const topFixtures = (liveFixtures || []).slice(0, 20);

  const out: BotMatch[] = [];

  for (const f of topFixtures) {
    const fixtureId = f?.fixture?.id;
    if (!fixtureId) continue;

    const minute = fixtureMinute(f);
    const score = scoreHomeAway(f);
    const [statistics, events] = await Promise.all([
      apiFootball.getFixtureStatistics(fixtureId).catch(() => null),
      apiFootball.getFixtureEvents(fixtureId).catch(() => null),
    ]);

    const stats = buildCoreStatsFromApiFootball({
      minute,
      scoreHome: score.home,
      scoreAway: score.away,
      statistics: statistics as any,
      events: events as any,
    });

    const feats = computeMatchFeatures({ stats });

    for (const bot of bots) {
      const templateId = pickTemplate(bot);
      if (!templateId) continue;
      const ok = matchBotTemplate({ bot, fixture: f, feats, templateId });
      if (!ok) continue;
      out.push(buildExplainPayload({ bot, fixture: f, feats, templateId }));
    }
  }

  return out.slice(0, 50);
}
