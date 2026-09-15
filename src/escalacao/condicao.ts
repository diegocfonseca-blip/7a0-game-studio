// ─── 😓 CONDIÇÃO / GÁS do jogador (carreira SOLO) — módulo PURO, sem React ────
//
// Pedido do Diego (12/09/2026): *"precisamos da condição do jogador.. energia
// com base na quantidade de jogos ou qd se machuca e volta aos poucos"*. Regras
// fechadas com ele no mesmo dia (mockup `scripts/mockup-condicao-elenco.mjs`,
// variante A — a barrinha):
//
//   · cada jogo como TITULAR: −7 de gás · cada rodada no BANCO: +15 (teto 100)
//   · ≥ 35 = 💪 inteiro (nada) · 25–34 = 😓 cansado (−1 de força no jogo)
//     · 20–24 = 🥵 no limite (−2 · 2× de chance de ser o lesionado da temporada)
//     · < 20 = 🚑 esgotado (−3 · 3× lesão)
//     A escada é a que o Diego pediu (12/09, 2ª versão — ele esticou: *"vai ser 1
//     a 10 normal, dps 11, 12, 13 a 14 em diante"*) → 1º–10º jogo seguido inteiro
//     · 11º 😓 · 12º 🥵 · 13º+ 🚑. (gás antes do jogo N = 100 − 7·(N−1):
//     10º = 37 · 11º = 30 · 12º = 23 · 13º = 16 · 14º = 9)
//   · lesão VOLTA AOS POUCOS: na rodada da volta joga a 60% (−2), na seguinte
//     a 80% (−1), depois 100%.
//   · 🩹 LESÃO POR DESGASTE (Diego 12/09: *"quero sim q qd chegue no 9 e no 10
//     em diante a chance aumente de lesão, senão não tem sentido"*): FORA o causo
//     da temporada, todo jogo o 🥵 tem 5% e o 🚑 tem 10% de se machucar (1-3
//     rodadas) — eram 15% e 30% até 15/09, ver LESAO_LIMITE_PCT. Mesmo banner, mesmos Crias sem reserva. Roda só quando ninguém
//     do time já está fora (o jogo guarda UM causo por vez — limitação assumida).
//   · 🏥 O DEP. MÉDICO SAIU DO JOGO (Diego 12/09, três vezes até eu entender:
//     *"não quero dep médico, já disse… quem comprou esquece, vai ser igual p
//     todos"*). Ninguém é imune, ninguém encurta lesão. Igual pra todo mundo.
//   · 🪑 BANCO RECUPERA +15 POR RODADA (Diego 12/09: *"a condição dele não deve
//     ser recuperada de cara"*): quem só está 😓 volta inteiro com 1 rodada fora;
//     quem está 🚑 precisa de 2-3. Quem volta de lesão volta com o gás QUE TEM —
//     nunca zerado pra 100 só porque o jogo precisou dele.
//   · liga quando o clube SOBE PRA SÉRIE C (não por temporada — *"3ª temporada
//     acho mt rápido… apenas quando subir pra Série C"*); quem já está em C/B/A
//     liga na próxima rodada. Uma vez ligado, não desliga se cair de volta.
//     ⚠️ Em 12/09 à noite eu entendi errado um *"é pra todos né"* (era pra todos
//     os USUÁRIOS, não pra todas as divisões) e a regra ficou ~1h "em qualquer
//     divisão". Ele corrigiu: *"a condição física não libera de cara. Ele precisa
//     primeiro chegar na Série C pra desbloquear pra sempre"*. Não repetir.
//   · bots NÃO cansam (baseline plano): quem rodizia bem também não paga nada —
//     é camada de gestão, não imposto. Copa Legends também fica de fora.
//
// 🧮 O GÁS NÃO É GUARDADO NO SAVE — é DERIVADO da escalação congelada de cada
// rodada (`careerLineup`, que o PLAY_ROUND grava pra toda rodada jogada). Isso
// dá três garantias de graça: (1) nada de migração de save; (2) reload/relogin
// não perde nem duplica cansaço; (3) o passado é imutável — o gás de uma rodada
// já jogada depende só de rodadas anteriores, também congeladas, então nenhum
// placar antigo muda (a família de bug "os gols do Evaristo foram pro Jairzinho").
//
// 🛡️ Segurança (prioridade nº 1): NADA aqui trava rodada nem inventa jogador.
// Sem reserva na posição, o cara joga cansado (−1/−2) e o preparador avisa o
// caminho ("contrate no mercado"); se a lesão vier, entra o MESMO banner dos
// 3 Crias da Base que os eventos já usam.
import { CONDICAO_ON } from './career-feature-release'

