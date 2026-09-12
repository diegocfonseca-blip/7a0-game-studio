// 🎽 MANTO DO CORAÇÃO + personalização do sócio (manto/estádio/mascote).
// Fonte OFICIAL: esc_socios no Supabase (Diego seta pelo painel via
// esc_admin_socio_perso). A lista no código vira reserva (beta da conta do
// Diego). A fichinha branca do campinho FICA como é — o coração entra como
// FAIXINHA LISTRADA no topo + barrinha de título, nas cores do clube que o
// dono torce. ⚠️ Nome/escudo de clube REAL nunca aparece: só as CORES.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loggedEmail } from './apoio'
import { registraMeuBatismo } from './mimos'
import { getLang } from './lang' // 🌐 NOME_MSG sai no idioma do botão BR/EN

// reserva no código (beta) — conta → [cor1, cor2]
export const MANTO_CONTAS: Record<string, [string, string]> = {
  // 🦇 Neymarzetti — PRETO e PRATA, MEDIDOS na arte que o dono mandou (24/08).
  // Antes era vermelho e preto (❤️🖤): a camisa nova é listrada preto/prata, e a
  // regra é que o manto sai das 2 cores da arte, nunca chutado.
  'diego.c.fonseca@gmail.com': ['#141416', '#B6B7B8'],
  'adriano.ferrari@quepazseguros.com.br': ['#C2452F', '#141414'], // 🏎️ Ferrari SC — vermelho e preto
  'matheusfilipealves@hotmail.com': ['#F06000', '#0C0C0C'], // 🦇 Theuzudo FC — laranja e preto, MEDIDOS na arte que o dono mandou (21/08)
  'fontourajoao04@gmail.com': ['#00461C', '#EE5400'], // 🦜🛒 Al Takhadao FC — verde e laranja, MEDIDOS na camisa que o dono mandou (01/09)
  'luizguilhermeps@hotmail.com': ['#F6BB06', '#053F42'], // 🧦 Jurubeba FC — amarelo e verde-petróleo, MEDIDOS na camisa que o dono mandou (02/09)
  'caiohcris@gmail.com': ['#084C2C', '#F3F1EC'], // 🐟 Bagres 1993 — verde-mato e branco, MEDIDOS na camisa que o dono mandou (mediana dos verdes e dos brancos do manto, 06/09). O DOURADO é a 3ª cor, em MANTO_TRI: é a moldura, a coroa e o louro do escudo
  'guiouriques@hotmail.com': ['#2186D9', '#080809'], // 🪟 Vidraceiro FC — azul-vidro e preto, MEDIDOS na camisa que o dono mandou (mediana dos azuis e dos pretos do manto, 05/09). O BRANCO é a 3ª cor, em MANTO_TRI: a camisa é listrada azul/preto com filete branco
  'contateste577660006@gmail.com': ['#12100F', '#D19B36'], // 🙏 Só Deus Sabe FC — preto e dourado, MEDIDOS na camisa que o dono mandou (mediana dos pretos, 74% do manto, e dos dourados das listras/gola, 09/09). O BRANCO é a 3ª cor (MANTO_TRI): as nuvens da barra e os filetes das mangas
  'iago.cortellini@gmail.com': ['#100E0D', '#EAAD3D'], // 🐟📉 Bagres de Wall Street FC — preto e dourado, MEDIDOS na camisa que o dono mandou (mediana dos pretos, 84% do manto, e dos dourados do nome/gola/punhos, 09/09). O BRANCO é a 3ª cor (MANTO_TRI): as listras do ombro e o "DE WALL STREET"
  'davisantana1312@gmail.com': ['#0F0F0F', '#E6DED4'], // 🐛 Bicho da Seda — preto e branco-creme, MEDIDOS na camisa que o dono mandou em 09/09 (listras verticais; mediana dos pretos, 54% do manto, e dos claros, 30%). Os FIOS de seda são a 3ª cor (MANTO_TRI)
  'denilson.stifler10@gmail.com': ['#063215', '#F8EACF'], // 🟢 Xurupitas FC — verde-escuro e creme, MEDIDOS na camisa que o dono mandou em 09/09 (mediana dos verdes escuros, 78% do manto, e do creme da gola/nome/listras). A GOSMA verde-clara é a 3ª cor (MANTO_TRI)
  'glaucomiranda@outlook.com': ['#032F13', '#F8EEDC'], // 🍀 Seven City — verde-mata e creme, MEDIDOS na camisa que o dono mandou em 12/09 (mediana dos verdes, 54% do manto, e dos cremes da faixa central e das mangas, 23%). O DOURADO da gola, do 7 e das listras é a 3ª cor (MANTO_TRI). Antes era dourado + azul-marinho, só no banco.
  'brunolopesmiranda15@gmail.com': ['#EBE0CD', '#090908'], // 🐮 Leite de Verdade FC — creme-leite e preto malhado, MEDIDOS na camisa que o dono mandou em 10/09 (creme 39% do manto, preto 36%). O creme vem PRIMEIRO porque é a base da camisa e a cara do clube (leite); as manchas de vaca são por cima. O DOURADO da coroa é a 3ª cor (MANTO_TRI)
  'souzact12@gmail.com': ['#110D0E', '#F5F2EF'], // 🐍 Tricolor do Arruda FC — preto e branco, MEDIDOS na camisa que o dono mandou em 09/09 (faixas horizontais; o VERMELHO é a 3ª cor em MANTO_TRI, com o amortecedor branco de sempre)
  'diegohdsf@gmail.com': ['#0E0C0B', '#DD9C30'], // 🎙️ Fala D10 — preto e dourado, MEDIDOS na camisa que o dono mandou (mediana dos pretos, 83% do manto, e dos dourados das listras/coroa, 09/09). Sem 3ª cor: o branco do "FALA" é só 1% da camisa
  'duselecta@gmail.com': ['#101210', '#F1C02C'], // 🔊 Bonança SSFC — preto e amarelo, MEDIDOS na camisa que o dono mandou (mediana dos pretos, 80% do manto, e dos amarelos das listras rasta, 09/09). O VERMELHO é a 3ª cor (MANTO_TRI); o verde da bandeira fica no escudo
  'pedrovianacarneiroq@gmail.com': ['#0F0E0E', '#EAE5E1'], // 🐓 Briga de Galo FC — preto e branco, MEDIDOS na camisa que o dono mandou (2ª prancha; mediana dos pretos, 73% do manto, e dos brancos das listras, 08/09). O DOURADO é a 3ª cor (MANTO_TRI): coroa, "FC" e o BDG do peito
  'gaancaxd@gmail.com': ['#0D0C10', '#6E16C3'], // 🎮 Sistematizados FC — preto e roxo, MEDIDOS na camisa que o dono mandou (mediana dos pretos, 73% do manto, e dos roxos, 07/09). O BRANCO é a 3ª cor (MANTO_TRI)
  'jh9415474@gmail.com': ['#0A0A0A', '#E3E2E1'], // 🌑 Nova Eclipse FC — preto e branco, MEDIDOS na camisa que o dono mandou (mediana dos pretos, 72% do manto, e dos brancos das pinceladas, 07/09)
  'gustavo99828@gmail.com': ['#CD0C12', '#070505'], // 🐂 Final Boss FC — vermelho e preto, MEDIDOS na camisa que o dono mandou (mediana dos vermelhos e dos pretos do manto, 05/09). O BRANCO é a 3ª cor, em MANTO_TRI: a camisa dele é branca com faixa vermelha e preta
  'stoccoassessoria@gmail.com': ['#050306', '#6A04D7'], // ⚡ Stocco FC — preto e roxo, MEDIDOS na arte que o dono mandou (mediana dos pixels escuros e o roxo vivo do corpo da camisa, 04/09)
  'contatovegetta14@gmail.com': ['#050A13', '#0C5CB3'], // 🐉 Corporação Capsule FC — preto e azul, MEDIDOS na arte que o dono mandou (mediana dos pixels pretos e dos azuis do escudo, 03/09)
  'gabrielnegreirosamaral99@hotmail.com': ['#E00000', '#0C0C0C'], // 🐶 São Luiz FC — vermelho e preto, MEDIDOS na arte do dono (branco é a 3ª cor, em MANTO_TRI) (21/08)
  'igormarquesn99@gmail.com': ['#AE1A13', '#F3B212'], // 🌽 Milhaça FC — vermelho e amarelo, MEDIDOS na camisa que o dono mandou (24/08)
  'lluchmarcel81@gmail.com': ['#C00018', '#111111'], // 🏠 Esqueceram do Lluch FC — vermelho e preto, MEDIDOS na camisa que o dono mandou (28/08). ❤️ São Paulo (por isso o manto é TRICOLOR listrado; o branco é a 3ª cor, em MANTO_TRI)
  'danielmanfre5@gmail.com': ['#EC121C', '#0135A3'], // 🐦‍⬛ Manfré FC — vermelho e azul, MEDIDOS na 2ª camisa que o dono mandou (30/08, a da gralha AZUL). ❤️ Paraná Clube (de onde vem a gralha-azul)
  'agrostinho88@gmail.com': ['#0C2460', '#FFFFFF'], // 🐺 Papão United Madrid — azul-marinho e branco, MEDIDOS na camisa que o dono mandou (23/08). ❤️ Paysandu (o "Papão da Curuzu", de onde vem o nome do clube)
}

