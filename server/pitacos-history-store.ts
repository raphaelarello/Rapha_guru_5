import fs from "node:fs/promises";
import path from "node:path";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { pitacos } from "../drizzle/schema";

export type PitacoMetric =
  | "OVER_25"
  | "BTTS"
  | "HOME_WIN"
  | "DRAW"
  | "AWAY_WIN"
  | "CORNERS_TOTAL"
  | "CARDS_TOTAL";

export type PitacoProjection = {
  fixtureId: number;
  date: string; // YYYY-MM-DD
  leagueId?: number;
  leagueName?: string;
  country?: string | null;
  teams: { home: string; away: string };
  startTime?: string | null;

  // model outputs (0..100)
  probs: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
    over25?: number;
    btts?: number;
  };

  // thresholds used for the "pitaco do dia" selection
  thresholds: {
    over25Min?: number;
    bttsMin?: number;
    winMin?: number;
  };

  // optional live snapshot if created live
  live?: {
    minute?: number;
    next10?: { goal: number; corner: number; card: number };
  };

  createdAt: string; // ISO
  updatedAt: string; // ISO

  // resolved after match finishes
  actual?: {
    finishedAt?: string;
    scoreHome?: number;
    scoreAway?: number;
    btts?: boolean;
    over25?: boolean;
    winner?: "HOME" | "DRAW" | "AWAY";
    cornersTotal?: number | null;
    cardsTotal?: number | null;
  };

  evaluation?: {
    // per metric: acertou?
    metrics: Partial<Record<PitacoMetric, boolean>>;
    // 0..100
    score?: number;
  };
};

export type PitacosHistoryFile = {
  version: number;
  updatedAt: string;
  users: Record<string, { projections: PitacoProjection[] }>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE_PATH = path.join(DATA_DIR, "pitacos_history.json");


const PROJECTION_MARKET = "PITACOS_PROJECTION";

function parseUserId(userKey: string): number | null {
  const n = Number(userKey);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function listFromDb(userKey: string): Promise<PitacoProjection[] | null> {
  const userId = parseUserId(userKey);
  if (!userId) return null;
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db.select().from(pitacos).where(and(eq(pitacos.userId, userId), eq(pitacos.mercado, PROJECTION_MARKET))).orderBy(pitacos.createdAt);
    const items: PitacoProjection[] = [];
    for (const r of rows as any[]) {
      if (!r.analise) continue;
      try {
        const p = JSON.parse(String(r.analise)) as PitacoProjection;
        items.push(p);
      } catch {}
    }
    return items;
  } catch {
    return null;
  }
}

async function upsertToDb(userKey: string, items: PitacoProjection[]): Promise<boolean> {
  const userId = parseUserId(userKey);
  if (!userId) return false;
  const db = await getDb();
  if (!db) return false;

  try {
    for (const p of items) {
      const fixtureKey = String(p.fixtureId);
      const existing = await db
        .select()
        .from(pitacos)
        .where(and(eq(pitacos.userId, userId), eq(pitacos.mercado, PROJECTION_MARKET), eq(pitacos.jogo, fixtureKey)))
        .limit(1);

      const payload = JSON.stringify(p);
      if (existing?.length) {
        await db
          .update(pitacos)
          .set({ analise: payload, updatedAt: new Date() as any })
          .where(and(eq(pitacos.userId, userId), eq(pitacos.mercado, PROJECTION_MARKET), eq(pitacos.jogo, fixtureKey)));
      } else {
        await db.insert(pitacos).values({
          userId,
          jogo: fixtureKey,
          liga: p.leagueName ?? null,
          mercado: PROJECTION_MARKET,
          odd: "1.00" as any,
          analise: payload,
          confianca: 70,
          resultado: "pendente",
          mercadosPrevistos: null,
          scorePrevisao: null,
          placarFinal: null,
        } as any);
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function updateToDb(userKey: string, fixtureId: number, patch: Partial<PitacoProjection>): Promise<boolean> {
  const userId = parseUserId(userKey);
  if (!userId) return false;
  const db = await getDb();
  if (!db) return false;

  try {
    const fixtureKey = String(fixtureId);
    const existing = await db
      .select()
      .from(pitacos)
      .where(and(eq(pitacos.userId, userId), eq(pitacos.mercado, PROJECTION_MARKET), eq(pitacos.jogo, fixtureKey)))
      .limit(1);

    if (!existing?.length) return false;
    const raw = (existing[0] as any).analise;
    const current = raw ? (JSON.parse(String(raw)) as PitacoProjection) : null;
    if (!current) return false;

    const next = { ...current, ...patch } as PitacoProjection;
    await db
      .update(pitacos)
      .set({ analise: JSON.stringify(next), updatedAt: new Date() as any })
      .where(and(eq(pitacos.userId, userId), eq(pitacos.mercado, PROJECTION_MARKET), eq(pitacos.jogo, fixtureKey)));
    return true;
  } catch {
    return false;
  }
}


async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readHistory(): Promise<PitacosHistoryFile> {
  await ensureDir();
  try {
    const raw = await fs.readFile(FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as PitacosHistoryFile;
    if (!parsed.version) throw new Error("bad schema");
    return parsed;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), users: {} };
  }
}

export async function writeHistory(file: PitacosHistoryFile): Promise<void> {
  await ensureDir();
  const next = { ...file, updatedAt: new Date().toISOString() };
  await fs.writeFile(FILE_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export async function upsertUserProjections(userKey: string, items: PitacoProjection[]): Promise<void> {
  const ok = await upsertToDb(userKey, items);
  if (ok) return;

  const file = await readHistory();
  const user = file.users[userKey] ?? { projections: [] };
  const byFixture = new Map<number, PitacoProjection>(user.projections.map((p) => [p.fixtureId, p]));
  for (const it of items) {
    const prev = byFixture.get(it.fixtureId);
    byFixture.set(it.fixtureId, prev ? { ...prev, ...it, updatedAt: new Date().toISOString() } : it);
  }
  file.users[userKey] = { projections: Array.from(byFixture.values()).sort((a, b) => (a.date + a.fixtureId).localeCompare(b.date + b.fixtureId)) };
  await writeHistory(file);
}

export async function listUserProjections(userKey: string): Promise<PitacoProjection[]> {
  const dbItems = await listFromDb(userKey);
  if (dbItems) return dbItems;

  const file = await readHistory();
  return file.users[userKey]?.projections ?? [];
}

export async function updateUserProjection(userKey: string, fixtureId: number, patch: Partial<PitacoProjection>): Promise<void> {
  const ok = await updateToDb(userKey, fixtureId, patch);
  if (ok) return;

  const file = await readHistory();
  const user = file.users[userKey] ?? { projections: [] };
  const next = user.projections.map((p) => (p.fixtureId === fixtureId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
  file.users[userKey] = { projections: next };
  await writeHistory(file);
}