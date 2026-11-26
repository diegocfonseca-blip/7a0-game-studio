# Vídeos opcionais — base técnica (26/11/2026)

Diego decidiu seguir com vídeos para monetizar sem procurar patrocinadores. Consultado sobre aprovação H5, respondeu que não sabe. **Estado: base técnica testada, integração pública e monetização ainda não ativadas.** O script AdSense e o ads.txt existentes mostram um publisher instalado; não comprovam aprovação do site, do produto H5 ou anúncios disponíveis.

## O que está implementado

`src/monetizacao/video-recompensado.ts` adapta a fila oficial de AdSense H5 e contém o fluxo de oferta, aceite, vídeo e fechamento. Não há import em entrypoint nem inicialização automática: nenhuma mudança no que o público recebe. Não injeta script duplicado, não muda o index.html, não abre anúncio ao importar, não concede item/OVR/moeda e não altera save ou banco.

- Gate explícito de aprovação: false bloqueia até a chamada ao fornecedor.
- Oferta só depois de `beforeReward`; o chamador deve mostrar a recompensa exata. Apenas aceite explícito chama a função de exibir.
- Guard de pausa segura antes do pedido e novamente no aceite. Não acoplar a sessão online, pregão ou partida em andamento. Usar pós-partida solo/pausa sem relógio ativo na primeira integração.
- Uma instância por documento e apenas um pedido ativo nessa instância. Duplo clique, oferta recusada/expirada e callbacks antigos não iniciam outro anúncio.
- Pausa temporária apenas em `beforeAd`; restauração idempotente por `afterAd`/`adBreakDone`. O chamador fornece suspensão de áudio/fluxo e sua restauração, preservando as preferências anteriores. Não pausar a sala online inteira por conta de um vídeo individual.
- Resultado `viewed` requer aceite, início e callback oficial `adViewed`; só é entregue ao chamador ao fechar via `adBreakDone`. `breakStatus` por si só, clique no anúncio ou contador local não comprovam conclusão. Oferta sem resposta expira; anúncio aceito não é interrompido por timer para retomar jogo por baixo dele.
- Cancelamento, falta de inventário, erro e vídeo fechado antes têm resultados próprios. Erros de limpeza não deixam a Promise presa.

`viewed` é um resultado do SDK, não um recibo financeiro nem crédito persistido. A futura concessão de item deve ser idempotente e respeitar a conta/limite diário. Este módulo não é uma implementação de validação antifraude no servidor nem de limite entre aparelhos.

## Caminho de ativação

1. Entrar no AdSense da conta que tem o publisher já usado pelo site e conferir se `leilaolegends.com` está aprovado. Acesso à conta não está disponível nesta sessão; não se pode deduzir aprovação do código HTML.
2. Confirmar ou solicitar acesso ao **H5 Games Ads**, produto que aceita HTML5 de navegador. Formulário oficial: https://adsense.google.com/start/h5-game-ads-apply/ (ligado pela documentação oficial de inscrição). Não alterar o publisher para outra conta por tentativa.
3. Escolher e apresentar a recompensa exata e a posição do botão para revisão: proposta é extra exclusivamente visual, sem OVR, contratação, carta de campeão, moedas da carreira ou benefícios exclusivos dos planos. Começar com até dois vídeos opcionais por dia, com contagem de conta entre aparelhos antes de promover para público.
4. Conectar o controlador a uma pausa real do jogo e à suspensão temporária de áudio; criar o botão e o retorno de indisponível/recusa. Nenhum usuário precisa assistir para continuar normalmente.
5. Testar a integração em modo de anúncios de teste (`data-adbreak-test="on"`) e nunca produzir cliques/impressões pagos de teste. Este trabalho validou o fluxo com transporte simulado, sem carregar anúncios pagos.
6. Após confirmação do acesso H5, revisão visual e testes do fluxo completo, ativar a integração e medir impressões monetizadas, disponibilidade, conclusão, receita e retenção. Aprovação e inventário não garantem receita; vídeo não tem preço fixo universal.

O Google pode fornecer formatos diferentes no programa H5. A modalidade recompensada é opt-in, mas não prometer duração fixa ou que toda tentativa terá um vídeo.

## Fontes oficiais consultadas

- Elegibilidade/aprovação: https://developers.google.com/ad-placement/docs/signup
- Formatos: https://support.google.com/adsense/answer/9959170
- Callbacks de recompensa, aceite e conclusão: https://developers.google.com/ad-placement/apis
- Tag existente, fila e modo de teste: https://developers.google.com/ad-placement/docs/example

## Validação e reversão

Teste: `node --import /home/agent/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/loader.mjs scripts/testa-video-recompensado.mts` neste ambiente, ou `npx tsx scripts/testa-video-recompensado.mts` com tsx disponível. Cobre bloqueio sem aprovação/pausa segura, opt-in, clique repetido, concorrência, callbacks atrasados/duplicados, sucesso, recusa, indisponibilidade, expiração e falhas do SDK/limpeza.

Preparação em branch separado; módulo ainda não importado pelo jogo. Sem novidade pública, sem rollout, sem SQL ou novas dependências. Remover o módulo e teste reverte integralmente esta preparação.

Texto de candidatura pronto, sem dados pessoais inventados: `/workspace/shared/videos-opcionais-20261126/pedido-google-h5.txt`. Site e publisher conferidos no código; dados da conta e aprovação precisam ser confirmados pelo titular.

Resultado: 26 verificações passaram; `npm run build` completo e `npm run recarga` passaram. Sem anúncios pagos de teste, interação com conta Google, concessão de itens ou dados de usuário alterados.
