import type { Position } from '../empresario/types'
import type { DraftPlayer } from './types'

type P = { name: string; pos: Position; rating: number }

// Key named players per CPU team (cpuIndex 0-35 matches CPU_POOLS order)
// Div1=0-9, Div2=10-19, Div3=20-29, Div4=30-35
const KEYS: P[][] = [
  // ── DIV 1 ──────────────────────────────────────────────────────
  // c0 - Fla (Flamengo)
  [
    { name: 'Gilmar Fonseca', pos: 'GOL', rating: 76 }, { name: 'Leandro Corrêa', pos: 'GOL', rating: 63 },
    { name: 'Carlos Mozer', pos: 'ZAG', rating: 75 }, { name: 'Leandro Baroni', pos: 'ZAG', rating: 72 }, { name: 'Nonato', pos: 'ZAG', rating: 68 },
    { name: 'Jorginho', pos: 'LAT', rating: 74 }, { name: 'André Cruz', pos: 'LAT', rating: 70 },
    { name: 'Tita', pos: 'MEI', rating: 77 }, { name: 'Geovani', pos: 'MEI', rating: 76 }, { name: 'Sérgio Livramento', pos: 'MEI', rating: 73 }, { name: 'Marquinhos Fla', pos: 'MEI', rating: 68 },
    { name: 'Gaúcho', pos: 'ATA', rating: 78 }, { name: 'Viola', pos: 'ATA', rating: 74 }, { name: 'Renato Neto', pos: 'ATA', rating: 68 },
  ],
  // c1 - Verdão (Palmeiras)
  [
    { name: 'Marcos Palmeiras', pos: 'GOL', rating: 74 }, { name: 'Emerson Ramos', pos: 'GOL', rating: 62 },
    { name: 'Antônio Carlos', pos: 'ZAG', rating: 76 }, { name: 'Adílson Zagueiro', pos: 'ZAG', rating: 74 }, { name: 'Rodrigo Botti', pos: 'ZAG', rating: 70 },
    { name: 'Pedrão Lateral', pos: 'LAT', rating: 73 }, { name: 'Zé Maria Jnr', pos: 'LAT', rating: 68 },
    { name: 'Mazinho', pos: 'MEI', rating: 78 }, { name: 'Everton Alvim', pos: 'MEI', rating: 74 }, { name: 'Zinho Palmeiras', pos: 'MEI', rating: 76 }, { name: 'Palhinha', pos: 'MEI', rating: 71 },
    { name: 'Evair', pos: 'ATA', rating: 79 }, { name: 'Paulo Nunes', pos: 'ATA', rating: 75 }, { name: 'Rinaldo', pos: 'ATA', rating: 67 },
  ],
  // c2 - Timão (Corinthians)
  [
    { name: 'Ronaldo Giovanelli', pos: 'GOL', rating: 75 }, { name: 'Neto Giovanelli', pos: 'GOL', rating: 61 },
    { name: 'Tupãzinho', pos: 'ZAG', rating: 74 }, { name: 'Jorge do Corintiano', pos: 'ZAG', rating: 72 }, { name: 'Paulo Sérgio Z', pos: 'ZAG', rating: 68 },
    { name: 'Sidnei', pos: 'LAT', rating: 73 }, { name: 'Marcinho Corinthians', pos: 'LAT', rating: 69 },
    { name: 'Neto Corinthians', pos: 'MEI', rating: 77 }, { name: 'Mauro Galvão', pos: 'MEI', rating: 73 }, { name: 'Rincón', pos: 'MEI', rating: 76 }, { name: 'Caio Corinthians', pos: 'MEI', rating: 70 },
    { name: 'Dinei', pos: 'ATA', rating: 76 }, { name: 'Hélio Neto', pos: 'ATA', rating: 73 }, { name: 'Gameiro Neto', pos: 'ATA', rating: 67 },
  ],
  // c3 - Tricolor SP (São Paulo FC)
  [
    { name: 'Zetti', pos: 'GOL', rating: 78 }, { name: 'Rogério Ceni Jnr', pos: 'GOL', rating: 62 },
    { name: 'Adílson São Paulo', pos: 'ZAG', rating: 76 }, { name: 'Gilmar São Paulo', pos: 'ZAG', rating: 74 }, { name: 'Antônio Carlos SP', pos: 'ZAG', rating: 70 },
    { name: 'Cafu', pos: 'LAT', rating: 78 }, { name: 'Leonardo', pos: 'LAT', rating: 77 },
    { name: 'Raí', pos: 'MEI', rating: 82 }, { name: 'Cerezo', pos: 'MEI', rating: 72 }, { name: 'Palhinha SP', pos: 'MEI', rating: 75 }, { name: 'Sávio SP', pos: 'MEI', rating: 68 },
    { name: 'Müller', pos: 'ATA', rating: 80 }, { name: 'Caio SP', pos: 'ATA', rating: 73 }, { name: 'Guerrinha', pos: 'ATA', rating: 68 },
  ],
  // c4 - Peixe (Santos)
  [
    { name: 'Gilmar Peixe', pos: 'GOL', rating: 72 }, { name: 'Vander Santos', pos: 'GOL', rating: 60 },
    { name: 'Mauro Galvão Sts', pos: 'ZAG', rating: 74 }, { name: 'Fabinho Santos', pos: 'ZAG', rating: 72 }, { name: 'Sandro Sassá', pos: 'ZAG', rating: 67 },
    { name: 'Waldir Peres Jnr', pos: 'LAT', rating: 72 }, { name: 'Jorge Luís Santos', pos: 'LAT', rating: 67 },
    { name: 'Diego Santos', pos: 'MEI', rating: 74 }, { name: 'Pedrinho Xavequinha', pos: 'MEI', rating: 72 }, { name: 'Zequinha', pos: 'MEI', rating: 70 }, { name: 'Marcio Santos', pos: 'MEI', rating: 67 },
    { name: 'Clodoaldo Filho', pos: 'ATA', rating: 75 }, { name: 'Claudinho Santos', pos: 'ATA', rating: 72 }, { name: 'Sílvio Cruz', pos: 'ATA', rating: 67 },
  ],
  // c5 - Imortal (Grêmio)
  [
    { name: 'Paulo Victor Grêmio', pos: 'GOL', rating: 74 }, { name: 'Danrlei', pos: 'GOL', rating: 65 },
    { name: 'Pedro Geromel Jnr', pos: 'ZAG', rating: 74 }, { name: 'Adaílton Grêmio', pos: 'ZAG', rating: 73 }, { name: 'Paulo Nunes Z', pos: 'ZAG', rating: 68 },
    { name: 'Paulo Roberto Grêmio', pos: 'LAT', rating: 72 }, { name: 'Anderson Grêmio', pos: 'LAT', rating: 68 },
    { name: 'Caio Grêmio', pos: 'MEI', rating: 75 }, { name: 'Alcindo Grêmio', pos: 'MEI', rating: 74 }, { name: 'Carpegiani Filho', pos: 'MEI', rating: 72 }, { name: 'Sandro Grêmio', pos: 'MEI', rating: 68 },
    { name: 'Dario Rodrigues', pos: 'ATA', rating: 77 }, { name: 'Luís Carlos Grêmio', pos: 'ATA', rating: 73 }, { name: 'Éder Lima', pos: 'ATA', rating: 67 },
  ],
  // c6 - Colorado (Internacional)
  [
    { name: 'Cléber Gaúcho', pos: 'GOL', rating: 73 }, { name: 'Danrlei Inter', pos: 'GOL', rating: 63 },
    { name: 'Beto Gaúcho', pos: 'ZAG', rating: 74 }, { name: 'Mauro Galvão Inter', pos: 'ZAG', rating: 73 }, { name: 'Neto Gaúcho', pos: 'ZAG', rating: 68 },
    { name: 'Rogério Gaúcho', pos: 'LAT', rating: 72 }, { name: 'Sérgio Inter', pos: 'LAT', rating: 68 },
    { name: 'Emerson Inter', pos: 'MEI', rating: 77 }, { name: 'Giovane Inter', pos: 'MEI', rating: 75 }, { name: 'Fabinho Inter', pos: 'MEI', rating: 72 }, { name: 'Adriano Inter', pos: 'MEI', rating: 68 },
    { name: 'Jardel', pos: 'ATA', rating: 78 }, { name: 'Leandro Inter', pos: 'ATA', rating: 74 }, { name: 'Marcos Gaúcho', pos: 'ATA', rating: 68 },
  ],
  // c7 - Raposa (Cruzeiro)
  [
    { name: 'Paulo Becker', pos: 'GOL', rating: 75 }, { name: 'Fábio Cruzeiro Jnr', pos: 'GOL', rating: 62 },
    { name: 'Rildo Cruzeiro', pos: 'ZAG', rating: 74 }, { name: 'Henrique Cruzeiro', pos: 'ZAG', rating: 73 }, { name: 'Alex Nobre', pos: 'ZAG', rating: 68 },
    { name: 'Branco Cruzeiro', pos: 'LAT', rating: 73 }, { name: 'Jorge Luís Cruzeiro', pos: 'LAT', rating: 68 },
    { name: 'Robinho Cruzeiro', pos: 'MEI', rating: 76 }, { name: 'Mauro Silva Cruzeiro', pos: 'MEI', rating: 75 }, { name: 'Charles Cruzeiro', pos: 'MEI', rating: 72 }, { name: 'Liniker', pos: 'MEI', rating: 68 },
    { name: 'Edmundo Cruzeiro', pos: 'ATA', rating: 77 }, { name: 'Éder Aleixo', pos: 'ATA', rating: 73 }, { name: 'Palhinha Cruzeiro', pos: 'ATA', rating: 67 },
  ],
  // c8 - Galo (Atlético-MG)
  [
    { name: 'Victor Galo', pos: 'GOL', rating: 73 }, { name: 'Wilson Galo', pos: 'GOL', rating: 61 },
    { name: 'Leonardo Galo', pos: 'ZAG', rating: 73 }, { name: 'Renato Galo', pos: 'ZAG', rating: 72 }, { name: 'Sérgio Galo', pos: 'ZAG', rating: 67 },
    { name: 'Gilson Galo', pos: 'LAT', rating: 72 }, { name: 'Jorginho Galo', pos: 'LAT', rating: 67 },
    { name: 'Reinaldo Galo', pos: 'MEI', rating: 77 }, { name: 'Toninho Cerezo Galo', pos: 'MEI', rating: 72 }, { name: 'Carlos Galo', pos: 'MEI', rating: 72 }, { name: 'Paulo Galo', pos: 'MEI', rating: 67 },
    { name: 'Guilherme Galo', pos: 'ATA', rating: 77 }, { name: 'Éber Galo', pos: 'ATA', rating: 73 }, { name: 'Claudinho Galo', pos: 'ATA', rating: 66 },
  ],
  // c9 - Gigante (Vasco)
  [
    { name: 'Carlos Germano', pos: 'GOL', rating: 76 }, { name: 'Acácio Vasco', pos: 'GOL', rating: 63 },
    { name: 'Aldair Vasco', pos: 'ZAG', rating: 75 }, { name: 'Mauro Galvão Vasco', pos: 'ZAG', rating: 73 }, { name: 'Odvan Vasco', pos: 'ZAG', rating: 68 },
    { name: 'Luís Carlos Vasco', pos: 'LAT', rating: 73 }, { name: 'Rodrigo Vasco', pos: 'LAT', rating: 68 },
    { name: 'Ramón Vasco', pos: 'MEI', rating: 77 }, { name: 'Felipe Vasco', pos: 'MEI', rating: 75 }, { name: 'Sávio Vasco', pos: 'MEI', rating: 74 }, { name: 'Anderson Vasco', pos: 'MEI', rating: 68 },
    { name: 'Romário Vasco', pos: 'ATA', rating: 78 }, { name: 'Túlio Vasco', pos: 'ATA', rating: 74 }, { name: 'Bebeto Jnr', pos: 'ATA', rating: 67 },
  ],

  // ── DIV 2 ──────────────────────────────────────────────────────
  // c10 - Fogão (Botafogo)
  [
    { name: 'Jefferson Fogão', pos: 'GOL', rating: 68 }, { name: 'Dênis Fogão', pos: 'GOL', rating: 58 },
    { name: 'Maurício Fogão', pos: 'ZAG', rating: 67 }, { name: 'Alexandre Fogão', pos: 'ZAG', rating: 65 }, { name: 'Lúcio Fogão', pos: 'ZAG', rating: 61 },
    { name: 'Jailton Fogão', pos: 'LAT', rating: 66 }, { name: 'Osmar Fogão', pos: 'LAT', rating: 62 },
    { name: 'Souza Fogão', pos: 'MEI', rating: 68 }, { name: 'Túlio Fogão', pos: 'MEI', rating: 67 }, { name: 'Andrade Fogão', pos: 'MEI', rating: 65 }, { name: 'Marcus Fogão', pos: 'MEI', rating: 61 },
    { name: 'Maurício Fogão ATA', pos: 'ATA', rating: 68 }, { name: 'Lúcio Fogão ATA', pos: 'ATA', rating: 66 }, { name: 'Kléber Fogão', pos: 'ATA', rating: 60 },
  ],
  // c11 - Flu (Fluminense)
  [
    { name: 'Paulo Dóca', pos: 'GOL', rating: 68 }, { name: 'Élton Flu', pos: 'GOL', rating: 57 },
    { name: 'Cléber Flu', pos: 'ZAG', rating: 66 }, { name: 'Paulo Flu ZAG', pos: 'ZAG', rating: 65 }, { name: 'Marcão Flu', pos: 'ZAG', rating: 61 },
    { name: 'Renato Flu LAT', pos: 'LAT', rating: 65 }, { name: 'Robson Flu', pos: 'LAT', rating: 61 },
    { name: 'Zinho Flu', pos: 'MEI', rating: 70 }, { name: 'Renato Flu', pos: 'MEI', rating: 68 }, { name: 'Carlos Flu', pos: 'MEI', rating: 65 }, { name: 'Lula Flu', pos: 'MEI', rating: 61 },
    { name: 'Marcão Flu ATA', pos: 'ATA', rating: 68 }, { name: 'Bebeto Flu', pos: 'ATA', rating: 65 }, { name: 'Nelsinho Flu', pos: 'ATA', rating: 60 },
  ],
  // c12 - Esquadrão (Bahia)
  [
    { name: 'Marcelo Bahia', pos: 'GOL', rating: 67 }, { name: 'Paulo Bahia', pos: 'GOL', rating: 57 },
    { name: 'Rodrigo Bahia', pos: 'ZAG', rating: 67 }, { name: 'Messias Bahia', pos: 'ZAG', rating: 65 }, { name: 'Neto Bahia', pos: 'ZAG', rating: 60 },
    { name: 'Clênio Bahia', pos: 'LAT', rating: 65 }, { name: 'Carlos Bahia', pos: 'LAT', rating: 61 },
    { name: 'Beto Bahia', pos: 'MEI', rating: 68 }, { name: 'Anderson Bahia', pos: 'MEI', rating: 67 }, { name: 'Jaílson Bahia', pos: 'MEI', rating: 64 }, { name: 'Lindomar Bahia', pos: 'MEI', rating: 60 },
    { name: 'Bobó Bahia', pos: 'ATA', rating: 69 }, { name: 'Sérgio Bahia', pos: 'ATA', rating: 65 }, { name: 'Luciano Bahia', pos: 'ATA', rating: 60 },
  ],
  // c13 - Leão da Ilha (Sport Recife)
  [
    { name: 'Mauro Sport', pos: 'GOL', rating: 66 }, { name: 'Edinho Sport', pos: 'GOL', rating: 57 },
    { name: 'Cícero Sport', pos: 'ZAG', rating: 65 }, { name: 'Flavinho Sport', pos: 'ZAG', rating: 64 }, { name: 'Bruno Sport', pos: 'ZAG', rating: 60 },
    { name: 'Cláudio Sport', pos: 'LAT', rating: 64 }, { name: 'Rosinei Sport', pos: 'LAT', rating: 60 },
    { name: 'Roberto Sport', pos: 'MEI', rating: 67 }, { name: 'Ricardinho Sport', pos: 'MEI', rating: 66 }, { name: 'Julio Sport', pos: 'MEI', rating: 63 }, { name: 'Wagninho Sport', pos: 'MEI', rating: 59 },
    { name: 'Léo Sport', pos: 'ATA', rating: 67 }, { name: 'Cabinho Sport', pos: 'ATA', rating: 64 }, { name: 'Jorge Sport', pos: 'ATA', rating: 59 },
  ],
  // c14 - Esmeraldino (Goiás)
  [
    { name: 'Héverton Goiás', pos: 'GOL', rating: 65 }, { name: 'Rogério Goiás', pos: 'GOL', rating: 56 },
    { name: 'Marcelo Goiás', pos: 'ZAG', rating: 65 }, { name: 'Pedro Goiás', pos: 'ZAG', rating: 63 }, { name: 'Rodrigo Goiás', pos: 'ZAG', rating: 59 },
    { name: 'Jailton Goiás', pos: 'LAT', rating: 63 }, { name: 'Paulo Goiás', pos: 'LAT', rating: 59 },
    { name: 'Sandro Goiás', pos: 'MEI', rating: 66 }, { name: 'Léo Goiás', pos: 'MEI', rating: 65 }, { name: 'Douglas Goiás', pos: 'MEI', rating: 62 }, { name: 'Anderson Goiás', pos: 'MEI', rating: 58 },
    { name: 'Claudinho Goiás', pos: 'ATA', rating: 66 }, { name: 'Felipe Goiás', pos: 'ATA', rating: 63 }, { name: 'Junior Goiás', pos: 'ATA', rating: 58 },
  ],
  // c15 - Coxa (Coritiba)
  [
    { name: 'João Ricardo Coxa', pos: 'GOL', rating: 66 }, { name: 'Kléberson Coxa', pos: 'GOL', rating: 56 },
    { name: 'Leandro Coxa', pos: 'ZAG', rating: 65 }, { name: 'Nilson Coxa', pos: 'ZAG', rating: 63 }, { name: 'Reinaldo Coxa', pos: 'ZAG', rating: 59 },
    { name: 'Bernardo Coxa', pos: 'LAT', rating: 63 }, { name: 'Mancini Coxa', pos: 'LAT', rating: 59 },
    { name: 'Kléberson Coxa MEI', pos: 'MEI', rating: 67 }, { name: 'Flávio Coxa', pos: 'MEI', rating: 65 }, { name: 'Alex Coxa', pos: 'MEI', rating: 63 }, { name: 'Adriano Coxa', pos: 'MEI', rating: 58 },
    { name: 'Deivid Coxa', pos: 'ATA', rating: 67 }, { name: 'Fernandinho Coxa', pos: 'ATA', rating: 63 }, { name: 'Maicosuel Coxa', pos: 'ATA', rating: 58 },
  ],
  // c16 - Furacão (Atlético-PR)
  [
    { name: 'Albano Furacão', pos: 'GOL', rating: 66 }, { name: 'Neto Furacão', pos: 'GOL', rating: 56 },
    { name: 'Manoel Furacão', pos: 'ZAG', rating: 65 }, { name: 'Léo Furacão', pos: 'ZAG', rating: 64 }, { name: 'Wálter Furacão', pos: 'ZAG', rating: 59 },
    { name: 'Helio Furacão', pos: 'LAT', rating: 64 }, { name: 'Marquinhos Furacão', pos: 'LAT', rating: 59 },
    { name: 'Kléberson Fur', pos: 'MEI', rating: 66 }, { name: 'João Furacão', pos: 'MEI', rating: 65 }, { name: 'Rodrigo Furacão', pos: 'MEI', rating: 62 }, { name: 'Wagner Furacão', pos: 'MEI', rating: 58 },
    { name: 'Kléo Furacão', pos: 'ATA', rating: 67 }, { name: 'Thiago Furacão', pos: 'ATA', rating: 63 }, { name: 'Rafael Furacão', pos: 'ATA', rating: 58 },
  ],
  // c17 - Leão BA (Vitória)
  [
    { name: 'Marcão Vitória', pos: 'GOL', rating: 65 }, { name: 'Roberto Vitória', pos: 'GOL', rating: 55 },
    { name: 'Baraka Vitória', pos: 'ZAG', rating: 64 }, { name: 'Carlinhos Vitória', pos: 'ZAG', rating: 63 }, { name: 'Diógenes Vitória', pos: 'ZAG', rating: 58 },
    { name: 'Cléber Vitória', pos: 'LAT', rating: 63 }, { name: 'Elves Vitória', pos: 'LAT', rating: 58 },
    { name: 'Neto Vitória', pos: 'MEI', rating: 66 }, { name: 'Josué Vitória', pos: 'MEI', rating: 64 }, { name: 'Moisés Vitória', pos: 'MEI', rating: 62 }, { name: 'Sandro Vitória', pos: 'MEI', rating: 57 },
    { name: 'Tico Vitória', pos: 'ATA', rating: 66 }, { name: 'Samuel Vitória', pos: 'ATA', rating: 63 }, { name: 'Éder Vitória', pos: 'ATA', rating: 57 },
  ],
  // c18 - Timbu (Náutico)
  [
    { name: 'Anderson Náutico', pos: 'GOL', rating: 65 }, { name: 'Flávio Náutico', pos: 'GOL', rating: 55 },
    { name: 'Washington Náutico', pos: 'ZAG', rating: 64 }, { name: 'Caio Náutico', pos: 'ZAG', rating: 62 }, { name: 'Pedro Náutico', pos: 'ZAG', rating: 57 },
    { name: 'Edson Náutico', pos: 'LAT', rating: 63 }, { name: 'Oscar Náutico', pos: 'LAT', rating: 57 },
    { name: 'Reinaldo Náutico', pos: 'MEI', rating: 66 }, { name: 'Kleber Náutico', pos: 'MEI', rating: 64 }, { name: 'Rogério Náutico', pos: 'MEI', rating: 61 }, { name: 'Genilson Náutico', pos: 'MEI', rating: 56 },
    { name: 'Vasco Náutico', pos: 'ATA', rating: 66 }, { name: 'Rodrigo Náutico', pos: 'ATA', rating: 62 }, { name: 'Carlos Náutico', pos: 'ATA', rating: 56 },
  ],
  // c19 - Bugre (Guaraní Campinas)
  [
    { name: 'Leandro Bugre', pos: 'GOL', rating: 65 }, { name: 'Cléber Bugre', pos: 'GOL', rating: 55 },
    { name: 'Renato Bugre', pos: 'ZAG', rating: 65 }, { name: 'Welter Bugre', pos: 'ZAG', rating: 63 }, { name: 'Fabrício Bugre', pos: 'ZAG', rating: 58 },
    { name: 'Sandro Bugre', pos: 'LAT', rating: 64 }, { name: 'Roni Bugre', pos: 'LAT', rating: 58 },
    { name: 'Alex Bugre', pos: 'MEI', rating: 67 }, { name: 'Tiago Bugre', pos: 'MEI', rating: 65 }, { name: 'Carlos Bugre', pos: 'MEI', rating: 62 }, { name: 'Léo Bugre', pos: 'MEI', rating: 57 },
    { name: 'Gilmar Bugre', pos: 'ATA', rating: 66 }, { name: 'Anderson Bugre', pos: 'ATA', rating: 63 }, { name: 'William Bugre', pos: 'ATA', rating: 57 },
  ],

  // ── DIV 3 ──────────────────────────────────────────────────────
  // c20 - Leão SC (Avaí)
  [
    { name: 'Paulo Avaí', pos: 'GOL', rating: 57 }, { name: 'Marco Avaí', pos: 'GOL', rating: 47 },
    { name: 'Anderson Avaí', pos: 'ZAG', rating: 56 }, { name: 'Felipe Avaí', pos: 'ZAG', rating: 54 }, { name: 'Rogério Avaí', pos: 'ZAG', rating: 50 },
    { name: 'Cláudio Avaí', pos: 'LAT', rating: 54 }, { name: 'Sérgio Avaí', pos: 'LAT', rating: 50 },
    { name: 'Carlos Avaí', pos: 'MEI', rating: 57 }, { name: 'Eduardo Avaí', pos: 'MEI', rating: 55 }, { name: 'Gilmar Avaí', pos: 'MEI', rating: 53 }, { name: 'Wilson Avaí', pos: 'MEI', rating: 48 },
    { name: 'Márcio Avaí', pos: 'ATA', rating: 57 }, { name: 'Luís Avaí', pos: 'ATA', rating: 53 }, { name: 'Junior Avaí', pos: 'ATA', rating: 48 },
  ],
  // c21 - Verdão SC (Chapecoense)
  [
    { name: 'Nelson Chape', pos: 'GOL', rating: 57 }, { name: 'Rodrigo Chape', pos: 'GOL', rating: 46 },
    { name: 'Sandro Chape', pos: 'ZAG', rating: 55 }, { name: 'Valmir Chape', pos: 'ZAG', rating: 54 }, { name: 'Pedro Chape', pos: 'ZAG', rating: 49 },
    { name: 'Wander Chape', pos: 'LAT', rating: 53 }, { name: 'Ricardo Chape', pos: 'LAT', rating: 49 },
    { name: 'Renato Chape', pos: 'MEI', rating: 57 }, { name: 'José Chape', pos: 'MEI', rating: 55 }, { name: 'Marco Chape', pos: 'MEI', rating: 52 }, { name: 'Francisco Chape', pos: 'MEI', rating: 47 },
    { name: 'André Chape', pos: 'ATA', rating: 57 }, { name: 'Dinho Chape', pos: 'ATA', rating: 53 }, { name: 'Léo Chape', pos: 'ATA', rating: 47 },
  ],
  // c22 - Macaca (Ponte Preta)
  [
    { name: 'Ivan Ponte', pos: 'GOL', rating: 57 }, { name: 'Sérgio Ponte', pos: 'GOL', rating: 47 },
    { name: 'Alberto Ponte', pos: 'ZAG', rating: 56 }, { name: 'Lucas Ponte', pos: 'ZAG', rating: 54 }, { name: 'Alex Ponte', pos: 'ZAG', rating: 50 },
    { name: 'Claudinho Ponte', pos: 'LAT', rating: 54 }, { name: 'Vinícius Ponte', pos: 'LAT', rating: 50 },
    { name: 'Fábio Ponte', pos: 'MEI', rating: 57 }, { name: 'Adriano Ponte', pos: 'MEI', rating: 56 }, { name: 'Kleber Ponte', pos: 'MEI', rating: 53 }, { name: 'Max Ponte', pos: 'MEI', rating: 48 },
    { name: 'Chicão Ponte', pos: 'ATA', rating: 57 }, { name: 'Roni Ponte', pos: 'ATA', rating: 53 }, { name: 'Felipe Ponte', pos: 'ATA', rating: 48 },
  ],
  // c23 - Tricolor PR (Paraná Clube)
  [
    { name: 'Marcelo Paraná', pos: 'GOL', rating: 57 }, { name: 'Elias Paraná', pos: 'GOL', rating: 46 },
    { name: 'Ernesto Paraná', pos: 'ZAG', rating: 55 }, { name: 'Ciro Paraná', pos: 'ZAG', rating: 54 }, { name: 'Jair Paraná', pos: 'ZAG', rating: 49 },
    { name: 'Reinaldo Paraná', pos: 'LAT', rating: 54 }, { name: 'Davi Paraná', pos: 'LAT', rating: 49 },
    { name: 'Diego Paraná', pos: 'MEI', rating: 57 }, { name: 'Samuel Paraná', pos: 'MEI', rating: 55 }, { name: 'Nilton Paraná', pos: 'MEI', rating: 52 }, { name: 'Elton Paraná', pos: 'MEI', rating: 47 },
    { name: 'Pedro Paraná', pos: 'ATA', rating: 57 }, { name: 'Ilo Paraná', pos: 'ATA', rating: 53 }, { name: 'Waldo Paraná', pos: 'ATA', rating: 47 },
  ],
  // c24 - Coelho (América-MG)
  [
    { name: 'Gilmar América', pos: 'GOL', rating: 56 }, { name: 'Luís América', pos: 'GOL', rating: 46 },
    { name: 'Marcelo América', pos: 'ZAG', rating: 55 }, { name: 'Paulo América', pos: 'ZAG', rating: 53 }, { name: 'Anderson América', pos: 'ZAG', rating: 49 },
    { name: 'Roberto América', pos: 'LAT', rating: 53 }, { name: 'Moacir América', pos: 'LAT', rating: 49 },
    { name: 'César América', pos: 'MEI', rating: 56 }, { name: 'Odair América', pos: 'MEI', rating: 55 }, { name: 'Everton América', pos: 'MEI', rating: 52 }, { name: 'Sandro América', pos: 'MEI', rating: 47 },
    { name: 'Régis América', pos: 'ATA', rating: 57 }, { name: 'Luiz América', pos: 'ATA', rating: 52 }, { name: 'Dinho América', pos: 'ATA', rating: 47 },
  ],
  // c25 - Figueira (Figueirense)
  [
    { name: 'Thiago Figueira', pos: 'GOL', rating: 56 }, { name: 'Armando Figueira', pos: 'GOL', rating: 46 },
    { name: 'Clênio Figueira', pos: 'ZAG', rating: 56 }, { name: 'Airton Figueira', pos: 'ZAG', rating: 54 }, { name: 'Maurício Figueira', pos: 'ZAG', rating: 49 },
    { name: 'Pedro Figueira', pos: 'LAT', rating: 54 }, { name: 'Dílson Figueira', pos: 'LAT', rating: 49 },
    { name: 'William Figueira', pos: 'MEI', rating: 57 }, { name: 'Valter Figueira', pos: 'MEI', rating: 55 }, { name: 'Neto Figueira', pos: 'MEI', rating: 52 }, { name: 'Sílvio Figueira', pos: 'MEI', rating: 47 },
    { name: 'Jonas Figueira', pos: 'ATA', rating: 57 }, { name: 'Régis Figueira', pos: 'ATA', rating: 52 }, { name: 'Diego Figueira', pos: 'ATA', rating: 47 },
  ],
  // c26 - Tigre (Criciúma)
  [
    { name: 'Dida Criciúma', pos: 'GOL', rating: 57 }, { name: 'Élson Criciúma', pos: 'GOL', rating: 46 },
    { name: 'Neto Criciúma', pos: 'ZAG', rating: 56 }, { name: 'Claudinho Criciúma', pos: 'ZAG', rating: 54 }, { name: 'Cléber Criciúma', pos: 'ZAG', rating: 50 },
    { name: 'Sidinei Criciúma', pos: 'LAT', rating: 54 }, { name: 'Rogério Criciúma', pos: 'LAT', rating: 49 },
    { name: 'Luís Criciúma', pos: 'MEI', rating: 58 }, { name: 'Paulo Criciúma', pos: 'MEI', rating: 56 }, { name: 'Antonio Criciúma', pos: 'MEI', rating: 53 }, { name: 'Eduardo Criciúma', pos: 'MEI', rating: 48 },
    { name: 'Wanderley Criciúma', pos: 'ATA', rating: 58 }, { name: 'José Criciúma', pos: 'ATA', rating: 53 }, { name: 'Fábio Criciúma', pos: 'ATA', rating: 48 },
  ],
  // c27 - Ju (Juventude)
  [
    { name: 'Alisson Ju', pos: 'GOL', rating: 57 }, { name: 'Pedro Ju', pos: 'GOL', rating: 47 },
    { name: 'Fabricio Ju', pos: 'ZAG', rating: 56 }, { name: 'Marcos Ju', pos: 'ZAG', rating: 54 }, { name: 'Diogo Ju', pos: 'ZAG', rating: 50 },
    { name: 'Antônio Ju', pos: 'LAT', rating: 54 }, { name: 'Nilson Ju', pos: 'LAT', rating: 49 },
    { name: 'Renato Ju', pos: 'MEI', rating: 57 }, { name: 'Roger Ju', pos: 'MEI', rating: 56 }, { name: 'Bruno Ju', pos: 'MEI', rating: 53 }, { name: 'Caio Ju', pos: 'MEI', rating: 48 },
    { name: 'Léo Ju', pos: 'ATA', rating: 57 }, { name: 'Wellington Ju', pos: 'ATA', rating: 53 }, { name: 'Guilherme Ju', pos: 'ATA', rating: 48 },
  ],
  // c28 - Galo AL (CSA)
  [
    { name: 'Rafael CSA', pos: 'GOL', rating: 55 }, { name: 'André CSA', pos: 'GOL', rating: 45 },
    { name: 'Carlos CSA', pos: 'ZAG', rating: 54 }, { name: 'Nelson CSA', pos: 'ZAG', rating: 53 }, { name: 'Hélio CSA', pos: 'ZAG', rating: 48 },
    { name: 'Augusto CSA', pos: 'LAT', rating: 53 }, { name: 'Elísio CSA', pos: 'LAT', rating: 48 },
    { name: 'Aloísio CSA', pos: 'MEI', rating: 56 }, { name: 'Valdir CSA', pos: 'MEI', rating: 54 }, { name: 'Luciano CSA', pos: 'MEI', rating: 52 }, { name: 'Djalma CSA', pos: 'MEI', rating: 46 },
    { name: 'Tonhão CSA', pos: 'ATA', rating: 56 }, { name: 'Elias CSA', pos: 'ATA', rating: 52 }, { name: 'Renato CSA', pos: 'ATA', rating: 47 },
  ],
  // c29 - Azulão AL (CRB)
  [
    { name: 'Marcelo CRB', pos: 'GOL', rating: 55 }, { name: 'Sandro CRB', pos: 'GOL', rating: 45 },
    { name: 'Fagner CRB', pos: 'ZAG', rating: 55 }, { name: 'Josemir CRB', pos: 'ZAG', rating: 53 }, { name: 'Wando CRB', pos: 'ZAG', rating: 48 },
    { name: 'Gilvan CRB', pos: 'LAT', rating: 53 }, { name: 'Carlão CRB', pos: 'LAT', rating: 48 },
    { name: 'Rogério CRB', pos: 'MEI', rating: 56 }, { name: 'Márcio CRB', pos: 'MEI', rating: 54 }, { name: 'Jaílton CRB', pos: 'MEI', rating: 52 }, { name: 'Claudinho CRB', pos: 'MEI', rating: 46 },
    { name: 'Dídimo CRB', pos: 'ATA', rating: 56 }, { name: 'Leandro CRB', pos: 'ATA', rating: 52 }, { name: 'Alencar CRB', pos: 'ATA', rating: 47 },
  ],

  // ── DIV 4 CPU ──────────────────────────────────────────────────
  // c30 - Bolívia Q. (Sampaio Corrêa)
  [
    { name: 'João Sampaio', pos: 'GOL', rating: 47 }, { name: 'Luís Sampaio', pos: 'GOL', rating: 38 },
    { name: 'Roberto Sampaio', pos: 'ZAG', rating: 46 }, { name: 'Otávio Sampaio', pos: 'ZAG', rating: 44 }, { name: 'Marco Sampaio', pos: 'ZAG', rating: 40 },
    { name: 'Paulo Sampaio', pos: 'LAT', rating: 44 }, { name: 'Welbert Sampaio', pos: 'LAT', rating: 40 },
    { name: 'Cézar Sampaio', pos: 'MEI', rating: 47 }, { name: 'Derlei Sampaio', pos: 'MEI', rating: 46 }, { name: 'Gilmar Sampaio', pos: 'MEI', rating: 43 }, { name: 'Rogério Sampaio', pos: 'MEI', rating: 38 },
    { name: 'Linivaldo Sampaio', pos: 'ATA', rating: 47 }, { name: 'Paulo Sampaio ATA', pos: 'ATA', rating: 43 }, { name: 'Jaildo Sampaio', pos: 'ATA', rating: 38 },
  ],
  // c31 - Papão (Remo)
  [
    { name: 'Rildo Remo', pos: 'GOL', rating: 47 }, { name: 'Anderson Remo', pos: 'GOL', rating: 38 },
    { name: 'Marcelo Remo', pos: 'ZAG', rating: 46 }, { name: 'Antônio Remo', pos: 'ZAG', rating: 44 }, { name: 'Carlos Remo', pos: 'ZAG', rating: 40 },
    { name: 'Cláudio Remo', pos: 'LAT', rating: 44 }, { name: 'Sandro Remo', pos: 'LAT', rating: 40 },
    { name: 'Paulo Remo', pos: 'MEI', rating: 47 }, { name: 'Rodrigo Remo', pos: 'MEI', rating: 45 }, { name: 'Fábio Remo', pos: 'MEI', rating: 43 }, { name: 'Valdir Remo', pos: 'MEI', rating: 38 },
    { name: 'Elias Remo', pos: 'ATA', rating: 47 }, { name: 'Carlos Remo ATA', pos: 'ATA', rating: 43 }, { name: 'Junior Remo', pos: 'ATA', rating: 38 },
  ],
  // c32 - Leão Azul (Paysandu)
  [
    { name: 'Marcus Paysandu', pos: 'GOL', rating: 47 }, { name: 'Wagner Paysandu', pos: 'GOL', rating: 38 },
    { name: 'Djalma Paysandu', pos: 'ZAG', rating: 46 }, { name: 'Milton Paysandu', pos: 'ZAG', rating: 44 }, { name: 'Elson Paysandu', pos: 'ZAG', rating: 40 },
    { name: 'Bruno Paysandu', pos: 'LAT', rating: 44 }, { name: 'Domingos Paysandu', pos: 'LAT', rating: 39 },
    { name: 'Robson Paysandu', pos: 'MEI', rating: 47 }, { name: 'Felix Paysandu', pos: 'MEI', rating: 45 }, { name: 'Samuel Paysandu', pos: 'MEI', rating: 42 }, { name: 'Arlindo Paysandu', pos: 'MEI', rating: 38 },
    { name: 'Renato Paysandu', pos: 'ATA', rating: 47 }, { name: 'Adilson Paysandu', pos: 'ATA', rating: 43 }, { name: 'Gil Paysandu', pos: 'ATA', rating: 38 },
  ],
  // c33 - Tigre GO (Vila Nova)
  [
    { name: 'Edson Vila', pos: 'GOL', rating: 46 }, { name: 'Luciano Vila', pos: 'GOL', rating: 37 },
    { name: 'Jonas Vila', pos: 'ZAG', rating: 45 }, { name: 'Marquinhos Vila', pos: 'ZAG', rating: 43 }, { name: 'Cleiton Vila', pos: 'ZAG', rating: 39 },
    { name: 'José Vila', pos: 'LAT', rating: 43 }, { name: 'Júlio Vila', pos: 'LAT', rating: 39 },
    { name: 'Wesley Vila', pos: 'MEI', rating: 46 }, { name: 'Rodrigo Vila', pos: 'MEI', rating: 44 }, { name: 'Gustavo Vila', pos: 'MEI', rating: 42 }, { name: 'Heber Vila', pos: 'MEI', rating: 37 },
    { name: 'Rui Vila', pos: 'ATA', rating: 46 }, { name: 'Alessandro Vila', pos: 'ATA', rating: 42 }, { name: 'Leandro Vila', pos: 'ATA', rating: 37 },
  ],
  // c34 - Tubarão (Londrina)
  [
    { name: 'Alex Londrina', pos: 'GOL', rating: 46 }, { name: 'Paulo Londrina', pos: 'GOL', rating: 37 },
    { name: 'Wanderley Londrina', pos: 'ZAG', rating: 45 }, { name: 'Giovani Londrina', pos: 'ZAG', rating: 43 }, { name: 'Sérgio Londrina', pos: 'ZAG', rating: 39 },
    { name: 'Fabíolo Londrina', pos: 'LAT', rating: 43 }, { name: 'Mário Londrina', pos: 'LAT', rating: 39 },
    { name: 'Wilson Londrina', pos: 'MEI', rating: 46 }, { name: 'Diego Londrina', pos: 'MEI', rating: 44 }, { name: 'Rafael Londrina', pos: 'MEI', rating: 41 }, { name: 'Nivan Londrina', pos: 'MEI', rating: 37 },
    { name: 'Osvaldo Londrina', pos: 'ATA', rating: 46 }, { name: 'Carlos Londrina', pos: 'ATA', rating: 42 }, { name: 'Eduardo Londrina', pos: 'ATA', rating: 37 },
  ],
  // c35 - Alvinegro RN (ABC)
  [
    { name: 'Raniel ABC', pos: 'GOL', rating: 46 }, { name: 'Hugo ABC', pos: 'GOL', rating: 37 },
    { name: 'Clévio ABC', pos: 'ZAG', rating: 45 }, { name: 'Alexandre ABC', pos: 'ZAG', rating: 43 }, { name: 'Rildo ABC', pos: 'ZAG', rating: 39 },
    { name: 'Marco ABC', pos: 'LAT', rating: 43 }, { name: 'Clébio ABC', pos: 'LAT', rating: 39 },
    { name: 'Humberto ABC', pos: 'MEI', rating: 46 }, { name: 'Carlos ABC', pos: 'MEI', rating: 44 }, { name: 'Mário ABC', pos: 'MEI', rating: 41 }, { name: 'Elenaldo ABC', pos: 'MEI', rating: 37 },
    { name: 'Zé ABC', pos: 'ATA', rating: 46 }, { name: 'Ivaldo ABC', pos: 'ATA', rating: 42 }, { name: 'Sineide ABC', pos: 'ATA', rating: 37 },
  ],
  // c36 - Gavião Norte (Macapá-AP, Div 4)
  [
    { name: 'Jorge Amapá', pos: 'GOL', rating: 45 }, { name: 'Davi Amapá', pos: 'GOL', rating: 36 },
    { name: 'Raimundo Amapá', pos: 'ZAG', rating: 44 }, { name: 'Cláudio Amapá', pos: 'ZAG', rating: 42 }, { name: 'Adão Amapá', pos: 'ZAG', rating: 38 },
    { name: 'Luís Amapá', pos: 'LAT', rating: 42 }, { name: 'Manoel Amapá', pos: 'LAT', rating: 38 },
    { name: 'Ronaldo Amapá', pos: 'MEI', rating: 45 }, { name: 'Fábio Amapá', pos: 'MEI', rating: 43 }, { name: 'Carlos Amapá', pos: 'MEI', rating: 40 }, { name: 'Paulo Amapá', pos: 'MEI', rating: 36 },
    { name: 'Edson Amapá', pos: 'ATA', rating: 45 }, { name: 'Wagner Amapá', pos: 'ATA', rating: 41 }, { name: 'Nilton Amapá', pos: 'ATA', rating: 36 },
  ],
  // c37 - Estrela PA (Santarém-PA, Div 4)
  [
    { name: 'Marcos Santarém', pos: 'GOL', rating: 45 }, { name: 'Edílson Santarém', pos: 'GOL', rating: 36 },
    { name: 'Orlando Santarém', pos: 'ZAG', rating: 44 }, { name: 'Valdeci Santarém', pos: 'ZAG', rating: 42 }, { name: 'Jânio Santarém', pos: 'ZAG', rating: 38 },
    { name: 'Pedro Santarém', pos: 'LAT', rating: 42 }, { name: 'Ailton Santarém', pos: 'LAT', rating: 38 },
    { name: 'Sérgio Santarém', pos: 'MEI', rating: 45 }, { name: 'Anderson Santarém', pos: 'MEI', rating: 43 }, { name: 'Robson Santarém', pos: 'MEI', rating: 40 }, { name: 'Filemon Santarém', pos: 'MEI', rating: 36 },
    { name: 'Rivaldo Santarém', pos: 'ATA', rating: 45 }, { name: 'Celso Santarém', pos: 'ATA', rating: 41 }, { name: 'Toninho Santarém', pos: 'ATA', rating: 36 },
  ],
  // c38 - Galo PI (Teresina-PI, Div 4)
  [
    { name: 'Antônio Piauí', pos: 'GOL', rating: 45 }, { name: 'Hélio Piauí', pos: 'GOL', rating: 36 },
    { name: 'Francisco Piauí', pos: 'ZAG', rating: 44 }, { name: 'Geraldo Piauí', pos: 'ZAG', rating: 42 }, { name: 'Reginaldo Piauí', pos: 'ZAG', rating: 38 },
    { name: 'Osvaldo Piauí', pos: 'LAT', rating: 42 }, { name: 'Carlos Piauí', pos: 'LAT', rating: 38 },
    { name: 'Gilmar Piauí', pos: 'MEI', rating: 45 }, { name: 'Eduardo Piauí', pos: 'MEI', rating: 43 }, { name: 'Dico Piauí', pos: 'MEI', rating: 40 }, { name: 'Nazário Piauí', pos: 'MEI', rating: 36 },
    { name: 'João Piauí', pos: 'ATA', rating: 45 }, { name: 'Walmir Piauí', pos: 'ATA', rating: 41 }, { name: 'Cícero Piauí', pos: 'ATA', rating: 36 },
  ],
  // c39 - Azul SE (Aracaju-SE, Div 4)
  [
    { name: 'Carlão Sergipe', pos: 'GOL', rating: 45 }, { name: 'Bruno Sergipe', pos: 'GOL', rating: 36 },
    { name: 'Cosme Sergipe', pos: 'ZAG', rating: 44 }, { name: 'Hélio Sergipe', pos: 'ZAG', rating: 42 }, { name: 'Ailton Sergipe', pos: 'ZAG', rating: 38 },
    { name: 'Sinval Sergipe', pos: 'LAT', rating: 42 }, { name: 'Marcos Sergipe', pos: 'LAT', rating: 38 },
    { name: 'Cléber Sergipe', pos: 'MEI', rating: 45 }, { name: 'Paulo Sergipe', pos: 'MEI', rating: 43 }, { name: 'Elias Sergipe', pos: 'MEI', rating: 40 }, { name: 'Vilmar Sergipe', pos: 'MEI', rating: 36 },
    { name: 'Nildo Sergipe', pos: 'ATA', rating: 45 }, { name: 'Rogério Sergipe', pos: 'ATA', rating: 41 }, { name: 'Jonilson Sergipe', pos: 'ATA', rating: 36 },
  ],
]

