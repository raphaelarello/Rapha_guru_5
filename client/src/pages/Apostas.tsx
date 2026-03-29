import { useMemo, useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { trpc } from "@/lib/trpc";
import MatchFocusPanel from "@/components/live/MatchFocusPanel";
import { parseJogosAoVivo } from "@/components/live/CompactMatchCard";
import { getCall, resumirFixture, type MatchSummary } from "@/components/live/match-helpers";
import {
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  Filter,
  Flame,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

function numberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value.replace("%", "")) || 0;
  return 0;
}

function urgencyColor(level?: string) {
  if (level === "alta") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  if (level === "media") return "border-amber-400/25 bg-amber-500/10 text-amber-300";
  return "border-slate-500/25 bg-slate-500/8 text-slate-400";
}

function buildMercadosFromLive(jogo: any) {
  const f = jogo?.fixture;
  const fixtureId = f?.fixture?.id;
  const home = f?.teams?.home?.name || "Mandante";
  const away = f?.teams?.away?.name || "Visitante";
  const minute = f?.fixture?.status?.elapsed || 0;
  const oportunidades = Array.isArray(jogo?.oportunidades) ? jogo.oportunidades : [];
  const stats = Array.isArray(f?.statistics) ? f.statistics : [];
  const shots = numberValue(stats?.[0]?.statistics?.find((s: any) => s.type === "Shots on Goal")?.value)
    + numberValue(stats?.[1]?.statistics?.find((s: any) => s.type === "Shots on Goal")?.value);
  const corners = numberValue(stats?.[0]?.statistics?.find((s: any) => s.type === "Corner Kicks")?.value)
    + numberValue(stats?.[1]?.statistics?.find((s: any) => s.type === "Corner Kicks")?.value);

  const base = oportunidades.slice(0, 4).map((op: any, index: number) => ({
    id: `${fixtureId}-${index}`,
    fixtureId,
    titulo: op?.titulo || op?.mercado || "Oportunidade ao vivo",
    mercado: op?.mercado || "Ao vivo",
    explicacao: op?.explicacao || op?.motivo || `${home} x ${away} com sinal em construção.`,
    confianca: Math.max(48, Math.min(97, Math.round(op?.confianca || 55))),
    urgencia: op?.urgencia || (minute >= 70 ? "alta" : "media"),
    ev: typeof op?.ev === "number" ? op.ev : undefined,
    badge: minute >= 70 ? "Janela final" : corners >= 9 ? "Escanteios quentes" : shots >= 7 ? "Gol amadurecendo" : "Radar vivo",
    confronto: `${home} x ${away}`,
    minuto: minute,
    tipo: "live" as const,
  }));

  if (base.length > 0) return base;
  return [{
    id: `${fixtureId}-fallback`, fixtureId,
    titulo: "Radar em sincronização", mercado: "Ao vivo",
    explicacao: `${home} x ${away} ainda está formando leitura.`,
    confianca: 46, urgencia: "baixa", badge: "Sincronizando",
    confronto: `${home} x ${away}`, minuto: minute, tipo: "live" as const,
  }];
}

function buildMercadosFromToday(jogo: any, index: number) {
  const fixtureId = jogo?.fixture?.id;
  const home = jogo?.teams?.home?.name || "Mandante";
  const away = jogo?.teams?.away?.name || "Visitante";
  const prediction = jogo?.prediction || {};
  const destaque = prediction?.winner?.comment || prediction?.advice || "Pré-jogo em monitoramento";
  const percentHome = numberValue(prediction?.percent?.home);
  const percentAway = numberValue(prediction?.percent?.away);
  const spread = Math.abs(percentHome - percentAway);
  return {
    id: `${fixtureId || index}-pregame`, fixtureId,
    titulo: spread >= 18 ? "Favorito estatístico" : "Pré-jogo em observação",
    mercado: spread >= 18 ? "Resultado / DNB" : "Mercado pré-jogo",
    explicacao: destaque,
    confianca: Math.max(44, Math.min(93, Math.round(52 + spread * 1.3))),
    urgencia: spread >= 22 ? "alta" : spread >= 12 ? "media" : "baixa",
    badge: spread >= 22 ? "Vantagem forte" : "Pré-jogo",
    confronto: `${home} x ${away}`, minuto: 0, tipo: "pregame" as const,
  };
}

