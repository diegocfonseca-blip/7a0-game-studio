// ─── 👥 AMIGOS + PERFIL PÚBLICO (18/10) ───────────────────────────────────────────────────────────────────────────
// Ideia do Diego ("estilo Orkut", SEM comunidades — *"é doideira, melhor não"*). Mockup aprovado (*"adorei"*):
// `scripts/mockups/amigos-perfil.png`. Por enquanto só a conta dele enxerga (`useAmigos()` em sport.ts).
//
// · Tudo passa por funções do banco (`esc_amigo_pedir/responder/desfazer`, `esc_amigos_lista`, `esc_perfil_publico`,
//   migration 20261018030000): amizade só vale com os DOIS aceitando e nenhuma delas devolve e-mail.
// · "Online agora" = batida do jogo (`live_beats`) nos últimos 3 min, lida SÓ quando a lista abre — nada de canal nem
//   mensagem periódica (regra do tráfego, 04/10).
// · Cada um com a cor do PRÓPRIO plano (grátis = bege) e o presidente só de quem tem (Craque+); sem boneco, vai a inicial.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { supabase } from '../lib/supabase'
import { tr } from './lang'
import { APOIO_PERKS, ApoioSheen, type ApoioTier } from './apoio'
import { PresidenteDaConta } from './presidente-avatar'
import { Escudo } from './escudos'
import { Trofeu, type CompId } from './competicoes-visual' // 🏆 28/10: as taças do jogo no perfil
import { useAmigos } from './sport'
import { COMUNIDADE_LINK } from './comunidade'
import { AlbumNosAmigos, CartasDele } from './album-colecoes' // 📖 19/10: álbum e trocas dentro dos Amigos
import { AbaCla, CaixaClaPerfil, ChamarProMeuCla, ENTROU_CLA, SeloCla, clasLiberado, esqueceClas, msgTrava } from './cla' // ⚔️ 21/10: clãs

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', GREEN = '#1B7A3D', RED = '#E8503A', ROXO = '#7C3AED'
const OSW: CSSProperties = { fontFamily: 'Oswald, sans-serif', fontWeight: 800, textTransform: 'uppercase' }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const contaValida = (uid: string | null | undefined): uid is string => !!uid && UUID.test(uid)

type Titulos = { ligas: number; serie_a: number; copas: number; supercopas: number; libertadores: number; champions: number; mundial: number; copa_mundo: number; salas: number; temporadas: number }
type Perfil = {
  uid: string; nome: string; clube: string | null; tier: ApoioTier | null; fundador_n: number | null
  titulos: Titulos; rank: { pos: number; total: number; temporada: number } | null; amigos_total: number; amigos: { uid: string; nome: string }[]
  relacao: 'aceito' | 'enviado' | 'recebido' | null; amizade_id: number | null; sou_eu: boolean
  // 👥 v2 (19/10): ranking do online da semana/mês, medalhas do pódio semanal e o rival
  semana?: { pos: number; titulos: number; total: number } | null; mes?: { pos: number; titulos: number; total: number } | null; sempre?: { pos: number; titulos: number } | null
  medalhas?: { ouro: number; prata: number; bronze: number } | null; meu_rival?: boolean
  rival?: { uid: string; nome: string; eu: number; ele: number } | null
}
type Linha = {
  amizade_id: number; outro: string; nome: string; relacao: 'aceito' | 'enviado' | 'recebido'; visto_em: string | null; tela: string | null; online: boolean
  sala_code?: string | null; sala_status?: string | null; titulos_semana?: number | null; rival?: boolean
}

