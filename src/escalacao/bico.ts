// ─── 🕴️ BICO DE FOLGA — dados e regra (módulo PURO, sem React) ───────────
// O técnico da Várzea/Série D não vive só de futebol: nas folgas ele trabalha num
// dos patrocinadores pra ajudar o caixa do clube. É renda pequena, de começo de
// carreira, e ela SOME quando o clube cresce — de propósito.
//
// Antes esta régua estava espalhada (o valor no `store.tsx`, a lista de marcas
// repetida em `pyramidseason.tsx`). Juntei aqui porque o Diego pediu mudanças nos
// dois lugares ao mesmo tempo (15/09) e lista repetida é lista que diverge.

export type BicoMarca = 'vadico' | 'maxjoias' | 'ero' | 'reidastintas'

// 💰 QUANTO PAGA POR TEMPORADA.
// Era Várzea 2 · Série D 4. O Diego mandou subir (15/09): *"quero que aumente o
// valor do bico pra 5 moedas"*. Virou 5 nas duas — ninguém perde nada, os dois
// valores subiram. Se um dia ele quiser a escadinha de volta, é só mexer aqui.
export const BICO_VALOR: Record<'V' | 'D', number> = { V: 5, D: 5 }

// 🚪 QUANDO EXISTE: da 3ª temporada em diante, e só com o clube na Várzea ou na
// Série D. Chegou na Série C, o bico acaba — o clube já paga, ele virou nome
// grande. Caiu de volta pra D, reabre.
export const BICO_TEMPORADA_MIN = 3
export function bicoElegivel(seasonNo: number, div: string): boolean {
  return seasonNo >= BICO_TEMPORADA_MIN && (div === 'V' || div === 'D')
}

export interface BicoOpcao {
  k: BicoMarca; ic: string; bg: string; nome: string
  /** o cargo, curtinho, pro cartão */
  cargo: { pt: string; en: string }
  /** 📖 POR QUE ele faz isso da vida — pedido do Diego (15/09): *"quero a
   *  historinha dizendo o porquê e o que ele escolhe fazer da vida"*.
   *  ⚠️ A história é sempre sobre o TÉCNICO (você), nunca sobre o dono da marca:
   *  são negócios de amigos de verdade do Diego, e a regra permanente dele é
   *  NÃO INVENTAR como uma pessoa real é. */
  historia: { pt: string; en: string }
}
export const BICO_MARCAS: BicoOpcao[] = [
  {
    k: 'vadico', ic: '🚗', bg: '#FDE68A', nome: 'Vadico Veículos',
    cargo: { pt: 'vendedor nas folgas', en: 'salesman on days off' },
    historia: {
      pt: 'Você passou a vida convencendo jogador a ficar mais um ano — vender carro é a mesma lábia, só que com chave na mão. Pegou o turno das folgas porque o pátio fecha cedo e dá pra ver o jogo das nove.',
      en: 'You spent your life talking players into one more year — selling cars is the same patter, just with keys in your hand. You took the day-off shift because the lot closes early and you can still catch the late game.',
    },
  },
  {
    k: 'maxjoias', ic: '💍', bg: '#F5D0E8', nome: 'Max Jóias',
    cargo: { pt: 'atendente na loja', en: 'shop assistant' },
    historia: {
      pt: 'Entrou pra ajudar no balcão numa semana corrida e ficou pelo silêncio: na loja ninguém xinga o técnico. Aprendeu a olhar aliança com a mesma cara de quem olha tabela — sem demonstrar nada.',
      en: 'You stepped behind the counter to help out one busy week and stayed for the quiet: in a shop nobody yells at the manager. You learned to look at a ring the way you look at the table — giving nothing away.',
    },
  },
  {
    k: 'ero', ic: '🦷', bg: '#CFE8FB', nome: 'Ero Odontologia',
    cargo: { pt: 'recepcionista', en: 'receptionist' },
    historia: {
      pt: 'Marcar horário é escalar time numa planilha mais calma. Pegou o turno da tarde porque cabe entre o treino e o jogo — e porque a cadeira da recepção é bem mais macia que o banco de reservas.',
      en: 'Booking appointments is picking a line-up on a calmer spreadsheet. You took the afternoon shift because it fits between training and the match — and because the reception chair beats the dugout bench.',
    },
  },
  {
    k: 'reidastintas', ic: '🎨', bg: '#FBD0C6', nome: 'Rei das Tintas',
    cargo: { pt: 'pintor nas folgas', en: 'painter on days off' },
    historia: {
      pt: 'Você já pintou o muro do campo de graça duas vezes; na terceira resolveu cobrar. Com o rolo na mão dá pra pensar na escalação por três horas seguidas sem ninguém interromper — e ainda sai dinheiro no fim.',
      en: 'You painted the ground wall for free twice; the third time you decided to charge. With a roller in your hand you get three straight hours to think about the line-up with nobody interrupting — and money at the end.',
    },
  },
]
export const bicoMarcaDe = (k?: string): BicoOpcao | undefined => BICO_MARCAS.find(b => b.k === k)
