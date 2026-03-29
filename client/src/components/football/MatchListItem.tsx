import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchListItemProps {
  fixture: any;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export function MatchListItem({
  fixture,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: MatchListItemProps) {
  const status = fixture.fixture?.status?.short || "NS";
  const isLive = status === "LIVE";
  const isFinished = ["FT", "AET", "PEN"].includes(status);
  const homeTeam = fixture.teams?.home;
  const awayTeam = fixture.teams?.away;
  const goals = fixture.goals;
  const fixture_date = fixture.fixture?.date;

  // Formatar hora/minuto
  let timeDisplay = "";
  if (isLive) {
    timeDisplay = `${fixture.fixture?.status?.elapsed}'`;
  } else if (fixture_date) {
    const date = new Date(fixture_date);
    timeDisplay = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "px-3 py-2 cursor-pointer border-l-2 transition-all hover:bg-muted/50",
        isSelected ? "border-l-primary bg-muted/70" : "border-l-transparent",
        isLive && "bg-red-500/5"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {/* Hora/Minuto */}
        <span className="text-xs font-semibold text-muted-foreground min-w-10">
          {timeDisplay}
        </span>

        {/* Status Badge */}
        {isLive && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">
            AO VIVO
          </span>
        )}

        {/* Favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="ml-auto"
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            )}
          />
        </button>
      </div>

      {/* Times */}
      <div className="flex items-center gap-2 mb-1">
        {/* Home Team */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <img
            src={homeTeam?.logo}
            alt={homeTeam?.name}
            className="w-5 h-5 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23ccc'/%3E%3C/svg%3E";
            }}
          />
          <span className="text-xs font-medium truncate text-foreground">
            {homeTeam?.name}
          </span>
        </div>

        {/* Placar */}
        <div className="text-sm font-bold text-foreground min-w-12 text-right">
          {goals?.home} - {goals?.away}
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
          <span className="text-xs font-medium truncate text-foreground">
            {awayTeam?.name}
          </span>
          <img
            src={awayTeam?.logo}
            alt={awayTeam?.name}
            className="w-5 h-5 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10' fill='%23ccc'/%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>

      {/* Indicadores Live */}
      {isLive && fixture.statistics && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {fixture.statistics[0]?.corner_kicks && (
            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
              ⚡ {fixture.statistics[0].corner_kicks}
            </span>
          )}
          {fixture.statistics[0]?.yellow_cards && (
            <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">
              🟨 {fixture.statistics[0].yellow_cards}
            </span>
          )}
          {fixture.statistics[0]?.red_cards && (
            <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">
              🟥 {fixture.statistics[0].red_cards}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