// ⚖️ A ESCADA DE 13/09 — o cansaço ATRAVESSA TEMPORADAS (escolha do Diego).
// Ele pediu *"1 a 50, depois 55, 60, 65 e 70 em diante"*. Eu avisei que a temporada
// tem 38 rodadas e que, com o gás zerando na virada, o 1º degrau em 50 jogos deixaria
// o gás de enfeite. Ele escolheu a outra saída: **o cansaço não zera mais na virada**
// (ver `condicaoCarry` em types.ts). Com isso a escada fecha em JOGOS SOMADOS DA
// CARREIRA: 1º–54º inteiro · 55º 😓 · 60º 🥵 · 65º em diante 🚑.
// (gás antes do jogo N = 100 − 1,4·(N−1): 54º = 25,8 · 55º = 24,4 · 59º = 18,8 ·
//  60º = 17,4 · 64º = 11,8 · 65º = 10,4 · 70º = 3,4 · 72º = 0,6)
export const GAS_JOGO = 1.4    // desconto por jogo como titular (era 7, quando zerava por temporada)
export const GAS_BANCO = 4     // recuperação por rodada no banco (≈ 3 jogos de folga)
export const GAS_CANSADO = 25  // abaixo disto = 😓
export const GAS_LIMITE = 18   // abaixo disto = 🥵
export const GAS_ESGOTADO = 11 // abaixo disto = 🚑
export const MOD_CANSADO = -1
export const MOD_LIMITE = -2
export const MOD_ESGOTADO = -3
export const MOD_VOLTA = [-2, -1] as const // rodada da volta (60%) · seguinte (80%)
// 🩹 15/09 — O DIEGO DESANIMOU DE JOGAR O PRÓPRIO JOGO: *"tô achando bem chato os
// jogadores se machucando toda hora e tão rápido pqp… tá foda, desanimei"*. Fui medir:
// com 4 titulares 🚑, dava **9 lesões por temporada** (simulação de 20 mil temporadas).
// Ele escolheu o conserto por aqui — 15% → 5% e 30% → 10%. Continua ameaça (um jogador
// 🚑 por 5 jogos ainda tem 41% de cair), mas deixa de ser imposto.
// ⚠️ ISTO SOZINHO NÃO MATA A CAUSA, e está medido: o sorteio joga UM DADO PRA CADA
// titular cansado, toda rodada (ver `sorteiaLesaoDesgaste`). Com 4 🚑 a conta cai de 9
// pra 6 lesões por temporada; com o time inteiro cansado, de 10 pra 8,6 — porque a
// MULTIPLICAÇÃO continua. O conserto de verdade é um dado por RODADA, e ele sabe disso
// (ofereci, ele preferiu começar só pelo número). Se voltar a incomodar, é ali.
export const LESAO_LIMITE_PCT = 0.05   // 🥵 chance de lesão por desgaste, por jogo (era 0.15)
export const LESAO_ESGOTADO_PCT = 0.10 // 🚑 idem (era 0.30)

export type EstadoGas = 'ok' | 'cansado' | 'limite' | 'esgotado'
export function estadoGas(g: number): EstadoGas { return g >= GAS_CANSADO ? 'ok' : g >= GAS_LIMITE ? 'cansado' : g >= GAS_ESGOTADO ? 'limite' : 'esgotado' }
export function modGas(g: number): number { const e = estadoGas(g); return e === 'ok' ? 0 : e === 'cansado' ? MOD_CANSADO : e === 'limite' ? MOD_LIMITE : MOD_ESGOTADO }
// peso do jogador no sorteio da LESÃO da temporada (1 = normal · 2 = 🥵 · 3 = 🚑)
export function pesoLesao(g: number): number { const e = estadoGas(g); return e === 'esgotado' ? 3 : e === 'limite' ? 2 : 1 }
export const emojiGas = (e: EstadoGas): string => (e === 'ok' ? '💪' : e === 'cansado' ? '😓' : e === 'limite' ? '🥵' : '🚑')
export const corGas = (e: EstadoGas): string => (e === 'ok' ? '#1B7A3D' : e === 'cansado' ? '#D9A000' : e === 'limite' ? '#C2452F' : '#7A1B1B')

