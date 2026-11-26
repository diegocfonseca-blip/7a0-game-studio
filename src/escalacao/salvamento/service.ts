import { supabase } from '../../lib/supabase'
import type { EscState } from '../types'
import { encode, type Encoded } from './codec'
import * as local from './local'
import type { Meta, Summary } from './local'
export type SaveResult = 'nuvem' | 'aparelho' | 'bloqueado' | 'sem_conta' | 'conflito' | 'falhou_local' | 'falhou'
type Rights = { paid: boolean; slots: number; versions: number }
type Manifest = { protocol: number; careers: Summary[]; deleted?: number[]; rights: Rights }
type ReadResult = { status: string; save: EscState; summary: Summary; versionAt: string; version: number }
type WriteResult = { status: string; summary?: Summary; current?: Summary }
export type History = { revision: number; savedAt: string; seasonNo: number; round: number }
export type Conflict = { source?: 'device'; seed: number; local: { seasonNo: number; round: number; savedAt?: string }; cloud: Summary; choose: (c: 'cloud' | 'local' | 'cancel') => void }
let uid: string | null = null, epoch = 0, ready: Promise<void> | null = null
let meta = new Map<number, Meta>(), cloud = new Map<number, Summary>(), memory = new Map<number, EscState>()
let deleted = new Set<number>()
let freePolicyAt: number | null = null
export function inactivityDeadline(lastPlayed: number): number | null { return uid && freePolicyAt != null ? Math.max(lastPlayed,freePolicyAt)+5*86_400_000 : null }
let active: number | undefined, rights: Rights | null = null, checked = false, manifestAt = 0
let flight: Promise<boolean> | null = null
let replacementState: EscState | null = null
export const replacement = () => replacementState
export function clearReplacement() { replacementState = null }
let notice: Conflict | null = null
let failure = ''
const listeners = new Set<() => void>()
const bound = new WeakMap<object, string>()
const pending = new Map<number, { state: EscState; owner: string; generation: number; timer: ReturnType<typeof setTimeout> }>()
const sessionOnly=new Set<number>()
let queue = Promise.resolve()
const saving = new Set<string>()
const suspended = new Set<string>()
function emit() { listeners.forEach(f => f()) }
export const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
export const conflictNotice = () => notice
export const localFailure = () => failure
export const account = () => uid
export const cloudRights = () => rights
export const isDirty = (seed: number) => pending.has(seed) || meta.get(seed)?.dirty === true
export const cloudReceipt = (seed: number) => cloud.get(seed) ?? null
/** Metadata only: never downloads a payload or chooses between divergent copies. */
export function copies(seed: number) {
  const m=meta.get(seed),remote=cloud.get(seed)
  return { device:m?.summary, cloud:remote, checked, pending:isDirty(seed), sameRevision:!!m&&!!remote&&m.base===remote.revision }
}
export const initialized = () => !!ready
export function stateBound(st: EscState) { const owner = bound.get(st); return !owner || owner === uid }
export function bind(st: EscState) { if (uid) bound.set(st, uid); return st }
export function bindNext(previous: EscState, next: EscState) { const owner = bound.get(previous); if (owner && next.careerOnline && next.seed === previous.seed) bound.set(next, owner); else if (uid && next.careerOnline) bound.set(next, uid) }
function isCareer(s: unknown): s is EscState { const st = s as EscState; return !!st?.careerOnline && st.onlineMode !== 'online' && !st.co2 && st.sport !== 'basquete' && !!st.managers?.length }
function summary(st: EscState): Summary {
  const m = st.managers[st.youIdx ?? 0]
  return { seed: st.seed, revision: 0, savedAt: new Date().toISOString(), seasonNo: st.seasonNo ?? 1, round: st.round ?? 0, teamName: m?.teamName ?? m?.name ?? '', official: !!st.oficial, sport: 'futebol', fingerprint: '', division: st.careerPlacements?.['m'+(m?.id??0)] ?? st.careerDivision ?? undefined, coins: st.careerCoins?.[m?.id??0] ?? 0 }
}
export function summaries() {
  const seeds = new Set([...meta.keys(), ...cloud.keys(), ...memory.keys()].filter(seed=>!deleted.has(seed)))
  return [...seeds].map(seed => {
    const m = meta.get(seed), remote = cloud.get(seed)
    const s = sessionOnly.has(seed) && memory.has(seed) ? summary(memory.get(seed)!) : m && (!remote || m.dirty || m.base === remote.revision) ? m.summary : remote ?? summary(memory.get(seed)!)
    // Esta representação serve só à listagem. Nunca é despachada ao motor.
    const useMemory = sessionOnly.has(seed) || !remote || !m || m.dirty || m.base === remote.revision
    const st = (useMemory ? memory.get(seed) : null) ?? ({ seed, careerOnline: true, onlineMode: 'cpu', sport: 'futebol', seasonNo: s.seasonNo, round: s.round, careerDivision: s.division, careerCoins:{0:s.coins??0}, youIdx: 0, managers: [{ id: 0, name: s.teamName, teamName: s.teamName, squad: [] }] } as unknown as EscState)
    return { slot: { save: st, at: s === remote ? Date.parse(s.savedAt) : m?.at ?? Date.parse(s.savedAt) }, active: seed === active }
  }).sort((a, b) => b.slot.at - a.slot.at)
}
export function activeSummary() { return summaries().find(x => x.active)?.slot ?? summaries()[0]?.slot ?? null }
export function cached(seed: number) { return memory.get(seed) ?? null }

