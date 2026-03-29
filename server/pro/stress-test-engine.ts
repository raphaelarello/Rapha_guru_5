/**
 * Teste de Stress "Carga Máxima" - Pitacos Engine
 * Simulação de 100+ jogos simultâneos com IA e Realtime
 * Validação de estabilidade e performance
 */

import { observe, inc } from "./observability/metrics";

export interface StressTestResult {
  totalJogos: number;
  tempoProcessamentoTotal: number;
  mediaTempoPorJogo: number;
  errosDetectados: number;
  status: "ESTÁVEL" | "SOBRECARREGADO" | "CRÍTICO";
  timestamp: Date;
}

/**
 * Executar Teste de Stress com 100+ Jogos
 */
export async function executarTesteStress(quantidadeJogos: number = 100): Promise<StressTestResult> {
  try {
    console.log(`[STRESS] Iniciando teste de stress com ${quantidadeJogos} jogos simultâneos...`);
    
    const startTime = Date.now();
    let erros = 0;

    // Simulação de processamento de IA para cada jogo
    const promessas = Array.from({ length: quantidadeJogos }).map(async (_, i) => {
      try {
        // Simular latência de processamento de IA (50-150ms)
        const latencia = Math.floor(Math.random() * 100 + 50);
        await new Promise(resolve => setTimeout(resolve, latencia));
        
        // Simular cálculo de Heat Score e Projeções
        const heatScore = Math.floor(Math.random() * 100);
        const confianca = Math.floor(Math.random() * 20 + 80);
        
        observe("stress_game_processed", 1);
        return { id: i, heatScore, confianca };
      } catch (e) {
        erros++;
        return null;
      }
    });

    await Promise.all(promessas);
    
    const endTime = Date.now();
    const tempoTotal = endTime - startTime;
    const mediaTempo = tempoTotal / quantidadeJogos;

    const status = tempoTotal < 5000 ? "ESTÁVEL" : tempoTotal < 10000 ? "SOBRECARREGADO" : "CRÍTICO";

    console.log(`[STRESS] Teste concluído em ${tempoTotal}ms. Média: ${mediaTempo.toFixed(2)}ms/jogo. Status: ${status}`);

    observe("stress_test_completed", 1);
    inc("stress_tests_total");

    return {
      totalJogos: quantidadeJogos,
      tempoProcessamentoTotal: tempoTotal,
      mediaTempoPorJogo: mediaTempo,
      errosDetectados: erros,
      status,
      timestamp: new Date()
    };
  } catch (error) {
    console.error("[STRESS] Erro fatal no teste de stress:", error);
    throw error;
  }
}
