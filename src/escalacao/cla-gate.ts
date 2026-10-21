// ⚔️ trava dos Clãs num arquivo leve (21/10): o letreiro (patrocinio.ts) precisa saber se mostra o pódio dos clãs
// sem puxar a tela inteira do clã pro pedaço do jogo que todo mundo baixa.
import { loggedEmail } from './apoio'

const CLAS_GERAL = false // 🔒 21/10: por enquanto só nas contas do Diego (teste); liberar = true
const CLAS_TESTERS = new Set(['diego.c.fonseca@gmail.com', 'diego.c.fonseca2@gmail.com'])
export const clasLiberado = (email: string | null | undefined = loggedEmail()) => CLAS_GERAL || (!!email && CLAS_TESTERS.has(email.toLowerCase()))
