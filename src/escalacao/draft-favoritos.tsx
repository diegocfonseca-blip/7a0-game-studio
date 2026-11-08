// ⭐ FAVORITOS DO DRAFT + 📋 O CAMINHO ATÉ A PRÓXIMA TEMPORADA (08/11, mockup `scripts/mockups/rivalidade-draft-duplas.png`,
// Diego: *"os favoritos dá pra pôr e tirar né? pode fazer tudo"*).
// · Favoritos: durante a temporada a pessoa marca ⭐ quem quer pegar no draft; na vez dela, eles aparecem em cima da lista. É só
//   uma conveniência DO APARELHO (localStorage, uma chave só, no máximo 30) — não vai pro estado da sala, não mexe em regra nenhuma:
//   a escolha continua passando pelo DRAFT_ESCOLHER de sempre. Põe e tira quando quiser.
// · Caminho: a faixa Liga → (Copa) → Draft → (Leilão) → próxima temporada, quantas rodadas faltam e em que lugar você escolhe
//   (a ordem é a da tabela, campeão primeiro — a MESMA `ordemDoDraft` que o motor usa).
import React, { useEffect, useMemo, useState } from 'react'
import { useT } from './lang'
import type { Card, Sector } from './types'
import { chaveCarta, chaveNome, todasAsCartas, cartaPermitidaDraft, type RegrasDraft, type BaralhoDraft } from './liga-draft'

const GOLD = '#FFC400', INK = '#0C0C0C', GREEN = '#1B7A3D', RED = '#C2452F'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 700 } as const
const POS: Sector[] = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA']
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const CHAVE = 'esc-draft-favs'
export const FAV_MAX = 30
const ouvintes = new Set<() => void>()
function le(): string[] {
  try { const v = JSON.parse(localStorage.getItem(CHAVE) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, FAV_MAX) : [] } catch { return [] }
}
function grava(l: string[]): void {
  try { localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, FAV_MAX))) } catch { /* aparelho sem espaço: segue só na memória */ }
  memoria = l.slice(0, FAV_MAX)
  ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })
}
let memoria: string[] | null = null
export function favoritosDraft(): string[] { if (!memoria) memoria = le(); return memoria }
export function alternaFavorito(chave: string): void {
  const l = favoritosDraft()
  if (l.includes(chave)) grava(l.filter(x => x !== chave))
  else if (l.length < FAV_MAX) grava([...l, chave])
}
export function useFavoritosDraft(): string[] {
  const [, f] = useState(0)
  useEffect(() => { const fn = () => f(n => n + 1); ouvintes.add(fn); return () => { ouvintes.delete(fn) } }, [])
  return favoritosDraft()
}

/** ⭐ o botãozinho de pôr/tirar (vale na lista da temporada e na da noite do draft) */
export function EstrelaFav({ chave, favs, dentroDeBotao }: { chave: string; favs: string[]; /** dentro de outro <button>: vira <span role=button> (botão dentro de botão não vale no HTML) */ dentroDeBotao?: boolean }) {
  const t = useT()
  const on = favs.includes(chave)
  const cheio = !on && favs.length >= FAV_MAX
  const Tag = dentroDeBotao ? 'span' : 'button'
  return (
    <Tag role={dentroDeBotao ? 'button' : undefined} onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); if (!cheio) alternaFavorito(chave) }} aria-label={on ? t('Tirar dos favoritos', 'Remove from favourites') : t('Pôr nos favoritos', 'Add to favourites')}
      title={cheio ? t(`Máximo de ${FAV_MAX} favoritos`, `Up to ${FAV_MAX} favourites`) : undefined}
      className="shrink-0 border-2 border-black rounded-lg w-8 h-7 flex items-center justify-center text-[15px]"
      style={{ background: on ? GOLD : '#fff', opacity: cheio ? .35 : 1 }}>{on ? '⭐' : '☆'}</Tag>
  )
}

export type DonoCarta = { time: string; bot: boolean }

