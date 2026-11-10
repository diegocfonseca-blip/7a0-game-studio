# 📡 Economia do rádio das salas online — 10/11 (resumo pro Codex)

Objetivo do Diego: cortar **Realtime messages** e **egress** do Supabase **sem nenhum bug nas salas**
("melhor gastar do que ter bug"). Medido no banco (`esc_realtime_medidor`): o evento `state` que o dono manda
aos convidados = **~32 GB/dia**, ~54 KB por envio, ~23 envios/min por convidado. É o grosso da conta.

## 1. ✅ PUBLICADO pra todos — bio fora do rádio (−27 a −33% do tráfego)
- `store.tsx`: `packState` usa `packCom(sanitize(st), tiraBioDoRadio)`; `readState` usa `unpackCom(z, poeBioDoRadio)`.
- Carta cuja `bio` é IGUAL à do catálogo (`FICHA_ATUAL.exato`, chave `nome|clubCanon(clube)|ano`) viaja sem o texto e
  com `_b: 1`; o convidado põe a bio de volta. Bio que não bate com o catálogo vai inteira. Só o RÁDIO (o save
  `game_rooms` não muda).
- Aba velha (versão anterior aberta) lê a carta sem bio e cai em `BIOS[nome]` — nada quebra. Por isso **só a bio**:
  tirar `fame/lo/hi` daria +2% e deixaria carta sem nível na aba velha.
- `netpack.ts`: `packCom/unpackCom` (JSON com replacer/reviver), `packTxt/unpackTxt`.

## 2. ✅ PUBLICADO pra todos — 2 bugs de troca de cadeira achados pelo simulador
- Auto-cura de identidade (efeito no EscProvider): passo 0 acha o assento pelo UID (`assentoDoCracha`) quando há
  `seatUids` — antes o `myMgrIdRef` velho + assentos renumerados no "novo leilão" punham gente no time de outro (48/400).
- `CAST_SEASON_VOTE`: `if (!s.careerOnline && s.screen !== 'end') return s` — voto atrasado valia na partida seguinte.

## 3. 🟡 LIGADO SÓ NAS SALAS QUE O DIEGO CRIA — rádio em pedaços (−78% do tráfego no simulador)
- `src/escalacao/radio-pedaco.ts` (puro): `criaEmissor(tira)` / `criaReceptor(poe)`.
  - Base cheia com carimbo `b` + número `s`; no meio, só as CHAVES de cima do estado que mudaram **desde a base**
    (nunca desde o pedaço anterior) + chaves removidas `r`. Pedaço perdido não estraga nada.
  - Pedaço > 50% da base → manda base nova. Pedaço velho (`s` ≤ último) é ignorado.
  - Convidado sem a base (entrou, recarregou, perdeu a base, dono recarregou) → `'pede'` → `request_state`.
- `store.tsx`:
  - `mandaEstado(st, cheio)` substitui os 5 envios de `state` do dono (pedido de estado, voltar pra tela,
    reconexão = base nova; agrupado de 400 ms e heartbeat = normal).
  - Base vai no evento `state` de sempre (aba velha lê: tem `z`); pedaço vai no evento NOVO `stateP`.
  - `pedacoPode(ch)`: só com `radioPedacoLiberado()` (sport.ts, `RADIO_PEDACO_TESTERS` = conta do Diego como DONO)
    e TODO mundo da presença com `rp: 1` (todos os `track()` agora mandam `rp: 1`). Qualquer erro = sala inteira.
  - Convidado: `lePacote` → `criaReceptor`; `pedeCheio` no máx. 1 a cada 3 s.
- Liberar pra todos: `RADIO_PEDACO_GERAL = true` em `sport.ts`. Desligar: tirar o e-mail de `RADIO_PEDACO_TESTERS`.
- ⚠️ Isto corta **tráfego (egress)**, não o **número de mensagens** (cada envio continua sendo 1 mensagem).

## 4. Simulador de salas (`scripts/simula-salas-online.mts`)
- Reducer de verdade, 1 dono + 2–8 convidados, rede ruim (atraso, duplicado, 6% perdido, F5, saída no meio).
- 13 modos: envelope, Tocaia, pregão aberto, envelope único, Clubes, Duplas, liga de 10 + novo leilão, Liga Draft,
  Liga+Copa, Liga+Liberta, Liga+Champions, Só Champions, Relâmpago.
- Flags: `--cenario X --seeds N` · `--medir` (MB por tela/campo/motivo) · `--abas-velhas` (metade dos convidados lê
  como a versão antiga) · `--pedacos` (rádio em pedaços, confere ENVIO A ENVIO que o convidado monta a mesma sala).
- Resultado 10/11: tudo **0 falhas**; `--pedacos` 13×4 sementes: 1.922 MB → 428 MB.

## 5. Medido e NÃO feito (precisa de OK do Diego)
- Sala parada na tela de FIM continua conversando a cada 3 s pela noite toda (sala BHZBJB, 14 h aberta). Mexe no
  batimento de 3 s do dono — regra do Diego: não tocar sem ele aprovar com o risco explicado.
- Convidados em Copa perguntando `esc_copa_salas` + `room_players` a cada 2 s (~1.700/h por pessoa).
- Diminuir o NÚMERO de mensagens (ex.: janela de agrupamento maior) mexe no ritmo da tela — não proposto.
- Teste no site de verdade: a máquina da sessão não alcança o Supabase (host fora da lista + proxy sem WebSocket).
