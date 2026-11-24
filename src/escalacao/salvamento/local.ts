import type { EscState } from '../types'
import { decode, type Encoded } from './codec'
export type Summary = { seed: number; revision: number; savedAt: string; seasonNo: number; round: number; teamName: string; official: boolean; sport: string; fingerprint: string; division?: string; coins?: number }
export type Meta = { key: string; uid: string; seed: number; at: number; summary: Summary; base: number | null; baseDigest?: string; digest: string; dirty: boolean; checkpointAt?: number; checkpointRevision?: number | null; volatile?: boolean; diskDigest?: string; diskBase?: number | null }
export type Stored = Encoded & { key: string; uid: string; seed: number; at: number }
let connection: Promise<IDBDatabase> | null = null
function db() {
  return connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('ll-careiras-v2', 1)
    r.onupgradeneeded = () => { for (const name of ['meta', 'data', 'profiles']) { const s = r.result.createObjectStore(name, { keyPath: 'key' }); if (name !== 'profiles') s.createIndex('uid', 'uid') } }
    r.onsuccess = () => { r.result.onversionchange = () => { r.result.close(); connection = null }; resolve(r.result) }
    r.onerror = () => { connection = null; reject(r.error) }
    r.onblocked = () => { connection = null; reject(new Error('storage_blocked')) }
  })
}
export const keyOf = (uid: string, seed: number) => `${uid}:${seed}`
async function transact<T>(stores: string[], mode: IDBTransactionMode, run: (tx: IDBTransaction, set: (v: T) => void) => void): Promise<T> {
  const conn = await db()
  return new Promise<T>((resolve, reject) => {
    const tx = conn.transaction(stores, mode); let value: T
    tx.oncomplete = () => resolve(value)
    tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('storage'))
    try { run(tx, v => { value = v }) } catch (e) { tx.abort(); reject(e) }
  })
}
export function metas(uid: string) { return transact<Meta[]>(['meta'], 'readonly', (t, set) => { const r = t.objectStore('meta').index('uid').getAll(uid); r.onsuccess = () => set(r.result) }) }
export function profile(uid: string) { return transact<{ active?: number; freePolicyAt?: number; rights?: { paid: boolean; slots: number; versions: number } } | undefined>(['profiles'], 'readonly', (t, set) => { const r = t.objectStore('profiles').get(uid); r.onsuccess = () => set(r.result) }) }
function attempt(t: IDBTransaction, f: () => void) { try { f() } catch { t.abort() } }
function patchProfile(t: IDBTransaction, uid: string, patch: Record<string, unknown>) {
  const store = t.objectStore('profiles'), r = store.get(uid)
  r.onsuccess = () => attempt(t, () => { store.put({ ...r.result, key: uid, ...patch }) })
}
export function setActive(uid: string, active?: number) { return transact<void>(['profiles'], 'readwrite', t => patchProfile(t,uid,{active})) }
export function setPolicyAt(uid: string, freePolicyAt: number) { return transact<void>(['profiles'],'readwrite',t=>patchProfile(t,uid,{freePolicyAt})) }
export function setRights(uid: string, rights: unknown) { return transact<void>(['profiles'], 'readwrite', t => patchProfile(t,uid,{rights})) }
export class LocalConflict extends Error { constructor() { super('local_conflict'); this.name='LocalConflict' } }
export async function put(meta: Meta, encoded: Encoded, checkpoint = false, backup = false, expected?: Pick<Meta,'digest'|'base'> | null, preserved?: Encoded) {
  const ok = await transact<boolean>(['meta', 'data', 'profiles'], 'readwrite', (t,set) => {
    const data = t.objectStore('data'), metas = t.objectStore('meta'), key = keyOf(meta.uid, meta.seed)
    const entry = { ...encoded, uid: meta.uid, seed: meta.seed, at: meta.at }
    const existing = metas.get(key)
    existing.onsuccess = () => attempt(t, () => {
      const current = existing.result as Meta | undefined
      if (expected !== undefined && (current && (!expected || current.digest !== expected.digest || current.base !== expected.base) || !current && !!expected)) {
        // Outra aba avançou. Guarda o que tentou entrar sem tocar no avanço dela.
        data.put({ ...entry, key: `${key}:pending` }); set(false); return
      }
      if (backup && preserved) data.put({...preserved,uid:meta.uid,seed:meta.seed,at:meta.at,key:`${key}:recovery`})
      else if (backup) {
        const r = data.get(`${key}:draft`)
        r.onsuccess = () => attempt(t, () => { if (r.result) data.put({ ...r.result, key: `${key}:recovery` }) })
      }
      data.put({ ...entry, key: `${key}:draft` })
      if (checkpoint) data.put({ ...entry, key: `${key}:checkpoint` })
      metas.put(meta); patchProfile(t,meta.uid,{active:meta.seed}); set(true)
    })
  })
  if (!ok) throw new LocalConflict()
}
export async function readWithAt(uid: string, seed: number, kind = 'draft'): Promise<{save:EscState;at:number} | null> {
  const r = await transact<Stored | undefined>(['data'], 'readonly', (t, set) => { const q = t.objectStore('data').get(`${keyOf(uid, seed)}:${kind}`); q.onsuccess = () => set(q.result) })
  return r ? {save:await decode(r),at:r.at} : null
}
export async function read(uid: string, seed: number, kind = 'draft'): Promise<EscState | null> { return (await readWithAt(uid,seed,kind))?.save ?? null }
export function remove(uid: string, seed: number) {
  return transact<void>(['meta', 'data'], 'readwrite', t => {
    const key = keyOf(uid, seed); t.objectStore('meta').delete(key)
    for (const kind of ['draft', 'checkpoint', 'recovery', 'pending']) t.objectStore('data').delete(`${key}:${kind}`)
  })
}

export function preserve(uid: string, seed: number, encoded: Encoded, at = Date.now()) {
  return transact<void>(['data'], 'readwrite', t => { t.objectStore('data').put({ ...encoded, uid, seed, at, key: `${keyOf(uid,seed)}:recovery` }) })
}
