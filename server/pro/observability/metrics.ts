import { z } from "zod";

export type MetricName =
  | "api_calls"
  | "api_errors"
  | "cache_hit"
  | "cache_miss"
  | "bots_evaluated"
  | "alerts_sent";

type MetricState = Record<MetricName, number>;

const state: MetricState = {
  api_calls: 0,
  api_errors: 0,
  cache_hit: 0,
  cache_miss: 0,
  bots_evaluated: 0,
  alerts_sent: 0,
};

export function inc(name: MetricName, n = 1): void {
  state[name] = (state[name] ?? 0) + n;
}

export function snapshot(): MetricState {
  return { ...state };
}

export const MetricsSchema = z.object({
  api_calls: z.number(),
  api_errors: z.number(),
  cache_hit: z.number(),
  cache_miss: z.number(),
  bots_evaluated: z.number(),
  alerts_sent: z.number(),
});
