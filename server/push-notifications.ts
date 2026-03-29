/**
 * Push Notifications Service
 * Gerencia Web Push Notifications para Gold Picks
 */

import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Salvar push subscription
 */
export async function savePushSubscription(
  userId: number,
  subscription: PushSubscriptionData
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    
    // Verificar se já existe
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    }
  } catch (error) {
    console.error("[PushNotifications] Erro ao salvar subscription:", error);
    throw error;
  }
}

/**
 * Remover push subscription
 */
export async function removePushSubscription(endpoint: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  } catch (error) {
    console.error("[PushNotifications] Erro ao remover subscription:", error);
    throw error;
  }
}

/**
 * Obter todas as subscriptions de um usuário
 */
export async function getUserPushSubscriptions(userId: number): Promise<PushSubscriptionData[]> {
  try {
    const db = await getDb();
    if (!db) return [];
    
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    return subs.map((sub) => ({
      endpoint: sub.endpoint,
      expirationTime: null,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));
  } catch (error) {
    console.error("[PushNotifications] Erro ao obter subscriptions:", error);
    return [];
  }
}

/**
 * Enviar notificação push (mock - em produção usar web-push library)
 */
export async function sendPushNotification(
  userId: number,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  try {
    const subscriptions = await getUserPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.warn(`[PushNotifications] Nenhuma subscription para usuário ${userId}`);
      return { sent: 0, failed: 0 };
    }

    // Em produção, usar web-push para enviar notificações reais
    // Para desenvolvimento, apenas log
    console.log(`[PushNotifications] Enviando para ${subscriptions.length} dispositivos:`, {
      title: payload.title,
      body: payload.body,
    });

    // Simular sucesso
    return {
      sent: subscriptions.length,
      failed: 0,
    };
  } catch (error) {
    console.error("[PushNotifications] Erro ao enviar notificação:", error);
    return { sent: 0, failed: 1 };
  }
}

/**
 * Enviar notificação de Gold Pick
 */
export async function notifyGoldPick(
  userId: number,
  pick: {
    homeTeam: string;
    awayTeam: string;
    market: string;
    selection: string;
    edge: number;
    ev: number;
    odd: number;
    confidence: number;
  }
): Promise<void> {
  const edgePercent = Math.round(pick.edge * 100) / 100;
  const evPercent = Math.round(pick.ev * 100) / 100;

  const payload: PushNotificationPayload = {
    title: `🏆 Gold Pick! ${pick.homeTeam} vs ${pick.awayTeam}`,
    body: `${pick.selection} • Edge: ${edgePercent}% • EV: ${evPercent}% • Odd: ${pick.odd.toFixed(2)}`,
    icon: "https://cdn.example.com/icon-192x192.png",
    badge: "https://cdn.example.com/badge-72x72.png",
    tag: `gold-pick-${Date.now()}`,
    data: {
      market: pick.market,
      selection: pick.selection,
      edge: pick.edge,
      ev: pick.ev,
      odd: pick.odd,
      confidence: pick.confidence,
    },
  };

  await sendPushNotification(userId, payload);
}

/**
 * Enviar notificação de alta oportunidade
 */
export async function notifyHighOpportunity(
  userId: number,
  pick: {
    homeTeam: string;
    awayTeam: string;
    market: string;
    selection: string;
    ev: number;
    odd: number;
  }
): Promise<void> {
  const evPercent = Math.round(pick.ev * 100) / 100;

  const payload: PushNotificationPayload = {
    title: `💰 Alta Oportunidade! ${pick.homeTeam} vs ${pick.awayTeam}`,
    body: `${pick.selection} • EV: ${evPercent}% • Odd: ${pick.odd.toFixed(2)}`,
    tag: `high-ev-${Date.now()}`,
    data: {
      market: pick.market,
      selection: pick.selection,
      ev: pick.ev,
      odd: pick.odd,
    },
  };

  await sendPushNotification(userId, payload);
}
