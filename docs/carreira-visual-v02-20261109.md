# Carreira — visual versão 02

Aprovação de Diego: “Ok faça todos da versão 02”. Referência: 35 telas da proposta de 08/11 e revisão das telas 12, 14, 15, 17, 18 e 22 em 09/11. Implementação na branch `feature/carreira-visual-v02-20261109`, a partir de `8605a139` (preserva as correções recentes de Liga Draft).

## Escopo implementado

| Telas | Conteúdo e organização |
| --- | --- |
| 01 | Central com próxima ação principal, apoio lateral, atalhos reais para jogos, elenco, finanças e agência; salvar continua acessível. |
| 02, 04–08 | Elenco com navegação funcional entre visão geral, formação, reservas e comissão/base. Lista antes do campo no celular; campo e lista lado a lado no desktop. Formação, A/B, comissão e base usam seus controles existentes. Explicação do XI fica depois da escalação. |
| 03, 09–11 | Rankings de clubes, gols, assistências e Bola de Ouro com largura útil e contexto separado. |
| 12 | Imprensa ampla, indicadores acima das duas colunas; rolagem e fechamento no celular. |
| 13 | Moldura e identificação do mapa no padrão da carreira, sem deslocar ou reconstruir a cidade. |
| 14 | Casa, garagem e coleção com os cartões reais; resumo também disponível no celular. |
| 15 | Resumo financeiro → filtros → extrato/transferências. Sem o espaço imposto pela antiga linha da grade. |
| 16 | Clientes e decisões antes das obras/coleções; receitas ao lado no desktop. |
| 17 | Título próprio de patrocínios; Master/meta e material/TV em colunas legíveis. |
| 18 | Manto antes de vendas no celular; vitrine e vendas/fornecedor lado a lado no desktop. |
| 19–20 | Catálogo de veículos e consulta da Arena no mesmo painel visual, preservando compra, garagem e consulta sem sair da carreira. |
| 21–23 | Competição e rodada como título. Partida e classificação têm alternância de apresentação; a partida permanece montada. Tabela inteira de 20 clubes, outros jogos ao lado no desktop/abaixo no celular e publicidade depois. Placar/2D continuam nos controles existentes. |
| 24–26 | Preparação do mercado com sequência visível, sondagem e lista de vendas. Contratos pendentes de jogadores ou comissão recebem prioridade na coluna principal, sem refazer a regra de renovação. |
| 27–28 | Jogadores listados à esquerda e envelope/equipe à direita; cabeçalho com contraste também no celular. Valor e confirmação antes do impacto financeiro no modal de lance. |
| 29–31 | Lesão e substituto com contraste; intervalo com plano e listas separadas; pênalti com cobrador, direção, força, narração e confirmação organizados. |
| 32–33 | Etapas identificadas, balanço antes dos lançamentos e continuação original. Totais de apresentação calculados exclusivamente do ledger já selecionado pela tela existente. |
| 34–35 | Busca funcional de jogador/clube sobre os candidatos já permitidos; técnico atual ao lado das alternativas no desktop. |

## Limites preservados

- Componentes React e CSS escopados à carreira solo de futebol. Não há movimentação de nós do DOM por scripts de mockup.
- Contexto desativado em salas online, carreira online compartilhada/co2 e basquete. Nenhuma alteração nos reducers, motores, sorteios, preços, categorias, descanso, probabilidades ou gravação de saves.
- Direitos de plano, cor de identidade, acesso a mapa/campo e permissões continuam nas funções existentes. Nenhum novo acesso é concedido pela apresentação.
- Não foram adicionados modelos, texturas, dependências ou consultas ao servidor.
- Testes visuais usam cópia local e chamadas externas bloqueadas; os arquivos particulares de teste e o save não entram no commit.

## Validação

- Build de produção: `npm run build` (`tsc -b && vite build`).
- Regressões: `npm run vigias`, `npm run coletiva`, `npm run escalacao-ab`, `PW_CHROME=/usr/bin/chromium npm run cobrador`.
- Navegador: 35 telas em 1440×1040 e 393×900, sem overflow horizontal da página; seis telas revisadas conferidas novamente.
- Interações: navegação mantém a rodada, A/B, comissão/base, busca, Escape da imprensa e seleção de canto → força → resultado do pênalti. Classificação completa e posição dos outros jogos verificadas no DOM.
- Encerramento sem coluna vazia: balanço medido com 1248 px úteis no desktop. Identidades prata/bege mantêm seus próprios degradês; o contexto V02 fica desativado em online, co2 e basquete. Bundle de produção abriu sem erro de JavaScript.
- Evidências locais: `/workspace/shared/carreira-visual-v02-implementada-20261109/`.

## Publicação

Publicação autorizada por Diego em 09/11: “Ok terminando piblique”. Integração preserva `445a6982`, incluindo as correções recentes de leituras e pedidos das ligas. O envio para `main` aciona o workflow oficial `Deploy to GitHub Pages`; conferir o job `deploy` antes de anunciar conclusão. O processo existente mantém os assets anteriores e não recarrega partidas abertas. Nenhuma mudança de banco faz parte desta entrega visual. Reversão: reverter o commit visual; não há migração de dados.
