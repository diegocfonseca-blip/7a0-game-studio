// ─── 📏 QUANTA VAGA O JOGO ENXERGA, DE VERDADE ──────────────────────────────
// Não é simulação nem achismo: importa as funções DO JOGO (`slotsOf`,
// `openSlots`, `slotsCheio`, `vagaCheio`) e imprime o número que cada uma dá no
// caso que o Diego relatou em 19/09 — 4-2-3-1 (que roda como 4-5-1) com 2
// atacantes, querendo comprar o 3º.
//
// Rodar:  npx tsx scripts/mede-vaga-atacante.mts
import { slotsOf, openSlots, slotsCheio, vagaCheio, filled, marcaModoOnline } from '../src/escalacao/store'
import { _bancadaElencoNovo } from '../src/escalacao/sport'
import type { Manager, WonCard, Sector, FormationKey } from '../src/escalacao/types'

_bancadaElencoNovo(true) // elenco de 27 ligado (hoje é geral)
marcaModoOnline(false)   // offline: é onde o +1 por posição vale

const carta = (pos: Sector, i: number, extra: Partial<WonCard> = {}): WonCard =>
  ({ id: `${pos}${i}`, name: `${pos} ${i}`, club: 'Teste', year: 2000, pos, fame: 3, lo: 70, hi: 84, paid: 1, via: 'leilao', ...extra } as unknown as WonCard)

const time = (form: FormationKey, quantos: Partial<Record<Sector, number>>, extras: WonCard[] = []): Manager => {
  const squad: WonCard[] = []
  for (const pos of ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as Sector[])
    for (let i = 0; i < (quantos[pos] ?? 0); i++) squad.push(carta(pos, i))
  return { id: 1, name: 'Diego', teamName: 'Teste', isHuman: true, auctionRival: false,
    formation: form, squad: [...squad, ...extras], money: 50 } as unknown as Manager
}

const linha = (rotulo: string, m: Manager, pos: Sector) => {
  console.log(`${rotulo.padEnd(52)} | tem ${String(filled(m, pos)).padStart(2)} | alvo do pregão ${slotsOf(m, pos)} | teto do elenco ${slotsCheio(m, pos)} | 👉 vaga pra comprar: ${openSlots(m, pos)} (elenco: ${vagaCheio(m, pos)})`)
}

console.log('\n🔎 4-2-3-1 (roda como 4-5-1) — ATACANTE\n')
const cheio = { GOL: 3, LAT: 5, ZAG: 5, MEI: 11, ATA: 2 }

const fora = time('4-5-1', cheio)
linha('FORA do leilão de reservas (2 atacantes)', fora, 'ATA')

const dentro = time('4-5-1', cheio); dentro.deepSquad = true
linha('DENTRO do leilão de reservas (2 atacantes)', dentro, 'ATA')

const comSaf = time('4-5-1', cheio, [carta('ATA', 9, { emprestado: 'saf' })]); comSaf.deepSquad = true
linha('DENTRO, com 1 atacante EMPRESTADO da SAF', comSaf, 'ATA')

const tres = time('4-5-1', { ...cheio, ATA: 3 }); tres.deepSquad = true
linha('DENTRO, já com 3 atacantes (teto do elenco)', tres, 'ATA')

console.log('\n🔎 4-4-2 — ATACANTE (o +1 por posição do elenco de 27)\n')
const q442 = { GOL: 3, LAT: 5, ZAG: 5, MEI: 9, ATA: 4 }
const f442 = time('4-4-2', q442)
linha('FORA do leilão de reservas (4 atacantes)', f442, 'ATA')
const d442 = time('4-4-2', q442); d442.deepSquad = true
linha('DENTRO do leilão de reservas (4 atacantes)', d442, 'ATA')

console.log(`
📌 Leitura:
   • "alvo do pregão" = 2× a formação (o leilão de reservas mira 22)
   • "teto do elenco" = 2× a formação + 1 (o elenco de 27)
   • FORA do leilão o alvo cai pro TIME TITULAR, e é aí que a vaga some.
   • O emprestado da SAF conta em "tem" — mesmo sem gastar vaga de elenco.

🔧 O que foi consertado em 19/09 a partir DESTA medição:
   • o campinho do BANCO no leilão passou a desenhar o teto do elenco
     ("slotsCheio - slots"), então a vaga livre aparece como lugar VAZIO em vez
     de o banco parecer cheio;
   • "careerOpenSlots" parou de cortar o humano no alvo do pregão (o "Math.min"
     era pro zé do bot) — o +1 por posição agora vale também no monte.

✅ CONSERTADO TAMBÉM (19/09, depois do Diego reconfirmar a regra: *"o elenco é de
   27 jogadores + a SAF, que pode ser de um até 4 emprestados conforme as
   regras"*): o "filled()" parou de contar o emprestado. Repare na 3a linha da
   tabela de cima — antes dava "tem 3 / vaga 0" (pegar reforco na SAF te impedia
   de comprar reforco); agora da "tem 2 / vaga 1".
   ⚠️ Quem continua contando o emprestado e o "xiHoles" — e tem que contar mesmo,
   porque ele JOGA e tapa buraco de escalacao. Sao duas perguntas diferentes:
   "cabe mais um no meu elenco?" (nao conta) x "falta gente em campo?" (conta).

⏳ AINDA ABERTO, menor: o jogador SEU que esta emprestado NA SAF (loanOut) sai do
   squad, entao ele libera vaga enquanto esta fora — se voce comprasse um
   substituto, na volta dele o elenco passaria de 27. Ja era assim antes desta
   mudanca (nao e regressao) e na pratica quase nao acontece, porque o emprestimo
   volta pra SAF na virada e a compra vem depois. A conta certa existe pronta em
   "ownedRealCount" (ela soma o loanOut), se um dia precisar.
`)