const inicial = (nome: string) => (nome.replace(/[^\p{L}\p{N}]/gu, '')[0] ?? '?').toUpperCase()
function Bolinha({ nome, size }: { nome: string; size: number }) {
  return <span style={{ width: size, height: size, flex: 'none', borderRadius: '50%', border: `2px solid ${INK}`, background: '#e9dfc4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...OSW, fontSize: size * .42 }}>{inicial(nome)}</span>
}
function Rosto({ uid, nome, size }: { uid: string; nome: string; size: number }) {
  return <PresidenteDaConta uid={uid} size={size} reserva={<Bolinha nome={nome} size={size} />} />
}

// "visto há 2 h" / "ontem" / "há 3 dias"
function vistoHa(iso: string | null): string {
  if (!iso) return tr('ainda não jogou', 'hasn’t played yet')
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 60) return tr(`visto há ${Math.max(1, min)} min`, `seen ${Math.max(1, min)} min ago`)
  const h = Math.round(min / 60)
  if (h < 24) return tr(`visto há ${h} h`, `seen ${h} h ago`)
  const d = Math.round(h / 24)
  return d <= 1 ? tr('visto ontem', 'seen yesterday') : tr(`visto há ${d} dias`, `seen ${d} days ago`)
}
// onde a pessoa está, pela última batida do jogo (modo:tela)
function ondeEsta(tela: string | null): string {
  const [modo, scr] = (tela ?? '').split(':')
  if (modo === 'online') return scr === 'lobby' ? tr('numa sala de espera', 'in a waiting room') : tr('jogando numa sala online', 'playing in an online room')
  if (modo === 'career') return tr('na carreira', 'in career mode')
  if (scr === 'intro' || scr === 'lobby' || scr === 'setup') return tr('no menu', 'in the menu')
  return tr('numa partida rápida', 'in a quick match')
}

function Janela({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99980, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto', color: INK, background: CREME, border: `3px solid ${INK}`, borderRadius: 20, boxShadow: `5px 5px 0 ${INK}`, padding: 12 }}>
        <div style={{ background: INK, color: GOLD, borderRadius: 12, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...OSW, fontSize: 15 }}>
          <span>{titulo}</span>
          <button onClick={onClose} aria-label={tr('Fechar', 'Close')} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
const caixa: CSSProperties = { color: INK, background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: 10, marginTop: 10 }
const h3: CSSProperties = { ...OSW, fontSize: 14, margin: '0 0 6px', color: INK }
const bt = (bg: string, cor: string): CSSProperties => ({ ...OSW, fontSize: 12, border: `2px solid ${INK}`, borderRadius: 9, padding: '6px 10px', background: bg, color: cor, boxShadow: `2px 2px 0 ${INK}`, cursor: 'pointer', whiteSpace: 'nowrap' })

// 🏆 a grade de taças do perfil (28/10): a arte é a do jogo (`Trofeu` — Sala de Troféus + competições do online), nunca a oficial
function GradeTacas({ itens }: { itens: [CompId, number, string][] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
      {itens.map(([comp, n, nome]) => (
        <div key={nome} style={{ position: 'relative', border: `2px solid ${INK}`, borderRadius: 10, textAlign: 'center', padding: '6px 2px 4px', background: n > 0 ? '#FFF7DA' : '#f3eee0' }}>
          <div style={{ height: 62, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', ...(n > 0 ? {} : { filter: 'grayscale(1)', opacity: .35 }) }}>
            <Trofeu comp={comp} size={44} />
          </div>
          {n > 0 && <span style={{ position: 'absolute', top: 4, right: 4, background: INK, color: GOLD, ...OSW, fontSize: 11, borderRadius: 7, padding: '0 5px' }}>×{n}</span>}
          <div style={{ fontSize: 9.5, fontWeight: 800, color: '#444', marginTop: 3, lineHeight: 1.1 }}>{nome}</div>
        </div>
      ))}
    </div>
  )
}

// ── 👤 PERFIL ──────────────────────────────────────────────────────────────────────────────────────────────────
export function PerfilPublico({ uid, onClose, onAbrirOutro }: { uid: string; onClose: () => void; onAbrirOutro?: (uid: string) => void }) {
  const [p, setP] = useState<Perfil | null | 'erro'>(null)
  const [atual, setAtual] = useState(uid)
  const [ocupado, setOcupado] = useState(false)
  const [albumDele, setAlbumDele] = useState<'cartas' | 'troca' | null>(null) // 📖 19/10: ver cartas / propor troca
  const carrega = (u: string) => {
    setP(null)
    supabase.rpc('esc_perfil_publico2', { p_uid: u }).then(({ data, error }) => setP(error || !data ? 'erro' : data as Perfil), () => setP('erro'))
  }
  useEffect(() => { carrega(atual) }, [atual])
  // 🏆 28/10: as taças do online por competição (o que cada sala anotou em human_results)
  const [tacas, setTacas] = useState<Record<string, number> | null>(null)
  useEffect(() => { setTacas(null); supabase.rpc('esc_tacas_online', { p_uid: atual }).then(({ data }) => setTacas((data ?? null) as Record<string, number> | null), () => setTacas(null)) }, [atual])
  const abrir = (u: string) => { if (onAbrirOutro) onAbrirOutro(u); else setAtual(u) }
  const acao = async (fn: () => PromiseLike<unknown>) => { setOcupado(true); try { await fn() } finally { setOcupado(false); carrega(atual) } }

  const perk = APOIO_PERKS[(p && p !== 'erro' && p.tier && APOIO_PERKS[p.tier]) ? p.tier : 'bege']
  return (
    <Janela titulo={tr('👤 Perfil', '👤 Profile')} onClose={onClose}>
      {p === null && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('carregando…', 'loading…')}</p>}
      {p === 'erro' && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('Não consegui abrir esse perfil agora. Tenta de novo.', 'Couldn’t open this profile right now. Try again.')}</p>}
      {p && p !== 'erro' && <>
        <div style={{ position: 'relative', overflow: 'hidden', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 12, marginTop: 10, background: perk.grad, display: 'flex', gap: 12, alignItems: 'center' }}>
          {perk.holo > 0 && <ApoioSheen holo={perk.holo} dur={3} />}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <PresidenteDaConta uid={p.uid} size={86} reserva={p.clube ? <span style={{ width: 86, height: 86, borderRadius: '50%', border: `3px solid ${INK}`, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Escudo nome={p.clube} size={60} /></span> : <Bolinha nome={p.nome} size={86} />} />
          </div>
          <div style={{ position: 'relative', zIndex: 2, minWidth: 0 }}>
            <div style={{ ...OSW, fontSize: 22, lineHeight: 1, color: INK }}>{p.nome}</div>
            {p.clube && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, ...OSW, fontSize: 13, color: INK }}><Escudo nome={p.clube} size={22} />{p.clube}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {p.fundador_n != null && <span style={{ ...OSW, fontSize: 10.5, background: INK, color: GOLD, borderRadius: 7, padding: '2px 7px' }}>🖋 {tr('Fundador nº', 'Founder no.')} {p.fundador_n}</span>}
              {p.tier === 'ouro' && <span style={{ ...OSW, fontSize: 10.5, background: INK, color: GOLD, borderRadius: 7, padding: '2px 7px' }}>👑 {tr('Lenda', 'Legend')}</span>}
              {p.tier === 'prata' && <span style={{ ...OSW, fontSize: 10.5, background: INK, color: '#E6ECF2', borderRadius: 7, padding: '2px 7px' }}>⭐ Craque</span>}
            </div>
          </div>
        </div>

        <CaixaClaPerfil uid={p.uid} />{/* ⚔️ 21/10: o clã dele, numa caixinha própria embaixo do cartão */}
        {/* ➕ 19/10: os botões de amizade/rival vêm LOGO ABAIXO do cartão (antes ficavam no fim e ninguém achava) */}
        {!p.sou_eu && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {p.relacao === null && <button disabled={ocupado} style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 10, fontSize: 14 }} onClick={() => acao(() => supabase.rpc('esc_amigo_pedir', { p_para: p.uid }))}>➕ {tr('Adicionar amigo', 'Add friend')}</button>}
            {p.relacao === 'enviado' && <>
              <span style={{ ...bt('#e9dfc4', INK), flex: 1, padding: 10, fontSize: 13, textAlign: 'center', boxShadow: 'none' }}>⏳ {tr('Pedido enviado', 'Request sent')}</span>
              <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => acao(() => supabase.rpc('esc_amigo_desfazer', { p_outro: p.uid }))}>{tr('cancelar', 'cancel')}</button>
            </>}
            {p.relacao === 'recebido' && p.amizade_id != null && <>
              <button disabled={ocupado} style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 10, fontSize: 14 }} onClick={() => acao(() => supabase.rpc('esc_amigo_responder', { p_id: p.amizade_id, p_aceita: true }))}>✅ {tr('Aceitar amizade', 'Accept')}</button>
              <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => acao(() => supabase.rpc('esc_amigo_responder', { p_id: p.amizade_id, p_aceita: false }))}>{tr('recusar', 'decline')}</button>
            </>}
            {p.relacao === 'aceito' && <>
              <span style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 10, fontSize: 14, textAlign: 'center' }}>✅ {tr('Amigos', 'Friends')}</span>
              <button disabled={ocupado} style={bt('#fff', RED)} onClick={() => { if (window.confirm(tr(`Desfazer a amizade com ${p.nome}?`, `Unfriend ${p.nome}?`))) void acao(() => supabase.rpc('esc_amigo_desfazer', { p_outro: p.uid })) }}>{tr('desfazer', 'unfriend')}</button>
            </>}
          </div>
        )}
        {!p.sou_eu && <ChamarProMeuCla uid={p.uid} />}{/* ⚔️ 21/10: chamar pro meu clã direto do perfil */}
        {/* 🔥 rival: UM por pessoa, só entre amigos, e é só zoeira (não muda nada no jogo) */}
        {!p.sou_eu && p.relacao === 'aceito' && (
          <div style={{ marginTop: 8 }}>
            {p.meu_rival
              ? <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ ...bt('#E8503A', '#fff'), flex: 1, padding: 9, fontSize: 13, textAlign: 'center' }}>🔥 {tr('É o seu rival', 'Your rival')}</span>
                <button disabled={ocupado} style={bt('#fff', INK)} onClick={() => acao(async () => { await supabase.rpc('esc_rival_tirar'); esqueceRival() })}>{tr('tirar', 'remove')}</button>
              </div>
              : <button disabled={ocupado} style={{ ...bt('#fff', '#C2452F'), width: '100%', padding: 9, fontSize: 13 }}
                onClick={() => { if (window.confirm(tr(`Marcar ${p.nome} como seu rival? Você só pode ter UM rival — se já tinha outro, ele sai.`, `Mark ${p.nome} as your rival? You can only have ONE rival — any previous one is replaced.`))) void acao(async () => { await supabase.rpc('esc_rival_marcar', { p_outro: p.uid }); esqueceRival() }) }}>
                🔥 {tr('Marcar como rival', 'Mark as rival')}</button>}
            <p style={{ fontSize: 10, color: '#777', fontWeight: 700, margin: '4px 0 0', textAlign: 'center' }}>{tr('Rival é só zoeira: aparece um 🔥 do lado dele na sala e o placar de títulos no seu perfil.', 'A rival is just banter: a 🔥 shows next to them in the room and the title score on your profile.')}</p>
          </div>
        )}
        {/* 📖🤝 19/10 (mockup `amigos-album.png`): no perfil do AMIGO, ver as cartas dele e propor troca com ele já escolhido */}
        {!p.sou_eu && p.relacao === 'aceito' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...bt(albumDele === 'cartas' ? INK : GOLD, albumDele === 'cartas' ? GOLD : INK), flex: 1, padding: 9, fontSize: 13 }} onClick={() => setAlbumDele(v => v === 'cartas' ? null : 'cartas')}>📖 {tr('Ver cartas dele', 'See their cards')}</button>
              <button style={{ ...bt(ROXO, '#fff'), flex: 1, padding: 9, fontSize: 13, outline: albumDele === 'troca' ? `3px solid ${GOLD}` : undefined }} onClick={() => setAlbumDele(v => v === 'troca' ? null : 'troca')}>🤝 {tr('Propor troca', 'Propose a trade')}</button>
            </div>
            {albumDele && <div style={{ marginTop: 8, background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: 10 }}>
              {albumDele === 'cartas' ? <CartasDele uid={p.uid} /> : <AlbumNosAmigos key={p.uid} propor={{ uid: p.uid, nome: p.nome }} />}
            </div>}
          </div>
        )}
        {/* 📊 28/10 (mockup perfil-trofeus.png, Diego): os DOIS rankings lado a lado e discretos — carreira (o melhor save, na
            temporada dele) e o online de TODOS OS TEMPOS ("rank do online não deixa só global e não mensal") */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {([
            [p.rank ? `${p.rank.pos}º` : '—', tr('📊 Ranking da carreira', '📊 Career ranking'), p.rank ? tr(`temporada ${p.rank.temporada}`, `season ${p.rank.temporada}`) : tr('sem carreira na nuvem', 'no cloud career')],
            [p.sempre ? `${p.sempre.pos}º` : '—', tr('🔨 Ranking do online', '🔨 Online ranking'), p.sempre ? tr(`geral · ${p.sempre.titulos} ${p.sempre.titulos === 1 ? 'título' : 'títulos'}`, `all-time · ${p.sempre.titulos} ${p.sempre.titulos === 1 ? 'title' : 'titles'}`) : tr('sem título ainda', 'no title yet')],
          ] as const).map(([num, rot, sub]) => (
            <div key={rot} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7, background: '#FFF7DA', border: `2px solid ${INK}`, borderRadius: 12, padding: '6px 8px', color: INK }}>
              <span style={{ ...OSW, fontSize: 21, lineHeight: 1 }}>{num}</span>
              <span style={{ minWidth: 0, fontSize: 10.5, fontWeight: 800, color: '#555', lineHeight: 1.15 }}><b style={{ display: 'block', color: INK }}>{rot}</b>{sub}</span>
            </div>
          ))}
        </div>

        {/* 🏆 títulos da carreira com as TAÇAS do jogo (as da Sala de Troféus): ganhou = colorida com ×N; falta = apagadinha */}
        <div style={caixa}>
          <p style={h3}>🏆 {tr('Títulos na carreira', 'Career titles')}</p>
          <GradeTacas itens={[
            ['carA', p.titulos?.serie_a ?? 0, tr('Série A', 'Serie A')], ['carC', p.titulos?.ligas ?? 0, tr('Ligas (todas)', 'Leagues (all)')],
            ['copabr', p.titulos?.copas ?? 0, tr('Copa do Brasil', 'Cup')], ['supercopa', p.titulos?.supercopas ?? 0, tr('Supercopa', 'Super Cup')],
            ['liberta', p.titulos?.libertadores ?? 0, 'Libertadores'], ['champions', p.titulos?.champions ?? 0, 'Champions'],
            ['mundial', p.titulos?.mundial ?? 0, tr('Mundial', 'Club World Cup')], ['mundo', p.titulos?.copa_mundo ?? 0, tr('Copa do Mundo', 'World Cup')],
          ]} />
          <p style={{ fontSize: 10, color: '#777', fontWeight: 700, margin: '6px 0 0' }}>{tr(`${p.titulos?.temporadas ?? 0} temporadas · somando todas as carreiras salvas na nuvem`, `${p.titulos?.temporadas ?? 0} seasons · all cloud-saved careers added up`)}</p>
        </div>

        {/* 🔨 títulos de sala online, por competição, com as taças + as medalhas do pódio da semana */}
        <div style={caixa}>
          <p style={h3}>🔨 {tr('Títulos no online', 'Online titles')} ({p.titulos?.salas ?? 0})</p>
          <GradeTacas itens={[
            ['liga', tacas?.liga ?? (tacas ? 0 : (p.titulos?.salas ?? 0)), tr('Liga', 'League')], ['copa8', tacas?.copa ?? 0, tr('Copa dos 8', 'Cup of 8')],
            ['liberta', tacas?.libertadores ?? 0, 'Libertadores'], ['champions', tacas?.champions ?? 0, 'Champions'],
            ['relampago', tacas?.relampago ?? 0, tr('Relâmpago', 'Lightning')], ['mundo', tacas?.mundial ?? 0, tr('Copa do Mundo', 'World Cup')],
            ['riosp', tacas?.regional ?? 0, tr('Regionais', 'Regionals')],
          ]} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8, ...OSW, fontSize: 15, color: INK }}>
            <span title={tr('1º da semana', '1st of the week')}>🥇 {p.medalhas?.ouro ?? 0}</span>
            <span title={tr('2º da semana', '2nd of the week')}>🥈 {p.medalhas?.prata ?? 0}</span>
            <span title={tr('3º da semana', '3rd of the week')}>🥉 {p.medalhas?.bronze ?? 0}</span>
          </div>
          <p style={{ fontSize: 10, color: '#777', fontWeight: 700, margin: '4px 0 0', textAlign: 'center' }}>{tr('medalhas do pódio do ranking semanal', 'weekly ranking podium medals')}</p>
        </div>

        {/* 🔥 o rival que ESTA pessoa marcou, com o placar de títulos do online desde o dia em que marcou */}
        {p.rival && <div style={{ ...caixa, background: '#FFE3D6' }}>
          <p style={h3}>🔥 {tr('Rival', 'Rival')}</p>
          <button onClick={() => abrir(p.rival!.uid)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: INK, textAlign: 'left' }}>
            <Rosto uid={p.rival.uid} nome={p.rival.nome} size={40} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.rival.nome}</b>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#7a2a12' }}>{tr('títulos no online desde que marcou', 'online titles since marked')}</span>
            </span>
            <span style={{ ...OSW, fontSize: 22, whiteSpace: 'nowrap' }}>{p.rival.eu} <span style={{ fontSize: 14 }}>×</span> {p.rival.ele}</span>
          </button>
        </div>}

        <div style={caixa}>
          <p style={h3}>👥 {tr('Amigos', 'Friends')} ({p.amigos_total})</p>
          {p.amigos.length === 0
            ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{tr('Ainda sem amigos por aqui.', 'No friends here yet.')}</p>
            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {p.amigos.map(a => (
                <button key={a.uid} onClick={() => abrir(a.uid)} style={{ width: 62, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center', fontSize: 10, fontWeight: 800, color: INK }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}><Rosto uid={a.uid} nome={a.nome} size={44} /></div>
                  <div style={{ marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                </button>
              ))}
            </div>}
        </div>

      </>}
    </Janela>
  )
}

// ── 👥 MEUS AMIGOS ─────────────────────────────────────────────────────────────────────────────────────────────
export function MeusAmigos({ onClose, abaInicial = 'amigos', querCriar }: { onClose: () => void; abaInicial?: 'amigos' | 'ranking' | 'album' | 'cla'; querCriar?: boolean }) {
  const [lista, setLista] = useState<Linha[] | null | 'erro'>(null)
  const [perfil, setPerfil] = useState<string | null>(null)
  // 👤 18/10 (Diego abriu a lista vazia e não viu nada do mockup): o MEU perfil no topo + 🔎 procurar técnico pelo nome
  const [eu, setEu] = useState<{ uid: string; p: Perfil | null } | null>(null)
  const [busca, setBusca] = useState('')
  const [refaz, setRefaz] = useState(0) // relê a busca depois de mexer numa amizade pelo perfil
  const [achados, setAchados] = useState<{ uid: string; nome: string; relacao: Linha['relacao'] | null }[] | null>(null)
  const [aba, setAba] = useState<'amigos' | 'ranking' | 'album' | 'cla'>(abaInicial)
  const salaEspera = useSalaEspera() // estou numa sala de espera? então dá pra CHAMAR amigo online
  const [chamados, setChamados] = useState<Record<string, string>>({})
  const [semConta, setSemConta] = useState(false)
  const chamar = async (uid: string) => {
    if (!salaEspera) return
    setChamados(c => ({ ...c, [uid]: '…' }))
    const { data } = await supabase.rpc('esc_convite_enviar', { p_para: uid, p_room: salaEspera })
    setChamados(c => ({ ...c, [uid]: textoConvite(String(data ?? 'erro')) }))
  }
  useEffect(() => {
    let vivo = true
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id; if (!vivo) return
      if (!uid) { setSemConta(true); return }
      setEu({ uid, p: null })
      supabase.rpc('esc_perfil_publico2', { p_uid: uid }).then(({ data: d }) => { if (vivo && d) setEu({ uid, p: d as Perfil }) }, () => {})
    }, () => {})
    return () => { vivo = false }
  }, [])
  useEffect(() => {
    const q = busca.trim()
    if (q.length < 3) { setAchados(null); return }
    const t = setTimeout(() => {
      supabase.rpc('esc_amigo_buscar', { p_q: q }).then(({ data }) => setAchados((data ?? []) as { uid: string; nome: string; relacao: Linha['relacao'] | null }[]), () => setAchados([]))
    }, 400) // espera parar de digitar
    return () => clearTimeout(t)
  }, [busca, refaz])
  const carrega = () => { supabase.rpc('esc_amigos_lista2').then(({ data, error }) => setLista(error ? 'erro' : (data ?? []) as Linha[]), () => setLista('erro')) }
  useEffect(carrega, [])
  const responder = async (id: number, sim: boolean) => { await supabase.rpc('esc_amigo_responder', { p_id: id, p_aceita: sim }); carrega() }
  const cancelar = async (uid: string) => { await supabase.rpc('esc_amigo_desfazer', { p_outro: uid }); carrega() }
  const l = Array.isArray(lista) ? lista : []
  const recebidos = l.filter(x => x.relacao === 'recebido')
  const enviados = l.filter(x => x.relacao === 'enviado')
  const amigos = l.filter(x => x.relacao === 'aceito')
  const on = amigos.filter(x => x.online), off = amigos.filter(x => !x.online)
  // 🚪 ENTRAR só se a sala do amigo ainda está na ESPERA (começou = não dá, regra do Diego) · 📣 CHAMAR só se EU estou numa espera
  const botaoSala = (x: Linha): ReactNode => {
    if (salaEspera && x.sala_code !== salaEspera) {
      const r = chamados[x.outro]
      return r ? <span style={{ fontSize: 10.5, fontWeight: 800, color: r.startsWith('✅') ? GREEN : '#7a4d00', maxWidth: 110, textAlign: 'right' }}>{r}</span>
        : <button style={bt(ROXO, '#fff')} onClick={() => void chamar(x.outro)}>📣 {tr('Chamar', 'Invite')}</button>
    }
    if (!salaEspera && x.sala_code && x.sala_status === 'waiting') return <button style={bt(GREEN, '#fff')} onClick={() => { onClose(); entrarNaSala(x.sala_code!) }}>🚪 {tr('Entrar', 'Join')}</button>
    return null
  }
  const nomeComRival = (x: Linha) => x.rival ? `🔥 ${x.nome}` : x.nome
  const linha = (x: Linha, direita: ReactNode, sub: ReactNode) => (
    <div key={x.amizade_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px dashed #d8ccaa' }}>
      <button onClick={() => setPerfil(x.outro)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: INK }}>
        <Rosto uid={x.outro} nome={x.nome} size={36} />
        <span style={{ minWidth: 0 }}><b style={{ display: 'block', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomeComRival(x)}</b><span style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}><SeloCla uid={x.outro} /><span style={{ fontSize: 11, fontWeight: 700 }}>{sub}</span></span></span>
      </button>
      {direita}
    </div>
  )
  return (
    <Janela titulo={`${tr('👥 Meus amigos', '👥 My friends')}${amigos.length ? ` · ${amigos.length}` : ''}`} onClose={onClose}>
      {lista === null && !semConta && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('carregando…', 'loading…')}</p>}
      {semConta ? <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('Entre na sua conta (Jogar Online) pra adicionar amigos e ver quem está online.', 'Sign in (Play Online) to add friends and see who is online.')}</p>
        : lista === 'erro' && <p style={{ textAlign: 'center', fontWeight: 800, margin: '24px 0' }}>{tr('Não consegui carregar agora. Tenta de novo.', 'Couldn’t load right now. Try again.')}</p>}
      {eu && <button onClick={() => setPerfil(eu.uid)} style={{ ...caixa, width: '100%', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', background: APOIO_PERKS[eu.p?.tier && APOIO_PERKS[eu.p.tier] ? eu.p.tier : 'bege'].grad }}>
        <Rosto uid={eu.uid} nome={eu.p?.nome ?? '?'} size={54} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', ...OSW, fontSize: 11, color: '#4a3b10' }}>👤 {tr('Meu perfil', 'My profile')}</span>
          <span style={{ display: 'block', ...OSW, fontSize: 18, lineHeight: 1.05, color: INK }}>{eu.p?.nome ?? '…'}</span>
          {eu.p && <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: INK, marginTop: 2 }}>
            {eu.p.rank ? `📊 ${eu.p.rank.pos}º ${tr('no ranking global', 'in the global ranking')} · ` : ''}🏆 {(eu.p.titulos?.ligas ?? 0) + (eu.p.titulos?.copas ?? 0) + (eu.p.titulos?.supercopas ?? 0) + (eu.p.titulos?.libertadores ?? 0) + (eu.p.titulos?.champions ?? 0) + (eu.p.titulos?.mundial ?? 0) + (eu.p.titulos?.copa_mundo ?? 0)} {tr('na carreira', 'in career')} · 🔨 {eu.p.titulos?.salas ?? 0} {tr('no online', 'online')}
          </span>}
        </span>
        <span style={{ ...OSW, fontSize: 18, color: INK }}>›</span>
      </button>}
      {!semConta && <div style={caixa}>
        <p style={h3}>🔎 {tr('Procurar técnico', 'Find a manager')}</p>
        <input value={busca} onChange={e => setBusca(e.target.value)} maxLength={30} placeholder={tr('digite o nome de técnico (3 letras ou mais)', 'type a manager name (3+ letters)')}
          style={{ width: '100%', boxSizing: 'border-box', border: `2px solid ${INK}`, borderRadius: 9, padding: '8px 10px', fontSize: 13.5, fontWeight: 700, color: INK, background: '#fff' }} />
        {achados && achados.length === 0 && <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: '8px 0 0' }}>{tr('Ninguém com esse nome.', 'Nobody with that name.')}</p>}
        {achados && achados.map(a => (
          <div key={a.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px dashed #d8ccaa', marginTop: 4 }}>
            <button onClick={() => setPerfil(a.uid)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: INK }}>
              <Rosto uid={a.uid} nome={a.nome} size={34} />
              <b style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</b>
            </button>
            {a.relacao === 'aceito' ? <span style={{ fontSize: 11, fontWeight: 800, color: GREEN }}>✅ {tr('amigo', 'friend')}</span>
              : a.relacao === 'enviado' ? <span style={{ fontSize: 11, fontWeight: 800, color: '#888' }}>⏳ {tr('enviado', 'sent')}</span>
              : <button style={bt(GREEN, '#fff')} onClick={() => setPerfil(a.uid)}>{tr('ver perfil', 'view')}</button>}
          </div>
        ))}
      </div>}
      {Array.isArray(lista) && <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {([['amigos', `👥 ${tr('Amigos', 'Friends')}`], ['ranking', `🏆 ${tr('Ranking', 'Ranking')}`], ['album', `📖 ${tr('Álbum', 'Album')}`], ...(clasLiberado() ? [['cla', `⚔️ ${tr('Clã', 'Clan')}`]] as const : [])] as const).map(([k, rot]) => (
          <button key={k} onClick={() => setAba(k)} style={{ ...bt(aba === k ? INK : '#fff', aba === k ? GOLD : INK), flex: 1, padding: 8, fontSize: 12.5 }}>{rot}</button>
        ))}
      </div>}
      {Array.isArray(lista) && aba === 'cla' && <AbaCla amigos={amigos.map(x => ({ uid: x.outro, nome: x.nome }))} onPerfil={u => setPerfil(u)} querCriar={querCriar} />}
      {Array.isArray(lista) && aba === 'album' && <div style={{ marginTop: 10, background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: 10 }}><AlbumNosAmigos /></div>}
      {Array.isArray(lista) && aba === 'ranking' && (() => {
        // títulos de sala online NESTA semana (segunda a domingo), eu + amigos aceitos
        const linhas = [
          ...(eu ? [{ uid: eu.uid, nome: eu.p?.nome ?? tr('Você', 'You'), t: eu.p?.semana?.titulos ?? 0, souEu: true, rival: false }] : []),
          ...amigos.map(x => ({ uid: x.outro, nome: x.nome, t: x.titulos_semana ?? 0, souEu: false, rival: !!x.rival })),
        ].sort((a, b) => b.t - a.t || a.nome.localeCompare(b.nome))
        let pos = 0, ant = -1
        return <div style={caixa}>
          <p style={h3}>🏆 {tr('Títulos no online · esta semana', 'Online titles · this week')}</p>
          {amigos.length === 0 && <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: '0 0 6px' }}>{tr('Adicione amigos pra disputar o ranking entre vocês.', 'Add friends to compete in your own ranking.')}</p>}
          {linhas.map((l, i) => {
            if (l.t !== ant) { pos = i + 1; ant = l.t }
            return <button key={l.uid} onClick={() => setPerfil(l.uid)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 6px', borderTop: i ? '1px dashed #d8ccaa' : 'none', background: l.souEu ? '#FFF7DA' : 'none', border: 'none', borderRadius: 8, cursor: 'pointer', color: INK, textAlign: 'left' }}>
              <span style={{ ...OSW, fontSize: 16, width: 30, textAlign: 'center' }}>{pos <= 3 && l.t > 0 ? ['🥇', '🥈', '🥉'][pos - 1] : `${pos}º`}</span>
              <Rosto uid={l.uid} nome={l.nome} size={32} />
              <b style={{ flex: 1, minWidth: 0, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.rival ? '🔥 ' : ''}{l.nome}{l.souEu ? ` (${tr('você', 'you')})` : ''}</b>
              <span style={{ ...OSW, fontSize: 16 }}>{l.t} 🏆</span>
            </button>
          })}
          <p style={{ fontSize: 10, color: '#777', fontWeight: 700, margin: '6px 0 0' }}>{tr('Zera toda segunda-feira, igual ao ranking semanal.', 'Resets every Monday, like the weekly ranking.')}</p>
        </div>
      })()}
      {Array.isArray(lista) && aba === 'amigos' && <>
        {salaEspera && <p style={{ ...caixa, background: '#EFE6FF', fontSize: 12, fontWeight: 800, margin: '10px 0 0' }}>📣 {tr(`Você está na sala ${salaEspera}: toque em CHAMAR num amigo online e ele recebe o convite na hora.`, `You are in room ${salaEspera}: tap INVITE on an online friend and they get it right away.`)}</p>}
        {recebidos.length > 0 && <div style={{ ...caixa, background: '#FFF3C4' }}>
          <p style={h3}>📩 {recebidos.length === 1 ? tr('1 pedido de amizade', '1 friend request') : tr(`${recebidos.length} pedidos de amizade`, `${recebidos.length} friend requests`)}</p>
          {recebidos.map(x => linha(x, <span style={{ display: 'flex', gap: 5 }}><button style={bt(GREEN, '#fff')} onClick={() => void responder(x.amizade_id, true)}>{tr('aceitar', 'accept')}</button><button style={bt('#fff', INK)} onClick={() => void responder(x.amizade_id, false)}>{tr('recusar', 'decline')}</button></span>, <span style={{ color: '#7a4d00' }}>{tr('quer ser seu amigo', 'wants to be your friend')}</span>))}
        </div>}
        <div style={caixa}>
          <p style={h3}>🟢 {tr('Online agora', 'Online now')} ({on.length})</p>
          {on.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{tr('Nenhum amigo jogando agora.', 'No friends playing right now.')}</p>
            : on.map(x => linha(x, botaoSala(x), <span style={{ color: x.sala_status && x.sala_status !== 'waiting' ? '#7a4d00' : GREEN }}>{x.sala_status && x.sala_status !== 'waiting' ? `🎮 ${tr('jogando agora · a sala já começou', 'playing now · the room already started')}` : `● ${ondeEsta(x.tela)}`}</span>))}
        </div>
        <div style={caixa}>
          <p style={h3}>⚪ {tr('Offline', 'Offline')} ({off.length})</p>
          {off.length === 0 ? <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>{amigos.length === 0 ? tr('Você ainda não tem amigos. Procure pelo nome aqui em cima, ou toque no nome de alguém numa sala ou no chat.', 'No friends yet. Search by name above, or tap someone’s name in a room or in the chat.') : tr('Todo mundo online!', 'Everyone is online!')}</p>
            : off.map(x => linha(x, null, <span style={{ color: '#888' }}>{vistoHa(x.visto_em)}</span>))}
        </div>
        {enviados.length > 0 && <div style={caixa}>
          <p style={h3}>⏳ {tr('Pedidos que você mandou', 'Requests you sent')} ({enviados.length})</p>
          {enviados.map(x => linha(x, <button style={bt('#fff', INK)} onClick={() => void cancelar(x.outro)}>{tr('cancelar', 'cancel')}</button>, <span style={{ color: '#888' }}>{tr('esperando aceitar', 'waiting')}</span>))}
        </div>}
        <p style={{ fontSize: 11, color: '#666', fontWeight: 700, margin: '10px 2px 0', lineHeight: 1.4 }}>{tr('Amizade só vale com os dois lados aceitando, e dá pra desfazer quando quiser. Ninguém vê o seu e-mail.', 'A friendship needs both sides to accept, and you can undo it any time. Nobody sees your e-mail.')}</p>
      </>}
      {Array.isArray(lista) && <BotaoComunidade />}
      {perfil && <PerfilPublico uid={perfil} onClose={() => { setPerfil(null); carrega(); setRefaz(n => n + 1) }} onAbrirOutro={u => setPerfil(u)} />}
    </Janela>
  )
}

