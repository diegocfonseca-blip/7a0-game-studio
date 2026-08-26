# 🎭 BARALHO FANTASIA — 220 cartas (rascunho, NÃO está no jogo)

Ideia do Diego (26/08): um modo online só de "fantasias" — em vez de jogador de
futebol, o pregão sorteia personagem famoso. 20 times de 11 = **220 cartas**.

## ⚖️ A regra que define tudo: APELIDO, não nome

Passamos por três opções e ficou decidida a terceira:

| | Como fica | Risco | Tem graça? |
|---|---|---|---|
| 🔴 Nome cheio | `Pikachu` | **Maior de todos.** É o nome que a marca protege, e é o que robô de busca acha | Nome parado na tela |
| 🟡 Nome torto | `Picaxu` | Menor, mas existe | **Não.** Sem desenho o cérebro tropeça no erro de escrita e a piada morre |
| 🟢 **Apelido** | `O Bichinho Elétrico · Mata do Sudeste` | **Zero** | **Sim** — é engraçado lido, sem precisar de imagem |

Por que o apelido funciona: a carta do jogo **não tem foto** (`types.ts:79` —
é só nome, clube, ano, posição e categoria). Então o texto TEM que ser a arte.
Apelido + clube inventado + bio é piada que se lê; nome próprio não é.

**Regras permanentes deste baralho:**
1. **Nenhum nome próprio de personagem** entra na carta. Nem no apelido, nem no
   clube, nem na bio. O clube é sempre um lugar **descritivo** inventado por nós
   ("Vila Ninja", "Setor Nuclear"), nunca o nome do lugar da obra.
2. **Nenhuma cor, nenhum desenho, nenhum logo** de ninguém.
3. A coluna "quem é" abaixo é **de trabalho, interna** — serve pra conferir se o
   apelido é reconhecível. **Ela não vai pro jogo nem pro post.**
4. **Nunca misturar com o baralho de futebol real.** É modo escolhido na criação
   da sala. Se o Saci cair no mesmo pregão do Romário, o cara gasta 40 moedas
   achando que leva craque e leva perna-de-pau — estado quebrado.

## 🔢 A conta das posições

Cada time precisa de **1 GOL · 2 LAT · 2 ZAG · 3 MEI · 3 ATA** (`NEED`, 4-3-3).
20 times → o baralho tem que fechar exatamente:

**20 GOL · 40 LAT · 40 ZAG · 60 MEI · 60 ATA = 220**

A lista abaixo já está montada nessa conta.

## ⏳ Pendências deste baralho
- [ ] **Ano do folclore**: personagem de folclore não tem ano de estreia. Estão
      todos em `1500` como marca de "antes de tudo". O Diego decide se fica.
- [ ] **Bios**: cada carta ainda precisa da frase de zoeira (a bio). A lista
      abaixo é só apelido + clube + ano + posição.
- [ ] **Níveis (`lo`/`hi`) e categoria (`fame`)**: nada definido ainda.
- [ ] **Baralho da PELADA** (O Tiozão do Churrasco, O Dono da Bola, O Que Chegou
      Bêbado…): sobrou de fora porque o Diego pediu "os mais famosos". Fica
      guardado como baralho EXTRA — é o mais autoral dos três.

---

