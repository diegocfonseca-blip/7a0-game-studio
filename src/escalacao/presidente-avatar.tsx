// ─── 🧑‍💼 O PRESIDENTE DOS OUTROS, NA SALA (16/10) ─────────────────────────────────────────────────────────────
//
// Diego: *"por que o boneco ainda não pode aparecer na sala online? Pode começar a fazer já"*. Regra de 14/10: o
// escudo é o CLUBE e o presidente é a PESSOA — então na lista de técnicos, no chat e no martelo vai o boneco.
//
// · Quem enxerga o boneco dos outros é a RPC `esc_presidentes_publicos2` (que devolve também o plano, pra pintar o fundo) (docs/sql/presidente-publico.sql): devolve só o
//   VISUAL (nunca e-mail) e só de quem tem plano (⭐ Craque pra cima). Grátis não tem presidente: volta `null` e a tela
//   desenha o que já desenhava antes (bolinha/escudo).
// · Os pedidos vêm em LOTE (uma ida ao banco pra sala inteira) e ficam guardados na memória — nada de canal, nada de
//   mensagem periódica (regra do tráfego, 04/10).
// · O desenho é montado UMA vez por visual num canvas pequeno (busto, 128px) e reaproveitado como <img> em todo lugar.
//   O boneco inteiro tem até 6 camadas grandes e a pele é pintada pixel a pixel — fazer isso por linha de chat travaria.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { presidenteBaseValido, type PresidenteBaseSave } from './presidencia-carreira'
import { camadasDoPresidente } from './presidente-aparencia'
import { montarPresidenteLayers, type PresidenteLayer } from './presidente-rig'
import { aplicarTomPele } from './presidente-pele'
import { camadasNaPose } from './presidente-pose'
import { APOIO_PERKS, ApoioSheen } from './apoio'

// ── visuais por conta ──────────────────────────────────────────────────────────────────────────────────────────
const visuais = new Map<string, PresidenteBaseSave | null>()
// plano de quem tem boneco (1 Craque · 2 Lenda · 3 Batismo · 4 Fundador) → o FUNDO do busto é a cor do tier DELE (Diego 16/10)
const ranks = new Map<string, number>()
const fila = new Set<string>()
const ouvintes = new Set<() => void>()
let agendado: ReturnType<typeof setTimeout> | null = null
const avisa = () => ouvintes.forEach(f => { try { f() } catch { /* ignora */ } })

