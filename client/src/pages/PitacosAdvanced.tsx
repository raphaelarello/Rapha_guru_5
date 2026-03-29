import { useState, useMemo } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Flame,
  TrendingUp,
  Users,
  BarChart3,
  Monitor,
  RefreshCw,
  AlertCircle,
  Zap,
  Trophy,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type TabType = "hoje" | "ao-vivo" | "ligas" | "jogadores" | "acuracia" | "telao";

export default function PitacosAdvanced() {
  const [activeTab, setActiveTab] = useState<TabType>("ao-vivo");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const todayGamesQuery = trpc.pitacos.getTodayGames.useQuery({
    date: new Date().toISOString().split("T")[0],
    status: "upcoming",
  });

  const liveGamesQuery = trpc.pitacos.getLiveGames.useQuery(
    { limit: 20 },
    { refetchInterval: autoRefresh ? 30000 : false }
  );

  const leagueRankingsQuery = trpc.pitacos.getLeagueRankings.useQuery({
    metric: "goals",
    limit: 20,
  });

  const hotPlayersQuery = trpc.pitacos.getHotPlayers.useQuery({
    tipo: "hot",
    limit: 15,
  });

  const accuracyQuery = trpc.pitacos.getAccuracyMetrics.useQuery({
    groupBy: "topic",
  });

  const workerStatusQuery = trpc.pitacos.getWorkerStatus.useQuery();

  const snapshotsByLeague = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    if (liveGamesQuery.data?.snapshots) {
      for (const snapshot of liveGamesQuery.data.snapshots) {
        const league = snapshot.leagueName || "Unknown";
        if (!grouped[league]) grouped[league] = [];
        grouped[league].push(snapshot);
      }
    }
    return grouped;
  }, [liveGamesQuery.data?.snapshots]);

  const liveStats = useMemo(() => {
    const snapshots = liveGamesQuery.data?.snapshots || [];
    return {
      total: snapshots.length,
      veryHot: snapshots.filter((s) => s.heatScore > 75).length,
      hot: snapshots.filter((s) => s.heatScore > 50 && s.heatScore <= 75).length,
      cold: snapshots.filter((s) => s.heatScore <= 50).length,
      avgHeat:
        snapshots.length > 0
          ? Math.round(snapshots.reduce((acc, s) => acc + s.heatScore, 0) / snapshots.length)
          : 0,
    };
  }, [liveGamesQuery.data?.snapshots]);

  const FixtureCard = ({ snapshot }: { snapshot: any }) => {
    const getHeatColor = (score: number) => {
      if (score > 75) return "bg-red-600";
      if (score > 50) return "bg-orange-500";
      return "bg-blue-500";
    };

    const getHeatLabel = (score: number) => {
      if (score > 75) return "🔥 MUITO QUENTE";
      if (score > 50) return "🌡️ QUENTE";
      return "❄️ FRIO";
    };

    return (
      <Card className="transition-all duration-300">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{snapshot.leagueName}</p>
                <p className="text-xs text-muted-foreground">{snapshot.minute}'</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {snapshot.status}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex-1 text-right">
                <p className="font-semibold text-sm">{snapshot.homeName}</p>
                <p className="text-lg font-bold">{snapshot.scoreHome}</p>
              </div>
              <div className="px-3 text-center">
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{snapshot.awayName}</p>
                <p className="text-lg font-bold">{snapshot.scoreAway}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">{getHeatLabel(snapshot.heatScore)}</span>
                <span className="text-xs font-bold">{snapshot.heatScore}%</span>
              </div>
              <Progress value={Math.min(100, snapshot.heatScore)} className="h-2" />
              <div className={`h-1 rounded-full ${getHeatColor(snapshot.heatScore)}`} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Pressão</p>
                <p className="font-semibold">{snapshot.pressureScore}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Risco</p>
                <p className="font-semibold text-red-500">
                  {snapshot.riskFlags?.length > 0 ? snapshot.riskFlags[0] : "OK"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <RaphaLayout title="Pitacos Engine - Terminal Trader Avançado">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🎯 Pitacos Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Terminal Trader - Análise em Tempo Real</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          {workerStatusQuery.data && (
            <Badge variant="outline" className="text-xs">
              Workers: {workerStatusQuery.data.status}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="hoje" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Hoje</span>
          </TabsTrigger>
          <TabsTrigger value="ao-vivo" className="gap-2">
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Ao Vivo</span>
          </TabsTrigger>
          <TabsTrigger value="ligas" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Ligas</span>
          </TabsTrigger>
          <TabsTrigger value="jogadores" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Jogadores</span>
          </TabsTrigger>
          <TabsTrigger value="acuracia" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Acurácia</span>
          </TabsTrigger>
          <TabsTrigger value="telao" className="gap-2">
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Telão</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ao-vivo" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Ao Vivo</p>
                <p className="text-2xl font-bold">{liveStats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">🔥 Muito Quente</p>
                <p className="text-2xl font-bold text-red-600">{liveStats.veryHot}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">🌡️ Quente</p>
                <p className="text-2xl font-bold text-orange-500">{liveStats.hot}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Heat Médio</p>
                <p className="text-2xl font-bold">{liveStats.avgHeat}%</p>
              </CardContent>
            </Card>
          </div>

          {liveGamesQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(snapshotsByLeague).length > 0 ? (
            Object.entries(snapshotsByLeague).map(([league, snapshots]) => (
              <div key={league} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  {league} ({snapshots.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {snapshots.map((snapshot) => (
                    <FixtureCard key={snapshot.fixtureId} snapshot={snapshot} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Sem jogos ao vivo no momento</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="acuracia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Análise de Acurácia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accuracyQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : accuracyQuery.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total de Picks</p>
                      <p className="text-2xl font-bold">{accuracyQuery.data.totalPicks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
                      <p className="text-2xl font-bold text-green-600">
                        {accuracyQuery.data.hitRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confiança Média</p>
                      <p className="text-2xl font-bold">
                        {accuracyQuery.data.avgConfidence.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Brier Score</p>
                      <p className="text-2xl font-bold">{accuracyQuery.data.avgBrier.toFixed(3)}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Modo TV - Auto-Rotate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-lg text-center text-white">
                <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Telão em Desenvolvimento</p>
                <p className="text-sm text-slate-300">
                  Exibe: Jogos ao vivo, Acurácia, Ligas, Jogadores, Bilhetes com auto-rotate a cada
                  30s
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </RaphaLayout>
  );
}
