import { Card } from "@/components/ui/card";

interface MatchStatsTabProps {
  fixture: any;
}

export function MatchStatsTab({ fixture }: MatchStatsTabProps) {
  const statistics = fixture.statistics || [];
  const homeStats = statistics[0] || {};
  const awayStats = statistics[1] || {};

  const stats = [
    { label: "Posse", home: homeStats.ball_possession, away: awayStats.ball_possession },
    { label: "Chutes", home: homeStats.shots_total, away: awayStats.shots_total },
    { label: "Chutes no Alvo", home: homeStats.shots_on_goal, away: awayStats.shots_on_goal },
    { label: "Escanteios", home: homeStats.corner_kicks, away: awayStats.corner_kicks },
    { label: "Faltas", home: homeStats.fouls, away: awayStats.fouls },
    { label: "Cartões Amarelos", home: homeStats.yellow_cards, away: awayStats.yellow_cards },
    { label: "Cartões Vermelhos", home: homeStats.red_cards, away: awayStats.red_cards },
    { label: "Passes", home: homeStats.total_passes, away: awayStats.total_passes },
  ];

  const getMaxValue = (home: any, away: any) => {
    const h = Number(home) || 0;
    const a = Number(away) || 0;
    return Math.max(h, a) || 1;
  };

  return (
    <div className="p-4 space-y-3">
      {stats.map((stat, idx) => {
        const home = Number(stat.home) || 0;
        const away = Number(stat.away) || 0;
        const max = getMaxValue(home, away);
        const homePercent = (home / max) * 100;
        const awayPercent = (away / max) * 100;

        return (
          <Card key={idx} className="p-3 bg-card/50 border-border/50">
            <div className="text-xs text-muted-foreground mb-2 font-semibold">{stat.label}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-end gap-1 h-6">
                  <div
                    className="bg-blue-500 rounded-t transition-all"
                    style={{ height: `${homePercent}%` }}
                  />
                  <div className="flex-1" />
                  <div
                    className="bg-orange-500 rounded-t transition-all"
                    style={{ height: `${awayPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-xs font-semibold text-foreground min-w-12 text-center">
                {home} - {away}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
