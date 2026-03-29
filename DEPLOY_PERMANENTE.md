# 🚀 GUIA DE DEPLOY PERMANENTE - PITACOS ENGINE

Este guia contém os passos exatos para transformar o **Pitacos Engine** em um site permanente, acessível 24/7 via internet.

---

## 🏗️ 1. HOSPEDAGEM (RECOMENDADO)

Para um sistema "Monstruoso" com IA e Realtime, recomendo usar a **Railway** ou **Render**, pois elas suportam Node.js e Workers simultaneamente.

### **Passos para Railway.app:**
1. Crie uma conta em [railway.app](https://railway.app).
2. Conecte seu repositório GitHub `raphaelarello/Rapha_guru_5`.
3. Adicione as **Variáveis de Ambiente** (veja seção 2).
4. O deploy será automático e você receberá um domínio `https://seu-projeto.up.railway.app`.

---

## 🔑 2. VARIÁVEIS DE AMBIENTE (.env)

Configure estas chaves no seu painel de hospedagem para ativar o motor real:

```env
# BANCO DE DADOS (Use TiDB Cloud ou MySQL da Railway)
DATABASE_URL=mysql://seu_usuario:sua_senha@host:3306/pitacos_db

# API DE FUTEBOL (Sua chave real)
FOOTBALL_API_KEY=3d65c1d86af5cf41505092eb69471f41
FOOTBALL_API_BASE_URL=https://v3.football.api-sports.io

# CONFIGURAÇÕES DE SERVIDOR
NODE_ENV=production
PORT=3000
```

---

## 🌐 3. DOMÍNIO PRÓPRIO

Para usar um domínio como `pitacos.rapha.guru`:
1. No painel da Railway/Render, vá em **Settings > Domains**.
2. Adicione seu domínio.
3. No seu provedor de DNS (Cloudflare, GoDaddy, etc), crie um registro **CNAME** apontando para o endereço fornecido pela hospedagem.

---

## ⚡ 4. MANUTENÇÃO E ESCALA

- **Workers:** O sistema já está configurado para rodar os workers de IA em segundo plano.
- **Logs:** Use o painel da hospedagem para monitorar o `server.log` e ver a IA aprendendo em tempo real.
- **Atualizações:** Sempre que você fizer um `git push` no seu repositório, o site será atualizado automaticamente com as novas melhorias.

---

## ✅ CHECKLIST FINAL DE PUBLICAÇÃO

- [x] Build de Produção Gerado (`pnpm build`)
- [x] IA v4.0 Soberana Integrada
- [x] Interface AAA Glassmorphism Ativa
- [x] Notificações Multi-canal Configuradas
- [x] Banco de Dados Sincronizado

**O Pitacos Engine agora é um site de nível profissional pronto para dominar o mercado!** 👹🚀🎯💰
