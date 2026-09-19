// 🧪 Bancada dos DOIS CAMPINHOS DO LEILÃO — monta o `Campinho` DE VERDADE (o
// componente do jogo), com `bench` em cima e titulares embaixo, exatamente como
// o `YourPitch` faz no leilão de reservas.
//
// Por que nasceu: em 19/09 o Diego corrigiu a minha resposta — *"o campinho que
// eu tava falando era o do leilão, quando vai pro leilão aparecem dois
// campinhos"*. E ele estava certo: o campinho do BANCO tinha exatamente o mesmo
// número de lugares que a formação, então qualquer jogador além disso na posição
// não aparecia em desenho nenhum. Isto aqui é pra OLHAR, antes e depois.
//
//   ?form=4-2-3-1 → a formação (rótulo do Diego; por dentro roda a equivalente)
//   ?ata=3        → quantos atacantes o elenco tem
import { createRoot } from 'react-dom/client'
import { EscProvider } from '../../src/escalacao/store'
import { Campinho } from '../../src/escalacao/screens'
import { FORMATIONS } from '../../src/escalacao/types'
import type { Manager, WonCard, Sector, FormationKey } from '../../src/escalacao/types'
import LENDAS from '../../src/escalacao/legend-avatars.json'
import '../../src/index.css'

const q = new URLSearchParams(location.search)
const COMO_RODA: Record<string, FormationKey> = { '4-2-3-1': '4-5-1', '4-1-4-1': '4-5-1', '4-3-1-2': '4-4-2' }
const ROTULO = q.get('form') ?? '4-2-3-1'
const FORM: FormationKey = COMO_RODA[ROTULO] ?? (ROTULO as FormationKey)
const ATA = Number(q.get('ata') ?? 3)

// 🧑 nomes REAIS do catálogo de rostos: sem a trinca certa (nome+clube+ano) o
// boneco vem sem cara e a bancada mente. E CADA UM NA SUA POSIÇÃO — senão o print
// sai com o Dani Alves de centroavante e a conversa vira sobre isso.
type Lenda = { name: string; club: string; year: number }
const TODAS = LENDAS as Lenda[]
const POR_POS: Record<Sector, string[]> = {
  GOL: ['Rogério Ceni', 'Dida', 'Taffarel', 'Gilmar', 'Emerson Leão'],
  LAT: ['Cafu', 'Roberto Carlos', 'Djalma Santos', 'Nílton Santos', 'Leandro', 'Júnior'],
  ZAG: ['Luís Pereira', 'Hilderaldo Bellini', 'Mauro Galvão', 'Thiago Silva', 'Daniel Passarella', 'Domingos da Guia'],
  MEI: ['Zico', 'Sócrates', 'Raí', 'Falcão', 'Gérson', 'Didi', 'Ademir da Guia', 'Rivaldo', 'Kaká', 'Rivelino', 'Toninho Cerezo'],
  ATA: ['Romário', 'Careca', 'Garrincha', 'Jairzinho', 'Reinaldo'],
}
const acha = (nome: string) => TODAS.find(l => l.name === nome)
let i = 0
const ORDEM: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const squad: WonCard[] = []
for (const pos of ORDEM) {
  // 2× a formação (titular + banco) e, no ataque, o número que a bancada pediu
  const quantos = pos === 'ATA' ? ATA : 2 * FORMATIONS[FORM][pos]
  for (let k = 0; k < quantos; k++, i++) {
    const l = acha(POR_POS[pos][k] ?? '') ?? { name: `${pos} ${k + 1}`, club: 'Várzea', year: 1990 }
    squad.push({ id: `c${i}`, name: l.name, club: l.club, year: l.year, pos,
      fame: 1 + (i % 5), lo: 60 + (i % 25), hi: 78 + (i % 20), paid: 12 + i * 3, via: 'leilao' } as unknown as WonCard)
  }
}
const mgr = { id: 7, name: 'Diego', teamName: 'Nova Eclipse', isHuman: true, auctionRival: false, squad,
  formation: FORM, formationView: ROTULO === FORM ? undefined : ROTULO } as unknown as Manager

createRoot(document.getElementById('root')!).render(
  // 📐 a MESMA coluna do jogo (max-w-xl), senão o campinho sai de um tamanho que
  // ninguém tem na tela.
  <EscProvider><div className="max-w-xl mx-auto" style={{ padding: '14px 14px 20px', background: '#F4ECD6' }}>
    <div className="space-y-2">
      <Campinho m={mgr} small bench title="🔁 Banco" />
      <Campinho m={mgr} small title="⭐ Titulares" />
    </div>
  </div></EscProvider>
)
