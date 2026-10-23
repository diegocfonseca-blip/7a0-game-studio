// ─── 💾 ESCALAÇÃO A e B DA CARREIRA (23/10) ──────────────────────────────────
//
// Diego: *"salvar time A e time B… que aí o cara consegue trocar na hora"*. As regras são DELE, ditas no pedido:
//   · quem SAIU do elenco (vendido, contrato acabou) não entra — não existe mais;
//   · machucado / suspenso (expulsão, noitada…) não pode ir pro jogo;
//   · CANSADO ENTRA: *"é problema dele se ele quiser botar cansado"*;
//   · quem chegou DEPOIS de salvar (comprou o Pelé) não vai junto — só se salvar de novo com ele em campo.
// E as que ele aprovou no mockup `scripts/mockups/carreira-escalacao-ab.png`:
//   · a vaga de quem não pôde fica com o reserva mais INTEIRO da mesma posição (a régua do rodízio: o mais cheio; Cria da
//     Base só se não houver reserva de verdade);
//   · cada técnico tem o cardápio de formações dele: se a formação salva não está mais liberada (trocou ou saiu o técnico),
//     o time entra na formação ATUAL, com os salvos que couberem;
//   · 🛑 *"ele não pode seguir a partida faltando um jogador"*: se não der pra fechar os 11, NADA muda (o time em campo
//     continua) e o motivo vem escrito com o caminho.
// A carta é guardada pela CHAVE nome|clube|ano — nunca pelo id, que o leilão troca todo ano.
// Arquivo PURO (sem tela, sem estado): a trava `npm run escalacao-ab` testa ele.
import { FORMATIONS, SECTORS, type FormationKey, type Sector } from './types'

export type SlotEscalacao = 'A' | 'B'
export interface EscalacaoSalva {
  f: FormationKey
  /** o rótulo visível da formação (as 15 de formacoes.ts); vazio = a cara padrão */
  v?: string
  /** os 11, na ordem do campinho (a ordem dentro da posição É a vaga: 1º atacante = esquerda…) */
  keys: string[]
  /** a posição de cada um dos 11 (mesma ordem de `keys`) — pra saber a vaga de quem SAIU do elenco */
  pos: string[]
  /** o elenco inteiro no dia em que salvou — é por ele que se sabe quem chegou DEPOIS */
  elenco: string[]
  t: number
  r: number
}
type Carta = { id: string; name: string; club: string; year: number; pos: string; lo: number; hi: number; fake?: boolean; cria?: boolean }

export const chaveCarta = (c: { name: string; club: string; year: number }) => `${c.name}|${c.club}|${c.year}`

/** monta o que guardar a partir do time em campo. `null` se não são 11 cartas reais e distintas do elenco. */
export function salvaEscalacao(squad: Carta[], ids: string[], f: FormationKey, v: string | undefined, t: number, r: number): EscalacaoSalva | null {
  const byId = new Map(squad.map(c => [c.id, c]))
  const uniq = [...new Set(ids)]
  const cards = uniq.map(id => byId.get(id)).filter((c): c is Carta => !!c && !c.fake)
  if (uniq.length !== 11 || cards.length !== 11) return null
  return { f, ...(v ? { v } : {}), keys: cards.map(chaveCarta), pos: cards.map(c => c.pos), elenco: squad.filter(c => !c.fake).map(chaveCarta), t, r }
}

export type MotivoFora = 'saiu' | 'fora'
export type ResultadoEscalacao =
  | {
      ok: true
      f: FormationKey
      v?: string
      ids: string[]
      /** quem estava no salvo e não entrou, e por quê */
      naoEntrou: { nome: string; motivo: MotivoFora; noLugar?: string }[]
      /** quem chegou depois de salvar (ficou fora do salvo) */
      novos: string[]
      /** a formação salva não estava liberada e o time entrou na atual */
      formacaoTrocada?: { de: string; para: string }
    }
  | { ok: false; falta: { pos: Sector; n: number }[] }

/**
 * @param fora ids que NÃO podem jogar agora (machucado/suspenso) — a mesma régua que a tela usa pra bloquear a troca
 * @param formacaoLiberada a formação salva ainda está no cardápio do técnico? (a mesma função que monta os botões)
 * @param gas o gás de cada carta (sem condição física ligada, todo mundo 100)
 */
