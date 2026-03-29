# Checklist de publicação (Manus)

## Pré-publicação
- [ ] `pnpm i`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Rotas
- [ ] `/ao-vivo` abre sem erro e carrega jogos
- [ ] `/jogos` lista por liga (esquerda) + painel (direita)
- [ ] `/destaques` cards por seções + painel lateral + CTA "Apostar agora"
- [ ] `/pitacos` abas (Hoje/Ao vivo/Ligas/Acurácia/Relatórios/Viradas)
- [ ] `/bots` mostra 3 bots prontos (seed) e permite ativar/pausar

## Pitacos - itens críticos
- [ ] Relatório diário (08:00) habilitado (cron)
- [ ] Acurácia por mês/temporada
- [ ] Viradas (telão + auto-rotate)

## Infra
- [ ] `/api/health` retorna ok
- [ ] Cache/TTL sem crash quando Redis indisponível
