// ─── 🧊 A TEMPORADA ACABOU: O PASSADO NÃO MUDA MAIS ─────────────────────────
//
// O BUG (relato do Futpoint FC, 23/09, trazido pelo Diego): *"eu não ganhei nada
// nessa temporada, mas quando fui pegar o jogador que tinha emprestado, o jogo
// bugou e deu que eu tinha sido campeão"*. Ele trouxe o Roberto Carlos de volta
// da SAF, foi no jornal e estava campeão das DUAS copas; voltou na janela de
// empréstimo, mexeu de novo, e aí perdeu as copas e ganhou a LIGA.
//
// POR QUE ACONTECIA: o resultado da temporada não é guardado — a tela REFAZ as 38
// rodadas na hora, a partir do elenco que está no clube NAQUELE momento
// (`buildPyramid(state.managers…)`). A janela de empréstimo fica na MESMA tela,
// então trazer um jogador da SAF mudava `cpuSquads`, a conta era refeita com um
// time diferente e a temporada inteira saía outra: outro campeão, outra copa,
// outro artilheiro.
//
// ⚠️ E o pior não é a confusão, é que dava pra ABUSAR: o prêmio só é gravado
// quando a pessoa AVANÇA a temporada, então bastava mexer no elenco até cair um
// título bom e só então avançar. Ninguém achou de propósito — o Futpoint
// tropeçou — mas estava aberto.
//
// A REGRA AGORA: **depois do apito final, o mundo daquela temporada CONGELA.**
// O que acontecer depois (empréstimo, SAF, venda, compra) não reescreve o que já
// foi jogado. No começo da temporada seguinte o congelamento se desfaz sozinho,
// porque ele é preso ao NÚMERO DA TEMPORADA.
//
// 🧊 Isto aqui é só o cofrinho — quem chama é a tela da temporada
// (`pyramidseason.tsx`), que guarda o mundo simulado assim que `done` vira true.

export interface Congelado<T> { temporada: number; valor: T }

/**
 * Devolve o valor que a tela deve usar.
 *
 * · temporada AINDA RODANDO (`acabou = false`): usa o valor vivo e joga fora
 *   qualquer foto de temporada passada.
 * · ACABOU: tira a foto na primeira vez e devolve SEMPRE a foto — mesmo que o
 *   valor vivo mude depois (foi exatamente isso que reescreveu a história do
 *   Futpoint).
 *
 * A caixa é um objeto mutável (um `ref` do React) porque isto roda no meio do
 * desenho da tela: guardar em estado dispararia outro desenho, e a conta é
 * idempotente — chamar duas vezes com os mesmos argumentos dá o mesmo resultado.
 */
export function congelaNoApito<T>(
  caixa: { current: Congelado<T> | null },
  acabou: boolean,
  temporada: number,
  vivo: T,
): T {
  if (!acabou) {
    // temporada nova começou: a foto da anterior não serve mais
    if (caixa.current && caixa.current.temporada !== temporada) caixa.current = null
    return vivo
  }
  if (!caixa.current || caixa.current.temporada !== temporada) {
    caixa.current = { temporada, valor: vivo }
  }
  return caixa.current.valor
}
