// ─── 🕴️ BICO DE FOLGA — dados e regra (módulo PURO, sem React) ───────────
// O técnico da Várzea/Série D não vive só de futebol: nas folgas ele trabalha num
// dos patrocinadores pra ajudar o caixa do clube. É renda pequena, de começo de
// carreira, e ela SOME quando o clube cresce — de propósito.
//
// Antes esta régua estava espalhada (o valor no `store.tsx`, a lista de marcas
// repetida em `pyramidseason.tsx`). Juntei aqui porque o Diego pediu mudanças nos
// dois lugares ao mesmo tempo (15/09) e lista repetida é lista que diverge.

export type BicoMarca = 'vadico' | 'maxjoias' | 'ero' | 'reidastintas'

// 💰 QUANTO PAGA POR TEMPORADA — é uma ESCADA, e a escada é a carreira dele
// DENTRO da empresa (ordem do Diego, 15/09): *"aumente pra 5 na Várzea, 7 na
// Série D e 10 na Série C… e são degraus de evolução, né, na Várzea, Série D e
// Série C dentro da empresa: tipo loja de carro — lavador, depois vendedor e
// depois gerente, entendeu?"*.
export const BICO_VALOR: Record<'V' | 'D' | 'C', number> = { V: 5, D: 7, C: 10 }

// 🚪 QUANDO EXISTE: da 3ª temporada em diante, e com o clube na Várzea, Série D
// ou Série C. **Na Série B pra cima ele não quer mais** — "agora é outro nível".
export const BICO_TEMPORADA_MIN = 3
export const BICO_DIVS = ['V', 'D', 'C'] as const
export type BicoDiv = typeof BICO_DIVS[number]
export function bicoElegivel(seasonNo: number, div: string): boolean {
  return seasonNo >= BICO_TEMPORADA_MIN && (BICO_DIVS as readonly string[]).includes(div)
}
/** 🔁 QUEM JÁ FOI GRANDE E VOLTOU ganha o teto (10) em qualquer divisão do bico.
 *  Palavras do Diego: *"se ele cair novamente conta história de humildade pedindo
 *  emprego novamente, mas ganhando os mesmos 10 que é da Série C também"*.
 *  É justo: o cara já foi gerente, volta com o crachá na mão. */
export const BICO_VALOR_VOLTOU = 10
export function bicoValor(div: string, esnobou?: boolean): number {
  if (esnobou) return BICO_VALOR_VOLTOU
  return BICO_VALOR[(div as BicoDiv)] ?? BICO_VALOR.V
}

