import nodemailer from 'nodemailer';

// Configurar transporte de email (usar variáveis de ambiente em produção)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@vendacredito.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

export interface GoldPickNotification {
  pickId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  selection: string;
  edge: number;
  ev: number;
  odd: number;
  confidence: number;
  timestamp: Date;
}

export interface EmailPreferences {
  userId: string;
  email: string;
  notifyOnGoldPick: boolean;
  notifyOnHighConfidence: boolean;
  notifyOnNewPicks: boolean;
  minEdge: number;
  minConfidence: number;
}

export const sendGoldPickNotification = async (
  preferences: EmailPreferences,
  pick: GoldPickNotification
): Promise<boolean> => {
  if (!preferences.notifyOnGoldPick) return false;
  if (pick.edge < preferences.minEdge || pick.confidence < preferences.minConfidence) return false;

  const emailContent = `
    <h2>🎯 Novo Gold Pick Detectado!</h2>
    
    <h3>${pick.homeTeam} vs ${pick.awayTeam}</h3>
    <p><strong>Liga:</strong> ${pick.league}</p>
    <p><strong>Mercado:</strong> ${pick.market}</p>
    <p><strong>Seleção:</strong> ${pick.selection}</p>
    
    <h4>Métricas:</h4>
    <ul>
      <li><strong>Margem (Edge):</strong> ${pick.edge.toFixed(2)}%</li>
      <li><strong>Valor Esperado (EV):</strong> ${pick.ev.toFixed(2)}%</li>
      <li><strong>Cota:</strong> ${pick.odd.toFixed(2)}</li>
      <li><strong>Confiança:</strong> ${pick.confidence.toFixed(0)}%</li>
    </ul>
    
    <p><strong>Detectado em:</strong> ${pick.timestamp.toLocaleString('pt-BR')}</p>
    
    <p>
      <a href="https://vendacredito.com/picks/${pick.pickId}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Ver Pick Completo
      </a>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@vendacredito.com',
      to: preferences.email,
      subject: `🎯 Gold Pick: ${pick.homeTeam} vs ${pick.awayTeam}`,
      html: emailContent,
    });
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar notificação:', error);
    return false;
  }
};

export const sendHighConfidenceNotification = async (
  preferences: EmailPreferences,
  pick: GoldPickNotification
): Promise<boolean> => {
  if (!preferences.notifyOnHighConfidence) return false;
  if (pick.confidence < 80) return false;

  const emailContent = `
    <h2>⚡ Pick com Alta Confiança Detectado!</h2>
    
    <h3>${pick.homeTeam} vs ${pick.awayTeam}</h3>
    <p><strong>Liga:</strong> ${pick.league}</p>
    <p><strong>Mercado:</strong> ${pick.market}</p>
    <p><strong>Seleção:</strong> ${pick.selection}</p>
    
    <h4>Métricas:</h4>
    <ul>
      <li><strong>Confiança:</strong> <span style="color: #8b5cf6; font-weight: bold;">${pick.confidence.toFixed(0)}%</span></li>
      <li><strong>Margem (Edge):</strong> ${pick.edge.toFixed(2)}%</li>
      <li><strong>Valor Esperado (EV):</strong> ${pick.ev.toFixed(2)}%</li>
      <li><strong>Cota:</strong> ${pick.odd.toFixed(2)}</li>
    </ul>
    
    <p><strong>Detectado em:</strong> ${pick.timestamp.toLocaleString('pt-BR')}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@vendacredito.com',
      to: preferences.email,
      subject: `⚡ Pick com ${pick.confidence.toFixed(0)}% de Confiança: ${pick.homeTeam} vs ${pick.awayTeam}`,
      html: emailContent,
    });
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar notificação:', error);
    return false;
  }
};

export const sendDailyDigest = async (
  preferences: EmailPreferences,
  picks: GoldPickNotification[]
): Promise<boolean> => {
  if (picks.length === 0) return false;

  const goldPicks = picks.filter(p => p.edge > 5 && p.ev > 20);
  const highConfidencePicks = picks.filter(p => p.confidence >= 80);

  const emailContent = `
    <h2>📊 Resumo Diário de Picks</h2>
    
    <h3>Estatísticas do Dia</h3>
    <ul>
      <li><strong>Total de Picks:</strong> ${picks.length}</li>
      <li><strong>Gold Picks:</strong> ${goldPicks.length}</li>
      <li><strong>Picks com Alta Confiança (≥80%):</strong> ${highConfidencePicks.length}</li>
    </ul>
    
    <h3>Top 5 Picks do Dia</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #374151; color: white;">
          <th style="padding: 10px; text-align: left;">Jogo</th>
          <th style="padding: 10px; text-align: center;">Margem</th>
          <th style="padding: 10px; text-align: center;">V.E.</th>
          <th style="padding: 10px; text-align: center;">Confiança</th>
        </tr>
      </thead>
      <tbody>
        ${picks
          .sort((a, b) => b.edge - a.edge)
          .slice(0, 5)
          .map(
            (p) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px;">${p.homeTeam} vs ${p.awayTeam}</td>
            <td style="padding: 10px; text-align: center; color: ${p.edge > 5 ? '#10b981' : '#f97316'};">${p.edge.toFixed(2)}%</td>
            <td style="padding: 10px; text-align: center;">${p.ev.toFixed(2)}%</td>
            <td style="padding: 10px; text-align: center; color: #8b5cf6;">${p.confidence.toFixed(0)}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    
    <p style="margin-top: 20px;">
      <a href="https://vendacredito.com/destaques" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Ver Todos os Picks
      </a>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@vendacredito.com',
      to: preferences.email,
      subject: `📊 Resumo Diário: ${picks.length} Picks - ${new Date().toLocaleDateString('pt-BR')}`,
      html: emailContent,
    });
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar digest:', error);
    return false;
  }
};

export const sendTestEmail = async (email: string): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@vendacredito.com',
      to: email,
      subject: '✅ Email de Teste - Venda Crédito',
      html: `
        <h2>✅ Email de Teste</h2>
        <p>Suas notificações por email estão funcionando corretamente!</p>
        <p>Você receberá atualizações sobre Gold Picks e oportunidades de alto valor.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar email de teste:', error);
    return false;
  }
};
