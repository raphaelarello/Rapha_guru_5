import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { trpc } from '@/lib/trpc';

interface PerformanceMetrics {
  roi: number;
  totalBets: number;
  wins: number;
  losses: number;
  winRate: number;
  avgOdd: number;
  totalProfit: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
}

export default function DashboardPerformance() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [market, setMarket] = useState<string>('todos');
  const [league, setLeague] = useState<string>('todos');
  const [minConfidence, setMinConfidence] = useState(0);

  // Mock data - em produção, viria de uma query tRPC
  const metrics: PerformanceMetrics = {
    roi: 12.5,
    totalBets: 145,
    wins: 89,
    losses: 56,
    winRate: 61.4,
    avgOdd: 2.15,
    totalProfit: 1250,
    sharpeRatio: 1.85,
    maxDrawdown: -8.5,
    profitFactor: 2.3,
  };

  const marketMetrics = [
    { market: '1X2', roi: 15.2, bets: 45, winRate: 64.4 },
    { market: 'Mais 2.5', roi: 10.8, bets: 38, winRate: 58.2 },
    { market: 'Menos 2.5', roi: 9.5, bets: 35, winRate: 57.1 },
    { market: 'Ambos Marcam', roi: 12.3, bets: 27, winRate: 63.0 },
  ];

  const leagueMetrics = [
    { league: 'Premier League', roi: 14.2, bets: 42, winRate: 66.7 },
    { league: 'La Liga', roi: 11.5, bets: 35, winRate: 62.9 },
    { league: 'Serie A', roi: 10.3, bets: 32, winRate: 59.4 },
    { league: 'Bundesliga', roi: 13.8, bets: 28, winRate: 64.3 },
    { league: 'Ligue 1', roi: 9.2, bets: 8, winRate: 50.0 },
  ];

  // Dados para curva de lucro
  const profitCurveData = Array.from({ length: 30 }, (_, i) => ({
    data: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' }),
    lucro: Math.floor(Math.random() * 200 - 50 + i * 5),
    acumulado: Math.floor((i + 1) * 40 + Math.random() * 100),
  }));

  // Dados para distribuição wins/losses
  const winLossData = [
    { name: 'Vitórias', value: metrics.wins, fill: '#10b981' },
    { name: 'Derrotas', value: metrics.losses, fill: '#ef4444' },
  ];

  // Dados para ROI por mercado
  const marketROIData = marketMetrics.map(m => ({
    mercado: m.market,
    roi: m.roi,
    apostas: m.bets,
  }));

  const filteredMarketMetrics = useMemo(() => {
    return marketMetrics.filter(m => market === 'todos' || m.market === market);
  }, [market]);

  const filteredLeagueMetrics = useMemo(() => {
    return leagueMetrics.filter(l => league === 'todos' || l.league === league);
  }, [league]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard de Performance</h1>
        <p className="text-gray-400 text-sm">ROI, Sharpe Ratio, Drawdown e análise por mercado/liga</p>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="all">Todo o período</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Mercado</label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="1X2">1X2</option>
              <option value="Mais 2.5">Mais 2.5</option>
              <option value="Menos 2.5">Menos 2.5</option>
              <option value="Ambos Marcam">Ambos Marcam</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Liga</label>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            >
              <option value="todos">Todas</option>
              <option value="Premier League">Premier League</option>
              <option value="La Liga">La Liga</option>
              <option value="Serie A">Serie A</option>
              <option value="Bundesliga">Bundesliga</option>
              <option value="Ligue 1">Ligue 1</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Confiança Mín: {minConfidence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/10 border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">ROI</p>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{metrics.roi.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Retorno sobre Investimento</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/10 border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Taxa Vitória</p>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{metrics.winRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.wins}V / {metrics.losses}D</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Lucro Total</p>
            <DollarSign className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">R$ {metrics.totalProfit.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.totalBets} apostas</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Sharpe Ratio</p>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400">{metrics.sharpeRatio.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Risco/Retorno</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-900/30 to-red-800/10 border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Max Drawdown</p>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{metrics.maxDrawdown.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Pior queda</p>
        </Card>
      </div>

      {/* Gráfico de Curva de Lucro */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-bold text-white mb-4">Curva de Lucro</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={profitCurveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="data" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="lucro" stroke="#10b981" name="Lucro Diário" strokeWidth={2} />
            <Line type="monotone" dataKey="acumulado" stroke="#3b82f6" name="Lucro Acumulado" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico de Wins/Losses */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-bold text-white mb-4">Distribuição Vitórias/Derrotas</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de ROI por Mercado */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <h2 className="text-lg font-bold text-white mb-4">ROI por Mercado</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={marketROIData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mercado" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="roi" fill="#10b981" name="ROI (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Análise por Mercado */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-bold text-white mb-4">Performance por Mercado</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 text-gray-400">Mercado</th>
                <th className="text-right py-2 px-3 text-gray-400">ROI</th>
                <th className="text-right py-2 px-3 text-gray-400">Apostas</th>
                <th className="text-right py-2 px-3 text-gray-400">Taxa Vitória</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarketMetrics.map((m) => (
                <tr key={m.market} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-3 text-white font-semibold">{m.market}</td>
                  <td className="text-right py-3 px-3">
                    <span className={`font-bold ${m.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {m.roi > 0 ? '+' : ''}{m.roi.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-3 text-gray-400">{m.bets}</td>
                  <td className="text-right py-3 px-3 text-blue-400">{m.winRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Análise por Liga */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-bold text-white mb-4">Performance por Liga</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLeagueMetrics.map((l) => (
            <div key={l.league} className="p-3 bg-gray-700/30 rounded border border-gray-600/50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white">{l.league}</h3>
                <Badge className={l.roi > 0 ? 'bg-green-600' : 'bg-red-600'}>
                  {l.roi > 0 ? '+' : ''}{l.roi.toFixed(1)}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Apostas</p>
                  <p className="text-white font-semibold">{l.bets}</p>
                </div>
                <div>
                  <p className="text-gray-400">Taxa Vitória</p>
                  <p className="text-blue-400 font-semibold">{l.winRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-600 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${l.winRate > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${l.winRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Métricas Avançadas */}
      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <h2 className="text-lg font-bold text-white mb-4">Métricas Avançadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-700/30 rounded">
            <p className="text-xs text-gray-400 mb-1">Profit Factor</p>
            <p className="text-2xl font-bold text-green-400">{metrics.profitFactor.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Lucro bruto / Perda bruta</p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded">
            <p className="text-xs text-gray-400 mb-1">Cota Média</p>
            <p className="text-2xl font-bold text-blue-400">{metrics.avgOdd.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Média das cotas apostadas</p>
          </div>
          <div className="p-3 bg-gray-700/30 rounded">
            <p className="text-xs text-gray-400 mb-1">Total de Apostas</p>
            <p className="text-2xl font-bold text-purple-400">{metrics.totalBets}</p>
            <p className="text-xs text-gray-500 mt-1">Período selecionado</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
