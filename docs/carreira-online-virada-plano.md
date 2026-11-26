# 🌐 Carreira online (co2) — plano da VIRADA da temporada (26/11)

Mapeamento feito em 26/11 (antes de mexer). Ordem dos passos, do menor pro maior:

0. **Travas** — `useCo2FimDaVirada` (co2-telas) só manda `preparo` com `state.round===0` (hoje o apito da 38ª põe a sala em
   `virada` e o hook empurraria pra preparo). Tirar `CONFIRM_MESMO_TIME`/`CAST_SEASON_VOTE` de `CO2_ACOES_DE_FORA` (só o dono comanda).
1. **Mesma copa em todo aparelho** — quem comanda carimba no mundo (`mundo.fim = {copaBR, botBanco, …}`, igual ao `m2`) e todos leem dele,
   não da própria conta; no fim, um `CO2_GAVETAS` com `ate=38`; `FREEZE_COPA_XI` no co2 usa as escalações das gavetas.
2. **Função pura `co2JuntaVirada(local, cmd, meuId)`** (carreira-online-v2.ts): do comandante vem o que é de todos (managers, pirâmide,
   `cpuSquads`, `clubCash`, valores, honras, temporada, semente, tabela); do aparelho vem o que é do clube (estádio, Agência,
   patrocínio/Master/Loja, presidente, extrato, torcida, staff, `condicaoCarry`). Caixa = o do fechamento local + extrato da virada.
3. **`CO2_FECHA_TEMPORADA`** (cada aparelho, só o próprio clube): a parte de clube do `OPEN_RESERVE_LIST` (`guardaCansaco`,
   `applySeasonMoney` filtrado pro meu id, torcida, patrocínio); trava `booksSeason`; a gaveta leva `fechamento:{temporada, caixa}`.
4. **`OPEN_RESERVE_LIST` do comandante no co2** — só a parte de todos (pirâmide, `clubCash`, crônica, honras, contratos da Várzea,
   `voltaCria`, `seasonNo++`). Ausente (sem `fechamento`) = `co2Fora`: fora do leilão; contrato vencido renova sozinho; "deixar sair"
   → Cria da Base (nunca fake). `FINISH_CEREMONY` limpa `co2Fora`.
5. **Ligação** — `aoEstado` aceita o estado na virada pra quem já fechou → espelho do leilão → `co2JuntaVirada` quando a temporada
   sobe. Tela: "Fechar temporada" pra cada um; contratos ("se não escolher, renova sozinho"); dono "Abrir a virada"; Dinâmica com
   relógio de 60 s + confirmação; Livre com PRONTO.
6. **Quem faltou alcança** — foto da virada por temporada no banco (`esc_carr_virada(sala,temporada,z)`, só membros leem).
7. Depois: crise de -500 no online (fecha na virada do comandante, ausente → Cria da Base) e Copa/Supercopa com a pausa do dono.

Teste: estender `scripts/carreira-online/testa-fluxo.mjs` — 38 rodadas → tabelas/pirâmide/copa iguais nos 3 → 2 fecham, 1 ausente →
virada no host com espelho → temporada 2 com mesma pirâmide e elencos, ninguém fake, extrato = caixa, Cria no lugar de quem saiu →
5 rodadas da T2 iguais.
