// 📉 30/10 (aliviar o banco, OK do Diego): o login do Supabase avisa "entrou" TODA vez que a pessoa volta pro jogo
// (saiu pro WhatsApp e voltou). Cada aviso fazia o jogo perguntar de novo ao banco quem ela é — plano, cor, manto…
// Agora cada pergunta só se repete quando a CONTA muda (entrou, saiu, trocou). Abrir/atualizar a página pergunta tudo
// de novo, como sempre.
// 💳 EXCEÇÃO: quem apertou pra PAGAR (Vendria, Pix) volta com o plano na hora — por 30 min depois do toque, toda volta
// pro jogo relê tudo, igual era antes. Desistiu de pagar? O banco responde "continua igual" e nada muda.
const vistos = new Map<string, string>()
let pagandoAte = 0
export function foiPagar(): void { pagandoAte = Date.now() + 30 * 60_000 }
export function pagando(): boolean { return Date.now() < pagandoAte }
/** true = precisa reler do banco (conta nova, ou a pessoa foi pagar). `tag` separa cada pergunta. */
export function releConta(tag: string, conta: string | null | undefined): boolean {
  const k = conta ?? ''
  if (pagando()) { vistos.set(tag, k); return true }
  if (vistos.get(tag) === k) return false
  vistos.set(tag, k)
  return true
}
