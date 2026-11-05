// 📜💰 CONFIGURAÇÃO DA LIGA DRAFT (05/11, Diego): regras da turma pro draft + prêmio por colocação editável.
// Aparece na hora de CRIAR a Liga Draft e na sala de espera (só o dono mexe). O padrão do prêmio sai do tamanho da liga (10 ou
// 20 times); o dono pode trocar qualquer valor. As regras valem pra escolha do draft de todo mundo (a mesma função no motor e na
// tela: `cartaPermitidaDraft`).
import { useState } from 'react'
import { useT } from './lang'
import { premiosPadraoDraft, type RegrasDraft } from './liga-draft'

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW = { fontFamily: 'Oswald, sans-serif', fontWeight: 800 } as const
const INSTA = 'https://instagram.com/leilaolegendscom'

export function ConfigLigaDraft({ regras, premios, nTimes, onRegras, onPremios, soLeitura = false }: {
  regras: RegrasDraft; premios: number[] | null; nTimes: number
  onRegras: (r: RegrasDraft) => void; onPremios: (p: number[] | null) => void; soLeitura?: boolean
}) {
  const t = useT()
  const [editando, setEditando] = useState(false)
  const padrao = premiosPadraoDraft(nTimes)
  const valores = padrao.map((v, i) => premios?.[i] ?? v)
  const opc: [keyof RegrasDraft, string][] = [
    ['semLendas', t('🚫 Sem Lendas', '🚫 No Legends')],
    ['semCraques', t('🚫 Sem Craque nem Lenda', '🚫 No Stars or Legends')],
    ['soBrasil', t('🇧🇷 Só clubes brasileiros', '🇧🇷 Brazilian clubs only')],
  ]
  const toggle = (k: keyof RegrasDraft) => {
    if (soLeitura) return
    const n = { ...regras, [k]: !regras[k] }
    if (k === 'semCraques' && n.semCraques) n.semLendas = false // "sem craque" já tira a lenda junto
    if (k === 'semLendas' && n.semLendas) n.semCraques = false
    onRegras(n)
  }
  return (
    <div className="space-y-2">
      <div className="rounded-xl border-2 border-black p-2.5 bg-white">
        <p className="text-[13px] uppercase" style={{ ...OSW, color: INK }}>📜 {t('Regras da turma no draft', 'Crew rules for the draft')}</p>
        <p className="text-[11px] font-bold text-black/60 leading-snug">{t('Opcional. Vale pra escolha do draft de todo mundo.', 'Optional. Applies to everyone’s draft pick.')}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {opc.map(([k, label]) => (
            <button key={k} type="button" disabled={soLeitura} onClick={() => toggle(k)}
              className="border-2 border-black rounded-lg px-2 py-1 text-[11.5px] font-black"
              style={{ ...OSW, background: regras[k] ? GREEN : '#fff', color: regras[k] ? '#fff' : INK, opacity: soLeitura && !regras[k] ? .45 : 1 }}>
              {regras[k] ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
        <p className="text-[10.5px] font-bold text-black/60 leading-snug mt-2">{t('Quer outra regra? Combinem entre vocês ou peçam pro Diego, criador do jogo, no ', 'Want another rule? Agree on it among yourselves or ask Diego, the game’s creator, on ')}<a href={INSTA} target="_blank" rel="noopener noreferrer" className="underline font-black" style={{ color: INK }}>Instagram</a>.</p>
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