// cache do MEU sócio (mesmo padrão do myEmail do apoio: pontos de uso são
// síncronos, então mantemos o valor vivo via auth listener)
export interface MeuSocio { socioN: number | null; ativo: boolean; origem: string | null; manto: [string, string] | null; estadioNome: string | null; mascoteKey: string | null; escudoTime: string | null }
let meu: MeuSocio | null = null
const listeners = new Set<() => void>()
async function fetchMeuSocio() {
  meu = null
  try {
    const { data } = await supabase.rpc('esc_meu_socio')
    const r = (Array.isArray(data) ? data[0] : data) as { socio_n?: number; ativo?: boolean; origem?: string; manto_c1?: string | null; manto_c2?: string | null; estadio_nome?: string | null; mascote_key?: string | null; escudo_time?: string | null } | undefined
    if (r) meu = {
      socioN: r.socio_n ?? null, ativo: !!r.ativo, origem: r.origem ?? null,
      manto: r.manto_c1 && r.manto_c2 ? [r.manto_c1, r.manto_c2] : null,
      estadioNome: r.estadio_nome ?? null, mascoteKey: r.mascote_key ?? null,
      escudoTime: r.escudo_time ?? null,
    }
  } catch { /* sem rede — fica na reserva do código */ }
  // 🎁 08/09: escudo e mascote do dono passam a seguir o E-MAIL (ver mimos.ts).
  // Só sócio ATIVO leva; deslogou/venceu → limpa, e o clube volta ao automático.
  registraMeuBatismo(meu?.ativo ? meu.escudoTime : null, meu?.ativo ? meu.mascoteKey : null)
  listeners.forEach(fn => fn())
}
supabase.auth.getUser().then(() => fetchMeuSocio(), () => {})
supabase.auth.onAuthStateChange(() => { fetchMeuSocio() })

