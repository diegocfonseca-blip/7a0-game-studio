# Telão sob a transmissão — 22/11

Diego pediu o telão de propaganda abaixo do placar cinema/rápido ou campo 2D, em qualquer competição das salas online, para a conta principal e Futpoint, sem a moldura bege.

## Implementação

- O `Shell` fornece o mesmo `GiroDaRodada` ao destino de anúncio da transmissão principal (`OwnerPrimary`). O destino fica imediatamente após o componente nativo do jogo. Na interface de teste, a ordem visual foi ajustada para anúncio → informações/comandos/conteúdo, sem esconder o anúncio ao trocar de aba.
- O acesso do telão usa as duas identidades já verificadas e inclui `season`, `liberta`, `champions` e `end`. Este último é o contexto das copas abertas após a liga (Mundo/Euro/América, regionais e Libertadores). Isso não libera o restante das novas abas no fim da liga, nem altera permissões ou funcionamento das competições. A posição do telão independe da preferência de usar o visual anterior.
- O destino pertence à transmissão compartilhada, sem filtro pelo nome da liga/copa. As chamadas antigas na página e dentro do campo retornam vazio para essas duas contas antes de montar o corpo do anúncio; assim não há telões ou temporizadores de rotação duplicados. Mais de um placar/campo na página continua produzindo apenas um telão principal.
- Preservados feed existente, anúncios, links, relógio de rotação de 7 segundos e cache. Exemplos de anúncios na loja e apresentação das outras contas mantêm o caminho anterior. Nenhuma consulta, mensagem, tabela ou assinatura Realtime nova.
- O anúncio destacado não recebe borda, padding ou sombra externos e usa o fundo escuro do próprio LED. A transmissão e seu canvas mantêm a mesma instância ao trocar as abas.

## Verificação

- `npm run build` (TypeScript + Vite), `node scripts/testa-football-match-pilot.mjs` e `git diff --check`: passaram.
- `node scripts/teste-football-full/verifica.mjs`: **651 verificações aprovadas, sem erros JavaScript**. Inclui as duas contas, visitante Futpoint com identidade própria, cinema/2D, abas, uma única placa abaixo do jogo, ausência de moldura e exclusão das demais contas; preserva a cobertura existente de liga, Copa dos 8, Libertadores, Champions e Bafo.
- Transmissões pós-liga: fixture isolada com os componentes reais `Shell`, `CMModal`, `LiveScoreCard` e `GiroDaRodada`, estado `end`, dois placares/campos, feed de teste, rotação e links interceptados. Exercita o destino compartilhado inclusive através de portal; não simula a escolha de seleção ou o relógio do banco das copas.
- Rede externa bloqueada; sem salas ou usuários reais alterados. A bancada não substitui duas sessões autenticadas nem teste físico no Samsung S25.
- Evidências locais: `/workspace/shared/telao-online-20261122/`. As marcas A/B das capturas são dados de teste; o jogo usa o feed existente.