## 🐉 ANIME E MANGÁ · 45

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 1 | O Cabelo Amarelo | Guerreiros do Espaço | 1989 | ATA | *Goku* |
| 2 | O Príncipe Orgulhoso | Guerreiros do Espaço | 1991 | ATA | *Vegeta* |
| 3 | O Filho do Cabelo Amarelo | Guerreiros do Espaço | 1992 | MEI | *Gohan* |
| 4 | O Verdão de Turbante | Guerreiros do Espaço | 1990 | ZAG | *Piccolo* |
| 5 | O Careca das Seis Pintas | Ilha da Tartaruga | 1989 | LAT | *Krilin* |
| 6 | O Tirano Branco e Roxo | Império do Frio | 1991 | ZAG | *Freeza* |
| 7 | O Rosa que Come Todo Mundo | Império do Frio | 1994 | ATA | *Majin Boo* |
| 8 | O Velho Safado dos Óculos Escuros | Ilha da Tartaruga | 1986 | GOL | *Mestre Kame* |
| 9 | O Moleque que Veio do Futuro | Guerreiros do Espaço | 1992 | MEI | *Trunks* |
| 10 | O Inseto Perfeito | Império do Frio | 1992 | ZAG | *Cell* |
| 11 | O Cavaleiro do Cavalo Alado | Casa do Zodíaco | 1994 | ATA | *Seiya* |
| 12 | O Cavaleiro do Dragão | Casa do Zodíaco | 1994 | ZAG | *Shiryu* |
| 13 | O Cavaleiro do Gelo | Casa do Zodíaco | 1994 | GOL | *Hyoga* |
| 14 | O Cavaleiro que Renasce | Casa do Zodíaco | 1994 | ATA | *Ikki* |
| 15 | O Cavaleiro da Corrente | Casa do Zodíaco | 1994 | MEI | *Shun* |
| 16 | O Cavaleiro de Duas Caras | Casa do Zodíaco | 1995 | ZAG | *Saga* |
| 17 | A Moça da Armadura Dourada | Casa do Zodíaco | 1994 | MEI | *Saori / Athena* |
| 18 | O Ninja de Laranja | Vila Ninja | 2007 | MEI | *Naruto* |
| 19 | O Ninja Emburrado | Vila Ninja | 2007 | ATA | *Sasuke* |
| 20 | A Ninja de Rosa | Vila Ninja | 2007 | MEI | *Sakura* |
| 21 | O Sensei da Máscara | Vila Ninja | 2007 | LAT | *Kakashi* |
| 22 | O da Sobrancelha Grossa | Vila Ninja | 2008 | LAT | *Rock Lee* |
| 23 | O Menino da Areia | Vila da Areia | 2008 | ZAG | *Gaara* |
| 24 | O Capitão do Chapéu de Palha | Navio Pirata | 2003 | ATA | *Luffy* |
| 25 | O Espadachim das Três Espadas | Navio Pirata | 2003 | ZAG | *Zoro* |
| 26 | A Navegadora Ruiva | Navio Pirata | 2003 | MEI | *Nami* |
| 27 | O Cozinheiro da Sobrancelha Enrolada | Navio Pirata | 2003 | ATA | *Sanji* |
| 28 | O Bichinho Elétrico | Mata do Sudeste | 1999 | LAT | *Pikachu* |
| 29 | O Menino do Boné Vermelho | Mata do Sudeste | 1999 | MEI | *Ash* |
| 30 | O Dragão que Cospe Fogo | Ginásio Municipal | 1999 | ATA | *Charizard* |
| 31 | O Bicho que Dorme na Estrada | Mata do Sudeste | 1999 | GOL | *Snorlax* |
| 32 | A Tartaruga do Jato d'Água | Ginásio Municipal | 1999 | GOL | *Squirtle* |
| 33 | O Sapo da Semente nas Costas | Mata do Sudeste | 1999 | ZAG | *Bulbasaur* |
| 34 | O Gato Falante do Balão | Time do Mal | 1999 | MEI | *Meowth* |
| 35 | O Detetive do Além | Mundo Espiritual | 2001 | ATA | *Yusuke* |
| 36 | O Brigão do Cabelo Laranja | Mundo Espiritual | 2001 | LAT | *Kuwabara* |
| 37 | O Baixinho da Chama Negra | Mundo Espiritual | 2001 | MEI | *Hiei* |
| 38 | A Moça do Coque e da Lua | Reino da Lua | 1996 | ATA | *Sailor Moon* |
| 39 | O Samurai da Cicatriz no Rosto | Era do Sabre | 2001 | MEI | *Kenshin* |
| 40 | O Moleque do Caderno | Colégio da Cidade | 2007 | MEI | *Light, Death Note* |
| 41 | O Menino que Vira Gigante | Muralha | 2015 | ATA | *Eren* |
| 42 | O Baixinho Mais Forte do Mundo | Muralha | 2015 | LAT | *Levi* |
| 43 | O Menino do Brinco de Fogo | Vila da Neve | 2020 | ATA | *Tanjiro* |
| 44 | A Menina do Macacão e do Óculos | Vila do Pinguim | 1985 | LAT | *Arale* |
| 45 | O Dinossauro Laranja de Estimação | Mundo Digital | 2000 | ATA | *Agumon* |

