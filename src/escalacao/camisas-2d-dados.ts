// 👕 CAMISAS DO CAMPO 2D — de onde vem o KIT de cada time (as regras moram em `camisas-2d.ts`).
// 🔒 Em SALA online só entra dado que a sala inteira tem: a lista pública dos batismos (por NOME) e o que o servidor disse
// dos assentos (`esc_mantos_sala`/`esc_mimos_sala`, registrado em mimos.ts). O e-mail de quem olha só vale FORA de sala
// (carreira offline: só o próprio dono vê a tela dele). A trava `npm run camisas-2d` confere isso.
import { mantoDoClube } from './batismos'
import { mantoDaSala, manto2DaSala, mascoteDaSala, estouEmSala, ehMeuClube, meuMascoteBatismo, nomeSemEscudo } from './mimos'
import { meuManto, meuMantoC3, meuKit2, mantoTriDaChave } from './manto'
import { kitLimpo } from './camisas-2d'

// o nome sem selo/emoji e sem o "(você)" — a mesma limpeza de `nomeLimpo` (escudos.tsx), copiada pra este arquivo poder rodar
// na trava sem puxar as artes (.webp) do jogo
const limpo = (nome: string): string => nome
  .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{200D}\u{FE0F}\u{FE0E}\u{20E3}\u2061-\u2064\u206A-\u206D]/gu, '')
  .replace(/\s*\((você|voce)\)\s*$/i, '').replace(/\s+/g, ' ').trim()

/** o kit [principal, 2ª?, 3ª?] do time `nome`; `cor` = a cor que o jogo já dá a ele (tier de gente, cor do bot);
 *  `chaveFixa` = a chave da mascote pela lista FIXA de nomes (`CARIMBO_GOL`), que dá a 3ª cor (`MANTO_TRI`) */
export function kitDoTime(nome: string, cor: string, chaveFixa: (n: string) => string | undefined = () => undefined): string[] {
  const n = limpo(nome || '')
  // 🎭 quem só COPIOU o nome de um batismo não veste o manto (o mimo é do e-mail do dono)
  if (!n || /\bFAKE\b/.test(n) || nomeSemEscudo(nome)) return kitLimpo([cor])
  const sala = estouEmSala()
  const fixo = mantoDoClube(n)
  const daSala = fixo ? null : mantoDaSala(n)
  const meu = !fixo && !daSala && !sala && ehMeuClube(n) ? meuManto() : null
  const manto = fixo ?? daSala ?? meu
  if (!manto) return kitLimpo([cor])
  const chave = chaveFixa(n) ?? mascoteDaSala(n) ?? (!sala && ehMeuClube(n) ? meuMascoteBatismo() : null)
  // 🎽 09/11: a 3ª cor que a pessoa escolheu na Loja (na sala ela já vem no manto; fora, `meuMantoC3` sabe)
  const tri = manto[2] ?? (meu && manto === meu ? meuMantoC3() : mantoTriDaChave(chave))
  return kitLimpo([manto[0], manto[1], tri], cor)
}

/** 🎽 09/11: a 2ª CAMISA do time (comprada na Loja) — entra quando a 1ª bate com a do rival. null = não tem.
 *  Na sala vem do servidor (`esc_mantos_sala2`); fora de sala, só a do PRÓPRIO dono. */
export function kit2DoTime(nome: string): string[] | null {
  const n = limpo(nome || '')
  if (!n || /\bFAKE\b/.test(n) || nomeSemEscudo(nome)) return null
  const k = estouEmSala() ? manto2DaSala(n) : ehMeuClube(n) ? meuKit2() : null
  return k && k.length >= 2 ? kitLimpo(k) : null
}
