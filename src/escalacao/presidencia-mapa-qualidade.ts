// ⚙️ QUALIDADE DO MAPA (04/11, Diego: *"no meu celular está entrando o mapa, porém no meu PC que está mais pesado não está
// entrando, travou"* + *"quando o usuário clicar uma vez no padrão que ele quer fica… só caso o mapa comece a travar"*).
// Antes o jogo escolhia pelo TIPO de aparelho: todo PC ganhava o pacote mais pesado (sombras, imagem 4× maior, 60 quadros, cidade
// cheia) — e PC fraco travava. Agora são 3 níveis, guardados NO APARELHO; a escolha fica até a pessoa trocar. A única troca
// automática é pra BAIXO (pro Leve), e só quando o mapa trava de verdade (demorou demais pra abrir ou ficou engasgando).
export type NivelMapa = 'leve' | 'padrao' | 'alta'
export const NIVEIS_MAPA: readonly NivelMapa[] = ['leve', 'padrao', 'alta']
const CHAVE = 'pc3-qualidade-v1'

/** Sem escolha guardada: celular começa no Leve (é o que ele já usava), PC começa no Padrão (nunca mais no pesado de cara). */
export function nivelMapaInicial(): NivelMapa {
  try { const v = localStorage.getItem(CHAVE); if (v === 'leve' || v === 'padrao' || v === 'alta') return v } catch { /* sem armazenamento */ }
  try { if (window.matchMedia('(pointer: coarse)').matches) return 'leve' } catch { /* idem */ }
  return 'padrao'
}
export function guardaNivelMapa(n: NivelMapa) { try { localStorage.setItem(CHAVE, n) } catch { /* sem armazenamento: vale só nesta visita */ } }

/** O que cada nível muda no desenho (o mundo, as regras e o jogo são os mesmos nos três). */
export function ajustesNivelMapa(n: NivelMapa) {
  return {
    leve: n === 'leve',                                          // sem sombras extras, como no celular
    tetoPixel: n === 'leve' ? 1 : n === 'padrao' ? 1.25 : Infinity, // nitidez máxima da imagem
    maxFPS: n === 'leve' ? 30 : n === 'padrao' ? 45 : 60,
    sombra: n === 'alta' ? 2048 : 1024,
    populacaoReduzida: n !== 'alta',                             // metade da gente/carros andando
  }
}

/** Abriu devagar demais? (o mundo + a placa de vídeo levaram mais que isso até o 1º desenho) */
export const ABRIR_LENTO_MS = 8000
/** Engasgando: média do intervalo entre quadros (com o mapa andando) acima disso, por pelo menos N quadros. */
export const ENGASGO_MS = 120, ENGASGO_QUADROS = 40
export function proximoEngasgo(media: number, intervalo: number) { return media <= 0 ? intervalo : media * 0.9 + intervalo * 0.1 }
