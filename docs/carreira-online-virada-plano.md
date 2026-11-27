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

## 🏆 Auditoria das competições na carreira online (27/11, Diego: *"isso não pode ocorrer… diversos torneios… supercopa libertadores champions mundial… analise tudo com base na tradicional"*)
| Competição (tradicional) | Como roda no co2 | Igual em todo aparelho? |
|---|---|---|
| Liga (V, D, C, B, A) | todo aparelho simula com as gavetas congeladas | ✅ teste 38 rodadas + T2 (140+ carreiras sem diferença) |
| Copa do Brasil / Copa Legends + Supercopa | escalação congelada pelo DONO (`mundo.copaXi`) + regra do dono (`mundo.fim`) | ✅ e agora **trava**: sem os dois carimbos a copa nem é calculada e a temporada não fecha (`copaCo2Pronta`) |
| Copa do Mundo (convite, a cada 4 temporadas desde a T1) | ⚠️ cada aparelho joga a SUA (convite pessoal) | ❌ dois amigos podem ser campeões na mesma temporada — decidir com o Diego |
| Libertadores / Champions / Mundial (convite) | ✅ 27/11: ÚNICOS desde a T1 (Diego: *"que temporada 40 o quê… desde o início"*) — fila pela prioridade (campeão da A, campeão da Copa, 2º–8º), 2 convites do bloco, clube aceito sai da lista dos outros, dono pula quem sumiu, mesma campanha em todo aparelho (`co2-internacional.ts`, `amigos` em `makeInternationalCampaign`), títulos carimbados pelo dono (`mundo.intlHist`) entram no ranking na temporada seguinte | ✅ `node scripts/carreira-online/testa-internacional.mjs` |
| Playoff B, estaduais, Liberta/Sula/Intercontinental reais | só Brasil Oficial (o co2 não é Oficial) | — |
Consertos de 27/11: o mundo da tela refaz quando o elenco de um amigo muda (antes só olhava QUANTOS clubes); copa só com a escalação
do dono; carreira antiga sem carimbo ganha o carimbo do dono na hora de congelar. Motor novo: a versão "recepção" e os critérios novos
já ficam DESLIGADOS no co2 (dependiam da conta) — todos usam a mesma versão.
Falha de 1 vez em ~20 da copa (26/11): não reproduziu em 140+ carreiras; o teste imprime a semente se voltar.
