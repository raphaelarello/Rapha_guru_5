import { useState, useMemo, useEffect } from "react";
import RaphaLayout from "@/components/RaphaLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Server,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type TabType = "api" | "accuracy" | "financeiro" | "workers" | "eventos";

export default function PitacosObservability() {
  const [activeTab, setActiveTab] = useState<TabType>("api");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");

  // Queries
  const metricsQuery = trpc.pitacos.getMetricsSnapshot.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const accuracyQuery = trpc.pitacos.getAccuracyMetrics.useQuery(
    { groupBy: "topic" },
    { refetchInterval: autoRefresh ? 30000 : false }
  );

  const roiQuery = trpc.pitacos.getAccumulatedROI.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const workerStatusQuery = trpc.pitacos.getWorkerStatus.useQuery(undefined, {
    refetchInterval: autoRefresh ? 15000 : false,
  });

  // Dados simulados para gráficos (em produção, viriam da API)
  const apiMetricsData = useMemo(
    () => [
      { time: "00:00", success: 98, latency: 120, cache_hit: 85 },
      { time: "04:00", success: 96, latency: 145, cache_hit: 82 },
      { time: "08:00", success: 99, latency: 110, cache_hit: 88 },
      { time: "12:00", success: 97, latency: 135, cache_hit: 80 },
      { time: "16:00", success: 98, latency: 125, cache_hit: 86 },
      { time: "20:00", success: 99, latency: 115, cache_hit: 89 },
      { time: "23:59", success: 97, latency: 140, cache_hit: 81 },
    ],
    []
  );

  const brierScoreData = useMemo(
    () => [
      { market: "GOAL_NEXT10", brier: 0.18, hits: 45, total: 52 },
      { market: "OU_2_5", brier: 0.22, hits: 38, total: 55 },
      { market: "BTTS", brier: 0.25, hits: 32, total: 48 },
      { market: "FT_1X2", brier: 0.28, hits: 28, total: 50 },
      { market: "BLOWOUT", brier: 0.35, hits: 12, total: 40 },
      { market: "CORNERS", brier: 0.20, hits: 42, total: 50 },
    ],
    []
  );

  const roiTimeSeriesData = useMemo(
    () => [
      { date: "01/01", roi: 2.5, profit: 150 },
      { date: "05/01", roi: 5.2, profit: 380 },
      { date: "10/01", roi: 8.1, profit: 620 },
      { date: "15/01", roi: 6.8, profit: 510 },
      { date: "20/01", roi: 10.5, profit: 850 },
      { date: "25/01", roi: 12.3, profit: 1020 },
      { date: "31/01", roi: 14.7, profit: 1250 },
    ],
    []
  );

  const marketDistributionData = useMemo(
    () => [
      { name: "GOAL_NEXT10", value: 25, color: "#ef4444" },
      { name: "OU_2_5", value: 22, color: "#f97316" },
      { name: "BTTS", value: 18, color: "#eab308" },
      { name: "FT_1X2", value: 20, color: "#22c55e" },
      { name: "CORNERS", value: 10, color: "#0ea5e9" },
      { name: "CARDS", value: 5, color: "#8b5cf6" },
    ],
    []
  );

  const workerJobsData = useMemo(
    () => [
      { type: "realtime_update", pending: 3, completed: 1250, failed: 2 },
      { type: "evaluate_results", pending: 1, completed: 420, failed: 1 },
      { type: "generate_report", pending: 0, completed: 30, failed: 0 },
      { type: "notify_users", pending: 5, completed: 890, failed: 3 },
    ],
    []
  );

  const eventsFeed = useMemo(
    () => [
      {
        id: 1,
        timestamp: new Date(Date.now() - 2 * 60000),
        type: "pattern",
        message: "🎯 Padrão detectado: GOAL_NEXT10 com 78% de confiança",
        severity: "info",
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 5 * 60000),
        type: "ticket_won",
        message: "🎉 Bilhete ganho! ROI: +15.2% | Lucro: R$ 380",
        severity: "success",
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 8 * 60000),
        type: "api_alert",
        message: "⚠️ Taxa de sucesso da API caiu para 94%",
        severity: "warning",
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 12 * 60000),
        type: "worker_alert",
        message: "🔴 Worker queue length: 12 jobs pendentes",
        severity: "warning",
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 15 * 60000),
        type: "pick_evaluated",
        message: "✅ 45 picks avaliados | Hit rate: 86.5%",
        severity: "success",
      },
    ],
    []
  );

  const apiStats = useMemo(
    () => ({
      successRate: 97.8,
      avgLatency: 128,
      cacheHitRate: 84.5,
      totalCalls: 15420,
      errors: 342,
      quotaUsed: 65,
    }),
    []
  );

  const systemStats = useMemo(
    () => ({
      workerStatus: "healthy",
      queueLength: 12,
      avgProcessTime: 2.3,
      uptime: "23d 14h",
      cpuUsage: 34,
      memoryUsage: 52,
    }),
    []
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <RaphaLayout title="Pitacos Observability - Dashboard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">📊 Observabilidade</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centro de Comando - Monitoramento em Tempo Real
          </p>
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
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="1h">Última 1h</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7d</option>
          </select>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{apiStats.successRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <Progress value={apiStats.successRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Latência Média</p>
                <p className="text-2xl font-bold">{apiStats.avgLatency}ms</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ótimo (&lt;150ms)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{apiStats.cacheHitRate}%</p>
              </div>
              <Database className="w-8 h-8 text-purple-600" />
            </div>
            <Progress value={apiStats.cacheHitRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hit Rate (Picks)</p>
                <p className="text-2xl font-bold">
                  {accuracyQuery.data?.hitRate?.toFixed(1) || "0"}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Acurácia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">ROI Acumulado</p>
                <p className="text-2xl font-bold">
                  {roiQuery.data?.roi?.toFixed(1) || "0"}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Lucro: R$ {roiQuery.data?.totalProfit?.toFixed(0) || "0"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Status do Sistema</p>
                <Badge
                  variant={systemStats.workerStatus === "healthy" ? "default" : "destructive"}
                  className="mt-1"
                >
                  {systemStats.workerStatus}
                </Badge>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="api" className="gap-2">
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">API</span>
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Acurácia</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="workers" className="gap-2">
            <Cpu className="w-4 h-4" />
            <span className="hidden sm:inline">Workers</span>
          </TabsTrigger>
          <TabsTrigger value="eventos" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Eventos</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA: API */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Performance da API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={apiMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#22c55e"
                    name="Taxa de Sucesso (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#f97316"
                    name="Latência (ms)"
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Chamadas Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{apiStats.totalCalls.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">Últimas 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Erros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{apiStats.errors}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {((apiStats.errors / apiStats.totalCalls) * 100).toFixed(2)}% de taxa de erro
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cota Usada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{apiStats.quotaUsed}%</p>
                <Progress value={apiStats.quotaUsed} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA: ACURÁCIA */}
        <TabsContent value="accuracy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Brier Score por Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brierScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="market" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="brier" fill="#ef4444" name="Brier Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detalhes por Mercado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {brierScoreData.map((market) => (
                    <div key={market.market} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{market.market}</p>
                        <p className="text-xs text-muted-foreground">
                          {market.hits}/{market.total} hits
                        </p>
                      </div>
                      <Badge
                        variant={market.brier < 0.25 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {market.brier.toFixed(3)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuição de Mercados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={marketDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {marketDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA: FINANCEIRO */}
        <TabsContent value="financeiro" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ROI Acumulado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={roiTimeSeriesData}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="roi"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorRoi)"
                    name="ROI (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Lucro Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  R$ {roiQuery.data?.totalProfit?.toFixed(2) || "0"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Período selecionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Vitória</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{roiQuery.data?.winRate?.toFixed(1) || "0"}%</p>
                <p className="text-xs text-muted-foreground mt-2">Bilhetes ganhos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Odd Média</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{roiQuery.data?.avgOdd?.toFixed(2) || "0"}</p>
                <p className="text-xs text-muted-foreground mt-2">Multiplicador médio</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA: WORKERS */}
        <TabsContent value="workers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={systemStats.workerStatus === "healthy" ? "default" : "destructive"}
                    className="mt-1"
                  >
                    {systemStats.workerStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fila de Jobs</p>
                  <p className="text-2xl font-bold">{systemStats.queueLength}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">{systemStats.avgProcessTime}s</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="text-lg font-bold">{systemStats.uptime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CPU</p>
                  <Progress value={systemStats.cpuUsage} className="mt-1" />
                  <p className="text-xs mt-1">{systemStats.cpuUsage}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Memória</p>
                  <Progress value={systemStats.memoryUsage} className="mt-1" />
                  <p className="text-xs mt-1">{systemStats.memoryUsage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Jobs por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workerJobsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pending" stackId="a" fill="#f97316" name="Pendentes" />
                  <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completados" />
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Falhados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: EVENTOS */}
        <TabsContent value="eventos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Feed de Eventos em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {eventsFeed.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border-l-4 ${getSeverityColor(event.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(event.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </RaphaLayout>
  );
}

// Importar Button se não estiver disponível
function Button({
  variant = "default",
  size = "md",
  onClick,
  children,
  className = "",
}: {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const baseClass =
    "px-4 py-2 rounded-md font-medium transition-colors flex items-center";
  const variantClass =
    variant === "outline"
      ? "border border-input bg-background hover:bg-accent"
      : "bg-primary text-primary-foreground hover:bg-primary/90";
  const sizeClass = size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2";

  return (
    <button className={`${baseClass} ${variantClass} ${sizeClass} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}
