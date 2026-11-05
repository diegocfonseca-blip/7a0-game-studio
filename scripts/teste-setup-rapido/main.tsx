// 🧪 Bancada da tela de MONTAR A PARTIDA RÁPIDA (05/11): as opções que vieram das salas (Relâmpago, liga de 10, Seleções, por
// década, Várzea). Abrir /scripts/teste-setup-rapido/index.html. ?modo=relampago marca o Relâmpago · ?modo=selecoes marca Seleções.
import '../../src/index.css'
import { createRoot } from 'react-dom/client'
import { EscCtxBancada, INITIAL } from '../../src/escalacao/store'
import { EscSetup } from '../../src/escalacao/screens'
const st = { ...INITIAL, screen: 'setup' }
createRoot(document.getElementById('root')!).render(<EscCtxBancada.Provider value={{ state: st, dispatch: () => {}, kickPlayer: () => {}, leaveRoom: () => {} } as never}><EscSetup /></EscCtxBancada.Provider>)
