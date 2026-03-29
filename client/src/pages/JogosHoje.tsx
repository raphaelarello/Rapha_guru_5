import { useState, useMemo, useEffect, useRef } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { trpc } from "@/lib/trpc";
import { MatchRow, type MatchLike } from "@/components/live/CompactMatchCard";
import { EnhancedMatchCard } from "@/components/live/EnhancedMatchCard";
import { ResponsiveMatchPanel } from "@/components/sofa/ResponsiveMatchPanel";
import { resumirFixture, type MatchSummary, traduzirPais } from "@/components/live/match-helpers";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Filter, Flag, Radio, RefreshCw, Search, TimerReset, X } from "lucide-react";


function isoAddDays(baseIso: string, delta: number) {
  const d = new Date(`${baseIso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function labelData(iso: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (iso === hoje) return "Hoje";
  const amanha = isoAddDays(hoje, 1);
  if (iso === amanha) return "Amanhã";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function jogoToMatchSummary(jogo: any, liga: any): MatchSummary & { hora?: string; local?: string; cidade?: string } {
  const homeGoals = jogo.homeScore ?? 0;
  const awayGoals = jogo.awayScore ?? 0;
  const isLive = ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(jogo.status || "");
  const isFinished = ["FT", "AET", "PEN"].includes(jogo.status || "");
  
  // Extrair horário da data ISO
  const hora = jogo.date ? new Date(jogo.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "";
  
  return {
    id: jogo.id,
    fixtureId: jogo.id,
    homeTeam: { name: traduzirPais(jogo.homeTeam || "TBD"), logo: jogo.homeLogo || "" },
    awayTeam: { name: traduzirPais(jogo.awayTeam || "TBD"), logo: jogo.awayLogo || "" },
    homeScore: homeGoals,
    awayScore: awayGoals,
    minute: jogo.elapsed || 0,
    status: jogo.status || "NS",
    league: liga?.name || "",
    leagueLogo: liga?.logo || "",
    countryFlag: liga?.flag || "",
    countryName: liga?.country || "",
    eventosResumo: {
      golsCasa: [],
      golsFora: [],
      amarelosCasa: 0,
      amarelosFora: 0,
      vermelhosCasa: 0,
      vermelhosFora: 0,
      eventosCompletos: [],
    },
    estatisticasResumo: {
      escanteiosCasa: 0, escanteiosFora: 0,
      posseCasa: 0, posseFora: 0,
      chutesGolCasa: 0, chutesGolFora: 0,
      chutesTotaisCasa: 0, chutesTotaisFora: 0,
      ataquesCasa: 0, ataquesFora: 0,
      pressaoCasa: 0, pressaoFora: 0,
      falhasCasa: 0, falhasFora: 0,
      impedimentosCasa: 0, impedimentosFora: 0,
      passesTotaisCasa: 0, passesTotaisFora: 0,
      passesPreCasa: 0, passesPreFora: 0,
    },
    oportunidadesResumo: [],
    formaCasa: jogo.homeForm || [],
    formaFora: jogo.awayForm || [],
    selos: [isLive ? "Ao Vivo" : isFinished ? "Encerrado" : "Próximo"],
    carimboCasa: "",
    carimboFora: "",
    mapaCalor: 0,
    hora,
    local: jogo.venue || "",
    cidade: jogo.city || "",
  } as any;
}

/* ─── Dropdown de ligas compacto ─── */
function DropdownLigaJogos({ ligas, selecionada, onSelect }: { ligas: any[]; selecionada: string; onSelect: (v: string) => void }) {
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
    ? ligas.filter((l: any) => (l.name || "").toLowerCase().includes(busca.toLowerCase()))
    : ligas;

  const ligaSelecionadaNome = selecionada === "todas" ? "" : ligas.find((l: any) => String(l.id) === selecionada)?.name || "";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
          ligaSelecionadaNome
            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
            : "text-slate-400 border-white/10 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        <Filter className="h-3 w-3" />
        {ligaSelecionadaNome || "Todas as ligas"}
        <ChevronDown className={`h-3 w-3 transition-transform ${aberto ? "rotate-180" : ""}`} />
        {ligaSelecionadaNome && (
          <span
            onClick={(e) => { e.stopPropagation(); onSelect("todas"); setAberto(false); }}
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
              onClick={() => { onSelect("todas"); setAberto(false); setBusca(""); }}
              className={`w-full px-3 py-2 text-left text-xs font-semibold transition hover:bg-white/[0.04] ${
                selecionada === "todas" ? "text-emerald-300 bg-emerald-500/5" : "text-slate-400"
              }`}
            >
              Todas as ligas ({ligas.length})
            </button>
            {ligasFiltradas.map((liga: any) => (
              <button
                key={liga.id}
                onClick={() => { onSelect(String(liga.id)); setAberto(false); setBusca(""); }}
                className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs transition hover:bg-white/[0.04] ${
                  String(liga.id) === selecionada ? "text-emerald-300 bg-emerald-500/5 font-semibold" : "text-slate-300"
                }`}
              >
                {liga.logo && <img src={liga.logo} alt="" className="h-3 w-3 rounded-full" />}
                {liga.name}
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

type StatusFilter = "todos" | "ao-vivo" | "encerrados" | "proximos";

// Converter MatchSummary para MatchLike
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

// LeagueGroup com EnhancedMatchCard + Animações
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
    <div className="rounded-lg border border-white/[0.08] bg-[#0f1923] overflow-hidden transition-all duration-300">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors duration-200 border-b border-white/[0.06]"
      >
        <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${collapsed ? "" : "rotate-90"}`} />
        {countryFlag && <img src={countryFlag} alt="" className="h-3 w-4 rounded-sm object-cover" />}
        <span className="text-[11px] font-bold text-white flex-1 text-left">{leagueName}</span>
        <span className="text-[9px] text-slate-500 bg-white/[0.06] px-2 py-0.5 rounded">{matches.length}</span>
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${collapsed ? "max-h-0" : "max-h-[2000px]"}`}>
        <div className="space-y-2 p-2">
          {matches.map((match: any, idx: number) => (
            <div
              key={match.id}
              className="animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                animationDelay: collapsed ? "0ms" : `${idx * 50}ms`,
              }}
            >
              <EnhancedMatchCard
                match={matchSummaryToMatchLike(match)}
                hora={match.hora}
                local={match.local}
                cidade={match.cidade}
                onClick={() => onSelect(match.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JogosHoje() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ligaAtiva, setLigaAtiva] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [formaFilter, setFormaFilter] = useState<string>("todos");
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const jogosHoje = trpc.football.jogosHoje.useQuery({ date }, { refetchInterval: 30000 });

  const ligas = jogosHoje.data?.ligas || [];

  const todosJogos = useMemo(
    () => ligas.flatMap((liga: any) => (liga.jogos || []).map((jogo: any) => ({ jogo, liga, match: jogoToMatchSummary(jogo, liga) }))),
    [ligas]
  );


  // Contar vitórias nos últimos 5 jogos
  const countVitorias = (forma: any[]) => {
    if (!forma || forma.length === 0) return 0;
    return forma.slice(0, 5).filter((r: string) => r === "V").length;
  };

    // Filtrar por status
  const jogosFiltrados = useMemo(() => {
    let filtered = todosJogos;
    if (ligaAtiva !== "todas") filtered = filtered.filter((item) => String(item.liga.id) === ligaAtiva);
    if (statusFilter === "ao-vivo") filtered = filtered.filter((item) => ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(item.jogo.status || ""));
    if (statusFilter === "encerrados") filtered = filtered.filter((item) => ["FT", "AET", "PEN"].includes(item.jogo.status || ""));
    if (statusFilter === "proximos") filtered = filtered.filter((item) => ["NS", "TBD", "PST", "CANC", "SUSP", "INT", "ABD", "AWD", "WO"].includes(item.jogo.status || ""));
    // Filtrar por forma dos times
    if (formaFilter === "3v+") filtered = filtered.filter((item) => countVitorias(item.match.formaCasa) >= 3 || countVitorias(item.match.formaFora) >= 3);
    if (formaFilter === "2v+") filtered = filtered.filter((item) => countVitorias(item.match.formaCasa) >= 2 || countVitorias(item.match.formaFora) >= 2);
    if (formaFilter === "hot") filtered = filtered.filter((item) => countVitorias(item.match.formaCasa) >= 4 || countVitorias(item.match.formaFora) >= 4);
    // Ordenar: ao vivo primeiro, depois por horário
    return filtered.sort((a, b) => {
      const aLive = ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(a.jogo.status || "");
      const bLive = ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(b.jogo.status || "");
      const aFinished = ["FT", "AET", "PEN"].includes(a.jogo.status || "");
      const bFinished = ["FT", "AET", "PEN"].includes(b.jogo.status || "");
      if (aLive && !bLive) return -1;
      if (!aLive && bLive) return 1;
      if (aLive && bLive) return (b.jogo.elapsed || 0) - (a.jogo.elapsed || 0);
      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;
      if (aFinished && bFinished) return new Date(b.jogo.date || 0).getTime() - new Date(a.jogo.date || 0).getTime();
      return new Date(a.jogo.date || 0).getTime() - new Date(b.jogo.date || 0).getTime();
    });
  }, [todosJogos, ligaAtiva, statusFilter, formaFilter]);

  // Agrupar por liga
  const ligasFiltradas = useMemo(() => {
    const map = new Map<string, { liga: any; jogos: typeof jogosFiltrados }>();
    for (const item of jogosFiltrados) {
      const key = String(item.liga.id);
      if (!map.has(key)) map.set(key, { liga: item.liga, jogos: [] });
      map.get(key)!.jogos.push(item);
    }
    return Array.from(map.values());
  }, [jogosFiltrados]);

  useEffect(() => {
    if (!selectedFixtureId && jogosFiltrados[0]?.jogo?.id) setSelectedFixtureId(jogosFiltrados[0].jogo.id);
  }, [jogosFiltrados, selectedFixtureId]);

  const selectedMatch = useMemo<MatchSummary | null>(() => {
    if (!selectedFixtureId) return null;
    return jogosFiltrados.find((item) => item.jogo.id === selectedFixtureId)?.match || null;
  }, [jogosFiltrados, selectedFixtureId]);

  const countByStatus = useMemo(() => {
    const live = todosJogos.filter((item) => ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(item.jogo.status || "")).length;
    const finished = todosJogos.filter((item) => ["FT", "AET", "PEN"].includes(item.jogo.status || "")).length;
    const upcoming = todosJogos.length - live - finished;
    return { live, finished, upcoming };
  }, [todosJogos]);

  const isLoading = jogosHoje.isLoading;

  return (
    <RaphaLayout title="Jogos do Dia" subtitle="Agenda completa com filtros por data, liga e status.">
      <div className="space-y-3">
        {/* Navegação de data */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0f1923] px-3 py-2">
          <button type="button" onClick={() => setDate((d) => isoAddDays(d, -1))} className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white">{labelData(date)}</span>
          <button type="button" onClick={() => setDate((d) => isoAddDays(d, 1))} className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setDate(new Date().toISOString().slice(0, 10))} className="flex items-center gap-1 rounded border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
            <TimerReset className="h-3 w-3" /> Hoje
          </button>
          <button type="button" onClick={() => setDate(isoAddDays(new Date().toISOString().slice(0, 10), 1))} className="flex items-center gap-1 rounded border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-200">
            <Radio className="h-3 w-3" /> Amanhã
          </button>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-400">
            <span className="font-bold text-white">{jogosHoje.data?.total ?? 0}</span> jogos
            <span className="font-bold text-white">{ligas.length}</span> ligas
            <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? "animate-spin" : ""}`} />
          </div>
        </div>

        {/* Filtros de status */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: "todos" as StatusFilter, label: "Todos", count: todosJogos.length },
            { key: "ao-vivo" as StatusFilter, label: "Ao Vivo", count: countByStatus.live },
            { key: "encerrados" as StatusFilter, label: "Encerrados", count: countByStatus.finished },
            { key: "proximos" as StatusFilter, label: "Próximos", count: countByStatus.upcoming },
          ]).map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${statusFilter === f.key ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"}`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Filtros de forma */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: "todos", label: "Todas as formas" },
            { key: "2v+", label: "2+ Vitórias" },
            { key: "3v+", label: "3+ Vitórias" },
            { key: "hot", label: "Em Fogo 🔥" },
          ]).map((f) => (
            <button key={f.key} onClick={() => setFormaFilter(f.key)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${formaFilter === f.key ? "bg-orange-500/20 text-orange-300 border border-orange-400/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtro de ligas - Dropdown */}
        <DropdownLigaJogos ligas={ligas} selecionada={ligaAtiva} onSelect={setLigaAtiva} />

        {/* Grid: jogos + painel lateral */}
        <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
          <div className="space-y-2">
            {ligasFiltradas.length ? ligasFiltradas.map(({ liga, jogos }) => (
              <LeagueGroupEnhanced
                key={liga.id}
                leagueName={liga.name}
                countryFlag={liga.flag}
                matches={jogos.map((item: any) => item.match)}
                selectedId={selectedFixtureId}
                onSelect={setSelectedFixtureId}
              />
            )) : (
              <div className="rounded-lg border border-dashed border-white/10 bg-[#0f1923] p-5 text-center text-[10px] text-slate-500">
                Nenhum jogo encontrado para este filtro.
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-[140px] lg:self-start space-y-2">
            {selectedMatch ? (
              <ResponsiveMatchPanel match={selectedMatch} onClose={() => setSelectedFixtureId(null)} />
            ) : (
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-4 text-center">
                <CalendarDays className="mx-auto h-6 w-6 text-slate-600" />
                <p className="mt-2 text-[10px] text-slate-500">Selecione um jogo para ver detalhes</p>
              </div>
            )}
            <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 border-b border-white/[0.05] pb-1.5">
                <Flag className="h-3 w-3 text-amber-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Resumo do Dia</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                  <span className="text-sm font-black text-white">{ligas.length}</span>
                  <p className="text-[8px] text-slate-500">Ligas</p>
                </div>
                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                  <span className="text-sm font-black text-white">{jogosFiltrados.length}</span>
                  <p className="text-[8px] text-slate-500">Filtrados</p>
                </div>
                <div className="rounded border border-white/[0.04] bg-white/[0.02] p-1.5 text-center">
                  <span className="text-sm font-black text-white">{jogosHoje.data?.total ?? 0}</span>
                  <p className="text-[8px] text-slate-500">Total</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </RaphaLayout>
  );
}
