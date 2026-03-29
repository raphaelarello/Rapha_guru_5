'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { AlertCircle, TrendingUp, Award, AlertTriangle, Zap, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'gold_pick' | 'fixture_update' | 'alert';
  title: string;
  message: string;
  urgency: 'critica' | 'alta' | 'media' | 'baixa';
  timestamp: number;
  read: boolean;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Subscrever a atualizações de Gold Picks
  useWebSocket('destaques', (update) => {
    setWsConnected(true);
    
    if (update.type === 'pick_alert') {
      const newNotif: Notification = {
        id: `${Date.now()}`,
        type: 'gold_pick',
        title: '🏆 Gold Pick Detectado!',
        message: update.data.mercado || 'Nova oportunidade de valor',
        urgency: update.data.urgencia || 'alta',
        timestamp: update.timestamp,
        read: false,
      };
      
      setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);

      // Auto-dismiss após 8 segundos
      setTimeout(() => {
        markAsRead(newNotif.id);
      }, 8000);
    }
  });

  // Subscrever a atualizações ao vivo
  useWebSocket('ao-vivo', (update) => {
    setWsConnected(true);
    
    if (update.type === 'fixture_update' && update.data.totalJogos > 0) {
      const newNotif: Notification = {
        id: `${Date.now()}`,
        type: 'fixture_update',
        title: '⚽ Jogos ao Vivo Atualizados',
        message: `${update.data.totalJogos} jogos, ${update.data.totalOportunidades} oportunidades`,
        urgency: 'media',
        timestamp: update.timestamp,
        read: false,
      };
      
      setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);

      // Auto-dismiss após 5 segundos
      setTimeout(() => {
        markAsRead(newNotif.id);
      }, 5000);
    }
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critica':
        return 'bg-red-500/10 border-red-500/50 text-red-600';
      case 'alta':
        return 'bg-orange-500/10 border-orange-500/50 text-orange-600';
      case 'media':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600';
      default:
        return 'bg-blue-500/10 border-blue-500/50 text-blue-600';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critica':
        return <AlertTriangle className="w-4 h-4" />;
      case 'alta':
        return <Zap className="w-4 h-4" />;
      case 'media':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Status de conexão WebSocket */}
      <div className="absolute -top-12 right-0 flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-slate-300">{wsConnected ? 'Conectado' : 'Desconectado'}</span>
      </div>

      {/* Badge de notificações não lidas */}
      {unreadCount > 0 && (
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative mb-4 p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all animate-pulse"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </button>
      )}

      {/* Painel de notificações */}
      {showPanel && (
        <div className="absolute bottom-16 right-0 w-96 max-h-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-y-auto">
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
            <h3 className="font-bold text-white">Notificações</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="divide-y divide-slate-700">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-l-4 cursor-pointer transition-all ${
                    notif.read ? 'opacity-60' : 'opacity-100'
                  } ${getUrgencyColor(notif.urgency)}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getUrgencyIcon(notif.urgency)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-xs mt-1 opacity-90">{notif.message}</p>
                      <p className="text-xs mt-2 opacity-60">
                        {new Date(notif.timestamp).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast flutuante (última notificação não lida) */}
      {notifications.length > 0 && !notifications[0].read && (
        <div
          className={`w-80 p-4 rounded-lg shadow-xl border-l-4 animate-in slide-in-from-bottom-4 ${getUrgencyColor(
            notifications[0].urgency
          )}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">{getUrgencyIcon(notifications[0].urgency)}</div>
            <div className="flex-1">
              <p className="font-bold text-sm">{notifications[0].title}</p>
              <p className="text-xs mt-1">{notifications[0].message}</p>
            </div>
            <button
              onClick={() => markAsRead(notifications[0].id)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
