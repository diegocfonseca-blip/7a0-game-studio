// ─── 🏆 LIGA HUB — a liga inteira num lugar só, em pílulas ──────────────────
//
// Desenho aprovado pelo Diego em 23/08 (`scripts/mockup-liga-pilulas.mjs`).
//
// O PROBLEMA QUE ISTO RESOLVE: a MESMA informação (a tabela `game_champions`)
// aparecia em dois lugares, com dois nomes e duas caras — "Sala de troféus da
// liga" na espera (lista + planilha) e "Hall da Fama da sala" no fim (cartões
// bonitos). Nada batia. E, pior, o RANKING só existia na ESPERA: a pessoa ganhava
// a liga e não via a classificação mudar, que é justamente a hora que importa.
//
// ⏰ QUANDO APARECE: assim que o PREGÃO ACABA — que é a hora em que a simulação
// dos jogos começa. Palavras do Diego (23/08): *"as pílulas novas devem aparecer
// logo após acabar o leilão, q inicia a simulação dos jogos"*. E fica lá até o
// fim do jogo. NÃO é spoiler: rank, estante e temporadas só mostram temporadas
// ENCERRADAS — nada do jogo que está rolando.
//
// 👑 SÓ O DONO manda (Diego 23/08: *"só quem manda é o host msm, não tem adm
// não"*). A pílula ⚙️ Ajustes só existe pra ele.
//
// 🌍 SALA ABERTA TAMBÉM TEM (Diego 23/08: *"essas coisas de pílulas eu posso pôr
// no jogo da sala aberta né… acho q temos q fazer"*). Só que a sala rápida MORRE
// quando a galera sai — e ele decidiu que continua assim (*"a sala normal não
// deve ter em minhas salas tb não"*). Então lá a área é a mesma, sem a pílula de
// ajustes, e com uma linha dizendo a verdade: esta sala some, quem quiser guardar
// o campeonato cria uma Liga. Prometer estante numa sala que evapora seria o tipo
// de coisa que o Diego odeia.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { APOIO_PERKS, ApoioSheen } from './apoio'
import { perkFromSelo } from './pyramidseason'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSWALD: React.CSSProperties = { fontFamily: 'Oswald, sans-serif' }

// ⚠️ ESTE ARQUIVO NÃO IMPORTA NADA DE `screens.tsx` DE PROPÓSITO: o screens
// importa o LigaHub, e um import circular aqui quebraria o jogo na hora de
// carregar (já aconteceu com constantes da Copa). Por isso o estilo e as frases
// do mico moram aqui dentro.

// ─── ⚖️ AS REGRAS DA LIGA SÃO DO DONO (20/08) ────────────────────────────────
// Pedido do Diego: *"ele pode definir a regra do ranking… por ordem de títulos e
// qual vale mais, liga ou copa… e se zona de rebaixamento tira título… ou por
// ordem de pontuação que ele decidir"*.
// ⚠️ Vale SÓ DENTRO DA LIGA. O ranking global do jogo não olha nada disto — senão
// cada um inventaria a própria pontuação e o rank geral virava mentira.
export type LigaChave = 'liga' | 'copa' | 'artilheiro' | 'rebaixamento'
export type LigaRegras = { modo: 'titulos' | 'pontos'; ordem: LigaChave[]; pontos: Record<LigaChave, number>; rebaixaTira: boolean; ativos: LigaChave[] }
export const LIGA_REGRAS_PADRAO: LigaRegras = {
  modo: 'titulos',
  ordem: ['liga', 'copa', 'artilheiro'],
  pontos: { liga: 20, copa: 30, artilheiro: 5, rebaixamento: -10 },
  rebaixaTira: true,
  ativos: ['liga', 'copa', 'artilheiro', 'rebaixamento'],
}
export const LIGA_ROTULO: Record<LigaChave, string> = { liga: '🏆 Título da liga', copa: '🏆🇧🇷 Copa', artilheiro: '⚽ Artilheiro', rebaixamento: '🔻 Rebaixamento' }
export const lerRegras = (v: unknown): LigaRegras => {
  const r = (v ?? {}) as Partial<LigaRegras>
  return {
    modo: r.modo === 'pontos' ? 'pontos' : 'titulos',
    ordem: Array.isArray(r.ordem) && r.ordem.length ? r.ordem : LIGA_REGRAS_PADRAO.ordem,
    pontos: { ...LIGA_REGRAS_PADRAO.pontos, ...(r.pontos ?? {}) },
    rebaixaTira: r.rebaixaTira ?? LIGA_REGRAS_PADRAO.rebaixaTira,
    ativos: Array.isArray(r.ativos) ? r.ativos : LIGA_REGRAS_PADRAO.ativos,
  }
}
// ⚖️ a regra que está valendo, escrita em UMA LINHA. Vale pra todo mundo — o
// convidado precisa saber por que fulano está na frente no ranking.
export const resumoRegra = (regras: LigaRegras): string => {
  const ativas = (['liga', 'copa', 'artilheiro', 'rebaixamento'] as LigaChave[]).filter(k => regras.ativos.includes(k))
  return regras.modo === 'pontos'
    ? `Por pontos · ${ativas.map(k => `${LIGA_ROTULO[k].toLowerCase()} ${regras.pontos[k]}`).join(' · ')}`
    : `Por títulos · ${regras.ordem.filter(k => regras.ativos.includes(k)).map(k => LIGA_ROTULO[k].toLowerCase()).join(' > ')}${regras.rebaixaTira && regras.ativos.includes('rebaixamento') ? ' · cair tira um título' : ''}`
}

export type LinhaCampeao = {
  season_no: number
  champion_name: string | null
  top_scorer_name: string | null; top_scorer_goals: number | null; top_scorer_team: string | null
  mico_name: string | null
  copa_champion_name: string | null
  // 👥 quem era GENTE naquela temporada. Gravado a partir de 29/08; linha antiga
  // vem `null` e cai no jeito velho (só quem está na sala agora).
  humanos?: string[] | null
}

