/**
 * Pitacos Engine - Terminal Trader
 * 6 Abas: Hoje, Ao Vivo, Ligas, Jogadores, Acurácia, Telão
 * Marco 1: Núcleo que funciona
 */

import { useState } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Flame,
  TrendingUp,
  Users,
  BarChart3,
  Monitor,
  RefreshCw,
  Download,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type TabType = "hoje" | "ao-vivo" | "ligas" | "jogadores" | "acuracia" | "telao";

export default function PitacosEngine() {
  const [activeTab, setActiveTab] = useState<TabType>("hoje");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedStatus, setSelectedStatus] = useState<"upcoming" | "live" | "finished">("upcoming");
  const [selectedMetric, setSelectedMetric] = useState<"goals" | "corners" | "cards">("goals");
  const [selectedPlayerType, setSelectedPlayerType] = useState<"hot" | "disciplined" | "injured">("hot");
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const todayGamesQuery = trpc.pitacos.getTodayGames.useQuery({
    date: selectedDate,
    status: selectedStatus,
  });

  const liveGamesQuery = trpc.pitacos.getLiveGames.useQuery({ limit: 20 });
  const leagueRankingsQuery = trpc.pitacos.getLeagueRankings.useQuery({
    metric: selectedMetric,
    limit: 20,
  });
  const hotPlayersQuery = trpc.pitacos.getHotPlayers.useQuery({
    tipo: selectedPlayerType,
    limit: 15,
  });
  const accuracyQuery = trpc.pitacos.getAccuracyMetrics.useQuery({
    groupBy: "topic",
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === "hoje") {
        await todayGamesQuery.refetch();
      } else if (activeTab === "ao-vivo") {
        await liveGamesQuery.refetch();
      } else if (activeTab === "ligas") {
        await leagueRankingsQuery.refetch();
      } else if (activeTab === "jogadores") {
        await hotPlayersQuery.refetch();
      } else if (activeTab === "acuracia") {
        await accuracyQuery.refetch();
      }
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RaphaLayout title="Pitacos Engine - Terminal Trader">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🎯 Pitacos Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Terminal Trader - Análise em Tempo Real</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
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

        {/* Aba: Hoje */}
        <TabsContent value="hoje" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximos</SelectItem>
                  <SelectItem value="live">Ao Vivo</SelectItem>
                  <SelectItem value="finished">Encerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Jogos do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayGamesQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : todayGamesQuery.data ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {todayGamesQuery.data.message || "Dados carregados"}
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                    <pre>{JSON.stringify(todayGamesQuery.data, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>

          {/* Relatório 08:00 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Relatório 08:00
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Relatório diário com análise de acurácia, ligas e mercados
              </p>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Ao Vivo */}
        <TabsContent value="ao-vivo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Jogos Ao Vivo - Termômetro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveGamesQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : liveGamesQuery.data ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Atualização a cada 30s com análise de pressão e probabilidades
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                    <pre>{JSON.stringify(liveGamesQuery.data, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sem jogos ao vivo no momento</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔥 Muito Quente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Heat Score &gt; 75</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🌡️ Quente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Heat Score 50-75</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">❄️ Frio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Heat Score &lt; 50</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Ligas */}
        <TabsContent value="ligas" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goals">Gols</SelectItem>
                <SelectItem value="corners">Escanteios</SelectItem>
                <SelectItem value="cards">Cartões</SelectItem>
                <SelectItem value="homeWin">Vitória em Casa</SelectItem>
                <SelectItem value="awayWin">Vitória Fora</SelectItem>
                <SelectItem value="predictability">Previsibilidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Rankings por Liga
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leagueRankingsQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : leagueRankingsQuery.data ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {leagueRankingsQuery.data.message || "Dados carregados"}
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono max-h-96 overflow-y-auto">
                    <pre>{JSON.stringify(leagueRankingsQuery.data, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Jogadores */}
        <TabsContent value="jogadores" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={selectedPlayerType} onValueChange={(v: any) => setSelectedPlayerType(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">🔥 Quentes</SelectItem>
                <SelectItem value="disciplined">🟨 Indisciplinados</SelectItem>
                <SelectItem value="injured">🤕 Lesionados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Jogadores em Destaque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hotPlayersQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : hotPlayersQuery.data ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {hotPlayersQuery.data.message || "Dados carregados"}
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono max-h-96 overflow-y-auto">
                    <pre>{JSON.stringify(hotPlayersQuery.data, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Acurácia */}
        <TabsContent value="acuracia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Análise de Acurácia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accuracyQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : accuracyQuery.data ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Acertos/erros por tópico, liga, mês e minuto
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-sm font-mono max-h-96 overflow-y-auto">
                    <pre>{JSON.stringify(accuracyQuery.data, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>

          {/* Métricas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total de Picks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Acerto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Confiança Média</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Brier Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0.00</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Telão */}
        <TabsContent value="telao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Modo TV - Auto-Rotate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-8 rounded-lg text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Telão com widgets auto-rotate em desenvolvimento
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Exibe: Jogos ao vivo, Acurácia, Ligas, Jogadores, Bilhetes
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </RaphaLayout>
  );
}
