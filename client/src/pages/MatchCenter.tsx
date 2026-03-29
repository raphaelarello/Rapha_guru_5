import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import RaphaLayout from "@/components/RaphaLayout";
import { LeagueGroup, parseJogosAoVivo, agruparPorLiga, encontrarJogoInsano } from "@/components/live/CompactMatchCard";
import { ResponsiveMatchPanel } from "@/components/sofa/ResponsiveMatchPanel";
import { trpc } from "@/lib/trpc";
import { getCall, resumirFixture, type MatchSummary } from "@/components/live/match-helpers";
import { Activity, Flame, Radar, RefreshCw, Sparkles, Target } from "lucide-react";

export default function MatchCenter() {
  const [location] = useLocation();
  const fixtureIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const raw = params.get("fixtureId");
    return raw ? Number(raw) : null;
  }, [location]);

  const dashboard = trpc.football.dashboardAoVivo.useQuery(undefined, { refetchInterval: 10000 });
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(fixtureIdFromUrl || null);

  useEffect(() => { if (fixtureIdFromUrl) setSelectedFixtureId(fixtureIdFromUrl); }, [fixtureIdFromUrl]);

  const rawJogos = dashboard.data?.jogos || [];
  const allMatches = useMemo(() => parseJogosAoVivo(rawJogos), [rawJogos]);
  const leagueGroups = useMemo(() => agruparPorLiga(allMatches), [allMatches]);
  const hotFixtureId = useMemo(() => encontrarJogoInsano(allMatches), [allMatches]);

  useEffect(() => {
    if (!selectedFixtureId && allMatches[0]?.id) setSelectedFixtureId(allMatches[0].id);
  }, [allMatches, selectedFixtureId]);

  const radar = trpc.football.radarJogo.useQuery(
    { fixtureId: selectedFixtureId || 0 },
    { enabled: !!selectedFixtureId, refetchInterval: 10000 },
  );

  const selectedMatch = useMemo<MatchSummary | null>(() => {
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
  }, [allMatches, selectedFixtureId, radar.data]);

  const isLoading = dashboard.isLoading;

  return (
    <RaphaLayout title="Centro de Partidas" subtitle="Cockpit do confronto com leitura viva, radar e clique rápido. Atualização a cada 10s.">
      <div className="space-y-3">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/[0.08] bg-[#0f1923] px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Jogos Vivos</p>
            <span className="text-lg font-black text-white">{allMatches.length}</span>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-[#0f1923] px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Jogo do Momento</p>
            <span className="truncate text-[11px] font-bold text-white">{allMatches.find(m => m.id === hotFixtureId)?.homeTeam?.name || "—"}</span>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-[#0f1923] px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Oportunidades</p>
            <span className="text-lg font-black text-white">{dashboard.data?.totalOportunidades ?? 0}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-slate-600">
          <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? "animate-spin" : ""}`} /><span>10s</span>
        </div>

        {/* Grid: jogos + painel */}
        <div className="grid gap-3 xl:grid-cols-[1fr_380px]">
          <div className="space-y-2">
            {leagueGroups.length > 0 ? (
              leagueGroups.map((group) => (
                <LeagueGroup
                  key={group.name}
                  leagueName={group.name}
                  countryFlag={group.flag}
                  leagueLogo={group.logo}
                  matches={group.matches}
                  selectedId={selectedFixtureId}
                  onSelect={setSelectedFixtureId}
                  hotFixtureId={hotFixtureId}
                />
              ))
            ) : (
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-5 text-center">
                <Radar className="mx-auto h-7 w-7 text-slate-600" />
                <p className="mt-2 text-xs text-slate-500">Nenhum jogo ao vivo</p>
              </div>
            )}

            <div className="grid gap-2 md:grid-cols-3">
              {[
                { icon: Activity, color: "text-emerald-400", title: "Pressão", desc: "Volume real sem contexto falso" },
                { icon: Target, color: "text-amber-400", title: "Timing", desc: "Momento e urgência do jogo" },
                { icon: Sparkles, color: "text-cyan-400", title: "Radar", desc: "Sincronização antes de inventar" },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-2">
                    <div className="flex items-center gap-1.5"><Icon className={`h-3 w-3 ${r.color}`} /><span className="text-[10px] font-bold text-white">{r.title}</span></div>
                    <p className="mt-0.5 text-[9px] text-slate-500">{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:sticky xl:top-[140px] xl:self-start">
            {selectedMatch ? (
              <ResponsiveMatchPanel match={selectedMatch} onClose={() => setSelectedFixtureId(null)} />
            ) : (
              <div className="rounded-lg border border-white/[0.06] bg-[#0f1923] p-6 text-center">
                <Radar className="mx-auto h-8 w-8 text-cyan-400" />
                <h3 className="mt-2 text-sm font-bold text-white">Nenhum jogo selecionado</h3>
                <p className="mt-1 text-[10px] text-slate-500">O jogo mais quente entra automaticamente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RaphaLayout>
  );
}
