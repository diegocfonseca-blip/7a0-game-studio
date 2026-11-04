import { useEffect, useMemo, useRef, useState } from 'react'
import { DisputaPenaltisCampo, type ConfigPenaltisCampo, type EstadoPenaltisCampo } from './campo2d-penaltis'

// Memória local e limitada: mudar de aba/câmera não recomeça a disputa.
// Nada é gravado no save, no banco ou enviado para outras contas.
const sessoes = new Map<string, DisputaPenaltisCampo>()
const donos = new WeakMap<DisputaPenaltisCampo, object>()
export function usePenaltisCampo(config: ConfigPenaltisCampo | undefined, ativo: boolean, velocidade = 1, pausado = false, onFim?: () => void) {
  const chave = config ? `${config.id}|${config.aName}|${config.bName}|${config.pens.join(':')}|${config.seqReal ?? ''}|${!!config.invertido}` : ''
  const sessao = useMemo(() => {
    if (!config) return undefined
    let s = sessoes.get(chave)
    if (!s) {
      s = new DisputaPenaltisCampo(config); sessoes.set(chave, s)
      if (sessoes.size > 8) sessoes.delete(sessoes.keys().next().value!)
    }
    return s
    // O ID identifica o confronto e sua ordem de mandante; rerenders não remontam o relógio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  // O estado exibido precisa estar no React. Um contador ignorado deixava o
  // compilador reutilizar a leitura de sessao.estado e atrasava a frase/placar.
  const [visao, setVisao] = useState<{ sessao?: DisputaPenaltisCampo; estado?: EstadoPenaltisCampo }>({})
  const callback = useRef(onFim); callback.current = onFim
  useEffect(() => {
    if (!ativo || !sessao) return
    const dono = {}
    let antes = performance.now(), raf = 0, ultima = '', avisou = false
    donos.set(sessao, dono)
    const tick = (agora: number) => {
      if (donos.get(sessao) !== dono) return
      sessao.avancar(Math.min(.25, Math.max(0, (agora - antes) / 1000)), velocidade, pausado)
      antes = agora
      const estado = sessao.estado, sig = `${estado.fase}:${estado.cobranca}:${estado.reveladas}`
      if (sig !== ultima) { ultima = sig; setVisao({ sessao, estado }) }
      if (estado.encerrado && !avisou) { avisou = true; callback.current?.() }
      if (!estado.encerrado) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); if (donos.get(sessao) === dono) donos.delete(sessao) }
  }, [sessao, ativo, velocidade, pausado])
  return { sessao: ativo ? sessao : undefined, estado: ativo ? (visao.sessao === sessao ? visao.estado : sessao?.estado) : undefined }
}