// botão "👥 Amigos" (com o número de pedidos esperando) — lê a lista UMA vez quando aparece
export function BotaoAmigos({ style }: { style?: CSSProperties }) {
  const [aberto, setAberto] = useState(false)
  const [pedidos, setPedidos] = useState(0)
  useEffect(() => {
    let vivo = true
    supabase.rpc('esc_amigos_lista').then(({ data }) => { if (vivo) setPedidos(((data ?? []) as Linha[]).filter(x => x.relacao === 'recebido').length) }, () => {})
    return () => { vivo = false }
  }, [aberto])
  return <>
    <button onClick={() => setAberto(true)} style={{ ...bt(ROXO, '#fff'), position: 'relative', ...style }}>
      👥 {tr('Amigos', 'Friends')}
      {pedidos > 0 && <span style={{ position: 'absolute', top: -8, right: -8, minWidth: 20, height: 20, borderRadius: 10, background: RED, color: '#fff', border: `2px solid ${INK}`, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{pedidos}</span>}
    </button>
    {aberto && <MeusAmigos onClose={() => setAberto(false)} />}
  </>
}

// 💬 embrulho pra nome/foto de alguém (chat, listas): com amigos ligado e conta de verdade, o toque abre o PERFIL (com o
// ➕ Adicionar amigo). O toque NÃO vaza pro que está em volta (no chat, tocar no balão é "responder").
export function ComPerfil({ uid, children }: { uid: string | null | undefined; children: ReactNode }) {
  const on = useAmigos()
  if (!on || !contaValida(uid)) return <>{children}</>
  return <span role="button" tabIndex={0} title={tr('Ver perfil', 'View profile')} onClick={e => { e.stopPropagation(); abrePerfilSolto(uid) }}
    onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); abrePerfilSolto(uid) } }} style={{ cursor: 'pointer', display: 'inline-flex' }}>{children}</span>
}

