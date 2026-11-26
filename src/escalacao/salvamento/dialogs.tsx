import { useEffect, useState } from 'react'
import { Box, Btn } from '../screens'
import { useEsc } from '../store'
import { useT } from '../lang'
import * as saves from './service'
export function SaveCopies({seed}:{seed:number}) {
  const t=useT(),c=saves.copies(seed)
  const progress=(s:{seasonNo:number;round:number})=>`${t('Temporada','Season')} ${s.seasonNo} · ${t('rodada','round')} ${s.round}`
  const style={display:'block',fontSize:10.5,fontWeight:700,color:'#4a4740',marginTop:4,lineHeight:1.4} as const
  return <div data-save-copies={seed}>
    {!c.checked?<span style={style}>{t('☁️ Nuvem ainda não conferida','☁️ Cloud not checked yet')}</span>
      : !c.cloud?<span style={style}>{t('📱 Só neste aparelho · use Salvar para enviar à nuvem com plano','📱 Only on this device · use Save to upload with a plan')}</span>
      : <><span style={style}>☁️ {t('Na nuvem','Cloud')}: {progress(c.cloud)} · {new Date(c.cloud.savedAt).toLocaleString()}</span>
        {c.device&&(c.pending||!c.sameRevision)&&<span style={{...style,color:'#8a5000'}}>📱 {t('Neste aparelho','This device')}: {progress(c.device)} · {t('cópias diferentes; confira ao continuar','different copies; check when continuing')}</span>}</>}
  </div>
}
export function SaveDialogs() {
  const { state, dispatch } = useEsc(), t = useT()
  const [, tick] = useState(0)
  useEffect(() => saves.subscribe(() => tick(n => n + 1)), [])
  useEffect(() => {
    const focus = () => { if (!document.hidden && state.careerOnline && !state.co2 && state.onlineMode !== 'online') void saves.sync(true) }
    window.addEventListener('focus', focus)
    return () => window.removeEventListener('focus', focus)
  }, [state.careerOnline, state.co2, state.onlineMode])
  const replacement = saves.replacement()
  useEffect(() => {
    if (replacement && state.seed === replacement.seed && state.careerOnline && state.onlineMode !== 'online' && !state.co2) {
      saves.clearReplacement()
      dispatch({ type: 'RESUME_CAREER_SOLO', saved: replacement })
    }
  }, [replacement, state.seed, state.careerOnline, state.onlineMode, state.co2, dispatch])
  useEffect(() => { if (state.careerOnline && !state.co2 && state.onlineMode !== 'online' && !saves.stateBound(state)) dispatch({ type: 'GO_LOBBY' }) }, [state, dispatch])
  const c = saves.conflictNotice()
  useEffect(() => {
    if (!c) return
    const before = document.activeElement as HTMLElement | null
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') c.choose('cancel') }
    const oldOverflow=document.body.style.overflow; document.body.style.overflow='hidden'
    const modal=document.querySelector<HTMLElement>('[aria-labelledby="save-conflict-title"]')
    modal?.querySelector<HTMLButtonElement>('button')?.focus()
    const trap=(e: KeyboardEvent)=>{ if(e.key!=='Tab'||!modal)return; const all=[...modal.querySelectorAll<HTMLButtonElement>('button:not([disabled])')]; const first=all[0],last=all[all.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()} }
    document.addEventListener('keydown', esc); document.addEventListener('keydown',trap)
    return () => { document.removeEventListener('keydown', esc); document.removeEventListener('keydown',trap); document.body.style.overflow=oldOverflow; before?.focus() }
  }, [c])
  if (!c) return null
  return <div style={{ position: 'fixed', inset: 0, zIndex: 100002, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div role="alertdialog" aria-modal="true" aria-labelledby="save-conflict-title" style={{ width: '100%', maxWidth: 440 }}>
      <Box bg="#F4ECD6" className="p-4" style={{ color: '#0C0C0C', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 id="save-conflict-title" className="text-xl font-black uppercase">{t('Dois avanços desta carreira', 'Two versions of this career')}</h2>
        <p className="text-sm my-3">{t('Há avanços diferentes desta carreira. As cópias serão preservadas. Qual você quer continuar?', 'There are different versions of this career. The copies will be kept. Which do you want to continue?')}</p>
        <p className="text-sm mb-2"><b>{c.source === 'device' ? t('Em outra aba deste aparelho','Another tab on this device') : t('Na nuvem', 'Cloud')}</b>: {t('temporada', 'season')} {c.cloud.seasonNo} · {t('rodada', 'round')} {c.cloud.round}<br /><span className="text-xs">{new Date(c.cloud.savedAt).toLocaleString()}</span></p>
        <p className="text-sm mb-4"><b>{t('Neste aparelho', 'This device')}</b>: {t('temporada', 'season')} {c.local.seasonNo} · {t('rodada', 'round')} {c.local.round}{c.local.savedAt&&<><br/><span className="text-xs">{new Date(c.local.savedAt).toLocaleString()}</span></>}</p>
        <div className="grid gap-3">
          <Btn onClick={() => c.choose('cloud')}>{c.source === 'device' ? t('Continuar do avanço da outra aba','Continue from the other tab') : t('Continuar da nuvem', 'Continue from cloud')}</Btn>
          <Btn onClick={() => c.choose('local')}>{t('Continuar deste aparelho', 'Continue from this device')}</Btn>
          <button onClick={() => c.choose('cancel')} className="text-sm underline py-2">{t('Cancelar e manter tudo', 'Cancel and keep everything')}</button>
        </div>
        <p className="text-xs mt-3">{t('Escolher este aparelho não altera a nuvem agora. Para enviar este avanço, toque em Salvar.', 'Choosing this device does not change the cloud now. To upload this progress, tap Save.')}</p>
        {c.local.seasonNo===c.cloud.seasonNo&&c.local.round===c.cloud.round&&<p className="text-xs mt-2">{t('A rodada é igual, mas outras escolhas da carreira estão diferentes. Nenhuma cópia será substituída sem sua escolha.','The round is the same, but other career choices differ. Neither copy will be replaced without your choice.')}</p>}
      </Box>
    </div>
  </div>
}
export function SaveHistory({ seed, onClose, onRestored }: { seed: number; onClose: () => void; onRestored: () => void }) {
  const t = useT(), [list, setList] = useState<saves.History[] | null>(null), [error, setError] = useState(false), [busy, setBusy] = useState(false), [selected, setSelected] = useState<number | null>(null)
  useEffect(() => { let alive = true; saves.history(seed).then(r => { if (alive) setList(r) }, () => { if (alive) setError(true) }); return () => { alive = false } }, [seed])
  return <div style={{ position: 'fixed', inset: 0, zIndex: 100001, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div role="dialog" aria-modal="true" aria-labelledby="save-history-title" style={{ width: '100%', maxWidth: 440 }}><Box bg="#F4ECD6" className="p-4" style={{ color: '#0C0C0C', maxHeight: '90vh', overflowY: 'auto' }}>
      <h2 id="save-history-title" className="text-xl font-black uppercase">{t('Salvamentos anteriores', 'Previous saves')}</h2>
      <p className="text-sm my-3">{t('O avanço atual fica guardado antes de recuperar outra cópia. A recuperação do aparelho só vai para a nuvem quando você salvar.', 'Current progress is kept before recovering another copy. Device recovery only goes to the cloud when you save.')}</p>
      {error ? <p role="alert">{t('Não foi possível confirmar a operação. Confira o histórico e tente novamente.', 'Could not confirm the operation. Check history and try again.')}</p> : list === null ? <p>{t('Carregando…', 'Loading…')}</p> : !list.length ? <p>{t('Ainda não há salvamentos anteriores.', 'No previous saves yet.')}</p> : list.map(v => <div key={v.revision} className="border-b border-black/20 py-3 text-sm">
        {v.revision < 0 && <p className="font-bold">{t('Cópia preservada neste aparelho', 'Copy preserved on this device')}</p>}<b>{t('Temporada', 'Season')} {v.seasonNo} · {t('rodada', 'round')} {v.round}</b><p className="text-xs mb-2">{new Date(v.savedAt).toLocaleString()}</p>
        {selected === v.revision ? <><p className="mb-2">{t('Voltar a este ponto? O avanço atual fica guardado.', 'Return to this point? Current progress will be kept.')}</p><Btn disabled={busy} onClick={async () => { setBusy(true); try { const st = await saves.restore(seed, v.revision); if (!st) throw new Error(); onRestored() } catch { setError(true) } finally { setBusy(false) } }}>{busy ? t('Restaurando…', 'Restoring…') : t('Confirmar restauração', 'Confirm restore')}</Btn></> : <button disabled={busy} className="font-bold underline" onClick={() => setSelected(v.revision)}>{t('Restaurar este save', 'Restore this save')}</button>}
      </div>)}
      <button disabled={busy} className="underline text-sm mt-4" onClick={onClose}>{t('Fechar', 'Close')}</button>
    </Box></div>
  </div>
}
