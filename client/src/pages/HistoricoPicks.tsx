import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data - em produção, viria do backend
const mockPicks = [
  { id: 1, match: 'Argentina vs Mauritânia', market: 'Mais 1.5 gols', odd: 1.78, stake: 100, result: 'WIN', profit: 78, date: '2026-03-27', confidence: 92 },
  { id: 2, match: 'Tecos vs Leones Negros', market: 'BTTS', odd: 1.92, stake: 50, result: 'LOSS', profit: -50, date: '2026-03-27', confidence: 85 },
  { id: 3, match: 'Botafogo W vs Corinthians W', market: 'Mais 2.5 gols', odd: 2.15, stake: 75, result: 'WIN', profit: 85.75, date: '2026-03-27', confidence: 88 },
  { id: 4, match: 'Santos W vs Ferroviária W', market: 'Casa vence', odd: 2.45, stake: 60, result: 'WIN', profit: 87, date: '2026-03-26', confidence: 79 },
  { id: 5, match: 'Prison Service vs Morvant', market: 'Mais 1.5 gols', odd: 1.65, stake: 100, result: 'LOSS', profit: -100, date: '2026-03-26', confidence: 72 },
  { id: 6, match: 'Charlotte Independence vs Spokane', market: 'BTTS', odd: 1.88, stake: 80, result: 'WIN', profit: 70.4, date: '2026-03-26', confidence: 81 },
];

export function HistoricoPicks() {
  const [filterMarket, setFilterMarket] = useState<string>('todos');
  const [filterResult, setFilterResult] = useState<string>('todos');

  const filteredPicks = useMemo(() => {
    return mockPicks.filter((pick) => {
      if (filterMarket !== 'todos' && pick.market !== filterMarket) return false;
      if (filterResult !== 'todos' && pick.result !== filterResult) return false;
      return true;
    });
  }, [filterMarket, filterResult]);

  const stats = useMemo(() => {
    const total = filteredPicks.length;
    const wins = filteredPicks.filter((p) => p.result === 'WIN').length;
    const losses = filteredPicks.filter((p) => p.result === 'LOSS').length;
    const totalStaked = filteredPicks.reduce((sum, p) => sum + p.stake, 0);
    const totalProfit = filteredPicks.reduce((sum, p) => sum + p.profit, 0);
    const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(2) : '0.00';
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(2) : '0.00';

    return { total, wins, losses, totalStaked, totalProfit, roi, winRate };
  }, [filteredPicks]);

  const chartData = useMemo(() => {
    const byMarket: Record<string, { market: string; wins: number; losses: number; roi: number }> = {};

    filteredPicks.forEach((pick) => {
      if (!byMarket[pick.market]) {
        byMarket[pick.market] = { market: pick.market, wins: 0, losses: 0, roi: 0 };
      }
      if (pick.result === 'WIN') {
        byMarket[pick.market].wins += 1;
      } else {
        byMarket[pick.market].losses += 1;
      }
      byMarket[pick.market].roi += pick.profit;
    });

    return Object.values(byMarket);
  }, [filteredPicks]);

  const profitByDate = useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredPicks.forEach((pick) => {
      byDate[pick.date] = (byDate[pick.date] || 0) + pick.profit;
    });
    return Object.entries(byDate)
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredPicks]);

  const resultDistribution = [
    { name: 'Vitórias', value: stats.wins, fill: '#10b981' },
    { name: 'Derrotas', value: stats.losses, fill: '#ef4444' },
  ];

  const markets = Array.from(new Set(mockPicks.map((p) => p.market)));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Picks</h1>
        <p className="text-sm text-muted-foreground mt-2">Análise completa de ROI, taxa de acerto e performance por mercado</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Mercado</label>
          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-foreground"
          >
            <option value="todos">Todos</option>
            {markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Resultado</label>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-foreground"
          >
            <option value="todos">Todos</option>
            <option value="WIN">Vitórias</option>
            <option value="LOSS">Derrotas</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Acerto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.winRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(stats.roi) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.roi}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {stats.totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI por Mercado */}
        <Card>
          <CardHeader>
            <CardTitle>ROI por Mercado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="market" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wins" fill="#10b981" name="Vitórias" />
                <Bar dataKey="losses" fill="#ef4444" name="Derrotas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={resultDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {resultDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lucro ao Longo do Tempo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lucro Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="profit" stroke="#10b981" name="Lucro (R$)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Picks */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Picks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Jogo</th>
                  <th className="text-left py-2 px-4">Mercado</th>
                  <th className="text-right py-2 px-4">Odd</th>
                  <th className="text-right py-2 px-4">Stake</th>
                  <th className="text-center py-2 px-4">Resultado</th>
                  <th className="text-right py-2 px-4">Lucro</th>
                  <th className="text-right py-2 px-4">Confiança</th>
                </tr>
              </thead>
              <tbody>
                {filteredPicks.map((pick) => (
                  <tr key={pick.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4">{pick.match}</td>
                    <td className="py-2 px-4">{pick.market}</td>
                    <td className="text-right py-2 px-4 font-semibold">{pick.odd.toFixed(2)}</td>
                    <td className="text-right py-2 px-4">R$ {pick.stake.toFixed(2)}</td>
                    <td className="text-center py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${pick.result === 'WIN' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                        {pick.result === 'WIN' ? '✓ WIN' : '✗ LOSS'}
                      </span>
                    </td>
                    <td className={`text-right py-2 px-4 font-semibold ${pick.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      R$ {pick.profit.toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-4">{pick.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
