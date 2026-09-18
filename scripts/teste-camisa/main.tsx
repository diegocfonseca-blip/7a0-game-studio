// 🧪 Bancada da CAMISA DO SALÃO — monta a `CamisaLoja` DE VERDADE (o componente do
// jogo) pra cada clube cadastrado em `CAMISAS_SALAO`, do jeito que o dono vê na
// Loja do Clube: com o fornecedor no peito e o Master na barriga.
//
// Por que ela nasceu: em 18/09 o Diego pegou *"a camisa do La Bestia Negra não
// atualizou"*. A arte dele estava parada em `scripts/kits/` desde o batismo e nunca
// tinha sido publicada — o clube mostrava o molde genérico. Publicamos cinco de uma
// vez, e esta bancada é a prova de que a arte encaixa na janela (sem cortar gola nem
// barra) e de que as estampas caem no pano, não no vazio.
//
//   ?clubes=La Bestia Negra,Fridão FC   → só esses
//   ?forn=naique|adibas|pumba|penalti   → a marca do peito
//   ?alt=290                            → a altura da camisa na tela
//   ?molde=1                            → o ANTES: o molde genérico, ignorando a arte
import { createRoot } from 'react-dom/client'
import { CamisaLoja } from '../../src/escalacao/loja-tela'
import { CAMISAS_SALAO } from '../../src/escalacao/salao-camisas'

const q = new URLSearchParams(location.search)
const ALT = Number(q.get('alt') ?? 290)
const FORN = q.get('forn') ?? 'naique'
const PEDIDOS = (q.get('clubes') ?? '').split(',').map(s => s.trim()).filter(Boolean)
const CLUBES = PEDIDOS.length ? PEDIDOS : Object.keys(CAMISAS_SALAO)
const MOLDE = q.get('molde') === '1' // desenha o ANTES, pra comparação lado a lado

const OSW = { fontFamily: 'Oswald, sans-serif' } as const

createRoot(document.getElementById('root')!).render(
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center' }}>
    {CLUBES.map(time => {
      const arq = MOLDE ? undefined : CAMISAS_SALAO[time]
      return (
        <div key={time} style={{
          background: '#FFFDF5', border: '3px solid #0C0C0C', borderRadius: 18,
          boxShadow: '4px 4px 0 #000', padding: '12px 14px 10px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <CamisaLoja time={time} alt={ALT} fornId={FORN} masterNome="Rei das Tintas"
            arteBatismo={arq ? '/mantos-salao/' + arq : undefined} cores={['#1B7A3D', '#F4ECD6']} />
          <div style={{ ...OSW, fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: .4 }}>{time}</div>
          <div style={{ ...OSW, fontWeight: 500, fontSize: 11, opacity: .6 }}>{arq ?? 'molde genérico (sem arte)'}</div>
        </div>
      )
    })}
  </div>
)
