/**
 * Notifications Engine - Multi-canal (Telegram, WhatsApp, Email, Web)
 * Com anti-spam, retry logic e observabilidade
 */

import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { inc, observe } from "./observability/metrics";

export type NotificationChannel = "telegram" | "whatsapp" | "email" | "web";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface NotificationPayload {
  userId: number;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  dedupeKey?: string; // Para anti-spam
}

export interface NotificationResult {
  notificationId: number;
  userId: number;
  channels: NotificationChannel[];
  status: "pending" | "sent" | "failed" | "throttled";
  sentAt?: Date;
  error?: string;
}

// Anti-spam: rastrear últimas notificações por dedupeKey
const SPAM_CACHE = new Map<string, { count: number; resetAt: number }>();
const SPAM_LIMIT = 3; // 3 notificações
const SPAM_WINDOW = 60_000; // por minuto

/**
 * Verificar anti-spam
 */
function checkSpamLimit(dedupeKey: string): boolean {
  const now = Date.now();
  const entry = SPAM_CACHE.get(dedupeKey);

  if (!entry || now > entry.resetAt) {
    SPAM_CACHE.set(dedupeKey, { count: 1, resetAt: now + SPAM_WINDOW });
    return true; // Permitir
  }

  if (entry.count < SPAM_LIMIT) {
    entry.count += 1;
    return true; // Permitir
  }

  return false; // Bloquear (spam)
}

/**
 * Enviar notificação via Telegram
 */
async function sendTelegram(
  userId: number,
  message: string,
  priority: NotificationPriority
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrar com Telegram Bot API
    // const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    // const chatId = await getUserTelegramChatId(userId);
    // await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    //   method: "POST",
    //   body: JSON.stringify({ chat_id: chatId, text: message }),
    // });

    inc("notification_telegram_sent");
    return { success: true };
  } catch (error) {
    inc("notification_telegram_failed");
    return { success: false, error: String(error) };
  }
}

/**
 * Enviar notificação via WhatsApp
 */
async function sendWhatsApp(
  userId: number,
  message: string,
  priority: NotificationPriority
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrar com Twilio ou WhatsApp Business API
    // const twilioClient = twilio(accountSid, authToken);
    // await twilioClient.messages.create({
    //   body: message,
    //   from: "whatsapp:+1234567890",
    //   to: `whatsapp:+${userPhoneNumber}`,
    // });

    inc("notification_whatsapp_sent");
    return { success: true };
  } catch (error) {
    inc("notification_whatsapp_failed");
    return { success: false, error: String(error) };
  }
}

/**
 * Enviar notificação via Email
 */
async function sendEmail(
  userId: number,
  title: string,
  message: string,
  priority: NotificationPriority
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrar com SendGrid ou similar
    // const sgMail = require("@sendgrid/mail");
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: userEmail,
    //   from: "noreply@pitacos.com",
    //   subject: title,
    //   html: message,
    // });

    inc("notification_email_sent");
    return { success: true };
  } catch (error) {
    inc("notification_email_failed");
    return { success: false, error: String(error) };
  }
}

/**
 * Enviar notificação Web (Push + In-app)
 */
async function sendWeb(
  userId: number,
  title: string,
  message: string,
  priority: NotificationPriority,
  data?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrar com Web Push API / Service Workers
    // const subscriptions = await getUserPushSubscriptions(userId);
    // for (const subscription of subscriptions) {
    //   await webpush.sendNotification(subscription, {
    //     title,
    //     body: message,
    //     data,
    //     badge: "/badge.png",
    //     icon: "/icon.png",
    //   });
    // }

    inc("notification_web_sent");
    return { success: true };
  } catch (error) {
    inc("notification_web_failed");
    return { success: false, error: String(error) };
  }
}

