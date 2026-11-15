# Proposta para a aba Clube — 14/11/2026

Atualização de 15/11: Diego aprovou e pediu a publicação da revisão v02 (Meu clube / Meus negócios / Minha vida). Implementação e validação documentadas em `docs/clube-organizacao-20261115.md`; histórico abaixo preserva a fase de proposta.

Pedido de Diego: entender o cartão “aparece uma vez por temporada” e reorganizar a área do Clube no padrão visual atual, com sugestões adicionais. Entrega desta etapa: diagnóstico, proposta e mockups. Nenhuma mudança de produção ou publicação.

## Aviso deslocado

Em `pyramidseason.tsx`, a frase pertence ao passo 3 do roteiro de encerramento. O cartão `cv2-season-flow` pode continuar aparecendo na área lateral usada por outras abas. A descrição ficou sem a campanha correspondente, produzindo o quadro isolado mostrado no Clube.

Quando `intlPendente` é verdadeiro, `copaGate` não aparece, mas a frase genérica permanece. “Continuar” recebe `travado={mundoPendente || intlPendente}`. Assim, “Nada pra fazer aqui” contradiz a própria trava e não diz do que se trata. A frase não descreve frequência de abertura do mapa, ambulantes ou eventos da cidade.

Na temporada 47 da foto, a legenda identifica o caminho internacional. O código também considera pendente a autenticação ainda não resolvida; a imagem não confirma o estado dessa verificação. Não inferir uma competição ou fase específica a partir dela.

Proposta:

- Roteiro completo, campanha e continuação ficam em Jogos. Tirar o cartão solto de Clube, Elenco e Rank.
- Fora de Jogos, mostrar apenas uma notificação compacta quando houver uma pendência real: “Temporada internacional pendente” + “Conclua a campanha em Jogos para seguir à próxima temporada” + acesso a Jogos.
- Durante validação da sessão, mostrar “Conferindo sua temporada…”; não afirmar que falta jogar.
- Se a pendência for a Copa do Mundo, usar seu nome e sua ação específica. Sem pendência, não renderizar o aviso.
- Não mudar as travas, o roteiro oficial, os prêmios ou o avanço da temporada.

## Organização proposta

1. Título “Seu clube”, já com clube/temporada/divisão. Remover o botão isolado “Mapa”, que hoje representa uma navegação com um único destino.
2. Nome do estádio, edição identificada e nível na mesma moldura. Capacidade e conclusão abaixo, sem confundir lugares com quantidade de torcedores.
3. Mapa continua em destaque. No celular, gestão fica abaixo; no computador, ao lado. As capturas reais de teste são preservadas no protótipo, sem desenhar outra cidade ou cortar controles.
4. Acessos compactos para Finanças, Estrutura e obras, Patrocínios, Agência, Loja, Museu, Casa/garagem e Clubes/SAF. São caminhos para conteúdos já existentes. Clique no prédio e atalho abrem a mesma área.
5. Replay compatível, teto adquirido e créditos ficam como ações secundárias abaixo do mapa. As regras de disponibilidade continuam as existentes. A demonstração mostra esses estados disponíveis.
6. Obras: mostrar primeiro o que ainda pode ser feito. Recolher concluídas; indicar custo, saldo depois, benefício e requisito. Não usar botão cinza sem explicar a causa. Se tudo estiver concluído, mostrar esse estado e permitir consultar o histórico.
7. Finanças: saldo do clube no comando, entradas/saídas e extrato, com contratos próximos de vencer em contexto próprio. Separar dinheiro disponível de patrimônio e previsão. Reutilizar apenas dados reais já existentes.
8. Patrocínios: contrato atual/meta/vencimento antes de ofertas; destacar a marca contratada sem multiplicar banners.
9. Agência: clientes, receitas e cartas antes de estrutura/coleção. Loja: manto, fornecedor e vendas identificados. Museu: galeria de troféus e evolução com a obra correspondente, sem nova premiação duplicada.
10. Casa: bens, garagem e personagem no mesmo conjunto. SAF/segundo clube: identificar quem está no comando, caixa de cada clube e condições de troca, empréstimo e venda; sem misturar os patrimônios.

## Artefatos e limites

Em `/workspace/shared/clube-organizacao-proposta-20261114/`: `antes-depois-proposta.pdf` (4 páginas), `proposta.html` (protótipo), imagens de celular/computador e `verificacao.json`.

O “antes” reproduz o layout da foto e os textos encontrados no código, usando uma captura real local do mapa; não é uma captura autenticada da conta de Diego. O “depois” é um mockup. Valores financeiros e estado do museu são exemplos, identificados como tais. Nome, nível e capacidade ilustram a captura enviada, não uma leitura do save.

Implementação futura deve preservar mapa montado ao navegar, permissões por conta/plano, bens e moedas, pausas ao cobrir o mapa e funcionamento das salas. Mapa público segue desligado. Não criar consultas, gravações ou modelos 3D para esta reorganização.
