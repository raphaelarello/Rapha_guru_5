import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

export interface AlertConfig {
  edgeThreshold: number; // 0.10 = 10%
  evThreshold: number; // 0.25 = 25%
  minOdd: number; // 1.5
}

export interface GoldPickAlert {
  fixtureId: string;
  market: string;
  selection: string;
  edge: number;
  ev: number;
  odd: number;
  confidence: number;
  timestamp: Date;
}

const DEFAULT_CONFIG: AlertConfig = {
  edgeThreshold: 0.10, // 10%
  evThreshold: 0.25, // 25%
  minOdd: 1.5,
};

export async function checkAndAlertGoldPicks(
  picks: any[],
  config: AlertConfig = DEFAULT_CONFIG
): Promise<GoldPickAlert[]> {
  const alerts: GoldPickAlert[] = [];

  for (const pick of picks) {
    // Verificar se atende critérios de Gold Pick
    if (
      pick.edge >= config.edgeThreshold &&
      pick.ev >= config.evThreshold &&
      pick.odd >= config.minOdd
    ) {
      const alert: GoldPickAlert = {
        fixtureId: pick.fixtureId,
        market: pick.market,
        selection: pick.selection,
        edge: pick.edge,
        ev: pick.ev,
        odd: pick.odd,
        confidence: Math.min(pick.edge * 100, 99), // 0-99%
        timestamp: new Date(),
      };

      alerts.push(alert);

      // Notificar owner
      await notifyOwner({
        title: `🚨 GOLD PICK ENCONTRADO - ${pick.market}`,
        content: `${pick.selection} | Edge: ${(pick.edge * 100).toFixed(2)}% | EV: ${(pick.ev * 100).toFixed(2)}% | Odd: ${pick.odd.toFixed(2)}`,
      });
    }
  }

  return alerts;
}

export async function generateAlertMessage(alert: GoldPickAlert): Promise<string> {
  const message = `
🎯 GOLD PICK ALERT

Mercado: ${alert.market}
Seleção: ${alert.selection}
Edge: ${(alert.edge * 100).toFixed(2)}%
EV: ${alert.ev.toFixed(4)}
Odd: ${alert.odd.toFixed(2)}
Confiança: ${alert.confidence.toFixed(0)}%

⚠️ Oportunidade de alto valor encontrada!
  `.trim();

  return message;
}

export async function sendAlertToUser(
  userId: string,
  alert: GoldPickAlert
): Promise<boolean> {
  try {
    // Usar LLM para gerar mensagem personalizada
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente de apostas esportivas. Gere uma mensagem curta e impactante sobre um Gold Pick encontrado.",
        },
        {
          role: "user",
          content: `Gold Pick: ${alert.market} - ${alert.selection}, Edge: ${(alert.edge * 100).toFixed(2)}%, EV: ${alert.ev.toFixed(4)}, Odd: ${alert.odd.toFixed(2)}`,
        },
      ],
    });

    const message = response.choices[0].message.content;

    // Notificar owner com mensagem personalizada
    await notifyOwner({
      title: `🚀 OPORTUNIDADE ENCONTRADA`,
      content: message,
    });

    return true;
  } catch (err) {
    console.error("Erro ao enviar alerta:", err);
    return false;
  }
}
