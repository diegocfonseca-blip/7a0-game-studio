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

/** chave de comparação de nome de clube: sem acento, minúsculo, sem FC/EC/SC no fim */
export const chaveEscudo = (n: string): string => n
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

/** esse nome é o do MEU clube (o que eu comando agora)? */
export const ehMeuClube = (nome: string): boolean => meusNomes.size > 0 && meusNomes.has(chaveEscudo(nome))
/** nome do clube de batismo do dono logado (pra achar o escudo dele na lista fixa) */
export const meuEscudoBatismo = (): string | null => meuEscudoTime
/** mascote_key do dono logado (pro carimbo de gol no clube que ele estiver usando) */
export const meuMascoteBatismo = (): string | null => meuMascoteKey
