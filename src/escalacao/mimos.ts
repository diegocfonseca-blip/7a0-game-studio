// ─── 🎁 MIMOS DO BATISMO SEGUEM O E-MAIL, NÃO O NOME DO CLUBE (08/09) ────────
//
// Regra do Diego (04/09, reafirmada 08/09): *"ele tem mesmo e-mail, então
// deveria ter escudo e mascote e manto em QUALQUER time que ele fizer novo"*.
// O manto e o tier já eram assim (vêm do e-mail). Escudo e mascote-de-gol eram
// achados pelo NOME do clube — e por isso o dono do Jurubeba perdeu os dois
// quando renomeou pra "Meia na Canela".
//
// Como funciona agora, sem cadastro por nome:
//   1. `manto.ts` busca o MEU sócio (`esc_meu_socio`, pelo e-mail logado) e
//      registra aqui QUAL é o meu clube de batismo (`escudo_time`) e a minha
//      mascote (`mascote_key`).
//   2. `store.tsx` registra aqui o NOME ATUAL do MEU clube principal, toda vez
//      que ele muda (carreira, rápido, online, multiclube).
//   3. `escudos.tsx` e `mascotes.tsx`, quando não acham o nome na lista fixa,
//      perguntam: "esse nome é o do MEU clube?" Se for, usam o escudo/mascote do
//      meu batismo.
//
// 🛡️ SEGURANÇA: só o clube do PRÓPRIO dono, neste aparelho, ganha o apelido.
// Nunca um bot, nunca o time de outro humano — a lista de nomes daqui só recebe
// o assento que o jogo sabe que é meu. E o nome do clube de BATISMO em si
// continua fixo e desenhado pela lista de sempre (`LOGOS_PRONTAS`), pra todo
// mundo; isto aqui é só o extra pro dono jogando com outro nome.
//
// Sem imports de propósito: escudos.tsx, mascotes.tsx, manto.ts e store.tsx
// importam daqui, então este arquivo não pode depender de nenhum deles.

/** chave de comparação de nome de clube: sem selo, sem acento, minúsculo, sem FC/EC/SC no fim */
export const chaveEscudo = (n: string): string => n
  // 🏅 TIRA O SELO DE TIER ANTES DE TUDO (bug do Leite de Verdade, 18/09).
  // Palavras do Diego: *"o usuário do Leite de Verdade, que tem batismo, disse que
  // quando ele joga online o gol do mascote dele não tá aparecendo"*.
  // No ONLINE o nome do clube é o que a pessoa DIGITA, e o jogo gruda o selo do
  // apoiador nele — no banco o clube dele está gravado como "Loopesmiranda FC 👑🖋️".
  // A TELA já limpava o selo antes de procurar (`nomeLimpo`), mas o REGISTRO de
  // "qual é o meu clube" guardava o nome COM o selo. As duas chaves nunca batiam:
  //   registro → "loopesmiranda fc 👑🖋️"   ·   busca → "loopesmiranda"
  // (e o emoji no fim ainda impedia o corte do "FC", dobrando o estrago).
  // Como isto é a chave dos DOIS lados, limpar aqui acerta registro e busca juntos —
  // e vale pro escudo e pro manto pelo mesmo caminho, não só pra mascote.
  // ⚠️ A regex é cópia da de `escudos.tsx` de propósito: este arquivo não importa
  // ninguém (escudos/mascotes/manto/store importam DAQUI — ver o cabeçalho).
  .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{200D}\u{FE0F}\u{FE0E}\u{20E3}]/gu, '')
  .replace(/\s*\((você|voce)\)\s*$/i, '') // sufixo de tela, igual ao `nomeLimpo`
  .normalize('NFD').replace(/[̀-ͯ]/g, '') // tira acento (Bigão = Bigao)
  .toLowerCase().trim()
  .replace(/\s+/g, ' ')
  .replace(/\s+(f\.?\s?c\.?|e\.?\s?c\.?|s\.?\s?c\.?)$/, '') // FC/EC/SC no fim não mudam o dono

