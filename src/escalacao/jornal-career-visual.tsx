import { Escudo } from './escudos'
import ligaArt from './img/jornal-liga-v22.webp'
import copaArt from './img/jornal-copa-v22.webp'
import scorerArt from './img/jornal-artilheiro-v22.webp'
import './jornal-online-visual.css'

/** Mesma direção de arte do online, com vencedores reais da carreira. */
export function CareerNewspaperStories({ champion, division, cup, scorer }: {
  champion?: string; division: string; cup?: string; scorer?: { name: string; goals: number }
}) {
  return <section className="jv-stories ll34-career-stories" aria-label="Destaques da temporada">
    {champion && <figure className="jv-main-story">
      <div className="jv-photo"><img src={ligaArt} alt="Ilustração de comemoração do título"/><span className="jv-crest"><Escudo nome={champion} size={52}/></span></div>
      <figcaption><small>CAMPEÃO · {division}</small><h3>{champion}</h3></figcaption>
    </figure>}
    <div className="jv-side-stories">
      {cup && <figure><h3>O dono da Copa</h3><div className="jv-photo"><img src={copaArt} alt="Ilustração da conquista da Copa"/><span className="jv-crest"><Escudo nome={cup} size={40}/></span></div><figcaption>{cup}</figcaption></figure>}
      {scorer && <figure><h3>Artilheiro · {division}</h3><img src={scorerArt} alt="Chuteira de ouro ilustrada, sem retrato do jogador"/><figcaption><strong>{scorer.name}</strong> · {scorer.goals} gols</figcaption></figure>}
    </div>
  </section>
}
