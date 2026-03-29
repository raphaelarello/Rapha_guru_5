import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight } from "lucide-react";
import { DrawerProComplete } from "./DrawerProComplete";
import type { MatchSummary } from "./match-helpers";

type TeamSide = "home" | "away";

export type RelevantEvent = {
  minute: number;
  type: "GOAL" | "RED" | "YELLOW" | "VAR" | "PENALTY";
  player: string;
  teamSide: TeamSide;
};

export type Next10 = {
  goal: number;
  corner: number;
  card: number;
};

export type MatchStats = {
  corners: { home: number; away: number };
  yellow: { home: number; away: number };
  red: { home: number; away: number };
  shots: { home: number; away: number };
  sot: { home: number; away: number };
  possession: { home: number; away: number };
  dangerous?: { home: number; away: number } | null;
};

export type OddsLine = {
  label: string;
  odd: number;
  book?: string;
  delta5m?: number;
  updatedSecAgo?: number;
  stale?: boolean;
};

export type Decision = {
  ev?: number;
  edgePct?: number;
  pModel?: number;
  pMarket?: number;
};

export type CompactTraderCardModel = {
  leagueName: string;
  leagueFlagEmoji?: string;
  liveBadge?: boolean;

  homeName: string;
  awayName: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;

  minute: number;
  scoreHome: number;
  scoreAway: number;

  next10Home?: Next10;
  next10Away?: Next10;

  stats: MatchStats;

  pressureLabel: string;
  pressureDrivers?: string;

  oddsPrimary?: OddsLine;
  oddsSecondary?: OddsLine;
  decision?: Decision;

  events: RelevantEvent[];
  onOpenDetails?: () => void;
  isLoadingDetails?: boolean;
};