## 📺 DESENHO · 45

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 46 | O Gordinho da Usina | Setor Nuclear | 1990 | GOL | *Homer* |
| 47 | O Moleque do Estilingue | Setor Nuclear | 1990 | ATA | *Bart* |
| 48 | A Menina do Saxofone | Setor Nuclear | 1990 | MEI | *Lisa* |
| 49 | A Mãe do Cabelão Azul | Setor Nuclear | 1990 | ZAG | *Marge* |
| 50 | O Velho Ricaço da Usina | Setor Nuclear | 1990 | ZAG | *Sr. Burns* |
| 51 | O Vizinho Bonzinho do Bigode | Setor Nuclear | 1991 | LAT | *Ned Flanders* |
| 52 | O Palhaço da TV | Setor Nuclear | 1991 | ATA | *Krusty* |
| 53 | A Esponja de Calça Quadrada | Fundo do Mar | 1999 | ATA | *Bob Esponja* |
| 54 | A Estrela-do-Mar Burrinha | Fundo do Mar | 1999 | ZAG | *Patrick* |
| 55 | O Polvo Mal-Humorado do Clarinete | Fundo do Mar | 1999 | MEI | *Lula Molusco* |
| 56 | O Caranguejo Pão-Duro | Fundo do Mar | 1999 | GOL | *Sr. Siriguejo* |
| 57 | O Micróbio de Um Olho Só | Fundo do Mar | 2000 | MEI | *Plankton* |
| 58 | O Coelho Cinzento da Cenoura | Estúdio Maluco | 1940 | ATA | *Pernalonga* |
| 59 | O Pato Preto Gago de Raiva | Estúdio Maluco | 1940 | MEI | *Patolino* |
| 60 | O Passarinho Amarelo | Estúdio Maluco | 1942 | LAT | *Piu-Piu* |
| 61 | O Gato que Nunca Pega o Passarinho | Estúdio Maluco | 1942 | LAT | *Frajola* |
| 62 | O Pássaro do Bip-Bip | Estúdio Maluco | 1949 | LAT | *Papa-Léguas* |
| 63 | O Coiote das Encomendas | Estúdio Maluco | 1949 | ATA | *Coiote* |
| 64 | O Diabo Rodopiante | Estúdio Maluco | 1954 | MEI | *Taz* |
| 65 | O Gato Azul que Nunca Ganha | Casa da Família | 1940 | LAT | *Tom* |
| 66 | O Ratinho que Ganha Sempre | Casa da Família | 1940 | ATA | *Jerry* |
| 67 | O Cachorrão Covarde da Coleira | Van do Mistério | 1969 | ATA | *Scooby* |
| 68 | O Barbudo Faminto | Van do Mistério | 1969 | MEI | *Salsicha* |
| 69 | O Homem das Cavernas de Gravata | Vila de Pedra | 1960 | ZAG | *Fred Flintstone* |
| 70 | O Baixinho Amigo do Vizinho | Vila de Pedra | 1960 | LAT | *Barney* |
| 71 | O Urso do Cesto de Piquenique | Parque Nacional | 1958 | ATA | *Zé Colmeia* |
| 72 | O Pica-Pau da Risada | Estúdio Maluco | 1940 | ATA | *Pica-Pau* |
| 73 | O Marujo do Espinafre | Doca do Porto | 1929 | ATA | *Popeye* |
| 74 | O Cachorro Rosa Medroso | Fazenda do Nada | 1999 | GOL | *Coragem* |
| 75 | O Menino Gênio do Laboratório | Casa dos Fundos | 1996 | MEI | *Dexter* |
| 76 | As Três Meninas do Laço | Cidade Pequena | 1998 | ATA | *Meninas Superpoderosas* |
| 77 | O Marombeiro do Topete | Academia da Esquina | 1997 | ATA | *Johnny Bravo* |
| 78 | O Menino Amarelo do Gorro | Terra dos Doces | 2010 | MEI | *Finn* |
| 79 | O Cachorro que Estica | Terra dos Doces | 2010 | LAT | *Jake* |
| 80 | O Robô Bêbado de Metal | Ano 3000 | 1999 | ZAG | *Bender* |
| 81 | O Gordinho Mal-Educado da Neve | Cidade da Neve | 1997 | ATA | *Cartman* |
| 82 | O Vovô Cientista da Garagem | Garagem sem Porta | 2013 | MEI | *Rick* |
| 83 | As Tartarugas da Pizza | Esgoto da Cidade | 1987 | ZAG | *Tartarugas Ninja* |
| 84 | O Musculoso da Espada Erguida | Castelo Cinzento | 1983 | ATA | *He-Man* |
| 85 | O Gato Musculoso Líder | Planeta Perdido | 1985 | ZAG | *Thundercats* |
| 86 | Os Meninos Perdidos do Dado | Caverna do Dragão | 1983 | MEI | *Caverna do Dragão* |
| 87 | O Ratinho da Luva Branca | Casa do Camundongo | 1928 | MEI | *Mickey* |
| 88 | O Pato Nervoso de Marinheiro | Casa do Camundongo | 1934 | ATA | *Donald* |
| 89 | O Tio Ricaço da Cartola | Cofre da Cidade | 1947 | GOL | *Tio Patinhas* |
| 90 | O Cão Desengonçado do Chapéu | Casa do Camundongo | 1932 | LAT | *Pateta* |

