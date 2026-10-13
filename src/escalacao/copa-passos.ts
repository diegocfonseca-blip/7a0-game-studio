// ─── 🌐 OS PASSOS DA COPA DO MUNDO — um lugar só pra contar ───────────────────
//
// A Copa anda por "passos" (revelações feitas): as rodadas de grupo, o sorteio,
// e cada fase do mata-mata. Três lugares precisam do MESMO número — a tela
// (`CupScreen`), as estatísticas (`copa-stats`) e o relógio sincronizado da sala
// (`copa-clock-preview` + a função `esc_copa_preview_clock` no banco). Antes cada
// um escrevia "8", "10", "11", "12" na mão, e o dia em que o formato mudasse (foi
// em 19/09, duas vezes) alguém ia esquecer um.
//
// ⚠️ O BANCO TEM CÓPIA DESTES NÚMEROS: `docs/sql/online-copa-clock-oitavas.sql`
// (`r.step < FIM` e "quais passos rodam bola"). Mudou aqui, muda lá.
//
// Este arquivo é minúsculo e não importa nada de propósito: `copa-mundo.tsx` e
// `copa-clock-preview.ts` importam um ao outro, e um terceiro lugar neutro é o
// que evita o ciclo.

// 🌍 FORMATO DE COPA DE 24 (Diego 19/09: *"pra ter as oitavas não deveria ter mais
// grupos? tem muito time no mesmo grupo"*): 6 grupos de 4, turno único = 3
// rodadas. Passam os 2 primeiros de cada grupo + os 4 MELHORES TERCEIROS = 16 →
// oitavas. É o formato do México 86, Itália 90 e EUA 94 (também de 24). Antes
// eram 4 grupos de 6 (5 rodadas) e só 8 passavam — não tinha oitavas.
export const RODADAS_GRUPO = 3

// 🏆 JOGO ÚNICO (Diego 19/09: *"a Copa do Mundo o mata-mata tem que ser um jogo
// único, porque Copa do Mundo é único"*). Oitavas, quartas, semi e final: um jogo
// cada, empate vai pros pênaltis. Vale pro online E pra carreira — é o mesmo motor.
export const PASSO_COPA = {
  SORTEIO: RODADAS_GRUPO + 1, // 4 · o chaveamento aparece
  OITAVAS: RODADAS_GRUPO + 2, // 5 · bola rolando
  QUARTAS: RODADAS_GRUPO + 3, // 6 · bola rolando
  SEMI:    RODADAS_GRUPO + 4, // 7 · bola rolando
  FINAL:   RODADAS_GRUPO + 5, // 8 · bola rolando
  FIM:     RODADAS_GRUPO + 6, // 9 · cerimônia (não roda bola)
} as const

/** os passos em que tem bola rolando (rodadas de grupo + as quatro fases do mata-mata) */
export const passoRodaBola = (s: number): boolean =>
  (s >= 1 && s <= RODADAS_GRUPO) || (s >= PASSO_COPA.OITAVAS && s <= PASSO_COPA.FINAL)

// 🎬 ABERTURA DA RODADA (Diego 13/10): antes de um passo que RODA BOLA, a sala respira 5s mostrando o
// caminho da copa + os confrontos (escudo×escudo). A pausa entre passos é decidida no APARELHO DO DONO
// (`dueClockCommand` / `useRelogioRegional`), não no banco — então o SQL do relógio não muda.
// Passo que não roda bola (sorteio, cerimônia) segue com o respiro curto de sempre.
export const ABERTURA_MS = 5000
export const respiroAntes = (proximoRodaBola: boolean, step: number): number => (proximoRodaBola ? ABERTURA_MS : step === 0 ? 500 : 1600)
