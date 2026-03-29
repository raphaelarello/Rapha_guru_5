import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface LiveUpdate {
  type: 'fixture_update' | 'pick_alert' | 'stats_update';
  data: any;
  timestamp: number;
}

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private connectedClients = new Set<string>();

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Cliente conectado: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Listener para subscrição a atualizações
      socket.on('subscribe:ao-vivo', () => {
        socket.join('ao-vivo');
        console.log(`[WebSocket] ${socket.id} subscrito a ao-vivo`);
      });

      socket.on('subscribe:destaques', () => {
        socket.join('destaques');
        console.log(`[WebSocket] ${socket.id} subscrito a destaques`);
      });

      socket.on('disconnect', () => {
        this.connectedClients.delete(socket.id);
        console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
      });
    });

    console.log('[WebSocket] Servidor inicializado');
  }

  /**
   * Enviar atualização para todos os clientes em uma sala
   */
  broadcast(room: string, update: LiveUpdate) {
    if (!this.io) return;
    this.io.to(room).emit('update', update);
    console.log(`[WebSocket] Broadcast para ${room}:`, update.type);
  }

  /**
   * Enviar atualização para um cliente específico
   */
  sendToClient(clientId: string, update: LiveUpdate) {
    if (!this.io) return;
    this.io.to(clientId).emit('update', update);
  }

  /**
   * Obter número de clientes conectados
   */
  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Obter número de clientes em uma sala
   */
  getRoomCount(room: string): number {
    if (!this.io) return 0;
    return this.io.sockets.adapter.rooms.get(room)?.size || 0;
  }

  /**
   * Fechar servidor
   */
  close() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
  }
}

export const wsManager = new WebSocketManager();