## 🛢️ VILA DA ESQUINA · 13

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 91 | O Menino do Barril | Vila da Esquina | 1984 | ATA | *Chaves* |
| 92 | O Bochechudo da Bola | Vila da Esquina | 1984 | ATA | *Quico* |
| 93 | O Barbudo que Deve 14 Meses | Vila da Esquina | 1984 | ZAG | *Seu Madruga* |
| 94 | A Menina das Tranças | Vila da Esquina | 1984 | MEI | *Chiquinha* |
| 95 | A Mãe Ciumenta do Bochechudo | Vila da Esquina | 1984 | ZAG | *Dona Florinda* |
| 96 | O Professor do Bigode e do Terno | Vila da Esquina | 1984 | MEI | *Girafales* |
| 97 | O Dono da Vila | Vila da Esquina | 1984 | GOL | *Sr. Barriga* |
| 98 | O Filho Gordinho do Dono | Vila da Esquina | 1985 | ZAG | *Nhonho* |
| 99 | A Bruxa do 71 | Vila da Esquina | 1984 | MEI | *Dona Clotilde* |
| 100 | O Aluno que Nunca Presta Atenção | Vila da Esquina | 1985 | MEI | *Godinez* |
| 101 | O Carteiro com Preguiça | Vila da Esquina | 1985 | LAT | *Jaiminho* |
| 102 | A Menina do Sotaque Fino | Vila da Esquina | 1985 | LAT | *Popis* |
| 103 | O Herói da Antena e do Coração | Vila da Esquina | 1984 | ATA | *Chapolin* |