/** ⭐ a lista dos favoritos (com quem já tem dono riscado). `onPegar` = na noite do draft, tocar escolhe. */
export function ListaFavoritos({ deck, donoDe, onPegar, favs }: { deck?: BaralhoDraft; donoDe: Map<string, DonoCarta>; onPegar?: (c: Card) => void; favs: string[] }) {
  const t = useT()
  const cartas = useMemo(() => {
    const todas = todasAsCartas(deck), mp = new Map(todas.map(c => [chaveCarta(c), c]))
    return favs.map(k => mp.get(k)).filter((c): c is Card => !!c)
  }, [deck, favs])
  if (cartas.length === 0) return null
  return (
    <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white" style={{ color: INK }}>
      {cartas.map((c, i) => {
        const dono = donoDe.get(chaveNome(c.name))
        return (
          <div key={chaveCarta(c)} className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-black/10" style={{ background: dono ? '#EFEBE0' : '#fff', opacity: dono ? .6 : 1 }}>
            <span className="shrink-0 w-5 h-5 rounded-md border-2 border-black flex items-center justify-center text-[11px]" style={{ ...OSW, background: dono ? '#fff' : GOLD }}>{i + 1}</span>
            <button disabled={!!dono || !onPegar} onClick={() => onPegar?.(c)} className="flex-1 min-w-0 text-left">
              <b className="block truncate uppercase text-[14px] leading-tight" style={{ ...OSW, textDecoration: dono ? 'line-through' : undefined }}>{c.name}</b>
              <small className="text-[10.5px] font-bold text-black/55">{c.pos} · {c.club} · {c.year}</small>
            </button>
            <span className="shrink-0 text-[10px] font-black rounded-full px-2 py-0.5 text-white" style={{ ...OSW, background: dono ? RED : GREEN }}>{dono ? t('já tem dono', 'taken') : onPegar ? t('pegar', 'pick') : t('livre', 'free')}</span>
            <EstrelaFav chave={chaveCarta(c)} favs={favs} />
          </div>
        )
      })}
    </div>
  )
}

/** 🔎 montar os favoritos durante a temporada: busca + posição, ⭐ em cada linha (sem categoria e sem over, igual à noite do draft) */
export function BuscaFavoritos({ deck, regras, donoDe, favs }: { deck?: BaralhoDraft; regras?: RegrasDraft; donoDe: Map<string, DonoCarta>; favs: string[] }) {
  const t = useT()
  const [busca, setBusca] = useState('')
  const [pos, setPos] = useState<Sector | null>(null)
  const baralho = useMemo(() => todasAsCartas(deck), [deck])
  const q = norm(busca.trim())
  const lista = useMemo(() => {
    if (!q && !pos) return []
    return baralho.filter(c => (!pos || c.pos === pos) && (!q || norm(c.name).includes(q) || norm(c.club).includes(q)) && cartaPermitidaDraft(c, regras))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }) || a.year - b.year).slice(0, 60)
  }, [baralho, pos, q, regras])
  return (
    <div className="space-y-2">
      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={t('🔎 buscar jogador ou clube…', '🔎 search player or club…')}
        className="w-full border-[3px] border-black rounded-xl px-3 py-2 font-bold text-[14px] bg-white" style={{ color: INK }} />
      <div className="flex gap-1.5">
        {POS.map(p => (
          <button key={p} onClick={() => setPos(pos === p ? null : p)} className="flex-1 border-2 border-black rounded-lg py-1.5 text-[13px]" style={{ ...OSW, background: pos === p ? GOLD : '#fff' }}>{p}</button>
        ))}
      </div>
      {lista.length > 0 && (
        <div className="rounded-2xl border-[3px] border-black overflow-hidden bg-white max-h-[320px] overflow-y-auto" style={{ color: INK }}>
          {lista.map(c => {
            const dono = donoDe.get(chaveNome(c.name))
            return (
              <div key={chaveCarta(c)} className="w-full flex items-center gap-2 px-3 py-1.5 border-b border-black/10" style={{ opacity: dono ? .55 : 1 }}>
                <span className="shrink-0 text-[11px] border-2 border-black rounded-md px-1.5" style={{ ...OSW, background: '#F4ECD6' }}>{c.pos}</span>
                <span className="flex-1 min-w-0"><b className="block truncate uppercase text-[14px] leading-tight" style={OSW}>{c.name}</b><small className="text-[10.5px] font-bold text-black/55">{c.club} · {c.year}{dono ? ` · ${dono.bot ? '🤖' : '👤'} ${dono.time}` : ''}</small></span>
                <EstrelaFav chave={chaveCarta(c)} favs={favs} />
              </div>
            )
          })}
        </div>
      )}
      {(q || pos) && lista.length === 0 && <p className="text-[12px] font-bold text-black/50">{t('Ninguém com esse nome.', 'Nobody with that name.')}</p>}
    </div>
  )
}

