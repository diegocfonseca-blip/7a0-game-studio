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
  /** selo que aparece no lugar do nº (batismo antigo sem número conhecido) */
  selo?: string
  /**
   * 🎽 as 2 cores do manto, MEDIDAS na camisa que o dono mandou. Sem isto = o
   * dono nunca mandou arte, e quem depende daqui usa a peça genérica.
   *
   * ⚠️ Por que a cor aparece AQUI e não só em `MANTO_CONTAS`: lá a chave é o
   * E-MAIL, e e-mail só serve pra decorar a tela do PRÓPRIO dono. A foto do
   * campeão em O MARTELO é diferente — quem lê o jornal pode ser qualquer um,
   * e o campeão é achado pelo NOME DO CLUBE. Cor de camisa não é segredo (ela
   * já está à vista na Loja do Clube), então pode descer pra todo mundo; o
   * e-mail, não — por isso ele continua fora deste arquivo.
   *
   * 🔒 As duas listas têm que bater: `npm run batismos` compara e reclama.
   */
  manto?: [string, string]
}

export const BATISMOS: Batismo[] = [
  // 🥋 O 1º batismo da história (dono/e-mail desconhecido até hoje — por isso sem
  // nº de fundador). Diego, 08/09: *"todos esses entram sim"*. Se o e-mail aparecer,
  // dar o próximo FUNDADOR_N e trocar o selo pelo número.
  { clube: 'White Thigs do GuGu', tipo: 'batismo', fundador: null, selo: '🥇 1º da história' },
  // 🏦 Batismo a pedido do próprio Diego (03/08, ex-Magrão EC) — sem dono/e-mail.
  { clube: 'Vasco da Grana', tipo: 'batismo', fundador: null, selo: '🖋️ batismo' },
  { clube: 'Neymarzetti', tipo: 'batismo', fundador: 1, manto: ['#080908', '#F0EFEF'] },
  { clube: 'Bicho da Seda', tipo: 'batismo', fundador: 11, manto: ['#0F0F0F', '#E6DED4'] },
  { clube: 'Xurupitas FC', tipo: 'batismo', fundador: 13, manto: ['#063215', '#F8EACF'] },
  { clube: 'Nightfull FC', tipo: 'batismo', fundador: 18, manto: ['#0A0A0A', '#D6D2CF'] },
  { clube: 'Murriz FC', tipo: 'batismo', fundador: 21, manto: ['#C81D1C', '#150A0A'] },
  { clube: 'Tôka10', tipo: 'batismo', fundador: 23, manto: ['#FCDC04', '#055E1D'] },
  { clube: 'Skyy FC', tipo: 'batismo', fundador: 24 },
  { clube: 'Marinheiros AS', tipo: 'socio', fundador: null, manto: ['#0D4926', '#F5EBE1'] },
  { clube: 'Leão da Estradinha', tipo: 'batismo', fundador: 28 },
  { clube: 'Marreco FC', tipo: 'batismo', fundador: 29 },
  { clube: 'Al Takhadao FC', tipo: 'batismo', fundador: 53, manto: ['#00461C', '#EE5400'] },
  { clube: 'Jurubeba FC', tipo: 'batismo', fundador: 54, manto: ['#F6BB06', '#053F42'] },
  { clube: 'Stocco FC', tipo: 'batismo', fundador: 56, manto: ['#050306', '#6A04D7'] },
  { clube: 'Final Boss FC', tipo: 'batismo', fundador: 57, manto: ['#CD0C12', '#070505'] },
  { clube: 'Vidraceiro FC', tipo: 'batismo', fundador: 58, manto: ['#2186D9', '#080809'] },
  { clube: 'Bagres 1993', tipo: 'batismo', fundador: 59, manto: ['#084C2C', '#F3F1EC'] },
  { clube: 'Nova Eclipse FC', tipo: 'batismo', fundador: 60, manto: ['#0A0A0A', '#E3E2E1'] },
  { clube: 'Sistematizados FC', tipo: 'batismo', fundador: 61, manto: ['#0D0C10', '#6E16C3'] },
  { clube: 'Briga de Galo FC', tipo: 'batismo', fundador: 62, manto: ['#0F0E0E', '#EAE5E1'] },
  { clube: 'São Marcos Antônio FC', tipo: 'batismo', fundador: 68, manto: ['#033E23', '#ECEAD4'] },
  { clube: 'Bonança SSFC', tipo: 'batismo', fundador: 63, manto: ['#101210', '#F1C02C'] },
  { clube: 'Só Deus Sabe FC', tipo: 'batismo', fundador: 65, manto: ['#12100F', '#D19B36'] },
  { clube: 'Bagres de Wall Street FC', tipo: 'batismo', fundador: 66, manto: ['#100E0D', '#EAAD3D'] },
  { clube: 'Leite de Verdade FC', tipo: 'batismo', fundador: 67, manto: ['#EBE0CD', '#090908'] },
  { clube: 'Fala D10', tipo: 'batismo', fundador: 64, manto: ['#0E0C0B', '#DD9C30'] },
  { clube: 'Corporação Capsule FC', tipo: 'batismo', fundador: 55, manto: ['#050A13', '#0C5CB3'] },
  { clube: 'Inter de Bailão', tipo: 'batismo', fundador: 30, manto: ['#0040CD', '#040609'] }, // 🪩 ex-Alfacehh (renomeado pelo dono em 14/09)
  { clube: 'Barcenite FC', tipo: 'batismo', fundador: 31, manto: ['#F2B010', '#013882'] },
  { clube: 'Manfré FC', tipo: 'batismo', fundador: 34, manto: ['#EC121C', '#0135A3'] },
  { clube: 'Remoçada', tipo: 'batismo', fundador: 35 },
  { clube: 'Scorporila FC', tipo: 'batismo', fundador: 36, manto: ['#161516', '#E3DCD6'] },
  { clube: 'Deportivo Montreal', tipo: 'batismo', fundador: 37 },
  { clube: 'Marolados FC', tipo: 'batismo', fundador: 38, manto: ['#024623', '#F5EBD7'] },
  { clube: 'Papão United Madrid', tipo: 'batismo', fundador: 39, manto: ['#001A6C', '#D4D6DD'] },
  { clube: 'Eros FC', tipo: 'socio', fundador: null },
  { clube: 'Sapekeiros FC', tipo: 'batismo', fundador: 41 },
  { clube: 'Rei da Bola FC', tipo: 'batismo', fundador: 70, manto: ['#D4121F', '#121010'] },
  { clube: 'Raiva Cajuri FC', tipo: 'batismo', fundador: 71, manto: ['#0F0505', '#C40B0E'] },
  { clube: 'Seven City', tipo: 'batismo', fundador: 42, manto: ['#032F13', '#F8EEDC'] },
  { clube: 'Tricolor do Arruda FC', tipo: 'batismo', fundador: 43, manto: ['#110D0E', '#F5F2EF'] },
  { clube: 'Coringas do Diniz', tipo: 'batismo', fundador: 44 },
  { clube: 'Nata de SP', tipo: 'batismo', fundador: 45 },
  { clube: 'Crias do Bigão', tipo: 'batismo', fundador: 46 },
  { clube: 'Theuzudo FC', tipo: 'batismo', fundador: 47, manto: ['#F06000', '#0C0C0C'] },
  { clube: 'São Luiz FC', tipo: 'batismo', fundador: 48, manto: ['#C70107', '#080808'] },
  { clube: 'Milhaça FC', tipo: 'batismo', fundador: 49, manto: ['#AE1A13', '#F3B212'] },
  { clube: 'Esqueceram do Lluch', tipo: 'batismo', fundador: 50, manto: ['#C00018', '#111111'] },
  { clube: 'La Bestia Negra', tipo: 'batismo', fundador: 51, manto: ['#011B8A', '#E8E8EB'] },
  { clube: 'SC Ferrari', tipo: 'batismo', fundador: 52, manto: ['#C2452F', '#141414'] },
  { clube: 'Futpoint FC', tipo: 'socio', fundador: null },
  { clube: 'Internacional de Madrid', tipo: 'batismo', fundador: 69, manto: ['#A90605', '#FCF6F1'] },
  { clube: 'Fridão FC', tipo: 'batismo', fundador: 72, manto: ['#161616', '#D5D5D5'] },
  { clube: 'Pesadelo Verde FC', tipo: 'batismo', fundador: 73, manto: ['#030A04', '#597751'] },
]

/** chave de comparação: ignora caixa, acento e o FC/EC/SC/AS do fim */
export const chaveClube = (nome: string): string =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+(FC|EC|SC|AS)$/i, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '')

const PORCHAVE = new Map(BATISMOS.map(b => [chaveClube(b.clube), b]))
/** acha o clube pelo nome (qualquer forma: com FC, sem acento, minúsculo) */
export const batismoDe = (nome: string): Batismo | null => PORCHAVE.get(chaveClube(nome)) ?? null

/**
 * 🎽 as 2 cores do manto de um clube, pelo NOME. `null` = clube de CPU, ou
 * batismo cujo dono ainda não mandou camisa — e aí quem chamou usa o genérico.
 */
export const mantoDoClube = (nome?: string | null): [string, string] | null =>
  (nome ? batismoDe(nome)?.manto ?? null : null)
