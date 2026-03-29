/**
 * Alerts Service - Alertas em tempo real para Gold Picks
 * Monitora picks e notifica quando surgem oportunidades
 */

import { cacheManager } from "./cache-manager";

export interface AlertEvent {
  type: "new_gold_pick" | "high_edge" | "high_ev";
  timestamp: number;
  pick: {
    fixtureId: number;
    leagueName: string;
    homeTeam: string;
    awayTeam: string;
    market: string;
    selection: string;
    edge: number;
    ev: number;
    odd: number;
    confidence: number;
  };
}

class AlertsService {
  private lastAlerts: Map<string, number> = new Map();
  private subscribers: Set<(alert: AlertEvent) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Subscribe para receber alertas
   */
  subscribe(callback: (alert: AlertEvent) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Emitir alerta
   */
  private emit(alert: AlertEvent) {
    const key = `${alert.pick.fixtureId}:${alert.pick.market}`;
    const lastTime = this.lastAlerts.get(key) || 0;
    
    // Evitar alertas duplicados (min 5 minutos entre alertas do mesmo pick)
    if (Date.now() - lastTime < 5 * 60 * 1000) return;
    
    this.lastAlerts.set(key, Date.now());
    this.subscribers.forEach(cb => {
      try {
        cb(alert);
      } catch (error) {
        console.error("[AlertsService] Subscriber error:", error);
      }
    });
  }

  /**
   * Monitorar picks e gerar alertas
   */
  monitorPicks(picks: any[]) {
    for (const pick of picks) {
      const edge = (pick.edge ?? 0) * 100;
      const ev = (pick.pModel * (pick.odd ?? 1) - 1) * 100;

      // Alerta: Gold Pick (edge > 5%)
      if (edge > 5) {
        this.emit({
          type: "new_gold_pick",
          timestamp: Date.now(),
          pick: {
            fixtureId: pick.fixtureId,
            leagueName: pick.leagueName || "Liga desconhecida",
            homeTeam: pick.fixture?.home?.name || "Time A",
            awayTeam: pick.fixture?.away?.name || "Time B",
            market: pick.market,
            selection: pick.label,
            edge,
            ev,
            odd: pick.odd || 0,
            confidence: pick.score || 0,
          },
        });
      }

      // Alerta: EV muito alto (> 20%)
      if (ev > 20) {
        this.emit({
          type: "high_ev",
          timestamp: Date.now(),
          pick: {
            fixtureId: pick.fixtureId,
            leagueName: pick.leagueName || "Liga desconhecida",
            homeTeam: pick.fixture?.home?.name || "Time A",
            awayTeam: pick.fixture?.away?.name || "Time B",
            market: pick.market,
            selection: pick.label,
            edge,
            ev,
            odd: pick.odd || 0,
            confidence: pick.score || 0,
          },
        });
      }
    }
  }

  /**
   * Iniciar monitoramento periódico
   */
  startMonitoring(interval: number = 30000) {
    if (this.monitoringInterval) clearInterval(this.monitoringInterval);
    
    this.monitoringInterval = setInterval(() => {
      // Aqui seria integrado com o backend para buscar picks atualizados
      // Por enquanto, apenas mantém a infraestrutura pronta
    }, interval);
  }

  /**
   * Parar monitoramento
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      subscribers: this.subscribers.size,
      alertsCache: this.lastAlerts.size,
      isMonitoring: this.monitoringInterval !== null,
    };
  }
}

export const alertsService = new AlertsService();
