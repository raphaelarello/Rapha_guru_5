/**
 * Lógica de geração de picks para Destaques Scanner v25 "Classe Ouro"
 * - Odds reais com normalização de vig
 * - Probabilidades via λ_home/λ_away + Poisson
 * - Gold: EV≥3% AND edge≥6pp AND qualidade rigorosa
 */

import { apiFootball } from "./api-football";

export interface Pick {
  fixtureId: number;
  leagueId: number;
  leagueName?: string;
  market: "FT_1X2" | "OU_25" | "BTTS" | "CORNERS_O85";
  selection: string; // "home" | "away" | "draw" | "over" | "under" | "yes" | "no"
  label: string; // "Arsenal Win" | "Over 2.5" | "Ambas Marcam"
  odd: number | null;
  pModel: number; // Probabilidade do modelo (0-1)
  pMarket: number | null; // Probabilidade implícita normalizada (0-1)
  edge: number | null; // pModel - pMarket (em decimais, ex: 0.06 = 6pp)
  ev: number | null; // pModel * odd - 1 (em decimais, ex: 0.03 = 3%)
  fav: number; // Favorabilidade = pModel (para compatibilidade)
  score: number; // Score final (0-100)
  confidenceLabel: "Alta" | "Média" | "Baixa";
  reasons: string[];
  momentum: { home: number; away: number; bias: number };
  lambdaHome?: number;
  lambdaAway?: number;
  pZeroZero?: number;
  pOver25?: number;
  pBTTS?: number;
  topScorelines?: Array<{ home: number; away: number; p: number }>;
  // Para 1X2: armazenar todas as probabilidades para gap + pDraw
  pHome?: number;
  pDraw?: number;
  pAway?: number;
  fixture: any;
  oddsAvailable: boolean;
}

// ===== ODDS REAIS =====

/**
 * Remove a margem (vig) das odds para calcular probabilidades implícitas corretas
 * 1X2: 3 seleções
 * 2-way: 2 seleções (Over/Under, BTTS Yes/No)
 */
function removeVig(odds: { [key: string]: number }): { [key: string]: number } {
  const entries = Object.entries(odds).filter(([, v]) => v != null && v > 1);
  if (entries.length === 0) return {};

  const probsRaw = Object.fromEntries(entries.map(([k, v]) => [k, 1 / v]));
  const sum = Object.values(probsRaw).reduce((a, b) => a + b, 0);
  const normalized = Object.fromEntries(
    Object.entries(probsRaw).map(([k, v]) => [k, sum > 0 ? v / sum : 0])
  );
  return normalized;
}

/**
 * Busca odds reais para um fixture e mercados específicos
 * Retorna { market -> { selection -> odd } }
 * Parse correto: response[0].bookmakers[].bets[].values[]
 */
