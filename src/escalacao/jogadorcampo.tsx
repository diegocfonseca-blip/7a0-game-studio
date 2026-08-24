// ─── ⚽🧍 O JOGADOR NO CAMPINHO — peça única dos dois campinhos ──────────────
//
// Aprovado pelo Diego em 19/08 ("o campinho vc já pode até aprovar já"), depois
// de duas rodadas de mockup. O que mudou e POR QUÊ:
//
// ANTES: cada jogador era uma fichinha branca com borda, e o nome dentro dela.
// O Diego olhou a referência (meuonze) e cortou: *"o mockup q vc mandou N ficou
// legal… mantenha padrões visuais do campinho… mas o jogador é ele LIVRE"*.
// A caixinha branca engaiolava o boneco e comia o gramado.
//
// AGORA: o jogador fica SOLTO na grama — bolinha (ou, no futuro, o rosto),
// nome embaixo em Oswald branco com contorno preto, e o clube · ano menor.
//
// O que continua NOSSO (não é cópia de ninguém):
//   · gramado listrado verde e a moldura preta grossa do campinho;
//   · Oswald no nome, com contorno preto grosso — não a fonte redondinha deles;
//   · vaga vazia = círculo tracejado com "+", que faz time incompleto parecer
//     "falta gente aqui" em vez de bug (lei do Diego: nada de estado estranho).
//
// 🎽 A BOLINHA É O MANTO DO DONO — e só aparece em quem NÃO tem rosto.
// Correção do Diego: *"N precisa ter a bolinha c manto.. só coloque bolinha c
// manto no jogador q N tem foto"*. Com o rosto ali, a bolinha só poluía; sem
// rosto, ela vira a cara do jogador E carrega a cor do dono.
// Quem não tem manto nenhum leva BEGE — a mesma regra de tier de sempre:
// gratuito vê bege, e ninguém pega cor emprestada.
//
// 📸 O rosto já está plugado (`fotoDoJogador`), mas a pasta nasce VAZIA de
// propósito: o Diego vai gerar os rostos e lançar aos poucos, começando pelas
// LENDAS. Enquanto não houver arquivo, todo mundo cai na bolinha — ou seja,
// ligar isto hoje NÃO muda rosto de ninguém, só o desenho do campinho.
import type { CSSProperties, ReactNode } from 'react'
import { fotoDoJogador } from './rostos'

const INK = '#0C0C0C'
const OSWALD: CSSProperties = { fontFamily: 'Oswald, sans-serif' }

/** bege do tier grátis (apoio.tsx) — é o que entra quando o dono não tem manto */
export const BEGE_MANTO = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'

/** contorno preto no texto branco, do jeito da casa (4 direções, sem blur) */
const CONTORNO = `1.5px 1.5px 0 ${INK},-1.5px 1.5px 0 ${INK},1.5px -1.5px 0 ${INK},-1.5px -1.5px 0 ${INK}`

export type EstadoJogador = 'idle' | 'sel' | 'target' | 'dim'

const anelDe = (st: EstadoJogador): string =>
  st === 'sel' ? `0 0 0 3px #FFC400, 2px 3px 0 rgba(0,0,0,.45)`
    : st === 'target' ? `0 0 0 3px #1B7A3D, 2px 3px 0 rgba(0,0,0,.45)`
      : '2px 3px 0 rgba(0,0,0,.45)'