// A transação confirma a cópia ANTES de retirar qualquer chave legada. Se faltar espaço, o original fica.
async function migrate(owner: string, generation: number) {
  const ownerKey = 'esc-career-owner', vaultPrefix = 'esc-career-vault::'
  const previous = localStorage.getItem(ownerKey)
  const source = previous && previous !== owner ? `${vaultPrefix}${owner}` : null
  const rawVault = source ? localStorage.getItem(source) : null
  const vault: Record<string, string | null> = rawVault ? JSON.parse(rawVault) : {}
  const keys = ['esc-solo-career', 'esc-solo-career-at', 'esc-career-archive', 'esc-solo-inprogress-v1']
  const values = Object.fromEntries(keys.map(k => [k, source ? vault[k] ?? null : localStorage.getItem(k)]))
  const slots: { save: EscState; at: number }[] = []
  const add = (raw: string | null, at: number) => { if (raw) { const s = JSON.parse(raw); if (isCareer(s)) slots.push({ save: s, at }) } }
  const at = Number(values['esc-solo-career-at']) || Date.now()
  if (values['esc-career-archive']) { const a = JSON.parse(values['esc-career-archive']!); if (Array.isArray(a)) slots.push(...a.filter(x => isCareer(x?.save))) }
  add(values['esc-solo-career'], at)
  add(values['esc-solo-inprogress-v1'], at + 1)
  const bySeed = new Map<number, { save: EscState; at: number }[]>()
  for (const slot of slots) bySeed.set(slot.save.seed, [...(bySeed.get(slot.save.seed) ?? []), slot])
  for (const [seed, candidates] of bySeed) {
    const existing = meta.get(seed)
    if (existing) {
      // Uma aba antiga pode ter escrito no legado durante a transição.
      for (const c of candidates) { const e = await encode(c.save); if (e.digest !== existing.digest) await local.preserve(owner,seed,e,c.at) }
      continue
    }
    // Só na importação local: o resume velho não pode substituir uma rodada mais avançada.
    // Divergências permanecem em recuperação; isso nunca autoriza sobrescrever a nuvem.
    candidates.sort((a,b) => (a.save.seasonNo ?? 0)-(b.save.seasonNo ?? 0) || (a.save.round ?? 0)-(b.save.round ?? 0) || a.at-b.at)
    const chosen = candidates[candidates.length-1]
    const primary = await encode(chosen.save)
    const m: Meta = { key: local.keyOf(owner, seed), uid: owner, seed, at: chosen.at, summary: summary(chosen.save), base: null, digest: primary.digest, dirty: true }
    const other = candidates.length>1 ? candidates[candidates.length-2] : null
    if (other) { const e = await encode(other.save); if (e.digest !== primary.digest) await local.put({ ...m, summary: summary(other.save), digest:e.digest }, e) }
    await local.put(m, primary, false, !!other)
    if (generation !== epoch || owner !== uid) return
    meta.set(seed, m)
  }
  if (generation !== epoch || owner !== uid) return
  if (source) { if (localStorage.getItem(source) === rawVault) localStorage.removeItem(source) }
  else {
    // Só remove saves reconhecidos, nunca a partida rápida ou do basquete.
    for (const k of keys) { if (k === 'esc-solo-inprogress-v1' && values[k] && !isCareer(JSON.parse(values[k]!))) continue; if (localStorage.getItem(k) === values[k]) localStorage.removeItem(k) }
    localStorage.setItem(ownerKey, owner)
  }
}
export function changeAccount(next: string | null) {
  if (uid === next && ready) return ready
  uid = next; const generation = ++epoch
  for (const p of pending.values()) clearTimeout(p.timer)
  pending.clear(); sessionOnly.clear(); notice?.choose('cancel'); notice = null; replacementState = null
  meta = new Map(); cloud = new Map(); memory = new Map(); deleted = new Set(); active = undefined; freePolicyAt = null; rights = null; checked = false; manifestAt = 0; flight = null; failure = ''
  emit()
  if (!next) { ready = null; return Promise.resolve() }
  ready = (async () => {
    try {
      const [list, p] = await Promise.all([local.metas(next), local.profile(next)])
      if (generation !== epoch) return
      meta = new Map(list.map(m => [m.seed, m])); active = p?.active; rights = p?.rights ?? null
      const policyAt=p?.freePolicyAt??Date.now()
      if(p?.freePolicyAt==null) await local.setPolicyAt(next,policyAt)
      if(generation!==epoch) return
      freePolicyAt=policyAt
      await migrate(next, generation)
      if (generation !== epoch) return
      if (active == null) active = [...meta.values()].sort((a, b) => b.at - a.at)[0]?.seed
    } catch { if (generation === epoch) failure = 'storage' }
    if (generation === epoch) emit()
  })()
  return ready
}
export async function sync(fresh = false): Promise<boolean> {
  const owner = uid, generation = epoch
  if (!owner) return false
  await ready
  if (flight) return flight
  if (!fresh && Date.now() - manifestAt < 15_000) return true
  const job = (async () => {
    try {
      const { data, error } = await supabase.rpc('esc_carreiras_manifesto_v2', { p_owner:owner })
      if (error || (data as Manifest)?.protocol !== 2) return false
      if (owner !== uid || generation !== epoch) return false
      const m = data as Manifest
      cloud = new Map(m.careers.map(s => [s.seed, s])); deleted = new Set(m.deleted??[]); rights = m.rights; checked = true; manifestAt = Date.now()
      if (active == null) active = m.careers[0]?.seed
      await local.setRights(owner,m.rights).catch(() => {})
      if (generation !== epoch) return false
      emit(); return true
    } catch { return false }
  })()
  flight = job
  try { return await job } finally { if (flight === job) flight = null }
}
async function readCloud(seed: number, revision?: number, owner = uid) {
  const { data, error } = await supabase.rpc('esc_carreira_ler_v2', { p_owner:owner, p_seed: seed, p_revision: revision ?? null })
  if (error) throw error
  const r = data as ReadResult
  if (r?.status !== 'ok') return null
  if (owner) bound.set(r.save,owner)
  return r
}
async function persist(st: EscState, checkpoint = false, base?: number | null, baseDigest?: string, backup = false, encoded?: Encoded, preserved?:Encoded) {
  const owner = uid, generation = epoch
  if (!owner || !stateBound(st)) throw new Error('account')
  const old = meta.get(st.seed), e = encoded ?? await encode(st)
  if (generation !== epoch) throw new Error('account')
  const revision = base === undefined ? old?.base ?? null : base
  const digest = baseDigest ?? old?.baseDigest
  const m: Meta = { key: local.keyOf(owner, st.seed), uid: owner, seed: st.seed, at: Date.now(), summary: summary(st), base: revision, baseDigest: digest, digest: e.digest, dirty: digest !== e.digest, checkpointAt: checkpoint ? Date.now() : old?.checkpointAt, checkpointRevision: checkpoint ? revision : old?.checkpointRevision }
  const expected = old?.volatile ? old.diskDigest ? {digest:old.diskDigest,base:old.diskBase??null} : null : old ? {digest:old.digest,base:old.base} : null
  await local.put(m, e, checkpoint, backup, expected, preserved)
  if (generation !== epoch) throw new Error('account')
  meta.set(st.seed, m); memory.set(st.seed, bind(st)); active = st.seed; failure = ''; emit()
  return e
}
export function rememberSession(st: EscState) { if(!uid||!stateBound(st))return; memory.set(st.seed,bind(st));active=st.seed;sessionOnly.add(st.seed);emit() }
export function schedule(st: EscState) {
  if (!uid || !isCareer(st) || !stateBound(st) || deleted.has(st.seed) || suspended.has(local.keyOf(uid,st.seed))) return
  bind(st); memory.set(st.seed, st); active = st.seed; sessionOnly.delete(st.seed)
  const old = pending.get(st.seed); if (old) { old.state = st; return }
  const p = { state: st, owner: uid, generation: epoch, timer: setTimeout(() => { void flush(st.seed) }, 1500) }
  pending.set(st.seed, p)
}
export async function flush(seed?: number) {
  const work = [...pending.entries()].filter(([s, p]) => (seed == null || seed === s) && !saving.has(local.keyOf(p.owner,s)))
  for (const [s, p] of work) {
    clearTimeout(p.timer); pending.delete(s)
    queue = queue.then(async () => {
      if (p.owner !== uid || p.generation !== epoch) return
      try { await ready; await persist(p.state) } catch (e) { if (p.generation === epoch) { failure = e instanceof local.LocalConflict ? 'conflict' : 'storage'; if (failure === 'conflict') suspended.add(local.keyOf(p.owner,s)); emit() } }
    })
  }
  await queue
}
async function decide(st: EscState, remote: ReadResult, source?: 'device'): Promise<'cloud' | 'local' | 'cancel'> {
  if (notice) return 'cancel'
  return new Promise(resolve => {
    notice = { source, seed: st.seed, local: { seasonNo: st.seasonNo ?? 1, round: st.round ?? 0, savedAt:meta.get(st.seed)?.summary.savedAt }, cloud: remote.summary,
      choose: c => { notice = null; emit(); resolve(c) } }; emit()
  })
}
export async function prepare(seed: number): Promise<EscState | null> {
  const owner = uid, generation = epoch
  if (!owner) return null
  suspended.delete(local.keyOf(owner,seed))
  await ready; await flush(); await sync(true)
  if (generation !== epoch || deleted.has(seed)) return null
  let st = memory.get(seed) ?? await local.read(owner, seed)
  if (generation !== epoch) return null
  const m = meta.get(seed), r = cloud.get(seed)
  if (r && (!m || m.base !== r.revision)) {
    const remote = await readCloud(seed,undefined,owner)
    if (!remote || generation !== epoch) return null
    const enc = await encode(remote.save)
    const localEnc = st ? await encode(st) : null
    const diverged = !!st && localEnc?.digest !== enc.digest && (!m || m.dirty || m.base === null)
    if (diverged) {
      const choice = await decide(st!, remote)
      if (generation !== epoch || choice === 'cancel') return null
      if (choice === 'local') {
        // A escolha é explícita. A nuvem só muda num próximo toque em Salvar.
        await persist(st!, false, remote.summary.revision, enc.digest, true)
      } else { await persist(remote.save, true, remote.summary.revision, enc.digest, true, enc, localEnc??undefined); st = remote.save }
    } else {
      st = remote.save
      try { await persist(st, true, remote.summary.revision, enc.digest, !!m, enc) } catch { failure = 'storage'; memory.set(seed, bind(st)); meta.set(seed, { key: local.keyOf(owner, seed), uid:owner, seed, at:Date.parse(remote.summary.savedAt), summary:remote.summary, base:remote.summary.revision, baseDigest:enc.digest, digest:enc.digest, dirty:false, volatile:true, diskDigest:m?.volatile?m.diskDigest:m?.digest, diskBase:m?.volatile?m.diskBase:m?.base, checkpointAt:m?.checkpointAt, checkpointRevision:m?.checkpointRevision }); emit() }
    }
    cloud.set(seed, remote.summary)
  }
  if (!st || generation !== epoch) return null
  active = seed; memory.set(seed, bind(st)); await local.setActive(owner, seed).catch(() => { failure = 'storage'; emit() })
  return st
}
async function writeRequest(name: string, args: Record<string,unknown>, generation: number): Promise<WriteResult|null> {
  for (let i=0;i<3;i++) {
    if (generation!==epoch) return null
    try { const {data,error}=await supabase.rpc(name,args); if(!error&&data)return data as WriteResult } catch { /* repetir o mesmo pedido */ }
    if(i<2)await new Promise(ok=>setTimeout(ok,800*(i+1)))
  }
  return null
}
export async function save(st: EscState): Promise<SaveResult> {
  const key = uid ? local.keyOf(uid,st.seed) : ''
  if (saving.has(key)) return 'falhou'
  await flush(st.seed)
  saving.add(key)
  try { return await saveNow(st) } finally { saving.delete(key); await flush(st.seed) }
}
async function saveNow(st: EscState): Promise<SaveResult> {
  if (!uid) return 'sem_conta'
  if (!stateBound(st) || !isCareer(st)) return 'falhou'
  const owner = uid, generation = epoch
  await ready; await flush(st.seed)
  let encoded: Encoded
  try { encoded = await encode(st) } catch { return 'falhou_local' }
  if (owner !== uid || generation !== epoch) return 'sem_conta'
  const online = await sync(true)
  if (owner !== uid || generation !== epoch) return 'sem_conta'
  const localOnly = rights?.paid === false
  let localOK = true
  try { await persist(st, false, undefined, undefined, false, encoded) } catch (e) { if (e instanceof local.LocalConflict) return resolveLocal(st); localOK = false; failure = 'storage'; emit() }
  if (localOnly) {
    try { await persist(st, true, undefined, undefined, false, encoded); return 'aparelho' } catch { return 'falhou_local' }
  }
  if (!online || !checked) return 'falhou'
  let m = meta.get(st.seed)
  const remote = cloud.get(st.seed)
  if (remote && (m?.base == null || m.base !== remote.revision)) {
    // Não rebaseia uma aba ativa em silêncio. Salvar novamente só após a escolha.
    const r = await readCloud(st.seed,undefined,owner).catch(() => null)
    if (!r || generation !== epoch) return 'falhou'
    const enc = await encode(r.save)
    if (encoded.digest !== enc.digest) {
      const choice = await decide(st, r)
      if (generation !== epoch || choice === 'cancel') return 'conflito'
      try {
        if (choice === 'cloud') { await persist(r.save, true, r.summary.revision, enc.digest, true, enc, encoded); replacementState = bind(r.save); emit(); return 'conflito' }
        await persist(st, false, r.summary.revision, enc.digest, true, encoded)
        return 'conflito'
      } catch { return 'falhou_local' }
    } else {
      try { await persist(st, true, r.summary.revision, enc.digest, false, encoded) } catch { /* a confirmação remota ainda vale */ }
    }
    m = meta.get(st.seed)
  }
  const request = crypto.randomUUID(), expected = m?.base ?? 0
  const result = await writeRequest('esc_carreira_salvar_v2', {p_owner:owner,p_seed:st.seed,p_save:st,p_expected:expected,p_request:request},generation)
  if (generation !== epoch) return 'sem_conta'
  if (result?.status === 'conflict' || result?.status === 'deleted') { await sync(true); return 'conflito' }
  if (result?.status === 'plan_required' || result?.status === 'slots_full') return 'bloqueado'
  if (result?.status === 'local_only') {
    try { await persist(st, true, undefined, undefined, false, encoded); return 'aparelho' } catch { return 'falhou_local' }
  }
  if (result?.status !== 'saved' || !result.summary) return 'falhou'
  const s = result.summary
  cloud.set(st.seed, s)
  try { await persist(st, true, s.revision, encoded.digest, false, encoded); localOK = true } catch { failure = 'storage'; const old=meta.get(st.seed); meta.set(st.seed,{ key:local.keyOf(owner,st.seed), uid:owner, seed:st.seed, at:Date.parse(s.savedAt), summary:s, base:s.revision, baseDigest:encoded.digest, digest:encoded.digest, dirty:false, checkpointAt:old?.checkpointAt, checkpointRevision:old?.checkpointRevision, volatile:true, diskDigest:old?.volatile?old.diskDigest:old?.digest, diskBase:old?.volatile?old.diskBase:old?.base }); emit() }
  // Recibo só após o servidor confirmar; nunca inventa carimbo com o relógio do aparelho.
  try { localStorage.setItem(`esc-nuvem-subiu:${owner}:${st.seed}`, JSON.stringify({ at: Date.parse(s.savedAt), seasonNo: s.seasonNo, round: s.round })) } catch { /* confirmação permanece na sessão */ }
  if (!localOK) { memory.set(st.seed, bind(st)); emit() }
  return 'nuvem'
}
async function resolveLocal(st: EscState): Promise<SaveResult> {
  const owner=uid, generation=epoch
  if (!owner) return 'sem_conta'
  const current=(await local.metas(owner)).find(m=>m.seed===st.seed), other=await local.read(owner,st.seed)
  if (!current || !other || generation!==epoch) return 'conflito'
  const c=await decide(st,{status:'ok',save:other,summary:current.summary,versionAt:current.summary.savedAt,version:current.base??0},'device')
  if (c==='cancel' || generation!==epoch) return 'conflito'
  meta.set(st.seed,current)
  const chosen=c==='local'?st:other
  try { await persist(chosen,false,undefined,undefined,c==='local'); suspended.delete(local.keyOf(owner,st.seed)); if(c==='cloud') replacementState=bind(chosen); emit() } catch { return 'falhou_local' }
  return 'conflito'
}
export async function rollback(seed: number): Promise<'voltou' | 'sem_salvo' | 'sem_rede'> {
  const owner = uid, generation = epoch
  if (!owner) return 'sem_salvo'
  const key = local.keyOf(owner,seed)
  suspended.add(key)
  let success = false
  try {
    await ready; await flush(seed)
    let st = await local.read(owner, seed, 'checkpoint').catch(() => null)
    const remote = cloud.get(seed), m = meta.get(seed)
    const localOnly = rights?.paid === false
    if (!st || !localOnly && remote && m?.checkpointRevision !== remote.revision) { try { st = (await readCloud(seed,undefined,owner))?.save ?? null } catch { return 'sem_rede' } }
    if (!st || generation !== epoch) return 'sem_salvo'
    await persist(st, false, undefined, undefined, false)
    success = true; return 'voltou'
  } catch { return 'sem_rede' }
  finally { if (!success) suspended.delete(key) }
}
export async function history(seed: number): Promise<History[]> {
  const owner = uid
  if (!owner) return []
  const recovery = await local.readWithAt(owner, seed, 'recovery').catch(() => null)
  const pendingCopy = await local.readWithAt(owner, seed, 'pending').catch(() => null)
  const { data, error } = await supabase.rpc('esc_carreira_historico_v2', { p_owner:owner, p_seed: seed })
  if (owner !== uid) throw new Error('account')
  const fallback: History[] = recovery ? [{ revision: -1, savedAt: new Date(recovery.at).toISOString(), seasonNo: recovery.save.seasonNo ?? 1, round: recovery.save.round ?? 0 }] : []
  if (pendingCopy) fallback.unshift({revision:-2,savedAt:new Date(pendingCopy.at).toISOString(),seasonNo:pendingCopy.save.seasonNo??1,round:pendingCopy.save.round??0})
  if (error && !fallback.length) throw new Error('network')
  return [...fallback, ...(Array.isArray(data) ? data as History[] : [])]
}
export async function restore(seed: number, revision: number): Promise<EscState | null> {
  const owner = uid, generation = epoch
  if (!owner) return null
  await ready; await flush()
  if (revision < 0) {
    const recovery = await local.read(owner, seed, revision===-2?'pending':'recovery')
    if (!recovery || generation !== epoch) return null
    await persist(recovery, false, undefined, undefined, true)
    return bind(recovery)
  }
  if (!await sync(true)) return null
  const current = cloud.get(seed)
  if (!current || generation !== epoch) return null
  const result = await writeRequest('esc_carreira_salvar_v2', { p_owner:owner, p_seed: seed, p_save: null, p_expected: current.revision, p_request: crypto.randomUUID(), p_restore: revision },generation)
  if (result?.status !== 'saved' || generation !== epoch) return null
  const r = await readCloud(seed,undefined,owner)
  if (!r || generation !== epoch) return null
  const e = await encode(r.save)
  await persist(r.save, true, r.summary.revision, e.digest, true, e)
  cloud.set(seed, r.summary); emit(); return bind(r.save)
}
export async function remove(seed: number, onlyIfFree=false) {
  const owner = uid, generation = epoch
  if (!owner) return false
  await ready; await flush(); const expected = cloud.get(seed)?.revision ?? meta.get(seed)?.base ?? 0
  if (!await sync(true)) return false
  if (generation !== epoch || onlyIfFree && rights?.paid !== false) return false
  const remote = cloud.get(seed)
  if (remote && remote.revision !== expected) return false
  if (remote) {
    const result = await writeRequest('esc_carreira_excluir_v2', { p_owner:owner, p_seed: seed, p_expected: remote.revision, p_request: crypto.randomUUID(), p_auto:onlyIfFree },generation)
    if (result?.status !== 'deleted' || generation !== epoch) return false
  }
  await local.remove(owner, seed)
  if (generation !== epoch) return false
  meta.delete(seed); cloud.delete(seed); memory.delete(seed); deleted.add(seed)
  if (active === seed) { active = summaries()[0]?.slot.save.seed; await local.setActive(owner, active) }
  emit(); return true
}
export async function beforeNew() {
  await ready; await flush()
  if (failure) return false
  active = undefined
  if (uid) await local.setActive(uid)
  return true
}
// Saída/local em segundo plano: nada de nuvem ou cópia JSON síncrona enorme.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('pagehide', () => { void flush() })
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) void flush() })
}
