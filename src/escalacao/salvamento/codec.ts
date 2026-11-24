import type { EscState } from '../types'
export type Encoded = { blob: Blob; digest: string; gzip: boolean; rawBytes: number }
let worker: Worker | null = null
let next = 0
const jobs = new Map<number, { resolve: (r: unknown) => void; reject: (e: Error) => void }>()
function call<T>(op: string, data: Record<string, unknown>): Promise<T> {
  if (!worker) {
    worker = new Worker(new URL('./codec.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data: m }) => { const j = jobs.get(m.id); jobs.delete(m.id); if (m.error) j?.reject(new Error(m.error)); else j?.resolve(m.result) }
    worker.onerror = () => { for (const j of jobs.values()) j.reject(new Error('codec')); jobs.clear(); worker?.terminate(); worker = null }
  }
  return new Promise((resolve, reject) => { const id = ++next; jobs.set(id, { resolve: resolve as (r: unknown) => void, reject }); worker!.postMessage({ id, op, ...data }) })
}
export const encode = (save: EscState) => call<Encoded>('encode', { save })
export const decode = (data: Pick<Encoded, 'blob' | 'gzip'>) => call<EscState>('decode', data)
