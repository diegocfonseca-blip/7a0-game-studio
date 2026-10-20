// 🖥️ AVISO PRO DONO DA SALA QUE SAIU DA ABA (20/10, live do Fridão FC — sala VU1UZO, 20 pessoas).
// O que aconteceu: no meio do envelope o aparelho do DONO ficou 15–31s calado e os 20 lances ficaram esperando ("não
// tá indo o lance"). Na live o jogo costuma ficar numa aba/janela que não está na frente — e o navegador DESACELERA
// aba escondida. Como é o dono quem processa o lance de todo mundo, a sala inteira para junto.
// Diego (20/10): *"quando for host, sim, pode fazer"*. Só AVISA — não mexe em lance, prazo nem na coroa:
//  · escondido: o título da aba vira "⚠️ SALA ESPERANDO VOCÊ" (aparece na barra de abas/tarefas);
//  · ao voltar (ou se o computador travar mais de 5s): faixa vermelha dizendo quanto tempo a sala ficou esperando.
import { useEffect, useRef, useState } from 'react'
import { tr } from './lang'

/** os momentos em que a sala depende do dono pra andar (lance, desempate, monte, cerimônia, pregão, tocaia) */
export function salaEsperaODono(screen: string, phase?: string): boolean {
  return screen === 'auction' || screen === 'monte' || screen === 'cerimonia' || screen === 'convocacao' || phase === 'tiebreak'
}

const TRAVA_MS = 5000 // o relógio do aparelho atrasou mais que isso = o computador/aba ficou parado

export function AvisoDonoFundo({ ativo }: { ativo: boolean }) {
  const [parado, setParado] = useState<number | null>(null) // quantos segundos a sala ficou esperando
  const escondidoDesde = useRef<number | null>(null)
  const tituloOriginal = useRef<string>('')
  useEffect(() => {
    if (!ativo) { setParado(null); return }
    const aoMudar = () => {
      if (document.hidden) {
        escondidoDesde.current = Date.now()
        tituloOriginal.current = document.title
        document.title = tr('⚠️ SALA ESPERANDO VOCÊ', '⚠️ ROOM WAITING FOR YOU')
      } else {
        if (tituloOriginal.current) document.title = tituloOriginal.current
        const desde = escondidoDesde.current
        escondidoDesde.current = null
        if (desde && Date.now() - desde > 3000) setParado(Math.round((Date.now() - desde) / 1000))
      }
    }
    // computador pesado (live, OBS) mesmo com a aba na frente: o relógio de 1s chega muito atrasado
    let ultimo = Date.now()
    const iv = setInterval(() => {
      const agora = Date.now(), atraso = agora - ultimo - 1000
      ultimo = agora
      if (!document.hidden && atraso > TRAVA_MS) setParado(Math.round(atraso / 1000))
    }, 1000)
    document.addEventListener('visibilitychange', aoMudar)
    return () => {
      document.removeEventListener('visibilitychange', aoMudar)
      clearInterval(iv)
      if (tituloOriginal.current && document.title.startsWith('⚠️')) document.title = tituloOriginal.current
    }
  }, [ativo])
  useEffect(() => { if (parado == null) return; const t = setTimeout(() => setParado(null), 12000); return () => clearTimeout(t) }, [parado])
  if (!ativo || parado == null) return null
  return (
    <div role="alert" onClick={() => setParado(null)} style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 61, background: '#E8503A', color: '#fff', textAlign: 'center',
      padding: '9px 12px', fontWeight: 800, fontSize: 13, fontFamily: 'Oswald, sans-serif', borderBottom: '3px solid #0C0C0C', cursor: 'pointer',
    }}>
      {tr(`⚠️ A sala ficou ${parado}s esperando você. Você é o dono: o lance de todo mundo passa pelo seu aparelho — deixe o jogo aberto e na frente.`,
        `⚠️ The room waited ${parado}s for you. You're the host: everyone's bid goes through your device — keep the game open and in front.`)}
    </div>
  )
}
