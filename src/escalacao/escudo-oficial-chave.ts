// 🇧🇷 A chave "escudo oficial ligado" (Brasil Oficial) mora num .ts sem imagem: o store liga/desliga daqui
// sem puxar o `escudos.tsx` (que importa os .webp) — senão nenhum teste que abre o store roda no Node.
let ligado = false
export function ligaEscudosOficiais(v: boolean) { ligado = v }
export function escudosOficiaisLigados() { return ligado }
