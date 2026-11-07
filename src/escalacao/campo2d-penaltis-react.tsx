import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DisputaPenaltisCampo, type ConfigPenaltisCampo, type EstadoPenaltisCampo } from './campo2d-penaltis'

// Memória local e limitada: mudar de aba/câmera não recomeça a disputa.
// Nada é gravado no save, no banco ou enviado para outras contas.
// 🔁 07/11: várias telas podem OUVIR a mesma disputa (o campinho e o quadro das bolinhas), mas só UM relógio anda —
// antes, a 2ª tela que pedia a disputa "roubava" o relógio e a 1ª parava de atualizar.
const sessoes = new Map<string, DisputaPenaltisCampo>()
type Motor = { raf: number; antes: number; semCampo: number; pedidos: { velocidade: number; pausado: boolean }[]; ouvintes: Set<() => void> }
const motores = new WeakMap<DisputaPenaltisCampo, Motor>()

export function chavePenaltisCampo(config: ConfigPenaltisCampo) {
  return `${config.id}|${config.aName}|${config.bName}|${config.pens.join(':')}|${config.seqReal ?? ''}|${!!config.invertido}|${config.orcamento ?? ''}`
}

function motorDe(s: DisputaPenaltisCampo): Motor {
  let m = motores.get(s)
  if (!m) { m = { raf: 0, antes: 0, semCampo: 0, pedidos: [], ouvintes: new Set() }; motores.set(s, m) }
  return m
}
function liga(s: DisputaPenaltisCampo, m: Motor) {
  if (m.raf || typeof requestAnimationFrame === 'undefined') return
  m.antes = performance.now()
  const tick = (agora: number) => {
    const p = m.pedidos[m.pedidos.length - 1]
    if (!p) { m.raf = 0; return }
    const dt = Math.min(.25, Math.max(0, (agora - m.antes) / 1000))
    // 🛟 campinho que não chamou `preparar` em 2,5 s (não está na tela): a disputa segue sem ele, nunca trava a fase
    if (!s.preparado && !p.pausado) m.semCampo += dt
    s.avancar(dt, p.velocidade, p.pausado, m.semCampo > 2.5)
    m.antes = agora
    m.ouvintes.forEach(f => f())
    // segue até o último batedor voltar pra fila (o quadro das bolinhas já acabou antes, no `duracao`)
    if (s.elapsed < s.duracaoCena) m.raf = requestAnimationFrame(tick)
    else m.raf = 0
  }
  m.raf = requestAnimationFrame(tick)
}

export function usePenaltisCampo(config: ConfigPenaltisCampo | undefined, ativo: boolean, velocidade = 1, pausado = false, onFim?: () => void) {
  const chave = config ? chavePenaltisCampo(config) : ''
  const sessao = useMemo(() => {
    if (!config) return undefined
    let s = sessoes.get(chave)
    if (!s) {
      s = new DisputaPenaltisCampo(config); sessoes.set(chave, s)
      if (sessoes.size > 8) sessoes.delete(sessoes.keys().next().value!)
    }
    return s
    // A chave identifica o confronto e sua ordem de mandante; rerenders não remontam o relógio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  // A cena usa o relógio mutável; a interface recebe um snapshot explícito
  // somente quando muda a fase ou o resultado, sem renderizações a cada quadro.
  const [visao, setVisao] = useState<{ sessao?: DisputaPenaltisCampo; estado?: EstadoPenaltisCampo }>({})
  const callback = useRef(onFim); callback.current = onFim
  useEffect(() => {
    if (!ativo || !sessao) return
    const m = motorDe(sessao), pedido = { velocidade, pausado }
    let ultima = '', avisou = false
    const ouvir = () => {
      const estado = sessao.estado, sig = `${estado.fase}:${estado.cobranca}:${estado.reveladas}:${estado.encerrado}:${estado.mensagem}`
      if (sig !== ultima) { ultima = sig; setVisao({ sessao, estado }) }
      if (estado.encerrado && !avisou) { avisou = true; callback.current?.() }
    }
    m.pedidos.push(pedido); m.ouvintes.add(ouvir)
    ouvir(); liga(sessao, m)
    return () => {
      m.ouvintes.delete(ouvir)
      const k = m.pedidos.indexOf(pedido); if (k >= 0) m.pedidos.splice(k, 1)
      if (!m.pedidos.length && m.raf) { cancelAnimationFrame(m.raf); m.raf = 0 }
    }
  }, [sessao, ativo, velocidade, pausado])
  return { sessao: ativo ? sessao : undefined, estado: ativo ? (visao.sessao === sessao ? visao.estado : sessao?.estado) : undefined }
}

/** 🥅 o mesmo gancho, em forma de componente — pra usar dentro de listas e funções de desenho, onde não cabe gancho */
export function Penaltis2D({ config, ativo, velocidade = 1, pausado = false, onFim, children }: { config: ConfigPenaltisCampo | undefined; ativo: boolean; velocidade?: number; pausado?: boolean; onFim?: () => void; children: (p: ReturnType<typeof usePenaltisCampo>) => ReactNode }) {
  return <>{children(usePenaltisCampo(config, ativo, velocidade, pausado, onFim))}</>
}
