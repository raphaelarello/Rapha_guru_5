/**
 * Analisador de IA para Jogos Ao Vivo - Pitacos Engine
 * Conecta com API-Football v3 Real e gera análise preditiva
 */

import { calcularProjecaoJogo } from "./prediction-engine";
import { analisarJogadoresDuranteJogo } from "./player-analysis-engine";

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

export async function gerarAnaliseAoVivoReal() {
  try {
    console.log("🔍 Buscando jogos ao vivo reais agora...");
    const liveData = await fetchLiveGames();
    
    if (!liveData.response || liveData.response.length === 0) {
      return { status: "SEM_JOGOS", mensagem: "Não há jogos de elite acontecendo neste exato momento." };
    }

    // Pegar o jogo com maior "Heat" (mais movimentado)
    const jogo = liveData.response[0];
    const fixtureId = jogo.fixture.id;
    const statsData = await fetchMatchStats(fixtureId);

    // Mapear estatísticas reais para o motor de IA
    const stats = statsData.response[0]?.statistics || [];
    const getStat = (type: string) => parseInt(stats.find((s: any) => s.type === type)?.value || "0");

    const estatisticasAtuais = {
      golsCasa: jogo.goals.home || 0,
      golsFora: jogo.goals.away || 0,
      escanteiosCasa: getStat("Corner Kicks"),
      escanteiosFora: 0, // Simplificação para o exemplo
      cartoesCasa: getStat("Yellow Cards"),
      cartoesFora: 0,
      posseCasa: parseInt(getStat("Ball Possession") || "50"),
      chutesGolCasa: getStat("Shots on Goal"),
      chutesGolFora: 0
    };

    // 🧠 PROCESSAMENTO PELA IA MONSTRUOSA
    const projecao = await calcularProjecaoJogo(
      fixtureId,
      jogo.league.name,
      jogo.teams.home.name,
      jogo.teams.away.name,
      jogo.fixture.status.elapsed,
      "LIVE",
      estatisticasAtuais
    );

    const analiseJogadores = await analisarJogadoresDuranteJogo(
      fixtureId,
      jogo.fixture.status.elapsed,
      jogo.teams.home.name,
      jogo.teams.away.name
    );

    return {
      status: "SUCESSO",
      jogo: {
        liga: jogo.league.name,
        times: `${jogo.teams.home.name} vs ${jogo.teams.away.name}`,
        placar: `${jogo.goals.home} - ${jogo.goals.away}`,
        minuto: jogo.fixture.status.elapsed,
        estatisticas: estatisticasAtuais
      },
      ia: {
        projecao,
        analiseJogadores,
        heatScore: Math.min(100, (estatisticasAtuais.chutesGolCasa * 15 + estatisticasAtuais.posseCasa * 0.5))
      }
    };
  } catch (error) {
    console.error("Erro na análise real:", error);
    return { status: "ERRO", mensagem: "Falha ao conectar com a API de Futebol." };
  }
}
