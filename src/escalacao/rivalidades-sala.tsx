// 🆚 PRATELEIRA DE RIVALIDADES (08/11, mockup `scripts/mockups/rivalidade-draft-duplas.png`, Diego: *"pode fazer tudo"*).
// Na aba Jogos da sala online (rápida, Liga da Turma, Liga Draft): o PRÓXIMO encontro com um amigo (gente, nunca bot) e o
// retrospecto contra cada amigo da sala — V·E·D de sempre (banco `esc_retrospecto`, o mesmo da frase da rádio), a sequência
// que está valendo (coluna `ultimos`, docs/sql/retrospecto-sequencia.sql) e o placar DESTA temporada (`state.rivalries`).
// Só mostra: não mexe em jogo, prêmio nem ranking. Dupla fica de fora (o "você" seria ambíguo — mesma regra do retrospecto).
import { useT } from './lang'
import { sequenciaAtual, FREGUES_VANTAGEM, type Retro } from './retrospecto'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const
const INK = '#0C0C0C', GOLD = '#FFC400'

export type AmigoRival = { uid: string; nome: string; time: string; temporada: { w: number; d: number; l: number } }
export type ProximoEncontro = { amigo: AmigoRival; rodada: number; daqui: number }

const tagDe = (r: Retro | undefined, t: (pt: string, en: string) => string): { txt: string; cor: string } | null => {
  if (r && r.v >= r.d + FREGUES_VANTAGEM) return { txt: t(`🐔 freguês · ${r.v}×${r.d}`, `🐔 your regular · ${r.v}×${r.d}`), cor: '#1B7A3D' } // (a placa vale mais que a sequência)
  if (r && r.d >= r.v + FREGUES_VANTAGEM) return { txt: t(`🐔 você é freguês · ${r.v}×${r.d}`, `🐔 you are their regular · ${r.v}×${r.d}`), cor: '#C2452F' }
  const seq = sequenciaAtual(r)
  if (seq && seq.tipo !== 'E') return { txt: seq.tipo === 'V' ? t(`${seq.n} V seguidas`, `${seq.n} W in a row`) : t(`${seq.n} D seguidas`, `${seq.n} L in a row`), cor: seq.tipo === 'V' ? '#1B7A3D' : '#C2452F' }
  if (!r || r.v + r.e + r.d === 0) return null
  // 🐔 23/11: freguês só com 10 vitórias de vantagem (regra do Diego); antes disso é "na frente"/"te domina"
  if (r.v >= r.d + FREGUES_VANTAGEM) return { txt: t(`🐔 freguês · ${r.v}×${r.d}`, `🐔 your regular · ${r.v}×${r.d}`), cor: '#1B7A3D' }
  if (r.d >= r.v + FREGUES_VANTAGEM) return { txt: t(`🐔 você é freguês · ${r.v}×${r.d}`, `🐔 you are their regular · ${r.v}×${r.d}`), cor: '#C2452F' }
  if (r.v >= r.d + 2) return { txt: t('na frente', 'ahead'), cor: '#1B7A3D' }
  if (r.d >= r.v + 2) return { txt: t('te domina', 'owns you'), cor: '#C2452F' }
  return { txt: t('equilibrado', 'even'), cor: '#7C3AED' }
}

