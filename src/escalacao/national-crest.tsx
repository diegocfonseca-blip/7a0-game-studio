// Escudos das associações, não bandeiras nem brasões gerados por nome.
const names: Record<string,string> = {"Brasil":"brazil","Argentina":"argentina","França":"france","Espanha":"spain","Inglaterra":"england","Itália":"italy","Alemanha":"germany","Holanda":"netherlands","Portugal":"portugal","México":"mexico","Colômbia":"colombia","Uruguai":"uruguay","Chile":"chile","Bélgica":"belgium","EUA":"usa","Coreia do Sul":"south-korea","Paraguai":"paraguay","Japão":"japan","Camarões":"cameroon","Senegal":"senegal","Croácia":"croatia","Dinamarca":"denmark","Peru":"peru","Equador":"ecuador"}
const files = import.meta.glob('./img/nations-v25/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string,string>
export function NationalCrest({ country, size = 48 }: { country: string; size?: number }) {
  const src = files[`./img/nations-v25/${names[country]}.webp`]
  return src ? <img src={src} alt={`Escudo da seleção: ${country}`} width={size} height={size} style={{objectFit:'contain',flexShrink:0,display:'inline-block',verticalAlign:'middle'}} /> : <span>{country}</span>
}
