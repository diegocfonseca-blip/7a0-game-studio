// Carreira online: fila por carreira/aparelho. Uma gravação por vez; só confirma depois da resposta.
// Não cria relógio de mensagens: reenvia apenas uma alteração pendente que falhou.
export class Co2Fila<T> {
  private atual?: { chave: string; dados: T }
  private salva = ''
  private timer?: ReturnType<typeof setTimeout>
  private enviando?: Promise<boolean>
  private fechada = false
  private falhas = 0
  private envia: (dados: T) => Promise<boolean>
  private erro: (falhou: boolean) => void
  private espera: number
  constructor(envia: (dados: T) => Promise<boolean>, erro: (falhou: boolean) => void = () => {}, espera = 800) { this.envia = envia; this.erro = erro; this.espera = espera }
  atualiza(chave: string, dados: T): void {
    if (this.fechada || this.atual?.chave === chave) return
    this.atual = { chave, dados }
    if (this.timer) clearTimeout(this.timer)
    if (chave !== this.salva) this.timer = setTimeout(() => { this.timer = undefined; void this.confirma() }, this.espera)
  }
  async confirma(): Promise<boolean> {
    if (this.fechada) return false
    if (this.timer) { clearTimeout(this.timer); this.timer = undefined }
    if (this.enviando) { await this.enviando; return this.fechada ? false : this.atual?.chave === this.salva }
    this.enviando = this.grava()
    try { return await this.enviando } finally { this.enviando = undefined }
  }
  private async grava(): Promise<boolean> {
    while (!this.fechada && this.atual && this.atual.chave !== this.salva) {
      const tentativa = this.atual
      let ok = false
      try { ok = await this.envia(tentativa.dados) } catch { /* a pendência continua na fila */ }
      if (this.fechada || !this.atual) return false
      if (!ok) {
        this.erro(true)
        const demora = Math.min(30_000, 2000 * 2 ** Math.min(this.falhas++, 4))
        this.timer = setTimeout(() => { this.timer = undefined; void this.confirma() }, demora)
        return false
      }
      this.salva = tentativa.chave
      this.falhas = 0
      this.erro(false)
    }
    return !this.fechada
  }
  limpa(): void { this.atual = undefined; this.falhas = 0; this.erro(false); if (this.timer) { clearTimeout(this.timer); this.timer = undefined } }
  fecha(): void { this.fechada = true; if (this.timer) clearTimeout(this.timer) }
}

/** Travar uma tentativa só enquanto está em andamento ou depois do sucesso; falha permite tentar de novo. */
export class Co2Tentativas {
  private feitas = new Set<string>()
  private pendentes = new Map<string, Promise<boolean>>()
  private falhas = new Map<string, { vezes: number; depois: number }>()
  faz(chave: string, tarefa: () => Promise<boolean>): Promise<boolean> {
    if (this.feitas.has(chave)) return Promise.resolve(true)
    const pendente = this.pendentes.get(chave)
    if (pendente) return pendente
    if ((this.falhas.get(chave)?.depois ?? 0) > Date.now()) return Promise.resolve(false)
    const executa = async () => {
      try {
        const ok = await tarefa()
        if (ok) {
          this.feitas.add(chave); this.falhas.delete(chave)
          if (this.feitas.size > 512) this.feitas.delete(this.feitas.values().next().value!)
        } else this.falhou(chave)
        return ok
      } catch { this.falhou(chave); return false } finally { this.pendentes.delete(chave) }
    }
    const p = Promise.resolve().then(executa)
    this.pendentes.set(chave, p)
    return p
  }
  private falhou(chave: string): void {
    const vezes = (this.falhas.get(chave)?.vezes ?? 0) + 1
    this.falhas.set(chave, { vezes, depois: Date.now() + Math.min(30_000, 2000 * 2 ** Math.min(vezes - 1, 4)) })
  }
}

/** Progresso da MESMA carreira; a data desempata alterações na mesma rodada. Não usa o relógio do PC para regredir uma temporada. */
export function co2CopiaRecente<T extends { seasonNo?: number; round: number }>(local: { state: T; at: number } | null, nuvem: { state: T; at: number } | null): T | null {
  if (!local) return nuvem?.state ?? null
  if (!nuvem) return local.state
  const a = local.state, b = nuvem.state
  if ((a.seasonNo ?? 1) !== (b.seasonNo ?? 1)) return (a.seasonNo ?? 1) > (b.seasonNo ?? 1) ? a : b
  if (a.round !== b.round) return a.round > b.round ? a : b
  return local.at > nuvem.at ? a : b
}