// 🪟 O PERFIL ABERTO PELO CHAT VIVE SOLTO (18/10, Diego: *"quando fecho o chat, fecha a tela de amigos também"*). Antes ele
// morava dentro do `ComPerfil`, que mora dentro do chat: fechou o chat, o perfil sumia junto (e ainda ficava por baixo da
// janela do chat). Agora ele tem uma raiz própria no <body>, fora de qualquer tela, e só fecha no X dele.
// 19/10 (Diego: *"fica escondido o chat atrapalhando o modal… deveria fechar o chat e abrir o modal"*): abrir o perfil pelo
// chat FECHA o chat (os dois chats ouvem este evento) — senão a janela do chat cobre o perfil e o botão de adicionar.
export const EVENTO_PERFIL_ABERTO = 'esc-perfil-aberto'
let raizPerfil: Root | null = null
let vezPerfil = 0
export function abrePerfilSolto(uid: string) {
  window.dispatchEvent(new Event(EVENTO_PERFIL_ABERTO))
  if (!raizPerfil) { const el = document.createElement('div'); el.id = 'perfil-solto'; document.body.appendChild(el); raizPerfil = createRoot(el) }
  vezPerfil++
  raizPerfil.render(<PerfilPublico key={vezPerfil} uid={uid} onClose={() => raizPerfil?.render(null)} />)
}

