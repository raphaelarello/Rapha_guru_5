import {
  type MatchSummary,
  type EventoCompleto,
  getCall,
  statusLegivel,
  isLive,
  isEncerrado,
  formaLabel,
  formaTexto,
  corMapaCalor,
  labelMapaCalor,
} from "./match-helpers";
import {
  Zap,
  Target,
  Flag,
  Shield,
  TrendingUp,
  Clock,
  Flame,
  Thermometer,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { useState } from "react";

/* ─── Barra de stat comparativa ─── */
function StatBar({ label, casa, fora, suffix }: { label: string; casa: number; fora: number; suffix?: string }) {
  const total = casa + fora || 1;
  const pctCasa = Math.round((casa / total) * 100);
  const s = suffix || "";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${casa > fora ? "text-emerald-300" : casa < fora ? "text-slate-400" : "text-slate-300"}`}>{casa}{s}</span>
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        <span className={`text-xs font-bold ${fora > casa ? "text-emerald-300" : fora < casa ? "text-slate-400" : "text-slate-300"}`}>{fora}{s}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-700/50">
        <div className="bg-emerald-400/80 transition-all duration-500 rounded-full" style={{ width: `${pctCasa}%` }} />
        <div className="bg-rose-400/60 transition-all duration-500 rounded-full" style={{ width: `${100 - pctCasa}%` }} />
      </div>
    </div>
  );
}

/* ─── Evento na timeline ─── */
function EventoItem({ ev }: { ev: EventoCompleto }) {
  const isGol = ev.tipo === "Goal";
  const isCard = ev.tipo === "Card";
  const isSub = ev.tipo === "Substitution" || ev.tipo === "subst";

  return (
    <div className={`flex items-start gap-2 py-1.5 ${ev.ehCasa ? "" : "flex-row-reverse text-right"}`}>
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-[11px] font-bold text-slate-400">{ev.minuto}'</span>
        {ev.timeLogo && <img src={ev.timeLogo} alt="" className="mt-0.5 h-4 w-4 object-contain" loading="lazy" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {isGol && <span className="text-sm">⚽</span>}
          {isCard && <span className={`inline-block h-3 w-2 rounded-[1px] ${ev.detalhe.includes("vermelho") || ev.detalhe.includes("Red") ? "bg-red-500" : "bg-amber-400"}`} />}
          {isSub && <span className="text-sm">🔄</span>}
          <span className={`text-xs font-bold ${isGol ? "text-emerald-300" : "text-slate-200"}`}>
            {ev.detalhe}
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          {ev.jogador}
          {ev.assistencia && <span className="text-slate-500"> (ass. {ev.assistencia})</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Carimbo de equipe ─── */
function CarimboEquipe({ texto }: { texto: string }) {
  const danger = /crise|frágil|apagado|indisciplinado/i.test(texto);
  const strong = /matador|sólida|preciso|domínio|intensa/i.test(texto);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
      danger ? "bg-red-500/15 text-red-300 border border-red-500/25"
        : strong ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
        : "bg-slate-500/15 text-slate-400 border border-slate-500/25"
    }`}>
      {texto}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MatchFocusPanel — Aceita AMBOS os formatos:
   1) { match: MatchSummary } (novo)
   2) { fixture, radar, oportunidades } (legado)
   ═══════════════════════════════════════════════════════════════ */
