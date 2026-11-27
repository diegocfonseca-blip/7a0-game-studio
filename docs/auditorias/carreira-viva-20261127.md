# Carreira viva — 27/11/2026

## Escopo autorizado

Diego confirmou os itens originais 1, 2, 3, 5 e 6: estreia melhor, personalidade das lendas, memória dos clássicos, momentos para compartilhar e apresentação das estruturas. Excluídos o desafio semanal na Partida Rápida (4) e todos os modos novos sugeridos depois. Implementação compartilhada pelas carreiras tradicional e Brasil Oficial; sem mudanças de regras esportivas, notas, salários, mercado, treinamento, CT ou planos.

## Comportamento

- Primeira temporada: uma dica por rodada nas quatro primeiras rodadas da liga, dispensável por etapa ou de uma vez. Avisos existentes de desbloqueio têm prioridade. Na tradicional o texto explica o leilão; no Oficial, o elenco herdado. Mesmas chaves `careerSeen` já persistidas. Pular essas dicas não esconde futuros desbloqueios.
- Personalidade: quatro variações determinísticas para cada tipo de episódio de balada/futevôlei já sorteado, mantendo jogador, decisão e rodada de origem. Nenhum novo sorteio ou punição. Dois ou mais gols, ou duas ou mais assistências geram destaque positivo somente após a revelação. O registro guarda no máximo dois protagonistas por jogo, dentro do limite existente de 120 jogos. IDs estáveis do histórico recuperam o avatar correto, com clube canônico; sem criar jogador ou avatar.
- Clássicos: próximo rival efetivo (ou adversário do pós-jogo) pode mostrar o último placar e, ao abrir, contagens, goleada e compras vindas do rival. Somente rival declarado/arquirrival da carreira e partidas já registradas; o texto informa que o acervo não representa toda a história real. Sem reconstruir temporadas ausentes.
- Compartilhar: até quatro opções de resultado, contratação, título já confirmado, acesso confirmado e goleada. Reutiliza o gerador PNG do elenco, escudo, manto, cores e avatares existentes. Explica que a imagem contém o elenco atual. Abrir/gerar não muda moedas nem rodada. Compartilhamento nativo cancelado não baixa arquivo; falha/indisponibilidade usa download PNG. Nenhuma mensagem é enviada automaticamente.
- Obras: detalhe recolhido em setores, gramado, extras e estacionamento. Próximo custo exato, percentual, lugares, vagas e projeção pela mesma lotação usando os mesmos cálculos do jogo. Loja explicita renda variável. Informa ausência de cobrança adicional específica, sem alterar qualquer transação. Usa o lote real do estacionamento para projetar etapas. Obra pronta não apresenta próxima compra inexistente.

## Compatibilidade e apresentação

Campos opcionais; saves sem destaques continuam válidos. Leitura de coletiva parcial passa a tolerar ausência de `feitas`. Memória continua limitada e idempotente. Nenhum SQL, autenticação, tabela, intervalo de sincronização, recarga ou nova renderização 3D. Reutilizados os cartões, tipografia e componentes atuais, sem novas artes ou dependências. PT/EN. Online e basquete excluídos dos recursos novos por guardas de modo.

Bancada sem contas/saves reais: carreira Oficial nativa (Grêmio) e tradicional nativa (leilão Futpoint FC), 390 e 1440 px. Histórico e estádio incompleto são preparados apenas na bancada para exercitar as telas; nenhum resultado demonstrativo é gravado em conta real. WebGL desativado para isolar a UI: estas provas não medem desempenho de animações/3D.

## Validação e publicação

Verificado: 75 asserções do modelo novo e 38 verificações no navegador (quatro cenários: dois modos × dois tamanhos), sem erros JavaScript; compra real de 20 moedas confere com a prévia. Regressões existentes de cenas, saves, paridade, tabela pós-jogo e `npm run recarga` passaram. O executor SSR tentou abrir o WebSocket de desenvolvimento sem permissão de rede; o aviso do ambiente não impediu as asserções. A bancada de navegador usou apenas rede local autorizada.

Testes e capturas: `scripts/testa-carreira-viva.mts`, `scripts/teste-carreira-viva/servidor.mjs`, `scripts/teste-carreira-viva/verifica.mjs`. Regressões existentes de cenas, persistência e paridade. `npm run build` completo passou (TypeScript + Vite, saída em `/tmp`); `npm run recarga` passou. `git diff --check` passou. Capturas e relatório estão em `/workspace/shared/carreira-viva-20261127`.

Diego aprovou as prévias e autorizou explicitamente publicar em 27/11. Entrega em `feat/carreira-viva-20261127`, com integração da main atual, build completo e acompanhamento do deploy.