export default function Apostas() {
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "live" | "pregame">("todos");
  const dashboard = trpc.football.dashboardAoVivo.useQuery(undefined, { refetchInterval: 10000 });
  const jogosHoje = trpc.football.jogosHoje.useQuery(undefined, { refetchInterval: 60000 });
  const radar = trpc.football.radarJogo.useQuery(
    { fixtureId: selectedFixtureId || 0 },
    { enabled: !!selectedFixtureId, refetchInterval: 10000 },
  );

  const rawJogos = dashboard.data?.jogos || [];
  const allMatches = useMemo(() => parseJogosAoVivo(rawJogos), [rawJogos]);

  const liveSignals = useMemo(() => {
    const jogos = Array.isArray(dashboard.data?.jogos) ? dashboard.data.jogos : [];
    return jogos.flatMap((jogo: any) => buildMercadosFromLive(jogo))
      .sort((a: any, b: any) => (b.confianca || 0) - (a.confianca || 0));
  }, [dashboard.data]);

  const pregameSignals = useMemo(() => {
    const ligas = Array.isArray(jogosHoje.data?.ligas) ? jogosHoje.data.ligas : [];
    const todosJogos = ligas.flatMap((liga: any) => (liga.jogos || []).map((j: any) => ({
      fixture: { id: j.id },
      teams: { home: { name: j.homeTeam }, away: { name: j.awayTeam } },
      prediction: {},
    })));
    return todosJogos.slice(0, 14).map(buildMercadosFromToday)
      .sort((a: any, b: any) => (b.confianca || 0) - (a.confianca || 0));
  }, [jogosHoje.data]);

  const topSignals = useMemo(() => {
    let signals = [...liveSignals.slice(0, 8), ...pregameSignals.slice(0, 6)]
      .sort((a: any, b: any) => (b.confianca || 0) - (a.confianca || 0));
    if (filtroTipo === "live") signals = signals.filter((s) => s.tipo === "live");
    if (filtroTipo === "pregame") signals = signals.filter((s) => s.tipo === "pregame");
    return signals.slice(0, 12);
  }, [liveSignals, pregameSignals, filtroTipo]);

  // Construir MatchSummary para o painel lateral
  const selectedMatch = useMemo<MatchSummary | null>(() => {
    if (!selectedFixtureId) return null;
    const fromList = allMatches.find((m) => m.id === selectedFixtureId);
    if (fromList) return fromList;
    if (radar.data) {
      const rd = radar.data;
      const fakeFixture = {
        fixture: { id: selectedFixtureId, status: { short: rd.fixture?.status?.short || "LIVE", elapsed: rd.fixture?.status?.elapsed } },
        league: rd.league, teams: { home: rd.homeTeam, away: rd.awayTeam },
        goals: { home: rd.homeTeam?.score ?? 0, away: rd.awayTeam?.score ?? 0 },
        events: (rd.events || []).map((e: any) => ({ time: { elapsed: e.time }, type: e.type, detail: e.detail, player: { name: e.player }, team: { name: e.team } })),
        statistics: rd.stats ? [
          { team: rd.homeTeam, statistics: [
            { type: "Ball Possession", value: rd.stats.homePossession },
            { type: "Shots on Goal", value: rd.stats.homeShotsOnGoal },
            { type: "Corner Kicks", value: rd.stats.homeCorners },
            { type: "Dangerous Attacks", value: rd.stats.homeDangerousAttacks },
            { type: "Total Shots", value: rd.stats.homeTotalShots },
          ]},
          { team: rd.awayTeam, statistics: [
            { type: "Ball Possession", value: rd.stats.awayPossession },
            { type: "Shots on Goal", value: rd.stats.awayShotsOnGoal },
            { type: "Corner Kicks", value: rd.stats.awayCorners },
            { type: "Dangerous Attacks", value: rd.stats.awayDangerousAttacks },
            { type: "Total Shots", value: rd.stats.awayTotalShots },
          ]},
        ] : undefined,
      };
      return resumirFixture(fakeFixture, rd.oportunidades || []);
    }
    return null;
  }, [selectedFixtureId, allMatches, radar.data]);

  const metrics = useMemo(() => ({
    liveCount: liveSignals.filter((s: any) => s.tipo === "live" && s.confianca >= 60).length,
    pregameCount: pregameSignals.filter((s: any) => s.confianca >= 60).length,
    maxConf: topSignals[0]?.confianca || 0,
  }), [liveSignals, pregameSignals, topSignals]);

  const isLoading = dashboard.isLoading;

  return (
    <RaphaLayout title="Apostas" subtitle="Mesa tática de oportunidades com leitura rápida e gatilhos de entrada.">
      <div className="space-y-3">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0f1923] px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10"><Flame className="h-3.5 w-3.5 text-red-400" /></div>
            <div>
              <span className="text-lg font-black text-white">{metrics.liveCount}</span>
              <p className="text-[9px] text-slate-500">Ao vivo fortes</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0f1923] px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10"><CalendarDays className="h-3.5 w-3.5 text-cyan-400" /></div>
            <div>
              <span className="text-lg font-black text-white">{metrics.pregameCount}</span>
              <p className="text-[9px] text-slate-500">Pré-jogo vivos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0f1923] px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10"><Target className="h-3.5 w-3.5 text-emerald-400" /></div>
            <div>
              <span className="text-lg font-black text-white">{metrics.maxConf}%</span>
              <p className="text-[9px] text-slate-500">Pico confiança</p>
            </div>
          </div>
        </div>

        {/* Filtros + refresh */}
        <div className="flex items-center gap-2">
          <Filter className="h-3 w-3 text-slate-500" />
          {(["todos", "live", "pregame"] as const).map((t) => (
            <button key={t} onClick={() => setFiltroTipo(t)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${filtroTipo === t ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"}`}>
              {t === "todos" ? "Todos" : t === "live" ? "Ao Vivo" : "Pré-Jogo"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[9px] text-slate-600">
            <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? "animate-spin" : ""}`} /><span>10s</span>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {/* Ranking unificado */}
            <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5">
                <BadgeDollarSign className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ranking de Sinais</span>
                <span className="ml-auto text-[9px] text-slate-600">{topSignals.length} sinais</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {topSignals.map((item: any, i: number) => (
                  <button key={item.id} type="button" onClick={() => item.fixtureId && setSelectedFixtureId(item.fixtureId)}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition hover:bg-white/[0.03]">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${i < 3 ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-slate-500"}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[11px] font-bold text-white">{item.confronto}</span>
                        {item.minuto ? <span className="shrink-0 text-[9px] font-semibold text-amber-300">{item.minuto}'</span> : null}
                        <span className={`shrink-0 rounded-full border px-1.5 py-px text-[8px] font-semibold ${urgencyColor(item.urgencia)}`}>{item.badge}</span>
                        <span className="shrink-0 rounded-full bg-white/5 px-1 py-px text-[8px] text-slate-500">{item.tipo === "live" ? "AO VIVO" : "PRÉ"}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[9px] text-slate-500">{item.explicacao}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="text-sm font-black text-white">{item.confianca}%</span>
                      <span className="text-[8px] text-slate-600">{item.mercado}</span>
                    </div>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-600" />
                  </button>
                ))}
                {topSignals.length === 0 && (
                  <div className="px-3 py-4 text-center text-[10px] text-slate-600">Nenhum sinal disponível no momento</div>
                )}
              </div>
            </div>

            {/* Ao vivo + Pré-jogo */}
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5">
                  <Zap className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ao Vivo</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {liveSignals.slice(0, 5).map((item: any) => (
                    <button key={item.id} type="button" onClick={() => item.fixtureId && setSelectedFixtureId(item.fixtureId)}
                      className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition hover:bg-white/[0.03]">
                      <div className="min-w-0">
                        <span className="block truncate text-[10px] font-bold text-white">{item.confronto}</span>
                        <span className="text-[9px] text-slate-500">{item.titulo}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-[11px] font-bold text-emerald-300">{item.confianca}%</span>
                        <span className="text-[8px] text-slate-600">{item.badge}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5">
                  <CalendarDays className="h-3 w-3 text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pré-Jogo</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {pregameSignals.slice(0, 5).map((item: any) => (
                    <button key={item.id} type="button" className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition hover:bg-white/[0.03]">
                      <div className="min-w-0">
                        <span className="block truncate text-[10px] font-bold text-white">{item.confronto}</span>
                        <span className="text-[9px] text-slate-500">{item.titulo}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-[11px] font-bold text-white">{item.confianca}%</span>
                        <span className="text-[8px] text-slate-600">{item.badge}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Painel lateral */}
          <aside className="lg:sticky lg:top-[140px] lg:self-start">
            {selectedMatch ? (
              <MatchFocusPanel match={selectedMatch} />
            ) : (
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-3">
                <div className="mb-2 flex items-center gap-2 border-b border-white/[0.05] pb-2">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Painel Tático</span>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: Activity, color: "text-emerald-400", title: "Clique em um sinal", desc: "O cockpit lateral abre com radar, contexto e leitura resumida." },
                    { icon: TrendingUp, color: "text-cyan-400", title: "Hierarquia de valor", desc: "Confiar em explicação + urgência + coerência entre pressão e finalizações." },
                    { icon: ShieldAlert, color: "text-red-400", title: "Antifake", desc: "Quando o dado não existe, o sistema não inventa." },
                  ].map((r) => {
                    const Icon = r.icon;
                    return (
                      <div key={r.title} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3 w-3 ${r.color}`} />
                          <span className="text-[10px] font-bold text-white">{r.title}</span>
                        </div>
                        <p className="mt-0.5 text-[9px] text-slate-500">{r.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </RaphaLayout>
  );
}
