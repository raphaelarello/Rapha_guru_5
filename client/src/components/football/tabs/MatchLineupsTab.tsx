import { Card } from "@/components/ui/card";

interface MatchLineupsTabProps {
  fixture: any;
}

export function MatchLineupsTab({ fixture }: MatchLineupsTabProps) {
  const lineups = fixture.lineups || [];
  const homeLineup = lineups[0];
  const awayLineup = lineups[1];

  const LineupSection = ({
    title,
    formation,
    startXI,
    substitutes,
  }: {
    title: string;
    formation: string;
    startXI: any[];
    substitutes: any[];
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
          {formation}
        </span>
      </div>

      {/* Titulares */}
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground font-semibold mb-2">Titulares</div>
        {(startXI || []).map((player: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
            <span className="text-xs font-bold text-muted-foreground min-w-6">
              {player.player?.number}
            </span>
            <span className="text-xs text-muted-foreground">
              {player.player?.pos}
            </span>
            <span className="text-foreground flex-1">{player.player?.name}</span>
          </div>
        ))}
      </div>

      {/* Reservas */}
      {(substitutes || []).length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-semibold mb-2">Reservas</div>
          {substitutes.map((player: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-muted/20 rounded text-sm opacity-75">
              <span className="text-xs font-bold text-muted-foreground min-w-6">
                {player.player?.number}
              </span>
              <span className="text-xs text-muted-foreground">
                {player.player?.pos}
              </span>
              <span className="text-foreground flex-1">{player.player?.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {homeLineup && (
        <Card className="p-4 bg-card/50 border-border/50">
          <LineupSection
            title={homeLineup.team?.name}
            formation={homeLineup.formation}
            startXI={homeLineup.startXI}
            substitutes={homeLineup.substitutes}
          />
        </Card>
      )}

      {awayLineup && (
        <Card className="p-4 bg-card/50 border-border/50">
          <LineupSection
            title={awayLineup.team?.name}
            formation={awayLineup.formation}
            startXI={awayLineup.startXI}
            substitutes={awayLineup.substitutes}
          />
        </Card>
      )}

      {!homeLineup && !awayLineup && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Escalações não disponíveis</p>
        </div>
      )}
    </div>
  );
}
