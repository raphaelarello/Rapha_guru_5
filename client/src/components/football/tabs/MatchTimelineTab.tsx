import { Card } from "@/components/ui/card";

interface MatchTimelineTabProps {
  fixture: any;
}

export function MatchTimelineTab({ fixture }: MatchTimelineTabProps) {
  const events = fixture.events || [];
  const relevantEvents = events
    .filter((e: any) => ["Goal", "Card", "subst", "Var"].includes(e.type))
    .slice(0, 15);

  const getEventIcon = (type: string, detail?: string) => {
    switch (type) {
      case "Goal":
        return "⚽";
      case "Card":
        return detail?.includes("Yellow") ? "🟨" : "🟥";
      case "subst":
        return "🔄";
      case "Var":
        return "🎥";
      default:
        return "•";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "Goal":
        return "text-green-400";
      case "Card":
        return "text-yellow-400";
      case "subst":
        return "text-blue-400";
      case "Var":
        return "text-purple-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="p-4 space-y-2">
      {relevantEvents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum evento registrado ainda</p>
        </div>
      ) : (
        relevantEvents.map((event: any, idx: number) => (
          <Card key={idx} className="p-3 bg-card/50 border-border/50 flex gap-3">
            <div className="flex-shrink-0 w-12 text-center">
              <div className={`text-lg font-bold ${getEventColor(event.type)}`}>
                {getEventIcon(event.type, event.detail)}
              </div>
              <div className="text-xs text-muted-foreground">{event.time?.elapsed}'</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {event.player?.name || "Evento"}
              </div>
              <div className="text-xs text-muted-foreground">
                {event.team?.name} • {event.detail}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
