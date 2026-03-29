import { useMemo, useState } from "react";
import {
  type MatchSummary,
  resumirFixture,
  resumirFixtureV2,
  getCall,
  statusLegivel,
  isLive,
  isEncerrado,
  isAgendado,
  corMapaCalor,
  labelMapaCalor,
  traduzirPais,
} from "./match-helpers";
import { Flag, Flame, Zap, Shield, Swords, ChevronRight } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   MatchRow — Compacto com carimbos, termômetro e forma
   ═══════════════════════════════════════════════════════════════ */
export type MatchLike = MatchSummary & { syncing?: boolean };

/* Mini badge de forma: V V E D V */
function FormaBadge({ forma }: { forma: string[] }) {
  if (!forma || !forma.length) return null;
  const ultimos = forma.slice(0, 5);
  return (
    <div className="flex items-center gap-[2px]">
      {ultimos.map((r, i) => {
        const isW = r === "W";
        const isD = r === "D";
        const isL = r === "L";
        return (
          <span
            key={i}
            className={[
              "inline-flex items-center justify-center h-[14px] w-[14px] rounded-[2px] text-[8px] font-black leading-none",
              isW ? "bg-emerald-500/80 text-white" : isD ? "bg-amber-500/70 text-white" : isL ? "bg-red-500/70 text-white" : "bg-slate-600/50 text-slate-400",
            ].join(" ")}
            title={isW ? "Vitória" : isD ? "Empate" : isL ? "Derrota" : r}
          >
            {isW ? "V" : isD ? "E" : isL ? "D" : r.charAt(0)}
          </span>
        );
      })}
    </div>
  );
}

/* Mini termômetro horizontal */
function Termometro({ valor }: { valor: number }) {
  const pct = Math.min(100, Math.max(0, valor));
  const cor = pct >= 75 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : pct >= 25 ? "bg-emerald-500" : "bg-slate-500";
  return (
    <div className="flex items-center gap-1" title={`Intensidade: ${pct}°`}>
      <div className="h-[4px] w-[32px] rounded-full bg-slate-700/60 overflow-hidden">
        <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[8px] font-bold ${pct >= 75 ? "text-red-400" : pct >= 50 ? "text-amber-400" : "text-slate-500"}`}>{pct}°</span>
    </div>
  );
}

/* Mini carimbo de equipe */
function CarimboBadge({ carimbo }: { carimbo?: string }) {
  if (!carimbo || carimbo === "📊 Equilibrado") return null;
  // Extrair emoji e texto
  const emoji = carimbo.match(/^[\p{Emoji}\s]+/u)?.[0]?.trim() || "";
  const texto = carimbo.replace(/^[\p{Emoji}\s]+/u, "").trim();
  const isPositivo = carimbo.includes("Matador") || carimbo.includes("Forte") || carimbo.includes("Sólida") || carimbo.includes("Dominante");
  const isNegativo = carimbo.includes("Crise") || carimbo.includes("Apagado") || carimbo.includes("Frágil") || carimbo.includes("Cansando");
  return (
    <span className={[
      "inline-flex items-center gap-0.5 rounded-[3px] px-1 py-[1px] text-[7px] font-bold uppercase tracking-wide leading-none whitespace-nowrap",
      isPositivo ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
        : isNegativo ? "bg-red-500/15 text-red-400 border border-red-500/20"
        : "bg-slate-500/15 text-slate-400 border border-slate-500/20",
    ].join(" ")} title={carimbo}>
      {emoji && <span className="text-[8px]">{emoji}</span>}
      {texto.length > 14 ? texto.slice(0, 14) + "…" : texto}
    </span>
  );
}

function GolInline({ gols }: { gols: Array<{ jogador: string; minuto: string }> }) {
  if (!gols.length) return null;
  return (
    <>
      {gols.slice(0, 2).map((g, i) => (
        <span key={i} className="text-[9px] text-emerald-400 font-medium shrink-0" title={g.jogador}>
          ⚽{g.jogador && g.jogador !== "Gol" ? g.jogador.split(" ").pop() : ""} {g.minuto}
        </span>
      ))}
      {gols.length > 2 && <span className="text-[8px] text-emerald-500 font-medium">+{gols.length - 2}</span>}
    </>
  );
}

function CartaoInline({ amarelos, vermelhos }: { amarelos: number; vermelhos: number }) {
  if (!amarelos && !vermelhos) return null;
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      {amarelos > 0 && <span className="flex items-center gap-0.5 text-[8px] font-bold text-amber-400"><span className="inline-block h-2 w-1.5 rounded-[1px] bg-amber-400" />{amarelos > 1 ? amarelos : ""}</span>}
      {vermelhos > 0 && <span className="flex items-center gap-0.5 text-[8px] font-bold text-red-400"><span className="inline-block h-2 w-1.5 rounded-[1px] bg-red-500" />{vermelhos > 1 ? vermelhos : ""}</span>}
    </span>
  );
}

/* Termômetro ao vivo — pressão Casa/Fora */
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function ThermometroAoVivo({
  casa,
  fora,
  live,
}: {
  casa: number;
  fora: number;
  live: boolean;
}) {
  const total = Math.max(1, casa + fora);
  const pCasa = clamp01(casa / total);
  const pFora = 1 - pCasa;

  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-1 flex h-[6px] items-center">
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="absolute left-0 top-0 h-full bg-emerald-400/70"
          style={{ width: `${Math.round(pCasa * 100)}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-sky-400/60"
          style={{ width: `${Math.round(pFora * 100)}%` }}
        />
      </div>
      {live && <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />}
    </div>
  );
}