// ─── 📊 A BARRINHA (só TELA — o motor não muda) ─────────────────────────────
// Diego, 13/09: *"as barrinhas estou achando que está diminuindo muito rápido…
// não quero mexer no motor… deveria ficar amarelo depois de 50%, quando chegar em
// 49%, que está quase na metade ainda… seguir com a mesma regra que botamos: 1 a
// 50 jogos, aí cai pra 49% e vai descendo até chegar em 55 e tantos"*.
// O gás do MOTOR cai 1,4 por jogo, então no 50º jogo ele já está em 31 — e a barra
// mostrava isso cru: parecia "quase acabando" com o jogador ainda inteiro (inteiro
// vai até o 54º). A barra passa a mostrar uma LEITURA do gás, em dois trechos:
//   · gás 100 → 30,7 (1º ao 50º jogo)  = barra 100% → 50%  (cai ~1% por jogo)
//   · gás 30,7 → 0 (51º jogo em diante) = barra 49% → 0%   (zona do cansaço, em
//     degraus mais espaçados — 55º = 40% · 60º = 33% · 65º = 25% · 70º = 10% · 73º = 0)
// Cor: ver `corBarra` — desde 15/09 ela segue o MOTOR (verde até o 54º, amarelo do 55º),
// e não mais a leitura da barra. O texto acima descreve só o TAMANHO da barra.
// O emoji, o estado e todos os números do jogo continuam saindo do gás cru.
export const GAS_MEIO = 30.7 // gás do motor que a barra mostra como 50% (entre o 50º = 31,4 e o 51º = 30 → 51% e 49%)
// 🪜 2ª rodada com o Diego (13/09): *"espaçar mais o final após bater 40%… manter de 1 a
// 50, depois 55 e depois prolongar… a parte final achei que foi rápido e brusco"*. O motor
// zera o gás no ~72º jogo, então a barra TEM que perder os 40 pontos finais em 17 jogos —
// o que dá pra fazer é REDISTRIBUIR: cai devagar na zona que ele vê (55º–65º) e só despenca
// no finzinho, que quase ninguém alcança sem descansar. Pontos [gás do motor → barra]:
//   100 → 100 · 30,7 → 50 (50º/51º) · 24,4 → 40 (55º 😓) · 17,4 → 33 (60º 🥵) ·
//   10,4 → 25 (65º 🚑) · 3,4 → 10 (70º) · 0 → 0 (73º em diante)
// Entre dois pontos é reta. Monótona: gás menor nunca dá barra maior.
export const BARRA_PONTOS: [number, number][] = [[100, 100], [GAS_MEIO, 50], [24.4, 40], [17.4, 33], [10.4, 25], [3.4, 10], [0, 0]]
export function pctBarra(g: number): number {
  const x = Math.max(0, Math.min(100, g))
  for (let i = 1; i < BARRA_PONTOS.length; i++) {
    const [g1, p1] = BARRA_PONTOS[i - 1], [g0, p0] = BARRA_PONTOS[i]
    if (x >= g0) return Math.max(0, Math.min(100, Math.round(p0 + ((x - g0) / (g1 - g0)) * (p1 - p0))))
  }
  return 0
}
// 🟡 A COR SEGUE O MOTOR (15/09) — verde enquanto 💪, amarelo a partir do 😓 (55º jogo).
// ⚠️ ISTO SUBSTITUI A DECISÃO DE 13/09, não é descuido: naquele dia o Diego pediu
// *"deveria ficar amarelo depois de 50%, quando chegar em 49%, que está quase na metade
// ainda"*, e a barra passava a amarelar no 51º. Em 15/09 ele viu o outro lado: entre o
// 51º e o 54º a barra ficava amarela e o preparador NÃO trocava — quatro jogos de alerta
// aceso com o jogo de braços cruzados. Ele escolheu juntar as duas coisas no 55º
// (*"podemos fazer isso no 55"*), com a pergunta certa na cabeça: *"temos que imaginar o
// que as pessoas estão pensando quando olham o que está havendo"*.
// 👉 Regra de hoje: amarelo = o preparador vai agir. Não amarelar antes é de propósito.
export function corBarra(g: number): string {
  return corGas(estadoGas(g))
}

