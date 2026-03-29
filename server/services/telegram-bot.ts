/**
 * Telegram Bot Integration - Notificações Inteligentes
 * Envia picks de alta confiança e alertas críticos via Telegram
 */

import { observe, inc } from "../pro/observability/metrics";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface MensagemTelegram {
  chatId: string;
  titulo: string;
  conteudo: string;
  tipo: "pick" | "alerta" | "relatorio" | "oportunidade";
  dados?: Record<string, any>;
}

/**
 * Enviar mensagem para Telegram
 */
export async function enviarTelegram(mensagem: MensagemTelegram): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[telegram-bot] Token ou Chat ID não configurados");
    return false;
  }

  try {
    const texto = formatarMensagemTelegram(mensagem);

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: mensagem.chatId || TELEGRAM_CHAT_ID,
        text: texto,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const erro = await response.json();
      console.error("[telegram-bot] Erro ao enviar:", erro);
      observe("telegram_error", 1);
      return false;
    }

    inc("notifications_sent");
    observe("telegram_sent", 1);
    return true;
  } catch (error) {
    console.error("[telegram-bot] Erro na integração:", error);
    observe("telegram_error", 1);
    return false;
  }
}

/**
 * Enviar notificação de Pick de Alta Confiança
 */
export async function notificarPickAltoConfianca(dados: {
  liga: string;
  time1: string;
  time2: string;
  mercado: string;
  confianca: number;
  odd: number;
  analise: string;
  linkBilhete?: string;
}): Promise<boolean> {
  const mensagem: MensagemTelegram = {
    chatId: TELEGRAM_CHAT_ID,
    titulo: "🎯 PICK DE ALTA CONFIANÇA",
    conteudo: `
<b>${dados.liga}</b>
${dados.time1} vs ${dados.time2}

<b>Mercado:</b> ${dados.mercado}
<b>Confiança:</b> ${dados.confianca}%
<b>Odd:</b> ${dados.odd}

<b>Análise:</b>
${dados.analise}

${dados.linkBilhete ? `<a href="${dados.linkBilhete}">📱 Abrir Bilhete</a>` : ""}
    `,
    tipo: "pick",
    dados,
  };

  return enviarTelegram(mensagem);
}

/**
 * Enviar alerta crítico
 */
export async function notificarAlertaCritico(dados: {
  titulo: string;
  mensagem: string;
  severidade: "baixa" | "media" | "alta" | "critica";
}): Promise<boolean> {
  const emojis = {
    baixa: "ℹ️",
    media: "⚠️",
    alta: "🔴",
    critica: "🚨",
  };

  const mensagem: MensagemTelegram = {
    chatId: TELEGRAM_CHAT_ID,
    titulo: `${emojis[dados.severidade]} ${dados.titulo}`,
    conteudo: `
<b>${dados.titulo}</b>

${dados.mensagem}

<i>Severidade: ${dados.severidade.toUpperCase()}</i>
    `,
    tipo: "alerta",
    dados,
  };

  return enviarTelegram(mensagem);
}

/**
 * Enviar relatório matinal
 */
export async function notificarRelatoriMatinal(dados: {
  dataRelatorio: string;
  totalPicks: number;
  acertos: number;
  taxaAcerto: number;
  lucroTotal: number;
  roiPercentual: number;
  mercadoDestaque: string;
  confiancaMercado: number;
}): Promise<boolean> {
  const mensagem: MensagemTelegram = {
    chatId: TELEGRAM_CHAT_ID,
    titulo: "📊 RELATÓRIO MATINAL",
    conteudo: `
<b>Relatório de ${dados.dataRelatorio}</b>

📈 <b>Performance</b>
• Total de Picks: ${dados.totalPicks}
• Acertos: ${dados.acertos}
• Taxa: <b>${dados.taxaAcerto}%</b>

💰 <b>Financeiro</b>
• Lucro: <b>R$ ${dados.lucroTotal.toFixed(2)}</b>
• ROI: <b>${dados.roiPercentual}%</b>

🎯 <b>Destaque</b>
• Mercado: ${dados.mercadoDestaque}
• Confiança: ${dados.confiancaMercado}%
    `,
    tipo: "relatorio",
    dados,
  };

  return enviarTelegram(mensagem);
}

/**
 * Enviar oportunidade detectada
 */
export async function notificarOportunidade(dados: {
  tipo: "padrao" | "arbitragem" | "valor";
  descricao: string;
  confianca: number;
  recomendacao: string;
}): Promise<boolean> {
  const emojis = {
    padrao: "📊",
    arbitragem: "💎",
    valor: "💰",
  };

  const mensagem: MensagemTelegram = {
    chatId: TELEGRAM_CHAT_ID,
    titulo: `${emojis[dados.tipo]} OPORTUNIDADE DETECTADA`,
    conteudo: `
<b>${dados.descricao}</b>

🎯 Confiança: ${dados.confianca}%

💡 <b>Recomendação:</b>
${dados.recomendacao}
    `,
    tipo: "oportunidade",
    dados,
  };

  return enviarTelegram(mensagem);
}

/**
 * Enviar resultado de bilhete
 */
export async function notificarResultadoBilhete(dados: {
  status: "WON" | "LOST" | "VOID";
  lucro: number;
  roi: number;
  topicos: string[];
  odd: number;
}): Promise<boolean> {
  const emojis = {
    WON: "🎉",
    LOST: "😞",
    VOID: "⚪",
  };

  const cores = {
    WON: "Ganho",
    LOST: "Perdido",
    VOID: "Nulo",
  };

  const mensagem: MensagemTelegram = {
    chatId: TELEGRAM_CHAT_ID,
    titulo: `${emojis[dados.status]} BILHETE ${cores[dados.status]}`,
    conteudo: `
<b>Status:</b> ${cores[dados.status]}

📋 <b>Tópicos:</b>
${dados.topicos.map((t) => `• ${t}`).join("\n")}

💰 <b>Resultado:</b>
• Odd: ${dados.odd}
• Lucro: <b>R$ ${dados.lucro.toFixed(2)}</b>
• ROI: <b>${dados.roi}%</b>
    `,
    tipo: "pick",
    dados,
  };

  return enviarTelegram(mensagem);
}

/**
 * Formatar mensagem para Telegram
 */
function formatarMensagemTelegram(mensagem: MensagemTelegram): string {
  const timestamp = new Date().toLocaleTimeString("pt-BR");
  return `${mensagem.conteudo}\n\n<i>⏰ ${timestamp}</i>`;
}

/**
 * Testar conexão com Telegram
 */
export async function testarConexaoTelegram(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("[telegram-bot] Token ou Chat ID não configurados");
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const dados = await response.json();

    if (dados.ok) {
      console.log(`[telegram-bot] Conectado como @${dados.result.username}`);
      return true;
    } else {
      console.error("[telegram-bot] Erro na autenticação:", dados.description);
      return false;
    }
  } catch (error) {
    console.error("[telegram-bot] Erro ao testar conexão:", error);
    return false;
  }
}

/**
 * Configurar webhook para receber mensagens
 */
export async function configurarWebhookTelegram(urlWebhook: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[telegram-bot] Token não configurado");
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlWebhook }),
    });

    const dados = await response.json();

    if (dados.ok) {
      console.log("[telegram-bot] Webhook configurado com sucesso");
      return true;
    } else {
      console.error("[telegram-bot] Erro ao configurar webhook:", dados.description);
      return false;
    }
  } catch (error) {
    console.error("[telegram-bot] Erro ao configurar webhook:", error);
    return false;
  }
}
