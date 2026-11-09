// 💡💰 CONFIGURAÇÃO DA LIGA DRAFT (05/11, Diego): ideias de regras pra turma combinar (só texto) + prêmio por colocação editável.
// Aparece na hora de CRIAR a Liga Draft e na sala de espera (só o dono edita o prêmio). O padrão do prêmio sai do tamanho da liga
// (10 ou 20 times); o dono pode trocar qualquer valor.
import { useState } from 'react'
import { useT } from './lang'
import { premiosPadraoDraft } from './liga-draft'

const INK = '#0C0C0C', GOLD = '#FFC400'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 800 } as const
const INSTA = 'https://instagram.com/leilaolegendscom'

export function ConfigLigaDraft({ premios, nTimes, onPremios, soLeitura = false, piorPrimeiro = false, onOrdem }: {
  premios: number[] | null; nTimes: number; onPremios: (p: number[] | null) => void; soLeitura?: boolean
  /** 🔢 09/11 (Diego): a ordem do draft — o dono escolhe na criação e editando a liga */
  piorPrimeiro?: boolean; onOrdem?: (piorPrimeiro: boolean) => void
}) {
  const t = useT()
  const [editando, setEditando] = useState(false)
  const padrao = premiosPadraoDraft(nTimes)
  const valores = padrao.map((v, i) => premios?.[i] ?? v)
  // 💡 05/11 (Diego: *"tire as opções de apertar… só coloque ideias pros usuários combinarem entre eles… ou qualquer sugestão
  // continue falando pra falar comigo"*): são SÓ ideias — o jogo não trava nada; a turma combina e cumpre.
  const ideias = [
    t('Ninguém pega Lenda no draft', 'Nobody drafts a Legend'),
    t('Só vale jogador de Craque pra baixo', 'Only players below Star level'),
    t('Só jogador de clube brasileiro', 'Only players from Brazilian clubs'),
    t('Só jogador de um país ou de uma década', 'Only players from one country or one decade'),
    t('Quem foi campeão não pega o melhor da posição', 'The champion can’t take the best at a position'),
  ]
  const opcao = (pior: boolean, titulo: string, sub: string) => {
    const on = piorPrimeiro === pior
    return <button type="button" disabled={soLeitura || !onOrdem} onClick={() => onOrdem?.(pior)}
      className="border-2 border-black rounded-lg px-2 py-1.5 text-left" style={{ background: on ? GOLD : '#fff', boxShadow: on ? `2px 2px 0 ${INK}` : 'none', opacity: soLeitura && !on ? .5 : 1 }}>
      <span className="block text-[12.5px] uppercase leading-tight" style={{ ...OSW, color: INK }}>{on ? '✓ ' : ''}{titulo}</span>
      <span className="block text-[10.5px] font-bold text-black/60 leading-snug">{sub}</span>
    </button>
  }
  return (
    <div className="space-y-2">
      <div className="rounded-xl border-2 border-black p-2.5 bg-white">
        <p className="text-[13px] uppercase" style={{ ...OSW, color: INK }}>🔢 {t('Ordem do draft', 'Draft order')}</p>
        <p className="text-[11px] font-bold text-black/60 leading-snug">{soLeitura ? t('Quem escolhe é o dono da liga.', 'The league owner decides.') : t('Quem escolhe primeiro na noite do draft. Dá pra trocar depois, editando a liga.', 'Who picks first on draft night. You can change it later by editing the league.')}</p>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          {opcao(false, t('🏆 Melhor → pior', '🏆 Best → worst'), t('o campeão escolhe primeiro', 'the champion picks first'))}
          {opcao(true, t('🔄 Pior → melhor', '🔄 Worst → best'), t('o último escolhe primeiro', 'the last-placed picks first'))}
        </div>
      </div>
      <div className="rounded-xl border-2 border-black p-2.5 bg-white">
        <p className="text-[13px] uppercase" style={{ ...OSW, color: INK }}>💡 {t('Ideias de regras pra turma', 'Rule ideas for your crew')}</p>
        <p className="text-[11px] font-bold text-black/60 leading-snug">{t('O jogo não trava nada: vocês combinam entre vocês e cumprem. Algumas ideias:', 'The game doesn’t enforce these: you agree among yourselves. A few ideas:')}</p>
        <ul className="mt-1.5 space-y-0.5">
          {ideias.map(x => <li key={x} className="text-[12px] font-bold text-black leading-snug">• {x}</li>)}
        </ul>
        <p className="text-[10.5px] font-bold text-black/60 leading-snug mt-2">{t('Tem outra ideia ou sugestão? Fala comigo, o Diego, criador do jogo, no ', 'Got another idea or suggestion? Talk to me, Diego, the game’s creator, on ')}<a href={INSTA} target="_blank" rel="noopener noreferrer" className="underline font-black" style={{ color: INK }}>Instagram</a>.</p>
      </div>
      <div className="rounded-xl border-2 border-black p-2.5 bg-white">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] uppercase" style={{ ...OSW, color: INK }}>💰 {t(`Prêmio por colocação · liga de ${nTimes <= 10 ? 10 : 20}`, `Prize by position · ${nTimes <= 10 ? 10 : 20}-team league`)}</p>
          {!soLeitura && <button type="button" onClick={() => setEditando(e => !e)} className="border-2 border-black rounded-lg px-2 py-0.5 text-[11px]" style={{ ...OSW, background: GOLD, color: INK }}>{editando ? t('Pronto', 'Done') : t('✏️ Editar', '✏️ Edit')}</button>}
        </div>
        <p className="text-[11px] font-bold text-black/60 leading-snug">{t('Moedas que cada técnico ganha no fim da temporada, pela posição na tabela.', 'Coins each manager gets at the end of the season, by table position.')}</p>
        <div className="grid grid-cols-5 gap-1 mt-2">
          {valores.map((v, i) => (
            <div key={i} className="border-2 border-black rounded-md text-center py-0.5" style={{ background: i === 0 ? GOLD : '#F4ECD6' }}>
              <p className="text-[9px] font-black leading-none text-black/60" style={OSW}>{i + 1}º</p>
              {editando
                ? <input type="number" inputMode="numeric" min={0} max={999} value={v}
                    onChange={e => { const n = [...valores]; n[i] = Math.max(0, Math.min(999, Math.floor(Number(e.target.value) || 0))); onPremios(n.every((x, k) => x === padrao[k]) ? null : n) }}
                    className="w-full text-center text-[13px] font-black bg-white border-t border-black/20" style={OSW} />
                : <p className="text-[13px] leading-tight" style={{ ...OSW, color: INK }}>{v}</p>}
            </div>
          ))}
        </div>
        {premios && !soLeitura && <button type="button" onClick={() => onPremios(null)} className="mt-1.5 text-[11px] font-black underline" style={{ color: INK }}>{t('↩️ Voltar ao padrão', '↩️ Back to default')}</button>}
      </div>
    </div>
  )
}
