// 🧪 Bancada do SALÃO DOS BATISMOS — monta o `Salao` DE VERDADE (o componente do
// jogo) pra conferir quem aparece na lista e como fica o detalhe de cada clube.
//
// Por que nasceu: em 19/09 o Diego mandou tirar do oculto os dois últimos clubes
// escondidos — *"pode tirar ele de ser oculto, pode mostrar já. Marreco também"* —
// e os dois estão SEM arte. Antes de dizer que está pronto, é melhor olhar o que
// aparece de fato no lugar do escudo, da mascote e do manto.
//
// ⚠️ A aba TORCIDAS não tem como funcionar aqui: ela lê uma RPC do Supabase, e
// este ambiente não alcança o banco (o proxy bloqueia). A tela trata a falha
// sozinha e mostra o aviso de "não foi possível carregar" — o que dá pra conferir
// na bancada é a aba CLUBES, que sai inteira do código.
import { createRoot } from 'react-dom/client'
import Salao from '../../src/escalacao/salao'

createRoot(document.getElementById('root')!).render(<Salao />)