export function aplicaEscalacao(args: {
  esc: EscalacaoSalva; squad: Carta[]; fora: Set<string>; formacaoAtual: FormationKey; viewAtual?: string
  formacaoLiberada: (f: FormationKey, v?: string) => boolean; gas?: Record<string, number>
  rotulo?: (f: FormationKey, v?: string) => string
}): ResultadoEscalacao {
  const { esc, squad, fora, formacaoAtual, viewAtual, formacaoLiberada, gas = {} } = args
  const rot = args.rotulo ?? ((f: FormationKey, v?: string) => v || f)
  const reais = squad.filter(c => !c.fake)
  const porChave = new Map(reais.map(c => [chaveCarta(c), c]))
  const pode = (c: Carta) => !fora.has(c.id)
  const cabe = (f: FormationKey) => { const need = FORMATIONS[f]; return !!need && SECTORS.every(p => reais.filter(c => c.pos === p && pode(c)).length >= need[p]) }
  // 🎽 a formação: a salva, se o técnico de agora deixa e o elenco fecha; senão a atual
  let f = esc.f, v = esc.v, formacaoTrocada: { de: string; para: string } | undefined
  if (!FORMATIONS[f] || !formacaoLiberada(f, v) || !cabe(f)) {
    if (f !== formacaoAtual || (v ?? '') !== (viewAtual ?? '')) formacaoTrocada = { de: rot(esc.f, esc.v), para: rot(formacaoAtual, viewAtual) }
    f = formacaoAtual; v = viewAtual
  }
  const need = FORMATIONS[f]
  const naoEntrou: { nome: string; motivo: MotivoFora; noLugar?: string; pos?: string }[] = []
  const usados = new Set<string>()
  // quem chegou DEPOIS de salvar não vai junto (*"o Pelé não vai junto"*): fica no fim da fila — só tapa vaga se não houver mais ninguém
  const novo = (c: Carta) => !esc.elenco.includes(chaveCarta(c))
  // o reserva mais INTEIRO da posição; nível desempata; Cria da Base por último (regra do rodízio, 19/09)
  const melhorReserva = (pos: string): Carta | undefined => reais
    .filter(c => c.pos === pos && pode(c) && !usados.has(c.id))
    .sort((a, b) => Number(novo(a)) - Number(novo(b)) || Number(!!a.cria) - Number(!!b.cria) || (gas[b.id] ?? 100) - (gas[a.id] ?? 100) || (b.lo + b.hi) - (a.lo + a.hi) || a.name.localeCompare(b.name))[0]
  // cada posição guarda a ordem das VAGAS (a ordem dentro da posição É o lugar no campinho); `null` = vaga de quem não pôde
  const porPos: Record<string, (string | null)[]> = {}
  for (const p of SECTORS) porPos[p] = []
  const falta: { pos: Sector; n: number }[] = []
  const cheio = (p: string) => porPos[p] && porPos[p].length >= (need[p as Sector] ?? 0)
  // 1) os salvos, na ordem: quem pode entra; quem não pode deixa a VAGA marcada pro melhor reserva da posição
  esc.keys.forEach((k, i) => {
    const c = porChave.get(k)
    const nome = k.split('|')[0]
    const pos = c?.pos ?? esc.pos?.[i]
    if (!c || !pode(c)) {
      naoEntrou.push({ nome, motivo: c ? 'fora' : 'saiu', pos })
      if (pos && !cheio(pos)) porPos[pos].push(null)
      return
    }
    if (!cheio(c.pos) && !usados.has(c.id)) { porPos[c.pos].push(c.id); usados.add(c.id) }
  })
  // 2) preenche as vagas marcadas e completa cada posição com o reserva mais inteiro (e diz no lugar de quem)
  for (const p of SECTORS) {
    for (let i = 0; i < porPos[p].length; i++) {
      if (porPos[p][i] !== null) continue
      const r = melhorReserva(p)
      if (!r) continue
      porPos[p][i] = r.id; usados.add(r.id)
      const lugar = naoEntrou.find(x => !x.noLugar && x.pos === p)
      if (lugar) lugar.noLugar = r.name
    }
    porPos[p] = porPos[p].filter(x => x !== null)
    while (porPos[p].length < need[p]) {
      const r = melhorReserva(p)
      if (!r) break
      porPos[p].push(r.id); usados.add(r.id)
      const lugar = naoEntrou.find(x => !x.noLugar && x.pos === p)
      if (lugar) lugar.noLugar = r.name
    }
    if (porPos[p].length < need[p]) falta.push({ pos: p, n: need[p] - porPos[p].length })
  }
  if (falta.length) return { ok: false, falta }
  const novos = reais.filter(c => !esc.elenco.includes(chaveCarta(c))).map(c => c.name)
  return { ok: true, f, ...(v ? { v } : {}), ids: SECTORS.flatMap(p => porPos[p] as string[]), naoEntrou: naoEntrou.map(({ nome, motivo, noLugar }) => ({ nome, motivo, ...(noLugar ? { noLugar } : {}) })), novos, ...(formacaoTrocada ? { formacaoTrocada } : {}) }
}