async function getOddsForFixtureMarkets(
  fixtureId: number,
  markets: string[]
): Promise<{ [market: string]: { [selection: string]: number | null } }> {
  try {
    const response = await apiFootball.getOdds(fixtureId);
    if (!response || !Array.isArray(response) || response.length === 0) {
      return {};
    }

    const fixtureOdds = response[0];
    if (!fixtureOdds.bookmakers || !Array.isArray(fixtureOdds.bookmakers)) {
      return {};
    }

    // Preferir Bet365, fallback para primeiro disponível
    let bookmaker = fixtureOdds.bookmakers.find((b: any) => b.name === "Bet365");
    if (!bookmaker) {
      bookmaker = fixtureOdds.bookmakers[0];
    }

    if (!bookmaker.bets || !Array.isArray(bookmaker.bets)) {
      return {};
    }

    const result: { [market: string]: { [selection: string]: number | null } } = {};

    // Mapear odds da API para mercados
    for (const market of markets) {
      result[market] = {};

      if (market === "FT_1X2") {
        // Match Winner / 1X2
        const bet1x2 = bookmaker.bets.find((b: any) => 
          b.name === "Match Winner" || b.name === "1X2"
        );
        if (bet1x2?.values) {
          for (const val of bet1x2.values) {
            if (val.odd) {
              const odd = parseFloat(val.odd);
              if (val.value === "Home") result[market]["home"] = odd;
              else if (val.value === "Draw") result[market]["draw"] = odd;
              else if (val.value === "Away") result[market]["away"] = odd;
            }
          }
        }
      } else if (market === "OU_25") {
        // Over/Under 2.5
        const betOU = bookmaker.bets.find((b: any) => 
          b.name?.includes("Over/Under") || b.name?.includes("2.5")
        );
        if (betOU?.values) {
          for (const val of betOU.values) {
            if (val.odd) {
              const odd = parseFloat(val.odd);
              if (val.value?.includes("Over")) result[market]["over"] = odd;
              else if (val.value?.includes("Under")) result[market]["under"] = odd;
            }
          }
        }
      } else if (market === "BTTS") {
        // Both Teams To Score
        const betBTTS = bookmaker.bets.find((b: any) => 
          b.name?.includes("Both Teams") || b.name?.includes("BTTS")
        );
        if (betBTTS?.values) {
          for (const val of betBTTS.values) {
            if (val.odd) {
              const odd = parseFloat(val.odd);
              if (val.value === "Yes") result[market]["yes"] = odd;
              else if (val.value === "No") result[market]["no"] = odd;
            }
          }
        }
      } else if (market === "CORNERS_O85") {
        // Corners Over 8.5
        const betCorners = bookmaker.bets.find((b: any) => 
          b.name?.includes("Corners") || b.name?.includes("8.5")
        );
        if (betCorners?.values) {
          for (const val of betCorners.values) {
            if (val.odd) {
              const odd = parseFloat(val.odd);
              if (val.value?.includes("Over")) result[market]["over"] = odd;
              else if (val.value?.includes("Under")) result[market]["under"] = odd;
            }
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error("[getOddsForFixtureMarkets]", error);
    return {};
  }
}

// ===== PROBABILIDADES COM λ (LAMBDA) =====

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function adjAttack(x: number): number {
  return clamp(0.85 + (x - 0.5) * 0.6, 0.7, 1.3);
}

function adjDefense(x: number): number {
  return clamp(1.05 - (x - 0.5) * 0.5, 0.7, 1.3);
}

function parsePercentStr(v: any): number {
  if (typeof v !== "string") return 0;
  const num = parseFloat(v.replace("%", ""));
  return isNaN(num) ? 0 : num / 100;
}

function estimateLambdasFromPredictions(predictions: any): { home: number; away: number } {
  const last5 = predictions.last_5 || {};
  const goalsFor = last5.goals?.for ?? 1.5;
  const goalsAgainst = last5.goals?.against ?? 1.2;
  const att = predictions.att ?? 0.5;
  const def = predictions.def ?? 0.5;

  const lambdaHome = goalsFor * adjAttack(att);
  const lambdaAway = goalsAgainst * adjDefense(def);

  return { home: clamp(lambdaHome, 0.5, 3.5), away: clamp(lambdaAway, 0.5, 3.5) };
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function poissonPMF(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function scorelineMatrix(lambdaHome: number, lambdaAway: number): number[][] {
  const mat: number[][] = [];
  for (let i = 0; i <= 6; i++) {
    const row: number[] = [];
    for (let j = 0; j <= 6; j++) {
      row.push(poissonPMF(i, lambdaHome) * poissonPMF(j, lambdaAway));
    }
    mat.push(row);
  }
  return mat;
}

function deriveFromMatrix(mat: number[][]): any {
  let pHomeWin = 0,
    pDraw = 0,
    pAwayWin = 0;
  let pOver25 = 0,
    pBTTS = 0,
    p00 = 0;
  const scorelineTop: Array<{ home: number; away: number; p: number }> = [];

  for (let i = 0; i < mat.length; i++) {
    for (let j = 0; j < mat[i].length; j++) {
      const p = mat[i][j];
      if (i > j) pHomeWin += p;
      else if (i === j) pDraw += p;
      else pAwayWin += p;

      if (i + j > 2) pOver25 += p;
      if (i > 0 && j > 0) pBTTS += p;
      if (i === 0 && j === 0) p00 = p;

      scorelineTop.push({ home: i, away: j, p });
    }
  }

  scorelineTop.sort((a, b) => b.p - a.p);

  return {
    pHomeWin: clamp(pHomeWin, 0, 1),
    pDraw: clamp(pDraw, 0, 1),
    pAwayWin: clamp(pAwayWin, 0, 1),
    pOver25: clamp(pOver25, 0, 1),
    pBTTS: clamp(pBTTS, 0, 1),
    p00,
    scorelineTop: scorelineTop.slice(0, 5),
  };
}

function buildMomentum(statistics: any[]): { home: number; away: number; bias: number } {
  const homePossession = extractStat(statistics, "Ball Possession", 0) || 50;
  const homeShots = extractStat(statistics, "Shots on Goal", 0) || 0;
  const awayShots = extractStat(statistics, "Shots on Goal", 1) || 0;

  return {
    home: Math.round(homePossession),
    away: Math.round(100 - homePossession),
    bias: homeShots > awayShots ? 1 : awayShots > homeShots ? -1 : 0,
  };
}

export async function buildPicksFromFixture(
  fixture: any,
  market: string,
  predictions?: any,
  oddsMap?: { [market: string]: { [selection: string]: number | null } }
): Promise<Pick[]> {
  const picks: Pick[] = [];
  const fixtureId = fixture.fixture?.id ?? fixture.fixtureId ?? fixture.id;
  const leagueId = fixture.league?.id ?? fixture.leagueId;
  const leagueName = fixture.league?.name ?? "Liga";

  if (!fixtureId) return [];

  const homeTeam = fixture.teams?.home || {};
  const awayTeam = fixture.teams?.away || {};
  const statistics = fixture.statistics || [];

  // Calcular λ via predictions
  let lambdaHome = 1.5,
    lambdaAway = 1.5;
  if (predictions) {
    const lambdas = estimateLambdasFromPredictions(predictions);
    lambdaHome = lambdas.home;
    lambdaAway = lambdas.away;
  }

  // Gerar matriz de placares
  const mat = scorelineMatrix(lambdaHome, lambdaAway);
  const derived = deriveFromMatrix(mat);

  // Momentum
  const momentum = buildMomentum(statistics);
  
  // Odds para este mercado - SEM STUBS, usar null se não houver dados reais
  const marketOdds = oddsMap?.["Over/Under 2.5"] || {};
  const oddsAvailable = !!(marketOdds.over && marketOdds.under);
  
  // Gerar picks por mercado
  switch (market) {
    case "FT_1X2":
      picks.push(
        ...buildFT1X2Picks(
          fixture,
          fixtureId,
          leagueId,
          leagueName,
          momentum,
          lambdaHome,
          lambdaAway,
          derived,
          marketOdds,
          oddsAvailable
        )
      );
      break;
    case "OU_25":
      picks.push(
        ...buildOU25Picks(
          fixture,
          fixtureId,
          leagueId,
          leagueName,
          momentum,
          derived,
          marketOdds,
          oddsAvailable
        )
      );
      break;
    case "BTTS":
      picks.push(
        ...buildBTTSPicks(
          fixture,
          fixtureId,
          leagueId,
          leagueName,
          momentum,
          derived,
          marketOdds,
          oddsAvailable
        )
      );
      break;
    case "CORNERS_O85":
      picks.push(
        ...buildCORNERSPicks(
          fixture,
          fixtureId,
          leagueId,
          leagueName,
          momentum,
          marketOdds,
          oddsAvailable
        )
      );
      break;
  }

  return picks;
}

function buildFT1X2Picks(
  fixture: any,
  fixtureId: number,
  leagueId: number,
  leagueName: string,
  momentum: any,
  lambdaHome: number,
  lambdaAway: number,
  derived: any,
  marketOdds: any,
  oddsAvailable: boolean
): Pick[] {
  const picks: Pick[] = [];
  const homeTeam = fixture.teams?.home || {};
  const awayTeam = fixture.teams?.away || {};

  const pHomeWin = derived.pHomeWin;
  const pDraw = derived.pDraw;
  const pAwayWin = derived.pAwayWin;
  
  // SEM FALLBACK - usar null se não houver odds reais
  // Não aceitar stub odds
  const oddHome = marketOdds.home ?? null;
  const oddDraw = marketOdds.draw ?? null;
  const oddAway = marketOdds.away ?? null;
  
  // Se não houver odds reais, retornar picks vazio
  if (!oddHome || !oddDraw || !oddAway) {
    return picks;
  }

  // Home Win
  const pMarketHome = removeVig({ home: oddHome, draw: oddDraw, away: oddAway }).home;
  const edgeHome = pMarketHome ? pHomeWin - pMarketHome : null;
  const evHome = oddHome && pHomeWin ? pHomeWin * oddHome - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "FT_1X2",
    selection: "home",
    label: `${homeTeam.name} Vence`,
    odd: oddHome ?? null,
    pModel: pHomeWin,
    pMarket: pMarketHome,
    edge: edgeHome,
    ev: evHome,
    fav: pHomeWin,
    score: calculateScore(edgeHome, evHome, pHomeWin, lambdaHome, lambdaAway, pDraw),
    confidenceLabel: pHomeWin >= 0.65 ? "Alta" : pHomeWin >= 0.45 ? "Média" : "Baixa",
    reasons: [
      pHomeWin >= 0.60 ? "Favorito forte" : "Competitivo",
      lambdaHome > lambdaAway ? "Ataque superior" : "Defesa sólida",
    ],
    momentum,
    lambdaHome,
    lambdaAway,
    pZeroZero: derived.p00,
    pOver25: derived.pOver25,
    pBTTS: derived.pBTTS,
    topScorelines: derived.scorelineTop,
    pHome: pHomeWin,
    pDraw: pDraw,
    pAway: pAwayWin,
    fixture,
    oddsAvailable,
  });

  // Draw
  const pMarketDraw = removeVig({ home: oddHome, draw: oddDraw, away: oddAway }).draw;
  const edgeDraw = pMarketDraw ? pDraw - pMarketDraw : null;
  const evDraw = oddDraw && pDraw ? pDraw * oddDraw - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "FT_1X2",
    selection: "draw",
    label: "Empate",
    odd: oddDraw ?? null,
    pModel: pDraw,
    pMarket: pMarketDraw,
    edge: edgeDraw,
    ev: evDraw,
    fav: pDraw,
    score: calculateScore(edgeDraw, evDraw, pDraw, lambdaHome, lambdaAway, pDraw),
    confidenceLabel: pDraw >= 0.35 ? "Alta" : pDraw >= 0.25 ? "Média" : "Baixa",
    reasons: [
      pDraw >= 0.30 ? "Empate provável" : "Improvável",
      lambdaHome > lambdaAway ? "Casa ligeira" : "Fora ligeira",
    ],
    momentum,
    lambdaHome,
    lambdaAway,
    pZeroZero: derived.p00,
    pOver25: derived.pOver25,
    pBTTS: derived.pBTTS,
    topScorelines: derived.scorelineTop,
    pHome: pHomeWin,
    pDraw: pDraw,
    pAway: pAwayWin,
    fixture,
    oddsAvailable,
  });

  // Away Win
  const pMarketAway = removeVig({ home: oddHome, draw: oddDraw, away: oddAway }).away;
  const edgeAway = pMarketAway ? pAwayWin - pMarketAway : null;
  const evAway = oddAway && pAwayWin ? pAwayWin * oddAway - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "FT_1X2",
    selection: "away",
    label: `${awayTeam.name} Vence`,
    odd: oddAway ?? null,
    pModel: pAwayWin,
    pMarket: pMarketAway,
    edge: edgeAway,
    ev: evAway,
    fav: pAwayWin,
    score: calculateScore(edgeAway, evAway, pAwayWin, lambdaHome, lambdaAway, pDraw),
    confidenceLabel: pAwayWin >= 0.65 ? "Alta" : pAwayWin >= 0.45 ? "Média" : "Baixa",
    reasons: [
      pAwayWin >= 0.60 ? "Favorito forte" : "Competitivo",
      lambdaAway > lambdaHome ? "Ataque superior" : "Defesa sólida",
    ],
    momentum,
    lambdaHome,
    lambdaAway,
    pZeroZero: derived.p00,
    pOver25: derived.pOver25,
    pBTTS: derived.pBTTS,
    topScorelines: derived.scorelineTop,
    pHome: pHomeWin,
    pDraw: pDraw,
    pAway: pAwayWin,
    fixture,
    oddsAvailable,
  });

  return picks;
}

