import { io, Socket } from 'socket.io-client';

interface LiveUpdate {
  type: 'fixture_update' | 'pick_alert' | 'stats_update';
  data: any;
  timestamp: number;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<(data: LiveUpdate) => void>>();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Conectado ao servidor');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Desconectado do servidor');
    });

    this.socket.on('update', (update: LiveUpdate) => {
      this.handleUpdate(update);
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Erro:', error);
    });
  }

  /**
   * Subscrever a atualizações de uma sala
   */
  subscribe(room: string, callback: (data: LiveUpdate) => void) {
    if (!this.listeners.has(room)) {
      this.listeners.set(room, new Set());
    }
    this.listeners.get(room)!.add(callback);

    if (!this.socket?.connected) {
      this.connect();
    }

    this.socket?.emit(`subscribe:${room}`);
    console.log(`[WebSocket] Subscrito a ${room}`);
  }

  /**
   * Desinscrever de atualizações
   */
  unsubscribe(room: string, callback: (data: LiveUpdate) => void) {
    const listeners = this.listeners.get(room);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(room);
      }
    }
  }

  /**
   * Processar atualização recebida
   */
  private handleUpdate(update: LiveUpdate) {
    // Determinar qual sala baseado no tipo
    let room = '';
    if (update.type === 'fixture_update') {
      room = 'ao-vivo';
    } else if (update.type === 'pick_alert') {
      room = 'destaques';
    }

    const listeners = this.listeners.get(room);
    if (listeners) {
      listeners.forEach((callback) => callback(update));
    }
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsClient = new WebSocketClient();

// Hook para usar WebSocket no React
import { useEffect, useCallback } from 'react';

export function useWebSocket(room: string, onUpdate: (data: LiveUpdate) => void) {
  const handleUpdate = useCallback(
    (data: LiveUpdate) => {
      onUpdate(data);
    },
    [onUpdate]
  );

  useEffect(() => {
    wsClient.subscribe(room, handleUpdate);

    return () => {
      wsClient.unsubscribe(room, handleUpdate);
    };
  }, [room, handleUpdate]);
}