// Extra bench players generated from era-appropriate name pools
const BENCH_FIRSTS = [
  'Wagner', 'Edson', 'Carlos', 'Adílson', 'Reinaldo', 'Cláudio', 'Jair', 'Nílton',
  'Márcio', 'Willian', 'Felipe', 'Douglas', 'Alessandro', 'Fábio', 'Robson',
]
const BENCH_LASTS = [
  'Neto', 'Filho', 'Júnior', 'Sousa', 'Lima', 'Santos', 'Silva', 'Costa', 'Pereira',
  'Rodrigues', 'Ferreira', 'Alves', 'Carvalho', 'Gomes', 'Araújo',
]
const FILL_POS: Position[] = ['GOL', 'ZAG', 'ZAG', 'LAT', 'MEI', 'MEI', 'ATA', 'ATA', 'ZAG', 'MEI', 'ATA', 'MEI', 'LAT']

function seededPick<T>(arr: T[], seed: number): T {
  return arr[(seed * 7 + 13) % arr.length]
}

function benchName(cpuIdx: number, i: number): string {
  const seed = cpuIdx * 100 + i
  return `${seededPick(BENCH_FIRSTS, seed)} ${seededPick(BENCH_LASTS, seed + 37)}`
}

const DIV_RATINGS: Record<number, number[]> = {
  1: [67, 65, 63, 61, 59, 58, 57, 56, 55, 54, 53, 52, 51],
  2: [57, 55, 53, 51, 49, 48, 47, 46, 45, 44, 43, 42, 41],
  3: [47, 45, 43, 41, 39, 38, 37, 36, 35, 34, 33, 32, 31],
  4: [39, 37, 35, 33, 31, 30, 29, 28, 27, 26, 25, 24, 23],
}

function seededAge(seed: number, min: number, max: number): number {
  return min + (seed * 13 + 7) % (max - min + 1)
}

export function getCpuSquad(cpuIndex: number, division: number): DraftPlayer[] {
  const keys = KEYS[cpuIndex] ?? []
  const result: DraftPlayer[] = keys.map((p, i) => ({
    id: `cpu-${cpuIndex}-${i}`,
    name: p.name,
    pos: p.pos,
    rating: p.rating,
    nationality: 'BR' as const,
    age: seededAge(cpuIndex * 20 + i, 20, 33),
  }))

  const ratings = DIV_RATINGS[division] ?? DIV_RATINGS[4]
  const needed = FILL_POS.slice(0, Math.max(0, 27 - keys.length))
  needed.forEach((pos, i) => {
    result.push({
      id: `cpu-${cpuIndex}-${keys.length + i}`,
      name: benchName(cpuIndex, i),
      pos,
      rating: ratings[i % ratings.length] ?? 30,
      nationality: 'BR' as const,
      age: seededAge(cpuIndex * 20 + keys.length + i + 50, 18, 34),
    })
  })

  return result
}