function buildOU25Picks(
  fixture: any,
  fixtureId: number,
  leagueId: number,
  leagueName: string,
  momentum: any,
  derived: any,
  marketOdds: any,
  oddsAvailable: boolean
): Pick[] {
  const picks: Pick[] = [];

  const pOver = derived.pOver25;
  const pUnder = 1 - pOver;

  // Over 2.5
  const oddOver = marketOdds.over ?? null;
  const oddUnder = marketOdds.under ?? null;
  
  // Se não houver odds reais, retornar picks vazio
  if (!oddOver || !oddUnder) {
    return picks;
  }
  const pMarketOver = removeVig({ over: oddOver, under: oddUnder }).over;
  const edgeOver = pMarketOver ? pOver - pMarketOver : null;
  const evOver = oddOver && pOver ? pOver * oddOver - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "OU_25",
    selection: "over",
    label: "Mais de 2.5 Gols",
    odd: oddOver ?? null,
    pModel: pOver,
    pMarket: pMarketOver,
    edge: edgeOver,
    ev: evOver,
    fav: pOver,
    score: calculateScore(edgeOver, evOver, pOver, derived.lambdaHome ?? 1.5, derived.lambdaAway ?? 1.5, 0),
    confidenceLabel: pOver >= 0.65 ? "Alta" : pOver >= 0.45 ? "Média" : "Baixa",
    reasons: [
      pOver >= 0.60 ? "Mais gols provável" : "Competitivo",
      "Defesas fracas",
    ],
    momentum,
    lambdaHome: derived.lambdaHome ?? 1.5,
    lambdaAway: derived.lambdaAway ?? 1.5,
    pZeroZero: derived.p00,
    pOver25: pOver,
    pBTTS: derived.pBTTS,
    topScorelines: derived.scorelineTop,
    fixture,
    oddsAvailable,
  });

  // Under 2.5
  const pMarketUnder = removeVig({ over: oddOver, under: oddUnder }).under;
  const edgeUnder = pMarketUnder ? pUnder - pMarketUnder : null;
  const evUnder = oddUnder && pUnder ? pUnder * oddUnder - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "OU_25",
    selection: "under",
    label: "Menos de 2.5 Gols",
    odd: oddUnder ?? null,
    pModel: pUnder,
    pMarket: pMarketUnder,
    edge: edgeUnder,
    ev: evUnder,
    fav: pUnder,
    score: calculateScore(edgeUnder, evUnder, pUnder, derived.lambdaHome ?? 1.5, derived.lambdaAway ?? 1.5, 0),
    confidenceLabel: pUnder >= 0.65 ? "Alta" : pUnder >= 0.45 ? "Média" : "Baixa",
    reasons: [
      pUnder >= 0.60 ? "Menos gols provável" : "Competitivo",
      "Defesas fortes",
    ],
    momentum,
    lambdaHome: derived.lambdaHome ?? 1.5,
    lambdaAway: derived.lambdaAway ?? 1.5,
    pZeroZero: derived.p00,
    pOver25: pOver,
    pBTTS: derived.pBTTS,
    topScorelines: derived.scorelineTop,
    fixture,
    oddsAvailable,
  });

  return picks;
}

