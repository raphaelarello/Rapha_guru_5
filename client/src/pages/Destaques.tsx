
import React, { useEffect, useMemo, useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { trpc } from "@/lib/trpc";
import { DestaquesTopBar, type DestaquesFilters } from "@/components/destaques/DestaquesTopBar";
import { GoldPickCardCompact, type ScannerPick } from "@/components/destaques/GoldPickCardCompact";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Flame, Activity, ListFilter, TrendingUp, CalendarDays, X } from "lucide-react";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pickKey(p: ScannerPick): string {
  return `${p.fixtureId}-${p.market ?? ""}-${p.selection ?? ""}-${p.label ?? ""}`;
}

type DrawerTab = "resumo" | "timeline" | "stats" | "lineups";

function isRelevantEvent(e: any): boolean {
  const type = String(e?.type ?? "").toLowerCase();
  const detail = String(e?.detail ?? "").toLowerCase();
  if (type === "goal") return true;
  if (type === "card") return detail.includes("yellow") || detail.includes("red");
  if (type.includes("var") || detail.includes("var")) return true;
  if (detail.includes("penalty")) return true;
  if (detail.includes("disallowed")) return true;
  return false;
}

function EventBadge({ e }: { e: any }) {
  const type = String(e?.type ?? "");
  const detail = String(e?.detail ?? "");
  const min = e?.time?.elapsed ?? e?.time?.elapsedTime ?? e?.minute ?? "—";
  const player = e?.player?.name ?? e?.playerName ?? "—";
  const icon =
    type.toLowerCase() === "goal"
      ? "⚽"
      : type.toLowerCase() === "card" && String(detail).toLowerCase().includes("red")
        ? "🟥"
        : type.toLowerCase() === "card"
          ? "🟨"
          : String(detail).toLowerCase().includes("penalty")
            ? "🎯"
            : "🟪";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-300">{min}'</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-100">
          {icon} {detail || type}
        </div>
        <div className="truncate text-xs text-slate-400">{player}</div>
      </div>
    </div>
  );
}

function StatRow({ label, home, away }: { label: string; home: any; away: any }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="flex items-center gap-2 text-sm tabular-nums text-slate-100">
        <span className="min-w-[40px] text-right">{home ?? "—"}</span>
        <span className="opacity-60">-</span>
        <span className="min-w-[40px]">{away ?? "—"}</span>
      </div>
    </div>
  );
}