export function JogadorNoCampo({
  nome, clube, ano, tag, gols = 0, assist = 0, alt, fonteNome,
  mantoCss, estado = 'idle', onClick, extra,
}: {
  nome: string
  clube?: string
  ano?: number
  /** o rótulo da posição no selinho (ATA/MEI/ZAG/LAT/GOL) */
  tag: string
  gols?: number
  /** 🅰️ assistências da temporada — selo azul, irmão do de gols (24/08) */
  assist?: number
  /** altura do boneco em px — o campinho do leilão usa menos que o do elenco */
  alt: number
  fonteNome: number
  /** fundo da bolinha: o manto do dono. Sem manto → bege. */
  mantoCss?: string | null
  estado?: EstadoJogador
  onClick?: () => void
  /** chip extra do elenco (ex.: o overall dos olheiros) */
  extra?: ReactNode
}) {
  const foto = fotoDoJogador(nome)
  const d = Math.round(alt * 0.66)
  return (
    <div
      onClick={onClick}
      style={{
        flex: '1 1 0', minWidth: 0, textAlign: 'center',
        opacity: estado === 'dim' ? 0.5 : 1,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: alt }}>
        <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
          {foto ? (
            <img src={foto} alt="" draggable={false}
              style={{ display: 'block', height: alt, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,.45))' }} />
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: d, height: d, borderRadius: '50%', border: `3px solid ${INK}`,
              background: mantoCss || BEGE_MANTO, color: '#fff', lineHeight: 1,
              ...OSWALD, fontWeight: 700, fontSize: Math.round(alt * 0.34),
              textShadow: CONTORNO, boxShadow: anelDe(estado),
            }}>{nome.trim()[0]?.toUpperCase() ?? '?'}</span>
          )}
          {gols > 0 && (
            <span style={{
              position: 'absolute', right: -10, top: '4%', ...OSWALD, fontWeight: 700, fontSize: 9,
              color: INK, background: '#FFC400', border: `2px solid ${INK}`, borderRadius: 7,
              padding: '0 4px', lineHeight: 1.6, whiteSpace: 'nowrap',
            }}>⚽{gols}</span>
          )}
          {/* 🅰️ ASSISTÊNCIAS (24/08): mesmo selo do gol, em azul, logo abaixo.
              Sem gol na temporada, ele sobe e ocupa o lugar de cima — o
              jogador nunca fica com um buraco no lugar do número. */}
          {assist > 0 && (
            <span style={{
              position: 'absolute', right: -10, top: gols > 0 ? '38%' : '4%', ...OSWALD, fontWeight: 700, fontSize: 9,
              color: '#fff', background: '#2F6BAE', border: `2px solid ${INK}`, borderRadius: 7,
              padding: '0 4px', lineHeight: 1.6, whiteSpace: 'nowrap',
            }}>🅰️{assist}</span>
          )}
        </span>
      </div>
      <p style={{
        ...OSWALD, fontWeight: 700, textTransform: 'uppercase', color: '#fff', marginTop: 3,
        fontSize: fonteNome, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', textShadow: CONTORNO,
      }}>
        <span style={{
          fontSize: '.62em', background: INK, color: '#fff', borderRadius: 5, padding: '0 4px',
          marginRight: 4, letterSpacing: '.04em', textShadow: 'none', verticalAlign: 'middle',
        }}>{tag}</span>{nome}
      </p>
      {clube && (
        <p style={{
          ...OSWALD, fontWeight: 600, textTransform: 'uppercase', color: 'rgba(255,255,255,.82)',
          fontSize: +(fonteNome * 0.78).toFixed(1), letterSpacing: '.03em', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '1px 1px 0 rgba(0,0,0,.75)',
        }}>{clube}{ano ? ` · ${ano}` : ''}</p>
      )}
      {extra && <div style={{ marginTop: 2 }}>{extra}</div>}
    </div>
  )
}

/** vaga sem ninguém: o círculo tracejado com "+" e o selo da posição. */
export function VagaNoCampo({ tag, alt }: { tag: string; alt: number }) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-end', gap: 5,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: Math.round(alt * 0.66), height: Math.round(alt * 0.66),
        border: '2.5px dashed rgba(255,255,255,.7)', borderRadius: '50%',
        color: 'rgba(255,255,255,.85)', ...OSWALD, fontWeight: 700, fontSize: Math.round(alt * 0.3),
      }}>+</span>
      <span style={{
        ...OSWALD, fontWeight: 700, fontSize: 9, color: '#fff', background: INK,
        borderRadius: 6, padding: '1px 7px', letterSpacing: '.06em',
      }}>{tag}</span>
    </div>
  )
}