## 🎮 GAMES · 33

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 104 | O Encanador do Bigode | Reino dos Canos | 1985 | ATA | *Mario* |
| 105 | O Irmão Verde e Medroso | Reino dos Canos | 1985 | MEI | *Luigi* |
| 106 | A Princesa que Sempre Some | Reino dos Canos | 1985 | MEI | *Peach* |
| 107 | O Tartarugão do Casco Espinhoso | Reino dos Canos | 1985 | GOL | *Bowser* |
| 108 | O Dinossauro Verde que Engole | Reino dos Canos | 1990 | LAT | *Yoshi* |
| 109 | O Gorilão da Gravata | Ilha dos Barris | 1981 | ZAG | *Donkey Kong* |
| 110 | O Ouriço Azul | Colina Verde | 1991 | LAT | *Sonic* |
| 111 | A Raposinha de Duas Caudas | Colina Verde | 1992 | LAT | *Tails* |
| 112 | O Vermelho do Soco | Colina Verde | 1994 | LAT | *Knuckles* |
| 113 | O Doutor Gordo do Bigode | Colina Verde | 1991 | MEI | *Robotnik* |
| 114 | O Elfo de Verde e Espada | Reino Antigo | 1986 | ATA | *Link* |
| 115 | A Bolinha Rosa que Engole Tudo | Estrela Distante | 1992 | ATA | *Kirby* |
| 116 | A Bolinha Amarela dos Fantasminhas | Fliperama | 1980 | ATA | *Pac-Man* |
| 117 | O Robô Azul do Canhão no Braço | Laboratório Azul | 1987 | ATA | *Megaman* |
| 118 | O Karateca da Faixa Vermelha | Torneio Mundial | 1991 | ATA | *Ryu* |
| 119 | O Loirinho do Chinelo | Torneio Mundial | 1991 | ATA | *Ken* |
| 120 | A do Coque e do Chute Giratório | Torneio Mundial | 1991 | MEI | *Chun-Li* |
| 121 | A Fera Verde do Choque | Torneio Mundial | 1991 | LAT | *Blanka* |
| 122 | O Russo Careca do Abraço | Torneio Mundial | 1991 | ZAG | *Zangief* |
| 123 | O Militar do Cabelo Escovinha | Torneio Mundial | 1991 | ZAG | *Guile* |
| 124 | O Ninja Amarelo do "Vem Cá" | Torneio Sangrento | 1992 | ATA | *Scorpion* |
| 125 | O Ninja Azul que Congela | Torneio Sangrento | 1992 | GOL | *Sub-Zero* |
| 126 | O Deus do Chapéu de Palha e do Raio | Torneio Sangrento | 1992 | MEI | *Raiden* |
| 127 | O Bicho Laranja que Gira | Ilha do Doutor | 1996 | LAT | *Crash* |
| 128 | A Arqueóloga das Duas Pistolas | Tumba Antiga | 1996 | MEI | *Lara Croft* |
| 129 | O Careca Bravo das Duas Lâminas | Monte dos Deuses | 2005 | ATA | *Kratos* |
| 130 | O Soldado do Capacete Verde | Nave de Guerra | 2001 | ZAG | *Master Chief* |
| 131 | O Soldado da Caixa de Papelão | Base Secreta | 1998 | LAT | *Solid Snake* |
| 132 | O Homem de Blocos da Picareta | Mundo Quadrado | 2011 | MEI | *Steve, Minecraft* |
| 133 | O Bicho Verde que Explode | Mundo Quadrado | 2011 | ZAG | *Creeper* |
| 134 | O Astronauta que Pode Ser o Traidor | Nave Avariada | 2020 | MEI | *Among Us* |
| 135 | O Passarinho do Estilingue | Ilha dos Porcos | 2009 | ATA | *Angry Birds* |
| 136 | O Bichinho do Celular que Vive com Fome | Telinha | 2012 | MEI | *Pou* |

## 🦸 HERÓIS · 25

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 137 | O Cara da Teia | Cidade Grande | 1962 | ATA | *Homem-Aranha* |
| 138 | O Verdão que Fica Bravo | Laboratório Gama | 1962 | ZAG | *Hulk* |
| 139 | O Bilionário da Armadura | Torre da Cidade | 1963 | ATA | *Homem de Ferro* |
| 140 | O Soldado do Escudo | Torre da Cidade | 1941 | ZAG | *Capitão América* |
| 141 | O Loiro do Martelo | Reino dos Deuses | 1962 | ATA | *Thor* |
| 142 | O Baixinho das Garras | Escola dos Mutantes | 1974 | ZAG | *Wolverine* |
| 143 | O Boca-Suja de Vermelho | Cidade Grande | 1991 | ATA | *Deadpool* |
| 144 | O Rei do Gato Preto | Reino Escondido | 1966 | LAT | *Pantera Negra* |
| 145 | O Roxo do Queixo Enrugado | Planeta Morto | 1991 | ZAG | *Thanos* |
| 146 | O Preto Pegajoso da Língua Grande | Cidade Grande | 1988 | ATA | *Venom* |
| 147 | O Bruxo da Capa Vermelha | Templo da Cidade | 1963 | MEI | *Doutor Estranho* |
| 148 | A Espiã do Couro Preto | Torre da Cidade | 1964 | MEI | *Viúva Negra* |
| 149 | O Careca da Cadeira de Rodas | Escola dos Mutantes | 1963 | MEI | *Professor X* |
| 150 | O Velho do Capacete Vermelho | Escola dos Mutantes | 1963 | MEI | *Magneto* |
| 151 | A do Cabelo Branco que Faz Chover | Escola dos Mutantes | 1975 | MEI | *Tempestade* |
| 152 | O Homem de Pedra Laranja | Prédio dos Quatro | 1961 | GOL | *Coisa* |
| 153 | O Alienígena da Capa Vermelha | Fazenda do Interior | 1938 | ATA | *Superman* |
| 154 | O Morcego Bilionário | Cidade Escura | 1939 | MEI | *Batman* |
| 155 | O Palhaço do Sorriso Verde | Hospício da Cidade | 1940 | MEI | *Coringa* |
| 156 | A Amazona do Laço Dourado | Ilha das Guerreiras | 1941 | ZAG | *Mulher-Maravilha* |
| 157 | O Vermelho Mais Rápido do Mundo | Cidade Central | 1940 | LAT | *Flash* |
| 158 | O Rei do Fundo do Mar | Reino Submerso | 1941 | GOL | *Aquaman* |
| 159 | O Ajudante da Capa Curta | Cidade Escura | 1940 | LAT | *Robin* |
| 160 | O do Anel que Faz Tudo Verde | Setor Espacial | 1940 | MEI | *Lanterna Verde* |
| 161 | A Ladra de Roupa de Gato | Cidade Escura | 1940 | LAT | *Mulher-Gato* |