function PickDetailPanel(props: {
  pick: ScannerPick | null;
  onClose: () => void;
}) {
  const { pick, onClose } = props;
  const fixtureId = pick?.fixtureId ?? null;

  const enabled = fixtureId != null;

  const eventsQ = trpc.football.fixtureEvents.useQuery(
    { fixtureId: fixtureId ?? 0 } as any,
    { enabled, refetchInterval: 10_000 }
  );
  const statsQ = trpc.football.fixtureStatistics.useQuery(
    { fixtureId: fixtureId ?? 0 } as any,
    { enabled, refetchInterval: 30_000 }
  );
  const lineupsQ = trpc.football.fixtureLineups.useQuery(
    { fixtureId: fixtureId ?? 0 } as any,
    { enabled, refetchInterval: 60_000 }
  );

  const [tab, setTab] = useState<DrawerTab>("resumo");

  useEffect(() => {
    if (pick) setTab("resumo");
  }, [fixtureId]);

  if (!pick) {
    return (
      <div className="h-full rounded-3xl border border-white/10 bg-[#0b1220]/60 p-4">
        <div className="text-sm font-semibold text-slate-100">Detalhes</div>
        <div className="mt-2 text-xs text-slate-400">
          Clique em um destaque para abrir o painel.
        </div>
      </div>
    );
  }

  const fixture = pick.fixture;
  const home = fixture?.home?.name ?? pick.teams?.home ?? "Casa";
  const away = fixture?.away?.name ?? pick.teams?.away ?? "Fora";
  const scoreH = fixture?.score?.home ?? pick.scoreLine?.home ?? null;
  const scoreA = fixture?.score?.away ?? pick.scoreLine?.away ?? null;
  const status = fixture?.statusShort ?? pick.status ?? "";
  const elapsed = fixture?.elapsed ?? pick.elapsed ?? null;

  const eventsRaw = (eventsQ.data as any)?.events ?? eventsQ.data ?? [];
  const relevantEvents = Array.isArray(eventsRaw) ? eventsRaw.filter(isRelevantEvent).slice(0, 15) : [];
  const statsRaw = (statsQ.data as any)?.statistics ?? statsQ.data ?? null;

  const lineupRaw = (lineupsQ.data as any)?.lineups ?? lineupsQ.data ?? null;

  return (
    <div className="h-full rounded-3xl border border-white/10 bg-[#0b1220]/60">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-100">
            {home} <span className="opacity-60">vs</span> {away}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">
              {status || "—"}{elapsed != null ? ` • ${elapsed}'` : ""}
            </span>
            {scoreH != null && scoreA != null && (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 tabular-nums">
                {scoreH}-{scoreA}
              </span>
            )}
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs text-slate-400">Pick</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">
              {pick.label ?? `${pick.market ?? "Mercado"} • ${pick.selection ?? ""}`}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 tabular-nums">
                Odd {pick.odd ?? "—"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 tabular-nums">
                EV {pick.ev ?? "—"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 tabular-nums">
                Edge {pick.edge ?? "—"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 tabular-nums">
                p_model {pick.pModel ?? "—"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 tabular-nums">
                p_market {pick.pMarket ?? "—"}
              </span>
            </div>

            {!!pick.reasons?.length && (
              <div className="mt-3">
                <div className="text-xs text-slate-400">Drivers</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {pick.reasons.slice(0, 4).map((r, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-slate-200"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 hover:bg-white/[0.06]"
          title="Fechar painel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10 p-3 text-xs">
        {(["resumo", "timeline", "stats", "lineups"] as DrawerTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-3 py-1.5",
              tab === t
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
            )}
          >
            {t === "resumo" ? "Resumo" : t === "timeline" ? "Timeline" : t === "stats" ? "Stats" : "Lineups"}
          </button>
        ))}
      </div>

      <div className="h-[calc(100%-160px)] overflow-y-auto p-4">
        {tab === "resumo" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                Qualidade do pick
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Clique nas abas para ver eventos, estatísticas e escalações do jogo.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold text-slate-100">Eventos relevantes (3)</div>
              <div className="mt-3 space-y-2">
                {relevantEvents.slice(0, 3).map((e, idx) => (
                  <EventBadge key={idx} e={e} />
                ))}
                {!relevantEvents.length && (
                  <div className="text-xs text-slate-400">Sem eventos relevantes.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "timeline" && (
          <div className="space-y-2">
            {relevantEvents.map((e, idx) => (
              <EventBadge key={idx} e={e} />
            ))}
            {!relevantEvents.length && (
              <div className="text-xs text-slate-400">Sem eventos relevantes.</div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400">
              Stats podem não estar disponíveis em todas as ligas (serão ocultados quando vazios).
            </div>

            {statsRaw ? (
              <>
                <StatRow label="Chutes" home={statsRaw?.shots?.home} away={statsRaw?.shots?.away} />
                <StatRow label="SOT" home={statsRaw?.sot?.home} away={statsRaw?.sot?.away} />
                <StatRow label="Escanteios" home={statsRaw?.corners?.home} away={statsRaw?.corners?.away} />
                <StatRow label="Posse" home={statsRaw?.possession?.home} away={statsRaw?.possession?.away} />
                <StatRow label="Cartões 🟨" home={statsRaw?.yellow?.home} away={statsRaw?.yellow?.away} />
                <StatRow label="Cartões 🟥" home={statsRaw?.red?.home} away={statsRaw?.red?.away} />
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
                Sem stats disponíveis.
              </div>
            )}
          </div>
        )}

        {tab === "lineups" && (
          <div className="space-y-3">
            {lineupRaw ? (
              <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[11px] text-slate-200">
                {JSON.stringify(lineupRaw, null, 2)}
              </pre>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
                Sem escalações disponíveis.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function computeAvailableLeagues(picks: ScannerPick[]) {
  const m = new Map<number, { id: number; name: string; country?: string }>();
  for (const p of picks) {
    const id = p.leagueId;
    if (!id) continue;
    if (!m.has(id)) {
      m.set(id, { id, name: p.leagueName ?? `Liga ${id}`, country: p.country });
    }
  }
  return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function applyBasicFilter(picks: ScannerPick[], f: DestaquesFilters) {
  if (!picks.length) return picks;
  let out = picks;

  // statusFilter is already applied by backend, but keep safety
  if (f.statusFilter?.length && f.statusFilter.length < 3) {
    const s = new Set(f.statusFilter);
    out = out.filter((p) => s.has((p.fixture?.statusShort as any) ?? (p.status as any)));
  }

  if (f.leagueIds?.length) {
    const ls = new Set(f.leagueIds);
    out = out.filter((p) => ls.has(p.leagueId));
  }
  return out;
}

function splitTiers(picks: ScannerPick[]) {
  // Heurística simples (ajuste fino depois): UltraGold = EV e Edge altos
  const ultra = picks.filter((p) => (p.ev ?? -1) >= 0.12 && (p.edge ?? -1) >= 0.06).slice(0, 5);
  const gold = picks.filter((p) => (p.ev ?? -1) >= 0.06 && (p.edge ?? -1) >= 0.03);
  return { ultra, gold };
}

export default function DestaquesPage() {
  const [filters, setFilters] = useState<DestaquesFilters>({
    date: todayISO(),
    statusFilter: ["LIVE", "UPCOMING", "FINISHED"],
    leagueIds: [],
    sort: "NEAREST_TIME",
    finishedWindowHours: 12,
  });

  const utils = trpc.useContext();

  const q = trpc.football.destaquesScanner.useQuery(
    {
      date: filters.date,
      statusFilter: filters.statusFilter as any,
      leagueIds: filters.leagueIds,
      sort: filters.sort as any,
      limit: 180,
      finishedWindowHours: filters.finishedWindowHours,
      // markets ficam default no backend v27a
    } as any,
    { refetchInterval: 30_000 }
  );

  const picks: ScannerPick[] = useMemo(() => {
    const raw = (q.data as any)?.picks ?? q.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [q.data]);

  const picksFiltered = useMemo(() => applyBasicFilter(picks, filters), [picks, filters]);

  const leagues = useMemo(() => computeAvailableLeagues(picks), [picks]);

  const { ultra, gold } = useMemo(() => splitTiers(picksFiltered), [picksFiltered]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedPick = useMemo(
    () => picksFiltered.find((p) => pickKey(p) === selectedKey) ?? null,
    [picksFiltered, selectedKey]
  );

  // Realtime: qualquer update relevante força refetch (leve, sem flicker)
  useRealtimeUpdates((u) => {
    // Atualizações ao vivo podem alterar odds, eventos e status -> refetch
    if (u.type === "goal" || u.type === "red_card" || u.type === "odd_move" || u.type === "next10_spike") {
      utils.football.destaquesScanner.invalidate().catch(() => undefined);
      if (selectedPick?.fixtureId === u.fixture_id) {
        utils.football.fixtureEvents.invalidate({ fixtureId: u.fixture_id } as any).catch(() => undefined);
        utils.football.fixtureStatistics.invalidate({ fixtureId: u.fixture_id } as any).catch(() => undefined);
      }
    }
  });

  useEffect(() => {
    // auto-select: primeiro UltraGold, senão primeiro da lista
    if (!selectedKey && picksFiltered.length) {
      const first = ultra[0] ?? picksFiltered[0];
      if (first) setSelectedKey(pickKey(first));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picksFiltered.length]);

  const counts = useMemo(() => {
    const live = picks.filter((p) => (p.fixture?.statusShort ?? p.status) === "LIVE").length;
    const upcoming = picks.filter((p) => (p.fixture?.statusShort ?? p.status) === "UPCOMING").length;
    const finished = picks.filter((p) => (p.fixture?.statusShort ?? p.status) === "FINISHED").length;
    return { live, upcoming, finished, total: picks.length };
  }, [picks]);

  return (
    <RaphaLayout title="Destaques">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10">
        {/* TopBar compacto */}
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-white/10 bg-[#071226]/80 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-300" />
                <div className="text-base font-semibold text-slate-100">Destaques do dia</div>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-slate-300">
                  {counts.total} picks
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{filters.date}</span>
                <span className="opacity-50">•</span>
                <span className="tabular-nums">
                  LIVE {counts.live} • Próx {counts.upcoming} • Final {counts.finished}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Activity className={cn("h-4 w-4", q.isFetching && "animate-pulse text-emerald-300")} />
              {q.isFetching ? "Atualizando…" : "Atualizado"}
            </div>
          </div>

          <div className="mt-3">
            <DestaquesTopBar
              value={filters}
              onChange={setFilters}
              counts={counts}
              updatedAtISO={new Date().toISOString()}
              availableLeagues={leagues}
            />
          </div>
        </div>

        {/* Conteúdo: grid + painel */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_520px]">
          {/* Lista / Grid */}
          <div className="space-y-4">
            {/* UltraGold */}
            <div className="rounded-3xl border border-amber-400/20 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-300" />
                  <div className="text-sm font-semibold text-slate-100">UltraGold Top 5</div>
                </div>
                <div className="text-xs text-slate-400">EV alto + Edge alto</div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ultra.map((p) => (
                  <button
                    key={pickKey(p)}
                    onClick={() => setSelectedKey(pickKey(p))}
                    className={cn(
                      "text-left transition",
                      selectedPick && pickKey(selectedPick) === pickKey(p) ? "ring-2 ring-amber-300/30" : ""
                    )}
                  >
                    <GoldPickCardCompact pick={p as any} />
                  </button>
                ))}
                {!ultra.length && (
                  <div className="text-xs text-slate-400">Sem UltraGold no filtro atual.</div>
                )}
              </div>
            </div>

            {/* Grid principal */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-slate-300" />
                  <div className="text-sm font-semibold text-slate-100">Todos os destaques</div>
                </div>
                <div className="text-xs text-slate-400">
                  {picksFiltered.length} itens
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {picksFiltered.map((p) => (
                  <button
                    key={pickKey(p)}
                    onClick={() => setSelectedKey(pickKey(p))}
                    className={cn(
                      "text-left transition",
                      selectedPick && pickKey(selectedPick) === pickKey(p) ? "ring-2 ring-emerald-300/20" : ""
                    )}
                  >
                    <GoldPickCardCompact pick={p as any} />
                  </button>
                ))}
                {!picksFiltered.length && (
                  <div className="text-xs text-slate-400">
                    Nenhum pick no filtro atual. Tente alterar status, data ou liga.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Painel direito */}
          <div className="lg:sticky lg:top-[148px] lg:h-[calc(100vh-170px)]">
            <PickDetailPanel pick={selectedPick} onClose={() => setSelectedKey(null)} />
          </div>
        </div>
      </div>
    </RaphaLayout>
  );
}
