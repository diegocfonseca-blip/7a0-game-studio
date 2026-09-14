// Escudos das associações, não bandeiras nem brasões gerados por nome.
const names: Record<string,string> = {"Brasil":"brazil","Argentina":"argentina","França":"france","Espanha":"spain","Inglaterra":"england","Itália":"italy","Alemanha":"germany","Holanda":"netherlands","Portugal":"portugal","México":"mexico","Colômbia":"colombia","Uruguai":"uruguay","Chile":"chile","Bélgica":"belgium","EUA":"usa","Coreia do Sul":"south-korea","Paraguai":"paraguay","Japão":"japan","Camarões":"cameroon","Senegal":"senegal","Croácia":"croatia","Dinamarca":"denmark","Peru":"peru","Equador":"ecuador"}
// Cada escudo é encaixado num QUADRADO, então escudo estreito aparece pequeno
// do lado dos redondos — a Bélgica (coroa em cima, ramos embaixo) tem proporção
// 0,51, a mais estreita da pasta, e ocupava METADE da largura dos vizinhos.
// O Diego pegou os dois: "o escudo da Bélgica está muito pequeno em relação aos
// outros" e "o da Argentina também está muito pequeno, muito estreito".
// Aqui eles crescem e passam um pouco do quadrado; como a moldura tem tamanho
// FIXO, nenhuma linha do jogo se mexe (o slot grande tem 76px pra 72,5px).
// A ARTE NÃO É TOCADA — os escudos são oficiais das federações.
// França e Alemanha ficam de fora de propósito: não são pequenas, são de traço
// CLARO (galo branco, águia cinza) — crescer não resolveria.
// Pra reaferir: node scripts/mockup-encaixe-selecoes.mjs --proposta
const ESCALA: Record<string,number> = { belgium: 1.25, argentina: 1.22, brazil: 1.15, spain: 1.12, 'south-korea': 1.12 }
const files = import.meta.glob('./img/nations-v25/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string,string>
export function NationalCrest({ country, size = 48 }: { country: string; size?: number }) {
  const key = names[country]
  const src = files[`./img/nations-v25/${key}.webp`]
  if (!src) return <span>{country}</span>
  const alto = Math.round(size * (ESCALA[key] ?? 1))
  return (
    <span style={{display:'inline-flex',width:size,height:size,flexShrink:0,alignItems:'center',justifyContent:'center',overflow:'visible',verticalAlign:'middle'}}>
      <img src={src} alt={`Escudo da seleção: ${country}`} style={{height:alto,width:'auto',maxWidth:'none',objectFit:'contain'}} />
    </span>
  )
}