export function PrateleiraRivalidades({ amigos, mapa, proximo, meuTime, onlyNext=false, hideNext=false, nextTitle, classico=false }: { amigos: AmigoRival[]; mapa: Record<string, Retro>; proximo: ProximoEncontro | null; meuTime: string; onlyNext?:boolean; hideNext?:boolean; nextTitle?:string; /** ⚔️ 23/11: termômetro + placa + livro SÓ na aba Rivalidades (Diego: "somente na aba de rivalidade") */ classico?:boolean }) {
  const t = useT()
  if (amigos.length === 0) return null
  const rp = proximo ? mapa[proximo.amigo.uid] : undefined
  const seqP = sequenciaAtual(rp)
  return (
    <div className="space-y-3">
      {proximo && !hideNext && (
        <div className="ll-next-rivalry" style={{ background: '#1a1408', color: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, color: GOLD, margin: '0 0 8px', textTransform: 'uppercase' }}>⚔️ {nextTitle??t('Próximo encontro', 'Next meeting')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6, background: '#2a2010', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '10px 8px' }}>
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ ...OSWALD, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meuTime}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: GOLD }}>{t('VOCÊ', 'YOU')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ ...OSWALD, fontWeight: 800, fontSize: 10.5, color: '#bbb' }}>{proximo.daqui === 0 ? t('É AGORA', 'UP NEXT') : t(`RODADA ${proximo.rodada}`, `ROUND ${proximo.rodada}`)}</div>
              <div style={{ ...OSWALD, fontWeight: 900, fontSize: 28, lineHeight: 1, color: GOLD }}>{rp ? `${rp.v} × ${rp.d}` : '0 × 0'}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#ccc' }}>{rp && rp.e ? t(`${rp.e} empate${rp.e > 1 ? 's' : ''}`, `${rp.e} draw${rp.e > 1 ? 's' : ''}`) : t('na história', 'all-time')}</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ ...OSWALD, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proximo.amigo.time}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#E8503A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proximo.amigo.nome.toUpperCase()}</div>
            </div>
          </div>
          <p style={{ fontSize: 11, fontWeight: 800, color: GOLD, margin: '8px 0 0', textAlign: 'center' }}>
            {!rp || rp.v + rp.e + rp.d === 0 ? t('🆕 Primeiro duelo entre vocês — a história começa aqui.', '🆕 Your first ever meeting — the story starts here.')
              : seqP?.tipo === 'D' ? t(`🔥 Ele vem de ${seqP.n} vitórias seguidas em cima de você`, `🔥 They have beaten you ${seqP.n} times in a row`)
              : seqP?.tipo === 'V' ? t(`😎 Você vem de ${seqP.n} vitórias seguidas em cima dele`, `😎 You have beaten them ${seqP.n} times in a row`)
              : seqP?.tipo === 'E' ? t(`🤝 ${seqP.n} empates seguidos — hoje alguém desempata?`, `🤝 ${seqP.n} draws in a row — does someone break it today?`)
              : rp.v > rp.d ? t('😏 Você leva vantagem nesse clássico', '😏 You have the edge in this derby') : rp.d > rp.v ? t('😤 Ele leva vantagem — hora da revanche', '😤 They have the edge — revenge time') : t('⚖️ Tudo igual entre vocês', '⚖️ Dead even between you')}
          </p>
        </div>
      )}
      {classico && !onlyNext && (() => { const foco = proximo?.amigo ?? [...amigos].sort((a, b) => totalDe(mapa[b.uid]) - totalDe(mapa[a.uid]))[0]; return foco && totalDe(mapa[foco.uid]) > 0 ? <ClassicoCompleto r={mapa[foco.uid]} meuTime={meuTime} outroTime={foco.time} /> : null })()}
      {!onlyNext&&<div style={{ background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, color: INK }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: '0 0 8px', textTransform: 'uppercase' }}>🆚 {t('Você contra os amigos', 'You vs your friends')}</p>
        {amigos.map(a => {
          const r = mapa[a.uid], tag = tagDe(r, t), temp = a.temporada
          return (
            <div key={a.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '7px 10px', marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ ...OSWALD, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.time}</b>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,.55)' }}>{a.nome}{temp.w + temp.d + temp.l > 0 ? t(` · nesta sala ${temp.w}V ${temp.d}E ${temp.l}D`, ` · in this room ${temp.w}W ${temp.d}D ${temp.l}L`) : ''}</span>
              </div>
              <span style={{ ...OSWALD, fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>{r ? `${r.v} · ${r.e} · ${r.d}` : '—'}</span>
              {tag && <span style={{ ...OSWALD, fontWeight: 900, fontSize: 10, borderRadius: 999, padding: '2px 8px', color: '#fff', background: tag.cor, whiteSpace: 'nowrap' }}>{tag.txt}</span>}
            </div>
          )
        })}
        <p style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(0,0,0,.55)', margin: '4px 2px 0' }}>{t('V · E · D de todos os jogos entre vocês, em todas as salas (liga e copas).', 'W · D · L of every game between you, in every room (league and cups).')}</p>
      </div>}
    </div>
  )
}

// ─── 🔥🐔📜 23/11: TERMÔMETRO · PLACA DE FREGUÊS · LIVRO DO CLÁSSICO (mockup `scripts/mockups/rivalidade-zoeira.png`, Diego: *"gostei"*) ───
// Só mostra o que o retrospecto já guarda (nada mexe em jogo, prêmio ou ranking, e nada atrasa o jogo). Freguês = 10 vitórias de
// vantagem (`FREGUES_VANTAGEM`). O livro (maior goleada, artilheiro do confronto, último jogo) começa a encher a partir de 23/11.
const totalDe = (r?: Retro) => (r ? r.v + r.e + r.d : 0)
const pctDe = (r?: Retro) => { const n = r ? r.v + r.d : 0; return n ? Math.round((r!.v / n) * 100) : 50 }

