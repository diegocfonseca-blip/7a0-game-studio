// 👕 27/10 — UNIFORMES do 3D: a configuração de cada time. Um boneco só (jogador.glb) serve pra todos; o que muda é ESTA ficha,
// que o material lê (jogador-novo.mjs). A camisa aceita padrões que seguem o CORPO (não os pedaços da textura), calção e meião
// têm cor própria, e a pele, o rosto e o cabelo nunca recebem cor de uniforme (o mapa de regiões garante).
//   tipo: 'liso' · 'listras_v' (verticais) · 'listras_h' (horizontais) · 'faixa' (diagonal) · 'metade' (duas cores) · 'padrao' (imagem)
//   corpo/detalhe: as duas cores da camisa (detalhe = listra, faixa, a outra metade)
//   mangas/gola: cor própria (se faltar, mangas = corpo e gola = detalhe)
//   calcao/meiao/chuteira: cores próprias (chuteira opcional; sem ela fica a preta original)
//   n: quantas listras na frente · largura: fração da listra/faixa (0–1) · padrao: URL de imagem da camisa ABERTA (metade esquerda =
//   frente, da axila esquerda à direita; metade direita = costas; de baixo = barra até em cima = gola)
import {luminance} from './kit-contrast.mjs'

export const TIPOS = { liso: 0, listras_v: 1, listras_h: 2, faixa: 3, metade: 4, padrao: 5 }

// times com camisa conhecida (o resto sai sozinho das cores do clube em `uniformeDoTime`)
export const UNIFORMES = {
  'Milan': { tipo: 'listras_v', corpo: '#C2201F', detalhe: '#101010', gola: '#101010', mangas: '#C2201F', calcao: '#ffffff', meiao: '#101010', n: 9, largura: .48 },
  'Flamengo': { tipo: 'listras_h', corpo: '#C8102E', detalhe: '#101010', gola: '#101010', calcao: '#ffffff', meiao: '#C8102E', n: 7, largura: .5 },
  'Botafogo': { tipo: 'listras_v', corpo: '#101010', detalhe: '#ffffff', gola: '#101010', calcao: '#101010', meiao: '#9a9a9a', n: 9, largura: .5 },
  'Vasco': { tipo: 'faixa', corpo: '#ffffff', detalhe: '#101010', gola: '#101010', calcao: '#ffffff', meiao: '#ffffff', largura: .16 },
}
// goleiro: camisa própria (o mesmo amarelo do jogo de hoje)
export const GOLEIRO = { tipo: 'liso', corpo: '#d6b329', detalhe: '#1b1b1b', gola: '#1b1b1b', calcao: '#1b1b1b', meiao: '#d6b329' }

const oposta = cor => luminance(cor) > .45 ? '#1c1c1c' : '#f2f2f2'
const valida = c => /^#[0-9a-f]{6}$/i.test(c ?? '')
/** A ficha completa de um time: a cadastrada em UNIFORMES, ou uma lisa montada das cores do clube (cor1 = principal).
 *  `contraste`: cor que o jogo escolheu pra não brigar com o rival (kit-contrast.mjs) — vira o CORPO, mesmo em ficha cadastrada. */
export function uniformeDoTime(nome, cor1, cor2, contraste = null) {
  const fixo = UNIFORMES[nome]
  const c1 = valida(cor1) ? cor1 : '#ffffff', c2 = valida(cor2) && cor2.toLowerCase() !== c1.toLowerCase() ? cor2 : oposta(c1)
  const k = fixo ? { ...fixo } : { tipo: 'liso', corpo: c1, detalhe: c2, gola: c2, calcao: c2, meiao: c1 }
  if (valida(contraste)) { k.corpo = contraste; k.mangas = contraste }
  return completa(k)
}
/** Preenche o que faltou (mangas = corpo, gola = detalhe, chuteira opcional) — toda ficha chega inteira no material. */
export function completa(k) {
  const corpo = k.corpo ?? '#ffffff', detalhe = k.detalhe ?? oposta(corpo)
  return { tipo: k.tipo ?? 'liso', corpo, detalhe, mangas: k.mangas ?? corpo, gola: k.gola ?? detalhe, calcao: k.calcao ?? detalhe, meiao: k.meiao ?? corpo,
    chuteira: k.chuteira ?? null, n: k.n ?? 8, largura: k.largura ?? .5, padrao: k.padrao ?? null }
}
/** Chave de cache: dois jogadores com a mesma ficha dividem os MESMOS valores no material (e a mesma imagem de padrão). */
export const chaveUniforme = k => JSON.stringify([k.tipo, k.corpo, k.detalhe, k.mangas, k.gola, k.calcao, k.meiao, k.chuteira, k.n, k.largura, k.padrao])