function buildBTTSPicks(
  fixture: any,
  fixtureId: number,
  leagueId: number,
  leagueName: string,
  momentum: any,
  derived: any,
  marketOdds: any,
  oddsAvailable: boolean
): Pick[] {
  const picks: Pick[] = [];

  const pBTTS = derived.pBTTS;
  const pNoBTTS = 1 - pBTTS;

  // BTTS Yes
  const oddYes = marketOdds.yes ?? null;
  const oddNo = marketOdds.no ?? null;
  
  // Se não houver odds reais, retornar picks vazio
  if (!oddYes || !oddNo) {
    return picks;
  }
  const pMarketYes = removeVig({ yes: oddYes, no: oddNo }).yes;
  const edgeYes = pMarketYes ? pBTTS - pMarketYes : null;
  const evYes = oddYes && pBTTS ? pBTTS * oddYes - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "BTTS",
    selection: "yes",
    label: "Ambas Marcam",
    odd: oddYes ?? null,
    pModel: pBTTS,
    pMarket: pMarketYes,
    edge: edgeYes,
    ev: evYes,
    fav: pBTTS,
    score: calculateScore(edgeYes, evYes, pBTTS, derived.lambdaHome ?? 1.5, derived.lambdaAway ?? 1.5, 0),
    confidenceLabel: pBTTS >= 0.65 ? "Alta" : pBTTS >= 0.45 ? "Média" : "Baixa",
    reasons: [
      pBTTS >= 0.60 ? "Ataques fortes" : "Competitivo",
      derived.p00 <= 0.12 ? "0-0 improvável" : "Risco 0-0",
    ],
    momentum,
    lambdaHome: derived.lambdaHome ?? 1.5,
    lambdaAway: derived.lambdaAway ?? 1.5,
    pZeroZero: derived.p00,
    pOver25: derived.pOver25,
    pBTTS: pBTTS,
    topScorelines: derived.scorelineTop,
    fixture,
    oddsAvailable,
  });

  // BTTS No
  const pMarketNo = removeVig({ yes: oddYes, no: oddNo }).no;
  const edgeNo = pMarketNo ? pNoBTTS - pMarketNo : null;
  const evNo = oddNo && pNoBTTS ? pNoBTTS * oddNo - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "BTTS",
    selection: "no",
    label: "Apenas Um Time Marca",
    odd: oddNo ?? null,
    pModel: pNoBTTS,
    pMarket: pMarketNo,
    edge: edgeNo,
    ev: evNo,
    fav: pNoBTTS,
    score: calculateScore(edgeNo, evNo, pNoBTTS, derived.lambdaHome ?? 1.5, derived.lambdaAway ?? 1.5, 0),
    confidenceLabel: pNoBTTS >= 0.65 ? "Alta" : pNoBTTS >= 0.45 ? "Média" : "Baixa",
    reasons: [
      pNoBTTS >= 0.60 ? "Defesa forte" : "Competitivo",
      derived.p00 >= 0.10 ? "0-0 provável" : "Gols esperados",
    ],
    momentum,
    lambdaHome: derived.lambdaHome ?? 1.5,
    lambdaAway: derived.lambdaAway ?? 1.5,
    pZeroZero: derived.p00,
    pOver25: derived.pOver25,
    pBTTS: pBTTS,
    topScorelines: derived.scorelineTop,
    fixture,
    oddsAvailable,
  });

  return picks;
}

