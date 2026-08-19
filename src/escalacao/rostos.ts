// ─── 📸 ROSTO DE JOGADOR — quem já tem foto e onde ela mora ─────────────────
//
// Decisão do Diego (19/08): *"não se importe com o tempo que vai demorar, mas
// eu vou fazer de todos sim... posso lançar aos poucos"*. Então o sistema
// inteiro foi montado pra ELE PODER LANÇAR AOS POUCOS sem o jogo ficar
// esquisito no meio do caminho:
//
//   · jogador COM foto  → aparece a foto;
//   · jogador SEM foto  → fica EXATAMENTE como está hoje (a letra do nome).
//
// Com zero foto na pasta, o jogo é idêntico ao de antes. Com 10 fotos, só esses
// 10 mudam. Não existe "meio quebrado".
//
// ── POR QUE A FOTO MORA EM `public/rostos/` E NÃO EM `src/` ─────────────────
// Arte de batismo entra por `import` porque são poucas. Aqui vão ser MILHARES.
// Se cada rosto fosse um `import`, o código teria 3.000 linhas de import e o
// bundle carregaria 3.000 endereços — isso é peso que TODO jogador baixa, até
// quem nunca cruzar com aquele jogador.
//
// Em `public/`, o arquivo é copiado como está e o endereço é montado na hora a
// partir do nome do jogador. Resultado: **zero peso no bundle por jogador
// novo**, e o Diego adiciona foto sem ninguém mexer numa linha de código.
//
// A única coisa que o código precisa saber é QUEM já tem foto — e isso vem da
// lista gerada em `rostos-lista.ts`, escrita sozinha pelo
// `scripts/rosto/foto-jogador.py`. Não editar aquele arquivo na mão.
import { ROSTOS_PRONTOS } from './rostos-lista'

/** nome do jogador → nome do arquivo (sem acento, minúsculo, com hífen). */
export function slugRosto(nome: string): string {
  return nome
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Endereço da foto do jogador, ou `null` se ele ainda não tem.
 * `null` é o caminho normal — hoje quase todo mundo cai aqui, e a carta fica
 * igual sempre foi.
 */
export function fotoDoJogador(nome: string): string | null {
  const s = slugRosto(nome)
  return ROSTOS_PRONTOS.has(s) ? `${import.meta.env.BASE_URL}rostos/${s}.webp` : null
}

/** quantos jogadores já ganharam rosto (pro Diego acompanhar o progresso). */
export const quantosRostos = (): number => ROSTOS_PRONTOS.size
