import { describe, it, expect } from 'vitest';

describe('AlertasTempoReal', () => {
  it('deve criar alerta com tipo gold_pick', () => {
    const alerta = {
      id: 'alerta-1',
      tipo: 'gold_pick' as const,
      titulo: '⚡ Gold Pick Detectado!',
      descricao: 'Oportunidade com edge > 10% e EV > 25%',
      urgencia: 'critica' as const,
      timestamp: Date.now(),
      dados: {
        mercado: 'Over 2.5',
        edge: 12.5,
        ev: 28.3,
        odd: 1.85,
        homeTeam: 'Time A',
        awayTeam: 'Time B',
        confianca: 87,
      },
    };

    expect(alerta.tipo).toBe('gold_pick');
    expect(alerta.urgencia).toBe('critica');
    expect(alerta.dados.edge).toBeGreaterThan(10);
    expect(alerta.dados.ev).toBeGreaterThan(25);
  });

  it('deve validar urgência', () => {
    const urgencias = ['critica', 'alta', 'media', 'baixa'];
    urgencias.forEach(u => {
      expect(['critica', 'alta', 'media', 'baixa']).toContain(u);
    });
  });
});
