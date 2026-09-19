// 🧪 Bancada da ABA ELENCO — monta o `SquadTab` DE VERDADE (o componente do jogo,
// não um desenho) pra CONFERIR a tela nova antes de qualquer commit.
//
// Por que ela ficou assim: em 16/09 eu mandei pro Diego um print desta bancada com
// nomes e clubes INVENTADOS — e por isso ninguém tinha rosto (o rosto da lenda é
// achado pela trinca nome+clube+ano), nem gás, nem overall. Ele pegou na hora:
// *"essa arte q vc mandou tá bem diferente do meu anexo"*. Estava mesmo — e o que
// faltava era a BANCADA, não a tela. Agora ela monta o elenco com trincas REAIS do
// catálogo de rostos, liga a condição física e liga o Olheiro: o print sai igual ao
// que ele vê logado.
//
//   ?n=22  → como era antes (2× a formação)
//   ?n=27  → o banco novo: +1 por posição
//   ?n=31  → 27 + os 4 emprestados da SAF na Série A
//   ?olheiro=ouro|prata|nenhum → as três visões da coluna OVERALL
//   ?gas=0 → desliga a condição física (carreira que ainda não chegou na Série C)
import { createRoot } from 'react-dom/client'
import { EscProvider } from '../../src/escalacao/store'
import '../../src/escalacao/screens' // mesma ordem do app (o ciclo store↔pyramidseason quebra sem isto)
import { SquadTab } from '../../src/escalacao/pyramidseason'
import { _bancadaElencoNovo } from '../../src/escalacao/sport'
import { _bancadaApoio } from '../../src/escalacao/apoio'
import LENDAS from '../../src/escalacao/legend-avatars.json'
import type { Manager, WonCard, Sector } from '../../src/escalacao/types'

const q = new URLSearchParams(location.search)
const N = Number(q.get('n') ?? 27)
const OLHEIRO = q.get('olheiro') ?? 'ouro'
const GAS = q.get('gas') !== '0'
// 🎴 qual jogador já vem TOCADO (pra a ficha preta aparecer no print). `?sel=` troca.

// 🔓 desde 18/09 a tela nova é de TODO MUNDO (`ELENCO27_GERAL = true`), então isto aqui
// virou herança: o `?novo=0` não fecha mais nada, porque o GERAL ganha da lista de
// e-mails. Fica só pro dia em que alguém precisar reabrir o teste por conta.
_bancadaElencoNovo(q.get('novo') !== '0')
if (OLHEIRO !== 'nenhum') _bancadaApoio('bancada@teste', OLHEIRO === 'prata' ? 'prata' : 'ouro')

// 🧑 o elenco sai do CATÁLOGO DE ROSTOS: assim cada linha tem a trinca certa
// (nome + clube + ano) e o rosto aparece igual aparece no jogo.
type Lenda = { name: string; club: string; year: number }
const POR_POS: Record<Sector, string[]> = {
  GOL: ['Rogério Ceni', 'Dida', 'Taffarel', 'Gilmar', 'Emerson Leão'],
  LAT: ['Cafu', 'Roberto Carlos', 'Djalma Santos', 'Nílton Santos', 'Leandro', 'Júnior'],
  ZAG: ['Aldair', 'Lúcio', 'Luís Pereira', 'Mauro Galvão', 'Hilderaldo Bellini', 'Mozer'],
  MEI: ['Zico', 'Sócrates', 'Raí', 'Falcão', 'Gérson', 'Didi', 'Ademir da Guia', 'Rivaldo', 'Kaká'],
  ATA: ['Romário', 'Careca', 'Garrincha', 'Jairzinho', 'Reinaldo'],
}
const TODAS = LENDAS as Lenda[]
const acha = (nome: string): Lenda | undefined => TODAS.find(l => l.name === nome)
// quem não estiver no catálogo cai no resto da lista (nunca deixa vaga vazia)
const nomeados = new Set(Object.values(POR_POS).flat())
const sobra = TODAS.filter(l => !nomeados.has(l.name))

const ORDEM: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const BASE: Record<Sector, number> = { GOL: 2, LAT: 4, ZAG: 4, MEI: 8, ATA: 4 }
const squad: WonCard[] = []
let i = 0, sobraI = 0
const proximo = (pos: Sector, k: number): Lenda =>
  acha(POR_POS[pos][k] ?? '') ?? sobra[sobraI++] ?? { name: `Reserva ${i}`, club: 'Várzea', year: 1990 }