## 🎬 CINEMA · 30

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 162 | O Respirador da Capa Preta | Galáxia Distante | 1977 | ZAG | *Darth Vader* |
| 163 | O Moleque do Sabre Azul | Galáxia Distante | 1977 | ATA | *Luke* |
| 164 | O Verdinho Velho que Fala Torto | Galáxia Distante | 1980 | MEI | *Yoda* |
| 165 | O Peludo que Só Grunhe | Galáxia Distante | 1977 | ZAG | *Chewbacca* |
| 166 | A Latinha que Apita | Galáxia Distante | 1977 | GOL | *R2-D2* |
| 167 | O Soldado Branco que Nunca Acerta | Galáxia Distante | 1977 | LAT | *Stormtrooper* |
| 168 | O Baixinho do Pé Peludo | Vilarejo do Interior | 2001 | MEI | *Frodo* |
| 169 | O Velho da Barba e do Chapéu Pontudo | Vilarejo do Interior | 2001 | MEI | *Gandalf* |
| 170 | O Magrelo do "Meu Precioso" | Caverna Escura | 2002 | LAT | *Gollum* |
| 171 | O Arqueiro Loiro da Orelha Fina | Floresta Antiga | 2001 | ATA | *Legolas* |
| 172 | O Menino da Cicatriz na Testa | Escola de Magia | 2001 | ATA | *Harry Potter* |
| 173 | A Menina que Sabe Tudo | Escola de Magia | 2001 | MEI | *Hermione* |
| 174 | O Ruivo Medroso | Escola de Magia | 2001 | LAT | *Rony* |
| 175 | O Careca Sem Nariz | Escola de Magia | 2002 | ZAG | *Voldemort* |
| 176 | O Gigante Barbudo Bonzinho | Escola de Magia | 2001 | GOL | *Hagrid* |
| 177 | O Escolhido do Casacão Preto | Mundo da Matriz | 1999 | MEI | *Neo* |
| 178 | O Careca dos Óculos Redondos | Mundo da Matriz | 1999 | MEI | *Morpheus* |
| 179 | O Homem de Terno e Fone | Mundo da Matriz | 1999 | LAT | *Agente Smith* |
| 180 | O Boxeador que Apanha e Não Cai | Ringue da Cidade | 1976 | ATA | *Rocky* |
| 181 | O da Faixa Vermelha na Testa | Selva de Guerra | 1982 | ATA | *Rambo* |
| 182 | A Máquina de Óculos que Sempre Volta | Ano 2029 | 1984 | ZAG | *Terminator* |
| 183 | O Matador de Terno Preto | Hotel dos Assassinos | 2014 | ATA | *John Wick* |
| 184 | O Arqueólogo do Chapéu e do Chicote | Templo Perdido | 1981 | MEI | *Indiana Jones* |
| 185 | O Espião de Smoking | Serviço Secreto | 1962 | MEI | *007* |
| 186 | O Pirata do Rabo de Cavalo Torto | Mar do Caribe | 2003 | ATA | *Jack Sparrow* |
| 187 | O da Luva de Facas do Pesadelo | Rua dos Pesadelos | 1984 | ZAG | *Freddy* |
| 188 | O da Máscara de Hóquei | Acampamento do Lago | 1980 | ZAG | *Jason* |
| 189 | O Boneco Ruivo Assassino | Quarto da Criança | 1988 | LAT | *Chucky* |
| 190 | O Alienígena do Dedo Aceso | Quintal da Casa | 1982 | GOL | *E.T.* |
| 191 | O Lagartão que Derruba Prédio | Baía do Japão | 1954 | GOL | *Godzilla* |

