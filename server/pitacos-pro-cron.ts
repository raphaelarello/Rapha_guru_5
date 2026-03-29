import { runGlobalDailyPitacosReport, evaluateGlobalPitacosHistory } from "./pitacos-pro";

/**
 * Simple scheduler (no extra deps):
 * - checks every minute
 * - runs daily report at 08:00 local server time (once per day)
 * - runs evaluation for FINISHED games every 30 minutes
 *
 * Designed to work even without a DB (stores to .data files).
 */
let _started = false;
let _lastDailyKey: string | null = null;
let _lastEvalAt = 0;

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function startPitacosScheduler(): void {
  if (_started) return;
  _started = true;

  // minute tick
  setInterval(async () => {
    const now = new Date();
    const key = todayKey(now);

    // daily at 08:00
    if (now.getHours() === 8 && now.getMinutes() === 0 && _lastDailyKey !== key) {
      _lastDailyKey = key;
      try {
        await runGlobalDailyPitacosReport(key);
      } catch (err) {
        console.warn("[PitacosScheduler] daily report failed:", err);
      }
    }

    // evaluate every 30 minutes
    if (Date.now() - _lastEvalAt >= 30 * 60 * 1000) {
      _lastEvalAt = Date.now();
      try {
        await evaluateGlobalPitacosHistory();
      } catch (err) {
        console.warn("[PitacosScheduler] evaluation failed:", err);
      }
    }
  }, 60 * 1000);
}