for (const pos of ORDEM) {
  const PROPRIOS = Math.min(N, 27) // acima de 27 o que entra é empréstimo da SAF, não elenco
  const quantos = BASE[pos] + (PROPRIOS > 22 ? 1 : 0)
  for (let k = 0; k < quantos && squad.length < PROPRIOS; k++, i++) {
    const l = proximo(pos, k)
    squad.push({ id: `c${i}`, name: l.name, club: l.club, year: l.year,
      pos, fame: 1 + (i % 5), lo: 60 + (i % 25), hi: 78 + (i % 20), paid: 12 + i * 3, via: 'leilao', contratoAte: 6 + (i % 5) } as unknown as WonCard)
  }
}
// 🏢 os emprestados da SAF entram DEPOIS e POR CIMA do teto (no jogo eles não
// ocupam vaga do elenco). Posições variadas de propósito: o empréstimo não é por posição.
if (N > 27) {
  const EMP: Sector[] = ['ZAG', 'MEI', 'ATA', 'LAT']
  for (let k = 0; k < Math.min(N - 27, EMP.length); k++) {
    const l = sobra[sobraI++]
    squad.push({ id: `emp${k}`, name: l.name, club: l.club, year: l.year, pos: EMP[k], fame: 3, lo: 70, hi: 84, paid: 0, via: 'saf', emprestado: 'saf' } as unknown as WonCard)
  }
}
const mgr = { id: 7, name: 'Diego', teamName: 'Nova Eclipse', isHuman: true, auctionRival: false, squad, formation: '4-4-2' } as unknown as Manager
const col = { solid: '#1B7A3D', light: '#CBEFD7' }
// ⚠️ O XI TEM QUE RESPEITAR A FORMAÇÃO (erro pego em 16/09): antes era
// `squad.slice(0, 11)`, que punha 3 GOLEIROS em campo e deixava o campinho com cara
// de bug — e quem olhasse o print ia achar que o JOGO estava quebrado.
const XI_442: Record<Sector, number> = { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2 }
const xi: WonCard[] = []
for (const pos of ORDEM) {
  // emprestado NÃO entra no XI da bancada: aqui o ponto é olhar o elenco próprio
  const desta = squad.filter(c => c.pos === pos && !(c as { emprestado?: string }).emprestado)
  xi.push(...desta.slice(0, XI_442[pos]))
}
const ehTitular = (id: string) => xi.some(x => x.id === id)
// 😓 gás e jogos plausíveis: titular gasta, banco está inteiro — e entra um de cada
// estado (😓 · 🥵 · 🚑 · 🩹) pra conferir a coluna STATUS inteira.
const gas: Record<string, number> = {}
const jogos: Record<string, number> = {}
squad.forEach((c, k) => {
  gas[c.id] = ehTitular(c.id) ? [72, 58, 44, 88, 26, 12, 64, 79, 35, 91, 53][k % 11] : 88 + (k % 12)
  jogos[c.id] = ehTitular(c.id) ? 18 + (k % 12) : k % 9
})
// 🧾 o que ele já tinha NO CLUBE antes desta temporada — é daqui que sai a coluna
// "NO SEU CLUBE" da ficha (o `jogos` acima JÁ vem somado, então o "nesta temporada"
// é a subtração dos dois). Números de pior caso de propósito: 3 dígitos em tudo.
const antes = {
  j: Object.fromEntries(squad.map((c, k) => [c.id, [260, 93, 12, 0, 147, 38][k % 6]])),
  gl: Object.fromEntries(squad.map((c, k) => [c.id, [160, 41, 3, 0, 77, 9][k % 6]])),
  as: Object.fromEntries(squad.map((c, k) => [c.id, [55, 18, 1, 0, 30, 4][k % 6]])),
}
// o `jogos` da tela tem que ser MAIOR que o `antes.j`, senão a subtração dá zero
for (const c of squad) jogos[c.id] += antes.j[c.id]
const condicao = GAS ? {
  gas,
  jogos,
  antes,
  volta: (id: string) => (id === squad[13]?.id ? 2 : 0),
  suspensoId: squad[16]?.id,
  prep: null,
} : undefined

const SEL = q.get('sel') === 'nenhum' ? null : (squad[Number(q.get('sel') ?? 0)] ?? squad[0]).id

createRoot(document.getElementById('root')!).render(
  // 📐 a MESMA moldura da carreira de verdade (`max-w-xl mx-auto` + padding), senão
  // a bancada mente no desktop: a aba Elenco só sai da coluna de 576px porque ela
  // EXISTE — medir sem a coluna dá um número que o jogo nunca vai ter.
  <EscProvider><div className="max-w-xl mx-auto" style={{ padding: '16px 14px 48px' }}>
    {/* 🎽 `onSetFormation` é obrigatório pro seletor de FORMAÇÃO desenhar — foi ele
        que o Diego perguntou onde fica (18/09). Sem a prop, a bancada mente de novo. */}
    <SquadTab mgr={mgr} col={col as never} coins={168} xiIds={new Set(xi.map(c => c.id))} xi={xi}
      goals={Object.fromEntries(squad.map((c, k) => [c.id, k % 4 === 0 ? k % 11 : 0]))}
      assists={Object.fromEntries(squad.map((c, k) => [c.id, k % 3 === 0 ? k % 7 : 0]))}
      onSwap={() => {}} selId={SEL} seasonNo={6} contratosOn olheiros
      onSetFormation={() => {}} onSetSubMode={() => {}} subMode="dinamico"
      criaBase={{ onSubir: () => {} }}
      condicao={condicao as never} safDiv="Série A" safSlots={4} />
  </div></EscProvider>
)