## 🇧🇷 BRASIL · 14

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 192 | A Baixinha Dentuça do Coelho | Bairro do Limoeiro | 1963 | ATA | *Mônica* |
| 193 | O Moleque que Toca a Língua | Bairro do Limoeiro | 1960 | MEI | *Cebolinha* |
| 194 | O que Foge do Banho | Bairro do Limoeiro | 1961 | LAT | *Cascão* |
| 195 | A Menina que Come Tudo | Bairro do Limoeiro | 1963 | ATA | *Magali* |
| 196 | O Caipira do Chapéu de Palha | Roça do Interior | 1961 | ATA | *Chico Bento* |
| 197 | O Cientista da Franja na Testa | Bairro do Limoeiro | 1961 | MEI | *Franjinha* |
| 198 | O Cachorrinho Azul | Bairro do Limoeiro | 1959 | LAT | *Bidu* |
| 199 | O Dinossauro Amarelinho | Bairro do Limoeiro | 1961 | ZAG | *Horácio* |
| 200 | A Boneca de Pano Respondona | Sítio do Interior | 1977 | MEI | *Emília* |
| 201 | O Sabugo de Milho Sabido | Sítio do Interior | 1977 | MEI | *Visconde* |
| 202 | A Avó do Sítio | Sítio do Interior | 1977 | GOL | *Dona Benta* |
| 203 | O Menino do Castelo e o Gênio | Castelo da Rua | 1994 | MEI | *Nino* |
| 204 | O Cavernícola da Clava | Roça do Interior | 1961 | ZAG | *Piteco* |
| 205 | O Fantasminha de Lençol | Cemitério do Bairro | 1964 | LAT | *Penadinho* |

## 🌳 FOLCLORE BRASILEIRO · 15

| # | Apelido | Clube | Ano | Pos | *(quem é — interno)* |
|---|---|---|---|---|---|
| 206 | O Moleque de Uma Perna e Gorro Vermelho | Mata Fechada | 1500 | ATA | *Saci* |
| 207 | O Guardião do Pé Virado | Mata Fechada | 1500 | LAT | *Curupira* |
| 208 | A Moça do Canto na Beira do Rio | Beira do Rio | 1500 | GOL | *Iara* |
| 209 | A Cobra de Fogo | Mata Fechada | 1500 | ZAG | *Boitatá* |
| 210 | A Égua Sem Cabeça | Estrada Velha | 1500 | ZAG | *Mula-sem-Cabeça* |
| 211 | A Velha do Saco e do Sono | Casa Velha | 1500 | MEI | *Cuca* |
| 212 | O Boto que Vira Moço de Chapéu | Beira do Rio | 1500 | ATA | *Boto* |
| 213 | O Homem que Vira Bicho na Lua Cheia | Estrada Velha | 1500 | LAT | *Lobisomem* |
| 214 | A Guardiã dos Bichos do Mato | Mata Fechada | 1500 | MEI | *Caipora* |
| 215 | O Gigante Peludo de Um Olho Só | Mata Fechada | 1500 | ZAG | *Mapinguari* |
| 216 | O Menino que Acha Tudo que se Perde | Campo Aberto | 1500 | LAT | *Negrinho do Pastoreio* |
| 217 | O Bicho-Papão do Armário | Quarto Escuro | 1500 | GOL | *Bicho-Papão* |
| 218 | A Cobra Grande do Rio | Beira do Rio | 1500 | ZAG | *Cobra Grande* |
| 219 | O Seco da Estrada | Estrada Velha | 1500 | LAT | *Corpo-Seco* |
| 220 | A Comadre do Assobio | Mata Fechada | 1500 | MEI | *Comadre Fulozinha* |