/** 📋 a caixa da temporada: o caminho + quantas rodadas faltam + sua vez + os favoritos */
export function CaminhoDraft({ etapas, atual, faltam, minhaVez, total, temporadaQueVem, deck, regras, donoDe }: {
  etapas: { id: string; pt: string; en: string }[]; atual: string; faltam: number; minhaVez: number | null; total: number; temporadaQueVem: number
  deck?: BaralhoDraft; regras?: RegrasDraft; donoDe: Map<string, DonoCarta>
}) {
  const t = useT()
  const favs = useFavoritosDraft()
  const [montando, setMontando] = useState(false)
  const iAtual = etapas.findIndex(e => e.id === atual)
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-[3px] border-black p-3" style={{ background: '#F4ECD6', color: INK, boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="uppercase mb-2" style={{ ...OSW, fontWeight: 900, fontSize: 14 }}>📋 {t('O caminho até a próxima temporada', 'The road to next season')}</p>
        <div className="flex gap-1">
          {etapas.map((e, i) => (
            <div key={e.id} className="flex-1 text-center border-2 border-black rounded-lg py-1.5 px-0.5 text-[10.5px] uppercase leading-tight"
              style={{ ...OSW, background: i < iAtual ? GREEN : i === iAtual ? GOLD : '#fff', color: i < iAtual ? '#fff' : INK }}>
              {i < iAtual ? '✔ ' : ''}{t(e.pt, e.en)}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2.5 mt-2.5 rounded-xl border-[2.5px] border-black px-3 py-2" style={{ background: '#FFF6D6' }}>
          <span className="text-[24px]">⏳</span>
          <div className="min-w-0">
            <b className="block uppercase text-[14px] leading-tight" style={OSW}>{faltam > 0 ? t(`Faltam ${faltam} rodada${faltam > 1 ? 's' : ''} pro draft`, `${faltam} round${faltam > 1 ? 's' : ''} to the draft`) : t('O draft vem logo depois desta fase', 'The draft comes right after this stage')}</b>
            <span className="text-[11px] font-bold text-black/60">{minhaVez ? t(`Hoje você escolheria em ${minhaVez}º de ${total} — a ordem é a da tabela: o campeão escolhe primeiro.`, `Right now you'd pick ${minhaVez} of ${total} — table order: the champion picks first.`) : t('A ordem é a da tabela: o campeão escolhe primeiro.', 'Table order: the champion picks first.')} {t(`Depois vem a temporada ${temporadaQueVem}.`, `Then season ${temporadaQueVem}.`)}</span>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border-[3px] border-black p-3" style={{ background: '#F4ECD6', color: INK, boxShadow: `4px 4px 0 ${INK}` }}>
        <p className="uppercase mb-1" style={{ ...OSW, fontWeight: 900, fontSize: 14 }}>⭐ {t('Meus favoritos pro draft', 'My draft favourites')} <span className="text-[11px] font-bold text-black/50 normal-case">({t('opcional', 'optional')} · {favs.length}/{FAV_MAX})</span></p>
        <p className="text-[11px] font-bold text-black/60 mb-2">{t('Marque ⭐ quem você quer. Na sua vez eles aparecem em cima — é só tocar. Põe e tira quando quiser.', 'Star ⭐ who you want. On your turn they show on top — just tap. Add or remove any time.')}</p>
        <ListaFavoritos deck={deck} donoDe={donoDe} favs={favs} />
        <button onClick={() => setMontando(m => !m)} className="w-full mt-2 border-[3px] border-black rounded-xl py-2 uppercase" style={{ ...OSW, fontSize: 14, background: montando ? '#fff' : GOLD, boxShadow: `3px 3px 0 ${INK}` }}>
          {montando ? t('✔ Pronto', '✔ Done') : favs.length ? t('➕ Mexer nos favoritos', '➕ Edit favourites') : t('⭐ Montar meus favoritos', '⭐ Build my favourites')}
        </button>
        {montando && <div className="mt-2"><BuscaFavoritos deck={deck} regras={regras} donoDe={donoDe} favs={favs} /></div>}
      </div>
    </div>
  )
}
