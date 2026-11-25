/** Lotes 2 e 3 — 24/11/2026. Somente pessoas reais, fontes por vínculo.
 * Categoria e repertório são curadoria do jogo. Passagem não significa cargo atual.
 */
import type { Tecnico, DivTecnico, EstiloTecnico } from './tecnicos'
import { repertorioInicialTecnico } from './tecnicos-repertorios'

type Cadastro = { nome: string; div: DivTecnico; clube: string; pais: string; referencia: string; fonte: string; nomeCompleto?: string;
  estilo?: EstiloTecnico; preferidas?: string[]; documentadas?: string[]; fontesFormacoes?: string[] }
const ficha = ({ clube, referencia, fonte, estilo = 'equilibrado', preferidas, documentadas, ...t }: Cadastro): Tecnico => ({
  ...t, estilo, chute: estilo === 'equilibrado', formacoes: repertorioInicialTecnico(t.div, estilo, preferidas ?? documentadas),
  ...(documentadas ? { formacoesDocumentadas: documentadas } : {}),
  vinculos: [{ clube, referencia, fonte, tipo: 'historico' }],
})

const LOTE_2: Cadastro[] = [
  {
    "nome": "Zezé Moreira",
    "div": "A",
    "clube": "Cruzeiro",
    "pais": "🇧🇷",
    "referencia": "Comandou o Cruzeiro campeão da Libertadores em 1976.",
    "fonte": "https://www.otempo.com.br/sports/cruzeiro/2026/10/15/dia-do-professor-veja-cinco-tecnicos-que-deixaram-saudades-no-cruzeiro"
  },
  {
    "nome": "Aymoré Moreira",
    "div": "A",
    "clube": "Palmeiras",
    "pais": "🇧🇷",
    "referencia": "Comandou o Palmeiras no Torneio Roberto Gomes Pedrosa de 1967.",
    "fonte": "https://www.palmeiras.com.br/lightbox_galeria/campeonato-brasileiro-1967/"
  },
  {
    "nome": "Otto Glória",
    "nomeCompleto": "Otaviano Martins Glória",
    "div": "B",
    "clube": "Portuguesa",
    "pais": "🇧🇷",
    "referencia": "Passagem documentada pela Portuguesa entre 1973 e 1977.",
    "fonte": "https://www.transfermarkt.com.br/otto-gloria/profil/trainer/32773"
  },
  {
    "nome": "Cláudio Coutinho",
    "nomeCompleto": "Cláudio Pêcego de Moraes Coutinho",
    "div": "B",
    "clube": "Flamengo",
    "pais": "🇧🇷",
    "referencia": "Entrevistado como técnico do Flamengo em 1980.",
    "fonte": "https://placar.com.br/revista/edicao-524/pagina/41/",
    "documentadas": [
      "4-3-3"
    ],
    "fontesFormacoes": [
      "https://trivela.com.br/brasil/claudio-coutinho-80-anos-o-legado-de-um-dos-tecnicos-mais-inovadores-do-futebol-brasileiro/"
    ],
    "estilo": "ofensiva",
    "preferidas": [
      "4-3-3",
      "4-4-2",
      "4-3-1-2",
      "4-2-4",
      "4-2-3-1"
    ]
  },
  {
    "nome": "Sebastião Lazaroni",
    "div": "B",
    "clube": "Vasco",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo comando do Vasco na década de 1980.",
    "fonte": "https://www.zerozero.pt/treinador/sebastiao-lazaroni/494/historia"
  },
  {
    "nome": "Pepe",
    "nomeCompleto": "José Macia",
    "div": "B",
    "clube": "Santos",
    "pais": "🇧🇷",
    "referencia": "Comandou o Santos campeão paulista de 1973.",
    "fonte": "https://www.santosfc.com.br/75974-2/"
  },
  {
    "nome": "Dino Sani",
    "div": "B",
    "clube": "Corinthians",
    "pais": "🇧🇷",
    "referencia": "Registrado como treinador do Corinthians em 1975.",
    "fonte": "https://www.spfcpedia.com.br/enciclopedia/2020/Enciclopedia2020.pdf"
  },
  {
    "nome": "Ricardo Gomes",
    "div": "B",
    "clube": "Vasco",
    "pais": "🇧🇷",
    "referencia": "Apresentado como treinador do Vasco em fevereiro de 2011.",
    "fonte": "https://fferj.com.br/noticias/ricardo-gomes-e-o-novo-tecnico-do-vasco-da-gama"
  },
  {
    "nome": "Enderson Moreira",
    "div": "B",
    "clube": "Botafogo",
    "pais": "🇧🇷",
    "referencia": "Campeão da Série B de 2021 pelo Botafogo.",
    "fonte": "https://www.botafogo.com.br/noticias/mudan-a-no-comando-t-cnico",
    "documentadas": [
      "4-2-3-1"
    ],
    "fontesFormacoes": [
      "https://www.transfermarkt.com.br/enderson-moreira/profil/trainer/8226"
    ]
  },
  {
    "nome": "Marcelo Oliveira",
    "div": "B",
    "clube": "Cruzeiro",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Cruzeiro entre 2013 e 2015.",
    "fonte": "https://ge.globo.com/futebol/times/cruzeiro/noticia/2015/06/urgente-marcelo-oliveira-e-demitido-pelo-presidente-do-cruzeiro.html"
  },
  {
    "nome": "Hélio dos Anjos",
    "div": "C",
    "clube": "Náutico",
    "pais": "🇧🇷",
    "referencia": "Retorno anunciado para a terceira passagem pelo Náutico.",
    "fonte": "https://ge.globo.com/pe/futebol/times/nautico/noticia/nautico-oficializa-contratacao-de-helio-dos-anjos.ghtml"
  },
  {
    "nome": "Dado Cavalcanti",
    "div": "C",
    "clube": "Paysandu",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Paysandu em 2016 e retorno ao clube.",
    "fonte": "https://www.paysandu.com.br/noticias/4574/dado-cavalcanti-e-o-novo-tecnico-do-paysandu"
  },
  {
    "nome": "Roberto Fernandes",
    "div": "D",
    "clube": "Confiança",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Confiança entre 2014 e 2015.",
    "fonte": "https://www.transfermarkt.com.br/roberto-fernandes/profil/trainer/4723"
  },
  {
    "nome": "Eduardo Baptista",
    "div": "C",
    "clube": "Mirassol",
    "pais": "🇧🇷",
    "referencia": "Chegou ao Mirassol em 2020 e foi campeão da Série D.",
    "fonte": "https://www.juventude.com.br/blog/juventude-anuncia-tecnico-eduardo-baptista-para-a-sequencia-da-temporada",
    "documentadas": [
      "4-2-3-1"
    ],
    "fontesFormacoes": [
      "https://ge.globo.com/blogs/especial-blog/painel-tatico/post/organizado-e-moderno-sport-de-2015-ja-e-enorme-parabens-eduardo-baptista.html"
    ]
  },
  {
    "nome": "Fernando Marchiori",
    "div": "D",
    "clube": "ABC",
    "pais": "🇧🇷",
    "referencia": "Campeão potiguar com o ABC em 2022.",
    "fonte": "https://ge.globo.com/rn/futebol/times/abc/noticia/2022/10/17/tecnico-fernando-marchiori-renova-com-abc-para-a-temporada-2023.ghtml"
  },
  {
    "nome": "Márcio Fernandes",
    "div": "C",
    "clube": "Vila Nova",
    "pais": "🇧🇷",
    "referencia": "Campeão da Série C pelo Vila Nova em 2015.",
    "fonte": "https://ge.globo.com/google/amp/go/futebol/times/vila-nova/noticia/vila-nova-contrata-tecnico-marcio-fernandes-campeao-da-serie-c-em-2015.ghtml"
  },
  {
    "nome": "Artur Neto",
    "div": "C",
    "clube": "Joinville",
    "pais": "🇧🇷",
    "referencia": "Passagem documentada pelo Joinville em 2011/2012.",
    "fonte": "https://www.zerozero.pt/treinador/artur-neto/3004/historico-equipas"
  },
  {
    "nome": "Doriva",
    "div": "C",
    "clube": "Ituano",
    "pais": "🇧🇷",
    "referencia": "Campeão paulista pelo Ituano em 2014.",
    "fonte": "https://ge.globo.com/sp/sorocaba/noticia/2014/06/campeao-paulista-com-o-ituano-doriva-e-novo-tecnico-do-atletico-pr.html"
  },
  {
    "nome": "Valmir Louruz",
    "div": "B",
    "clube": "Juventude",
    "pais": "🇧🇷",
    "referencia": "Treinador do Juventude na temporada de 1999.",
    "fonte": "https://www.transfermarkt.com.br/esporte-clube-juventude/mitarbeiterhistorie/verein/10492"
  },
  {
    "nome": "Beto Campos",
    "div": "D",
    "clube": "Novo Hamburgo",
    "pais": "🇧🇷",
    "referencia": "Campeão gaúcho pelo Novo Hamburgo em 2017.",
    "fonte": "https://www.nautico-pe.com.br/index.php/noticias/2684/beto-campos-o-novo-t-cnico-do-n-utico?page=13"
  },
  {
    "nome": "Júnior Rocha",
    "div": "D",
    "clube": "Luverdense",
    "pais": "🇧🇷",
    "referencia": "Levou o Luverdense ao acesso à Série B em 2013.",
    "fonte": "https://ge.globo.com/mt/futebol/times/luverdense/noticia/2014/10/luverdense-dispensa-junior-rocha-auxiliar-tecnico-assume-interinamente.html"
  },
  {
    "nome": "Thiago Carvalho",
    "div": "D",
    "clube": "Aparecidense",
    "pais": "🇧🇷",
    "referencia": "Campeão da Série D pela Aparecidense em 2021.",
    "fonte": "https://ge.globo.com/rs/futebol/brasileirao-serie-d/noticia/2022/05/18/caxias-anuncia-thiago-carvalho-como-tecnico-para-a-sequencia-da-serie-d.ghtml"
  },
  {
    "nome": "Jorge Castilho",
    "div": "D",
    "clube": "Maringá",
    "pais": "🇧🇷",
    "referencia": "Levou o Maringá ao acesso à Série C em 2024.",
    "fonte": "https://ge.globo.com/pr/futebol/times/maringa/noticia/2025/07/31/segundo-tecnico-mais-longevo-do-brasil-jorge-castilho-deixa-o-comando-do-maringa.ghtml"
  },
  {
    "nome": "Roger Machado",
    "div": "C",
    "clube": "Grêmio",
    "pais": "🇧🇷",
    "referencia": "Contratado para comandar o Grêmio em 2015.",
    "fonte": "https://ge.globo.com/rs/futebol/times/gremio/noticia/2015/05/gremio-anuncia-roger-machado-como-tecnico-para-lugar-de-felipao.html",
    "documentadas": [
      "4-2-3-1"
    ],
    "fontesFormacoes": [
      "https://www.transfermarkt.com/roger-machado/leistungsdatenDetail/trainer/32869"
    ]
  },
  {
    "nome": "Odair Hellmann",
    "div": "C",
    "clube": "Internacional",
    "pais": "🇧🇷",
    "referencia": "Efetivado como treinador do Internacional para 2018.",
    "fonte": "https://ge.globo.com/rs/futebol/times/internacional/noticia/identificacao-trabalho-e-carinho-do-grupo-entenda-por-que-o-inter-efetivou-odair.ghtml",
    "documentadas": [
      "4-1-4-1",
      "4-2-3-1"
    ],
    "fontesFormacoes": [
      "https://ge.globo.com/blogs/painel-tatico/post/2022/11/18/o-perfil-tatico-de-odair-hellmann-e-como-ele-pode-montar-o-santos.ghtml"
    ],
    "estilo": "retranca",
    "preferidas": [
      "4-1-4-1",
      "4-2-3-1",
      "4-4-2",
      "4-5-1"
    ]
  },
  {
    "nome": "Juan Pablo Vojvoda",
    "div": "B",
    "clube": "Fortaleza",
    "pais": "🇦🇷",
    "referencia": "Anunciado como treinador do Fortaleza em 2021.",
    "fonte": "https://fortaleza1918.com.br/juan-pablo-vojvoda-e-o-novo-tecnico-do-fortaleza/",
    "documentadas": [
      "3-4-3",
      "3-5-2",
      "4-4-2",
      "4-3-3"
    ],
    "fontesFormacoes": [
      "https://ge.globo.com/pa/futebol/copa-do-brasil/noticia/2023/04/05/momento-forma-de-jogar-e-destaque-saiba-mais-sobre-fortaleza-adversario-do-aguia-na-copa-do-brasil.ghtml"
    ],
    "estilo": "ofensiva",
    "preferidas": [
      "3-4-3",
      "3-5-2",
      "4-3-3",
      "4-4-2",
      "4-2-3-1"
    ]
  },
  {
    "nome": "Pedro Caixinha",
    "div": "C",
    "clube": "Bragantino",
    "pais": "🇵🇹",
    "referencia": "Treinador do Bragantino na temporada de 2023.",
    "fonte": "https://www.redbull.com/br-pt/futebol-conheca-pedro-caixinha-tecnico-red-bull-bragantino",
    "documentadas": [
      "4-3-3"
    ],
    "fontesFormacoes": [
      "https://ge.globo.com/sp/vale-do-paraiba-regiao/futebol/times/bragantino/noticia/2023/01/06/pedro-caixinha-se-diz-satisfeito-com-elenco-mas-aguarda-reforcos-tecnico-promete-bragantino-intenso-em-campo.ghtml"
    ]
  },
  {
    "nome": "Maurício Barbieri",
    "div": "C",
    "clube": "Bragantino",
    "pais": "🇧🇷",
    "referencia": "Contratado pelo Bragantino em setembro de 2020.",
    "fonte": "https://ge.globo.com/sp/vale-do-paraiba-regiao/futebol/times/bragantino/noticia/bragantino-oficializa-contratacao-do-tecnico-mauricio-barbieri.ghtml"
  },
  {
    "nome": "Claudinei Oliveira",
    "div": "D",
    "clube": "Avaí",
    "pais": "🇧🇷",
    "referencia": "Chegou ao Avaí em agosto de 2016.",
    "fonte": "https://avai.com.br/avai-renova-contrato-com-claudinei-oliveira/"
  },
  {
    "nome": "Cláudio Tencati",
    "div": "C",
    "clube": "Londrina",
    "pais": "🇧🇷",
    "referencia": "Título paranaense e acesso à Série C pelo Londrina em 2014.",
    "fonte": "https://ge.globo.com/pr/futebol/times/londrina/noticia/2014/12/londrina-2014-titulo-paranaense-e-acesso-serie-c-do-brasileiro.html"
  },
  {
    "nome": "Umberto Louzer",
    "div": "C",
    "clube": "Chapecoense",
    "pais": "🇧🇷",
    "referencia": "Contratado para comandar a Chapecoense em fevereiro de 2020.",
    "fonte": "https://chapecoense.com/2020/02/17/umberto-louzer-e-o-novo-tecnico-da-chapecoense/"
  },
  {
    "nome": "Gilmar Dal Pozzo",
    "div": "C",
    "clube": "Chapecoense",
    "pais": "🇧🇷",
    "referencia": "Trabalho de destaque na Chapecoense durante a temporada de 2013.",
    "fonte": "https://ge.globo.com/sc/futebol/times/chapecoense/noticia/2013/09/nao-propostas-laco-com-torcida-e-acesso-vista-um-ano-de-dal-pozzo.html"
  },
  {
    "nome": "Luiz Carlos Winck",
    "div": "D",
    "clube": "Caxias",
    "pais": "🇧🇷",
    "referencia": "Comandou o Caxias a partir de setembro de 2016.",
    "fonte": "https://gauchazh.clicrbs.com.br/pioneiro/esportes/noticia/2018/07/tecnico-luiz-carlos-winck-deixa-o-comando-do-caxias-apos-tres-temporadas-10495700.html"
  },
  {
    "nome": "Tcheco",
    "div": "D",
    "clube": "Cascavel",
    "pais": "🇧🇷",
    "referencia": "Contratado para comandar o Cascavel na temporada de 2021.",
    "fonte": "https://ge.globo.com/google/amp/pr/futebol/times/fc-cascavel/noticia/tcheco-e-contratado-como-o-novo-tecnico-do-fc-cascavel-para-2021.ghtml"
  },
  {
    "nome": "Paulo Comelli",
    "div": "D",
    "clube": "Criciúma",
    "pais": "🇧🇷",
    "referencia": "Contratado pelo Criciúma em abril de 2012.",
    "fonte": "https://www.uol.com.br/esporte/futebol/ultimas-noticias/2012/04/19/tecnico-paulo-comelli-deixa-o-crb-e-acerta-com-o-criciuma.htm"
  },
  {
    "nome": "Argel Fucks",
    "div": "C",
    "clube": "Figueirense",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Figueirense registrada no currículo de treinador.",
    "fonte": "https://fnf.org.br/argel-fucks-e-o-novo-treinador-do-america"
  },
  {
    "nome": "Roberto Cavalo",
    "div": "D",
    "clube": "Criciúma",
    "pais": "🇧🇷",
    "referencia": "Retorno ao Criciúma como treinador em outubro de 2015.",
    "fonte": "https://www.criciumaec.com.br/noticias/o-clube/roberto-cavalo-de-volta-do-criciuma"
  },
  {
    "nome": "Alexandre Lopes",
    "div": "D",
    "clube": "Ferroviária",
    "pais": "🇧🇷",
    "referencia": "Conquistou acesso à Série C pela Ferroviária em 2023.",
    "fonte": "https://ge.globo.com/sp/ribeirao-preto-e-regiao/futebol/times/ferroviaria/noticia/2024/01/29/ferroviaria-demite-alexandre-lopes-apos-quatro-jogos-na-a2.ghtml"
  },
  {
    "nome": "Alfredo Sampaio",
    "div": "D",
    "clube": "Madureira",
    "pais": "🇧🇷",
    "referencia": "Comandou o Madureira no título da Taça Rio e final estadual de 2006.",
    "fonte": "https://ge.globo.com/rj/serra-lagos-norte/noticia/2015/10/presidente-do-madureira-confirma-alfredo-sampaio-para-carioca-de-2016.html"
  },
  {
    "nome": "Paulo Bonamigo",
    "div": "C",
    "clube": "Remo",
    "pais": "🇧🇷",
    "referencia": "Comandou o Remo em 24 partidas na temporada de 2021.",
    "fonte": "https://ge.globo.com/google/amp/pa/futebol/times/remo/noticia/caiu-apos-derrota-em-casa-para-o-sampaio-correa-paulo-bonamigo-deixa-o-comando-do-remo.ghtml"
  }
]

