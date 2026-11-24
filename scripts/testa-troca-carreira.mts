// Desde 24/11 a troca é assíncrona, no IndexedDB comprimido. A bancada real preserva
// o caso original da T378, várias carreiras, aparelho cheio, conflitos e migração.
// O teste anterior dependia das cópias duplicadas no localStorage, que foram retiradas.
await import('./teste-salvamento/rodar.mjs')
