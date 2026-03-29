/**
 * Analisador de Top 3 Jogos Ao Vivo - Pitacos Engine
 * Busca os 3 jogos com maior pressão real agora via API-Football v3
 */

import { calcularProjecaoJogo } from "./prediction-engine";

const API_KEY = "3d65c1d86af5cf41505092eb69471f41";
const BASE_URL = "https://v3.football.api-sports.io";

async function fetchLiveGames() {
  const response = await fetch(`${BASE_URL}/fixtures?live=all`, {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io"
    }
  });
  return response.json();
}

async function fetchMatchStats(fixtureId: number) {
  const response = await fetch(`${BASE_URL}/fixtures/statistics?fixture=${fixtureId}`, {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": "v3.football.api-sports.io"
    }
  });
  return response.json();
}

export async function analisarTop3AoVivo() {
  try {
    console.log("🔍 Buscando TOP 3 jogos com maior pressão agora...");
    const liveData = await fetchLiveGames();
    
    if (!liveData.response || liveData.response.length === 0) {
      return { status: "SEM_JOGOS", mensagem: "Não há jogos de elite acontecendo neste exato momento." };
    }

    // Processar os primeiros 10 jogos para encontrar os 3 com maior pressão
    const jogosParaAnalisar = liveData.response.slice(0, 10);
    const resultados = [];

    for (const jogo of jogosParaAnalisar) {
      const fixtureId = jogo.fixture.id;
      const statsData = await fetchMatchStats(fixtureId);
      const stats = statsData.response[0]?.statistics || [];
      
      const getStat = (type: string) => parseInt(stats.find((s: any) => s.type === type)?.value || "0");
      
      const chutesGol = getStat("Shots on Goal");
      const posse = parseInt(getStat("Ball Possession") || "50");
      const ataquesPerigosos = getStat("Dangerous Attacks") || 0;
      
      // Cálculo simplificado de Heat Score para ranking
      const heatScore = Math.min(100, (chutesGol * 15 + ataquesPerigosos * 0.8 + posse * 0.2));

      const estatisticasAtuais = {
        golsCasa: jogo.goals.home || 0,
        golsFora: jogo.goals.away || 0,
        escanteiosCasa: getStat("Corner Kicks"),
        escanteiosFora: 0,
        cartoesCasa: getStat("Yellow Cards"),
        cartoesFora: 0,
        posseCasa: posse,
        chutesGolCasa: chutesGol,
        chutesGolFora: 0
      };

      const projecao = await calcularProjecaoJogo(
        fixtureId,
        jogo.league.name,
        jogo.teams.home.name,
        jogo.teams.away.name,
        jogo.fixture.status.elapsed,
        "LIVE",
        estatisticasAtuais
      );

      resultados.push({
        liga: jogo.league.name,
        times: `${jogo.teams.home.name} vs ${jogo.teams.away.name}`,
        placar: `${jogo.goals.home} - ${jogo.goals.away}`,
        minuto: jogo.fixture.status.elapsed,
        heatScore,
        projecao
      });
    }

    // Ordenar por Heat Score e pegar os 3 melhores
    const top3 = resultados.sort((a, b) => b.heatScore - a.heatScore).slice(0, 3);

    return {
      status: "SUCESSO",
      totalAnalisados: jogosParaAnalisar.length,
      top3
    };
  } catch (error) {
    console.error("Erro na análise Top 3:", error);
    return { status: "ERRO", mensagem: "Falha ao conectar com a API." };
  }
}
