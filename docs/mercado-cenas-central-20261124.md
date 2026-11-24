# Mercado e cenas da Central — 24/11/2026

Status: capturas reais de celular/desktop apresentadas e visual aprovado por Diego em 24/11/2026: “Publique então”. Publicação autorizada para todos; entrega isolada na branch `feat/mercado-cenas-central-20261124`, com integração à main e acompanhamento do deploy.

## Mercado

Central de transferências com escudo existente, caixa real do clube e navegação Sondar / Vender / Contratos / Negócios. Venda mantém a regra e a ação existentes; jogadores com restrição são resumidos, com motivos individuais ao abrir. Sondagem mantém um técnico e um jogador, os limites do olheiro e a disponibilidade nativa. Busca também por clube; filtros Minha série / Brasil todo preservam o mercado nacional. Oito clubes por página; duas colunas no desktop. Nenhuma nota, categoria, salário, renovação, moeda, contratação ou regra de saída foi alterada.

## Central

O mapa real continua sendo o vídeo ao vivo, em um único canvas movido entre a Central e a Cidade. Pedidos `cena:` usam planos mais próximos da ação; navegação comum conserva os enquadramentos próprios. O plano é mantido em redimensionamentos e reconstrução por qualidade. Balada tem luz suave apenas durante a cena noturna. Nenhuma imagem ou vídeo gerado substitui o mapa.

Cenas vêm de fatos já conhecidos: título/carreatas, acesso ou queda confirmados, estreia em casa, evento de noitada/futevôlei já decidido, obras compradas e resultado revelado. Títulos e acessos têm prioridade; resenha varia por resultado e rodada, com contexto de clássico e goleada. Não inventa partidas nem revela placar futuro. Próximo momento e Pular momentos usam histórico local limitado a 80 chaves; não avançam calendário nem mexem no save.

O compacto tinha botecos/balada sem os atores do antigo mapa (as referências antigas estavam vazias). Agora há grupos pequenos instanciados usando os figurantes existentes: até dez no boteco, cinco na balada e sete na carreata confirmada. O ônibus usa o modelo/rota existentes; não altera público ou receita. Cidade permanece suspensa durante o foco da partida.

## Conferência

- `npm run build`: passou (aviso já existente de chunks grandes).
- `testa-cenas-bairro-central.mts`: passou, incluindo prioridades, fatos, variação, histórico e câmera.
- `testa-carreira-sem-ajuste-inicial.mts`: passou, com catálogo e Julinho 81–92 preservados.
- `testa-janela-nova.mts`: passou, incluindo venda protegida por formação e a virada do leilão. O teste emite aviso de porta HMR ocupada, sem impedir suas verificações.
- Playwright com Chromium/SwiftShader: quatro painéis do Mercado em 390 e 1440 px, paginação, elenco protegido e ausência de overflow/erros; cenas reais boteco, balada e carreata, botão Ver no mapa, retorno e redimensionamento. Não é medição de FPS em Samsung S25.
- Capturas e relatórios: `/workspace/shared/mercado-cenas-20261124/`.

A bancada usa dados locais de teste, sem entrar na conta de Diego ou alterar sua carreira. Vite foi iniciado com `DEPLOY_BASE=/` para manter uma única identidade dos módulos; misturar URLs com e sem base na bancada duplicava os estados de escudos/controle. O build de produção conserva a configuração nativa.

## Reversão

Reverter o commit desta entrega restaura o Mercado e a apresentação anterior das cenas, sem migração de banco ou de saves. O histórico local de cenas lidas pode permanecer; a versão anterior não o consulta. Não recarregar automaticamente os aparelhos com o jogo aberto.
