
import { runBotsTick } from "./engine";

type Status = { running: boolean; intervalMs: number; lastRunAt: number | null; lastResult: any | null };

class BotCron {
  private timer: NodeJS.Timeout | null = null;
  private intervalMs = 10_000;
  private lastRunAt: number | null = null;
  private lastResult: any | null = null;

  status(): Status {
    return { running: this.timer != null, intervalMs: this.intervalMs, lastRunAt: this.lastRunAt, lastResult: this.lastResult };
  }

  start(intervalMs?: number) {
    if (this.timer) return;
    if (intervalMs) this.intervalMs = intervalMs;
    this.timer = setInterval(async () => {
      try {
        this.lastRunAt = Date.now();
        this.lastResult = await runBotsTick();
      } catch (e) {
        this.lastResult = { error: String(e) };
      }
    }, this.intervalMs);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async runNow() {
    this.lastRunAt = Date.now();
    this.lastResult = await runBotsTick();
    return this.lastResult;
  }
}

export const botCron = new BotCron();