function clamp(n: number, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function fmtOdd(o?: number) {
  if (o == null || !Number.isFinite(o)) return "—";
  return o.toFixed(2);
}

function fmtPct(p?: number) {
  if (p == null || !Number.isFinite(p)) return "—";
  return `${Math.round(p)}%`;
}

function iconForEvent(t: RelevantEvent["type"]) {
  switch (t) {
    case "GOAL":
      return "⚽";
    case "RED":
      return "🟥";
    case "YELLOW":
      return "🟨";
    case "VAR":
      return "🟪";
    case "PENALTY":
      return "🎯";
    default:
      return "•";
  }
}

function shortEvent(e: RelevantEvent) {
  return `${e.minute}' ${iconForEvent(e.type)} ${e.player}`;
}

function getEventColor(type: RelevantEvent["type"], isRecent = false): string {
  if (isRecent) {
    switch (type) {
      case "GOAL":
        return "bg-emerald-500/18 border-emerald-300/50 text-emerald-50 shadow-[0_0_18px_rgba(16,185,129,0.18)]";
      case "RED":
        return "bg-red-500/18 border-red-300/50 text-red-50 shadow-[0_0_18px_rgba(239,68,68,0.18)]";
      case "YELLOW":
        return "bg-yellow-400/18 border-yellow-300/50 text-yellow-50 shadow-[0_0_18px_rgba(250,204,21,0.18)]";
      case "VAR":
        return "bg-purple-500/18 border-purple-300/50 text-purple-50 shadow-[0_0_18px_rgba(147,51,234,0.18)]";
      case "PENALTY":
        return "bg-blue-500/18 border-blue-300/50 text-blue-50 shadow-[0_0_18px_rgba(59,130,246,0.18)]";
      default:
        return "bg-white/8 border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.1)]";
    }
  }
  switch (type) {
    case "GOAL":
      return "bg-emerald-500/12 border-emerald-300/35 text-emerald-100";
    case "RED":
      return "bg-red-500/12 border-red-300/35 text-red-100";
    case "YELLOW":
      return "bg-yellow-500/10 border-yellow-300/30 text-yellow-100";
    case "VAR":
      return "bg-purple-500/12 border-purple-300/35 text-purple-100";
    case "PENALTY":
      return "bg-blue-500/12 border-blue-300/35 text-blue-100";
    default:
      return "bg-white/6 border-white/10 text-white";
  }
}

function StatPill({ label, value }: { label: string; value: string }) {
  // Cores VIVAS por tipo de stat
  let bgClass = "bg-white/6 border-white/10 text-white";
  
  if (label.includes("Esc")) bgClass = "bg-cyan-500/12 border-cyan-300/35 text-cyan-100";
  else if (label.includes("🟨")) bgClass = "bg-yellow-500/12 border-yellow-300/35 text-yellow-100";
  else if (label.includes("🟥")) bgClass = "bg-red-500/12 border-red-300/35 text-red-100";
  else if (label.includes("SOT")) bgClass = "bg-cyan-500/12 border-cyan-300/35 text-cyan-100";
  else if (label.includes("Chutes")) bgClass = "bg-orange-500/12 border-orange-300/35 text-orange-100";
  else if (label.includes("Posse")) bgClass = "bg-blue-500/12 border-blue-300/35 text-blue-100";
  else if (label.includes("Perig")) bgClass = "bg-orange-500/12 border-orange-300/35 text-orange-100";
  
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${bgClass}`}>
      <span className="text-[10px]">{label}</span>
      <span className="text-[10px] font-semibold">{value}</span>
    </div>
  );
}

function Next10Mini({ title, v }: { title: string; v: number }) {
  const pct = clamp(v);
  // Cores VIVAS para Next10
  let barColor = "bg-white/30";
  let bgClass = "bg-white/6 border-white/10";
  
  if (title.includes("Gol")) {
    barColor = "bg-emerald-400";
    bgClass = "bg-emerald-500/10 border-emerald-300/30";
  } else if (title.includes("Esc")) {
    barColor = "bg-cyan-400";
    bgClass = "bg-cyan-500/10 border-cyan-300/30";
  } else if (title.includes("Cart")) {
    barColor = "bg-yellow-400";
    bgClass = "bg-yellow-500/10 border-yellow-300/30";
  }
  
  return (
    <div className={`min-w-[64px] rounded-xl border px-2 py-1.5 ${bgClass}`}>
      <div className="text-[10px] text-white/90">{title}</div>
      <div className="text-sm font-bold leading-tight text-white">{fmtPct(pct)}</div>
      <div className="mt-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TeamBlock({
  side,
  name,
  logoUrl,
  next10,
  alignRight,
}: {
  side: TeamSide;
  name: string;
  logoUrl?: string;
  next10?: Next10;
  alignRight?: boolean;
}) {
  return (
    <div className={`min-w-0 ${alignRight ? "text-right" : "text-left"}`}>
      <div className={`flex items-center gap-1.5 ${alignRight ? "justify-end" : "justify-start"}`}>
        {!alignRight && logoUrl && !logoUrl.includes('api-sports.io') && (
          <img src={logoUrl} alt={name} className="h-6 w-6 rounded-full border border-white/10 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{name}</div>
          {/* Next10 abaixo do nome do time */}
          {next10 && (
            <div className={`mt-1 flex gap-1.5 ${alignRight ? "justify-end" : "justify-start"}`}>
              <Next10Mini title="Gol (10')" v={next10.goal} />
              <Next10Mini title="Esc (10')" v={next10.corner} />
              <Next10Mini title="Cart (10')" v={next10.card} />
            </div>
          )}
        </div>
        {alignRight && logoUrl && !logoUrl.includes('api-sports.io') && (
          <img src={logoUrl} alt={name} className="h-6 w-6 rounded-full border border-white/10 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
      </div>
    </div>
  );
}

export function CompactTraderCard({ m, match }: { m: CompactTraderCardModel; match?: MatchSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [recentEventMinute, setRecentEventMinute] = useState<number | null>(null);

  const openDrawerTab = (tab: string) => {
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  const isEventRecent = (event: RelevantEvent) => {
    if (recentEventMinute === null) return false;
    const timeDiff = Math.abs(event.minute - recentEventMinute);
    if (event.type === "RED") return timeDiff < 0.5;
    if (event.type === "GOAL") return timeDiff < 0.17;
    return timeDiff < 0.08;
  };

  // Buscar odds reais da API
  const oddsQuery = match?.fixtureId ? { enabled: true } : { enabled: false };

  const dangerous = m.stats.dangerous;
  const dangerousText =
    dangerous && (dangerous.home + dangerous.away > 0)
      ? `${dangerous.home}-${dangerous.away}`
      : "—";

  const topEvents = useMemo(() => m.events.slice(0, 3), [m.events]);

  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-[#0b1220]/65 backdrop-blur-xl p-2 shadow-sm hover:shadow-md transition-shadow"
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] opacity-70 truncate">
            {m.leagueFlagEmoji ? `${m.leagueFlagEmoji} ` : ""}{m.leagueName}
          </span>
          {m.liveBadge && (
            <span className="rounded-full bg-red-500/20 border border-red-400/20 px-1 py-0.5 text-[8px] font-semibold">
              AO VIVO
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            className="rounded-full bg-white/6 border border-white/10 p-1.5 hover:bg-white/10 text-sm"
            aria-label="Som"
            type="button"
          >
            🔊
          </button>
          <button
            className="rounded-full bg-white/6 border border-white/10 p-1.5 hover:bg-white/10 text-sm"
            aria-label="Modo ultra compacto"
            type="button"
          >
            ⚡
          </button>
        </div>
      </div>

      {/* Times + Placar - Clicável para abrir Timeline */}
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-start gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openDrawerTab("timeline")}>
        <TeamBlock side="home" name={m.homeName} logoUrl={m.homeLogoUrl} next10={m.next10Home} />
        <div className="text-center">
          <div className="text-xl font-extrabold leading-none">
            {m.scoreHome}
            <span className="opacity-40 mx-1.5">-</span>
            {m.scoreAway}
          </div>
          <div className="mt-0.5 text-[10px] opacity-70">{m.minute}'</div>
        </div>
        <TeamBlock
          side="away"
          name={m.awayName}
          logoUrl={m.awayLogoUrl}
          next10={m.next10Away}
          alignRight
        />
      </div>

      {/* Stats essenciais (compacto, 1 linha) - Clicável para abrir Stats */}
      <div className="mt-1.5 flex flex-wrap gap-1 cursor-pointer" onClick={() => openDrawerTab("stats")}>
        <StatPill label="Escanteios" value={`${m.stats.corners.home}-${m.stats.corners.away}`} />
        <StatPill label="🟨" value={`${m.stats.yellow.home}-${m.stats.yellow.away}`} />
        <StatPill label="🟥" value={`${m.stats.red.home}-${m.stats.red.away}`} />
        <StatPill label="Chutes Alvo" value={`${m.stats.sot.home}-${m.stats.sot.away}`} />
        <StatPill label="Chutes" value={`${m.stats.shots.home}-${m.stats.shots.away}`} />
        <StatPill label="Posse" value={`${m.stats.possession.home}%-${m.stats.possession.away}%`} />
        <StatPill label="Perigosos" value={dangerousText} />
      </div>

      {/* Pressão (compacto) - Clicável para abrir Pressão */}
      <div className="mt-1.5 flex items-center justify-between gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openDrawerTab("pressao")}>
        <div className="text-[11px] font-semibold">Pressão: {m.pressureLabel}</div>
        <button
          type="button"
          className="text-[10px] opacity-70 hover:opacity-100"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Menos ▲" : "Mais ▼"}
        </button>
      </div>
      {m.pressureDrivers && (
        <div className="mt-0.5 text-[10px] opacity-70">Fatores: {m.pressureDrivers}</div>
      )}

      {/* Odds + stale - Clicável para abrir Odds */}
      <div className="mt-1.5 rounded-lg border border-white/10 bg-white/6 p-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openDrawerTab("odds")}>
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            <div className="text-xs font-semibold">
              {m.oddsPrimary?.label ?? "Acima/Abaixo"}{" "}
              <span className="opacity-90">{fmtOdd(m.oddsPrimary?.odd)}</span>
              {m.oddsPrimary?.delta5m != null && (
                <span className="ml-2 text-xs opacity-80">
                  Δ {m.oddsPrimary.delta5m > 0 ? "+" : ""}{m.oddsPrimary.delta5m.toFixed(2)} (5m)
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[10px] opacity-75">
              {m.oddsSecondary?.label ?? "Ambos Marcam"} {fmtOdd(m.oddsSecondary?.odd)}
              {m.oddsSecondary?.book ? ` • ${m.oddsSecondary.book}` : ""}
            </div>
          </div>

          <div className="text-right">
            {m.oddsPrimary?.stale && (
              <div className="inline-flex rounded-full bg-red-500/20 border border-red-400/20 px-1.5 py-0.5 text-[8px] font-semibold">
                DESATUALIZADA
              </div>
            )}
            <div className="mt-0.5 text-[9px] opacity-70">
              {m.oddsPrimary?.updatedSecAgo != null ? `${m.oddsPrimary.updatedSecAgo}s` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* EV / Edge - Clicável para abrir Modelo */}
      <div className="mt-1.5 rounded-lg border border-white/10 bg-white/6 p-1.5 text-xs cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openDrawerTab("modelo")}>
        <span className="font-semibold">VE {m.decision?.ev != null ? m.decision.ev.toFixed(2) : "—"}</span>
        <span className="opacity-70">
          {" "}• Margem {m.decision?.edgePct != null ? `${m.decision.edgePct.toFixed(1)}%` : "—"}
          {" "}• Prob. Modelo {m.decision?.pModel != null ? m.decision.pModel.toFixed(2) : "—"}
          {" "}• Prob. Mercado {m.decision?.pMarket != null ? m.decision.pMarket.toFixed(2) : "—"}
        </span>
      </div>

      {/* Mini timeline com cores por tipo e glow em eventos recentes */}
      <div className="mt-3 text-xs">
        {topEvents.length ? (
          <div className="flex flex-wrap gap-2">
            {topEvents.map((e, idx) => {
              const recent = isEventRecent(e);
              return (
                <span key={idx} className={`rounded-full border px-3 py-1 transition-all ${getEventColor(e.type, recent)}`}>
                  {shortEvent(e)}{" "}
                  <span className={recent ? "opacity-90" : "opacity-70"}>
                    ({e.teamSide === "home" ? m.homeName : m.awayName})
                  </span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="opacity-70">Sem eventos relevantes.</div>
        )}
      </div>

      {/* Expandido: detalhes extras */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <div className="text-xs opacity-80 mb-3">
              Clique abaixo para ver escalações, timeline completa e análise detalhada.
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="w-full rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 px-3 py-2 text-sm font-semibold flex items-center justify-center gap-2 text-emerald-400"
            >
              Abrir detalhes
              <ChevronRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer com detalhes completos */}
      {match && (
        <DrawerProComplete
          match={match}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          activeTab={activeTab}
        />
      )}
    </motion.div>
  );
}
