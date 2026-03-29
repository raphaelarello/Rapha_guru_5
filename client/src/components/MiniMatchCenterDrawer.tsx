import React, { useState } from "react";
import { X, Clock, MapPin, Users, Activity, BarChart3, Trophy } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

interface MiniMatchCenterDrawerProps {
  fixtureId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams?: {
    home?: { name: string; logo?: string };
    away?: { name: string; logo?: string };
  };
  fixture?: {
    status?: string;
    elapsed?: number;
    dateISO?: string;
    venue?: string;
  };
}

export function MiniMatchCenterDrawer({
  fixtureId,
  open,
  onOpenChange,
  teams,
  fixture,
}: MiniMatchCenterDrawerProps) {
  const [activeTab, setActiveTab] = useState("resumo");

  // Fetch fixture details
  const eventsQuery = trpc.football.fixtureEvents.useQuery(
    { fixtureId },
    { enabled: open }
  );
  const statsQuery = trpc.football.fixtureStatistics.useQuery(
    { fixtureId },
    { enabled: open }
  );
  const lineupsQuery = trpc.football.fixtureLineups.useQuery(
    { fixtureId },
    { enabled: open }
  );

  const events = eventsQuery.data?.events ?? [];
  const stats = statsQuery.data?.statistics ?? [];
  const lineups = lineupsQuery.data?.lineups ?? [];

  // Extract home/away stats
  const homeStats = stats[0] ?? {};
  const awayStats = stats[1] ?? {};

  // Group events by type
  const goals = events.filter((e) => e.type === "Goal");
  const cards = events.filter((e) => e.type === "Card");
  const substitutions = events.filter((e) => e.type === "Subst");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] max-w-2xl bg-slate-950 border-slate-800">
        <DrawerHeader className="border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {teams?.home?.logo && (
                <img
                  src={teams.home.logo}
                  alt={teams.home.name}
                  className="h-8 w-8 rounded"
                />
              )}
              <div className="text-sm font-semibold text-white">
                {teams?.home?.name ?? "Casa"}
              </div>
              <span className="text-xs text-slate-400">vs</span>
              <div className="text-sm font-semibold text-white">
                {teams?.away?.name ?? "Visitante"}
              </div>
              {teams?.away?.logo && (
                <img
                  src={teams.away.logo}
                  alt={teams.away.name}
                  className="h-8 w-8 rounded"
                />
              )}
            </div>
            <DrawerClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start border-b border-slate-800 bg-transparent px-4 py-0">
              <TabsTrigger
                value="resumo"
                className="border-b-2 border-transparent px-3 py-2 text-xs font-medium text-slate-400 data-[state=active]:border-emerald-500 data-[state=active]:text-white"
              >
                Resumo
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="border-b-2 border-transparent px-3 py-2 text-xs font-medium text-slate-400 data-[state=active]:border-emerald-500 data-[state=active]:text-white"
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="border-b-2 border-transparent px-3 py-2 text-xs font-medium text-slate-400 data-[state=active]:border-emerald-500 data-[state=active]:text-white"
              >
                Estatísticas
              </TabsTrigger>
              <TabsTrigger
                value="lineups"
                className="border-b-2 border-transparent px-3 py-2 text-xs font-medium text-slate-400 data-[state=active]:border-emerald-500 data-[state=active]:text-white"
              >
                Escalações
              </TabsTrigger>
            </TabsList>

            {/* Resumo */}
            <TabsContent value="resumo" className="space-y-4 p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>
                    {fixture?.elapsed ? `${fixture.elapsed}'` : "—"} •{" "}
                    {fixture?.status ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span>{fixture?.venue ?? "—"}</span>
                </div>
              </div>

              {/* Gols */}
              {goals.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">⚽ Gols</h3>
                  {goals.map((goal, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded bg-slate-900 p-2 text-xs"
                    >
                      <span className="text-slate-300">
                        {goal.player?.name ?? "—"}
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {goal.time?.elapsed}'
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cartões */}
              {cards.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">
                    🟨 Cartões
                  </h3>
                  {cards.map((card, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded bg-slate-900 p-2 text-xs"
                    >
                      <span className="text-slate-300">
                        {card.player?.name ?? "—"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-400">
                          {card.time?.elapsed}'
                        </span>
                        <div
                          className={`h-4 w-3 rounded ${
                            card.card === "Yellow"
                              ? "bg-yellow-400"
                              : "bg-red-600"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="space-y-2 p-4">
              {eventsQuery.isLoading ? (
                <div className="text-xs text-slate-400">Carregando...</div>
              ) : events.length === 0 ? (
                <div className="text-xs text-slate-400">
                  Sem eventos registrados
                </div>
              ) : (
                events.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded bg-slate-900 p-2 text-xs"
                  >
                    <span className="min-w-fit font-semibold text-emerald-400">
                      {event.time?.elapsed}'
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {event.type === "Goal"
                          ? "⚽ Gol"
                          : event.type === "Card"
                            ? event.card === "Yellow"
                              ? "🟨 Cartão Amarelo"
                              : "🔴 Cartão Vermelho"
                            : event.type === "Subst"
                              ? "🔄 Substituição"
                              : event.type}
                      </div>
                      <div className="text-slate-400">
                        {event.player?.name ?? "—"}
                        {event.assist?.name && ` (assist: ${event.assist.name})`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Estatísticas */}
            <TabsContent value="stats" className="space-y-4 p-4">
              {statsQuery.isLoading ? (
                <div className="text-xs text-slate-400">Carregando...</div>
              ) : (
                <div className="space-y-3">
                  {/* Posse */}
                  <StatRow
                    label="Posse"
                    home={homeStats.possession}
                    away={awayStats.possession}
                  />
                  {/* Chutes */}
                  <StatRow
                    label="Chutes"
                    home={homeStats.shots_total}
                    away={awayStats.shots_total}
                  />
                  {/* Chutes no Alvo */}
                  <StatRow
                    label="Chutes no Alvo"
                    home={homeStats.shots_on_goal}
                    away={awayStats.shots_on_goal}
                  />
                  {/* Passes */}
                  <StatRow
                    label="Passes"
                    home={homeStats.passes_total}
                    away={awayStats.passes_total}
                  />
                  {/* Escanteios */}
                  <StatRow
                    label="Escanteios"
                    home={homeStats.corner_kicks}
                    away={awayStats.corner_kicks}
                  />
                  {/* Faltas */}
                  <StatRow
                    label="Faltas"
                    home={homeStats.fouls_committed}
                    away={awayStats.fouls_committed}
                  />
                </div>
              )}
            </TabsContent>

            {/* Escalações */}
            <TabsContent value="lineups" className="space-y-4 p-4">
              {lineupsQuery.isLoading ? (
                <div className="text-xs text-slate-400">Carregando...</div>
              ) : lineups.length === 0 ? (
                <div className="text-xs text-slate-400">
                  Escalações não disponíveis
                </div>
              ) : (
                lineups.map((team, idx) => (
                  <div key={idx} className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">
                      {team.team?.name ?? "Time"}
                    </h3>
                    <div className="space-y-1">
                      {team.startXI?.map((player, pidx) => (
                        <div
                          key={pidx}
                          className="flex items-center gap-2 rounded bg-slate-900 p-2 text-xs"
                        >
                          <span className="min-w-fit font-semibold text-slate-400">
                            {player.player?.number}
                          </span>
                          <span className="flex-1 text-white">
                            {player.player?.name ?? "—"}
                          </span>
                          <span className="text-slate-500">
                            {player.player?.pos ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Helper component para exibir stats
function StatRow({
  label,
  home,
  away,
}: {
  label: string;
  home?: number | string;
  away?: number | string;
}) {
  const homeVal = Number(home) || 0;
  const awayVal = Number(away) || 0;
  const total = homeVal + awayVal || 1;
  const homePercent = Math.round((homeVal / total) * 100);
  const awayPercent = 100 - homePercent;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium text-slate-300">
        <span>{homeVal}</span>
        <span className="text-slate-500">{label}</span>
        <span>{awayVal}</span>
      </div>
      <div className="flex h-2 gap-1 overflow-hidden rounded bg-slate-900">
        <div
          className="bg-emerald-500"
          style={{ width: `${homePercent}%` }}
        />
        <div className="bg-blue-500" style={{ width: `${awayPercent}%` }} />
      </div>
    </div>
  );
}