// ⚔️ 21/10 (Diego: "no ranking dos clãs, um botão sutil 'procurar ou criar clãs' que cai na aba de clãs"): abre os Amigos
// SOLTO (raiz própria, igual ao perfil) já na aba pedida — serve pra qualquer tela que não tem a janela de Amigos à mão.
let raizAmigos: Root | null = null
export function abreAmigosSolto(aba: 'amigos' | 'ranking' | 'album' | 'cla' = 'amigos', querCriar?: boolean) {
  if (!raizAmigos) { const el = document.createElement('div'); el.id = 'amigos-solto'; document.body.appendChild(el); raizAmigos = createRoot(el) }
  raizAmigos.render(<MeusAmigos key={Date.now()} abaInicial={aba} querCriar={querCriar} onClose={() => raizAmigos?.render(null)} />)
}

// ── 👥 v2 (19/10, liberado pra todos) ──────────────────────────────────────────────────────────────────────────────
// Mockup aprovado: `scripts/mockups/amigos-todos.png`. Diego: *"entrar só dá se a sala tiver aberta"* e *"chat entre eles…
// tenho uma comunidade no zap"* → nada de conversa 1:1, vai o botão da comunidade. Banco: migration 20261019…_amigos_v2.

// 🚪 a sala de espera em que EU estou agora (o lobby avisa). Com ela, a lista mostra 📣 CHAMAR nos amigos online.
let salaEsperaAtual: string | null = null
const ouvSala = new Set<() => void>()
export function marcaSalaEspera(code: string | null) {
  if (salaEsperaAtual === code) return
  salaEsperaAtual = code; ouvSala.forEach(f => f())
}
function useSalaEspera(): string | null {
  return useSyncExternalStore(f => { ouvSala.add(f); return () => { ouvSala.delete(f) } }, () => salaEsperaAtual)
}
function textoConvite(r: string): string {
  if (r === 'ok') return tr('✅ convite enviado', '✅ invite sent')
  if (r === 'espera') return tr('⏳ já chamou, espera 1 min', '⏳ already invited, wait 1 min')
  if (r === 'comecou') return tr('a sala já começou', 'the room already started')
  if (r === 'nao_amigo') return tr('só dá pra chamar amigo', 'friends only')
  return tr('não deu agora, tenta de novo', 'didn’t work, try again')
}

