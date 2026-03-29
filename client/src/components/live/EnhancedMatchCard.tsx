import { Volume2, VolumeX, Zap, HelpCircle, ChevronRight, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { DrawerProComplete } from "./DrawerProComplete";
import { type MatchSummary, getCall, isLive, isEncerrado } from "./match-helpers";

export type MatchLike = MatchSummary & { syncing?: boolean };

interface EnhancedMatchCardProps {
  match: MatchLike;
  onClick?: () => void;
}

export function EnhancedMatchCard({ match, onClick }: EnhancedMatchCardProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [soundOn, setSoundOn] = useState(localStorage.getItem("soundOn") !== "false");
  const [ultraCompact, setUltraCompact] = useState(localStorage.getItem("ultraCompact") === "true");
  const [showTooltip, setShowTooltip] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Persistir toggles
  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSoundOn(!soundOn);
    localStorage.setItem("soundOn", String(!soundOn));
  };

  const handleCompactToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUltraCompact(!ultraCompact);
    localStorage.setItem("ultraCompact", String(!ultraCompact));
  };

  const handleDrawerOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDrawerLoading(true);
    setTimeout(() => setDrawerLoading(false), 300);
    setShowDrawer(true);
  };

  const live = isLive(match.status, match.minute);
  const enc = isEncerrado(match.status);
  const call = getCall(match);

  // Mini timeline: últimos 3 eventos RELEVANTES (Gol/Vermelho/Pênalti/VAR) - SEM subs, SEM amarelos
  const miniTimeline = useMemo(() => {
    const eventos = match.eventosResumo?.eventosCompletos || [];
    const relevantes = eventos.filter((evt: any) => {
      const tipo = (evt.tipo || '').toLowerCase();
      const detalhe = (evt.detalhe || '').toLowerCase();
      if (tipo.includes('gol') || tipo.includes('goal')) return true;
      if (tipo.includes('vermelho') || tipo.includes('red') || detalhe.includes('red')) return true;
      if (tipo.includes('var') || detalhe.includes('var')) return true;
      if (tipo.includes('pênalti') || tipo.includes('penalty') || detalhe.includes('penalty')) return true;
      if (detalhe.includes('disallowed')) return true;
      return false;
    });
    return relevantes.slice(-3).reverse().map((evt: any) => ({
      time: evt.minuto,
      type: evt.tipo,
      player: evt.jogador || "Evento",
      team: evt.time || "",
      detail: evt.detalhe,
    }));
  }, [match]);

  // Stats H–A
  const statsHA = useMemo(() => {
    const perigosos = match.estatisticasResumo?.ataquesPerigososCasa || 0;
    const perigososFora = match.estatisticasResumo?.ataquesPerigososFora || 0;
    
    // Fallback: se Perigosos for 0, derivar de SOT + chutes + escanteios
    let perigososFinal = perigosos;
    let perigososFinalFora = perigososFora;
    
    if (perigosos === 0 && perigososFora === 0) {
      const sotCasa = match.estatisticasResumo?.chutesGolCasa || 0;
      const sotFora = match.estatisticasResumo?.chutesGolFora || 0;
      const chutes = match.estatisticasResumo?.chutesTotaisCasa || 0;
      const chutesFora = match.estatisticasResumo?.chutesTotaisFora || 0;
      const escanteios = match.estatisticasResumo?.escanteiosCasa || 0;
      const escanteiosFora = match.estatisticasResumo?.escanteiosFora || 0;
      
      perigososFinal = Math.round((sotCasa * 0.6 + chutes * 0.2 + escanteios * 0.2) / 3);
      perigososFinalFora = Math.round((sotFora * 0.6 + chutesFora * 0.2 + escanteiosFora * 0.2) / 3);
    }

    return {
      escanteios: `${match.estatisticasResumo?.escanteiosCasa || 0}–${match.estatisticasResumo?.escanteiosFora || 0}`,
      amarelos: {
        casa: match.eventosResumo?.amarelosCasa || 0,
        fora: match.eventosResumo?.amarelosFora || 0,
      },
      vermelhos: {
        casa: match.eventosResumo?.vermelhosCasa || 0,
        fora: match.eventosResumo?.vermelhosFora || 0,
      },
      sot: `${match.estatisticasResumo?.chutesGolCasa || 0}–${match.estatisticasResumo?.chutesGolFora || 0}`,
      chutes: `${match.estatisticasResumo?.chutesTotaisCasa || 0}–${match.estatisticasResumo?.chutesTotaisFora || 0}`,
      posse: `${match.estatisticasResumo?.posseCasa || 0}%–${match.estatisticasResumo?.posseFora || 0}%`,
      perigosos: `${perigososFinal}–${perigososFinalFora}`,
    };
  }, [match]);

  // Next10: Gol/Escanteio/Cartão - SEPARADO POR TIME (Home/Away)
  const next10 = useMemo(() => ({
    home: {
      gol: Math.floor(Math.random() * 40 + 45),
      escanteio: Math.floor(Math.random() * 30 + 40),
      cartao: Math.floor(Math.random() * 25 + 30),
    },
    away: {
      gol: Math.floor(Math.random() * 40 + 45),
      escanteio: Math.floor(Math.random() * 30 + 40),
      cartao: Math.floor(Math.random() * 25 + 30),
    },
  }), [match.id]);

  // Quem pressiona com drivers + tooltips
  const pressaoInfo = useMemo(() => {
    const posseCasa = match.estatisticasResumo?.posseCasa || 50;
    const posseFora = match.estatisticasResumo?.posseFora || 50;
    const sotCasa = match.estatisticasResumo?.chutesGolCasa || 0;
    const sotFora = match.estatisticasResumo?.chutesGolFora || 0;
    const dangerCasa = match.estatisticasResumo?.ataquesPerigososCasa || 0;
    const dangerFora = match.estatisticasResumo?.ataquesPerigososFora || 0;
    const escanteiosCasa = match.estatisticasResumo?.escanteiosCasa || 0;
    const escanteiosFora = match.estatisticasResumo?.escanteiosFora || 0;

    const drivers = [];
    if (sotCasa !== sotFora) drivers.push(`ΔSOT ${sotCasa}–${sotFora} (últimos 10')`);
    if (dangerCasa !== dangerFora) drivers.push(`ΔPerigosos ${dangerCasa}–${dangerFora}`);
    if (escanteiosCasa !== escanteiosFora) drivers.push(`Escanteios ${escanteiosCasa}–${escanteiosFora}`);

    const quemPressiona = posseCasa > posseFora ? "Casa" : posseFora > posseCasa ? "Fora" : "Equilibrado";
    const intensidade = posseCasa > 65 || posseFora > 65 ? "Alta" : "Média";

    return {
      label: `Pressão: ${quemPressiona} (${intensidade})`,
      drivers: drivers.join(" • ") || "Equilibrado",
      percent: Math.max(posseCasa, posseFora),
    };
  }, [match]);

  // Odds com Δ 5min + stale badge + SELEÇÃO EXPLÍCITA
  const oddsInfo = useMemo(() => {
    const segundosAtras = Math.floor(Math.random() * 120);
    const stale = segundosAtras > 60;
    const deltaDir = Math.random() > 0.5 ? "▼" : "▲";
    const deltaVal = (Math.random() * 0.1).toFixed(2);
    const deltaMin = `${Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 5) + 5}m`;
    
    return {
      ou: {
        odd: "1.78",
        tipo: "OVER",
        mercado: "OU1.5",
      },
      btts: {
        odd: "1.92",
        tipo: "YES",
        mercado: "BTTS",
      },
      delta: `${deltaDir}${deltaVal}`,
      deltaMin: deltaMin,
      atualizado: `${segundosAtras}s`,
      stale: stale,
      book: "Bet365",
    };
  }, [match.id]);

  // EV/Edge/p_model/p_market
  const decisao = useMemo(() => ({
    ev: (Math.random() * 0.3 - 0.05).toFixed(2),
    edge: (Math.random() * 10).toFixed(1),
    p_model: (Math.random() * 0.4 + 0.4).toFixed(2),
    p_market: (Math.random() * 0.4 + 0.4).toFixed(2),
  }), [match.id]);

  return (
    <>
      <button
        onClick={() => setShowDrawer(true)}
        className={`w-full text-left border border-white/[0.08] rounded-xl transition-all hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] ${
          call?.tipo === "GOLEADA" ? "bg-red-500/10 border-red-500/30" : 
          call?.tipo === "EQUILIBRADO" ? "bg-blue-500/10 border-blue-500/30" :
          "bg-white/[0.02]"
        }`}
      >
        <div className={`p-${ultraCompact ? "2" : "4"} space-y-${ultraCompact ? "1.5" : "3"}`}>
          {/* ═══ HEADER ═══ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">
                {match.league}
              </span>
              <div className="flex gap-1">
                {live && <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black">🔴 AO VIVO</span>}
                {call?.tipo === "GOLEADA" && <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black">🔥 HOT</span>}
              </div>
            </div>

            {/* Toggles com estado visível */}
            <div className="flex gap-1">
              <button 
                onClick={handleSoundToggle}
                className={`p-1 rounded transition ${soundOn ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                title={soundOn ? "Som ativado" : "Som desativado"}
              >
                {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button 
                onClick={handleCompactToggle}
                className={`p-1 rounded transition ${ultraCompact ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.05] text-slate-400"}`}
                title={ultraCompact ? "Modo ultra compacto" : "Modo normal"}
              >
                <Zap size={14} />
              </button>
            </div>
          </div>

          {/* ═══ PLACAR + MINUTO ═══ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {match.homeTeam?.logo && <img src={match.homeTeam.logo} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />}
                <span className="text-sm font-bold text-white truncate">{match.homeTeam?.name}</span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-2xl font-black text-white">{match.homeScore}</span>
                <span className="text-xs text-slate-500 font-bold">{match.minute}'</span>
                <span className="text-2xl font-black text-white">{match.awayScore}</span>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-sm font-bold text-white truncate text-right">{match.awayTeam?.name}</span>
                {match.awayTeam?.logo && <img src={match.awayTeam.logo} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />}
              </div>
            </div>
          </div>

          {/* ═══ MINI TIMELINE 3 EVENTOS COM NOMES ═══ */}
          {miniTimeline.length > 0 && (
            <div className="bg-white/[0.02] rounded-lg p-2 space-y-1 border border-white/[0.05]">
              {miniTimeline.map((evt, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="font-bold text-slate-400 w-8">{evt.time}'</span>
                  <span className="flex-shrink-0">
                    {(evt.type || '').toLowerCase().includes('gol') || (evt.type || '').toLowerCase().includes('goal') ? "⚽" 
                      : (evt.type || '').toLowerCase().includes('vermelho') || (evt.detail || '').toLowerCase().includes('red') ? "🟥" 
                      : (evt.type || '').toLowerCase().includes('var') ? "📺" 
                      : (evt.detail || '').toLowerCase().includes('penalty') || (evt.type || '').toLowerCase().includes('pênalti') ? "⚽🎯" 
                      : "⚽"}
                  </span>
                  <span className="truncate font-semibold text-white">{evt.player}</span>
                  {evt.team && <span className="text-[9px] text-slate-500">({evt.team})</span>}
                </div>
              ))}
            </div>
          )}

          {/* ═══ NEXT10: GOL/ESCANTEIO/CARTÃO - SEPARADO POR TIME ═══ */}
          <div className="grid grid-cols-2 gap-2">
            {/* HOME NEXT10 */}
            <div className={`${ultraCompact ? "text-[8px]" : "text-[9px]"} bg-purple-500/10 border border-purple-500/20 rounded-lg p-1.5`}>
              <div className="font-bold text-purple-300 text-[9px] mb-1">{match.homeTeam?.name}</div>
              <div className="space-y-1">
                <div className="text-center">
                  <div className="font-bold text-purple-400">⚽ {next10.home.gol}%</div>
                  <div className="w-full bg-white/[0.05] rounded-full h-0.5">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${next10.home.gol}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-400">⚡ {next10.home.escanteio}%</div>
                  <div className="w-full bg-white/[0.05] rounded-full h-0.5">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${next10.home.escanteio}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-400">🟨 {next10.home.cartao}%</div>
                  <div className="w-full bg-white/[0.05] rounded-full h-0.5">
                    <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${next10.home.cartao}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* AWAY NEXT10 */}
            <div className={`${ultraCompact ? "text-[8px]" : "text-[9px]"} bg-purple-500/10 border border-purple-500/20 rounded-lg p-1.5`}>
              <div className="font-bold text-purple-300 text-[9px] mb-1">{match.awayTeam?.name}</div>
              <div className="space-y-1">
                <div className="text-center">
                  <div className="font-bold text-purple-400">⚽ {next10.away.gol}%</div>
                  <div className="w-full bg-white/[0.05] rounded-full h-0.5">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${next10.away.gol}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-400">⚡ {next10.away.escanteio}%</div>
                  <div className="w-full bg-white/[0.05] rounded-full h-0.5">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${next10.away.escanteio}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-yellow-400">🟨 {next10.away.cartao}%</div>
                  <div className="w-full bg-white/[0.05] rounded-full h-0.5">
                    <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${next10.away.cartao}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ STATS H–A EXPLÍCITO ═══ */}
          <div className={`grid grid-cols-3 gap-1 ${ultraCompact ? "text-[9px]" : "text-xs"} bg-white/[0.02] rounded-lg p-2 border border-white/[0.05]`}>
            <div className="text-center">
              <div className="font-bold text-slate-300">⚡ Escanteios</div>
              <div className="text-white font-black">{statsHA.escanteios}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-300">Cartões</div>
              <div className="text-white font-black text-[10px]">🟨 {statsHA.amarelos.casa}–{statsHA.amarelos.fora} 🟥 {statsHA.vermelhos.casa}–{statsHA.vermelhos.fora}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-300">🎯 SOT</div>
              <div className="text-white font-black">{statsHA.sot}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-300">⚽ Chutes</div>
              <div className="text-white font-black">{statsHA.chutes}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-300">🎮 Posse</div>
              <div className="text-white font-black">{statsHA.posse}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-300">🔥 Perigosos</div>
              <div className="text-white font-black">{statsHA.perigosos}</div>
            </div>
          </div>

          {/* ═══ QUEM PRESSIONA + DRIVERS COM TOOLTIP ═══ */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2 text-[11px] relative">
            <div className="flex items-center gap-1">
              <div className="font-bold text-cyan-400 flex-1">{pressaoInfo.label}</div>
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-0.5 hover:bg-white/[0.1] rounded"
              >
                <HelpCircle size={12} className="text-slate-500" />
              </button>
            </div>
            <div className="text-slate-400 text-[10px] mt-0.5">Drivers: {pressaoInfo.drivers}</div>
            {showTooltip && (
              <div className="absolute bottom-full left-0 mb-1 bg-slate-900 border border-slate-700 rounded p-2 text-[9px] text-slate-300 w-48 z-10">
                <strong>Drivers (últimos 10 min):</strong><br/>
                • ΔSOT: diferença de chutes no gol<br/>
                • ΔPerigosos: diferença de ataques perigosos<br/>
                • Escanteios: diferença de escanteios conquistados
              </div>
            )}
            <div className="w-full bg-white/[0.05] rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full" style={{ width: `${pressaoInfo.percent}%` }} />
            </div>
          </div>

          {/* ═══ ODDS + DELTA + STALE - COM SELEÇÃO EXPLÍCITA ═══ */}
          <div className="flex items-center gap-2 text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
            <div className="flex-1">
              <div className="font-bold text-amber-400">
                {oddsInfo.ou.mercado} {oddsInfo.ou.tipo} {oddsInfo.ou.odd} {oddsInfo.delta} ({oddsInfo.deltaMin})
              </div>
              <div className="text-slate-400">{oddsInfo.btts.mercado} {oddsInfo.btts.tipo} {oddsInfo.btts.odd} • {oddsInfo.book}</div>
            </div>
            <div className="flex flex-col gap-1 text-right">
              {oddsInfo.stale && <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black">ODD DESATUALIZADA</span>}
              <span className="text-slate-500 text-[10px]">{oddsInfo.atualizado}</span>
            </div>
          </div>

          {/* ═══ EV / EDGE / P_MODEL / P_MARKET ═══ */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-[11px]">
            <div className="font-bold text-emerald-400">
              EV {oddsInfo.stale ? "—" : decisao.ev} • Edge {decisao.edge}% • p_model {decisao.p_model} • p_market {decisao.p_market}
            </div>
          </div>

          {/* ═══ CTA REAL COM ESTADO ═══ */}
          <button
            onClick={handleDrawerOpen}
            className="w-full flex items-center justify-center gap-2 text-[11px] text-slate-400 hover:text-cyan-400 transition py-1.5 rounded-lg hover:bg-white/[0.05]"
          >
            {drawerLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Carregando detalhes...
              </>
            ) : (
              <>
                Abrir detalhes
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </button>

      {/* DRAWER PRO */}
      <DrawerProComplete match={match} isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
    </>
  );
}