export default function MatchFocusPanel(props: {
  match?: MatchSummary | null;
  fixture?: any;
  radar?: any[];
  oportunidades?: any[];
  className?: string;
  compact?: boolean;
}) {
  const { className = "" } = props;
  const [tab, setTab] = useState<"stats" | "eventos" | "oportunidades">("stats");

  const match = props.match;
  const hasData = !!match || !!props.fixture;

  if (!hasData) {
    return (
      <div className={`flex h-64 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0f1923] p-6 ${className}`}>
        <div className="text-center text-slate-500">
          <Activity className="mx-auto mb-3 h-8 w-8" />
          <p className="text-sm font-medium">Selecione um jogo para ver os detalhes</p>
        </div>
      </div>
    );
  }

  if (match) {
    return <MatchFocusPanelInner match={match} tab={tab} setTab={setTab} className={className} />;
  }

  // Legado: fixture raw
  const fx = props.fixture;
  const homeName = fx?.teams?.home?.name || "Casa";
  const awayName = fx?.teams?.away?.name || "Fora";
  const homeLogo = fx?.teams?.home?.logo;
  const awayLogo = fx?.teams?.away?.logo;
  const scoreH = fx?.goals?.home ?? 0;
  const scoreA = fx?.goals?.away ?? 0;
  const minute = fx?.fixture?.status?.elapsed ?? 0;

  return (
    <div className={`overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1923] ${className}`}>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-1.5 w-[90px]">
            {homeLogo && <img src={homeLogo} alt="" className="h-10 w-10 object-contain" />}
            <span className="text-center text-xs font-bold text-white">{homeName}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{scoreH}</span>
              <span className="text-lg text-slate-600">-</span>
              <span className="text-3xl font-black text-white">{scoreA}</span>
            </div>
            <span className="text-xs font-bold text-red-400">{minute}'</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 w-[90px]">
            {awayLogo && <img src={awayLogo} alt="" className="h-10 w-10 object-contain" />}
            <span className="text-center text-xs font-bold text-white">{awayName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Inner panel com MatchSummary ─── */
function MatchFocusPanelInner({
  match,
  tab,
  setTab,
  className,
}: {
  match: MatchSummary;
  tab: "stats" | "eventos" | "oportunidades";
  setTab: (t: "stats" | "eventos" | "oportunidades") => void;
  className: string;
}) {
  const call = getCall(match);
  const ev = match.eventosResumo;
  const st = match.estatisticasResumo;
  const live = isLive(match.status, match.minute);
  const totalGols = (match.homeScore ?? 0) + (match.awayScore ?? 0);

  return (
    <div className={`overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f1923] ${className}`}>
      {/* Header: Liga + Rodada + País */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2">
        {match.countryFlag && <img src={match.countryFlag} alt="" className="h-3 w-5 rounded-sm object-cover" loading="lazy" />}
        {match.leagueLogo && <img src={match.leagueLogo} alt="" className="h-4 w-4 rounded object-contain" loading="lazy" />}
        <span className="text-xs font-semibold text-slate-300">{match.league}</span>
        {match.leagueRound && <span className="text-[11px] text-slate-500">• {match.leagueRound}</span>}
        {live && <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-red-400"><span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Ao vivo</span>}
      </div>

      {/* Placar central com logos */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-1.5 w-[90px]">
            {match.homeTeam?.logo ? (
              <img src={match.homeTeam.logo} alt="" className="h-12 w-12 object-contain" loading="lazy" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-600" />
            )}
            <span className="text-center text-xs font-bold text-white leading-tight">{match.homeTeam?.name || "Casa"}</span>
            <CarimboEquipe texto={match.carimboCasa || "📊 Equilibrado"} />
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{match.homeScore ?? 0}</span>
              <span className="text-xl text-slate-600">-</span>
              <span className="text-4xl font-black text-white">{match.awayScore ?? 0}</span>
            </div>
            {live && <span className="mt-1 text-sm font-bold text-red-400">{statusLegivel(match.status, match.minute)}</span>}
            {!live && <span className="mt-1 text-xs text-slate-500">{statusLegivel(match.status, match.minute)}</span>}
            {totalGols >= 3 && <span className="mt-1 text-xs font-bold text-amber-300">🔥 {totalGols} gols</span>}
          </div>

          <div className="flex flex-col items-center gap-1.5 w-[90px]">
            {match.awayTeam?.logo ? (
              <img src={match.awayTeam.logo} alt="" className="h-12 w-12 object-contain" loading="lazy" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-slate-600" />
            )}
            <span className="text-center text-xs font-bold text-white leading-tight">{match.awayTeam?.name || "Fora"}</span>
            <CarimboEquipe texto={match.carimboFora || "📊 Equilibrado"} />
          </div>
        </div>

        {/* Mapa de calor */}
        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-800/50 px-3 py-2">
          <Thermometer className="h-4 w-4 text-slate-400" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Temperatura do jogo</span>
              <span className="font-bold text-slate-200">{labelMapaCalor(match.mapaCalor)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700/60">
              <div className={`h-full rounded-full bg-gradient-to-r ${corMapaCalor(match.mapaCalor)} transition-all duration-700`} style={{ width: `${match.mapaCalor}%` }} />
            </div>
          </div>
          <span className="text-base font-black text-slate-200">{match.mapaCalor}°</span>
        </div>

        {/* Forma recente */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="mr-1.5 text-[10px] font-medium text-slate-500">Forma:</span>
            {match.formaCasa.map((v, i) => (
              <span key={i} className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold border ${formaLabel(v)}`} title={formaTexto(v)}>{v}</span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {match.formaFora.map((v, i) => (
              <span key={i} className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold border ${formaLabel(v)}`} title={formaTexto(v)}>{v}</span>
            ))}
            <span className="ml-1.5 text-[10px] font-medium text-slate-500">:Forma</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-y border-white/[0.06]">
        {(["stats", "eventos", "oportunidades"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === t ? "border-b-2 border-emerald-400 text-emerald-300 bg-emerald-500/5" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t === "stats" ? "📊 Estatísticas" : t === "eventos" ? "⚡ Eventos" : "🎯 Oportunidades"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-[420px] overflow-y-auto px-4 py-3">
        {tab === "stats" && (
          <div className="space-y-3">
            <StatBar label="Posse de bola" casa={st.posseCasa} fora={st.posseFora} suffix="%" />
            <StatBar label="Chutes ao gol" casa={st.chutesGolCasa} fora={st.chutesGolFora} />
            <StatBar label="Chutes totais" casa={st.chutesTotaisCasa} fora={st.chutesTotaisFora} />
            <StatBar label="Escanteios" casa={st.escanteiosCasa} fora={st.escanteiosFora} />
            <StatBar label="Ataques perigosos" casa={st.ataquesCasa} fora={st.ataquesFora} />
            <StatBar label="Faltas" casa={st.falhasCasa} fora={st.falhasFora} />
            <StatBar label="Impedimentos" casa={st.impedimentosCasa} fora={st.impedimentosFora} />
            <StatBar label="Passes certos" casa={st.passesPreCasa} fora={st.passesPreFora} />
            <StatBar label="Passes totais" casa={st.passesTotaisCasa} fora={st.passesTotaisFora} />
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-2 rounded-[1px] bg-amber-400" />
                <span className="text-xs font-bold text-amber-300">{ev.amarelosCasa}</span>
                {ev.vermelhosCasa > 0 && <>
                  <span className="inline-block h-3 w-2 rounded-[1px] bg-red-500 ml-1" />
                  <span className="text-xs font-bold text-red-300">{ev.vermelhosCasa}</span>
                </>}
              </div>
              <span className="text-[11px] font-medium text-slate-400">Cartões</span>
              <div className="flex items-center gap-1.5">
                {ev.vermelhosFora > 0 && <>
                  <span className="text-xs font-bold text-red-300">{ev.vermelhosFora}</span>
                  <span className="inline-block h-3 w-2 rounded-[1px] bg-red-500 mr-1" />
                </>}
                <span className="text-xs font-bold text-amber-300">{ev.amarelosFora}</span>
                <span className="inline-block h-3 w-2 rounded-[1px] bg-amber-400" />
              </div>
            </div>
          </div>
        )}

        {tab === "eventos" && (
          <div className="space-y-1">
            {ev.eventosCompletos.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Nenhum evento registrado ainda</p>
            ) : (
              ev.eventosCompletos.map((evento, i) => <EventoItem key={i} ev={evento} />)
            )}
          </div>
        )}

        {tab === "oportunidades" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-200">{call.call}</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{call.motivo}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  call.confidence >= 85 ? "bg-emerald-500/20 text-emerald-300"
                    : call.confidence >= 70 ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-500/20 text-slate-300"
                }`}>Confiança {call.confidence}%</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  call.risk === "baixo" ? "bg-emerald-500/15 text-emerald-300"
                    : call.risk === "alto" ? "bg-red-500/15 text-red-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}>Risco {call.risk}</span>
                {call.ev > 0 && <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[11px] font-bold text-cyan-300">EV {call.ev}</span>}
              </div>
              {call.janela && (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1">
                  <Clock className="h-3 w-3 text-red-400" />
                  <span className="text-xs font-bold text-red-300">{call.janela}</span>
                </div>
              )}
            </div>

            {match.oportunidadesResumo.slice(1).map((op, i) => (
              <div key={i} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{op.titulo}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    (op.confianca ?? 0) >= 80 ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"
                  }`}>{op.confianca}%</span>
                </div>
                {op.ev && op.ev > 0 && <span className="text-[10px] text-cyan-400">EV {op.ev}</span>}
              </div>
            ))}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(match.selos || []).map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/8 px-2.5 py-1 text-[11px] font-bold text-cyan-200">{s}</span>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <div className="rounded-lg bg-emerald-500/5 p-2.5">
                <span className="text-xs font-bold text-emerald-300">✅ Fortalece a call:</span>
                <ul className="mt-1 space-y-0.5">
                  {totalGols >= 2 && <li className="text-[11px] text-slate-400">• Jogo com {totalGols} gols — ritmo ofensivo</li>}
                  {st.chutesGolCasa + st.chutesGolFora >= 4 && <li className="text-[11px] text-slate-400">• {st.chutesGolCasa + st.chutesGolFora} chutes ao gol — pressão real</li>}
                  {st.escanteiosCasa + st.escanteiosFora >= 5 && <li className="text-[11px] text-slate-400">• {st.escanteiosCasa + st.escanteiosFora} escanteios — bolas na área</li>}
                  {(st.posseCasa >= 60 || st.posseFora >= 60) && <li className="text-[11px] text-slate-400">• Domínio de posse — time pressionando</li>}
                </ul>
              </div>
              <div className="rounded-lg bg-red-500/5 p-2.5">
                <span className="text-xs font-bold text-red-300">⚠️ Enfraquece a call:</span>
                <ul className="mt-1 space-y-0.5">
                  {st.chutesGolCasa + st.chutesGolFora < 2 && <li className="text-[11px] text-slate-400">• Poucos chutes ao gol — jogo travado</li>}
                  {ev.vermelhosCasa + ev.vermelhosFora > 0 && <li className="text-[11px] text-slate-400">• Cartão vermelho — jogo pode fechar</li>}
                  {match.minute && match.minute >= 80 && totalGols === 0 && <li className="text-[11px] text-slate-400">• Final de jogo sem gols — tendência de 0x0</li>}
                  {st.falhasCasa + st.falhasFora >= 20 && <li className="text-[11px] text-slate-400">• Muitas faltas — jogo truncado</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {match.stadium && (
        <div className="border-t border-white/[0.05] px-4 py-1.5">
          <span className="text-[10px] text-slate-500">📍 {match.stadium}</span>
        </div>
      )}
    </div>
  );
}
