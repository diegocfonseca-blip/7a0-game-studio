// ✉️ E-MAIL DE CONTA NOVA (30/10, Diego: "recusar na hora do cadastro e-mails falsos, por exemplo gmail.comxy, o
// Gmail escrito com N, enfim"). Vale SÓ no "Criar conta" — login e "esqueci a senha" não passam por aqui, então
// quem já tem conta não muda nada. Medido no banco em 30/10: a turma das várias contas usava `fulano@gmail.comxyz`,
// `@gmail.vom`, `@gmahd.com`, `@vggmail.com` — tudo isso passava pelo `emailProblema` (só olhava erro de digitação
// conhecido). Puro e sem banco: a trava é `npm run email-novo`.

// provedores grandes: o domínio CERTO de cada um. Domínio parecido com eles (que contém o nome ou erra 1–2 letras)
// e que não está aqui = erro de digitação ou inventado.
const GRANDES: Record<string, string[]> = {
  gmail: ['gmail.com', 'googlemail.com'],
  hotmail: ['hotmail.com', 'hotmail.com.br'],
  outlook: ['outlook.com', 'outlook.com.br'],
  yahoo: ['yahoo.com', 'yahoo.com.br'],
  icloud: ['icloud.com'],
  live: ['live.com'],
}
const CERTOS = new Set(Object.values(GRANDES).flat().concat(['msn.com', 'me.com', 'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'proton.me', 'protonmail.com',
  'mail.com', 'email.com', 'ymail.com', 'rocketmail.com', 'gmx.com', 'zoho.com', 'aol.com']))

// final do domínio que existe de verdade: os comuns + qualquer país de 2 letras (.br, .pt, .ar…)
const FINAIS = new Set(['com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'io', 'app', 'dev', 'me', 'co',
  'online', 'site', 'tech', 'store', 'shop', 'club', 'xyz', 'live', 'email', 'digital', 'cloud', 'pro', 'art', 'blog', 'school', 'academy'])

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

/** null = e-mail ok pra conta nova; senão, a mensagem (PT/EN) pra mostrar embaixo do campo */
export function emailNovoProblema(email: string, tr: (pt: string, en: string) => string): string | null {
  const em = email.trim().toLowerCase()
  const [nome, dom, ...resto] = em.split('@')
  if (resto.length || !nome || !dom) return null // formato quebrado: o emailProblema já explica
  if (CERTOS.has(dom)) return null
  const rotulos = dom.split('.')
  const fim = rotulos[rotulos.length - 1]
  // 1) parecido com Gmail/Hotmail/… mas não é o certo (gmail.comxyz, vggmail.com, gmahd.com, gnail.com.br)
  const base = rotulos[0]
  // erro de 1–2 letras só conta em domínio com cara de provedor (`gmial.com`, `gnail.com.br`) — `mail.fae.edu` é faculdade
  const pareceProvedor = rotulos.length === 2 || (rotulos.length === 3 && rotulos[2] === 'br')
  for (const [marca, certos] of Object.entries(GRANDES)) {
    // marca curta (live) só pelo nome exato no começo — "olivetti", "alive" e "line" são outra coisa
    // o próprio provedor em outro país (outlook.ie, hotmail.co.uk, yahoo.com.ar) é de verdade — Gmail e iCloud não têm
    if (base === marca && marca !== 'gmail' && marca !== 'icloud' && /^(com?\.)?[a-z]{2}$/.test(rotulos.slice(1).join('.'))) return null
    // até 2 letras erradas se começa igual (gmahd, icould); senão só 1 (mozmail não é hotmail)
    const erro = distancia(base, marca) <= (base[0] === marca[0] ? 2 : 1)
    const parece = marca.length >= 5 ? (dom.includes(marca) || (pareceProvedor && erro)) : base === marca
    if (parece) return tr(
      `Confere o final do e-mail: @${dom} não existe. Não seria @${certos[0]}? 🧐`,
      `Check the end of your e-mail: @${dom} doesn't exist. Did you mean @${certos[0]}? 🧐`)
  }
  // 2) final que não existe (.vom, .comjjhujj, .c0m). Final novo de verdade (.football, .email) passa.
  const finalTorto = !/^[a-z]{2,}$/.test(fim) || (fim.startsWith('com') && fim !== 'com')
    || (!FINAIS.has(fim) && fim.length === 3 && distancia(fim, 'com') <= 2 && /^[cv]|m$/.test(fim))
  if (finalTorto) return tr(
    `O final do e-mail (.${fim}) não existe. Confere se é .com ou .com.br.`,
    `The end of your e-mail (.${fim}) doesn't exist. Check if it's .com.`)
  return null
}
