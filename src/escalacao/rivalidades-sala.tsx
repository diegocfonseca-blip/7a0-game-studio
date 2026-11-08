// 🆚 PRATELEIRA DE RIVALIDADES (08/11, mockup `scripts/mockups/rivalidade-draft-duplas.png`, Diego: *"pode fazer tudo"*).
// Na aba Jogos da sala online (rápida, Liga da Turma, Liga Draft): o PRÓXIMO encontro com um amigo (gente, nunca bot) e o
// retrospecto contra cada amigo da sala — V·E·D de sempre (banco `esc_retrospecto`, o mesmo da frase da rádio), a sequência
// que está valendo (coluna `ultimos`, docs/sql/retrospecto-sequencia.sql) e o placar DESTA temporada (`state.rivalries`).
// Só mostra: não mexe em jogo, prêmio nem ranking. Dupla fica de fora (o "você" seria ambíguo — mesma regra do retrospecto).
import { useT } from './lang'
import { sequenciaAtual, type Retro } from './retrospecto'
const OSWALD = { fontFamily: 'Oswald, sans-serif' } as const
const INK = '#0C0C0C', GOLD = '#FFC400'

export type AmigoRival = { uid: string; nome: string; time: string; temporada: { w: number; d: number; l: number } }
export type ProximoEncontro = { amigo: AmigoRival; rodada: number; daqui: number }

const tagDe = (r: Retro | undefined, t: (pt: string, en: string) => string): { txt: string; cor: string } | null => {
  const seq = sequenciaAtual(r)
  if (seq && seq.tipo !== 'E') return { txt: seq.tipo === 'V' ? t(`${seq.n} V seguidas`, `${seq.n} W in a row`) : t(`${seq.n} D seguidas`, `${seq.n} L in a row`), cor: seq.tipo === 'V' ? '#1B7A3D' : '#C2452F' }
  if (!r || r.v + r.e + r.d === 0) return null
  if (r.v >= r.d + 2) return { txt: t('freguês', 'your customer'), cor: '#1B7A3D' }
  if (r.d >= r.v + 2) return { txt: t('te domina', 'owns you'), cor: '#C2452F' }
  return { txt: t('equilibrado', 'even'), cor: '#7C3AED' }
}

export function PrateleiraRivalidades({ amigos, mapa, proximo, meuTime }: { amigos: AmigoRival[]; mapa: Record<string, Retro>; proximo: ProximoEncontro | null; meuTime: string }) {
  const t = useT()
  if (amigos.length === 0) return null
  const rp = proximo ? mapa[proximo.amigo.uid] : undefined
  const seqP = sequenciaAtual(rp)
  return (
    <div className="space-y-3">
      {proximo && (
        <div style={{ background: '#1a1408', color: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12 }}>
          <p style={{ ...OSWALD, fontWeight: 900, fontSize: 14, color: GOLD, margin: '0 0 8px', textTransform: 'uppercase' }}>⚔️ {t('Próximo encontro', 'Next meeting')}</p>
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
      <div style={{ background: '#F4ECD6', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, color: INK }}>
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
      </div>
    </div>
  )
}
