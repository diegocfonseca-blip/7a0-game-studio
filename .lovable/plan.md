# Dinastia — arrumar overflow do pregão + análise dos furos

Achei coisa demais fora do lugar. Vou consertar de uma vez.

## O que estava errado

1. **O modal das 3 opções não abriu quando você levou o Cafu.** No `applyLot` (linha 1117-1130), quando você vence, o código **já executa o descarte automático** — remove o "pior" e joga no Monte antes de mostrar qualquer coisa. Só depois pergunta. Só que a pergunta usa `outcome === 'you' && droppedCard`. Em alguns casos (ex.: setor já tinha filler/preenchimento provisório, ou `atPos.length === NEED`), o descarte não dispara e o modal fica invisível — mesmo com a posição no limite.
2. **"Desistir" está bugada.** Só devolve dinheiro/elenco. Não reprocessa o leilão sem seu lance — o segundo colocado devia levar, o dono devia segurar, ou o mercado devia mandar pro Monte. Hoje simplesmente vira "ninguém levou", o que é mentira.
3. **"Dar oferta" fala em "renovar +5"** — texto herdado. Na sua cabeça (e faz sentido) é: **põe um dos seus laterais no mini-leilão**, não o cara que acabou de chegar.
4. **Vendas suas saem depois das compras.** Se você pôs o Apodi à venda E deu lance no Cafu, o Cafu resolve primeiro e estoura sem necessidade. Devia ser o contrário.
5. **Sem trava de elenco incompleto.** Nada impede começar uma rodada com <11. Precisa forçar pegar do Monte / promover filler antes da bola rolar.
6. **Piso do Monte** — você pediu na conversa anterior e está aplicado no landing (`MonteFreeAgents`), mas no fluxo do modal atual "dispensar" ainda encosta o cara com `paid` — se ele um dia custou 15, o piso tem que ser 15 mesmo indo pro Monte (já está via `floorOf`, mas preciso garantir que o registro do contrato não seja zerado quando ele sai por dispensa).

## O que vou construir

### A) Ordem do pregão: VENDAS SUAS PRIMEIRO
No `WindowAuction`, ao montar `byPos`, dentro de cada posição ordeno `lots` com `kind === 'sell'` na frente. E ao aplicar (`sealSector`), rodo os `sell` antes dos `market/aliciar` **do mesmo setor**. Assim, se Apodi vende antes, quando o Cafu chega a lateral já tem vaga e o overflow nem acontece.

### B) Novo modal de "Posição lotada" — 3 ações com a semântica que você descreveu

Abre **sempre que**, após aplicar o lote que você venceu, `squad.filter(pos).length > NEED[pos]`. Reescrevo a checagem pra não depender do "dropped" que o `applyLot` produzia — em vez disso, `applyLot` **não descarta mais nada sozinho**. Ele só adiciona ao seu elenco (sem respeitar teto) e devolve `overflow: true` quando estoura. A escolha de quem sai é 100% sua.

As 3 opções:

1. **🚫 Desistir da compra** — reverte o snapshot (dinheiro, elenco, dono no mundo, contratos, monte) **e re-resolve o leilão sem o seu lance**:
   - `market` sem outro lance → vai pro Monte com o piso que tinha.
   - `market` com rival → segundo colocado leva pelo próprio lance.
   - `aliciar` sem outro lance → o dono mantém (fica onde estava).
   - `aliciar` com dono defendendo → dono renova (contrato +5, piso = lance dele).
   - `aliciar` com rival ganhando → rival leva.
   - Atualiza a revelação exibida pra mostrar o novo desfecho de verdade (quem levou, por quanto), não um "ninguém deu lance" falso.

2. **🔻 Botar um seu no leilão** (era "Dar oferta"). Você escolhe **qual** dos seus da posição vai à venda (default: pior por `mid`). Roda `applyLot` como um lote `sell` com `floor = max(1, contrato/paid do escolhido)` — reaproveita toda a lógica de rivais (número de ofertas = `world.filter(rival).length`, exatamente como você pediu). Regras normais: sem lance ≥ piso → **cai no Monte com o piso preservado**, não some. Com lance → você embolsa, ele sai.

3. **➖ Dispensar** — você escolhe qual sai; ele **vai direto pro Monte carregando o piso** (`max(1, contract.floor ?? paid)`). Você não recebe nada. "De graça" só se o piso for 1.

Em qualquer opção, o header do modal grita a posição (`⚠️ LATERAL LOTADO`) e lista todos os candidatos com força/piso pra você trocar quem sai.

### C) Trava de elenco incompleto (antes de qualquer partida)
Novo gate em `DashboardScreen`/rota que abre a rodada: se `squad.filter(pos).length < NEED[pos]` em qualquer setor, empurra o jogador pra uma tela `CompleteSquadModal` que:
- lista os buracos por posição;
- oferece os do Monte compatíveis (com o piso deles) — se você tem grana, compra; se não tem, sistema **empresta filler grátis** (marcado como reserva improvisada, força baixa) só pra você poder jogar.
- só libera a partida quando todos os 11 estão preenchidos.

### D) Piso do Monte respeitado sempre
Quando alguém entra no Monte (dispensa, venda sem lance, mercado sem lance), grava/mantém `contracts[id].floor` = maior valor já pago. Assim, o `MonteFreeAgents` que já lê `floorOf` continua cobrando certo. Confiro que `applyLot` não sobrescreve o piso pra baixo em nenhum caminho.

### E) Textos ajustados
- Sumário final separa: "levados por você", "dispensados (foram pro Monte pelo piso X)", "vendidos por você (embolsou Y)", "livres do mercado (Monte pelo piso Z / grátis)". Sem "de graça" quando teve pagamento.
- Reveal do lote não mostra mais "vai pro monte final" quando você ganhou — só quando o lote é `market` e ninguém deu lance.

## Detalhes técnicos

Arquivo único: `src/escalacao/dinastia.tsx`.

- `applyLot`: remove o bloco `addToMe`/descarte automático. Devolve `LotResult` com `overflow: boolean` e o `incoming` intacto no elenco (com o teto estourado momentaneamente). Ajusto `dropped/droppedCard` pra ficar undefined até a decisão.
- `sealSector`: dentro do laço, se um lote gerar `overflow`, os lotes seguintes do mesmo setor **rodam depois da decisão** (fila) — senão o próximo `sell` pode achar o cara que você ainda não decidiu se fica. Solução prática: já ordeno `sell` antes; os `market/aliciar` seguintes ignoram overflow prévio (cada decisão só limita o teto do próprio setor no fim).
- `needsChoice`: passa a ser `overflow === true` (não mais `dropped != null`).
- `OverflowChoiceModal`: refeito. Recebe `onDesistir(reResolvedResult)`, `onSellOne(chosenId)`, `onDispense(chosenId)`. A re-resolução do desistir roda um `applyLot` interno com `myBid=0` sobre o snapshot pré-lote.
- Re-uso do mini-leilão: reciclo o painel de ofertas que já existe (offers = rivalsCount) — a diferença é que o piso agora é do jogador escolhido, não o `+5` fake.
- `CompleteSquadModal`: componente novo. Consome `MonteFreeAgents` + gera filler quando o cofre estiver a seco.
- Ordem dos lotes: em `WindowAuction`, `sort((a,b) => (a.kind==='sell'?0:1) - (b.kind==='sell'?0:1))` dentro de cada `byPos[i].lots`.

Tudo isolado no Dinastia — não mexe no leilão dos outros modos.
