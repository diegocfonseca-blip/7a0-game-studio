// ─── 🌐 OS PASSOS DA COPA DO MUNDO — um lugar só pra contar ───────────────────
//
// A Copa anda por "passos" (revelações feitas): as rodadas de grupo, o sorteio,
// e cada fase do mata-mata. Três lugares precisam do MESMO número — a tela
// (`CupScreen`), as estatísticas (`copa-stats`) e o relógio sincronizado da sala
// (`copa-clock-preview` + a função `esc_copa_preview_clock` no banco). Antes cada
// um escrevia "8", "10", "11", "12" na mão, e o dia em que o formato mudasse (foi
// hoje, 19/09: mata-mata em JOGO ÚNICO) alguém ia esquecer um.
//
// ⚠️ O BANCO TEM CÓPIA DESTES NÚMEROS: `docs/sql/online-copa-clock-jogo-unico.sql`
// (`r.step < FIM` e "quais passos rodam bola"). Mudou aqui, muda lá.
//
// Este arquivo é minúsculo e não importa nada de propósito: `copa-mundo.tsx` e
// `copa-clock-preview.ts` importam um ao outro, e um terceiro lugar neutro é o
// que evita o ciclo.

/** rodadas da fase de grupos (4 grupos de 6, turno único) */
export const RODADAS_GRUPO = 5

// 🏆 JOGO ÚNICO (Diego 19/09: *"a Copa do Mundo o mata-mata tem que ser um jogo
// único, porque Copa do Mundo é único"*). Quartas, semi e final: um jogo cada,
// empate vai pros pênaltis. Vale pro online E pra carreira — é o mesmo motor.
export const PASSO_COPA = {
  SORTEIO: RODADAS_GRUPO + 1, // 6 · o chaveamento aparece
  QUARTAS: RODADAS_GRUPO + 2, // 7 · bola rolando
  SEMI:    RODADAS_GRUPO + 3, // 8 · bola rolando
  FINAL:   RODADAS_GRUPO + 4, // 9 · bola rolando
  FIM:     RODADAS_GRUPO + 5, // 10 · cerimônia (não roda bola)
} as const

/** os passos em que tem bola rolando (rodadas de grupo + as três fases do mata-mata) */
export const passoRodaBola = (s: number): boolean =>
  (s >= 1 && s <= RODADAS_GRUPO) || (s >= PASSO_COPA.QUARTAS && s <= PASSO_COPA.FINAL)
