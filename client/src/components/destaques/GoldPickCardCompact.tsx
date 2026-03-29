import { ExternalLink, Info, LayoutDashboard } from "lucide-react";
import { useLocation } from "wouter";

type Momentum = { home: number; away: number; bias?: number };

export type ScannerPick = {
  fixtureId: number;
  leagueId: number;
  leagueName?: string;
  country?: string;

  market?: string;
  selection?: string;
  label?: string;

  score?: number;
  pModel?: number | null;
  pMarket?: number | null;
  edge?: number | null;
  ev?: number | null;
  odd?: number | null;

  reasons?: string[];
  momentum?: Momentum;

  fixture?: {
    dateISO?: string;
    statusShort?: string;
    elapsed?: number | null;
    home?: { name: string; logo?: string };
    away?: { name: string; logo?: string };
    score?: { home?: number | null; away?: number | null };
  };

  // fallback legacy
  teams?: { home?: string; away?: string; homeLogo?: string; awayLogo?: string };
  status?: string;
  elapsed?: number | null;
  scoreLine?: { home?: number | null; away?: number | null };
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pct(v?: number | null) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${Math.round(v * 100)}%`;
}

function fmt2(v?: number | null) {
  if (v == null || !Number.isFinite(v)) return "—";
  return Number(v).toFixed(2);
}

function safeTeamName(p: ScannerPick, side: "home" | "away") {
  return (
    p.fixture?.[side]?.name ||
    (side === "home" ? p.teams?.home : p.teams?.away) ||
    "—"
  );
}

function safeTeamLogo(p: ScannerPick, side: "home" | "away") {
  return (
    p.fixture?.[side]?.logo ||
    (side === "home" ? p.teams?.homeLogo : p.teams?.awayLogo) ||
    ""
  );
}

function safeStatus(p: ScannerPick) {
  return p.fixture?.statusShort || p.status || "";
}

function safeElapsed(p: ScannerPick) {
  return (p.fixture?.elapsed ?? p.elapsed) ?? null;
}

function safeScore(p: ScannerPick) {
  const h = p.fixture?.score?.home ?? p.scoreLine?.home ?? null;
  const a = p.fixture?.score?.away ?? p.scoreLine?.away ?? null;
  return { home: h, away: a };
}

function MomentumBar({ m }: { m: Momentum }) {
  const home = Math.max(0, Math.min(100, m.home));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
      <div className="h-full bg-emerald-500/60" style={{ width: `${home}%` }} />
    </div>
  );
}

export function GoldPickCardCompact(props: {
  pick: ScannerPick;
  onOpenDetail?: (fixtureId: number) => void;
  showActions?: boolean;
  dense?: boolean;
}) {
  const { pick, onOpenDetail, showActions = true, dense = true } = props;
  const [, setLocation] = useLocation();

  const homeName = safeTeamName(pick, "home");
  const awayName = safeTeamName(pick, "away");
  const homeLogo = safeTeamLogo(pick, "home");
  const awayLogo = safeTeamLogo(pick, "away");

  const status = safeStatus(pick);
  const elapsed = safeElapsed(pick);
  const score = safeScore(pick);

  const momentum = pick.momentum ?? { home: 50, away: 50, bias: 0 };
  const title = pick.label ?? `${pick.market ?? ""} ${pick.selection ?? ""}`.trim();

  return (
    <div className={cn("relative rounded-xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.05]", dense ? "p-3" : "p-4")}>
      {/* watermark */}
      <div className="pointer-events-none absolute right-2 top-2 opacity-[0.06] text-6xl">⚽</div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {homeLogo ? (
              <img
                src={homeLogo}
                alt=""
                className="h-5 w-5 rounded-sm bg-white/5 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : null}
            <div className="truncate text-sm font-semibold text-white">{homeName}</div>
            <div className="text-xs opacity-60">vs</div>
            {awayLogo ? (
              <img
                src={awayLogo}
                alt=""
                className="h-5 w-5 rounded-sm bg-white/5 object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : null}
            <div className="truncate text-sm font-semibold text-white">{awayName}</div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300/90">
            <span className="rounded-md border border-white/10 bg-white/[0.02] px-1.5 py-0.5">
              {pick.leagueName ?? `Liga ${pick.leagueId}`}
            </span>
            {status ? (
              <span className="rounded-md border border-white/10 bg-white/[0.02] px-1.5 py-0.5">
                {status}
              </span>
            ) : null}
            {elapsed != null ? (
              <span className="rounded-md border border-white/10 bg-white/[0.02] px-1.5 py-0.5 tabular-nums">
                {elapsed}'
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums text-white">
            {score.home != null && score.away != null ? `${score.home} - ${score.away}` : "—"}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-300/80">
            {pick.market ?? ""}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-2 grid grid-cols-5 gap-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="text-[10px] text-slate-400">Score</div>
          <div className="text-sm font-semibold tabular-nums text-white">{pick.score ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="text-[10px] text-slate-400">Modelo</div>
          <div className="text-sm font-semibold tabular-nums text-white">{pct(pick.pModel ?? null)}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="text-[10px] text-slate-400">Mercado</div>
          <div className="text-sm font-semibold tabular-nums text-white">{pct(pick.pMarket ?? null)}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="text-[10px] text-slate-400">Edge</div>
          <div className="text-sm font-semibold tabular-nums text-white">
            {pick.edge != null ? `${Math.round(pick.edge * 100)}%` : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="text-[10px] text-slate-400">EV / Odd</div>
          <div className="text-sm font-semibold tabular-nums text-white">
            {pick.ev != null ? `${Math.round(pick.ev * 100)}%` : "—"}{" "}
            <span className="opacity-70">({fmt2(pick.odd ?? null)})</span>
          </div>
        </div>
      </div>

      {/* Thermometer */}
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
          <span>Termômetro</span>
          <span className="tabular-nums">{momentum.home}% / {momentum.away}%</span>
        </div>
        <MomentumBar m={momentum} />
      </div>

      {/* Title + reasons */}
      <div className="mt-2 text-xs">
        <div className="font-semibold text-slate-100">{title || "—"}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {(pick.reasons ?? []).slice(0, 2).map((r) => (
            <span
              key={r}
              className="rounded-md border border-white/10 bg-white/[0.02] px-1.5 py-0.5 text-[11px] text-slate-200/90"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      {showActions ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenDetail?.(pick.fixtureId)}
            className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
          >
            <Info className="h-4 w-4" />
            Ver detalhado
          </button>

          <button
            onClick={() => setLocation(`/match-center?fixtureId=${pick.fixtureId}`)}
            className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
          >
            <LayoutDashboard className="h-4 w-4" />
            MatchCenter
          </button>

          <button
            onClick={() => window.open(`/match-center?fixtureId=${pick.fixtureId}`, "_blank")}
            className="flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 hover:bg-white/[0.06]"
          >
            <ExternalLink className="h-4 w-4" />
            Nova aba
          </button>
        </div>
      ) : null}
    </div>
  );
}
