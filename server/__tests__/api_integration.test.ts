import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

/**
 * Integration tests against API-Football.
 *
 * These tests are skipped unless:
 *   RUN_INTEGRATION_TESTS=1
 *   API_FOOTBALL_KEY is set
 *
 * Run:
 *   RUN_INTEGRATION_TESTS=1 API_FOOTBALL_KEY=xxxx pnpm test
 */
const shouldRun = process.env.RUN_INTEGRATION_TESTS === "1" && !!process.env.API_FOOTBALL_KEY;

const ctx = {
  req: { headers: {} },
  res: {},
} as unknown as TrpcContext;

const caller = appRouter.createCaller(ctx);

describe.skipIf(!shouldRun)("api-football end-to-end smoke", () => {
  it("football.getLiveFixtures returns array", async () => {
    const res = await caller.football.getLiveFixtures();
    expect(Array.isArray(res.fixtures)).toBe(true);
  });

  it("football.getFixturesByDate returns fixtures for today", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await caller.football.getFixturesByDate({ date: today });
    expect(Array.isArray(res.fixtures)).toBe(true);
  });

  it("football.dashboardAoVivo returns dashboard payload", async () => {
    const res = await caller.football.dashboardAoVivo({});
    expect(res).toBeTruthy();
    expect(Array.isArray(res.fixtures)).toBe(true);
  });

  it("football.destaquesScanner builds picks (may be empty depending on filters)", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await caller.football.destaquesScanner({ date: today, debug: true });
    expect(res).toBeTruthy();
    expect(res.meta).toBeTruthy();
  });

  it("pitacosPro.dashboard returns payload", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await caller.pitacosPro.dashboard({ date: today });
    expect(res).toBeTruthy();
    expect(Array.isArray(res.fixtures)).toBe(true);
  });

  it("bots.simulateNow returns structure", async () => {
    const res = await caller.bots.simulateNow({});
    expect(res).toBeTruthy();
    expect(Array.isArray(res.matches)).toBe(true);
  });
});