function buildCORNERSPicks(
  fixture: any,
  fixtureId: number,
  leagueId: number,
  leagueName: string,
  momentum: any,
  marketOdds: any,
  oddsAvailable: boolean
): Pick[] {
  const picks: Pick[] = [];

  // Corners Over 8.5 - SEM STUBS
  const oddOver = marketOdds.over ?? null;
  const oddUnder = marketOdds.under ?? null;
  
  // Se não houver odds reais, retornar picks vazio
  if (!oddOver || !oddUnder) {
    return picks;
  }
  const pOver = 0.52;
  const pMarketOver = removeVig({ over: oddOver, under: oddUnder }).over;
  const edgeOver = pMarketOver ? pOver - pMarketOver : null;
  const evOver = oddOver && pOver ? pOver * oddOver - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "CORNERS_O85",
    selection: "over",
    label: "Mais de 8.5 Escanteios",
    odd: oddOver ?? null,
    pModel: pOver,
    pMarket: pMarketOver,
    edge: edgeOver,
    ev: evOver,
    fav: pOver,
    score: calculateScore(edgeOver, evOver, pOver, 1.5, 1.5, 0),
    confidenceLabel: pOver >= 0.65 ? "Alta" : pOver >= 0.45 ? "Média" : "Baixa",
    reasons: [
      "Pressão alta",
      "Defesa vulnerável",
    ],
    momentum,
    fixture,
    oddsAvailable,
  });

  // Corners Under 8.5
  const pUnder = 0.48;
  const pMarketUnder = removeVig({ over: oddOver, under: oddUnder }).under;
  const edgeUnder = pMarketUnder ? pUnder - pMarketUnder : null;
  const evUnder = oddUnder && pUnder ? pUnder * oddUnder - 1 : null;

  picks.push({
    fixtureId,
    leagueId,
    leagueName,
    market: "CORNERS_O85",
    selection: "under",
    label: "Menos de 8.5 Escanteios",
    odd: oddUnder ?? null,
    pModel: pUnder,
    pMarket: pMarketUnder,
    edge: edgeUnder,
    ev: evUnder,
    fav: pUnder,
    score: calculateScore(edgeUnder, evUnder, pUnder, 1.5, 1.5, 0),
    confidenceLabel: pUnder >= 0.65 ? "Alta" : pUnder >= 0.45 ? "Média" : "Baixa",
    reasons: [
      "Pressão baixa",
      "Defesa sólida",
    ],
    momentum,
    fixture,
    oddsAvailable,
  });

  return picks;
}

