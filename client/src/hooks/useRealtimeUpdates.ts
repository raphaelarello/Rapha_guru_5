import { useEffect } from "react";

interface RealtimeUpdate {
  type: "goal" | "red_card" | "odd_move" | "next10_spike" | "pressure_change";
  fixture_id: number;
  data: any;
  timestamp: number;
}

export function useRealtimeUpdates(onUpdate?: (update: RealtimeUpdate) => void) {
  useEffect(() => {
    // Conectar WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws/ao-vivo`;
    
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("[WebSocket] Conectado ao ao-vivo");
        };

        ws.onmessage = (event) => {
          try {
            const update: RealtimeUpdate = JSON.parse(event.data);
            onUpdate?.(update);
          } catch (e) {
            console.error("[WebSocket] Erro ao processar mensagem:", e);
          }
        };

        ws.onerror = (error) => {
          console.error("[WebSocket] Erro:", error);
        };

        ws.onclose = () => {
          console.log("[WebSocket] Desconectado, reconectando em 3s...");
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (error) {
        console.error("[WebSocket] Erro ao conectar:", error);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [onUpdate]);
}
