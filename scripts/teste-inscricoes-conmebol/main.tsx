// Bancada exclusivamente local, sem autenticação nem leitura de saves reais.
import {createRoot} from 'react-dom/client'
import {INITIAL,reducer} from '../../src/escalacao/store'
import '../../src/escalacao/screens'
import {TabelaEstadualAoVivo} from '../../src/escalacao/pyramidseason'
import {_bancadaApoio} from '../../src/escalacao/apoio'
import {_forcaBrasilOficialParaTeste} from '../../src/escalacao/sport'
import {carregaBaralhoOficial} from '../../src/escalacao/baralho-oficial-carga'
import '../../src/index.css'
_bancadaApoio('auditoria-local@example.invalid','ouro');_forcaBrasilOficialParaTeste(true)
await carregaBaralhoOficial()
const state=reducer(structuredClone(INITIAL),{type:'START_CAREER_SOLO',teamName:'Brasiliense',formation:'4-3-3',rivals:3,oficial:{clube:'Brasiliense'}})
if(!state.oficial)throw new Error('Fixture oficial ausente')
const root=createRoot(document.getElementById('root')!)
Object.assign(window, {qaState:state,qaReducer:reducer,qaRenderTable:(props:Parameters<typeof TabelaEstadualAoVivo>[0])=>root.render(<TabelaEstadualAoVivo {...props}/>),qaReady:true})
