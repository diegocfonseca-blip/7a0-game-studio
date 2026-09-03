// ─── 🖋️ QUEM TEM CLUBE PRÓPRIO — a lista única ──────────────────────────────
//
// Nasceu em 30/08 com o Salão dos Batismos. Antes esta informação existia só
// espalhada em comentário (`apoio.tsx`, `escudos.tsx`, `data.ts`) e num script
// solto — e foi assim que em 20/08 achamos 8 batismos sem reserva de nome.
// Aqui é o lugar ÚNICO: quem entrou, de que tipo, e com que número.
//
// 🎫 BATISMO x SÓCIO — a diferença que já deu ruim (Futpoint FC, 19/08):
//   · BATISMO: o clube TOMA a vaga de um time de CPU na pirâmide, e o dono
//     ganha número de FUNDADOR.
//   · SÓCIO: o clube é do dono e NÃO tira o lugar de ninguém — logo, sem vaga
//     na pirâmide e sem número de fundador. Palavras do Diego na época:
//     *"eu N pedi p ele entrar no lugar de ng... eu disse q ele era sócio"*.
//   Os DOIS aparecem no Salão (decisão dele, 30/08: *"sócios tb entram no
//   salão do batismo ok"*) — só que com o selo certo, cada um o seu.
//
// ⚠️ SEM E-MAIL AQUI. Este arquivo desce pro navegador de todo mundo; o que
// identifica é o NOME DO CLUBE. O número de fundador é copiado de
// `FUNDADOR_N` (apoio.tsx) e `npm run batismos` reclama se os dois brigarem.
//
// 📌 O nome é sempre o ATUAL. Nome velho (Livre-pool, Império Samambaia…) mora
// em `OLD_NAME` no data.ts e o jogo resolve sozinho pelo `newestTeamName`.

export interface Batismo {
  /** nome ATUAL do clube */
  clube: string
  /** batismo toma vaga na pirâmide e tem nº de fundador; sócio, não */
  tipo: 'batismo' | 'socio'
  /** nº de FUNDADOR (só batismo). Copiado de FUNDADOR_N — o guarda confere. */
  fundador: number | null
}

export const BATISMOS: Batismo[] = [
  { clube: 'Neymarzetti', tipo: 'batismo', fundador: 1 },
  { clube: 'Bicho da Seda', tipo: 'batismo', fundador: 11 },
  { clube: 'Xurupitas FC', tipo: 'batismo', fundador: 13 },
  { clube: 'Nightfull FC', tipo: 'batismo', fundador: 18 },
  { clube: 'Murriz FC', tipo: 'batismo', fundador: 21 },
  { clube: 'Tôka10', tipo: 'batismo', fundador: 23 },
  { clube: 'Skyy FC', tipo: 'batismo', fundador: 24 },
  { clube: 'Marinheiros AS', tipo: 'socio', fundador: null },
  { clube: 'Leão da Estradinha', tipo: 'batismo', fundador: 28 },
  { clube: 'Marreco FC', tipo: 'batismo', fundador: 29 },
  { clube: 'Al Takhadao FC', tipo: 'batismo', fundador: 53 },
  { clube: 'Jurubeba FC', tipo: 'batismo', fundador: 54 },
  { clube: 'Corporação Capsule FC', tipo: 'batismo', fundador: 55 },
  { clube: 'Alfacehh', tipo: 'batismo', fundador: 30 },
  { clube: 'Barcenite FC', tipo: 'batismo', fundador: 31 },
  { clube: 'Manfré FC', tipo: 'batismo', fundador: 34 },
  { clube: 'Remoçada', tipo: 'batismo', fundador: 35 },
  { clube: 'Scorporila FC', tipo: 'batismo', fundador: 36 },
  { clube: 'Deportivo Montreal', tipo: 'batismo', fundador: 37 },
  { clube: 'Marolados FC', tipo: 'batismo', fundador: 38 },
  { clube: 'Papão United Madrid', tipo: 'batismo', fundador: 39 },
  { clube: 'Eros FC', tipo: 'socio', fundador: null },
  { clube: 'Sapekeiros FC', tipo: 'batismo', fundador: 41 },
  { clube: 'Seven City', tipo: 'batismo', fundador: 42 },
  { clube: 'Tricolor do Arruda FC', tipo: 'batismo', fundador: 43 },
  { clube: 'Coringas do Diniz', tipo: 'batismo', fundador: 44 },
  { clube: 'Nata de SP', tipo: 'batismo', fundador: 45 },
  { clube: 'Crias do Bigão', tipo: 'batismo', fundador: 46 },
  { clube: 'Theuzudo FC', tipo: 'batismo', fundador: 47 },
  { clube: 'São Luiz FC', tipo: 'batismo', fundador: 48 },
  { clube: 'Milhaça FC', tipo: 'batismo', fundador: 49 },
  { clube: 'Esqueceram do Lluch', tipo: 'batismo', fundador: 50 },
  { clube: 'La Bestia Negra', tipo: 'batismo', fundador: 51 },
  { clube: 'SC Ferrari', tipo: 'batismo', fundador: 52 },
  { clube: 'Futpoint FC', tipo: 'socio', fundador: null },
]

/** chave de comparação: ignora caixa, acento e o FC/EC/SC/AS do fim */
export const chaveClube = (nome: string): string =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+(FC|EC|SC|AS)$/i, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '')

const PORCHAVE = new Map(BATISMOS.map(b => [chaveClube(b.clube), b]))
/** acha o clube pelo nome (qualquer forma: com FC, sem acento, minúsculo) */
export const batismoDe = (nome: string): Batismo | null => PORCHAVE.get(chaveClube(nome)) ?? null
