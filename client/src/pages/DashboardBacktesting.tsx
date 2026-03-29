import { trpc } from '@/lib/trpc';
import RaphaLayout from '@/components/RaphaLayout';
import { TrendingUp, TrendingDown, BarChart3, Activity, AlertCircle, CheckCircle2, Filter, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BacktestMetrics {
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  roi: number;
  period: string;
}

export default function DashboardBacktesting() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [minWinRate, setMinWinRate] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const PERIODS = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
    { value: '180', label: 'Últimos 6 meses' },
    { value: 'all', label: 'Todos os tempos' },
  ];

  const MARKETS = [
    { id: '1x2', nome: '1x2' },
    { id: 'over', nome: 'Over/Under' },
    { id: 'btts', nome: 'BTTS' },
    { id: 'corners', nome: 'Escanteios' },
    { id: 'cards', nome: 'Cartões' },
  ];

  const LEAGUES = [
    { id: 'pl', nome: 'Premier League' },
    { id: 'laliga', nome: 'La Liga' },
    { id: 'bundesliga', nome: 'Bundesliga' },
    { id: 'seriea', nome: 'Serie A' },
    { id: 'ligue1', nome: 'Ligue 1' },
    { id: 'brasileirao', nome: 'Série A Brasil' },
  ];

  const mockBacktestData = useMemo(() => ({
    metrics: {
      sharpeRatio: 1.85,
      maxDrawdown: -12.5,
      profitFactor: 2.3,
      winRate: 58.5,
      totalTrades: 200,
      winningTrades: 117,
      losingTrades: 83,
      avgWin: 125.50,
      avgLoss: -54.30,
      roi: 23.4,
      period: 'Últimos 30 dias',
    },
    equityCurve: [
      { data: '01/03', valor: 10000 },
      { data: '05/03', valor: 10450 },
      { data: '10/03', valor: 10890 },
      { data: '15/03', valor: 10650 },
      { data: '20/03', valor: 11250 },
      { data: '25/03', valor: 12340 },
    ],
    drawdownCurve: [
      { data: '01/03', drawdown: 0 },
      { data: '05/03', drawdown: -2.1 },
      { data: '10/03', drawdown: -1.5 },
      { data: '15/03', drawdown: -5.3 },
      { data: '20/03', drawdown: -2.8 },
      { data: '25/03', drawdown: 0 },
    ],
    winRateByMarket: [
      { mercado: '1x2', winRate: 62, trades: 45 },
      { mercado: 'Over/Under', winRate: 58, trades: 65 },
      { mercado: 'BTTS', winRate: 55, trades: 40 },
      { mercado: 'Corners', winRate: 60, trades: 50 },
    ],
    monthlyPerformance: [
      { mes: 'Janeiro', roi: 8.5, trades: 45 },
      { mes: 'Fevereiro', roi: 12.3, trades: 52 },
      { mes: 'Março', roi: 23.4, trades: 103 },
    ],
  }), []);

  const getMetricColor = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value >= 0 ? 'text-green-400' : 'text-red-400';
    }
    return value >= 0 ? 'text-red-400' : 'text-green-400';
  };

  const toggleMarket = (market: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    );
  };

  const toggleLeague = (league: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]
    );
  };

  const clearFilters = () => {
    setSelectedPeriod('30');
    setSelectedMarkets([]);
    setSelectedLeagues([]);
    setMinWinRate(0);
  };

  const hasActiveFilters = selectedMarkets.length > 0 || selectedLeagues.length > 0 || minWinRate > 0 || selectedPeriod !== '30';

  return (
    <RaphaLayout>
      <div className="space-y-6">
        {/* Header com Filtros */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard de Backtesting</h1>
            <p className="text-white/60 mt-1">{mockBacktestData.metrics.period}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                hasActiveFilters
                  ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400'
                  : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros</span>
              {hasActiveFilters && (
                <Badge className="bg-orange-500 text-white ml-2">Ativo</Badge>
              )}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-blue-400">Análise em Tempo Real</span>
            </div>
          </div>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="space-y-6">
              {/* Período */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Período</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {PERIODS.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setSelectedPeriod(period.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedPeriod === period.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mercados */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Mercados</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {MARKETS.map((market) => (
                    <button
                      key={market.id}
                      onClick={() => toggleMarket(market.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedMarkets.includes(market.id)
                          ? 'bg-green-500/30 border border-green-500 text-green-400'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {market.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ligas */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">Ligas</label>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {LEAGUES.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => toggleLeague(league.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedLeagues.includes(league.id)
                          ? 'bg-purple-500/30 border border-purple-500 text-purple-400'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {league.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taxa de Vitória Mínima */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Taxa de Vitória Mínima: {minWinRate}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minWinRate}
                  onChange={(e) => setMinWinRate(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button
                  onClick={clearFilters}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
                <Button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sharpe Ratio */}
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Sharpe Ratio</span>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className={`text-2xl font-bold ${getMetricColor(mockBacktestData.metrics.sharpeRatio)}`}>
              {mockBacktestData.metrics.sharpeRatio.toFixed(2)}
            </p>
            <p className="text-xs text-white/40 mt-1">Retorno ajustado ao risco</p>
          </div>

          {/* Max Drawdown */}
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Max Drawdown</span>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <p className={`text-2xl font-bold ${getMetricColor(mockBacktestData.metrics.maxDrawdown, false)}`}>
              {mockBacktestData.metrics.maxDrawdown.toFixed(1)}%
            </p>
            <p className="text-xs text-white/40 mt-1">Queda máxima</p>
          </div>

          {/* Profit Factor */}
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Profit Factor</span>
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <p className={`text-2xl font-bold ${getMetricColor(mockBacktestData.metrics.profitFactor - 1)}`}>
              {mockBacktestData.metrics.profitFactor.toFixed(2)}x
            </p>
            <p className="text-xs text-white/40 mt-1">Ganhos / Perdas</p>
          </div>

          {/* ROI */}
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">ROI</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className={`text-2xl font-bold ${getMetricColor(mockBacktestData.metrics.roi)}`}>
              {mockBacktestData.metrics.roi.toFixed(1)}%
            </p>
            <p className="text-xs text-white/40 mt-1">Retorno sobre investimento</p>
          </div>
        </div>

        {/* Estatísticas de Trades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <p className="text-sm text-white/60 mb-2">Total de Trades</p>
            <p className="text-3xl font-bold text-white">{mockBacktestData.metrics.totalTrades}</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-400">✓ Vitórias</span>
                <span className="text-white">{mockBacktestData.metrics.winningTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">✗ Derrotas</span>
                <span className="text-white">{mockBacktestData.metrics.losingTrades}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <p className="text-sm text-white/60 mb-2">Win Rate</p>
            <p className="text-3xl font-bold text-green-400">{mockBacktestData.metrics.winRate.toFixed(1)}%</p>
            <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
                style={{ width: `${mockBacktestData.metrics.winRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <p className="text-sm text-white/60 mb-2">Média de Ganho/Perda</p>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Ganho Médio</span>
                <span className="text-white font-semibold">+${mockBacktestData.metrics.avgWin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Perda Média</span>
                <span className="text-white font-semibold">${mockBacktestData.metrics.avgLoss.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Curva de Equity */}
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Curva de Equity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockBacktestData.equityCurve}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="data" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Drawdown */}
          <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Drawdown ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockBacktestData.drawdownCurve}>
                <defs>
                  <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="data" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fillOpacity={1} fill="url(#colorDrawdown)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win Rate por Mercado */}
        <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Win Rate por Mercado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockBacktestData.winRateByMarket}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="mercado" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="winRate" fill="#10b981" name="Win Rate (%)" />
              <Bar dataKey="trades" fill="#3b82f6" name="Total de Trades" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Mensal */}
        <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Performance Mensal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockBacktestData.monthlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={2} name="ROI (%)" />
              <Line type="monotone" dataKey="trades" stroke="#3b82f6" strokeWidth={2} name="Trades" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white mb-2">Insights de Performance</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>✓ Sharpe Ratio acima de 1.5 indica retornos bem ajustados ao risco</li>
                <li>✓ Win Rate de 58.5% está acima da média de mercado (55%)</li>
                <li>✓ Profit Factor de 2.3x mostra ganhos 2.3x maiores que perdas</li>
                <li>⚠ Max Drawdown de -12.5% está dentro dos limites aceitáveis (&lt;15%)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RaphaLayout>
  );
}
