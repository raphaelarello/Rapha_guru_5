/**
 * Odds Integrator - Busca odds reais e calcula edge
 * Integra com API-Football odds e calcula EV (Expected Value)
 */

import { apiFootball } from "./api-football";
import { cacheManager } from "./cache-manager";

export interface OddsData {
  market: string;
  bookmaker: string;
  odd: number;
  probability: number;
}

export interface EdgeAnalysis {
  market: string;
  modelProb: number; // Probabilidade do modelo (0-1)
  bookmakerOdd: number;
  bookmakerProb: number; // 1/odd
  edge: number; // % de vantagem
  ev: number; // Expected Value em %
  isGoldPick: boolean; // edge > 5%
  confidence: number; // 0-100
}

/**
 * Busca odds reais para um fixture
 */
export async function getOddsForFixture(fixtureId: number): Promise<OddsData[]> {
  const cacheKey = `fixture:${fixtureId}`;
  const cached = cacheManager.get("odds", cacheKey);
  if (cached) return cached;

  try {
    // Busca odds da API-Football
    const odds = await apiFootball.getOdds(fixtureId);
    
    if (!odds || !Array.isArray(odds) || odds.length === 0) {
      return generateStubOdds(fixtureId);
    }

    const formatted = (odds as any[]).map((o: any) => ({
      market: o.market,
      bookmaker: o.bookmaker,
      odd: parseFloat(o.odd),
      probability: 1 / parseFloat(o.odd),
    }));

    cacheManager.set("odds", cacheKey, formatted, 5 * 60 * 1000); // 5min cache
    return formatted;
  } catch (error) {
    console.warn(`[OddsIntegrator] Failed to fetch odds for fixture ${fixtureId}, using stubs`);
    return generateStubOdds(fixtureId);
  }
}

/**
 * Calcula edge entre probabilidade do modelo e odds do mercado
 */
export function calculateEdge(modelProb: number, bookmakerOdd: number): EdgeAnalysis {
  const bookmakerProb = 1 / bookmakerOdd;
  const edge = ((modelProb - bookmakerProb) / bookmakerProb) * 100;
  const ev = (modelProb * bookmakerOdd - 1) * 100;
  const isGoldPick = edge > 5;
  const confidence = Math.min(100, Math.abs(edge) * 10);

  return {
    market: "Over/Under 2.5",
    modelProb,
    bookmakerOdd,
    bookmakerProb,
    edge,
    ev,
    isGoldPick,
    confidence,
  };
}

/**
 * Gera odds stub para desenvolvimento (quando API não tem dados)
 */
function generateStubOdds(fixtureId: number): OddsData[] {
  const seed = fixtureId % 100;
  return [
    {
      market: "Over 2.5",
      bookmaker: "Betano",
      odd: 1.85 + (seed % 20) * 0.01,
      probability: 1 / (1.85 + (seed % 20) * 0.01),
    },
    {
      market: "Under 2.5",
      bookmaker: "Betano",
      odd: 1.95 + (seed % 15) * 0.01,
      probability: 1 / (1.95 + (seed % 15) * 0.01),
    },
    {
      market: "BTTS Yes",
      bookmaker: "Bet365",
      odd: 1.72 + (seed % 25) * 0.01,
      probability: 1 / (1.72 + (seed % 25) * 0.01),
    },
    {
      market: "BTTS No",
      bookmaker: "Bet365",
      odd: 2.15 + (seed % 20) * 0.01,
      probability: 1 / (2.15 + (seed % 20) * 0.01),
    },
  ];
}

/**
 * Busca odds para múltiplos fixtures (com batching)
 */
export async function getOddsForFixtures(fixtureIds: number[]): Promise<Map<number, OddsData[]>> {
  const results = new Map<number, OddsData[]>();
  
  // Processa em lotes de 5 para não sobrecarregar a API
  for (let i = 0; i < fixtureIds.length; i += 5) {
    const batch = fixtureIds.slice(i, i + 5);
    const promises = batch.map(id => getOddsForFixture(id).then(odds => ({ id, odds })));
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ id, odds }) => {
      results.set(id, odds);
    });

    // Delay entre lotes para respeitar rate limit
    if (i + 5 < fixtureIds.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
