// 🏀✍️ AGÊNCIA LIVRE do EUA Oficial (22/11, Diego: "pode fazendo", sem mockup).
// Regras puras (sem estado do jogo) — o reducer (store.tsx) e a tela leem as MESMAS funções.
//
// Como funciona, no jeito da NBA e com as peças que o jogo já tem:
//  • Todo jogador de franquia tem CONTRATO: o quinteto inicial 1–4 temporadas, quem chega no leilão 1–4 a partir da
//    temporada seguinte, quem vem do Draft 4 (o contrato de novato).
//  • No fim da temporada, depois do Draft, o passo ✍️ AGÊNCIA LIVRE: os contratos que acabaram.
//    Seu jogador: RENOVAR (paga 1 temporada de salário de luva e fica mais 3) ou DEIXAR IR.
//    Franquia da máquina: renova ou solta (sorteio preso na semente da carreira).
//  • Quem ficou livre entra no seu leilão de reservas da próxima temporada (o leilão de sempre).
//  • 🛡️ Ninguém fica sem jogador numa posição: o único da posição não pode sair (o seu explica o porquê; o da máquina renova).

/** temporadas a mais quando você renova */
export const EUA_RENOVA_ANOS = 3
/** contrato de quem chega pelo Draft (o contrato de novato da NBA) */
export const EUA_NOVATO_ANOS = 4
/** chance de a franquia da máquina renovar um contrato que acabou */
export const EUA_BOT_RENOVA = 0.55

/** 1 a 4 temporadas, sorteado preso no jogador + temporada + semente (sempre o mesmo número pra mesma carreira) */
export function anosContratoEua(chave: string, temporada: number, semente: number): number {
  let h = (semente ^ (temporada * 2654435761)) >>> 0
  for (let i = 0; i < chave.length; i++) h = Math.imul(h ^ chave.charCodeAt(i), 16777619) >>> 0
  return 1 + (h % 4)
}

/** a luva da renovação = 1 temporada do salário dele (salário = valor ÷ 10, a régua do jogo) */
export function luvaRenovacaoEua(paid: number | null | undefined): number {
  return Math.max(1, Math.round((paid ?? 0) / 10))
}

/** o contrato acabou nesta temporada (ou antes)? */
export function contratoAcabou(ate: number | undefined, temporada: number): boolean {
  return ate != null && ate <= temporada
}
