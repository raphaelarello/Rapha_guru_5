import "dotenv/config";

type Role = "bots" | "pitacos" | "delivery" | "season-ingest" | "all";

function envRole(): Role {
  const r = (process.env.WORKER_ROLE || "all").toLowerCase();
  if (r === "bots") return "bots";
  if (r === "pitacos") return "pitacos";
  if (r === "delivery") return "delivery";
  if (r === "season-ingest") return "season-ingest";
  return "all";
}

async function runBots() {
  const { botCron } = await import("../../bots/cron");
  const intervalMs = Number(process.env.BOTS_TICK_MS || 10_000);
  botCron.start(intervalMs);
  console.log(`[worker:bots] started (tick=${intervalMs}ms)`);
}

async function runPitacos() {
  const { startPitacosScheduler } = await import("../../pitacos-pro-cron");
  startPitacosScheduler();
  console.log("[worker:pitacos] scheduler started (daily 08:00 + eval 30m)");
}

async function runDelivery() {
  // placeholder for future queue-based delivery; keeps process alive for now
  console.log("[worker:delivery] no-op (delivery runs inline). Set up queue to enable.");
  setInterval(() => {}, 60_000);
}

async function runSeasonIngest() {
  // placeholder for historical ingestion worker (league/season dataset build)
  console.log("[worker:season-ingest] no-op (not implemented).");
  setInterval(() => {}, 60_000);
}

async function main() {
  const role = envRole();
  if (role === "bots") return runBots();
  if (role === "pitacos") return runPitacos();
  if (role === "delivery") return runDelivery();
  if (role === "season-ingest") return runSeasonIngest();

  // all
  await runBots();
  await runPitacos();
  await runDelivery();
  await runSeasonIngest();
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