// 🚪 entrar na sala de um amigo: usa a MESMA porta do link de convite (?j=CODE) — o lobby lê o código guardado e entra.
// Se o lobby já está aberto, ele ouve o evento; se não, a ponte do index.tsx abre o online e o lobby entra sozinho.
export const EVENTO_ENTRAR_SALA = 'esc-entrar-sala'
export function entrarNaSala(code: string) {
  const c = code.trim().toUpperCase()
  try { sessionStorage.setItem('esc_invite_code', c) } catch { /* ignora */ }
  window.dispatchEvent(new CustomEvent(EVENTO_ENTRAR_SALA, { detail: c }))
}

// 💬 sem chat 1:1: a conversa entre amigos é na comunidade do zap (ordem do Diego, 19/10)
export function BotaoComunidade() {
  if (!COMUNIDADE_LINK) return null
  return <a href={COMUNIDADE_LINK} target="_blank" rel="noopener noreferrer" style={{ ...caixa, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: '#25D366', color: '#fff' }}>
    <span style={{ fontSize: 26 }}>💬</span>
    <span style={{ flex: 1 }}><span style={{ display: 'block', ...OSW, fontSize: 15, color: '#fff' }}>{tr('Entrar na comunidade do zap', 'Join the WhatsApp community')}</span>
      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#eafff1' }}>{tr('É lá que a galera conversa, marca sala e zoa.', 'That’s where everyone chats, sets up rooms and jokes around.')}</span></span>
    <span style={{ ...OSW, fontSize: 18, color: '#fff' }}>›</span>
  </a>
}

// 🔥 o MEU rival (uid + nome), lido uma vez por sessão — a sala desenha o 🔥 do lado dele
type Rival = { uid: string; nome: string } | null
let rivalAtual: Rival | undefined
let rivalPedido: Promise<void> | null = null
const ouvRival = new Set<() => void>()
function buscaRival() {
  if (rivalPedido) return
  rivalPedido = (async () => {
    const { data: s } = await supabase.auth.getSession()
    if (!s.session) { rivalAtual = null; return }
    const { data } = await supabase.rpc('esc_meu_rival')
    rivalAtual = data && (data as { uid?: string }).uid ? data as Rival : null
  })().catch(() => { rivalAtual = null }).finally(() => ouvRival.forEach(f => f()))
}
export function esqueceRival() { rivalPedido = null; rivalAtual = undefined; buscaRival() }
export function meuRivalAgora(): Rival { return rivalAtual ?? null }
export function useMeuRival(): Rival {
  const on = useAmigos()
  const r = useSyncExternalStore(f => { ouvRival.add(f); return () => { ouvRival.delete(f) } }, () => rivalAtual)
  useEffect(() => { if (on) buscaRival() }, [on])
  return on ? r ?? null : null
}

// 🔔 AVISOS: convites pra sala, pedidos de amizade, amizades aceitas e quem entrou online. UMA leitura (`esc_avisos`) ao abrir
// e a cada 60s SÓ com a aba visível — nada de canal em tempo real (regra do tráfego, 04/10).
type Avisos = {
  convites: { id: number; de: string; nome: string; code: string; status: string | null; em: string }[]
  pedidos: { id: number; de: string; nome: string; em: string }[]
  aceitos: { uid: string; nome: string; em: string }[]
  online: { uid: string; nome: string }[]
  // ⚔️ 21/10 (Diego: "no sininho também convite de clã"): convites pra clã que recebi · pedidos pra entrar nos clãs que presido
  clas?: { id: number; cla: number; cla_nome: string; emblema: string; de: string; nome: string; em: string }[]
  cla_pedidos?: { id: number; cla: number; cla_nome: string; de: string; nome: string; em: string }[]
}
let avisosAtual: Avisos | null = null
const ouvAvisos = new Set<() => void>()
const pubAvisos = (a: Avisos | null) => { avisosAtual = a; ouvAvisos.forEach(f => f()) }
function useAvisos(): Avisos | null { return useSyncExternalStore(f => { ouvAvisos.add(f); return () => { ouvAvisos.delete(f) } }, () => avisosAtual) }
let lerAvisosAgora: () => void = () => {}
const SINO_VISTO = 'esc_sino_visto' // quando abri o sininho pela última vez (as "amizades aceitas" antes disso não contam)
const lerVisto = () => { try { return +(localStorage.getItem(SINO_VISTO) || 0) } catch { return 0 } }

