import { Card } from "@/components/ui/card";

interface MatchPlayersTabProps {
  fixture: any;
}

export function MatchPlayersTab({ fixture }: MatchPlayersTabProps) {
  const players = fixture.players || [];

  // Agrupar jogadores por categoria
  const hot = players.slice(0, 3);
  const disciplined = players.slice(3, 6);
  const goalkeeper = players.find((p: any) => p.pos === "G");
  const defense = players.filter((p: any) => p.pos === "D").slice(0, 2);
  const attack = players.filter((p: any) => p.pos === "F").slice(0, 2);

  const PlayerCard = ({
    player,
    badge,
    color,
  }: {
    player: any;
    badge: string;
    color: string;
  }) => (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <img
        src={player.photo}
        alt={player.name}
        className="w-10 h-10 rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23ccc'/%3E%3C/svg%3E";
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{player.name}</div>
        <div className="text-xs text-muted-foreground">{player.pos}</div>
      </div>
      <div className={`text-lg font-bold ${color}`}>{badge}</div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {/* Quentes */}
      {hot.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-3">🔥 Quentes</h4>
          <div className="space-y-2">
            {hot.map((player: any, idx: number) => (
              <PlayerCard key={idx} player={player} badge="🔥" color="text-red-400" />
            ))}
          </div>
        </Card>
      )}

      {/* Indisciplinados */}
      {disciplined.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-3">⚠️ Indisciplinados</h4>
          <div className="space-y-2">
            {disciplined.map((player: any, idx: number) => (
              <PlayerCard key={idx} player={player} badge="⚠️" color="text-yellow-400" />
            ))}
          </div>
        </Card>
      )}

      {/* Goleiro */}
      {goalkeeper && (
        <Card className="p-4 bg-card/50 border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-3">🧤 Goleiro</h4>
          <PlayerCard player={goalkeeper} badge="🧤" color="text-blue-400" />
        </Card>
      )}

      {/* Defesa */}
      {defense.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-3">🛡️ Defesa Forte</h4>
          <div className="space-y-2">
            {defense.map((player: any, idx: number) => (
              <PlayerCard key={idx} player={player} badge="🛡️" color="text-green-400" />
            ))}
          </div>
        </Card>
      )}

      {/* Ataque */}
      {attack.length > 0 && (
        <Card className="p-4 bg-card/50 border-border/50">
          <h4 className="text-sm font-semibold text-foreground mb-3">⚡ Ataque Arrasador</h4>
          <div className="space-y-2">
            {attack.map((player: any, idx: number) => (
              <PlayerCard key={idx} player={player} badge="⚡" color="text-orange-400" />
            ))}
          </div>
        </Card>
      )}

      {players.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Dados de jogadores não disponíveis</p>
        </div>
      )}
    </div>
  );
}
