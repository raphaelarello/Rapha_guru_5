import { z } from "zod";

export type MetricName =
  | "api_calls"
  | "api_errors"
  | "cache_hit"
  | "cache_miss"
  | "bots_evaluated"
  | "alerts_sent"
  | "realtime_patch_hit"
  | "realtime_patch_miss"
  | "accuracy_pick_evaluated"
  | "accuracy_ticket_evaluated"
  | "accuracy_metrics_calculated"
  | "feature_snapshot_persisted"
  | "notification_sent"
  | "notification_failed"
  | "notification_throttled"
  | "notification_telegram_sent"
  | "notification_whatsapp_sent"
  | "notification_email_sent"
  | "notification_web_sent"
  | "daily_report_generated";

type MetricState = Record<MetricName, number>;

const state: MetricState = {
  api_calls: 0,
  api_errors: 0,
  cache_hit: 0,
  cache_miss: 0,
  bots_evaluated: 0,
  alerts_sent: 0,
  realtime_patch_hit: 0,
  realtime_patch_miss: 0,
  accuracy_pick_evaluated: 0,
  accuracy_ticket_evaluated: 0,
  accuracy_metrics_calculated: 0,
  feature_snapshot_persisted: 0,
  notification_sent: 0,
  notification_failed: 0,
  notification_throttled: 0,
  notification_telegram_sent: 0,
  notification_whatsapp_sent: 0,
  notification_email_sent: 0,
  notification_web_sent: 0,
  daily_report_generated: 0,
};

export function inc(name: MetricName, n = 1): void {
  state[name] = (state[name] ?? 0) + n;
}

export function snapshot(): MetricState {
  return { ...state };
}

/**
 * Reset metrics (para testes)
 */
export function reset(): void {
  for (const key in state) {
    (state as any)[key] = 0;
  }
}

export const MetricsSchema = z.object({
  api_calls: z.number(),
  api_errors: z.number(),
  cache_hit: z.number(),
  cache_miss: z.number(),
  bots_evaluated: z.number(),
  alerts_sent: z.number(),
  realtime_patch_hit: z.number(),
  realtime_patch_miss: z.number(),
  accuracy_pick_evaluated: z.number(),
  accuracy_ticket_evaluated: z.number(),
  accuracy_metrics_calculated: z.number(),
  feature_snapshot_persisted: z.number(),
  notification_sent: z.number(),
  notification_failed: z.number(),
  notification_throttled: z.number(),
  notification_telegram_sent: z.number(),
  notification_whatsapp_sent: z.number(),
  notification_email_sent: z.number(),
  notification_web_sent: z.number(),
  daily_report_generated: z.number(),
});

/**
 * Observar valor (gauge) - para métricas contínuas
 */
export function observe(metricName: string, value: number): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[metrics] ${metricName}: ${value}`);
  }
}

/**
 * Health check
 */
export function getHealthStatus(): {
  status: "healthy" | "degraded" | "unhealthy";
  metrics: MetricState;
} {
  const totalMetrics = Object.values(state).reduce((a, b) => a + b, 0);
  return {
    status: totalMetrics > 0 ? "healthy" : "degraded",
    metrics: state,
  };
}