// ─── 🔁 QUANDO O PREPARADOR TROCA ───────────────────────────────────────────
// No 😓 — o 55º jogo. Ou seja: o MESMO instante em que a barra vira amarela (ver
// `corBarra` acima) e em que o motor começa a descontar. Uma coisa só, três sinais.
// 📜 Passou por uma volta em 15/09: cheguei a deixar o gatilho na barra em 49% (51º
// jogo) pra casar com a cor de então. O Diego preferiu o contrário — trazer a COR pro
// 55º e deixar o gatilho onde sempre esteve. Fica com nome próprio mesmo assim: se um
// dia esse ponto mudar de novo, muda AQUI e o botão, o automático e o aviso da tela
// andam juntos (foi justamente a falta disso que criou os 4 jogos de incoerência).
/** o titular está no ponto de sair */
export const pedeRodizio = (g: number): boolean => estadoGas(g) !== 'ok'
/** o reserva está inteiro o bastante pra entrar — mesma régua, pros dois lados:
 *  entrar alguém que já sairia na rodada seguinte seria trocar por trocar */
export const prontoPraEntrar = (g: number): boolean => estadoGas(g) === 'ok'

// ─── 🪜 A DIVISÃO DE VERDADE (13/09) ─────────────────────────────────────────
// ⚠️ `careerDivision` MENTE em carreira que nasceu na Várzea: ele fica congelado
// na divisão de FUNDAÇÃO. Medido no banco em 13/09, numa amostra dos 250 saves
// mais recentes: 155 carreiras com Agência estavam com o campo dizendo "V" e a
// divisão REAL sendo A (84), C (49) ou B (22). Por isso o gás não ligava pra
// ninguém que tinha subido — foi a pergunta do Diego (*"por que não foi ainda?"*).
// A colocação de verdade mora em `careerPlacements['m' + id do seu técnico]`, que
// é a MESMA conta que o Painel do Criador já usa desde 07/09.
// 👉 Todo lugar que precisa saber a divisão da carreira usa ESTA função.
export function divisaoDaCarreira(s: {
  careerDivision?: string | null
  careerPlacements?: Record<string, string> | null
  managers?: { id: number }[]
  youIdx?: number
}): string {
  const id = s.managers?.[s.youIdx ?? 0]?.id ?? s.youIdx ?? 0
  return s.careerPlacements?.['m' + id] ?? s.careerDivision ?? 'D'
}
/** o gás vale desta divisão pra cima (Série C, B e A) */
export const DIV_COM_GAS = new Set(['C', 'B', 'A'])

// ─── ligado ou não, PARA ESTA CARREIRA/TEMPORADA ─────────────────────────────
// `condicaoDesde` = temporada em que o clube chegou na Série C (gravado na virada,
// CAREER_ADVANCE) — ou a temporada corrente + `condicaoDesdeR`, pra quem já estava
// em C/B/A quando a regra chegou. Temporada em andamento nunca muda de regra no meio.
// 🔓 É DESBLOQUEIO, NÃO CONDIÇÃO (Diego 13/09): *"lembra do que é desbloqueio. Se
// quem valeu a condição física depois descer pra Várzea, continua com a condição
// física"*. Por isso a conta olha só `condicaoDesde` — a divisão de HOJE não
// desliga nada. Ela só decide QUANDO liga, e isso acontece uma vez.
export function condicaoAtiva(s: { careerOnline?: boolean; onlineMode?: string; agenciaOn?: boolean; condicaoDesde?: number; condicaoDesdeR?: number; seasonNo?: number; careerDivision?: string | null; careerPlacements?: Record<string, string> | null; managers?: { id: number }[]; youIdx?: number }): boolean {
  if (!CONDICAO_ON) return false
  if (!s.careerOnline || s.onlineMode === 'online' || !s.agenciaOn) return false
  // 🧹 mesma cura do PLAY_ROUND: ligou NO MEIO da temporada estando em D/Várzea =
  // veio da ~1h de deploy errado de 12/09 (legítimo só em C/B/A). Trata como desligado
  // já na tela, antes mesmo de a próxima rodada limpar o save.
  // ⚠️ usa a divisão REAL: com o campo congelado, esta cura estava a um passo de
  // APAGAR o gás de quem está de verdade na Série A (o campo dele diz "V").
  if (s.condicaoDesde === (s.seasonNo ?? 1) && s.condicaoDesdeR != null && !DIV_COM_GAS.has(divisaoDaCarreira(s))) return false
  return s.condicaoDesde != null && (s.seasonNo ?? 1) >= s.condicaoDesde
}

