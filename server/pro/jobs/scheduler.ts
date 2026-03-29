import { getConfiguredHour } from "../../pitacos-pro-cron";
import { inc } from "../observability/metrics";

type Job = { name: string; fn: () => Promise<void>; intervalMs: number; lastRun?: number };
const jobs: Job[] = [];

export function registerJob(job: Job): void {
  jobs.push(job);
}

export function startScheduler(): void {
  // interval jobs
  for (const j of jobs) {
    setInterval(async () => {
      try {
        j.lastRun = Date.now();
        await j.fn();
      } catch {
        // noop
      }
    }, j.intervalMs);
  }
}

export function scheduleDailyAt08(fn: () => Promise<void>): void {
  // simple timer: check every 30s whether local hour == 8 and minute == 0
  setInterval(async () => {
    const d = new Date();
    if (d.getHours() !== 8 || d.getMinutes() !== 0) return;
    // avoid repeated runs in same minute
    const stamp = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-8`;
    const key = `daily08:${stamp}`;
    // use global var for quick dedupe
    const g: any = globalThis as any;
    if (g[key]) return;
    g[key] = true;
    try {
      await fn();
      inc("alerts_sent", 0);
    } catch {
      // noop
    }
  }, 30_000);
}
