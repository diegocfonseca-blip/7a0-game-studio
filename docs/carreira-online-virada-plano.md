# 🌐 Carreira online (co2) — plano da VIRADA da temporada (26/11)

Mapeamento feito em 26/11 (antes de mexer). Ordem dos passos, do menor pro maior:

0. ✅ (26/11) **Travas** — `useCo2FimDaVirada` (co2-telas) só manda `preparo` com `state.round===0` (hoje o apito da 38ª põe a sala em
   `virada` e o hook empurraria pra preparo). Tirar `CONFIRM_MESMO_TIME`/`CAST_SEASON_VOTE` de `CO2_ACOES_DE_FORA` (só o dono comanda).
1. ✅ (26/11) **Mesma copa em todo aparelho** — quem comanda carimba no mundo (`mundo.fim = {copaBR, botBanco, …}`, igual ao `m2`) e todos leem dele,
   não da própria conta; no fim, um `CO2_GAVETAS` com `ate=38`; `FREEZE_COPA_XI` no co2 usa as escalações das gavetas.
2. ✅ (26/11) **Função pura `co2JuntaVirada(local, cmd, meuId)`** (carreira-online-v2.ts): do comandante vem o que é de todos (managers, pirâmide,
   `cpuSquads`, `clubCash`, valores, honras, temporada, semente, tabela); do aparelho vem o que é do clube (estádio, Agência,
   patrocínio/Master/Loja, presidente, extrato, torcida, staff, `condicaoCarry`). Caixa = o do fechamento local + extrato da virada.
3. ✅ (26/11, virou `CO2_FECHA` + `OPEN_RESERVE_LIST` local + `co2Fechamento`) **`CO2_FECHA_TEMPORADA`** (cada aparelho, só o próprio clube): a parte de clube do `OPEN_RESERVE_LIST` (`guardaCansaco`,
   `applySeasonMoney` filtrado pro meu id, torcida, patrocínio); trava `booksSeason`; a gaveta leva `fechamento:{temporada, caixa}`.
4. ✅ (26/11, `CO2_ABRE_VIRADA` → `aplicaFechamentos` + o MESMO `RESERVE_AUCTION_ONLINE`; `fora` não trava envelope nem Monte) **`OPEN_RESERVE_LIST` do comandante no co2** — só a parte de todos (pirâmide, `clubCash`, crônica, honras, contratos da Várzea,
   `voltaCria`, `seasonNo++`). Ausente (sem `fechamento`) = `co2Fora`: fora do leilão; contrato vencido renova sozinho; "deixar sair"
   → Cria da Base (nunca fake). `FINISH_CEREMONY` limpa `co2Fora`.
5. ✅ parcial (26/11: espelho guarda `co2.base` na memória e junta no fim; telas `Co2FecharTemporada`/`Co2ViradaEspera`; falta a Dinâmica com relógio de 60 s) **Ligação** — `aoEstado` aceita o estado na virada pra quem já fechou → espelho do leilão → `co2JuntaVirada` quando a temporada
   sobe. Tela: "Fechar temporada" pra cada um; contratos ("se não escolher, renova sozinho"); dono "Abrir a virada"; Dinâmica com
   relógio de 60 s + confirmação; Livre com PRONTO.
6. ✅ código (26/11: `CO2_ALCANCA` + vigia no provider) · ⏳ **SQL `docs/sql/carreira-online-virada-20261126.sql` AINDA NÃO APLICADO** (mexe no esquema = API trava 1–3 min; aplicar fora do horário de pico) **Quem faltou alcança** — foto da virada por temporada no banco (`esc_carr_virada(sala,temporada,z)`, só membros leem).
7. Depois: crise de -500 no online (fecha na virada do comandante, ausente → Cria da Base) e Copa/Supercopa com a pausa do dono.

Teste: estender `scripts/carreira-online/testa-fluxo.mjs` — 38 rodadas → tabelas/pirâmide/copa iguais nos 3 → 2 fecham, 1 ausente →
virada no host com espelho → temporada 2 com mesma pirâmide e elencos, ninguém fake, extrato = caixa, Cria no lugar de quem saiu →
5 rodadas da T2 iguais.

### Estado em 26/11 (noite)
Teste `node scripts/carreira-online/testa-fluxo.mjs` cobre: 38 rodadas → copa → 2 fecham + 1 falta → leilão do dono com espelho →
T2 com mesma pirâmide/bots → quem faltou alcança pela foto (sem perder o clube, caixa = o dele + o do leilão) → 5 rodadas da T2 iguais.
Ainda não coberto: contrato vencido de quem faltou (na T1→T2 ninguém vence; testar numa T3), rodadas que quem faltou perdeu
(alcançar rodada a rodada), relógio da Dinâmica na virada, sondar de amigo, bots 0–5.