// ─── o gás de cada carta ANTES da rodada `round` ─────────────────────────────
// `byRound` = careerLineup[mgrId] (rodada → ids dos 11). Só rodadas < round
// contam; rodada sem escalação gravada (não deveria existir depois de jogada)
// não mexe em ninguém. Carta que não existia numa rodada (chegou depois) só
// sobe até o teto — nasce inteira.
// `desdeR` = 1ª rodada que conta (quem já estava em C/B/A quando a regra chegou
// começa a contar dali, todo mundo em 100% — ver condicaoDesdeR em types.ts).
// `inicio` = o gás com que cada carta COMEÇOU esta temporada (13/09: o cansaço
// atravessa a virada — ver `condicaoCarry` em types.ts). Sem ele, todo mundo em 100.
// 🏋️ `banco` = quanto CADA rodada no banco devolve. Sem preparador é o GAS_BANCO de
// sempre (+4); com preparador é o número dele (`preparadores.ts`). Como o gás é
// DERIVADO, trocar de preparador re-deriva a temporada CORRENTE — e só ela, porque
// `inicio` (o condicaoCarry) congela o que veio das temporadas anteriores. Ou seja:
// contratou no meio do ano, o elenco sente já nesta temporada; o passado guardado
// não muda. Nenhum placar antigo se mexe (o gás nunca entra no resultado já jogado).
export function gasDoElenco(byRound: Record<number, string[]> | undefined, round: number, squad: { id: string }[], desdeR = 0, inicio?: Record<string, number>, banco = GAS_BANCO): Record<string, number> {
  const gas: Record<string, number> = {}
  for (const c of squad) gas[c.id] = Math.max(0, Math.min(100, inicio?.[c.id] ?? 100))
  if (!byRound) return gas
  for (let r = desdeR; r < round; r++) {
    const ids = byRound[r]
    if (!ids) continue
    const xi = new Set(ids)
    // ⚠️ arredonda a 1 casa A CADA passo: o desconto é 1,4 e sem isto a soma de
    // ~70 jogos acumula lixo de float (93.99999999999994) — a escada tem que cair
    // exatamente no 55º/60º/65º jogo.
    for (const c of squad) gas[c.id] = Math.round((xi.has(c.id) ? Math.max(0, gas[c.id] - GAS_JOGO) : Math.min(100, gas[c.id] + banco)) * 10) / 10
  }
  return gas
}

// quantos jogos cada carta fez na temporada (o "🏃 9 jogos" da aba Elenco)
// `jaJogou` = jogos que a carta já tinha SOMADO em temporadas anteriores (o "🏃 N
// jogos" passou a contar a carreira inteira, junto com o gás que atravessa a virada).
export function jogosDoElenco(byRound: Record<number, string[]> | undefined, round: number, squad: { id: string }[], desdeR = 0, jaJogou?: Record<string, number>): Record<string, number> {
  const n: Record<string, number> = {}
  for (const c of squad) n[c.id] = Math.max(0, jaJogou?.[c.id] ?? 0)
  if (!byRound) return n
  for (let r = desdeR; r < round; r++) for (const id of byRound[r] ?? []) if (id in n) n[id]++
  return n
}

// ─── 🩹 volta gradual da lesão ───────────────────────────────────────────────
// `ev` = eventoTemporada (só conta se for LESÃO desta temporada e já decidida
// pro banco). Devolve o modificador do jogador na rodada `r`: −2 na volta, −1
// na seguinte, 0 fora disso. Também serve pra tela ("voltando · 60%").
export function modVolta(ev: { tipo: string; season: number; status: string; volta?: number; cardId: string } | null | undefined, seasonNo: number, r: number, cardId: string): number {
  if (!ev || ev.tipo !== 'lesao' || ev.season !== seasonNo || ev.status !== 'banco' || ev.volta == null || ev.cardId !== cardId) return 0
  const d = r - ev.volta
  return d >= 0 && d < MOD_VOLTA.length ? MOD_VOLTA[d] : 0
}
export const pctVolta = (mod: number): number => (mod === -2 ? 60 : mod === -1 ? 80 : 100)

