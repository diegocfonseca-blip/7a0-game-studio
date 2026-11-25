# Evolução da carreira — 25/11/2026

Pedido: implementar a proposta de melhorias, **exceto os itens 4 e 8**. Trabalho preparado na branch `feat/carreira-evolucao-20261125`; publicação autorizada pelo Diego após a revisão das telas: “Publique então”. Mantidos o visual aprovado, os OVRs originais e a decisão de manter o modo histórico, sem nerf oculto ou nova calibração de acesso.

## Entrega

- **1 — Guia:** distingue Brasil Oficial/tradicional, mercado/elenco histórico, cartinha de coleção/jogador, compra/folha anual/renovação, três apresentações da partida e conta grátis no aparelho/plano com nuvem. Ajuda anterior do basquete preservada.
- **2 — Próximo passo:** pendências de elenco, intervalo, pênalti e preparação da temporada aparecem com ação e motivo na Central. Nenhuma nova decisão obrigatória ou avanço automático.
- **3 — Finanças:** simulação de caixa após a próxima folha conhecida (inclusive comissão), renovações escolhidas, compra e salário planejados. Reutiliza valores e custos nativos; não cobra nem bloqueia dinheiro. Receitas futuras não são antecipadas.
- **5 — Copas compatíveis:** jogos do clube calculados pelo motor M2 recebem substituições/táticas no placar, 2D e estádio 3D, e Raio-X na Central. Inclui a esteira nacional, estadual e continental que usa `jogoCopaM2`. Espectadores, salas online, seleções com elenco próprio e apresentações sem entrada M2 mantêm seus fluxos anteriores. Não oferece controle fictício sobre uma partida sem entrada física válida.
- **6 — Formação ao vivo:** opções do técnico e jogadores reais por posição; preparação de várias trocas seguida de confirmação única. Até três substituições somando jogo e intervalo, sem retorno de quem saiu. Esquema vale apenas naquela partida. Reorganiza os atores existentes sem ressuscitar expulsos nem reescrever a simulação anterior à decisão. Comandos repetidos não criam outra revisão.
- **7 — Técnico:** mostra cada esquema liberado, se o elenco consegue montá-lo e as posições que faltam. Explica sua contribuição nativa à equipe; não cria bônus novo nem altera cartas/categorias.
- **9 — Transferências:** novos negócios guardam temporada, rodada, método, preço, edição da carta e vendedor quando identificado. Notícias com comprovante abrem os negócios daquele jogador. Dados ausentes de saves antigos permanecem desconhecidos. Registro limitado a 500 operações.
- **10 — Memória do clube:** acervo existente ganha filtro por temporada, partidas recentes, maior vitória, sequência invicta e números dos atletas conquistados naquele clube. Só registra jogos encerrados/revelados, uma vez por partida. Mantém 120 partidas detalhadas, até 200 temporadas agregadas e 300 atletas. Taças, campanhas e acessos do acervo anterior continuam disponíveis. Não reconstrói estatísticas antigas ausentes.
- **11 — Cidade:** cenas de recorde e saída confirmada complementam títulos, acesso, estreia, obras e eventos já existentes. Mesmos cenários, câmera e NPCs do jogo. Possibilidade de rever os momentos da semana; pular não altera calendário, placar ou dinheiro.
- **12 — Organização e longevidade:** componentes pequenos reutilizam o tema atual. Escrever memória não clona o save inteiro nem invalida os dados da simulação. Testes de carreira longa, retomada e navegação, além de imagens reais em 390 e 1440 px.

**Fora:** recomendações/comparações de contratações no mercado (4) e análise automática após cada partida (8). O acervo de resultados consultável não cria esse resumo. Sem mudança econômica, de força inicial ou de limites de contratação.

## Correções encontradas na validação

- A copa não repassava `pausado` ao `LiveScoreCard`; com o painel aberto o relógio ainda avançava. Agora o mesmo sinal chega ao placar e ao campo.
- O progresso da copa mede 90 segundos físicos, enquanto o relógio público mostra 93 minutos. A ordem usa o instante do motor, inclusive na volta; não aplica a conversão duas vezes.
- A identidade de uma partida da liga usa sementes próprias de divisão/fase. A guarda confere a identidade e a rodada da entrada efetiva, sem presumir que a semente é a geral da temporada.
- O jornal da copa distingue rodada de pontos corridos de mata-mata em jogo único.
- A assinatura das ordens ao vivo inclui formação; ordens antigas sem esse campo mantêm a assinatura anterior.

## Validação

- `npm run build` com `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao`: TypeScript e Vite.
- `scripts/testa-carreira-evolucao.mts`: troca atômica de esquema, posições, repertório, limite compartilhado com intervalo, prefixo imutável, ausência de retorno, fora de combate, mando/volta, idempotência, OVR preservado, comprovação de notícias e 535 amostras da formação na trilha 3D comparadas com o motor oficial.
- Log de memória: 1.800 jogos / 30 temporadas, repetição sem crédito duplicado, 120 detalhes preservados; **15.504 bytes** de memória adicional nesse cenário.
- Regressão anterior de troca ao vivo: 12 jogos, passado preservado e replay igual ao jogo ao vivo.
- Regressão de movimento: 1.075 quadros e 253 posses da trilha 3D conferidos.
- Regressões nativas de mercado: conservação de caixa, proteção do XI, categoria, salários, sondagem, Julinho preservado e estadual paulista com 71 jogos/reabertura estável.
- Navegador: placar móvel com retomada, campo 2D móvel, última rodada em desktop e estádio 3D em desktop; três trocas, quarta rejeitada, táticas, pausa, retomada e apito. Sem erros de página.
- Telas novas: 390/1440 px, simulação financeira, técnico, preparação/confirmação de formação, memória e substituição/pausa/Raio-X na copa. Sem erros de página.
- Carreira nativa: **25 temporadas**, uma semente e uma política automática de gestão, incluindo mercado, venda/compra e renovação. Save final de **1.379.505 bytes**, 241 negócios; retomada manteve temporada, caixa e transferências. Central/Elenco/Mercado da T26 abriram em ambos os tamanhos. Esse ensaio mede longevidade, **não valida dificuldade ou probabilidade de acesso**. Nenhuma regra de equilíbrio foi alterada em função dele.

Tudo foi executado com fixtures locais; nenhuma conta real foi alterada. O teste de navegador usa Chromium no ambiente de desenvolvimento e não representa medição de FPS em celular físico. Não houve migração nem novas chamadas diretas ao Supabase.

## Revisão visual

Capturas reais dos componentes do jogo, em `/workspace/shared/carreira-evolucao-20261125/`: `guia-*`, `financas-*`, `tecnico-*`, `formacao-*`, `memoria-*`, `copa-*`, `copa-central-*`, `carreira-longa-*`. Relatórios `browser.json`, `long-browser.json` e `longevidade/longevity.json`.

Diego recebeu as capturas e autorizou expressamente commit, push e publicação desta entrega. A publicação usa `main` e o workflow de GitHub Pages; o resultado do deploy deve ser conferido antes de confirmar que está no ar.
