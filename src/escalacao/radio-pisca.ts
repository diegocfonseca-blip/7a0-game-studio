// 📻 26/10 (Diego, prints do Football Manager): no GOL a faixa de narração PISCA SEM PARAR durante o momento do gol, trocando
// [verde do Bom Jogador · letra bege] ⇄ [bege · letra preta] (o normal da faixa é bege com letra preta), e grita "GOOOOL DO <time>!" (*"trocando entre o verde… e o creme… igual nas fotos do FM"*) — a cor é sempre essa, de qualquer time.
// Serve o placar cinema (rádio) e o Campo 2D (faixa do locutor). Só cor: não mexe em placar nem relógio.
import type { CSSProperties } from 'react'
import './radio-pisca.css'

/** quanto tempo a faixa pisca depois do gol (Diego: *"cuidado pra não ficar muito comprido"*) */
export const PISCA_GOL_MS = 6000
/** o verde do 🎯 Bom Jogador (o mesmo do selo da carta) e o creme do jogo */
const VERDE = '#2E9E5B', CREME = '#F4ECD6'

export function estiloPisca(): CSSProperties {
  return { '--ll44-a': VERDE, '--ll44-b': CREME } as CSSProperties
}
/** 🔁 26/10 (2ª conversa): durante o pisca a faixa não narra o lance — ela grita o gol, com o nome do time que marcou */
export function gritoGol(time: string, en: boolean): string {
  return en ? `⚽ GOOOOAL FOR ${time.toUpperCase()}!` : `⚽ GOOOOOL DO ${time.toUpperCase()}!`
}