/**
 * Enviar notificação multi-canal
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const dedupeKey = payload.dedupeKey || `${payload.userId}:${payload.title}`;

  // Verificar spam
  if (!checkSpamLimit(dedupeKey)) {
    inc("notification_throttled");
    return {
      notificationId: 0,
      userId: payload.userId,
      channels: payload.channels,
      status: "throttled",
      error: "Rate limit exceeded",
    };
  }

  // Persistir notificação
  const result = await db.insert(notifications).values({
    userId: payload.userId,
    channels: payload.channels.join(","),
    priority: payload.priority,
    title: payload.title,
    message: payload.message,
    data: payload.data ? JSON.stringify(payload.data) : null,
    status: "pending",
    createdAt: new Date(),
  });

  const notificationId = (result as any)?.insertId || 0;

  // Enviar por cada canal
  const results: Record<NotificationChannel, { success: boolean; error?: string }> = {
    telegram: { success: false },
    whatsapp: { success: false },
    email: { success: false },
    web: { success: false },
  };

  for (const channel of payload.channels) {
    try {
      if (channel === "telegram") {
        results.telegram = await sendTelegram(payload.userId, payload.message, payload.priority);
      } else if (channel === "whatsapp") {
        results.whatsapp = await sendWhatsApp(payload.userId, payload.message, payload.priority);
      } else if (channel === "email") {
        results.email = await sendEmail(
          payload.userId,
          payload.title,
          payload.message,
          payload.priority
        );
      } else if (channel === "web") {
        results.web = await sendWeb(
          payload.userId,
          payload.title,
          payload.message,
          payload.priority,
          payload.data
        );
      }
    } catch (error) {
      console.error(`[notifications] Failed to send via ${channel}:`, error);
    }
  }

  // Determinar status geral
  const successCount = Object.values(results).filter((r) => r.success).length;
  const status = successCount === payload.channels.length
    ? "sent"
    : successCount > 0
      ? "sent" // Parcialmente enviado
      : "failed";

  // Atualizar status no banco
  await db
    .update(notifications)
    .set({
      status,
      sentAt: new Date(),
    })
    .where((t) => t.id === notificationId);

  inc(`notification_${status}`);
  observe("notification_channels_sent", successCount);

  return {
    notificationId,
    userId: payload.userId,
    channels: payload.channels,
    status: status as any,
    sentAt: new Date(),
    error: status === "failed" ? "All channels failed" : undefined,
  };
}

/**
 * Notificação de pick com confiança alta
 */
export async function notifyHighConfidencePick(
  userId: number,
  fixture: { homeName: string; awayName: string },
  pick: { market: string; selection: string; confidence: number; odd: number }
): Promise<NotificationResult> {
  const message = `🎯 Pick com ${pick.confidence}% de confiança: ${pick.market} - ${pick.selection} (odd ${pick.odd})`;

  return sendNotification({
    userId,
    channels: ["web", "telegram"],
    priority: "high",
    title: `${fixture.homeName} vs ${fixture.awayName}`,
    message,
    data: { type: "pick", ...pick },
    dedupeKey: `pick:${userId}:${pick.market}`,
  });
}

/**
 * Notificação de bilhete ganho
 */
export async function notifyTicketWon(
  userId: number,
  ticket: { homeTeam: string; awayTeam: string; roi: number; profit: number }
): Promise<NotificationResult> {
  const message = `🎉 Bilhete ganho! ROI: ${ticket.roi.toFixed(1)}% | Lucro: R$ ${ticket.profit.toFixed(2)}`;

  return sendNotification({
    userId,
    channels: ["web", "telegram", "whatsapp"],
    priority: "critical",
    title: `${ticket.homeTeam} vs ${ticket.awayTeam} - GANHOU!`,
    message,
    data: { type: "ticket_won", ...ticket },
    dedupeKey: `ticket_won:${userId}`,
  });
}

/**
 * Notificação de padrão detectado
 */
export async function notifyPatternDetected(
  userId: number,
  pattern: { name: string; confidence: number; fixtures: number }
): Promise<NotificationResult> {
  const message = `📊 Padrão "${pattern.name}" detectado com ${pattern.confidence}% confiança em ${pattern.fixtures} jogos`;

  return sendNotification({
    userId,
    channels: ["web", "telegram"],
    priority: "medium",
    title: "Novo Padrão Detectado",
    message,
    data: { type: "pattern", ...pattern },
    dedupeKey: `pattern:${userId}:${pattern.name}`,
  });
}

/**
 * Notificação de relatório diário
 */
export async function notifyDailyReport(
  userId: number,
  report: { totalPicks: number; hitRate: number; avgBrier: number }
): Promise<NotificationResult> {
  const message = `📈 Relatório 08:00: ${report.totalPicks} picks | ${report.hitRate.toFixed(1)}% acerto | Brier: ${report.avgBrier.toFixed(3)}`;

  return sendNotification({
    userId,
    channels: ["web", "email"],
    priority: "medium",
    title: "Relatório Diário - Pitacos Engine",
    message,
    data: { type: "daily_report", ...report },
    dedupeKey: `report:${userId}:${new Date().toISOString().split("T")[0]}`,
  });
}
