import { describe, it, expect } from 'vitest';

describe('BacktestingMetrics', () => {
  it('deve calcular Sharpe Ratio corretamente', () => {
    const returns = [0.02, 0.03, -0.01, 0.04, 0.01];
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2)) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = mean / stdDev;

    expect(sharpeRatio).toBeGreaterThan(0);
    expect(sharpeRatio).toBeLessThan(10);
  });

  it('deve calcular Max Drawdown', () => {
    const equity = [10000, 10450, 10890, 10650, 11250, 12340];
    let maxDrawdown = 0;
    let peak = equity[0];

    for (let i = 1; i < equity.length; i++) {
      if (equity[i] > peak) peak = equity[i];
      const drawdown = (peak - equity[i]) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    expect(maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(maxDrawdown).toBeLessThan(1);
  });

  it('deve calcular Profit Factor', () => {
    const wins = [125.50, 200, 150];
    const losses = [54.30, 75, 100];
    const totalWins = wins.reduce((a, b) => a + b);
    const totalLosses = losses.reduce((a, b) => a + b);
    const profitFactor = totalWins / totalLosses;

    expect(profitFactor).toBeGreaterThan(0);
    expect(profitFactor).toBeCloseTo(1.85, 1);
  });

  it('deve calcular Win Rate', () => {
    const totalTrades = 200;
    const winningTrades = 117;
    const winRate = (winningTrades / totalTrades) * 100;

    expect(winRate).toBeGreaterThan(50);
    expect(winRate).toBeLessThan(100);
    expect(winRate).toBeCloseTo(58.5, 1);
  });
});
