/**
 * Workers System - Processamento assíncrono de tarefas pesadas
 * Realtime patches, avaliação de resultados, geração de relatórios
 */

import { getDb } from "../db";
import { generateDailyReport } from "./accuracy-engine";
import { getRealtimeSnapshots } from "./realtime-patch";
import { sendNotification, notifyDailyReport } from "./notifications-engine";
import { inc } from "./observability/metrics";

export type WorkerTask = "realtime_update" | "evaluate_results" | "generate_report" | "notify_users";

export interface WorkerJob {
  id: string;
  task: WorkerTask;
  userId?: number;
  data?: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Fila de jobs em memória (em produção usar Redis/Bull)
const jobQueue: WorkerJob[] = [];
const MAX_CONCURRENT = 5;
let runningJobs = 0;

/**
 * Enqueue job
 */
export function enqueueJob(task: WorkerTask, userId?: number, data?: Record<string, any>): WorkerJob {
  const job: WorkerJob = {
    id: `${task}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    task,
    userId,
    data,
    status: "pending",
    createdAt: new Date(),
  };

  jobQueue.push(job);
  inc("worker_job_enqueued");

  // Processar se houver capacidade
  processQueue();

  return job;
}

/**
 * Processar fila de jobs
 */
async function processQueue(): Promise<void> {
  while (runningJobs < MAX_CONCURRENT && jobQueue.length > 0) {
    const job = jobQueue.shift();
    if (!job) break;

    runningJobs += 1;
    job.status = "running";
    job.startedAt = new Date();

    try {
      await processJob(job);
      job.status = "completed";
      job.completedAt = new Date();
      inc("worker_job_completed");
    } catch (error) {
      job.status = "failed";
      job.error = String(error);
      job.completedAt = new Date();
      inc("worker_job_failed");
      console.error(`[workers] Job ${job.id} failed:`, error);
    } finally {
      runningJobs -= 1;
      // Continuar processando
      processQueue();
    }
  }
}

/**
 * Processar job individual
 */
async function processJob(job: WorkerJob): Promise<void> {
  switch (job.task) {
    case "realtime_update":
      await handleRealtimeUpdate(job);
      break;
    case "evaluate_results":
      await handleEvaluateResults(job);
      break;
    case "generate_report":
      await handleGenerateReport(job);
      break;
    case "notify_users":
      await handleNotifyUsers(job);
      break;
  }
}

/**
 * Atualizar snapshots realtime a cada 30s
 */
async function handleRealtimeUpdate(job: WorkerJob): Promise<void> {
  const date = job.data?.date || new Date().toISOString().split("T")[0];

  const { getRealtimeSnapshots } = await import("./realtime-patch-real");
  const { snapshots, patches } = await getRealtimeSnapshots(date);

  console.log(`[workers] Realtime update: ${snapshots.length} snapshots, ${patches.length} patches`);

  // TODO: Broadcast via WebSocket para todos os clientes
  // io.emit("realtime:update", { snapshots, patches });

  inc("worker_realtime_update");
}

/**
 * Avaliar resultados de jogos finalizados
 */
async function handleEvaluateResults(job: WorkerJob): Promise<void> {
  try {
    const { processAllFinalizedMatches } = await import("./result-evaluator-real");
    const result = await processAllFinalizedMatches();

    console.log(
      `[workers] Evaluated ${result.matchesProcessed} matches, ${result.picksEvaluated} picks, ${result.ticketsEvaluated} tickets. Total profit: R$ ${result.totalProfit.toFixed(2)}`
    );

    inc("worker_evaluate_results");
  } catch (error) {
    console.error("[workers] Error evaluating results:", error);
    throw error;
  }
}

/**
 * Gerar relatório diário 08:00
 */
async function handleGenerateReport(job: WorkerJob): Promise<void> {
  if (!job.userId) throw new Error("userId required for report generation");

  const reportDate = job.data?.date ? new Date(job.data.date) : new Date();

  const report = await generateDailyReport(job.userId, reportDate);

  console.log(`[workers] Report generated for user ${job.userId}:`, report);

  // Enviar notificação
  await notifyDailyReport(job.userId, {
    totalPicks: report.totalPicks,
    hitRate: report.hitRate,
    avgBrier: report.avgBrier,
  });

  inc("worker_generate_report");
}

/**
 * Notificar usuários (broadcast)
 */
async function handleNotifyUsers(job: WorkerJob): Promise<void> {
  const { channels, priority, title, message } = job.data || {};

  if (!channels || !title || !message) {
    throw new Error("Missing notification data");
  }

  // TODO: Buscar todos os usuários com preferência de notificação
  // TODO: Enviar notificação em batch

  console.log(`[workers] Notifying users: ${title}`);

  inc("worker_notify_users");
}

/**
 * Agendar realtime updates a cada 30s
 */
export function scheduleRealtimeUpdates(): void {
  setInterval(() => {
    enqueueJob("realtime_update", undefined, {
      date: new Date().toISOString().split("T")[0],
    });
  }, 30_000);

  console.log("[workers] Scheduled realtime updates every 30s");
}

/**
 * Agendar avaliação de resultados a cada 5 minutos
 */
export function scheduleEvaluateResults(): void {
  setInterval(() => {
    enqueueJob("evaluate_results");
  }, 5 * 60_000);

  console.log("[workers] Scheduled result evaluation every 5 minutes");
}

/**
 * Agendar geração de relatórios diários às 08:00
 */
export function scheduleDailyReports(): void {
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);

  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  setTimeout(() => {
    // TODO: Buscar todos os usuários
    // TODO: Para cada usuário, enqueue generate_report job

    console.log("[workers] Generating daily reports...");

    // Agendar próximo dia
    setInterval(() => {
      console.log("[workers] Generating daily reports...");
    }, 24 * 60 * 60_000);
  }, delay);

  console.log(`[workers] Scheduled daily reports at 08:00 (in ${Math.round(delay / 1000)}s)`);
}

/**
 * Inicializar workers
 */
export function initializeWorkers(): void {
  scheduleRealtimeUpdates();
  scheduleEvaluateResults();
  scheduleDailyReports();

  console.log("[workers] Initialized");
}

/**
 * Health check
 */
export function getWorkerStatus(): {
  queueLength: number;
  runningJobs: number;
  status: "healthy" | "busy" | "overloaded";
} {
  return {
    queueLength: jobQueue.length,
    runningJobs,
    status:
      runningJobs === 0
        ? "healthy"
        : runningJobs < MAX_CONCURRENT
          ? "busy"
          : "overloaded",
  };
}
