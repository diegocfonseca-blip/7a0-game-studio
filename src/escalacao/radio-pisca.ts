// 📻 26/10 (Diego, prints do Football Manager): no GOL a faixa de narração PISCA uns 2 s trocando fundo e letra entre o VERDE do
// Bom Jogador e o creme do jogo (*"trocando entre o verde… e o creme… igual nas fotos do FM"*) — a cor é sempre essa, de qualquer time.
// Serve o placar cinema (rádio) e o Campo 2D (faixa do locutor). Só cor: não mexe em placar nem relógio.
import type { CSSProperties } from 'react'
import './radio-pisca.css'

/** quanto tempo a faixa pisca depois do gol (Diego: *"cuidado pra não ficar muito comprido"*) */
export const PISCA_GOL_MS = 2400
/** o verde do 🎯 Bom Jogador (o mesmo do selo da carta) e o creme do jogo */
const VERDE = '#2E9E5B', CREME = '#F4ECD6'

export function estiloPisca(): CSSProperties {
  return { '--ll44-a': VERDE, '--ll44-b': CREME } as CSSProperties
}
