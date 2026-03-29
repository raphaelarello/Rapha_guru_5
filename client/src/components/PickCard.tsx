'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Download, AlertTriangle, TrendingUp, Star } from "lucide-react";
import { getTeamLogoUrl, getLeagueLogoUrl } from "@/lib/team-logos";

interface PickCardProps {
  pick: {
    id?: string;
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    market: string;
    selection: string;
    edge: number;
    ev: number;
    odd: number;
    modelProb: number;
    confidence?: number;
    status?: "LIVE" | "UPCOMING" | "FINISHED" | "CANCELLED";
    leagueName?: string;
    homeScore?: number;
    awayScore?: number;
    minute?: number;
  };
  bankroll?: number;
  onSave?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const PickCard: React.FC<PickCardProps> = ({ pick, bankroll = 1000, onSave, isFavorite = false, onToggleFavorite }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const saveMutation = trpc.picks.savePick.useMutation();

  // Calcular Kelly Criterion
  const kellyFraction = 0.25;
  const edgeDecimal = pick.edge / 100;
  const prob = pick.modelProb;
  const odds = pick.odd;

  const kellyF = (edgeDecimal * odds - 1) / (odds - 1);
  const recommendedStake = Math.max(0, kellyF * kellyFraction * bankroll);
  const riskLevel = kellyF > 0.1 ? "Alto" : kellyF > 0.05 ? "Médio" : "Baixo";

  // Alertas
  const isHighOpportunity = pick.edge > 10 || pick.ev > 25;
  const isGoldPick = pick.edge > 5 && pick.ev > 20;

  const handleSavePick = async () => {
    try {
      await saveMutation.mutateAsync({
        fixtureId: pick.fixtureId,
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        market: pick.market,
        selection: pick.selection,
        edge: edgeDecimal,
        ev: pick.ev / 100,
        odd: pick.odd,
        modelProb: pick.modelProb,
        confidence: pick.confidence || 0,
        status: pick.status || "UPCOMING",
        bankroll,
        leagueName: pick.leagueName,
      });
      onSave?.();
    } catch (err) {
      console.error("Erro ao salvar pick:", err);
    }
  };

  const statusColors = {
    LIVE: "bg-red-500/20 text-red-400 border-red-500/30",
    UPCOMING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    FINISHED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    CANCELLED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <Card className={`p-3 border transition-all ${isHighOpportunity ? "border-red-500 bg-red-950/30" : "border-blue-500/40 bg-slate-900/50"}`}>
      {/* HEADER: Liga + Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getLeagueLogoUrl(pick.leagueName) && (
            <img
              src={getLeagueLogoUrl(pick.leagueName)}
              alt={pick.leagueName}
              className="w-5 h-5 object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <span className="text-xs font-bold text-slate-300 uppercase">{pick.leagueName || "Liga"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${statusColors[pick.status || "UPCOMING"]}`}>
            {pick.status === "LIVE" ? "🔴 AO VIVO" : pick.status === "UPCOMING" ? "⏰ PRÓXIMO" : pick.status === "FINISHED" ? "✓ ENCERRADO" : "✗ CANCELADO"}
          </Badge>
          {pick.minute && pick.status === "LIVE" && (
            <span className="text-xs font-bold text-orange-400">{pick.minute}'</span>
          )}
        </div>
      </div>

      {/* TIMES: Logos + Nomes + Placar */}
      <div className="flex items-center justify-between mb-3 p-2 bg-slate-800/40 rounded-md">
        {/* Time Casa */}
        <div className="flex items-center gap-2 flex-1">
          {getTeamLogoUrl(pick.homeTeam) && (
            <img
              src={getTeamLogoUrl(pick.homeTeam)}
              alt={pick.homeTeam}
              className="w-8 h-8 object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{pick.homeTeam}</div>
            <div className="text-xs text-slate-400">Casa</div>
          </div>
        </div>

        {/* Placar */}
        <div className="flex flex-col items-center gap-1 px-3">
          <div className="text-lg font-bold text-white">
            {pick.homeScore !== undefined && pick.awayScore !== undefined
              ? `${pick.homeScore} - ${pick.awayScore}`
              : "vs"}
          </div>
        </div>

        {/* Time Visitante */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="flex-1 text-right">
            <div className="text-sm font-bold text-white">{pick.awayTeam}</div>
            <div className="text-xs text-slate-400">Visitante</div>
          </div>
          {getTeamLogoUrl(pick.awayTeam) && (
            <img
              src={getTeamLogoUrl(pick.awayTeam)}
              alt={pick.awayTeam}
              className="w-8 h-8 object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>
      </div>

      {/* MERCADO + SELEÇÃO */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800/30 p-2 rounded-md">
          <div className="text-xs text-slate-400">Mercado</div>
          <div className="text-sm font-bold text-white">{pick.market}</div>
        </div>
        <div className="bg-slate-800/30 p-2 rounded-md">
          <div className="text-xs text-slate-400">Seleção</div>
          <div className="text-sm font-bold text-blue-400">{pick.selection}</div>
        </div>
      </div>

      {/* MÉTRICAS: Odd, Edge, EV, Confiança */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-800/30 p-2 rounded-md text-center">
          <div className="text-xs text-slate-400">Cota</div>
          <div className="text-sm font-bold text-yellow-400">{pick.odd.toFixed(2)}</div>
        </div>
        <div className="bg-slate-800/30 p-2 rounded-md text-center">
          <div className="text-xs text-slate-400">Edge</div>
          <div className={`text-sm font-bold ${pick.edge > 5 ? "text-green-400" : "text-orange-400"}`}>
            {pick.edge.toFixed(2)}%
          </div>
        </div>
        <div className="bg-slate-800/30 p-2 rounded-md text-center">
          <div className="text-xs text-slate-400">EV</div>
          <div className={`text-sm font-bold ${pick.ev > 20 ? "text-green-400" : "text-orange-400"}`}>
            {pick.ev.toFixed(2)}%
          </div>
        </div>
        <div className="bg-slate-800/30 p-2 rounded-md text-center">
          <div className="text-xs text-slate-400">Confiança</div>
          <div className={`text-sm font-bold ${(pick.confidence || 0) > 60 ? "text-green-400" : "text-slate-300"}`}>
            {(pick.confidence || 0).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* KELLY + RISCO */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800/30 p-2 rounded-md">
          <div className="text-xs text-slate-400">Aposta Recomendada</div>
          <div className="text-sm font-bold text-green-400">R$ {recommendedStake.toFixed(2)}</div>
        </div>
        <div className="bg-slate-800/30 p-2 rounded-md">
          <div className="text-xs text-slate-400">Nível de Risco</div>
          <div className={`text-sm font-bold ${riskLevel === "Alto" ? "text-red-400" : riskLevel === "Médio" ? "text-yellow-400" : "text-green-400"}`}>
            {riskLevel}
          </div>
        </div>
      </div>

      {/* PROBABILIDADE MODELO */}
      <div className="bg-slate-800/30 p-2 rounded-md mb-3">
        <div className="text-xs text-slate-400 mb-1">Probabilidade Modelo</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full"
              style={{ width: `${Math.min(pick.modelProb * 100, 100)}%` }}
            />
          </div>
          <span className="text-sm font-bold text-cyan-400">{(pick.modelProb * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* BOTÕES */}
      <div className="flex gap-2">
        <Button
          onClick={handleSavePick}
          disabled={saveMutation.isPending}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
        >
          {saveMutation.isPending ? "Salvando..." : "✓ Salvar Pick"}
        </Button>
        <Button
          onClick={onToggleFavorite}
          variant="outline"
          className="px-3"
        >
          {isFavorite ? "⭐" : "☆"}
        </Button>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          className="px-3"
        >
          {isExpanded ? "↑" : "↓"}
        </Button>
      </div>

      {/* EXPANDIDO: Detalhes Adicionais */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">ID Fixture:</span>
              <span className="ml-2 text-slate-300">{pick.fixtureId}</span>
            </div>
            <div>
              <span className="text-slate-400">Status:</span>
              <span className="ml-2 text-slate-300">{pick.status}</span>
            </div>
          </div>
          {isGoldPick && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 p-2 rounded-md flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-xs font-bold">🏆 GOLD PICK - Oportunidade Premium!</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
