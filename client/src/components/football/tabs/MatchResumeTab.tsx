import { Card } from "@/components/ui/card";

interface MatchResumeTabProps {
  fixture: any;
}

export function MatchResumeTab({ fixture }: MatchResumeTabProps) {
  const statistics = fixture.statistics || [];
  const homeStats = statistics[0];
  const awayStats = statistics[1];

  return (
    <div className="p-4 space-y-4">
      {/* Next10 KPIs */}
      <Card className="p-4 bg-card/50 border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">Próximos 10 Minutos</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">⚽</div>
            <div className="text-xs text-muted-foreground mt-1">Gol</div>
            <div className="text-sm font-semibold text-foreground">35%</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">⚡</div>
            <div className="text-xs text-muted-foreground mt-1">Escanteio</div>
            <div className="text-sm font-semibold text-foreground">2-3</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">🟨</div>
            <div className="text-xs text-muted-foreground mt-1">Cartão</div>
            <div className="text-sm font-semibold text-foreground">20%</div>
          </div>
        </div>
      </Card>

      {/* Pressão */}
      <Card className="p-4 bg-card/50 border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">Pressão</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Casa</span>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${homeStats?.ball_possession || 50}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground w-8 text-right">
              {homeStats?.ball_possession || 50}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Fora</span>
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full"
                style={{ width: `${awayStats?.ball_possession || 50}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground w-8 text-right">
              {awayStats?.ball_possession || 50}%
            </span>
          </div>
        </div>
      </Card>

      {/* Odds Live */}
      <Card className="p-4 bg-card/50 border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">Odds Live</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">Acima 1.5</div>
            <div className="text-lg font-bold text-green-400">1.78</div>
            <div className="text-xs text-muted-foreground mt-1">↑ 0.05 (5min)</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">Ambos Marcam</div>
            <div className="text-lg font-bold text-green-400">1.92</div>
            <div className="text-xs text-muted-foreground mt-1">Estável</div>
          </div>
        </div>
      </Card>

      {/* Stats Rápidas */}
      <Card className="p-4 bg-card/50 border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">Estatísticas Rápidas</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Chutes no Alvo</span>
            <span className="font-semibold text-foreground">
              {homeStats?.shots_on_goal || 0} - {awayStats?.shots_on_goal || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Escanteios</span>
            <span className="font-semibold text-foreground">
              {homeStats?.corner_kicks || 0} - {awayStats?.corner_kicks || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Faltas</span>
            <span className="font-semibold text-foreground">
              {homeStats?.fouls || 0} - {awayStats?.fouls || 0}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