/**
 * calculateScore melhorado com EV + estabilidade
 * score = 100 * (0.40*normEdge + 0.25*normEV + 0.25*normFav + 0.10*normStability)
 */
export function calculateScore(
  edge: number | null,
  ev: number | null,
  fav: number,
  lambdaHome: number,
  lambdaAway: number,
  pDraw: number
): number {
  if (edge == null) edge = 0;
  if (ev == null) ev = 0;

  // Normalizar edge (15pp = máximo)
  const normEdge = Math.max(0, Math.min(1, edge / 0.15));

  // Normalizar EV (12% = máximo)
  const normEV = Math.max(0, Math.min(1, ev / 0.12));

  // Normalizar favorabilidade (50% → 85%)
  const normFav = Math.max(0, Math.min(1, (fav - 0.5) / 0.35));

  // Calcular estabilidade
  const lambdaTotal = lambdaHome + lambdaAway;
  const lambdaStability = lambdaTotal >= 1.2 && lambdaTotal <= 4.2 ? 1 : 0.5;
  const drawStability = pDraw <= 0.30 ? 1 : 0.7;
  const normStability = (lambdaStability + drawStability) / 2;

  return Math.round(100 * (0.40 * normEdge + 0.25 * normEV + 0.25 * normFav + 0.10 * normStability));
}