// 📊 O RANKING sai das MESMAS linhas de troféu, com a regra que o dono escolheu.
// Um lugar só, então arrumar um troféu já arruma o ranking na mesma hora.
// 👥 TROFÉU É COISA DE GENTE (Diego 23/08: *"troféu só entre usuários"*). No print
// dele, quem tinha os dois maiores acervos era BOT, com os humanos espremidos
// embaixo. Bot continua na LINHA DO TEMPO (o registro do que aconteceu de
// verdade); ele só não entra no ranking nem ganha prateleira.
export function rankingDaLiga(rows: LinhaCampeao[], regras: LigaRegras, gente: Set<string>) {
  if (!rows.length) return []
  const conta: Record<string, Record<LigaChave, number>> = {}
  const pega = (n?: string | null) => {
    const t = (n ?? '').trim(); if (!t || !gente.has(t)) return null
    if (!conta[t]) conta[t] = { liga: 0, copa: 0, artilheiro: 0, rebaixamento: 0 }
    return conta[t]
  }
  for (const l of rows) {
    const camp = pega(l.champion_name); if (camp) camp.liga++
    const c = pega(l.copa_champion_name); if (c) c.copa++
    const a = pega(l.top_scorer_team); if (a) a.artilheiro++
    const m = pega(l.mico_name); if (m) m.rebaixamento++
  }
  const on = (k: LigaChave) => regras.ativos.includes(k)
  const ligaDe = (v: Record<LigaChave, number>) =>
    regras.modo === 'titulos' && regras.rebaixaTira && on('rebaixamento') ? Math.max(0, v.liga - v.rebaixamento) : v.liga
  const pts = (v: Record<LigaChave, number>) =>
    (['liga', 'copa', 'artilheiro', 'rebaixamento'] as LigaChave[])
      .filter(on).reduce((s, k) => s + (k === 'liga' ? v.liga : v[k]) * (regras.pontos[k] ?? 0), 0)
  const lista = Object.entries(conta).map(([time, v]) => ({ time, v, pts: pts(v) }))
  lista.sort((A, B) => {
    if (regras.modo === 'pontos') return B.pts - A.pts || A.time.localeCompare(B.time)
    for (const k of regras.ordem) {
      if (!on(k)) continue
      const a = k === 'liga' ? ligaDe(A.v) : A.v[k]
      const b = k === 'liga' ? ligaDe(B.v) : B.v[k]
      if (a !== b) return b - a
    }
    return A.time.localeCompare(B.time)
  })
  return lista
}

// 🙈 zoeira do mico — uma por temporada, sorteio ESTÁVEL pela temporada (todo
// mundo na sala vê a mesma frase). Zoeira é a alma do jogo: bem variada.
const MICO_FRASES: ((t: string) => string)[] = [
  t => `O ${t} terminou em último — a torcida pediu música no Fantástico! 🎶`,
  t => `${t} comeu tanta poeira que subiu no pódio de MÁSCARA. 😷`,
  t => `O ônibus do ${t} voltou DE RÉ pra garagem. 🚌`,
  t => `${t} foi tão mal que o mascote pediu transferência. 🦴`,
  t => `A lanterna do ${t} tá tão acesa que dá pra ver do espaço. 🔦`,
  t => `${t} confundiu rebaixamento com mergulho: foi de cabeça. 🏊`,
  t => `O GPS do ${t} só conhecia o caminho da derrota. 🗺️`,
  t => `${t} levou o Mico pra casa e ainda pagou o estacionamento. 🙈`,
  t => `Até o gandula jogou mais que o ${t} nesta temporada. 🏃`,
  t => `${t}: campeão... de vaia. 📣`,
  t => `O ${t} defendeu tão pouco que a rede pediu férias. 🥅`,
  t => `Dizem que o ${t} ainda procura a bola até hoje. 🔍`,
]

// ─── a área em pílulas ──────────────────────────────────────────────────────
type Aba = 'rank' | 'estante' | 'temporadas' | 'ajustes'