// manto da conta logada NESTE aparelho — banco primeiro, reserva do código
// depois. Só decora o PRÓPRIO time de quem vê (nunca sincroniza pros outros).
export function meuManto(): [string, string] | null {
  if (meu?.ativo && meu.manto) return meu.manto
  const em = loggedEmail()
  return em ? (MANTO_CONTAS[em] ?? null) : null
}

// 🏟️ nome do estádio batizado (null = usa o nome padrão por nível)
export function meuEstadioNome(): string | null {
  return meu?.ativo ? (meu.estadioNome ?? null) : null
}

// 🖋️ sou barão (dono de batismo)? — pro limite de fichas de carreira etc.
export function souBarao(): boolean {
  return !!(meu?.ativo && meu.origem === 'batismo')
}

// ✏️ o PRÓPRIO sócio batiza o estádio (o RPC valida se é sócio ativo; vazio =
// volta ao nome padrão). Atualiza o cache local na hora — sem esperar refetch.
export async function batizarEstadio(nome: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    const { data, error } = await supabase.rpc('esc_socio_estadio_nome', { p_nome: nome })
    if (error) return { ok: false, erro: error.message }
    if (meu) { meu = { ...meu, estadioNome: (data as string | null) ?? null }; listeners.forEach(fn => fn()) }
    return { ok: true }
  } catch { return { ok: false, erro: 'sem conexão — tenta de novo' } }
}