export function AvisosAmigos({ ocupado }: { ocupado: boolean }) {
  const on = useAmigos()
  const a = useAvisos()
  const vistosOnline = useRef<Map<string, number>>(new Map()) // uid → quando avisei (máx. 1 aviso por amigo a cada 30 min)
  const antes = useRef<Set<string> | null>(null)
  const [toast, setToast] = useState<{ uid: string; nome: string; txt?: [string, string] } | null>(null)
  const jaVi = useRef<Set<string> | null>(null) // 🔔 21/10: pedido de amizade / convite de clã / pedido pro meu clã que eu já vi
  const [fechados, setFechados] = useState<Set<number>>(new Set())
  useEffect(() => {
    if (!on) return
    let vivo = true
    const ler = async () => {
      if (document.visibilityState !== 'visible') return
      const { data: s } = await supabase.auth.getSession()
      if (!s.session || !vivo) return
      const { data } = await supabase.rpc('esc_avisos')
      if (!vivo || !data) return
      const av = data as Avisos
      // 🟢 quem ENTROU online desde a última leitura (a 1ª leitura só tira a foto, não avisa ninguém)
      const agora = new Set(av.online.map(o => o.uid))
      if (antes.current) {
        const novo = av.online.find(o => !antes.current!.has(o.uid) && Date.now() - (vistosOnline.current.get(o.uid) ?? 0) > 30 * 60_000)
        if (novo) { vistosOnline.current.set(novo.uid, Date.now()); setToast(novo) }
      } else av.online.forEach(o => vistosOnline.current.set(o.uid, Date.now()))
      antes.current = agora
      // 🔔 21/10 (Diego): pedido de amizade, convite de clã e pedido pro MEU clã também pulam na tela (a 1ª leitura só tira a foto)
      const novos: { k: string; uid: string; nome: string; txt: [string, string] }[] = [
        ...av.pedidos.map(x => ({ k: `p${x.id}`, uid: x.de, nome: x.nome, txt: ['quer ser seu amigo 🤝', 'wants to be your friend 🤝'] as [string, string] })),
        ...(av.clas ?? []).map(x => ({ k: `k${x.id}`, uid: x.de, nome: x.nome, txt: [`te chamou pro clã ${x.cla_nome} ⚔️`, `invited you to the ${x.cla_nome} clan ⚔️`] as [string, string] })),
        ...(av.cla_pedidos ?? []).map(x => ({ k: `q${x.id}`, uid: x.de, nome: x.nome, txt: [`quer entrar no seu clã ${x.cla_nome} ⚔️`, `wants to join your ${x.cla_nome} clan ⚔️`] as [string, string] })),
      ]
      if (jaVi.current) { const nv = novos.find(x => !jaVi.current!.has(x.k)); if (nv) setToast({ uid: nv.uid, nome: nv.nome, txt: nv.txt }) }
      jaVi.current = new Set(novos.map(x => x.k))
      pubAvisos(av)
    }
    lerAvisosAgora = () => { void ler() }
    void ler()
    const t = setInterval(() => { void ler() }, 60_000)
    const vis = () => { if (document.visibilityState === 'visible') void ler() }
    document.addEventListener('visibilitychange', vis)
    return () => { vivo = false; clearInterval(t); document.removeEventListener('visibilitychange', vis); lerAvisosAgora = () => {} }
  }, [on])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 6000); return () => clearTimeout(t) }, [toast])
  if (!on || !a) return null
  // ✉️ convite: aparece em qualquer tela, MENOS no meio de partida/leilão (aí espera; o sininho guarda)
  const convite = ocupado ? null : a.convites.find(c => c.status === 'waiting' && !fechados.has(c.id) && c.code !== salaEsperaAtual) ?? null
  const fecha = (id: number) => { setFechados(f => new Set(f).add(id)); void supabase.rpc('esc_convite_visto', { p_id: id }).then(() => {}, () => {}) }
  return <>
    {toast && !ocupado && createPortal(
      <div style={{ position: 'fixed', left: '50%', top: 12, transform: 'translateX(-50%)', zIndex: 99970, width: 'calc(100% - 32px)', maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 10px' }}>
        <Rosto uid={toast.uid} nome={toast.nome} size={34} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800 }}>{toast.txt ? <>🔔 <b>{toast.nome}</b> {tr(toast.txt[0], toast.txt[1])}</> : <><span style={{ color: GREEN }}>●</span> <b>{toast.nome}</b> {tr('entrou no jogo', 'just came online')}</>}</span>
        <button onClick={() => setToast(null)} aria-label={tr('Fechar', 'Close')} style={{ background: 'none', border: 'none', fontWeight: 900, fontSize: 15, cursor: 'pointer', color: INK }}>✕</button>
      </div>, document.body)}
    {convite && <Janela titulo={tr('📣 Convite pra sala', '📣 Room invite')} onClose={() => fecha(convite.id)}>
      <div style={{ ...caixa, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Rosto uid={convite.de} nome={convite.nome} size={56} />
        <div style={{ minWidth: 0 }}>
          <div style={{ ...OSW, fontSize: 18, lineHeight: 1.1 }}>{convite.nome}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{tr('te chamou pra sala', 'invited you to room')} <b>{convite.code}</b></div>
        </div>
      </div>
      <p style={{ fontSize: 11.5, fontWeight: 700, color: '#555', margin: '8px 2px 0' }}>{salaEsperaAtual ? tr('Você já está numa sala. Saia dela primeiro pra entrar nesta.', 'You are already in a room. Leave it first to join this one.') : tr('A sala ainda está esperando a galera.', 'The room is still waiting for people.')}</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {!salaEsperaAtual && <button style={{ ...bt(GREEN, '#fff'), flex: 1, padding: 11, fontSize: 15 }} onClick={() => { fecha(convite.id); entrarNaSala(convite.code) }}>🚪 {tr('Entrar na sala', 'Join the room')}</button>}
        <button style={{ ...bt('#fff', INK), padding: 11 }} onClick={() => fecha(convite.id)}>{tr('agora não', 'not now')}</button>
      </div>
    </Janela>}
  </>
}

// 🤝 aceitar/recusar amizade e convite/pedido de clã: UMA porta só, usada pelo 🔔 e pelos pedidos da home (27/10) — a mesma
// função do banco que a aba ⚔️ Clã usa (esc_cla_responder), com as mesmas travas (troca, presidente, "sempre são dois").
async function responderAmizade(id: number, sim: boolean) { await supabase.rpc('esc_amigo_responder', { p_id: id, p_aceita: sim }); lerAvisosAgora() }
async function responderClaAviso(id: number, sim: boolean, ehConvite = false): Promise<string> {
  let msg = ''
  try {
    const { data } = await supabase.rpc('esc_cla_responder', { p_id: id, p_aceita: sim, p_trocar: false })
    const r = (data ?? {}) as { ok?: boolean; erro?: string; atual?: string; ate?: string; cla?: string }
    if (r.ok) { if (sim) msg = ehConvite ? tr(ENTROU_CLA[0], ENTROU_CLA[1]) : tr('✅ Feito!', '✅ Done!'); esqueceClas() }
    else if (r.erro === 'trava') msg = `⚠️ ${msgTrava(r.ate, r.cla)}`
    else if (r.erro === 'confirmar') msg = tr(`⚠️ Você já está no ${r.atual}. Pra trocar, abra 👥 Amigos → ⚔️ Clã.`, `⚠️ You are already in ${r.atual}. To switch, open 👥 Friends → ⚔️ Clan.`)
    else if (r.erro === 'cheio') msg = tr('⚠️ Você já está em 2 clãs, o máximo. Saia de um em 👥 Amigos → ⚔️ Clã.', '⚠️ You are already in 2 clans, the max. Leave one in 👥 Friends → ⚔️ Clan.')
    else msg = tr('⚠️ Não deu agora. Tenta de novo.', '⚠️ Couldn’t do it now. Try again.')
  } catch { msg = tr('⚠️ Não deu agora. Tenta de novo.', '⚠️ Couldn’t do it now. Try again.') }
  lerAvisosAgora()
  return msg
}

// 🔔 o sininho da home: soma convites abertos + pedidos + amizades aceitas desde a última vez que abriu
export function SinoAmigos({ onAbrirAmigos }: { onAbrirAmigos: () => void }) {
  const on = useAmigos()
  const a = useAvisos()
  const [aberto, setAberto] = useState(false)
  const [visto, setVisto] = useState(lerVisto)
  const [perfil, setPerfil] = useState<string | null>(null)
  const [msgCla, setMsgCla] = useState('')
  if (!on || !a) return null // sem conta (ou antes da 1ª leitura): sem sininho
  const convites = (a?.convites ?? []).filter(c => c.status === 'waiting')
  const pedidos = a?.pedidos ?? []
  const aceitos = (a?.aceitos ?? []).filter(x => new Date(x.em).getTime() > visto)
  const clas = a?.clas ?? [], claPedidos = a?.cla_pedidos ?? []
  const n = convites.length + pedidos.length + aceitos.length + clas.length + claPedidos.length
  const abrir = () => { setAberto(true); const t = Date.now(); try { localStorage.setItem(SINO_VISTO, String(t)) } catch { /* ignora */ } }
  const fechar = () => { setAberto(false); setVisto(lerVisto()) }
  const responder = (id: number, sim: boolean) => responderAmizade(id, sim)
  const responderCla = async (id: number, sim: boolean, ehConvite = false) => { setMsgCla(''); setMsgCla(await responderClaAviso(id, sim, ehConvite)) }
  const linha = (uid: string, nome: string, txt: ReactNode, dir: ReactNode, k: string) => (
    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: '1px dashed #d8ccaa' }}>
      <button onClick={() => setPerfil(uid)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: INK, textAlign: 'left' }}>
        <Rosto uid={uid} nome={nome} size={34} />
        <span style={{ minWidth: 0, fontSize: 12.5, fontWeight: 700 }}><b>{nome}</b> {txt}</span>
      </button>
      {dir}
    </div>
  )
  const todos = (a?.aceitos ?? [])
  return <>
    <button onClick={abrir} aria-label={tr('Avisos', 'Notifications')} style={{ position: 'relative', width: 40, minWidth: 40, height: 40, minHeight: 40, padding: 0, borderRadius: 12, border: `3px solid ${INK}`, background: '#fff', boxShadow: `2px 2px 0 ${INK}`, fontSize: 19, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      🔔
      {n > 0 && <span style={{ position: 'absolute', top: -8, right: -8, minWidth: 20, height: 20, borderRadius: 10, background: RED, color: '#fff', border: `2px solid ${INK}`, ...OSW, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{n}</span>}
    </button>
    {aberto && <Janela titulo={tr('🔔 Avisos', '🔔 Notifications')} onClose={fechar}>
      <div style={caixa}>
        {convites.length + pedidos.length + todos.length + clas.length + claPedidos.length === 0 && <p style={{ fontSize: 12.5, fontWeight: 700, color: '#666', margin: 0 }}>{tr('Nada novo por aqui. Quando um amigo te chamar pra sala ou te adicionar, aparece aqui.', 'Nothing new. When a friend invites you to a room or adds you, it shows up here.')}</p>}
        {convites.map(c => linha(c.de, c.nome, <>{tr('te chamou pra sala', 'invited you to room')} <b>{c.code}</b></>,
          salaEsperaAtual ? null : <button style={bt(GREEN, '#fff')} onClick={() => { void supabase.rpc('esc_convite_visto', { p_id: c.id }).then(() => {}, () => {}); fechar(); entrarNaSala(c.code) }}>🚪 {tr('Entrar', 'Join')}</button>, `c${c.id}`))}
        {pedidos.map(x => linha(x.de, x.nome, tr('quer ser seu amigo', 'wants to be your friend'),
          <span style={{ display: 'flex', gap: 5 }}><button style={bt(GREEN, '#fff')} onClick={() => void responder(x.id, true)}>{tr('aceitar', 'accept')}</button><button style={bt('#fff', INK)} onClick={() => void responder(x.id, false)}>✕</button></span>, `p${x.id}`))}
        {clas.map(x => linha(x.de, x.nome, <>{tr('te chamou pro clã', 'invited you to the clan')} <b>⚔️ {x.cla_nome}</b></>,
          <span style={{ display: 'flex', gap: 5 }}><button style={bt(GREEN, '#fff')} onClick={() => void responderCla(x.id, true, true)}>{tr('entrar', 'join')}</button><button style={bt('#fff', INK)} onClick={() => void responderCla(x.id, false)}>✕</button></span>, `k${x.id}`))}
        {claPedidos.map(x => linha(x.de, x.nome, <>{tr('quer entrar no seu clã', 'wants to join your clan')} <b>⚔️ {x.cla_nome}</b></>,
          <span style={{ display: 'flex', gap: 5 }}><button style={bt(GREEN, '#fff')} onClick={() => void responderCla(x.id, true)}>{tr('aceitar', 'accept')}</button><button style={bt('#fff', INK)} onClick={() => void responderCla(x.id, false)}>✕</button></span>, `q${x.id}`))}
        {todos.map(x => linha(x.uid, x.nome, <>{tr('aceitou sua amizade', 'accepted your friend request')} 🤝</>, null, `a${x.uid}`))}
        {msgCla && <p style={{ fontSize: 12, fontWeight: 800, margin: '8px 0 0', color: msgCla.startsWith('⚠️') ? RED : GREEN }}>{msgCla}</p>}
      </div>
      <button onClick={() => { fechar(); onAbrirAmigos() }} style={{ ...bt(ROXO, '#fff'), width: '100%', marginTop: 10, padding: 10, fontSize: 13 }}>👥 {tr('Ver meus amigos', 'See my friends')}{a?.online.length ? ` · ${a.online.length} ${tr('online', 'online')}` : ''}</button>
      {perfil && <PerfilPublico uid={perfil} onClose={() => { setPerfil(null); lerAvisosAgora() }} onAbrirOutro={u => setPerfil(u)} />}
    </Janela>}
  </>
}

// 🤝⚔️ PEDIDOS NA HOME (27/10, mockup aprovado: "1 eu aceito"). Medido: 159 pedidos de amizade sem resposta (137 há +2 dias) e 34
// pedidos pra entrar em clã esperando o dono — o pedido morava só no 🔔 de 40px. Aqui ele fica em cima dos modos, com ACEITAR ali
// mesmo (a mesma porta do 🔔). Sem pedido, a caixa não existe. A leitura é a mesma do sino (esc_avisos a cada 60s, nada de canal).
export function PedidosNaHome({ onAbrirAmigos }: { onAbrirAmigos: () => void }) {
  const on = useAmigos()
  const a = useAvisos()
  const [perfil, setPerfil] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [indo, setIndo] = useState<Set<string>>(new Set())
  if (!on || !a) return null
  const pedidos = a.pedidos ?? [], clas = a.clas ?? [], claPedidos = a.cla_pedidos ?? []
  if (pedidos.length + clas.length + claPedidos.length === 0 && !msg) return null
  const vai = async (k: string, fn: () => Promise<string | void>) => {
    setIndo(v => new Set(v).add(k)); setMsg('')
    const m = await fn(); if (m) setMsg(m)
    setIndo(v => { const n = new Set(v); n.delete(k); return n })
  }
  const MAX = 3
  const linha = (k: string, uid: string, nome: string, txt: ReactNode, onSim: () => Promise<string | void>, onNao: () => Promise<string | void>, sim: string) => (
    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: '1px dashed #d8ccaa' }}>
      <button onClick={() => setPerfil(uid)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: INK, textAlign: 'left', boxShadow: 'none', borderRadius: 0, minHeight: 0, textTransform: 'none' }}>
        <Rosto uid={uid} nome={nome} size={34} />
        <span style={{ minWidth: 0 }}><b style={{ ...OSW, fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</b><span style={{ fontSize: 11.5, fontWeight: 700, color: '#666' }}>{txt}</span></span>
      </button>
      <button disabled={indo.has(k)} style={bt(GREEN, '#fff')} onClick={() => void vai(k, onSim)}>{sim}</button>
      <button disabled={indo.has(k)} aria-label={tr('Recusar', 'Decline')} style={bt('#fff', INK)} onClick={() => void vai(k, onNao)}>✕</button>
    </div>
  )
  const mais = (n: number) => n > MAX && <button onClick={onAbrirAmigos} style={{ background: 'none', border: 'none', boxShadow: 'none', minHeight: 0, padding: '6px 0 0', fontWeight: 800, fontSize: 12, textDecoration: 'underline', color: INK, cursor: 'pointer' }}>{tr(`ver todos (${n})`, `see all (${n})`)} ›</button>
  const nCla = clas.length + claPedidos.length
  return <div className="ll-pedidos" style={{ margin: '0 0 14px' }}>
    {pedidos.length > 0 && <div style={{ ...caixa, marginTop: 0, marginBottom: 12 }}>
      <p style={{ ...OSW, fontSize: 15, margin: '0 0 2px' }}>🤝 {pedidos.length === 1 ? tr('1 pessoa quer ser seu amigo', '1 person wants to be your friend') : tr(`${pedidos.length} pessoas querem ser seu amigo`, `${pedidos.length} people want to be your friend`)}</p>
      {pedidos.slice(0, MAX).map(x => linha(`p${x.id}`, x.de, x.nome, tr('toque no nome pra ver o perfil', 'tap the name to see the profile'),
        () => responderAmizade(x.id, true), () => responderAmizade(x.id, false), tr('aceitar', 'accept')))}
      {mais(pedidos.length)}
    </div>}
    {nCla > 0 && <div style={{ ...caixa, marginTop: 0, background: '#FFF3C4' }}>
      <p style={{ ...OSW, fontSize: 15, margin: '0 0 2px' }}>⚔️ {clas.length === 0 ? (claPedidos.length === 1 ? tr('1 quer entrar no seu clã', '1 wants to join your clan') : tr(`${claPedidos.length} querem entrar no seu clã`, `${claPedidos.length} want to join your clan`)) : tr('Convite de clã', 'Clan invite')}</p>
      {clas.slice(0, MAX).map(x => linha(`k${x.id}`, x.de, x.nome, <>{tr('te chamou pro clã', 'invited you to the clan')} <b>{x.cla_nome}</b></>,
        () => responderClaAviso(x.id, true, true), () => responderClaAviso(x.id, false), tr('entrar', 'join')))}
      {claPedidos.slice(0, Math.max(0, MAX - clas.length)).map(x => linha(`q${x.id}`, x.de, x.nome, <>{tr('pediu pra entrar no', 'asked to join')} <b>{x.cla_nome}</b></>,
        () => responderClaAviso(x.id, true), () => responderClaAviso(x.id, false), tr('aceitar', 'accept')))}
      {mais(nCla)}
    </div>}
    {msg && <p style={{ ...caixa, background: msg.startsWith('⚠️') ? '#FFE3D6' : '#E9F7EE', fontSize: 12.5, fontWeight: 800, marginTop: 8 }}>{msg}</p>}
    {perfil && <PerfilPublico uid={perfil} onClose={() => { setPerfil(null); lerAvisosAgora() }} onAbrirOutro={u => setPerfil(u)} />}
  </div>
}

// 🔥 zoeira do rival: ganhei um título numa sala em que o MEU rival está → uma mensagem no chat (uma vez por título)
export async function zoeiraDoRival(roomId: string, chave: string, enviar: (txt: string) => void) {
  const r = meuRivalAgora(); if (!r) return
  try { if (sessionStorage.getItem('esc-rival-zoeira:' + chave)) return } catch { /* ignora */ }
  const { data } = await supabase.from('room_players').select('user_id').eq('room_id', roomId).eq('user_id', r.uid).maybeSingle()
  if (!data) return
  try { sessionStorage.setItem('esc-rival-zoeira:' + chave, '1') } catch { /* ignora */ }
  const frases: [string, string][] = [
    [`🔥 Título na cara do rival ${r.nome}! Chora não, que tem mais 🏆`, `🔥 Title right in front of rival ${r.nome}! Don’t cry, there’s more 🏆`],
    [`🔥 ${r.nome}, olha a taça passando aqui… é minha 😎🏆`, `🔥 ${r.nome}, see that trophy going by… it’s mine 😎🏆`],
    [`🔥 Mais um pro placar contra o ${r.nome}. Anota aí! 📝🏆`, `🔥 One more on the scoreboard against ${r.nome}. Write it down! 📝🏆`],
    [`🔥 ${r.nome}, rival bom é rival que assiste eu levantar a taça 🏆`, `🔥 ${r.nome}, a good rival is one who watches me lift the cup 🏆`],
  ]
  const f = frases[Math.floor(Math.random() * frases.length)]
  enviar(tr(f[0], f[1]))
}