// 🎨 ícones desenhados (duotone) — MESMO traço da barra da carreira, 0 KB de
// imagem. O Diego mandou a foto da barra da carreira e pediu igual:
// *"quero q essas pílulas fique na parte de baixo igual fizemos no modo carreira"*.
function IconeLiga({ nome, cor }: { nome: Aba; cor: string }) {
  const fill = 'rgba(12,12,12,.10)'
  const p = { fill: 'none', stroke: cor, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto' }}>
      {nome === 'rank' && <><path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" {...p} fill={fill} /><path d="M7 5.2H4.3v1.6A3.2 3.2 0 0 0 7 9.9M17 5.2h2.7v1.6A3.2 3.2 0 0 1 17 9.9M12 13.7v3.1M8.6 20.5h6.8" {...p} /></>}
      {nome === 'estante' && <><path d="M4 4.5h16v4.2H4z" {...p} fill={fill} /><path d="M5.5 8.7v11h13v-11M9 12.2h6M9 15.8h6" {...p} /></>}
      {nome === 'temporadas' && <><path d="M6 3.5h9l4 4v13H6z" {...p} fill={fill} /><path d="M15 3.5v4h4M9 12h7M9 15.6h7" {...p} /></>}
      {nome === 'ajustes' && <><circle cx={12} cy={12} r={3.2} {...p} fill={fill} /><path d="M12 3.2v2.4M12 18.4v2.4M4.8 12H2.4M21.6 12h-2.4M6.9 6.9L5.2 5.2M18.8 18.8l-1.7-1.7M6.9 17.1l-1.7 1.7M18.8 5.2l-1.7 1.7" {...p} /></>}
    </svg>
  )
}
const ROTULO_ABA: Record<Aba, string> = { rank: 'Rank', estante: 'Estante', temporadas: 'Temporadas', ajustes: 'Ajustes' }

export function LigaHub({ roomId, souDono, humanos, gravar, aoExcluir }: {
  roomId: string
  souDono: boolean
  humanos: string[]                 // 👥 times de GENTE nesta sala — só eles pontuam
  gravar?: {                        // 🖊️ só no FIM do jogo: o host grava a temporada
    seasonNo: number; matchSeed?: number
    champName: string; scorerName?: string; scorerGoals?: number; scorerTeamName?: string
    micoName?: string; copaChampName?: string; copaScorerName?: string; copaScorerGoals?: number
  }
  aoExcluir?: () => void            // o que fazer depois de excluir a liga (sair da sala)
}) {
  const [rows, setRows] = useState<LinhaCampeao[] | null>(null)
  const [sala, setSala] = useState<{ ehLiga: boolean; nome: string; regras: LigaRegras; ligaAt?: string; semBots: boolean } | null>(null)
  const [aba, setAba] = useState<Aba | null>(null) // 🔽 barra começa FECHADA: nada tapa o jogo rolando
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    void supabase.from('game_champions')
      .select('season_no, champion_name, top_scorer_name, top_scorer_goals, top_scorer_team, mico_name, copa_champion_name, humanos')
      .eq('room_id', roomId).order('season_no', { ascending: true })
      .then(({ data }) => setRows((data ?? []) as LinhaCampeao[]), () => setRows([]))
  }, [roomId])

  // 1) o HOST grava (ou corrige) a temporada ANTES de ler — senão a leitura corre
  //    em paralelo com a escrita e a temporada atual não aparece (parecia campeão
  //    errado). RESILIENTE: re-tenta 3×, porque no navegador do WhatsApp a 1ª
  //    gravação falha fácil e o campeão novo não sobrescrevia o antigo.
  useEffect(() => {
    let vivo = true
    ;(async () => {
      if (gravar && souDono) {
        const payload = {
          champion_name: gravar.champName, top_scorer_name: gravar.scorerName ?? null,
          top_scorer_goals: gravar.scorerGoals ?? null, top_scorer_team: gravar.scorerTeamName ?? null,
          mico_name: gravar.micoName ?? null, copa_champion_name: gravar.copaChampName ?? null,
          copa_top_scorer_name: gravar.copaScorerName ?? null, copa_top_scorer_goals: gravar.copaScorerGoals ?? null,
          // 👥 carimba QUEM ERA GENTE nesta temporada — é o que deixa o amigo que
          // faltou continuar no ranking com os títulos dele (ver `rankingDaLiga`).
          humanos,
        }
        for (let i = 0; i < 3; i++) {
          // 🏆 A LINHA É DA PARTIDA, não do número da temporada (Diego 16/08 —
          // "joguei a segunda e não contou no hall"): o "novo leilão" zera a
          // temporada pra 1 e a 2ª partida escrevia POR CIMA da 1ª. Com a SEMENTE,
          // partida diferente = linha nova, sempre.
          const busca = gravar.matchSeed != null
            ? supabase.from('game_champions').select('id').eq('room_id', roomId).eq('match_seed', gravar.matchSeed).maybeSingle()
            : supabase.from('game_champions').select('id').eq('room_id', roomId).eq('season_no', gravar.seasonNo).maybeSingle()
          const { data: existe } = await busca
          const { error } = existe
            ? await supabase.from('game_champions').update(payload).eq('id', existe.id)
            : await supabase.from('game_champions').insert({ room_id: roomId, season_no: gravar.seasonNo, ...(gravar.matchSeed != null ? { match_seed: gravar.matchSeed } : {}), ...payload })
          if (!error) break
          await new Promise(r => setTimeout(r, 400 * (i + 1)))
        }
      }
      if (!vivo) return
      carregar()
    })()
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, souDono, gravar?.seasonNo, gravar?.matchSeed, gravar?.champName])

  // 2) quem é a sala: liga ou rápida, e as regras do dono
  useEffect(() => {
    let vivo = true
    void supabase.from('game_rooms').select('game_state').eq('id', roomId).maybeSingle()
      .then(({ data }) => {
        if (!vivo) return
        const gs = ((data as { game_state?: Record<string, unknown> } | null)?.game_state ?? {}) as Record<string, unknown>
        setSala({
          ehLiga: gs.mode === 'liga',
          nome: (gs.roomName as string) ?? '',
          regras: lerRegras(gs.ligaRegras),
          ligaAt: gs.ligaAt as string | undefined,
          semBots: gs.ligaFechada === true,
        })
      }, () => { if (vivo) setSala({ ehLiga: false, nome: '', regras: LIGA_REGRAS_PADRAO, semBots: false }) })
    return () => { vivo = false }
  }, [roomId])

  // 👥 QUEM CONTA NO RANKING = todo mundo que JÁ JOGOU nesta liga, não só quem está
  // na sala agora (Diego 29/08, respondendo "sim" quando levantei o problema).
  // Antes o `gente` era só a sala do momento — então o amigo que faltasse numa
  // quinta sumia do ranking COM os títulos dele. Numa liga feita pra acumular
  // temporada após temporada, isso é o oposto do combinado; os títulos nunca se
  // perderam no banco, mas na tela evaporavam, o que dá na mesma pra quem joga.
  // Agora junta os humanos carimbados em cada temporada (coluna `humanos`, nova em
  // 29/08) com os da sala de hoje — quem chegou agora entra com zero, que é justo,
  // e quem faltou continua lá em cima. Temporada antiga não tem o carimbo e por
  // isso não some nada: ela só não acrescenta nomes.
  const gente = useMemo(() => {
    const set = new Set(humanos.map(n => (n ?? '').trim()).filter(Boolean))
    for (const r of (rows ?? [])) for (const n of (r.humanos ?? [])) { const t = (n ?? '').trim(); if (t) set.add(t) }
    return set
  }, [humanos, rows])
  const regras = sala?.regras ?? LIGA_REGRAS_PADRAO
  const ranking = useMemo(() => rankingDaLiga(rows ?? [], regras, gente), [rows, regras, gente])

  async function salvarRegras(r: LigaRegras) {
    if (!sala) return
    setBusy(true); setErro('')
    const { data, error } = await supabase.rpc('liga_patch', { p_room: roomId, p_at: null, p_regras: r as never, p_admins: null, p_fechada: null, p_nome: null })
    setBusy(false)
    if (error || data === false) { setErro('Não deu pra salvar a regra agora — tente de novo.'); return }
    setSala(s => (s ? { ...s, regras: r } : s))
  }
  async function patch(campos: { ligaAt?: string; ligaFechada?: boolean }) {
    setBusy(true); setErro('')
    const { data, error } = await supabase.rpc('liga_patch', { p_room: roomId, p_at: campos.ligaAt ?? null, p_regras: null as never, p_admins: null as never, p_fechada: campos.ligaFechada ?? null, p_nome: null })
    setBusy(false)
    if (error || data === false) { setErro('Não deu pra salvar agora — tente de novo.'); return }
    setSala(s => (s ? { ...s, ...(campos.ligaAt ? { ligaAt: campos.ligaAt } : {}), ...(campos.ligaFechada != null ? { semBots: campos.ligaFechada } : {}) } : s))
  }
  async function excluir() {
    if (!sala) return
    if (!window.confirm(`Excluir a liga "${sala.nome || 'sem nome'}"?\n\nA sala e a SALA DE TROFÉUS dela somem pra todo mundo. Não dá pra desfazer.`)) return
    await supabase.from('room_players').delete().eq('room_id', roomId).then(() => {}, () => {})
    await supabase.from('game_rooms').delete().eq('id', roomId).then(() => {}, () => {})
    aoExcluir?.()
  }

  if (rows == null || sala == null) return null
  // 📣 A BARRA APARECE SEMPRE, mesmo sem temporada guardada (Diego 23/08: entrou
  // numa sala nova esperando a novidade e não viu nada — *"não entendi porque não
  // está liberado"*). Eu tinha escondido a barra em sala zerada ("ninguém abre
  // estante vazia"), mas isso matava a descoberta: em sala NOVA ninguém jamais
  // saberia que a estante existe. Agora as abas aparecem e cada uma explica o
  // vazio com a promessa certa ("o primeiro campeão entra aqui quando este jogo
  // acabar") — que é trava explicando o porquê, do jeito que a casa manda.
  const vazio = rows.length === 0

  const abas: Aba[] = ['rank', 'estante', 'temporadas', ...(sala.ehLiga && souDono ? ['ajustes' as Aba] : [])]

  return (
    <>
      {/* 🔊 o botão de som mora no canto de baixo — sobe pra não brigar com a
          barra (mesmo remendo da barra da carreira e da home) */}
      <style>{'button[aria-label="Desligar som"],button[aria-label="Ligar som"]{bottom:78px !important}'}</style>
      {/* espaço no fim da página pra a barra não tapar o último bloco */}
      <div style={{ height: 74 }} />
      {/* 🚪 PORTAL (Diego 23/08: *"ela não está no final da tela"*): as telas do
          jogo entram ANIMADAS (framer-motion), e `position: fixed` dentro de um
          bloco com transform gruda NO BLOCO, não na tela — a barra ficava boiando
          no meio do conteúdo. Desenhando direto no `document.body`, o rodapé é o
          rodapé de verdade, igual à barra da carreira. */}
      {createPortal(<>

      {/* 📜 O PAINEL — abre POR CIMA do jogo, com altura de meia tela e rolagem
          própria. Toque na mesma aba (ou no ✕) fecha. Assim a barra nunca rouba a
          tela de quem só quer ver os jogos rolando. */}
      {aba && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 62, zIndex: 99988, padding: '0 8px' }}>
          <div style={{ margin: '0 auto', maxWidth: 460, maxHeight: '62vh', overflowY: 'auto', background: 'linear-gradient(170deg,#FFF7DF,#FFEDB8)', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `0 -6px 20px rgba(0,0,0,.22)`, color: INK, padding: 12 }}>
            <style>{'@keyframes escMicoWiggle{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(2deg)}}'}</style>
            <div className="flex items-center gap-2 mb-2">
              <p className="flex-1 min-w-0 font-black text-[13px] truncate" style={OSWALD}>
                {sala.ehLiga ? `🏆 ${sala.nome || 'A liga'}` : '🏆 Esta sala'} · {ROTULO_ABA[aba]}
              </p>
              <button onClick={() => setAba(null)} aria-label="Fechar"
                className="flex-none border-2 border-black rounded-lg px-2.5 py-1 font-black text-[12px] bg-white active:translate-y-0.5" style={OSWALD}>✕</button>
            </div>
            {erro && <p className="text-[11px] font-extrabold mb-2 rounded-lg px-2.5 py-1.5" style={{ background: '#FDECEA', border: '2px solid #C2452F', color: '#7a2418' }}>{erro}</p>}
            {aba === 'rank' && <AbaRank ranking={ranking} regras={regras} temLinhas={!vazio} ehLiga={sala.ehLiga} />}
            {aba === 'estante' && <AbaEstante rows={rows} gente={gente} />}
            {aba === 'temporadas' && <AbaTemporadas roomId={roomId} rows={rows} souDono={souDono && sala.ehLiga} nomes={humanos} recarregar={carregar} />}
            {aba === 'ajustes' && <AbaAjustes sala={sala} regras={regras} busy={busy} salvarRegras={salvarRegras} patch={patch} excluir={excluir} />}
            {/* 🌍 SALA RÁPIDA: a verdade sobre a estante — ela some quando a galera
                sai. Prometer história numa sala que evapora seria enganar. */}
            {!sala.ehLiga && (
              <p className="text-[10px] font-bold text-black/55 leading-snug mt-2.5 pt-2" style={{ borderTop: '2px solid rgba(12,12,12,.15)' }}>
                ℹ️ Isto é o histórico <b>desta sala</b>. Sala rápida <b>some</b> quando a galera sai — pra ter um campeonato que continua toda semana, com hora marcada e ranking guardado, crie uma <b>🏆 Liga</b>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 🔽 A BARRA — mesma cara da barra da carreira (foto que o Diego mandou):
          fundo creme translúcido, ícone duotone e rótulo em Oswald maiúsculo. */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 99989, background: 'rgba(250,247,238,.97)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderTop: '1.5px solid rgba(12,12,12,.13)', boxShadow: '0 -2px 12px rgba(0,0,0,.05)', display: 'flex', gap: 2, padding: '6px 6px calc(8px + env(safe-area-inset-bottom))' }}>
        {abas.map(t => {
          const on = aba === t
          const cor = on ? '#B8860B' : 'rgba(12,12,12,.45)'
          return (
            <button key={t} onClick={() => setAba(on ? null : t)} aria-label={ROTULO_ABA[t]}
              style={{ flex: 1, minWidth: 0, position: 'relative', background: 'transparent', border: 'none', padding: '3px 0 1px', cursor: 'pointer', color: cor }}>
              <IconeLiga nome={t} cor={cor} />
              <span style={{ display: 'block', ...OSWALD, fontWeight: on ? 900 : 700, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.02em', marginTop: 2 }}>{ROTULO_ABA[t]}</span>
            </button>
          )
        })}
      </div>
      </>, document.body)}
    </>
  )
}

// ─── 🏆 RANK — o que a regra do dono produz ─────────────────────────────────
function AbaRank({ ranking, regras, temLinhas, ehLiga }: { ranking: ReturnType<typeof rankingDaLiga>; regras: LigaRegras; temLinhas: boolean; ehLiga: boolean }) {
  if (!temLinhas) return <p className="text-black/50 text-[11.5px] font-bold">Ainda não tem temporada encerrada aqui. O primeiro campeão aparece quando este jogo acabar. 🏆</p>
  if (ranking.length === 0) return <p className="text-black/50 text-[11.5px] font-bold">Nenhum título de gente ainda — os campeões até agora foram bots, e bot não entra no ranking. 🤖</p>
  return (
    <>
      <p className="font-black text-[11.5px] uppercase tracking-wider text-black/45 mb-2" style={OSWALD}>🏆 Classificação {ehLiga ? 'da liga' : 'da sala'} · {ranking.length} {ranking.length === 1 ? 'time' : 'times'}</p>
      <div className="space-y-1.5">
        {ranking.map((r, i) => (
          <div key={r.time} className="flex items-center gap-2 border-2 border-black rounded-xl px-2.5 py-1.5 bg-white">
            <span className="font-black text-[13px] shrink-0 w-6 text-center" style={{ ...OSWALD, color: i === 0 ? '#7a4d00' : 'rgba(12,12,12,.4)' }}>{i === 0 ? '🥇' : `${i + 1}º`}</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-black text-[13px] truncate" style={OSWALD}>{r.time}</p>
              <p className="text-black/55 text-[10.5px] font-bold truncate">
                {regras.ativos.includes('liga') ? `🏆 ${r.v.liga}` : ''}
                {regras.ativos.includes('copa') ? ` · 🏆🇧🇷 ${r.v.copa}` : ''}
                {regras.ativos.includes('artilheiro') ? ` · ⚽ ${r.v.artilheiro}` : ''}
                {regras.ativos.includes('rebaixamento') ? ` · 🔻 ${r.v.rebaixamento}` : ''}
              </p>
            </div>
            {regras.modo === 'pontos' && (
              <span className="shrink-0 rounded-lg px-2 py-0.5 font-black text-[13px]" style={{ ...OSWALD, background: GOLD, border: `2px solid ${INK}` }}>{r.pts}</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-black/50 text-[10px] font-bold leading-snug mt-2">⚖️ {resumoRegra(regras)}.<br />Só a galera pontua — <b>bot não entra</b>.</p>
    </>
  )
}

// ─── 🏅 ESTANTE — os cartões bonitos, só de gente ───────────────────────────
function AbaEstante({ rows, gente }: { rows: LinhaCampeao[]; gente: Set<string> }) {
  const ehGente = (nm: string | null | undefined) => !!nm && gente.has(nm)
  const shelf = new Map<string, { liga: number; copa: number; art: number; mico: number }>()
  const somar = (nm: string | null | undefined, k: 'liga' | 'copa' | 'art' | 'mico') => {
    if (!ehGente(nm)) return
    const e = shelf.get(nm!) ?? { liga: 0, copa: 0, art: 0, mico: 0 }; e[k]++; shelf.set(nm!, e)
  }
  for (const r of rows) { somar(r.champion_name, 'liga'); somar(r.copa_champion_name, 'copa'); somar(r.top_scorer_team, 'art'); somar(r.mico_name, 'mico') }
  const donos = [...shelf.entries()].sort((a, b) => (b[1].liga + b[1].copa + b[1].art) - (a[1].liga + a[1].copa + a[1].art) || b[1].mico - a[1].mico)
  const ultimoMico = [...rows].reverse().find(r => ehGente(r.mico_name))
  const fraseMico = ultimoMico?.mico_name ? MICO_FRASES[(ultimoMico.season_no + ultimoMico.mico_name.length) % MICO_FRASES.length](ultimoMico.mico_name) : null
  const trofeu = (emoji: string, n: number, label: string, grad: string, fg: string, opts?: { wiggle?: boolean; sheen?: boolean }) => (
    <div key={label} style={{ width: 82, border: `3px solid ${INK}`, borderRadius: 13, padding: '7px 4px 6px', textAlign: 'center', boxShadow: `2.5px 2.5px 0 0 ${INK}`, background: grad, color: fg, position: 'relative', overflow: 'hidden', animation: opts?.wiggle ? 'escMicoWiggle 2.6s ease-in-out infinite' : undefined }}>
      {opts?.sheen && <ApoioSheen holo={0.7} dur={3.2} />}
      <span style={{ fontSize: 24, display: 'block', lineHeight: 1.1, position: 'relative' }}>{emoji}</span>
      <span style={{ display: 'block', fontWeight: 900, fontSize: 14, ...OSWALD, position: 'relative' }}>×{n}</span>
      <span style={{ display: 'block', fontWeight: 800, fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 0.4, ...OSWALD, position: 'relative' }}>{label}</span>
    </div>
  )
  if (donos.length === 0) return <p className="text-black/50 text-[11.5px] font-bold">Ninguém da turma tem troféu aqui ainda. 🏅</p>
  return (
    <>
      <p className="font-black text-[11.5px] uppercase tracking-wider text-black/45 mb-2" style={OSWALD}>🏅 A estante da resenha</p>
      {donos.map(([nome, t]) => {
        const perk = perkFromSelo(nome) ?? APOIO_PERKS.bege
        const claro = perk.tier !== 'roxo'
        const total = t.liga + t.copa + t.art
        return (
          <div key={nome} style={{ border: `3px solid ${INK}`, borderRadius: 14, marginBottom: 8, overflow: 'hidden', boxShadow: `3px 3px 0 0 ${INK}`, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', fontWeight: 900, fontSize: 13, ...OSWALD, borderBottom: `3px solid ${INK}`, background: perk.grad, color: claro ? INK : '#fff', position: 'relative', overflow: 'hidden' }}>
              {perk.holo > 0 && <ApoioSheen holo={perk.holo} dur={3.4} />}
              <span style={{ position: 'relative', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</span>
              <span style={{ position: 'relative', marginLeft: 'auto', flex: 'none', background: 'rgba(0,0,0,.72)', color: GOLD, borderRadius: 8, fontSize: 10, padding: '1px 8px', ...OSWALD }}>{total > 0 ? `${total} troféu${total === 1 ? '' : 's'}` : '😬'}</span>
            </div>
            <div style={{ display: 'flex', gap: 7, padding: '9px 11px', flexWrap: 'wrap', background: '#FFF9E8' }}>
              {t.liga > 0 && trofeu('🏆', t.liga, 'Liga', 'linear-gradient(170deg,#FFD84D,#F5B301)', INK, { sheen: true })}
              {t.copa > 0 && trofeu('🏆', t.copa, 'Copa', 'linear-gradient(170deg,#FFF3C9,#FFE07A)', INK, { sheen: true })}
              {t.art > 0 && trofeu('⚽', t.art, 'Artilharia', 'linear-gradient(170deg,#57C983,#1B7A3D)', '#fff')}
              {t.mico > 0 && trofeu('🙈', t.mico, 'Troféu Mico', 'linear-gradient(170deg,#C9986B,#8B5E3C)', '#fff', { wiggle: true })}
            </div>
          </div>
        )
      })}
      {fraseMico && (
        <p className="text-[10px] font-extrabold rounded-lg px-2.5 py-1.5" style={{ background: '#FDECEA', border: '2px solid #C2452F', color: '#7a2418', lineHeight: 1.35 }}>🙈 <b>MICO DA TEMPORADA:</b> {fraseMico}</p>
      )}
    </>
  )
}

// ─── 📜 TEMPORADAS — a tabela ano a ano, com o ✏️ do dono ───────────────────
// ✏️ E O DONO ARRUMA (*"às vezes pode dar erro, aí eles mesmos podem arrumar"*).
// A trava de verdade é no banco (política que checa o host da sala): nem convidado
// nem gente de fora consegue mexer, mesmo mexendo no navegador.
function AbaTemporadas({ roomId, rows, souDono, nomes, recarregar }: {
  roomId: string; rows: LinhaCampeao[]; souDono: boolean; nomes: string[]; recarregar: () => void
}) {
  const [edit, setEdit] = useState<LinhaCampeao | null>(null)
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const listaId = `liga-nomes-${roomId}`
  const vazia = (t: number): LinhaCampeao => ({ season_no: t, champion_name: '', top_scorer_name: '', top_scorer_goals: null, top_scorer_team: '', mico_name: '', copa_champion_name: '' })
  const limpo = (v: string | null) => { const t = (v ?? '').trim(); return t ? t : null }
  const proxima = rows.length ? Math.max(...rows.map(r => r.season_no)) + 1 : 1

  async function salvar() {
    if (!edit || busy) return
    setBusy(true); setErro('')
    const payload = {
      champion_name: limpo(edit.champion_name), copa_champion_name: limpo(edit.copa_champion_name),
      top_scorer_name: limpo(edit.top_scorer_name), top_scorer_goals: edit.top_scorer_goals ?? null,
      top_scorer_team: limpo(edit.top_scorer_team), mico_name: limpo(edit.mico_name),
    }
    const { data: existe } = await supabase.from('game_champions').select('id').eq('room_id', roomId).eq('season_no', edit.season_no).maybeSingle()
    const { error } = existe
      ? await supabase.from('game_champions').update(payload).eq('id', existe.id)
      : await supabase.from('game_champions').insert({ room_id: roomId, season_no: edit.season_no, ...payload })
    setBusy(false)
    if (error) { setErro('Não deu pra salvar. Tente de novo.'); return }
    setEdit(null); recarregar()
  }
  async function apagar(t: number) {
    if (busy) return
    if (!window.confirm(`Apagar a temporada ${t} da sala de troféus?\n\nSó esta linha some — o resto da liga fica.`)) return
    setBusy(true); setErro('')
    const { error } = await supabase.from('game_champions').delete().eq('room_id', roomId).eq('season_no', t)
    setBusy(false)
    if (error) { setErro('Não deu pra apagar. Tente de novo.'); return }
    setEdit(null); recarregar()
  }
  const campo = (rot: string, val: string, set: (v: string) => void, ph = '') => (
    <div className="flex-1 min-w-0">
      <p className="font-black text-[10px] uppercase tracking-wider text-black/45 mb-1" style={OSWALD}>{rot}</p>
      <input value={val} list={listaId} placeholder={ph} onChange={e => set(e.target.value)}
        className="w-full border-2 border-black rounded-lg px-2 py-1.5 font-black text-black text-[13px] bg-white" style={OSWALD} />
    </div>
  )

  return (
    <>
      <datalist id={listaId}>{nomes.map(n => <option key={n} value={n} />)}</datalist>
      <p className="font-black text-[11.5px] uppercase tracking-wider text-black/45 mb-2" style={OSWALD}>📜 Temporada a temporada</p>
      {erro && <p className="text-[11px] font-extrabold mb-2 rounded-lg px-2.5 py-1.5" style={{ background: '#FDECEA', border: '2px solid #C2452F', color: '#7a2418' }}>{erro}</p>}
      {rows.length === 0 && <p className="text-black/50 text-[11.5px] font-bold mb-2">Nenhuma temporada guardada ainda.</p>}
      <div className="space-y-1.5">
        {[...rows].sort((a, b) => b.season_no - a.season_no).map(r => (
          <div key={r.season_no} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: '#fff', border: `2.5px solid ${INK}` }}>
            <span className="flex-none rounded-md px-1.5 font-black text-[10.5px]" style={{ ...OSWALD, background: INK, color: GOLD }}>T{r.season_no}</span>
            <span className="min-w-0 flex-1 text-[10px] font-bold leading-snug">🏆 {r.champion_name || '—'}{r.copa_champion_name && <> · 🏆 Copa: {r.copa_champion_name}</>}{r.top_scorer_name && <> · ⚽ {r.top_scorer_name} ({r.top_scorer_goals})</>}</span>
            {r.mico_name && <span className="flex-none text-[10px] font-extrabold" style={{ color: '#8B5E3C' }}>🙈 {r.mico_name}</span>}
            {souDono && (
              <button onClick={() => setEdit(r)} className="flex-none border-2 border-black rounded-md px-1.5 py-0.5 font-black text-[11px] bg-white active:translate-y-0.5">✏️</button>
            )}
          </div>
        ))}
      </div>
      {souDono && !edit && (
        <button onClick={() => setEdit(vazia(proxima))} className="w-full mt-2 border-2 border-dashed border-black/40 rounded-xl py-2 font-black text-[11.5px] text-black/55 active:translate-y-0.5" style={OSWALD}>
          ＋ Escrever uma temporada que faltou
        </button>
      )}
      {souDono && edit && (
        <div className="mt-2 rounded-xl border-2 border-black bg-white p-3 space-y-2">
          <p className="font-black text-[12px]" style={OSWALD}>✏️ Temporada {edit.season_no}</p>
          <div className="flex gap-2">{campo('🏆 Campeão da liga', edit.champion_name ?? '', v => setEdit({ ...edit, champion_name: v }), 'nome do time')}</div>
          <div className="flex gap-2">{campo('🏆🇧🇷 Campeão da copa', edit.copa_champion_name ?? '', v => setEdit({ ...edit, copa_champion_name: v }), 'nome do time')}</div>
          <div className="flex gap-2">
            {campo('⚽ Artilheiro', edit.top_scorer_name ?? '', v => setEdit({ ...edit, top_scorer_name: v }), 'jogador')}
            <div className="w-16 flex-none">
              <p className="font-black text-[10px] uppercase tracking-wider text-black/45 mb-1" style={OSWALD}>Gols</p>
              <input value={edit.top_scorer_goals ?? ''} inputMode="numeric" onChange={e => setEdit({ ...edit, top_scorer_goals: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null })}
                className="w-full border-2 border-black rounded-lg px-2 py-1.5 font-black text-black text-[13px] bg-white" style={OSWALD} />
            </div>
          </div>
          <div className="flex gap-2">{campo('⚽ Time do artilheiro', edit.top_scorer_team ?? '', v => setEdit({ ...edit, top_scorer_team: v }), 'nome do time')}</div>
          <div className="flex gap-2">{campo('🙈 Mico (último colocado)', edit.mico_name ?? '', v => setEdit({ ...edit, mico_name: v }), 'nome do time')}</div>
          <p className="text-black/50 text-[10px] font-bold leading-snug">
            Só o <b>dono da liga</b> arruma — e o que você escrever vale só <b>dentro desta liga</b>: o ranking do jogo não muda.
          </p>
          <div className="flex gap-2">
            <button onClick={() => void salvar()} className="flex-1 border-[2.5px] border-black rounded-xl py-2 font-black text-[13px] text-white active:translate-y-0.5" style={{ ...OSWALD, background: GREEN }}>{busy ? 'Salvando…' : '✅ Salvar'}</button>
            <button onClick={() => setEdit(null)} className="flex-1 border-[2.5px] border-black rounded-xl py-2 font-black text-[13px] bg-white active:translate-y-0.5" style={OSWALD}>Cancelar</button>
          </div>
          {rows.some(r => r.season_no === edit.season_no) && (
            <button onClick={() => void apagar(edit.season_no)} className="w-full border-2 border-black rounded-xl py-1.5 font-black text-[11px] active:translate-y-0.5" style={{ ...OSWALD, background: '#C2452F', color: '#fff' }}>🗑️ Apagar esta temporada</button>
          )}
        </div>
      )}
    </>
  )
}

// ─── ⚙️ AJUSTES — só o DONO da liga vê esta pílula ──────────────────────────
function AbaAjustes({ sala, regras, busy, salvarRegras, patch, excluir }: {
  sala: { nome: string; ligaAt?: string; semBots: boolean }
  regras: LigaRegras; busy: boolean
  salvarRegras: (r: LigaRegras) => void
  patch: (c: { ligaAt?: string; ligaFechada?: boolean }) => void
  excluir: () => void
}) {
  const [abrirRegras, setAbrirRegras] = useState(false)
  const d = sala.ligaAt ? new Date(sala.ligaAt) : null
  const quando = d && !isNaN(d.getTime())
    ? `${['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : 'sem horário marcado'
  const adiar = (dias: number) => {
    const base = d && !isNaN(d.getTime()) ? new Date(d) : new Date()
    base.setDate(base.getDate() + dias)
    patch({ ligaAt: base.toISOString() })
  }
  return (
    <>
      <p className="font-black text-[11.5px] uppercase tracking-wider text-black/45 mb-2" style={OSWALD}>⚙️ Só o dono da liga vê</p>
      {/* 👑 sem "quem manda junto": Diego 23/08 — "só quem manda é o host mesmo" */}
      <div className="rounded-xl border-2 border-black bg-white px-2.5 py-2 mb-2">
        <p className="font-black text-[12px]" style={OSWALD}>📅 Próximo jogo: {quando}</p>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          {[[1, '+1 dia'], [7, '+1 semana'], [15, '+15 dias']].map(([n, rot]) => (
            <button key={String(rot)} disabled={busy} onClick={() => adiar(Number(n))}
              className="border-2 border-black rounded-lg py-1.5 font-black text-[11px] bg-white active:translate-y-0.5" style={OSWALD}>📅 {rot}</button>
          ))}
        </div>
      </div>
      <button disabled={busy} onClick={() => patch({ ligaFechada: !sala.semBots })}
        className="w-full border-2 border-black rounded-xl py-2 font-black text-[11.5px] bg-white active:translate-y-0.5 mb-2" style={OSWALD}>
        {sala.semBots ? '🤖 Botar bots até 20 times' : '🚫 Tirar os bots — só a galera'}
      </button>
      <button onClick={() => setAbrirRegras(v => !v)}
        className="w-full border-2 border-black rounded-xl py-2 font-black text-[11.5px] active:translate-y-0.5 mb-2" style={{ ...OSWALD, background: abrirRegras ? GOLD : '#fff' }}>
        ⚖️ {abrirRegras ? 'Fechar' : 'Regras do ranking'}
      </button>
      {abrirRegras && <div className="mb-2"><RegrasDaLiga regras={regras} salvar={salvarRegras} /></div>}
      <button onClick={excluir} className="w-full border-[2.5px] border-black rounded-xl py-2 font-black text-[12px] active:translate-y-0.5" style={{ ...OSWALD, background: '#C2452F', color: '#fff' }}>
        🗑️ Excluir a liga
      </button>
      <p className="text-black/50 text-[10px] font-bold leading-snug mt-1.5">A sala e a sala de troféus somem pra todo mundo. Não dá pra desfazer.</p>
    </>
  )
}

// ─── ⚖️ O EDITOR DAS REGRAS DO RANKING ──────────────────────────────────────
// Mora aqui e é usado nos DOIS lugares onde o dono pode mexer: na SALA DE ESPERA
// (antes do pregão, que é quando ele precisa decidir — depois não tem volta) e na
// pílula ⚙️ Ajustes. Um componente só = uma regra só, sem duas telas divergindo.
export function RegrasDaLiga({ regras, salvar }: { regras: LigaRegras; salvar: (r: LigaRegras) => void }) {
  const troca = (k: LigaChave) => {
    const tem = regras.ativos.includes(k)
    salvar({ ...regras, ativos: tem ? regras.ativos.filter(x => x !== k) : [...regras.ativos, k] })
  }
  const sobe = (k: LigaChave) => {
    const i = regras.ordem.indexOf(k); if (i <= 0) return
    const o = [...regras.ordem]; [o[i - 1], o[i]] = [o[i], o[i - 1]]
    salvar({ ...regras, ordem: o })
  }
  return (
    <div className="rounded-xl border-2 border-black bg-white p-3 space-y-2">
      <div className="flex border-[2.5px] border-black rounded-xl overflow-hidden">
        {(['titulos', 'pontos'] as const).map(m => (
          <button key={m} onClick={() => salvar({ ...regras, modo: m })}
            className="flex-1 font-black text-[11.5px] py-1.5" style={{ ...OSWALD, background: regras.modo === m ? GOLD : '#fff', borderLeft: m === 'pontos' ? `2.5px solid ${INK}` : undefined }}>
            {m === 'titulos' ? '🏆 Por títulos' : '🔢 Por pontos'}
          </button>
        ))}
      </div>
      <p className="font-black text-[10px] uppercase tracking-wider text-black/45" style={OSWALD}>O que conta nesta liga</p>
      {(['liga', 'copa', 'artilheiro', 'rebaixamento'] as LigaChave[]).map(k => {
        const on = regras.ativos.includes(k)
        return (
          <div key={k} className="flex items-center gap-2 border-2 border-black rounded-lg px-2.5 py-1.5">
            <span className="flex-1 min-w-0 font-black text-[12px] truncate" style={OSWALD}>{LIGA_ROTULO[k]}</span>
            {regras.modo === 'pontos' && on && (
              <input value={regras.pontos[k]} inputMode="numeric" onChange={e => salvar({ ...regras, pontos: { ...regras.pontos, [k]: Number(e.target.value.replace(/[^\d-]/g, '')) || 0 } })}
                className="w-14 flex-none border-2 border-black rounded-md px-1.5 py-0.5 font-black text-[12px] text-center bg-white" style={OSWALD} />
            )}
            {regras.modo === 'titulos' && on && k !== 'rebaixamento' && (
              <button onClick={() => sobe(k)} className="flex-none border-2 border-black rounded-md px-1.5 font-black text-[11px] bg-white active:translate-y-0.5">⬆️</button>
            )}
            <button onClick={() => troca(k)} className="flex-none border-2 border-black rounded-md px-2 py-0.5 font-black text-[10.5px] active:translate-y-0.5"
              style={{ ...OSWALD, background: on ? GREEN : '#fff', color: on ? '#fff' : 'rgba(12,12,12,.5)' }}>{on ? 'conta' : 'não conta'}</button>
          </div>
        )
      })}
      {regras.modo === 'titulos' && regras.ativos.includes('rebaixamento') && (
        <button onClick={() => salvar({ ...regras, rebaixaTira: !regras.rebaixaTira })}
          className="w-full border-2 border-black rounded-lg py-1.5 font-black text-[11px] active:translate-y-0.5"
          style={{ ...OSWALD, background: regras.rebaixaTira ? GREEN : '#fff', color: regras.rebaixaTira ? '#fff' : INK }}>
          {regras.rebaixaTira ? '🔻 Cair TIRA um título' : '🔻 Cair não tira título'}
        </button>
      )}
      <p className="text-black/50 text-[10px] font-bold leading-snug">
        ⚖️ {resumoRegra(regras)}.<br />Isto vale <b>só dentro desta liga</b>: o ranking do jogo não é tocado.
      </p>
    </div>
  )
}