async function buscarLote() {
  agendado = null
  const uids = [...fila].slice(0, 40)
  if (!uids.length) return
  try {
    const { data, error } = await supabase.rpc('esc_presidentes_publicos2', { p_uids: uids })
    if (error) throw error
    const linhas = (data ?? []) as { user_id: string; visual: unknown; rank: number }[]
    const achou = new Map<string, unknown>(linhas.map(r => [r.user_id, r.visual]))
    for (const r of linhas) ranks.set(r.user_id, r.rank)
    for (const u of uids) { const v = achou.get(u); visuais.set(u, presidenteBaseValido(v) ? v : null) }
  } catch {
    // banco fora do ar: ninguém ganha boneco inventado; fica o desenho de antes e tenta de novo na próxima sala
    for (const u of uids) visuais.set(u, null)
  }
  uids.forEach(u => fila.delete(u))
  avisa()
  if (fila.size) agendado = setTimeout(buscarLote, 50)
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function pedir(uid: string) {
  if (!UUID.test(uid)) { visuais.set(uid, null); return } // 'me', bot, convidado sem conta: nunca vai pro banco (estragaria o lote)
  if (visuais.has(uid) || fila.has(uid)) return
  fila.add(uid)
  if (!agendado) agendado = setTimeout(buscarLote, 120)
}
/** depois que EU salvo o meu boneco, a minha linha tem que mudar na hora */
export function esquecerPresidente(uid?: string | null) { if (uid) visuais.delete(uid); else visuais.clear(); avisa() }

/** o boneco de uma conta (null = não tem / grátis / ainda carregando) */
export function usePresidenteDe(uid: string | null | undefined): PresidenteBaseSave | null {
  const [, re] = useState(0)
  useEffect(() => {
    if (!uid) return
    const f = () => re(n => n + 1)
    ouvintes.add(f); pedir(uid)
    return () => { ouvintes.delete(f) }
  }, [uid])
  return uid ? visuais.get(uid) ?? null : null
}

// ── o desenho (busto) ──────────────────────────────────────────────────────────────────────────────────────────
// recorte no espaço do rig 1024×1536: a cabeça vai de ~372 a ~652 em x e começa em y≈8
const CORTE = { x: 312, y: 0, w: 400, h: 400 }
const LADO = 128
const imagens = new Map<string, Promise<HTMLImageElement>>()
const bustos = new Map<string, Promise<string | null>>()
function carrega(src: string) {
  let p = imagens.get(src)
  if (!p) {
    p = new Promise((ok, falha) => { const im = new Image(); im.onload = () => ok(im); im.onerror = falha; im.src = import.meta.env.BASE_URL + src })
    p.catch(() => imagens.delete(src))
    imagens.set(src, p)
  }
  return p
}
async function camadaPronta(l: PresidenteLayer): Promise<CanvasImageSource> {
  const im = await carrega(l.src)
  if (!l.skinTone || !l.outfit) return im
  const c = document.createElement('canvas'); c.width = l.raster.width; c.height = l.raster.height
  const ctx = c.getContext('2d', { willReadFrequently: true }); if (!ctx) return im
  ctx.drawImage(im, 0, 0)
  const d = ctx.getImageData(0, 0, c.width, c.height)
  aplicarTomPele(d.data, c.width, c.height, l.skinTone, l.outfit, false)
  ctx.putImageData(d, 0, 0)
  return c
}
type Recorte = { x: number; y: number; w: number; h: number }
function montaBusto(ids: string[], corte: Recorte = CORTE, larg = LADO, pose: 'standing' | 'seated' = 'standing'): Promise<string | null> {
  const alt = Math.round(larg * corte.h / corte.w)
  const chave = `${pose}:${corte.x},${corte.y},${corte.w},${corte.h}:${larg}:` + ids.join('|')
  let p = bustos.get(chave)
  if (p) return p
  p = (async () => {
    const r = montarPresidenteLayers(ids)
    if (!r.ok) return null
    try {
      const fontes = await Promise.all(camadasNaPose(r.layers, pose).map(async l => ({ l, src: await camadaPronta(l) })))
      const c = document.createElement('canvas'); c.width = larg; c.height = alt
      const ctx = c.getContext('2d'); if (!ctx) return null
      const s = larg / corte.w
      for (const { l, src } of fontes) ctx.drawImage(src, (l.bounds.x - corte.x) * s, (l.bounds.y - corte.y) * s, l.bounds.width * s, l.bounds.height * s)
      return c.toDataURL('image/webp', 0.85)
    } catch { return null }
  })()
  p.then(v => { if (v === null) bustos.delete(chave) })
  bustos.set(chave, p)
  return p
}

/** 🧑‍💼 a IMAGEM do busto (pra quem desenha em canvas, como o campinho 2D — 21/10, presidente na beira do campo). null = sem boneco ou montando */
export function useImagemBusto(visual: PresidenteBaseSave | null | undefined): string | null {
  const ids = visual ? camadasDoPresidente(visual) : []
  const chave = ids.join('|')
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    setUrl(null)
    if (ids.length) montaBusto(ids).then(u => { if (vivo) setUrl(u) })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return url
}

/** busto redondo do presidente; enquanto monta (ou se falhar) mostra o `reserva` — o desenho que já existia */
export function PresidenteBusto({ visual, size = 36, rank = 0, reserva = null, titulo }: { visual: PresidenteBaseSave; size?: number; rank?: number; reserva?: React.ReactNode; titulo?: string }) {
  const perk = rank >= 2 ? APOIO_PERKS.ouro : rank === 1 ? APOIO_PERKS.prata : APOIO_PERKS.bege // ouro: Lenda/Batismo/Fundador · prata: Craque · bege: grátis
  const ids = camadasDoPresidente(visual)
  const chave = ids.join('|')
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    setUrl(null)
    montaBusto(ids).then(u => { if (vivo) setUrl(u) })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  if (!url) return <>{reserva}</>
  return (
    <span title={titulo} style={{ width: size, height: size, flex: 'none', display: 'inline-block', borderRadius: '50%', border: '2px solid #0C0C0C', background: perk.grad, overflow: 'hidden', position: 'relative' }}>
      {perk.holo > 0 && <ApoioSheen holo={perk.holo} dur={2.6} />}
      <img src={url} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', position: 'relative', zIndex: 2 }} />
    </span>
  )
}

/** atalho: busto da conta `uid`, ou o `reserva` se ela não tiver presidente */
export function PresidenteDaConta({ uid, size, reserva, titulo }: { uid: string | null | undefined; size?: number; reserva: React.ReactNode; titulo?: string }) {
  const v = usePresidenteDe(uid)
  if (!v || !uid) return <>{reserva}</>
  return <PresidenteBusto visual={v} size={size} rank={ranks.get(uid) ?? 0} reserva={reserva} titulo={titulo} />
}

// ── 🎙️ o presidente SENTADO na mesa da coletiva (20/10) ──────────────────────────────────────────────────────────
// Diego: *"colocar o presidente aqui sentado na frente dos microfones… estático… o boneco que eu escolhi"*. Mesmo boneco
// da conta (trocou na Loja, troca aqui), na pose sentada, recortado da cintura pra cima — a mesa cobre o resto.
const CORTE_MESA: Recorte = { x: 252, y: 0, w: 520, h: 560 }
export function PresidenteNaMesa({ visual, altura = 150 }: { visual: PresidenteBaseSave; altura?: number }) {
  const ids = camadasDoPresidente(visual)
  const chave = ids.join('|')
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    setUrl(null)
    montaBusto(ids, CORTE_MESA, 360, 'seated').then(u => { if (vivo) setUrl(u) })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  if (!url) return null
  return <img src={url} alt="" draggable={false} style={{ height: altura, width: Math.round(altura * CORTE_MESA.w / CORTE_MESA.h), display: 'block' }} />
}
