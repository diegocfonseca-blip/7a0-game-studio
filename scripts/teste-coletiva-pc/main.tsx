// 🧪 Bancada (23/10): a COLETIVA de verdade (ColetivaPasso) pra foto no computador e no celular.
//   ?lendas=1 → com lendas na bancada (só as que têm rosto sentam)  ·  ?manchete=1 → já na tela do jornal
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { ColetivaPasso } from '../../src/escalacao/coletiva-ui'
import { REPORTERES, type ColetivaPronta } from '../../src/escalacao/coletiva'
const q = new URLSearchParams(location.search)
const pronta: ColetivaPronta = {
  sit: 'goleada_contra' as ColetivaPronta['sit'], rep: REPORTERES.mila, qi: 0, vars: {},
  pergunta: ['4 a 1, presidente. Alguém vai pagar a conta dessa goleada?', '4-1, president. Is someone paying for this thrashing?'],
  opcoes: [
    { estilo: 'provoca', ri: 0, frase: ['Acidente. E acidente a gente conserta na oficina, não na imprensa.', 'An accident. We fix accidents in the garage, not in the press.'], efeito: { tipo: 'cobranca', valor: 0, txt: ['📰 A imprensa vai cobrar essa frase', '📰 The press will hold you to it'] } },
    { estilo: 'diplomata', ri: 0, frase: ['Dia pra esquecer. O grupo está unido e vai responder em campo.', 'A day to forget. The group is united.'], efeito: { tipo: 'moral_alta', valor: 2, txt: ['💪 Elenco gostou: +2 de força no próximo jogo', '💪 Squad liked it: +2'] } },
    { estilo: 'desconversa', ri: 0, frase: ['Próxima pergunta, por favor. Essa eu passo.', 'Next question, please.'], efeito: { tipo: 'moral_baixa', valor: -2, txt: ['😬 Vestiário sentiu: −2 de força no próximo jogo', '😬 Dressing room felt it: −2'] } },
  ],
}
const lendas = q.get('lendas') ? [{ nome: 'Pelé', club: 'Santos', year: 1962 }, { nome: 'Zico', club: 'Flamengo', year: 1981 }, { nome: 'Fulano Sem Rosto', club: 'Várzea', year: 2000 }] : undefined
createRoot(document.getElementById('root')!).render(
  <ColetivaPasso pronta={pronta} clube="Nova Eclipse" placar="Nova Eclipse 1 × 4 Mengão Malvadão" rodadaTxt="Rodada 1" autoSeg={null} seguirTxt="Ir pra rodada 2"
    resolve={() => ({ manchete: ['PRESIDENTE DO NOVA ECLIPSE CHAMA GOLEADA DE ACIDENTE', 'x'], efeito: null })} onFim={() => {}} lendas={lendas} />)
