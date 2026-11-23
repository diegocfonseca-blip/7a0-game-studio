# Plano de jogo persistente — 23/11/2026

Diego rejeitou a proposta de reorganizar a aba Partida no celular: manter as
abas separadas e corrigir somente o plano que voltava ao padrão por partida.
O mockup de 23/11 continua fora do aplicativo; nenhum CSS ou arranjo foi alterado.

## Causa e comportamento

O painel mantinha mudanças em um rascunho identificado por sala, semente e
**rodada**. Apenas uma ordem ao vivo aceita gravava o plano completo. Fora dessa
janela, as instruções podiam aparecer selecionadas, mas eram descartadas na
rodada seguinte. A postura tinha ainda o caminho antigo `SET_TACTIC`.

Nas salas do teste autorizado, tocar em postura, caminho do ataque, pressão ou
ritmo agora salva a escolha no estado da sala (`footballNextPlans`, por ID de
técnico). Não depende de apertar Enviar ordens para lembrar o plano.

- A próxima rodada copia essa escolha para o plano efetivamente usado na
  simulação. Continua nas rodadas seguintes até o usuário mudar.
- O resultado já calculado, os lances, a classificação e o relógio não mudam
  simplesmente ao salvar. **Enviar ordens** mantém o comando explícito para
  aplicar durante a partida, com as mesmas proteções de passado imutável.
- Uma ordem ao vivo aceita também atualiza a escolha persistente.
- O estado guardado/retransmitido da sala carrega a preferência; reentrada
  não depende de um rascunho local do componente.
- O seletor antigo de postura atualiza uma preferência existente, evitando que
  o plano salvo sobreponha uma nova decisão ao voltar ao visual anterior.
- O painel aguarda confirmação do estado autoritativo para anunciar que salvou.
  Sem confirmação em sete segundos, mostra falha e volta à escolha confirmada.

## Escopo e segurança

Mantido o teste do motor: futebol online, liga criada/conduzida pela conta
principal de Diego, com os participantes de teste já autorizados. Nenhuma
liberação geral, de carreira, basquete, Kings ou recálculo de copas. A interface
continua nas duas contas já liberadas: Diego principal e Futpoint.

O participante pode enviar **somente a preferência para próximos jogos** pelo
caminho existente convidado → dono. O dono valida o plano e a correspondência
entre UID do participante e ID do técnico; o `youIdx` local do dono não escolhe
o destinatário. O convidado continua sem poder enviar ordens de recálculo ao
vivo. Prova local, janela da partida e demais limites dessas ordens permanecem.

Nenhuma tabela, consulta, canal ou eleição de host foi adicionada. Cada mudança
usa o envio de ação já existente; o estado seguinte confirma o salvamento.
Ao criar jogo novo, o campo é limpo junto das marcas do modo anterior.

## Verificação

- `scripts/testa-football-plano-persistente.mts`: cinco rodadas, comparação com
  simulação de plano ativo, serialização/retomada, participante separado,
  reordenação de assentos, ações inválidas, exclusões, seletor antigo, envio
  ao vivo e preservação de resultados/RNG com plano neutro.
- Regressão existente das ordens ao vivo: 40 continuações, 80 pares de
  simulações, passado, gols/assistências, tabela, limites e identidade.
- `scripts/teste-football-full/verifica-plano.mjs`: 53 verificações em
  390/1440 px, com seleção, abas, três avanços reais, reentrada e substituição
  da escolha anterior; nenhuma exceção JavaScript.
- Teste de acesso privado e `npm run build` passaram.
- Regressão geral da interface: 651 verificações passaram, sem exceções JavaScript.
- `testa-carreira-limpa.mjs`: a nova marca está coberta e as duas primeiras
  verificações passam. A auditoria geral de campos acusa `careerSubModeDesde`,
  também na base anterior sem esta correção; não foi alterado esse campo de
  carreira neste trabalho.

Evidências: `/workspace/shared/plano-persistente-20261123/`. Bancada isolada,
sem entrar em salas reais; não equivale a duas sessões autenticadas ou ao S25.
