# Reorganização da aba Clube — 15/11/2026

Diego autorizou publicar a reorganização após aprovar a proposta revisada: Meu clube, Meus negócios e Minha vida. Aplicação exclusiva à prévia privada já confirmada pelo servidor; mapa público continua desligado. Referência aprovada: `/workspace/shared/clube-organizacao-proposta-20261114-v02/antes-depois-proposta.pdf`.

## Entrega

- Título “Seu clube”, com clube, temporada e divisão. Retira a navegação que tinha apenas o botão Mapa. Caixa do clube no comando aparece uma vez, junto dos acessos.
- Mapa em destaque e na mesma instância. Acessos abaixo no celular, ao lado no computador: Meu clube (Finanças, Estádio e obras, Patrocínios, Loja e Museu), Meus negócios (Agência, SAF e segundo clube), Minha vida (Casa e garagem, incluindo móveis, veículos e personagem).
- Nome do estádio editável com rótulo acessível; capacidade identificada como lugares construídos. Torcida, bilheteria e previsão de público continuam consultáveis, recolhidas. Replay, teto e créditos mantêm as condições existentes.
- Obras abre o painel existente sem repetir o estádio. Cartas concluídas ficam em detalhes; pendentes aparecem primeiro. Preço do próximo investimento, benefício, requisito, falta de moedas e saldo posterior usam os valores reais. Obras usam as mesmas condições do projeto que antes estavam junto do mapa, inclusive pavimentação e estacionamento por etapas. Os reducers e os preços não foram modificados.
- SAF e segundo clube têm acesso próprio, sem ficar na cauda de uma lista de obras. Preserva compra, venda, empréstimos, comando, plano, janelas e caixas separados. A loja sem liberação leva às obras; agência sem sistema novo leva ao escritório existente.
- Finanças identifica o clube no comando e a temporada do extrato. Valores futuros não são apresentados como caixa disponível. Patrocínios continuam com o contrato Master antes dos demais; Agência mantém clientes/receitas antes de estrutura/coleções. Loja, Museu e Casa usam os painéis existentes, sem duplicar recompensas ou novas compras.
- Roteiro de encerramento permanece em Jogos, para a conta da prévia. Fora de Jogos, apenas aviso compacto de uma pendência real, com acesso a Jogos. Verificação de sessão tem mensagem própria. A Copa do Mundo é identificada quando é a pendência. A frase contraditória “nada pra fazer aqui” foi substituída pela orientação da etapa real.

## Limites preservados

As mudanças estão subordinadas a `mapaComoClube`, que exige a conta verificada, carreira compatível e acesso privado atual. Outra conta continua com a apresentação existente. Nenhum canal, consulta, gravação, migração ou sincronização nova. Sem mudança em partidas, calendário, regras de premiação, saldos ou bens. NPCs e passeio não foram alterados; chat por proximidade continua desligado.

## Verificação

- `node scripts/teste-clube-organizacao/verifica.mjs`: navegador com identidade simulada e rede externa bloqueada. Carreira em 390/1440 px, conferência de 320 px; oito acessos reais; mesma instância do canvas ao abrir/fechar; navegação não altera o save; obras concluídas recolhidas; compra local de Camarote cobra 20 e soma 20 ao investimento. Outra conta fica sem reorganização e sem mapa.
- `node scripts/imersao-mapa/test-map-private-gate.cjs`: trava privada, logout e renovação da sessão.
- `npm run fim`: regressão do roteiro obrigatório.
- `npm run build`: TypeScript e build completo antes do commit.

Capturas e resultados em `/workspace/shared/clube-organizacao-20261115/`. Testes em bancada local com estado anonimizado; não representam validação autenticada na conta real nem medição de desempenho no telefone de Diego. Reversão: reverter o commit desta entrega, sem alterar as chaves privadas ou o passeio publicado anteriormente.