// ─── 🩹 LESÃO POR DESGASTE: o sorteio de cada rodada ────────────────────────
// Determinístico (seed + temporada + rodada): reload não re-sorteia.
// ⚠️ UM DADO POR RODADA, e só (consertado 15/09). Até aqui o dado era jogado pra
// CADA titular cansado — com 9 🚑 em campo isso virava 61% de chance por rodada e
// ~9 lesões por temporada ("machuca toda hora", cobrança do Diego). Agora a rodada
// sorteia UMA vez, no jogador MAIS ACABADO do time: o teto é 10% por rodada, doa
// o time que doer. Escalar mais gente morta continua sendo pior (o pior gás fica
// pior, e o dado passa de 5% pra 10%), só não vira loteria.
// Inteiro/cansado nunca se machucam por aqui (só 🥵 e 🚑). Devolve null = nada.
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export function sorteiaLesaoDesgaste<T extends { id: string }>(args: { seed: number; seasonNo: number; round: number; xi: T[]; gas: Record<string, number> }): { card: T; rodadas: number; gas: number } | null {
  const { seed, seasonNo, round, xi, gas } = args
  const rng = mulberry((seed ^ Math.imul(seasonNo, 2654435761) ^ Math.imul(round + 1, 0x9E3779B1) ^ 0xD35647E) >>> 0)
  const cands = xi.filter(c => { const e = estadoGas(gas[c.id] ?? 100); return e === 'limite' || e === 'esgotado' }).sort((a, b) => (gas[a.id] ?? 100) - (gas[b.id] ?? 100))
  const pior = cands[0]
  if (!pior) return null
  const g = gas[pior.id] ?? 100
  const p = estadoGas(g) === 'esgotado' ? LESAO_ESGOTADO_PCT : LESAO_LIMITE_PCT
  if (rng() >= p) return null
  return { card: pior, rodadas: 1 + Math.floor(rng() * 3), gas: g } // 1-3 rodadas
}

// ─── modificadores POR JOGADOR pra simulação, rodada a rodada ────────────────
// Record<rodada, Record<cardId, mod>>. Só rodadas 0..round (a atual inclusa —
// é a que ainda vai rolar). Passado é determinístico (ver cabeçalho).
export type CardModsPorRodada = Record<number, Record<string, number>>
export function modsDoElenco(
  byRound: Record<number, string[]> | undefined, round: number, squad: { id: string }[],
  xiAt: (r: number) => string[],
  ev: { tipo: string; season: number; status: string; volta?: number; cardId: string } | null | undefined, seasonNo: number,
  desdeR = 0, inicio?: Record<string, number>,
): CardModsPorRodada {
  const out: CardModsPorRodada = {}
  for (let r = desdeR; r <= round; r++) {
    const gas = gasDoElenco(byRound, r, squad, desdeR, inicio)
    const m: Record<string, number> = {}
    for (const id of xiAt(r)) {
      const v = modGas(gas[id] ?? 100) + modVolta(ev, seasonNo, r, id)
      if (v) m[id] = v
    }
    if (Object.keys(m).length) out[r] = m
  }
  return out
}

// ─── 🔁 RODIZIAR: a sugestão do preparador (nunca aplica sozinho) ────────────
// Pra cada titular cansado (pior primeiro), entra o MELHOR reserva da mesma
// posição que esteja inteiro e não seja suspenso/fake. Mantém a vaga (mesmo
// índice) — o campinho não embaralha. Devolve null se não há o que trocar.
// 🌱 Cria da Base (13/09) também fica de fora da sugestão: trocar um titular de 85
// por um guri de 50 pra poupar −1 de gás é piorar o time — e no automático isso
// aconteceria sem o técnico ver. Quem quiser o cria em campo escala na mão.
export function sugerirRodizio<T extends { id: string; pos: string; lo: number; hi: number; fake?: boolean; cria?: boolean }>(
  xiIds: string[], squad: T[], gas: Record<string, number>, bloqueados: Set<string> = new Set(),
): { ids: string[]; trocas: { sai: T; entra: T }[] } | null {
  const byId = new Map(squad.map(c => [c.id, c]))
  const ids = xiIds.slice()
  const emCampo = new Set(ids)
  // 🔁 15/09: sai quem está com a BARRA em 49% ou menos (o amarelo), não mais só
  // quem já virou 😓 — ordem do Diego. Pior barra primeiro, como sempre.
  const cansados = ids.map(id => byId.get(id)).filter((c): c is T => !!c && pedeRodizio(gas[c.id] ?? 100)).sort((a, b) => (gas[a.id] ?? 100) - (gas[b.id] ?? 100))
  const trocas: { sai: T; entra: T }[] = []
  for (const sai of cansados) {
    const cand = squad.filter(c => c.pos === sai.pos && !emCampo.has(c.id) && !c.fake && !c.cria && !bloqueados.has(c.id) && prontoPraEntrar(gas[c.id] ?? 100))
      .sort((a, b) => (b.lo + b.hi) - (a.lo + a.hi))[0]
    if (!cand) continue
    const i = ids.indexOf(sai.id); if (i < 0) continue
    ids[i] = cand.id; emCampo.delete(sai.id); emCampo.add(cand.id)
    trocas.push({ sai, entra: cand })
  }
  return trocas.length ? { ids, trocas } : null
}
