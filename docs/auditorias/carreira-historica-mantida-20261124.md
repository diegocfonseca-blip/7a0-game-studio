# Decisão final: preservar o futebol histórico e as melhorias aprovadas

Em24/11/2026, após discutir as alternativas, Diego decidiu: “vamos deixar com todas as mudanças que você fez no planejamento lá em cima, mas manter como está”; a modalidade com jogadores atuais será outra etapa.

Esta decisão substitui a autorização anterior de experimentar hierarquia inicial. Em seguida, Diego autorizou expressamente publicar todo o pacote aprovado: “Publique então tudo já”.

## Escopo mantido

- Contratos e valores de referência também nos atletas recebidos na largada. Salários desdeT4, para humano e bots; taxa de transferência continua separada do valor salarial/contratual. Renovação de elenco e comissão segue as regras aprovadas.
- Proteção de onze jogadores e cobertura por posição nas saídas, incluindo saídas pendentes. Reposição legítima usa atletas reais disponíveis; não cria personagem fictício para contornar o mínimo. Categorias permitidas por divisão continuam valendo para os dois lados.
- Mercado nacional pago, com orçamento/compromissos dos bots, ganhos para o XI e reservas negociáveis sem desmontar o vendedor. Proteção do alvo humano sondado, um negócio entre clubes por comprador/janela e conservação financeira. Sem venda forçada do elenco humano. Sondagem humana conserva acesso ao mesmo universo nacional, com o olheiro e as demais restrições existentes.
- Escalações reais, planos, condição física e rodízio coerentes entre liga e copas. Registro/reabertura das partidas sem cobrar cansaço duas vezes ou trocar resultados já vistos. Clube brasileiro fora da divisão nacional usa seu elenco salvo nas copas.
- Correções anteriores de economia, contratos, calendário e inscrições continentais continuam no trabalho local. Não reintegrar eliminado à mesma Libertadores. A parte incompleta da classificaçãoD/estaduais permanece como Diego pediu.
- Textos de início explicam sorteio histórico, caixa, contratos e salários. Não houve adição de jogadores nesta retirada nem envio de cartas extras às salas online.

## Experimentos retirados

- Nenhuma nota canônica é reduzida para encaixar um clube na divisão. **Julinho fica81–92**, desde a largada.
- Nenhuma penalidade oculta fica no jogador, desaparece na transferência ou muda preço/salário.
- Não foi implementada a sugestão de limitação coletiva por estrutura, nem prazo mínimo obrigatório para subir.
- O ranking externo pesquisado é apenas material arquivado. Não dá bônus/penalidade ao motor, não escolhe vencedores e não garante que um clube histórico chegue ou ganhe a SérieA. O ranking diagnóstico por elenco permanece separado.

Os motores físico e estatístico voltaram a ler as faixas originais. As quatro alterações experimentais de `motor2/` foram retiradas integralmente, preservando as demais regras da base. Criação de carreira, catálogo, reforços e copas não consultam mais a calibração. O bônus nativo da Copa do Brasil permanece no seu comportamento anterior ao experimento.

O indicador `HIERARQUIA_INICIAL_CARREIRA` está desligado e não é importado pelo produto. Tipos antigos ficam apenas para reconhecer e limpar fotografias de bancada. Se uma delas for aberta, o sincronizador restaura as notas canônicas, retira as marcas e mantém pagamentos/contratos. Saves públicos não receberam esses experimentos, pois não houve publicação. Fotografias de partidas já guardadas continuam fora da atualização do catálogo.

## Verificação da retirada

- `testa-carreira-sem-ajuste-inicial.mts`: Portuguesa, Gama e Flamengo; todos os elencos e sobras do pregão iguais ao catálogo, sem ajuste ou marca inicial, mercado nacional155, reload estável e limpeza das bancadasv1/v2. Julinho81–92, sem efeito de uma marca órfã sobre os dois motores, contratos/pagamentos preservados.
- Regressões de transferências, mercado em quatro mundos, economia, mínimo de elenco e copas, incluindo reabertura integral dos71jogos doPaulista.
- Abertura real390/1440px com faixas e salários originais; sem textos de penalidade, overflow ou exceção. Capturas em `/workspace/shared/carreira-historica-mantida-20261124/telas/`.
- Build TypeScript/Vite e `git diff --check`.

Os resultados das simulações dos experimentos de notas e ajuste oculto **não descrevem esta versão mantida**. As simulações anteriores com o futebol histórico mostraram acesso e rebaixamento na primeiraA, sem demonstrar título daA nos trechos acompanhados. Esta decisão não acrescenta promessa de prazo ou campeonato.

Publicação autorizada em24/11 após as verificações. Integrar com a main atual, repetir os testes afetados e conferir o deploy. Nenhuma conta real foi alterada pela bancada.
