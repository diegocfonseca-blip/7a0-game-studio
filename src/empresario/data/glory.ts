// Glory moments — when your foresight pays off and the world finally sees
// what you saw in 1993. These fire as the legend hits real-career milestones.

export interface GloryMoment {
  year: number
  title: string
  text: string
  valueBoost: number   // multiplier on current value (e.g. 1.4 = +40%)
}

export const GLORIES: Record<string, GloryMoment[]> = {
  r9: [
    { year: 1997, title: 'Melhor do Mundo aos 20', text: 'R9 foi eleito o melhor jogador do planeta com apenas 20 anos. Você sabia desde o primeiro treino no Cruzeiro.', valueBoost: 1.5 },
    { year: 2002, title: 'BI-CAMPEÃO DO MUNDO', text: 'Os 2 gols na final da Copa. R9 calou o mundo que duvidou dele. Você previu isso palavra por palavra.', valueBoost: 1.8 },
  ],
  romario: [
    { year: 1994, title: 'CAMPEÃO DO MUNDO + Melhor do Mundo', text: 'O Baixinho carregou o Brasil ao tetra e foi eleito o melhor do planeta. Difícil de lidar, impossível de ignorar.', valueBoost: 1.6 },
  ],
  zizou: [
    { year: 1998, title: 'CAMPEÃO DO MUNDO em casa', text: 'Dois gols de cabeça na final. Zidane virou imortal na França. Bola de Ouro no fim do ano.', valueBoost: 1.7 },
    { year: 2002, title: 'O voleio de Glasgow', text: 'O gol mais bonito da história da Champions. Você assinou esse gênio quando era só um menino tímido de Marselha.', valueBoost: 1.5 },
  ],
  dinho: [
    { year: 2005, title: 'MELHOR DO MUNDO', text: 'O Bernabéu aplaudiu de pé. Dinho foi eleito o melhor do planeta com o sorriso de sempre. Aproveite — o auge é curto.', valueBoost: 1.8 },
  ],
  kaka: [
    { year: 2007, title: 'BOLA DE OURO', text: 'Kaká foi eleito o melhor do mundo — o último antes da era Messi/CR7. O profissional perfeito que você apostou lá atrás.', valueBoost: 1.7 },
  ],
  adriano: [
    { year: 2004, title: 'O IMPERADOR reina', text: 'Adriano é o atacante mais devastador do planeta. Chute de canhão, físico de touro. Cuide da cabeça dele — esse auge é frágil.', valueBoost: 1.6 },
  ],
  cr7: [
    { year: 2008, title: 'PRIMEIRA BOLA DE OURO', text: 'CR7 conquistou o mundo. O moleque que chorava de saudade da Madeira virou máquina. E é só a primeira de muitas.', valueBoost: 1.9 },
  ],
  messi: [
    { year: 2009, title: 'A PRIMEIRA DE OITO', text: 'La Pulga ganhou sua primeira Bola de Ouro. O pirralho que ninguém queria pagar o tratamento. Você pagou. Agora colhe.', valueBoost: 2.0 },
  ],
  henry: [
    { year: 2004, title: 'Rei de Highbury', text: 'Henry é o maior artilheiro da história do Arsenal e o melhor da Premier League. Elegância letal.', valueBoost: 1.6 },
  ],
  ibra: [
    { year: 2010, title: 'Zlatan é Zlatan', text: 'Ibra marca em todo grande clube da Europa. Arrogante, genial, imparável. Você aguentou o gênio difícil — valeu cada centavo.', valueBoost: 1.5 },
  ],
  iniesta: [
    { year: 2010, title: 'O GOL DA COPA DO MUNDO', text: 'Iniesta marcou o gol que deu a Copa à Espanha. O menino tímido do vilarejo virou herói nacional.', valueBoost: 1.7 },
  ],
  robinho: [
    { year: 2005, title: 'Melhor Jovem do Mundo', text: 'As pedaladas de Robinho encantaram o planeta. Real Madrid à vista. Precisa de gente boa por perto — não largue a mão dele.', valueBoost: 1.5 },
  ],
  totti: [
    { year: 2006, title: 'CAMPEÃO DO MUNDO', text: 'Il Capitano é campeão do mundo e ídolo eterno da Roma. Lealdade que dá lucro — e que nenhum clube consegue comprar.', valueBoost: 1.5 },
  ],
  denilson: [
    { year: 1998, title: 'O MAIS CARO DO MUNDO', text: '€31,5 milhões pro Betis — recorde mundial! As pedaladas que você assinou por centavos viraram a transferência mais cara do planeta.', valueBoost: 1.9 },
  ],
  drogba: [
    { year: 2012, title: 'Herói da Champions', text: 'Drogba decidiu a final da Champions na marra. Você acreditou quando ninguém mais acreditava — maturação lenta, glória enorme.', valueBoost: 1.6 },
  ],
}

// Generic glory for legends entering their peak without a scripted moment
export function genericGlory(year: number, nickname: string): GloryMoment {
  return {
    year,
    title: 'No auge da carreira',
    text: `${nickname} atingiu o auge e o mundo todo quer contratá-lo. O valor de mercado disparou — exatamente como você previu.`,
    valueBoost: 1.4,
  }
}