export function TermometroClassico({ r, meuTime, outroTime, fino = false }: { r?: Retro; meuTime: string; outroTime: string; fino?: boolean }) {
  const t = useT()
  const p = pctDe(r)
  return (
    <div>
      <div style={{ height: fino ? 9 : 18, border: `${fino ? 2 : 3}px solid ${INK}`, borderRadius: 99, overflow: 'hidden', display: 'flex', marginTop: fino ? 5 : 10 }}>
        <div style={{ width: `${p}%`, background: '#1B7A3D' }} /><div style={{ width: `${100 - p}%`, background: '#C2452F' }} />
      </div>
      {!fino && <div style={{ display: 'flex', justifyContent: 'space-between', ...OSWALD, fontWeight: 800, fontSize: 11, textTransform: 'uppercase', marginTop: 4 }}>
        <span style={{ color: '#4ADE80', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meuTime} {p}%</span>
        <span style={{ color: '#ff8a76', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{100 - p}% {outroTime}</span>
      </div>}
      {!fino && <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: GOLD, margin: '6px 0 0' }}>
        {totalDe(r) === 0 ? t('🆕 Ainda não se enfrentaram', '🆕 You have never met') : p > 55 ? t('🔥 O clássico tá pendendo pro seu lado', '🔥 The derby is leaning your way') : p < 45 ? t('😤 O clássico tá pendendo pro lado dele', '😤 The derby is leaning their way') : t('⚖️ Clássico equilibrado', '⚖️ An even derby')}
      </p>}
    </div>
  )
}

export function PlacaFregues({ r, outroTime }: { r?: Retro; outroTime: string }) {
  const t = useT()
  if (!r) return null
  const vant = r.v - r.d
  const placa = (fundo: string, emoji: string, titulo: string, sub: string, giro: number) => (
    <div style={{ position: 'relative', background: fundo, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `4px 4px 0 ${INK}`, padding: '14px 12px 12px', textAlign: 'center', transform: `rotate(${giro}deg)`, color: INK, margin: '6px 2px' }}>
      <div style={{ position: 'absolute', top: -9, left: '50%', width: 14, height: 14, marginLeft: -7, background: '#C2452F', border: `2.5px solid ${INK}`, borderRadius: 99 }} />
      <div style={{ fontSize: 32, lineHeight: 1 }}>{emoji}</div>
      <div style={{ ...OSWALD, fontWeight: 900, fontSize: 18, textTransform: 'uppercase', marginTop: 4 }}>{titulo}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#5a5647', marginTop: 3 }}>{sub}</div>
    </div>
  )
  if (vant >= FREGUES_VANTAGEM) return placa('#FFE58A', '🐔', t(`${outroTime} é freguês`, `${outroTime} is your regular`), t(`${vant} vitórias de vantagem · a placa fica até ele tirar a diferença`, `${vant} wins ahead · the plaque stays until they close the gap`), -1.2)
  if (-vant >= FREGUES_VANTAGEM) return placa('#FFD9D0', '🐔', t(`Você é freguês do ${outroTime}`, `You are ${outroTime}'s regular`), t(`Ele tem ${-vant} vitórias de vantagem · ganhe pra tirar a placa`, `They are ${-vant} wins ahead · win to take the plaque down`), 1)
  if (vant >= FREGUES_VANTAGEM - 3) return placa('#EAF7EE', '🎯', t(`Faltam ${FREGUES_VANTAGEM - vant} pra pendurar a placa`, `${FREGUES_VANTAGEM - vant} more to hang the plaque`), t(`Com ${FREGUES_VANTAGEM} vitórias de vantagem, ${outroTime} vira freguês`, `At ${FREGUES_VANTAGEM} wins ahead, ${outroTime} becomes your regular`), -0.8)
  if (-vant >= FREGUES_VANTAGEM - 3) return placa('#FFF1E6', '⚠️', t(`Cuidado com o ${outroTime}`, `Watch out for ${outroTime}`), t(`Ele está ${-vant} vitórias na frente — mais ${FREGUES_VANTAGEM + vant} e você vira freguês`, `They are ${-vant} wins ahead — ${FREGUES_VANTAGEM + vant} more and you become their regular`), 0.8)
  return null
}

export function LivroClassico({ r, meuTime, outroTime }: { r?: Retro; meuTime: string; outroTime: string }) {
  const t = useT()
  const linhas: [string, string, string?][] = []
  if (r?.maior) linhas.push([t('Maior goleada', 'Biggest win'), r.maior.eu >= r.maior.ele ? `${meuTime} ${r.maior.eu} × ${r.maior.ele}` : `${outroTime} ${r.maior.ele} × ${r.maior.eu}`])
  const top = (o?: Record<string, number>) => Object.entries(o ?? {}).sort((a, b) => b[1] - a[1])[0]
  const am = top(r?.artMeus), ad = top(r?.artDele)
  const art = am && (!ad || am[1] >= ad[1]) ? { n: am[0], g: am[1], meu: true } : ad ? { n: ad[0], g: ad[1], meu: false } : null
  if (art) linhas.push([t('Artilheiro do confronto', 'Derby top scorer'), `${art.n} · ${art.g} ${art.g === 1 ? t('gol', 'goal') : t('gols', 'goals')}`, art.meu ? '#1B7A3D' : '#C2452F'])
  if (r?.ultimo) linhas.push([t('Último jogo', 'Last game'), r.ultimo.eu >= r.ultimo.ele ? `${meuTime} ${r.ultimo.eu} × ${r.ultimo.ele}` : `${outroTime} ${r.ultimo.ele} × ${r.ultimo.eu}`])
  const seq = sequenciaAtual(r)
  if (seq) linhas.push([t('Sequência', 'Streak'), seq.tipo === 'V' ? t(`${seq.n} V seguidas`, `${seq.n} W in a row`) : seq.tipo === 'D' ? t(`${seq.n} D seguidas`, `${seq.n} L in a row`) : t(`${seq.n} empates seguidos`, `${seq.n} draws in a row`), seq.tipo === 'V' ? '#1B7A3D' : seq.tipo === 'D' ? '#C2452F' : '#7C3AED'])
  return (
    <div style={{ background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, color: INK }}>
      <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, margin: '0 0 6px', textTransform: 'uppercase' }}>📜 {t('Livro do clássico', 'The derby book')}</p>
      {linhas.length === 0
        ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{t('O livro começa a ser escrito no próximo clássico entre vocês.', 'The book starts with your next derby.')}</p>
        : linhas.map(([k, v, cor], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 2px', borderBottom: i < linhas.length - 1 ? '1.5px dashed #ccc' : 'none' }}>
            <span style={{ ...OSWALD, fontWeight: 900, fontSize: 10.5, letterSpacing: '.06em', color: '#666', textTransform: 'uppercase' }}>{k}</span>
            <b style={{ ...OSWALD, fontWeight: 900, fontSize: 13.5, color: cor ?? INK, textAlign: 'right' }}>{v}</b>
          </div>
        ))}
    </div>
  )
}

