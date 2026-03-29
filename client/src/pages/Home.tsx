import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import RaphaLayout from "@/components/RaphaLayout";
import {
  LeagueGroup,
  parseJogosAoVivo,
  parseJogosHoje,
  agruparPorLiga,
  encontrarJogoInsano,
  type MatchLike,
} from "@/components/live/CompactMatchCard";
import { EnhancedMatchCard } from "@/components/live/EnhancedMatchCard";
import { ResponsiveMatchPanel } from "@/components/sofa/ResponsiveMatchPanel";
import { type MatchSummary, resumirFixture, getCall, isLive, isEncerrado, isAgendado } from "@/components/live/match-helpers";
import {
  Radio,
  Zap,
  RefreshCw,
  AlertTriangle,
  Flame,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  Target,
  Flag,
  ArrowUpRight,
  ChevronDown,
  Search,
  X,
} from "lucide-react";


/* ─── Dropdown de Ligas ─── */
function DropdownLiga({ ligas, selecionada, onSelect }: { ligas: string[]; selecionada: string; onSelect: (v: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ligasFiltradas = busca
    ? ligas.filter((l) => l.toLowerCase().includes(busca.toLowerCase()))
    : ligas;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
          selecionada
            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
            : "text-slate-400 border-white/10 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        <Filter className="h-3 w-3" />
        {selecionada || "Todas as ligas"}
        <ChevronDown className={`h-3 w-3 transition-transform ${aberto ? "rotate-180" : ""}`} />
        {selecionada && (
          <span
            onClick={(e) => { e.stopPropagation(); onSelect(""); setAberto(false); }}
            className="ml-0.5 rounded-full bg-white/10 p-0.5 hover:bg-white/20"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0f1923] shadow-2xl shadow-black/40">
          <div className="border-b border-white/[0.06] p-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar liga..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <button
              onClick={() => { onSelect(""); setAberto(false); setBusca(""); }}
              className={`w-full px-3 py-2 text-left text-xs font-semibold transition hover:bg-white/[0.04] ${
                !selecionada ? "text-emerald-300 bg-emerald-500/5" : "text-slate-400"
              }`}
            >
              Todas as ligas ({ligas.length})
            </button>
            {ligasFiltradas.map((l) => (
              <button
                key={l}
                onClick={() => { onSelect(l); setAberto(false); setBusca(""); }}
                className={`w-full px-3 py-1.5 text-left text-xs transition hover:bg-white/[0.04] ${
                  l === selecionada ? "text-emerald-300 bg-emerald-500/5 font-semibold" : "text-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
            {ligasFiltradas.length === 0 && (
              <p className="px-3 py-3 text-center text-xs text-slate-500">Nenhuma liga encontrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Filtro de datas ─── */
function FiltroDatas({ selecionado, onSelect }: { selecionado: string; onSelect: (v: string) => void }) {
  const hoje = new Date();
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
  const depois = new Date(hoje); depois.setDate(depois.getDate() + 2);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const opcoes = [
    { key: fmt(hoje), label: "Hoje" },
    { key: fmt(amanha), label: "Amanhã" },
    { key: fmt(depois), label: depois.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") },
  ];
  return (
    <div className="flex items-center gap-1">
      {opcoes.map((o) => (
        <button key={o.key} onClick={() => onSelect(o.key)}
          className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${selecionado === o.key ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25" : "text-slate-400 hover:bg-white/[0.04] border border-transparent"}`}>{o.label}</button>
      ))}
    </div>
  );
}

/* ─── Filtro de status ─── */
type StatusFiltro = "todos" | "ao-vivo" | "quentes" | "proximos" | "encerrados";
function FiltroStatus({ selecionado, onSelect, counts }: { selecionado: StatusFiltro; onSelect: (v: StatusFiltro) => void; counts: Record<StatusFiltro, number> }) {
  const opcoes: { key: StatusFiltro; label: string; icon: React.ReactNode; cor: string }[] = [
    { key: "todos", label: "Todos", icon: null, cor: "text-white" },
    { key: "ao-vivo", label: "Ao Vivo", icon: <Radio className="h-2.5 w-2.5" />, cor: "text-red-400" },
    { key: "quentes", label: "Quentes", icon: <Flame className="h-2.5 w-2.5" />, cor: "text-amber-400" },
    { key: "proximos", label: "Próximos", icon: <Clock className="h-2.5 w-2.5" />, cor: "text-blue-400" },
    { key: "encerrados", label: "Encerrados", icon: <CheckCircle className="h-2.5 w-2.5" />, cor: "text-slate-400" },
  ];
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {opcoes.map((o) => (
        <button key={o.key} onClick={() => onSelect(o.key)}
          className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${selecionado === o.key ? `bg-white/[0.08] ${o.cor} border border-white/[0.12]` : "text-slate-500 hover:bg-white/[0.04] border border-transparent"}`}>
          {o.icon}{o.label}
          {counts[o.key] > 0 && <span className={`rounded-full px-1 py-px text-[8px] ${selecionado === o.key ? "bg-white/10" : "bg-slate-700/50"}`}>{counts[o.key]}</span>}
        </button>
      ))}
    </div>
  );
}

/* ─── Hero: Melhor Oportunidade ─── */
function HeroOportunidade({ match, onClick }: { match: MatchLike; onClick: () => void }) {
  const call = getCall(match);
  const ev = match.eventosResumo;
  return (
    <button onClick={onClick} className="w-full text-left rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/8 via-[#0f1923] to-emerald-500/8 p-3 transition hover:border-amber-500/30">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-slate-950">
          <Sparkles className="h-2 w-2" /> Melhor Oportunidade
        </span>
        <span className="text-[9px] text-slate-500">{match.league}</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />{match.minute}'
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {match.homeTeam?.logo && <img src={match.homeTeam.logo} alt="" className="h-6 w-6 object-contain shrink-0" />}
          <span className="truncate text-xs font-bold text-white">{match.homeTeam?.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xl font-black text-white">{match.homeScore ?? 0}</span>
          <span className="text-slate-600">-</span>
          <span className="text-xl font-black text-white">{match.awayScore ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-row-reverse">
          {match.awayTeam?.logo && <img src={match.awayTeam.logo} alt="" className="h-6 w-6 object-contain shrink-0" />}
          <span className="truncate text-xs font-bold text-white text-right">{match.awayTeam?.name}</span>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-bold text-emerald-300">{call.confidence}% {call.call}</div>
          {call.ev > 0 && <div className="text-[8px] text-amber-300">EV {call.ev}</div>}
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
      </div>
    </button>
  );
}

/* ─── matchSummaryToMatchLike ─── */
function matchSummaryToMatchLike(match: MatchSummary): MatchLike {
  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
    minute: match.minute,
    time: "",
    league: match.league,
    countryFlag: match.countryFlag,
    formaCasa: [],
    formaFora: [],
    carimboCasa: "",
    carimboFora: "",
    mapaCalor: { casa: 0, fora: 0 },
  };
}

/* ─── LeagueGroupEnhanced ─── */
function LeagueGroupEnhanced({
  leagueName,
  countryFlag,
  matches,
  selectedId,
  onSelect,
}: {
  leagueName: string;
  countryFlag?: string;
  matches: MatchSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0f1923] overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition border-b border-white/[0.06]"
      >
        <ChevronRight className={`h-4 w-4 text-slate-500 transition ${collapsed ? "" : "rotate-90"}`} />
        {countryFlag && <img src={countryFlag} alt="" className="h-3 w-4 rounded-sm object-cover" />}
        <span className="text-[11px] font-bold text-white flex-1 text-left">{leagueName}</span>
        <span className="text-[9px] text-slate-500 bg-white/[0.06] px-2 py-0.5 rounded">{matches.length}</span>
      </button>
      {!collapsed && (
        <div className="space-y-2 p-2">
          {matches.map((match) => (
            <EnhancedMatchCard
              key={match.id}
              match={matchSummaryToMatchLike(match)}
              onClick={() => onSelect(match.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Página Painel (Home) — Dashboard principal
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const hoje = new Date().toISOString().split("T")[0];
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [filtroLiga, setFiltroLiga] = useState("");
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const dashboard = trpc.football.dashboardAoVivo.useQuery(undefined, { refetchInterval: 10000 });
  const alertas = trpc.football.centralAlertas.useQuery(undefined, { refetchInterval: 10000 });
  const jogosHoje = trpc.football.jogosHoje.useQuery({ date: dataSelecionada }, { refetchInterval: dataSelecionada === hoje ? 30000 : 60000 });
  const selectedQuery = trpc.football.radarJogo.useQuery({ fixtureId: selectedFixtureId || 0 }, { enabled: !!selectedFixtureId, refetchInterval: 10000 });

  const liveMatches = useMemo(() => parseJogosAoVivo(dashboard.data?.jogos || []), [dashboard.data?.jogos]);
  const dayMatches = useMemo(() => parseJogosHoje(jogosHoje.data?.ligas || []), [jogosHoje.data?.ligas]);

  const allMatches = useMemo(() => {
    const liveIds = new Set(liveMatches.map((m) => m.id));
    const combined = [...liveMatches];
    for (const dm of dayMatches) { if (!liveIds.has(dm.id)) combined.push(dm); }
    return combined;
  }, [liveMatches, dayMatches]);

  const counts = useMemo(() => {
    let aoVivo = 0, quentes = 0, proximos = 0, encerrados = 0;
    for (const m of allMatches) {
      if (isLive(m.status, m.minute)) { aoVivo++; const c = getCall(m); if (c.intensity >= 60) quentes++; }
      else if (isEncerrado(m.status)) encerrados++;
      else if (isAgendado(m.status)) proximos++;
    }
    return { todos: allMatches.length, "ao-vivo": aoVivo, quentes, proximos, encerrados } as Record<StatusFiltro, number>;
  }, [allMatches]);

  const ligasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    allMatches.forEach((m) => { if (m.league) set.add(m.league); });
    return Array.from(set).sort();
  }, [allMatches]);

  const filteredMatches = useMemo(() => {
    let result = allMatches;
    if (statusFiltro === "ao-vivo") result = result.filter((m) => isLive(m.status, m.minute));
    else if (statusFiltro === "quentes") result = result.filter((m) => isLive(m.status, m.minute) && getCall(m).intensity >= 60);
    else if (statusFiltro === "proximos") result = result.filter((m) => isAgendado(m.status));
    else if (statusFiltro === "encerrados") result = result.filter((m) => isEncerrado(m.status));
    if (filtroLiga) result = result.filter((m) => m.league === filtroLiga);
    return result;
  }, [allMatches, statusFiltro, filtroLiga]);

  const leagueGroups = useMemo(() => agruparPorLiga(filteredMatches), [filteredMatches]);
  const hotFixtureId = useMemo(() => encontrarJogoInsano(liveMatches), [liveMatches]);
  const hotMatch = useMemo(() => liveMatches.find((m) => m.id === hotFixtureId), [liveMatches, hotFixtureId]);

  useEffect(() => {
    if (!selectedFixtureId && liveMatches[0]?.id) setSelectedFixtureId(liveMatches[0].id);
    else if (!selectedFixtureId && allMatches[0]?.id) setSelectedFixtureId(allMatches[0].id);
  }, [liveMatches, allMatches, selectedFixtureId]);

  const selectedMatch = useMemo<MatchSummary | null>(() => {
    const fromList = allMatches.find((m) => m.id === selectedFixtureId);
    if (fromList) return fromList;
    if (selectedQuery.data) {
      const rd = selectedQuery.data;
      const fakeFixture = {
        fixture: { id: selectedFixtureId, status: { short: rd.fixture?.status?.short || "LIVE", elapsed: rd.fixture?.status?.elapsed } },
        league: rd.league, teams: { home: rd.homeTeam, away: rd.awayTeam },
        goals: { home: rd.homeTeam?.score ?? 0, away: rd.awayTeam?.score ?? 0 },
        events: (rd.events || []).map((e: any) => ({ time: { elapsed: e.time }, type: e.type, detail: e.detail, player: { name: e.player }, team: { name: e.team } })),
      };
      return resumirFixture(fakeFixture, (rd as any).oportunidades || []);
    }
    return null;
  }, [allMatches, selectedFixtureId, selectedQuery.data]);

  const handleAlertaClick = useCallback((fixtureId: number) => {
    setSelectedFixtureId(fixtureId);
    setStatusFiltro("ao-vivo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const isLoading = dashboard.isLoading;

  return (
    <RaphaLayout title="Painel" subtitle="Visão geral do dia. Atualização a cada 10s.">
      <div className="space-y-2">
        {/* Métricas rápidas */}
        <div className="grid grid-cols-4 gap-1.5">
          <a href="/ao-vivo" className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-2 text-center transition hover:bg-white/[0.04]">
            <div className="flex items-center justify-center gap-1">
              <Radio className="h-3 w-3 text-red-400" />
              <span className="text-base font-black text-white">{counts["ao-vivo"]}</span>
            </div>
            <span className="text-[8px] text-slate-500">Ao Vivo</span>
          </a>
          <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="text-base font-black text-white">{alertas.data?.length ?? 0}</span>
            </div>
            <span className="text-[8px] text-slate-500">Alertas</span>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span className="text-base font-black text-white">{dashboard.data?.totalOportunidades ?? 0}</span>
            </div>
            <span className="text-[8px] text-slate-500">Sinais</span>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3 text-blue-400" />
              <span className="text-base font-black text-white">{allMatches.length}</span>
            </div>
            <span className="text-[8px] text-slate-500">Jogos</span>
          </div>
        </div>

        {/* Hero */}
        {hotMatch && <HeroOportunidade match={hotMatch} onClick={() => setSelectedFixtureId(hotMatch.id)} />}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <FiltroDatas selecionado={dataSelecionada} onSelect={setDataSelecionada} />
          <div className="flex items-center gap-1 text-[9px] text-slate-600 ml-auto">
            <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? "animate-spin" : ""}`} /><span>10s</span>
          </div>
        </div>
        <FiltroStatus selecionado={statusFiltro} onSelect={setStatusFiltro} counts={counts} />
        {ligasDisponiveis.length > 1 && (
          <DropdownLiga ligas={ligasDisponiveis} selecionada={filtroLiga} onSelect={setFiltroLiga} />
        )}

        {/* Layout principal */}
        <div className="grid gap-2 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
          <div className="space-y-2">
            {/* Alertas */}
            {(alertas.data || []).length > 0 && (
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-white/[0.05] bg-white/[0.02] px-2 py-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Alertas</span>
                  <span className="ml-auto rounded-full bg-amber-500/15 px-1.5 py-px text-[8px] font-bold text-amber-300">{alertas.data?.length}</span>
                </div>
                <div className="space-y-0.5 p-1.5">
                  {(alertas.data || []).slice(0, 4).map((a: any, i: number) => (
                    <button key={i} onClick={() => a.fixtureId && handleAlertaClick(a.fixtureId)}
                      className="w-full text-left rounded border border-white/[0.04] bg-white/[0.02] px-2 py-1 transition hover:bg-white/[0.04]">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-white truncate">{a.titulo}</span>
                        <ChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-600" />
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">{a.resumo}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Jogos por liga */}
            {leagueGroups.length > 0 ? (
              leagueGroups.map((group) => (
                <LeagueGroupEnhanced key={group.name} leagueName={group.name} countryFlag={group.flag}
                  matches={group.matches} selectedId={selectedFixtureId} onSelect={setSelectedFixtureId} />
              ))
            ) : (
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-sm text-slate-400">Nenhum jogo encontrado</p>
              </div>
            )}
          </div>

          {/* Painel lateral */}
          <div className="lg:sticky lg:top-[100px] lg:self-start">
            <ResponsiveMatchPanel match={selectedMatch} onClose={() => setSelectedFixtureId(null)} />
          </div>
        </div>
      </div>
    </RaphaLayout>
  );
}