/* Ilustração discreta de bola */
function IlustracaoBola() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-2 top-2 h-6 w-6 opacity-[0.09]"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7.3l3.2 2.3-1.2 3.7H10L8.8 9.6 12 7.3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MatchRow({
  match,
  ativo = false,
  onClick,
  isHot,
}: {
  match: MatchLike;
  ativo?: boolean;
  onClick?: () => void;
  isHot?: boolean;
}) {
  const ev = match.eventosResumo;
  const live = isLive(match.status, match.minute);
  const enc = isEncerrado(match.status);
  const homeWin = (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin = (match.awayScore ?? 0) > (match.homeScore ?? 0);
  const hasForma = (match.formaCasa?.length > 0) || (match.formaFora?.length > 0);
  const hasCarimbos = (match.carimboCasa && match.carimboCasa !== "📊 Equilibrado") || (match.carimboFora && match.carimboFora !== "📊 Equilibrado");

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative w-full text-left transition-all",
        "border-b border-white/[0.04] px-2 py-1",
        isHot ? "bg-gradient-to-r from-amber-500/8 via-transparent to-transparent"
          : ativo ? "bg-emerald-500/8 border-l-2 border-l-emerald-400"
          : "hover:bg-white/[0.03]",
      ].join(" ")}
    >
      <IlustracaoBola />
      <ThermometroAoVivo casa={match.estatisticasResumo?.pressaoCasa ?? 50} fora={match.estatisticasResumo?.pressaoFora ?? 50} live={live} />
      {/* Row principal: Status | Casa vs Fora | Placar */}
      <div className="flex items-center gap-1">
        {/* Status / Minuto */}
        <div className="w-[32px] shrink-0 text-center">
          {live ? (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-red-400 animate-pulse">{match.minute}'</span>
            </div>
          ) : enc ? (
            <span className="text-[9px] font-semibold text-slate-500">Enc</span>
          ) : (
            <span className="text-[9px] font-medium text-slate-500">
              {match.date ? new Date(match.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
            </span>
          )}
        </div>

        {/* Times + Placar */}
        <div className="flex-1 min-w-0">
          {/* Linha Casa */}
          <div className="flex items-center gap-1">
            {match.homeTeam?.logo ? (
              <img src={match.homeTeam.logo} alt="" className="h-3 w-3 shrink-0 object-contain" loading="lazy" />
            ) : (
              <div className="h-3 w-3 shrink-0 rounded-full bg-slate-700" />
            )}
            <span className={`min-w-0 truncate text-[11px] leading-tight ${homeWin ? "font-bold text-white" : "font-medium text-slate-300"}`}>
              {match.homeTeam?.name || "Casa"}
            </span>
            <div className="flex items-center gap-0.5 ml-auto">
              <GolInline gols={ev.golsCasa} />
              <CartaoInline amarelos={ev.amarelosCasa} vermelhos={ev.vermelhosCasa} />
            </div>
            <span className={`w-[18px] shrink-0 text-right text-xs font-black leading-tight ${live ? (homeWin ? "text-white" : "text-slate-300") : enc ? "text-slate-400" : "text-slate-500"}`}>
              {match.homeScore ?? "-"}
            </span>
          </div>
          {/* Linha Fora */}
          <div className="flex items-center gap-1 mt-[1px]">
            {match.awayTeam?.logo ? (
              <img src={match.awayTeam.logo} alt="" className="h-3 w-3 shrink-0 object-contain" loading="lazy" />
            ) : (
              <div className="h-3 w-3 shrink-0 rounded-full bg-slate-700" />
            )}
            <span className={`min-w-0 truncate text-[11px] leading-tight ${awayWin ? "font-bold text-white" : "font-medium text-slate-300"}`}>
              {match.awayTeam?.name || "Fora"}
            </span>
            <div className="flex items-center gap-0.5 ml-auto">
              <GolInline gols={ev.golsFora} />
              <CartaoInline amarelos={ev.amarelosFora} vermelhos={ev.vermelhosFora} />
            </div>
            <span className={`w-[18px] shrink-0 text-right text-xs font-black leading-tight ${live ? (awayWin ? "text-white" : "text-slate-300") : enc ? "text-slate-400" : "text-slate-500"}`}>
              {match.awayScore ?? "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Barra inferior: Forma + Carimbos + Termômetro */}
      {(live || hasForma || hasCarimbos || (match.mapaCalor > 30)) && (
        <div className="flex items-center gap-1.5 mt-[2px] ml-[33px] flex-wrap">
          {/* Forma dos times */}
          {match.formaCasa?.length > 0 && (
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] text-slate-500 font-medium">C</span>
              <FormaBadge forma={match.formaCasa} />
            </div>
          )}
          {match.formaFora?.length > 0 && (
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] text-slate-500 font-medium">F</span>
              <FormaBadge forma={match.formaFora} />
            </div>
          )}
          {/* Carimbos */}
          <CarimboBadge carimbo={match.carimboCasa} />
          <CarimboBadge carimbo={match.carimboFora} />
          {/* Termômetro */}
          {(live || match.mapaCalor > 30) && <Termometro valor={match.mapaCalor} />}
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LeagueGroup — Agrupa jogos por liga (estilo SofaScore)
   ═══════════════════════════════════════════════════════════════ */
export function LeagueGroup({
  leagueName,
  countryFlag,
  leagueLogo,
  matches,
  selectedId,
  onSelect,
  hotFixtureId,
}: {
  leagueName: string;
  countryFlag?: string | null;
  leagueLogo?: string | null;
  matches: MatchLike[];
  selectedId?: number | null;
  onSelect: (id: number) => void;
  hotFixtureId?: number | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="overflow-hidden rounded-md border border-white/[0.06] bg-[#0f1923]">
      <button type="button" onClick={() => setCollapsed((v) => !v)} className="flex w-full items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 hover:bg-white/[0.03]">
        {countryFlag && <img src={countryFlag} alt="" className="h-3 w-4 shrink-0 rounded-sm object-cover" loading="lazy" />}
        {leagueLogo && <img src={leagueLogo} alt="" className="h-3 w-3 shrink-0 rounded object-contain" loading="lazy" />}
        {!countryFlag && !leagueLogo && <Flag className="h-3 w-3 text-slate-500" />}
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">{leagueName}</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="rounded-full bg-slate-700/40 px-1.5 py-0.25 text-[9px] font-semibold text-slate-400">{matches.length}</span>
          <ChevronRight className={`h-3 w-3 text-slate-500 transition-transform ${collapsed ? "" : "rotate-90"}`} />
        </span>
      </button>
      {!collapsed && <div className="space-y-0.5">
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            ativo={selectedId === match.id}
            onClick={() => onSelect(match.id)}
            isHot={hotFixtureId === match.id}
          />
        ))}
      </div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Helpers de parse e agrupamento
   ═══════════════════════════════════════════════════════════════ */
export function parseJogosAoVivo(jogos: any[]): MatchLike[] {
  return (jogos || []).map((jogo: any) => resumirFixtureV2(jogo) as MatchLike);
}

export function parseJogosHoje(jogos: any[]): MatchLike[] {
  const result: MatchLike[] = [];
  for (const liga of (jogos || [])) {
    for (const j of (liga.jogos || [])) {
      result.push({
        id: j.id || 0,
        fixtureId: j.id || 0,
        homeTeam: { id: null, name: traduzirPais(j.homeTeam || ""), logo: j.homeLogo || null },
        awayTeam: { id: null, name: traduzirPais(j.awayTeam || ""), logo: j.awayLogo || null },
        homeScore: j.homeScore ?? null,
        awayScore: j.awayScore ?? null,
        minute: j.minute ?? null,
        status: j.status || "NS",
        statusLongo: null,
        stadium: null,
        league: liga.liga?.name || liga.name || "Liga",
        leagueLogo: liga.liga?.logo || liga.logo || null,
        leagueRound: null,
        countryFlag: liga.liga?.flag || liga.flag || null,
        countryName: liga.liga?.country || liga.country || null,
        date: j.date || null,
        timestamp: j.timestamp || null,
        eventosResumo: { golsCasa: [], golsFora: [], amarelosCasa: 0, amarelosFora: 0, vermelhosCasa: 0, vermelhosFora: 0, eventosCompletos: [] },
        estatisticasResumo: { escanteiosCasa: 0, escanteiosFora: 0, posseCasa: 0, posseFora: 0, chutesGolCasa: 0, chutesGolFora: 0, chutesTotaisCasa: 0, chutesTotaisFora: 0, ataquesCasa: 0, ataquesFora: 0, pressaoCasa: 0, pressaoFora: 0, falhasCasa: 0, falhasFora: 0, impedimentosCasa: 0, impedimentosFora: 0, passesTotaisCasa: 0, passesTotaisFora: 0, passesPreCasa: 0, passesPreFora: 0 },
        oportunidadesResumo: [],
        formaCasa: [],
        formaFora: [],
        selos: [],
        carimboCasa: "📊 Equilibrado",
        carimboFora: "📊 Equilibrado",
        mapaCalor: 30,
      });
    }
  }
  return result;
}

export function agruparPorLiga(matches: MatchLike[]) {
  const map = new Map<string, { name: string; flag?: string | null; logo?: string | null; matches: MatchLike[] }>();
  for (const m of matches) {
    const key = m.league || "Outros";
    if (!map.has(key)) {
      map.set(key, { name: key, flag: m.countryFlag, logo: m.leagueLogo, matches: [] });
    }
    map.get(key)!.matches.push(m);
  }
  for (const group of Array.from(map.values())) {
    group.matches.sort((a: MatchLike, b: MatchLike) => {
      const aLive = isLive(a.status, a.minute) ? 1 : 0;
      const bLive = isLive(b.status, b.minute) ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      return (a.timestamp ?? 0) - (b.timestamp ?? 0);
    });
  }
  return Array.from(map.values());
}

export function encontrarJogoInsano(matches: MatchLike[]): number | null {
  if (!matches.length) return null;
  let bestId = matches[0].id;
  let bestScore = 0;
  for (const m of matches) {
    const c = getCall(m);
    if (c.intensity > bestScore) {
      bestScore = c.intensity;
      bestId = m.id;
    }
  }
  return bestScore >= 60 ? bestId : null;
}

export default function CompactMatchCard({
  match,
  ativo = false,
  onClick,
}: {
  match: MatchLike;
  ativo?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  return <MatchRow match={match} ativo={ativo} onClick={onClick} />;
}
