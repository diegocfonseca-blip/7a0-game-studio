// 🧪 Bancada da APRESENTAÇÃO DAS LENDAS (22/10): a coletiva de verdade com 1 a 4 lendas.  ?n=1..5  ?escolhe=1 (já na manchete)
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import '../../src/escalacao/screens'
import { ColetivaPasso } from '../../src/escalacao/coletiva-ui'
import { montaColetiva, respondeColetiva, COLETIVA_VAZIA, type Ctx } from '../../src/escalacao/coletiva'
const q = new URLSearchParams(location.search)
const TODAS = [{ nome: 'Romário', club: 'Vasco', year: 2000 }, { nome: 'Zico', club: 'Flamengo', year: 1981 }, { nome: 'Kaká', club: 'Milan', year: 2007 }, { nome: 'Pelé', club: 'Santos', year: 1962 }, { nome: 'Fulano Sem Rosto', club: 'Bangu', year: 1990 }]
const lendas = TODAS.slice(0, Number(q.get('n') ?? 3))
const ctx: Ctx = { rodada: 0, totalRodadas: 38, temporada: 6, div: 'B', clube: 'Nova Eclipse', semVencer: 0, vitoriasSeguidas: 0, pos: 5, total: 20, zonaSubir: false, zonaCair: false, lider: false, caixa: 193, caixaAlto: false, caixaBaixo: false, pulosSeguidos: 0, apresentacao: lendas.map(l => l.nome) }
const save = COLETIVA_VAZIA()
const pronta = montaColetiva(ctx, save, Number(q.get('seed') ?? 7))!
createRoot(document.getElementById('root')!).render(
  <ColetivaPasso pronta={pronta} clube="Nova Eclipse" placar={null} rodadaTxt="apresentação" autoSeg={null} lendas={lendas} seguirTxt="Fechar a apresentação"
    resolve={e => { const r = respondeColetiva(save, pronta, e, ctx, 7); return { manchete: r.manchete, efeito: r.efeito } }} onFim={() => {}} />
)