/** a aba Rivalidade: o clássico com UM amigo (o próximo, ou o de mais jogos) — termômetro, placa e livro */
export function ClassicoCompleto({ r, meuTime, outroTime }: { r?: Retro; meuTime: string; outroTime: string }) {
  const t = useT()
  return (
    <div className="space-y-3">
      <div style={{ background: '#1a1408', color: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12 }}>
        <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, color: GOLD, margin: '0 0 8px', textTransform: 'uppercase' }}>⚔️ {t(`Seu clássico com ${outroTime}`, `Your derby with ${outroTime}`)}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6, textAlign: 'center' }}>
          <div style={{ ...OSWALD, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meuTime}</div>
          <div style={{ ...OSWALD, fontWeight: 900, fontSize: 30, lineHeight: 1, color: GOLD }}>{r ? `${r.v} × ${r.d}` : '0 × 0'}</div>
          <div style={{ ...OSWALD, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outroTime}</div>
        </div>
        <TermometroClassico r={r} meuTime={meuTime} outroTime={outroTime} />
      </div>
      <PlacaFregues r={r} outroTime={outroTime} />
      <LivroClassico r={r} meuTime={meuTime} outroTime={outroTime} />
    </div>
  )
}

/** a faixa fininha embaixo do placar/campinho — só no jogo contra amigo (quem chama decide); não para nem atrasa nada */
export function FaixaClassico({ r, outroTime }: { r?: Retro; outroTime: string }) {
  const t = useT()
  const vant = r ? r.v - r.d : 0
  return (
    <div style={{ marginTop: 8, background: '#1a1408', border: `2.5px solid ${INK}`, borderRadius: 12, padding: '7px 10px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, ...OSWALD, fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}>
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>⚔️ {t('Clássico', 'Derby')} · <b style={{ color: GOLD }}>{t('você', 'you')} {r ? `${r.v} × ${r.d}` : '0 × 0'}</b> {outroTime}</span>
        {vant >= FREGUES_VANTAGEM ? <span style={{ flex: '0 0 auto' }}>🐔 {t('freguês', 'regular')}</span> : -vant >= FREGUES_VANTAGEM ? <span style={{ flex: '0 0 auto', color: '#ff8a76' }}>🐔 {t('você é freguês', "you're their regular")}</span> : null}
      </div>
      <TermometroClassico r={r} meuTime="" outroTime={outroTime} fino />
    </div>
  )
}