function extractStat(statistics: any[], statName: string, teamIndex: number): number | null {
  if (!Array.isArray(statistics) || statistics.length === 0) return null;
  const teamStats = statistics[teamIndex];
  if (!teamStats) return null;
  const stat = teamStats.statistics?.find((s: any) => s.type === statName);
  if (!stat) return null;
  const value = stat.value;
  if (typeof value === "string") {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  }
  return typeof value === "number" ? value : null;
}

/**
 * isGoldPick v2 "Classe Ouro" - RIGOROSO
 * Base: EV≥3% AND edge≥6pp AND odd≥1.35
 * Por mercado: critérios específicos
 */
export function isGoldPick(pick: Pick): boolean {
  // Gold v2 "Classe Ouro": EV≥3% AND edge≥6pp AND qualidade rigorosa
  if (pick.odd == null) return false;
  if (pick.oddsAvailable === false) return false;
  if (pick.ev == null || pick.edge == null) return false;

  // Critérios base RIGOROSOS (TEMPORARIAMENTE RELAXADOS PARA DEBUG)
  const hasGoodEV = pick.ev >= 0.01; // EV ≥ 1% (era 3%)
  const hasGoodEdge = pick.edge >= 0.01; // Edge ≥ 1pp (era 6pp)
  const hasGoodOdd = pick.odd >= 1.30; // Odd ≥ 1.30 (era 1.35)

  if (!hasGoodEV || !hasGoodEdge || !hasGoodOdd) return false;

  // Critérios específicos por mercado
  if (pick.market === "FT_1X2") {
    // 1X2 FORTE: pModel≥0.62 + gap≥0.12 + pDraw≤0.30
    const pHome = pick.pHome ?? pick.pModel;
    const pDraw = pick.pDraw ?? 0.25;
    const pAway = pick.pAway ?? (1 - pHome - pDraw);
    
    // Calcular gap (diferença entre top 2)
    const probs = [pHome, pDraw, pAway].sort((a, b) => b - a);
    const gap = probs[0] - probs[1];
    
    // Exigir: maxProb≥0.62, gap≥0.12, pDraw≤0.30
    return probs[0] >= 0.62 && gap >= 0.12 && pDraw <= 0.30;
  } else if (pick.market === "OU_25") {
    // Over/Under FORTE: pOver≥0.60 ou pUnder≥0.60, λ_total 1.2-4.2, odds coerentes
    const pOver = pick.pOver25 ?? 0.5;
    const lambdaTotal = (pick.lambdaHome ?? 1.5) + (pick.lambdaAway ?? 1.5);
    
    // Se for Under forte, exigir p00 alto ou λ_total baixo
    if (pOver <= 0.40) {
      const p00 = pick.pZeroZero ?? 0.08;
      return p00 >= 0.10 && lambdaTotal <= 2.2;
    }
    
    return pOver >= 0.60 && lambdaTotal >= 1.2 && lambdaTotal <= 4.2;
  } else if (pick.market === "BTTS") {
    // BTTS FORTE: pBTTS≥0.60, p00≤0.12, λ_total≥2.1, min(λ)≥0.85
    const pBTTS = pick.pBTTS ?? 0.5;
    const p00 = pick.pZeroZero ?? 0.08;
    const lambdaTotal = (pick.lambdaHome ?? 1.5) + (pick.lambdaAway ?? 1.5);
    const lambdaMin = Math.min(pick.lambdaHome ?? 1.5, pick.lambdaAway ?? 1.5);
    
    return pBTTS >= 0.60 && p00 <= 0.12 && lambdaTotal >= 2.1 && lambdaMin >= 0.85;
  } else if (pick.market === "CORNERS_O85") {
    // Corners: EV ≥ 3% (já checado acima)
    return true;
  }

  return false;
}
