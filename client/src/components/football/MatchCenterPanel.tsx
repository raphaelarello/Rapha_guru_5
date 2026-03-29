import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { MatchResumeTab } from "./tabs/MatchResumeTab";
import { MatchTimelineTab } from "./tabs/MatchTimelineTab";
import { MatchStatsTab } from "./tabs/MatchStatsTab";
import { MatchLineupsTab } from "./tabs/MatchLineupsTab";
import { MatchPlayersTab } from "./tabs/MatchPlayersTab";

interface MatchCenterPanelProps {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  isCompactMode?: boolean;
}

export function MatchCenterPanel({
  fixtureId,
  homeTeam,
  awayTeam,
  league,
  isCompactMode = false,
}: MatchCenterPanelProps) {
  const [activeTab, setActiveTab] = useState("resumo");

  // Query para detalhes do jogo
  const fixtureQuery = trpc.football.getFixtureDetails.useQuery(
    { fixtureId },
    { staleTime: 10000 }
  );

  const fixture = fixtureQuery.data;
  const isLoading = fixtureQuery.isLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Erro ao carregar detalhes do jogo</p>
      </div>
    );
  }

  const status = fixture.fixture?.status?.short || "NS";
  const isLive = status === "LIVE";
  const goals = fixture.goals;
  const elapsed = fixture.fixture?.status?.elapsed || 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4 flex-shrink-0">
        {/* Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-muted-foreground mb-1">{league}</div>
            <div className="flex items-center gap-3">
              <img
                src={fixture.teams?.home?.logo}
                alt={homeTeam}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23ccc'/%3E%3C/svg%3E";
                }}
              />
              <span className="text-sm font-semibold text-foreground">{homeTeam}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">
              {goals?.home} - {goals?.away}
            </div>
            {isLive && (
              <div className="text-xs font-semibold text-red-400 animate-pulse">
                {elapsed}'
              </div>
            )}
          </div>

          <div className="flex-1 text-right">
            <div className="flex items-center gap-3 justify-end">
              <span className="text-sm font-semibold text-foreground">{awayTeam}</span>
              <img
                src={fixture.teams?.away?.logo}
                alt={awayTeam}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23ccc'/%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>
        </div>

        {/* Estádio/Árbitro */}
        {fixture.fixture?.venue && (
          <div className="text-xs text-muted-foreground">
            {fixture.fixture.venue.name} • {fixture.fixture.venue.city}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-card/30 p-0 h-auto">
            <TabsTrigger
              value="resumo"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Resumo
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Estatísticas
            </TabsTrigger>
            <TabsTrigger
              value="lineups"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Escalações
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Jogadores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="flex-1 overflow-y-auto">
            <MatchResumeTab fixture={fixture} />
          </TabsContent>

          <TabsContent value="timeline" className="flex-1 overflow-y-auto">
            <MatchTimelineTab fixture={fixture} />
          </TabsContent>

          <TabsContent value="stats" className="flex-1 overflow-y-auto">
            <MatchStatsTab fixture={fixture} />
          </TabsContent>

          <TabsContent value="lineups" className="flex-1 overflow-y-auto">
            <MatchLineupsTab fixture={fixture} />
          </TabsContent>

          <TabsContent value="players" className="flex-1 overflow-y-auto">
            <MatchPlayersTab fixture={fixture} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