// hook pra telas que precisam re-renderizar quando o sócio carrega
export function useMeuSocio(): MeuSocio | null {
  const [, bump] = useState(0)
  useEffect(() => {
    const fn = () => bump(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])
  return meu
}

// listras do manto pra usar como background. `angle` = direção das listras
// (90 = verticais, padrão camisa; 0 = horizontais/marujo; 45 = diagonais).
// `c3` (opcional) = 3ª cor: quando passado, a listra vira de 3 cores (ex.: Desportivo
// Montreal preto/branco/verde). Sem c3, segue o padrão de 2 cores de sempre.
// `bufferC3` (pedido do Diego 16/08, Tricolor do Arruda FC): o padrão normal de
// 3 cores REPETE em ciclo (c0,c1,c3,c0,c1,c3…) e isso faz c3 encostar em c0 na
// costura do ciclo — pro Arruda (preto/vermelho) isso é proibido. Com bufferC3,
// a c1 entra de novo DEPOIS da c3 (c0,c1,c3,c1,repete), então c0 e c3 nunca ficam
// vizinhas — sempre tem c1 no meio. Só afeta quem estiver marcado como buffered;
// Desportivo Montreal e Ferrari SC continuam no padrão de sempre.
export const mantoStripes = (c: [string, string], w = 9, angle = 90, c3?: string | null, bufferC3 = false) =>
  c3
    ? (bufferC3
      ? `repeating-linear-gradient(${angle}deg, ${c[0]} 0 ${w}px, ${c[1]} ${w}px ${w * 2}px, ${c3} ${w * 2}px ${w * 3}px, ${c[1]} ${w * 3}px ${w * 4}px)`
      : `repeating-linear-gradient(${angle}deg, ${c[0]} 0 ${w}px, ${c[1]} ${w}px ${w * 2}px, ${c3} ${w * 2}px ${w * 3}px)`)
    : `repeating-linear-gradient(${angle}deg, ${c[0]} 0 ${w}px, ${c[1]} ${w}px ${w * 2}px)`

// 🎽 direção da listra por mascote do clube (pedido do Diego 10/08). Batismo que
// pediu listra diferente entra aqui; quem não está aqui fica vertical (padrão).
const MANTO_ANGLE: Record<string, number> = {
  samambaia: 45,        // 🌿 Império Samambaia — diagonais (Rio Branco)
  careca_ruivo: 0,      // 🔴⚫ Murriz FC — horizontais (rubro-negro)
  porco_marinheiro: 0,  // 🐷⚓ Marinheiros AS — horizontais (marujo/Palmeiras)
}
// ângulo da listra do MEU manto (pelo meu mascote). Só o próprio dono decora o seu.
export function meuMantoAngle(): number {
  const k = meu?.ativo ? meu.mascoteKey : null
  return (k && MANTO_ANGLE[k] != null) ? MANTO_ANGLE[k] : 90
}

// 🎽 3ª COR do manto por mascote (caso especial pedido pelo Diego): manto de 3
// cores. Ex.: Desportivo Montreal (mascote "maite") = preto + branco + VERDE.
// Só o PRÓPRIO dono vê a 3ª cor no seu manto (igual o ângulo) — não afeta os
// outros times. Quem não está aqui segue com manto de 2 cores normal.
const MANTO_TRI: Record<string, string> = {
  maite: '#1BA34C', // 🟢 Desportivo Montreal — 3ª cor verde (preto/branco/verde)
  piloto_bola: '#FFFFFF', // 🏎️ Ferrari SC (adriano) — 3ª cor BRANCA (vermelho/preto/branco)
  cobra_arruda: '#B91515', // 🐍 Tricolor do Arruda FC (Geovany Souza) — 3ª cor VERMELHA (preto/branco/vermelho). 09/09: MEDIDA na camisa nova que o dono mandou (era #C2001E chutado em 16/08); preto #110D0E e branco #F5F2EF foram pro banco (esc_socios)
  futpoint_bola: '#FFFFFF', // 📍 Futpoint FC (gfpicolo13) — 3ª cor BRANCA (preto/dourado/branco, medidas na camisa dele, 19/08)
  saoluiz_pitbull: '#FFFFFF', // 🐶 São Luiz FC — 3ª cor BRANCA (vermelho/preto/branco, medidas na camisa dele, 21/08)
  bagres_bagre: '#D9A95D', // 🐟 Bagres 1993 (caiohcris) — 3ª cor DOURADA: a moldura, a coroa e o louro do escudo (medidas na arte dele, 06/09)
  vidraceiro_vidro: '#FFFFFF', // 🪟 Vidraceiro FC (guiouriques) — 3ª cor BRANCA: a camisa é listrada azul/preto com filete branco (medidas na arte dele, 05/09)
  sistematizados_streamer: '#F3F1F6', // 🎮 Sistematizados FC (gaancaxd) — 3ª cor BRANCA: os filetes e o nome na camisa (medidos na arte dele, 07/09)
  sodeussabe_anjo: '#F8F4EB', // 🙏 Só Deus Sabe FC — 3ª cor BRANCA: as nuvens da barra e os filetes das mangas (medida na arte dele, 09/09)
  bagreswallst_bagre: '#F8F5EB', // 🐟📉 Bagres de Wall Street FC — 3ª cor BRANCA: as listras do ombro e o "DE WALL STREET" no peito (medida na arte dele, 09/09)
  bichodaseda_bicho: '#DDCEBF', // 🐛 Bicho da Seda — 3ª cor CREME dos fios de seda que cruzam a camisa (medida na arte dele, 09/09)
  xurupitas_gosma: '#819954', // 🟢 Xurupitas FC — 3ª cor VERDE-GOSMA que escorre pela camisa (medida na arte dele, 09/09)
  trevo_seven: '#DCAC49', // 🍀 Seven City (glaucomiranda) — 3ª cor DOURADA: gola, listras, coroa e o 7 (medida na camisa dele, 12/09)
  leiteverdade_vaca: '#CDAA77', // 🐮 Leite de Verdade FC — 3ª cor DOURADA da coroa, da gola e do 'FC' (medida na arte dele, 10/09)
  bonanca_selecta: '#B51516', // 🔊 Bonança SSFC (duselecta) — 3ª cor VERMELHA: a listra rasta da camisa, medida na arte dele (09/09)
  brigadegalo_galo: '#A38758', // 🐓 Briga de Galo FC (pedrovianacarneiroq) — 3ª cor DOURADA: a coroa, o "FC" e o BDG da camisa (medida na arte dele, 08/09)
  finalboss_touro: '#FFFFFF', // 🐂 Final Boss FC (gustavo99828) — 3ª cor BRANCA: a camisa é branca com faixa vermelha e preta (medidas na arte dele, 05/09)
  lluch_menino: '#FFFFFF', // 🏠 Esqueceram do Lluch FC — 3ª cor BRANCA: o manto é TRICOLOR listrado à moda São Paulo (vermelho/preto/branco), como o Diego corrigiu em 28/08
}
export function meuMantoC3(): string | null {
  const k = meu?.ativo ? meu.mascoteKey : null
  return (k && MANTO_TRI[k]) ? MANTO_TRI[k] : null
}

// 🚫🔴⚫ quem precisa do "amortecedor" (ver `bufferC3` em mantoStripes) — hoje só
// o Tricolor do Arruda FC, porque vermelho não pode encostar em preto.
const MANTO_TRI_BUFFER = new Set(['cobra_arruda', 'saoluiz_pitbull']) // 🐶 São Luiz FC entra aqui pelo mesmo motivo do Arruda: vermelho não pode encostar em preto
export function meuMantoC3Buffer(): boolean {
  const k = meu?.ativo ? meu.mascoteKey : null
  return !!(k && MANTO_TRI_BUFFER.has(k))
}

// ─── 🔒 NOME DE TIME ÚNICO (tipo @ do Instagram — pedido do Diego 10/08) ───
// Antes de gravar um nome novo de técnico/time, pergunta ao servidor se está
// livre. Regras lá: nome em uso por OUTRA conta → bloqueia; nome de clube de
// BATISMO → reservado pro dono. Quem JÁ tem nome repetido de antes, mantém
// (a trava só pega troca/cadastro novos). Servidor fora do ar → deixa passar
// (não trava o jogo — padrão da casa).
// `email` = o e-mail DIGITADO no formulário de cadastro. Existe por causa de um
// ovo-e-galinha (04/09): o dono do Stocco FC não conseguia criar a conta com o
// nome do próprio clube, porque a checagem compara o dono do nome com o e-mail de
// QUEM ESTÁ LOGADO — e no cadastro ainda não há login. O nome reservado PRA ELE
// era o que o impedia de se cadastrar. Valia pra todo dono de batismo sem conta.
// 🔒 O banco só aceita esse e-mail quando NÃO HÁ SESSÃO (ou seja, só no cadastro);
// quem já está logado continua tendo que bater com o e-mail real do login.
export async function nomeLivre(nome: string, email?: string): Promise<{ livre: boolean; motivo?: string }> {
  const nm = nome.trim()
  if (!nm) return { livre: true }
  try {
    const { data, error } = await supabase.rpc('esc_nome_livre', { p_nome: nm, p_email: email?.trim() || null })
    if (error || !data) return { livre: true }
    return data as { livre: boolean; motivo?: string }
  } catch { return { livre: true } }
}
// mensagens prontas (aviso claro: o PORQUÊ e o CAMINHO)
const NOME_MSG_PT: Record<string, string> = {
  em_uso: '⚠️ Já existe um técnico com esse nome — nome de time é único, tipo @ do Instagram. Tenta uma variação: acrescenta FC, um número ou teu apelido.',
  batismo: '🔒 Esse nome é de um clube de BATISMO e fica reservado pro dono dele. Se o clube é teu, entra com a conta do batismo; senão, escolhe outro nome.',
}
const NOME_MSG_EN: Record<string, string> = {
  em_uso: '⚠️ There is already a manager with that name — team names are unique, like an Instagram @. Try a variation: add FC, a number or your nickname.',
  batismo: '🔒 That name belongs to a NAMED club and is reserved for its owner. If the club is yours, sign in with the club account; otherwise, pick another name.',
}
// 🌐 lê o idioma na hora do uso (mesmo truque do POS_LABEL): quem faz NOME_MSG[k] não muda nada
export const NOME_MSG: Record<string, string> = new Proxy(NOME_MSG_PT, { get: (_t, k: string) => (getLang() === 'en' ? NOME_MSG_EN : NOME_MSG_PT)[k] })