export interface BicoOpcao {
  k: BicoMarca; ic: string; bg: string; nome: string
  /** o cargo — MUDA COM A DIVISÃO, porque é a carreira dele dentro da empresa:
   *  Várzea = o degrau de baixo · Série D = o do meio · Série C = o chefe. */
  cargos: Record<BicoDiv, { pt: string; en: string }>
  /** 📖 POR QUE ele faz isso da vida — pedido do Diego (15/09): *"quero a
   *  historinha dizendo o porquê e o que ele escolhe fazer da vida"*.
   *  ⚠️ A história é sempre sobre o TÉCNICO (você), nunca sobre o dono da marca:
   *  são negócios de amigos de verdade do Diego, e a regra permanente dele é
   *  NÃO INVENTAR como uma pessoa real é. */
  historia: { pt: string; en: string }
  /** 🎩 a saída ESNOBE, quando o clube chega na Série B (ele larga o bico) */
  esnobe: { pt: string; en: string }
  /** 😅 a VOLTA humilde, quando o clube cai de novo depois de ter sido grande */
  volta: { pt: string; en: string }
}
export const BICO_MARCAS: BicoOpcao[] = [
  {
    k: 'vadico', ic: '🚗', bg: '#FDE68A', nome: 'Vadico Veículos',
    cargos: {
      V: { pt: 'lavador de carro', en: 'car washer' },
      D: { pt: 'vendedor do pátio', en: 'showroom salesman' },
      C: { pt: 'gerente da loja', en: 'shop manager' },
    },
    historia: {
      pt: 'Começou lavando carro no pátio pra fechar o mês. Passou a vida convencendo jogador a ficar mais um ano — vender carro é a mesma lábia, só que com a chave na mão. Cada degrau do clube foi um degrau ali também.',
      en: 'You started washing cars in the lot to make the month. You spent your life talking players into one more year — selling cars is the same patter, just with keys in your hand. Every step up at the club was a step up there too.',
    },
    esnobe: {
      pt: '🎩 Devolveu o crachá sem olhar pra trás: “agora eu compro o carro, não vendo.” Saiu de terno, prometeu voltar pra tomar cafezinho — e nunca mais apareceu.',
      en: '🎩 You handed back the badge without looking twice: “now I buy the car, I don\'t sell it.” Left in a suit, promised to drop by for coffee — and never showed up again.',
    },
    volta: {
      pt: '😅 Voltou com o boné na mão perguntar se ainda tinha vaga. Tinha. O pessoal não falou nada — mas guardaram o balde do lado da sua mesa, só de sacanagem.',
      en: '😅 You came back cap in hand asking if there was still an opening. There was. Nobody said a word — but they left the bucket right by your desk, just to wind you up.',
    },
  },
  {
    k: 'maxjoias', ic: '💍', bg: '#F5D0E8', nome: 'Max Jóias',
    cargos: {
      V: { pt: 'entregador', en: 'delivery runner' },
      D: { pt: 'atendente na loja', en: 'shop assistant' },
      C: { pt: 'chefe do balcão', en: 'head of counter' },
    },
    historia: {
      pt: 'Entrou levando encomenda de moto e acabou ficando pelo silêncio: na loja ninguém xinga o técnico. Aprendeu a olhar aliança com a mesma cara de quem olha tabela — sem demonstrar nada. Hoje é ele quem manda no balcão.',
      en: 'You started running deliveries on a bike and stayed for the quiet: in a shop nobody yells at the manager. You learned to look at a ring the way you look at the table — giving nothing away. Now you run the counter.',
    },
    esnobe: {
      pt: '🎩 Foi embora dizendo que agora é do outro lado do balcão: “de hoje em diante eu compro, não mostro.” Deixou o terno dobrado e a chave em cima da caixa.',
      en: '🎩 You left saying you are on the other side of the counter now: “from today I buy, I don\'t display.” You left the suit folded and the key on the till.',
    },
    volta: {
      pt: '😅 Voltou pedindo meio turno, “só até o clube endireitar”. Botaram você no balcão de novo sem dizer nada — e ninguém comentou o terno.',
      en: '😅 You came back asking for half a shift, “just until the club sorts itself out”. They put you back on the counter without a word — and nobody mentioned the suit.',
    },
  },
  {
    k: 'ero', ic: '🦷', bg: '#CFE8FB', nome: 'Ero Odontologia',
    cargos: {
      V: { pt: 'recepcionista da tarde', en: 'afternoon receptionist' },
      D: { pt: 'marca as consultas', en: 'appointment desk' },
      C: { pt: 'gerente da clínica', en: 'clinic manager' },
    },
    historia: {
      pt: 'Pegou o turno da tarde porque cabia entre o treino e o jogo — e porque a cadeira da recepção é bem mais macia que o banco de reservas. Marcar horário é escalar time numa planilha mais calma. Foi subindo e hoje a agenda inteira é sua.',
      en: 'You took the afternoon shift because it fit between training and the match — and because the reception chair beats the dugout bench. Booking appointments is picking a line-up on a calmer spreadsheet. You worked your way up and now the whole diary is yours.',
    },
    esnobe: {
      pt: '🎩 Avisou pelo telefone, no meio de uma consulta: “manda cancelar a minha agenda, que agora quem marca horário pra mim é a secretária do clube.”',
      en: '🎩 You called in the middle of an appointment: “cancel my shifts — the club secretary books my diary now.”',
    },
    volta: {
      pt: '😅 Voltou dizendo que sentia falta do cheiro de menta. Ninguém acreditou, mas te deram a agenda de volta — e o cafezinho continua ruim igual.',
      en: '😅 You came back saying you missed the smell of mint. Nobody believed you, but they gave the diary back — and the coffee is still just as bad.',
    },
  },
  {
    k: 'reidastintas', ic: '🎨', bg: '#FBD0C6', nome: 'Rei das Tintas',
    cargos: {
      V: { pt: 'carrega a lata', en: 'carries the cans' },
      D: { pt: 'pintor nas folgas', en: 'painter on days off' },
      C: { pt: 'chefe da equipe', en: 'crew boss' },
    },
    historia: {
      pt: 'Pintou o muro do campo de graça duas vezes; na terceira resolveu cobrar. Com o rolo na mão dá pra pensar na escalação por três horas seguidas sem ninguém interromper — e ainda sai dinheiro no fim. Hoje é você que diz quem pinta o quê.',
      en: 'You painted the ground wall for free twice; the third time you decided to charge. With a roller in your hand you get three straight hours to think about the line-up with nobody interrupting — and money at the end. Now you say who paints what.',
    },
    esnobe: {
      pt: '🎩 Largou o rolo no meio da parede: “quem pinta a minha casa agora é contratado.” Foi embora de carro novo, sem tirar a tinta da unha.',
      en: '🎩 You dropped the roller mid-wall: “someone else paints my house now.” You drove off in a new car, paint still under your nails.',
    },
    volta: {
      pt: '😅 Voltou dizendo que estava “só dando uma força”. Pegou o rolo, a equipe abriu espaço e ninguém lembrou da parede que ficou pela metade.',
      en: '😅 You came back saying you were “just helping out”. You picked up the roller, the crew made room, and nobody mentioned the half-finished wall.',
    },
  },
]
export const bicoMarcaDe = (k?: string): BicoOpcao | undefined => BICO_MARCAS.find(b => b.k === k)