let meusNomes = new Set<string>()
let meuEscudoTime: string | null = null
let meuMascoteKey: string | null = null

/** store.tsx: o(s) nome(s) atual(is) do MEU clube principal neste aparelho */
export function registraMeusNomes(nomes: (string | null | undefined)[]): void {
  meusNomes = new Set(nomes.filter((n): n is string => !!n && n.trim().length > 0).map(chaveEscudo))
}
/** manto.ts: o que o meu batismo me dá (null = não sou dono de clube / deslogado) */
export function registraMeuBatismo(escudoTime: string | null, mascoteKey: string | null): void {
  meuEscudoTime = escudoTime && escudoTime.trim() ? escudoTime : null
  meuMascoteKey = mascoteKey && mascoteKey.trim() ? mascoteKey : null
}

// ─── 🏟️ OS MIMOS DA SALA: batismo aparece pra TODO MUNDO (18/09) ────────────
// Ordem do Diego: *"o mascote, seja no modo carreira ou online, ele deve aparecer
// nos times de batismo pra todo mundo"*.
//
// Até aqui, o de cima (`meusNomes`) só decorava a tela do PRÓPRIO dono. Quem não é
// ele desenha o clube pelo NOME — e no online o nome é DIGITADO, então o dono do
// Leite de Verdade jogando como "Loopesmiranda FC" ficava sem mascote pros outros.
//
// 🔒 Quem manda aqui é o SERVIDOR, não o aparelho: a lista vem da RPC
// `esc_mimos_sala`, que junta assento → conta → `esc_socios` e devolve SÓ
// assento → mimo. O e-mail nunca sai do servidor, ninguém consegue reivindicar o
// batismo de outro, e sócio vencido não entra. É o mesmo caminho que o MANTO da
// sala já usava desde 10/08 — não é porta nova, é a mesma porta levando mais coisa.
// ⚖️ E a lista FIXA (`CARIMBO_GOL`/`LOGOS_PRONTAS`) continua ganhando de tudo: se
// alguém digitar o nome de um clube batizado alheio, é a arte DAQUELE clube que
// aparece, não a do digitador.
let mimosDaSala = new Map<string, { mascote: string | null; escudo: string | null }>()

/** store.tsx: o que o SERVIDOR disse sobre os mimos de cada clube desta sala */
export function registraMimosDaSala(linhas: { clube: string; mascote?: string | null; escudo?: string | null }[]): void {
  const m = new Map<string, { mascote: string | null; escudo: string | null }>()
  for (const l of linhas) {
    if (!l.clube || !l.clube.trim()) continue
    const mascote = l.mascote && l.mascote.trim() ? l.mascote : null
    const escudo = l.escudo && l.escudo.trim() ? l.escudo : null
    if (!mascote && !escudo) continue
    m.set(chaveEscudo(l.clube), { mascote, escudo })
  }
  mimosDaSala = m
}
/** limpa ao sair da sala — mimo de sala não pode vazar pro jogo solo seguinte */
export const limpaMimosDaSala = (): void => { mimosDaSala = new Map() }
/** mascote de batismo do dono DESTE clube da sala (null = não é de ninguém) */
export const mascoteDaSala = (nome: string): string | null => mimosDaSala.get(chaveEscudo(nome))?.mascote ?? null
/** clube de batismo do dono DESTE clube da sala (pra achar o escudo na lista fixa) */
export const escudoDaSala = (nome: string): string | null => mimosDaSala.get(chaveEscudo(nome))?.escudo ?? null

/** esse nome é o do MEU clube (o que eu comando agora)? */
export const ehMeuClube = (nome: string): boolean => meusNomes.size > 0 && meusNomes.has(chaveEscudo(nome))
/** nome do clube de batismo do dono logado (pra achar o escudo dele na lista fixa) */
export const meuEscudoBatismo = (): string | null => meuEscudoTime
/** mascote_key do dono logado (pro carimbo de gol no clube que ele estiver usando) */
export const meuMascoteBatismo = (): string | null => meuMascoteKey