const LOTE_3: Cadastro[] = [
  {
    "nome": "Márcio Parreiras",
    "div": "V",
    "clube": "Humaitá",
    "pais": "🇧🇷",
    "referencia": "Vice-campeão acreano pelo Humaitá em 2021 e retorno anunciado para 2025.",
    "fonte": "https://ge.globo.com/ac/futebol/times/humaita/noticia/2024/12/18/humaita-confirma-contratacao-de-treinador-e-coordenador-tecnico-para-proxima-temporada.ghtml"
  },
  {
    "nome": "Sandro Macapá",
    "div": "D",
    "clube": "Trem",
    "pais": "🇧🇷",
    "referencia": "Pentacampeão amapaense consecutivo pelo Trem entre 2021 e 2025.",
    "fonte": "https://ge.globo.com/pi/futebol/copa-do-brasil/noticia/2026/03/05/rival-do-fluminense-pi-na-copa-do-brasil-trem-tem-inicio-irregular-e-tecnico-ha-11-anos-no-cargo.ghtml"
  },
  {
    "nome": "Júlio César Nunes",
    "div": "D",
    "clube": "Manaus",
    "pais": "🇧🇷",
    "referencia": "Anunciado para comandar o Manaus na temporada de 2025.",
    "fonte": "https://ge.globo.com/am/futebol/times/manaus/noticia/2024/10/31/julio-cesar-nunes-ex-tuna-luso-pa-e-o-novo-tecnico-do-manaus.ghtml"
  },
  {
    "nome": "Wellington Fajardo",
    "div": "C",
    "clube": "Manaus",
    "pais": "🇧🇷",
    "referencia": "Integrava o comando técnico do Manaus em fevereiro de 2019.",
    "fonte": "https://nucleofutebol.ufv.br/informativo/aluno-da-especializacao-em-futebol-da-ufv-assume-como-preparador-fisico-do-manaus-futebol-clube/"
  },
  {
    "nome": "Luizinho Vieira",
    "div": "C",
    "clube": "Amazonas",
    "pais": "🇧🇷",
    "referencia": "Campeão da Série C pelo Amazonas em 2023.",
    "fonte": "https://ge.globo.com/am/futebol/times/amazonas-fc/noticia/2024/04/16/amazonas-demite-luizinho-vieira-a-cinco-dias-da-serie-b.ghtml"
  },
  {
    "nome": "Edson Gaúcho",
    "div": "C",
    "clube": "Criciúma",
    "pais": "🇧🇷",
    "referencia": "Campeão da Série B pelo Criciúma como técnico em 2002.",
    "fonte": "https://www.criciuma.com.br/noticias/o-clube/edson-gaucho-e-o-novo-diretor-executivo-do-tigre"
  },
  {
    "nome": "Guilherme Macuglia",
    "div": "D",
    "clube": "Criciúma",
    "pais": "🇧🇷",
    "referencia": "Campeão da Série C pelo Criciúma em 2006.",
    "fonte": "https://fcf.com.br/presidente-da-fcf-recebe-a-diretoria-e-o-novo-tecnico-do-marcilio-dias/"
  },
  {
    "nome": "Givanildo Sales",
    "div": "D",
    "clube": "Confiança",
    "pais": "🇧🇷",
    "referencia": "Apresentado como treinador do Confiança em outubro de 2013.",
    "fonte": "https://jornaldodiase.com.br/givanildo-foi-apresentado-no-confianca/"
  },
  {
    "nome": "Vilson Taddei",
    "div": "D",
    "clube": "Gama",
    "pais": "🇧🇷",
    "referencia": "Bicampeão candango pelo Gama em 2019 e 2020.",
    "fonte": "https://ge.globo.com/df/futebol/times/gama/noticia/2022/12/14/gama-retoma-controle-sobre-inscricoes-de-atletas-e-planeja-temporada-2023.ghtml"
  },
  {
    "nome": "Luan Carlos",
    "div": "D",
    "clube": "CRAC",
    "pais": "🇧🇷",
    "referencia": "Contratado pelo CRAC em fevereiro de 2025.",
    "fonte": "https://ge.globo.com/go/futebol/times/crac/noticia/2025/02/08/crac-demite-alexandre-lopes-e-contrata-tecnico-luan-carlos.ghtml"
  },
  {
    "nome": "Rafael Guanaes",
    "div": "C",
    "clube": "Operário-PR",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Operário-PR entre 2023 e 2024.",
    "fonte": "https://www.transfermarkt.com.br/rafael-guanaes/profil/trainer/65455",
    "documentadas": [
      "3-4-3",
      "4-3-3"
    ],
    "fontesFormacoes": [
      "https://ge.globo.com/google/amp/pr/futebol/times/operario-pr/noticia/2023/01/12/operario-pr-contrata-25-jogadores-e-poe-reformulacao-a-prova-no-paranaense-veja-o-time.ghtml"
    ]
  },
  {
    "nome": "Renatinho Potiguar",
    "div": "D",
    "clube": "Treze",
    "pais": "🇧🇷",
    "referencia": "Comandou o Treze na abertura da temporada de 2025.",
    "fonte": "https://ge.globo.com/pb/futebol/times/treze/noticia/2025/01/19/apos-derrota-no-classico-dos-maiorais-treze-demite-renatinho-potiguar.ghtml"
  },
  {
    "nome": "Paulo Schardong",
    "div": "D",
    "clube": "Sousa",
    "pais": "🇧🇷",
    "referencia": "Campeão paraibano pelo Sousa em 2024.",
    "fonte": "https://ge.globo.com/pb/futebol/times/atletico-pb/noticia/2026/02/05/atletico-pb-anuncia-tecnico-paulo-schardong-campeao-paraibano-sousa-2024.ghtml"
  },
  {
    "nome": "Júnior Amorim",
    "div": "D",
    "clube": "Imperatriz",
    "pais": "🇧🇷",
    "referencia": "Contratado para comandar o Imperatriz na temporada de 2025.",
    "fonte": "https://ge.globo.com/ma/futebol/times/imperatriz/noticia/2024/11/25/imperatriz-anuncia-junior-amorim-como-tecnico-para-2025.ghtml"
  },
  {
    "nome": "João Carlos Ângelo",
    "div": "D",
    "clube": "Juazeirense",
    "pais": "🇧🇷",
    "referencia": "Contratação confirmada pela Juazeirense.",
    "fonte": "https://sdjuazeirense.com.br/sem-demora-juazeirense-confirma-nome-do-novo-treinador/"
  },
  {
    "nome": "Leocir Dall'Astra",
    "div": "D",
    "clube": "Operário-MS",
    "pais": "🇧🇷",
    "referencia": "Bicampeão sul-mato-grossense pelo Operário em 2024 e 2025.",
    "fonte": "https://ge.globo.com/ms/noticia/2025/06/10/raphael-pereira-e-o-novo-tecnico-do-operario-estreia-sera-em-casa.ghtml"
  },
  {
    "nome": "Ricardo Colbachini",
    "div": "D",
    "clube": "Rio Branco-ES",
    "pais": "🇧🇷",
    "referencia": "Contratado pelo Rio Branco-ES para a temporada de 2025.",
    "fonte": "https://site.riobrancoes.com.br/ricardo-colbachini-e-o-novo-treinador-do-rio-branco/"
  },
  {
    "nome": "Caio Zanardi",
    "div": "D",
    "clube": "Boavista-RJ",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Boavista-RJ entre novembro de 2024 e janeiro de 2025.",
    "fonte": "https://www.fotmob.com/es/players/1142449/caio-zanardi"
  },
  {
    "nome": "Reinaldo Oliveira",
    "div": "D",
    "clube": "Maricá",
    "pais": "🇧🇷",
    "referencia": "Comandou o Maricá na tríplice conquista estadual de 2024.",
    "fonte": "https://maricafutebolclube.com/comunicado-oficial/"
  },
  {
    "nome": "Márcio Nunes",
    "div": "D",
    "clube": "Guarany de Bagé",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Guarany de Bagé registrada no currículo.",
    "fonte": "https://ge.globo.com/mt/futebol/times/uniao-rondonopolis/noticia/2025/10/03/uniao-rondonopolis-anuncia-marcio-nunes-como-novo-tecnico-para-2026.ghtml"
  },
  {
    "nome": "William de Mattia",
    "div": "D",
    "clube": "Brasil de Pelotas",
    "pais": "🇧🇷",
    "referencia": "Comandou o Brasil de Pelotas no Gauchão de 2025.",
    "fonte": "https://ge.globo.com/rs/futebol/campeonato-gaucho/noticia/2025/02/13/brasil-de-pelotas-demite-tecnico-apos-derrota.ghtml"
  },
  {
    "nome": "Alessandro Telles",
    "div": "D",
    "clube": "São Luiz-RS",
    "pais": "🇧🇷",
    "referencia": "Campeão da Recopa Gaúcha de 2024 pelo São Luiz.",
    "fonte": "https://ge.globo.com/rs/futebol/campeonato-gaucho/noticia/2025/02/10/proximo-rival-do-inter-sao-luiz-demite-tecnico-e-anuncia-idolo-colorado-iarley.ghtml"
  },
  {
    "nome": "Paulo Henrique Marques",
    "div": "D",
    "clube": "Ypiranga",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo Ypiranga registrada na temporada de 2020.",
    "fonte": "https://www.zerozero.pt/equipa/ypiranga-rs/3541/palmares"
  },
  {
    "nome": "Leandro Zago",
    "div": "D",
    "clube": "Joinville",
    "pais": "🇧🇷",
    "referencia": "Anunciado como treinador do Joinville em 2021.",
    "fonte": "https://ge.globo.com/sc/futebol/times/joinville/noticia/joinville-anuncia-leandro-zago-como-novo-treinador-para-a-temporada.ghtml"
  },
  {
    "nome": "Silas Pereira",
    "div": "D",
    "clube": "Ceará",
    "pais": "🇧🇷",
    "referencia": "Comandou o Ceará campeão da Copa do Nordeste em 2015.",
    "fonte": "https://ge.globo.com/ce/futebol/times/ceara/noticia/2025/04/29/veja-por-onde-andam-os-titulares-que-conquistaram-o-nordestao-de-2015-no-ceara.ghtml"
  },
  {
    "nome": "Duzinho Reis",
    "div": "D",
    "clube": "Real Noroeste",
    "pais": "🇧🇷",
    "referencia": "Tricampeão capixaba consecutivo com o Real Noroeste entre 2021 e 2023.",
    "fonte": "https://realnoroestecapixabafc.com.br/mantido-no-real-noroeste-para-2026-duzinho-reis-e-o-tecnico-mais-longevo-do-brasil/"
  },
  {
    "nome": "Vinícius Eutrópio",
    "div": "C",
    "clube": "Figueirense",
    "pais": "🇧🇷",
    "referencia": "Levou o Figueirense à Série A em 2013 e ao título estadual em 2014.",
    "fonte": "https://ge.globo.com/sc/futebol/times/figueirense/noticia/vinicius-eutropio-e-o-novo-tecnico-do-figueirense.ghtml"
  },
  {
    "nome": "Waguinho Dias",
    "div": "D",
    "clube": "Brusque",
    "pais": "🇧🇷",
    "referencia": "Campeão da Série D pelo Brusque em 2019.",
    "fonte": "https://ge.globo.com/sc/futebol/noticia/campeao-da-serie-d-waguinho-dias-deixa-o-brusque-e-assume-o-criciuma.ghtml"
  },
  {
    "nome": "Daniel Paulista",
    "div": "D",
    "clube": "CRB",
    "pais": "🇧🇷",
    "referencia": "Comandou o CRB na temporada de 2024.",
    "fonte": "https://ge.globo.com/al/arquivo/futebol/times/crb/noticia/2024/09/04/daniel-paulista-nao-e-mais-o-tecnico-do-crb.ghtml"
  },
  {
    "nome": "Gilson Kleina",
    "div": "C",
    "clube": "Ponte Preta",
    "pais": "🇧🇷",
    "referencia": "Levou a Ponte Preta à Série A em 2011.",
    "fonte": "https://ge.globo.com/sp/campinas-e-regiao/futebol/times/ponte-preta/noticia/ponte-fecha-com-gilson-kleina-tecnico-vai-para-a-quinta-passagem-no-clube.ghtml"
  },
  {
    "nome": "Adilson Batista",
    "div": "C",
    "clube": "Cruzeiro",
    "pais": "🇧🇷",
    "referencia": "Levou o Cruzeiro à final da Libertadores em 2009.",
    "fonte": "https://ge.globo.com/futebol/times/cruzeiro/noticia/cruzeiro-inicia-busca-por-novo-treinador-e-ideia-inicial-e-trazer-nome-experiente-veja-opcoes.ghtml"
  },
  {
    "nome": "Alexandre Gallo",
    "div": "D",
    "clube": "Náutico",
    "pais": "🇧🇷",
    "referencia": "Classificou o Náutico à Copa Sul-Americana no trabalho de 2012/2013.",
    "fonte": "https://www.nautico-pe.com.br/noticias/1829/alexandre-gallo-o-novo-t-cnico-do-n-utico"
  },
  {
    "nome": "Milton Mendes",
    "div": "C",
    "clube": "Santa Cruz",
    "pais": "🇧🇷",
    "referencia": "Contratado para comandar o Santa Cruz em março de 2016.",
    "fonte": "https://ge.globo.com/pe/futebol/times/santa-cruz/noticia/2016/03/santa-cruz-acerta-contratacao-do-tecnico-milton-mendes.html"
  },
  {
    "nome": "Sérgio Soares",
    "div": "C",
    "clube": "Bahia",
    "pais": "🇧🇷",
    "referencia": "Contratado para comandar o Bahia na temporada de 2015.",
    "fonte": "https://ge.globo.com/ba/futebol/times/bahia/noticia/2014/12/bahia-confirma-sergio-soares-como-treinador-para-proxima-temporada.html"
  },
  {
    "nome": "Luiz Carlos Cruz",
    "div": "D",
    "clube": "CSE",
    "pais": "🇧🇷",
    "referencia": "Passagem pelo CSE registrada na temporada de 2022.",
    "fonte": "https://www.zerozero.pt/equipa/cse/3218/treinadores"
  },
  {
    "nome": "Ruy Scarpino",
    "div": "D",
    "clube": "Imperatriz",
    "pais": "🇧🇷",
    "referencia": "Campeão maranhense pelo Imperatriz em 2019.",
    "fonte": "https://ge.globo.com/ma/noticia/morre-ruy-scarpino-tecnico-de-titulos-e-acesso-no-futebol-do-maranhao.ghtml"
  },
  {
    "nome": "Márcio Goiano",
    "div": "D",
    "clube": "Figueirense",
    "pais": "🇧🇷",
    "referencia": "Levou o Figueirense à Série A ao final de 2010.",
    "fonte": "https://pt.wikipedia.org/wiki/Lista_de_treinadores_do_Figueirense_Futebol_Clube"
  },
  {
    "nome": "Zé Teodoro",
    "div": "C",
    "clube": "Santa Cruz",
    "pais": "🇧🇷",
    "referencia": "Comandou o Santa Cruz em 2011, com continuidade anunciada para 2012.",
    "fonte": "https://ge.globo.com/pe/futebol/times/santa-cruz/noticia/2011/12/confirmado-ze-teodoro-sera-o-tecnico-do-santa-cruz-em-2012.html"
  },
  {
    "nome": "Oliveira Canindé",
    "div": "D",
    "clube": "América-RN",
    "pais": "🇧🇷",
    "referencia": "Comandou o América-RN na temporada de 2014.",
    "fonte": "https://www.uol.com.br/esporte/futebol/ultimas-noticias/2014/09/10/america-rn-demite-oliveira-caninde-apos-derrota-para-o-oeste.htm"
  },
  {
    "nome": "Ignácio Neto",
    "div": "V",
    "clube": "Tuna Luso",
    "pais": "🇧🇷",
    "referencia": "Comandou a Tuna Luso no mata-mata da Série D de 2025.",
    "fonte": "https://ge.globo.com/pa/futebol/times/tuna-luso/noticia/2025/07/31/na-primeira-temporada-como-tecnico-principal-ignacio-neto-lidera-tuna-no-mata-mata-da-serie-d.ghtml"
  }
]

export const TECNICOS_BRASIL_LOTE_2: Tecnico[] = LOTE_2.map(ficha)
export const TECNICOS_BRASIL_LOTE_3: Tecnico[] = LOTE_3.map(ficha)

