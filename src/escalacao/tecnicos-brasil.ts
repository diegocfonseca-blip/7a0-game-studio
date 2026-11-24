/** 24/11/2026 — primeiro lote pesquisado, autorizado pelo Diego.
 * Categoria é classificação de JOGO, não a divisão real do clube nem uma
 * informação atribuída à fonte. Sem pesquisa tática, perfil neutro explícito.
 * Passagem de 2025 não é anunciada como emprego atual em novembro de 2026.
 * Fontes e limites completos: docs/tecnicos-brasil-20261124.md.
 */
import type { DivTecnico, Tecnico, VinculoTecnico } from './tecnicos'

const LISTA_2025 = 'https://www.cnnbrasil.com.br/esportes/brasileirao/serie-d-do-brasileirao-ja-tem-todos-os-64-tecnicos-definidos-veja-lista/'
const vinculo = (clube: string, referencia: string, fonte: string, tipo: VinculoTecnico['tipo'] = 'historico'): VinculoTecnico => ({ clube, referencia, fonte, tipo })
const novo = (nome: string, div: DivTecnico, vinculos: VinculoTecnico[], nomeCompleto?: string): Tecnico => ({
  nome, pais: '🇧🇷', div, estilo: 'equilibrado', chute: true, vinculos, ...(nomeCompleto ? { nomeCompleto } : {}),
})
const passagem2025 = (clube: string) => vinculo(clube, 'Comando anunciado para a temporada de 2025; não é confirmação de cargo atual.', LISTA_2025, 'passagem')

export const NOVOS_TECNICOS_BRASIL: Tecnico[] = [
  novo('Lula', 'A', [vinculo('Santos', 'Comandante da geração bicampeã da Libertadores e do Mundial nos anos 1960.', 'https://www.santosfc.com.br/vamos-falar-de-hegemonia/')], 'Luís Alonso Pérez'),
  novo('Oswaldo Brandão', 'A', [vinculo('Palmeiras', 'Treinador histórico da Academia e recordista de partidas pelo clube.', 'https://www.palmeiras.com.br/tecnicos-historia/')]),
  novo('Rubens Minelli', 'A', [vinculo('Internacional', 'Campeão brasileiro em 1975 e 1976.', 'https://www.saopaulofc.net/nota-de-pesar-rubens-minelli/'), vinculo('São Paulo', 'Campeão brasileiro em 1977.', 'https://www.saopaulofc.net/enciclopedia-tecnicos-titulos/')]),
  novo('Ênio Andrade', 'A', [vinculo('Coritiba', 'Campeão brasileiro em 1985.', 'https://terceirotempo.uol.com.br/que-fim-levou/enio-andrade-3190'), vinculo('Internacional', 'Campeão brasileiro invicto em 1979.', 'https://terceirotempo.uol.com.br/que-fim-levou/enio-andrade-3190'), vinculo('Grêmio', 'Campeão brasileiro em 1981.', 'https://www.gremiopedia.com.br/wiki/%C3%8Anio_Andrade')]),
  novo('Valdir Espinosa', 'A', [vinculo('Grêmio', 'Campeão da Libertadores e do Mundial de 1983.', 'https://gremio.net/herois/heroi/18')]),
  novo('Abel Braga', 'A', [vinculo('Fluminense', 'Campeão brasileiro em 2012.', 'https://fluminense.com.br/noticia/flu-x-gremio-poe-frente-a-frente-treinadores-com-alma-tricolor')]),
  novo('Paulo César Carpegiani', 'A', [vinculo('Flamengo', 'Campeão da Libertadores e do Mundial de 1981 e do Brasileiro de 1982.', 'https://www.museuflamengo.com.br/heroi/Carpegiani?type=A-H')]),
  novo('Carlos Alberto Silva', 'B', [vinculo('Guarani', 'Campeão brasileiro em 1978, homenageado com busto no clube.', 'https://guaranifc.com.br/futebol-profissional/carlos-alberto-silva-sera-eternizado-com-busto-no-brinco-de-ouro/')]),
  novo('Evaristo de Macedo', 'B', [vinculo('Bahia', 'Campeão brasileiro em 1988.', 'https://www.esporteclubebahia.com.br/tecnicos/')]),
  novo('Jorginho Cantinflas', 'C', [vinculo('Portuguesa', 'Treinador da Barcelusa campeã da Série B de 2011.', 'https://www.juventus.com.br/2023/02/diretoria-juventina-anuncia-a-contratacao-do-tecnico-jorginho/')], 'Jorge Luís da Silva'),
  novo('Gerson Gusmão', 'C', [vinculo('Operário-PR', 'Campeão da Série D de 2017 e da Série C de 2018.', 'https://ge.globo.com/pr/futebol/times/operario-pr/noticia/gerson-gusmao-e-demitido-do-operario-pr-apos-mais-de-quatro-anos-no-cargo.ghtml')]),
  novo('Marcelo Veiga', 'C', [vinculo('Botafogo-SP', 'Campeão da Série D de 2015.', 'https://botafogofutebolsa.com.br/campeao-brasileiro-da-serie-d-marcelo-veiga-morre-aos-56-anos/')]),
  novo('Hemerson Maria', 'C', [vinculo('Joinville', 'Campeão da Série B em 2014.', 'https://v2.jec.com.br/2015/05/06/vai-comecar-agora-e-serie-a/')]),
  novo('Léo Condé', 'C', [vinculo('Vitória', 'Campeão da Série B em 2023 e do Baiano em 2024.', 'https://ge.globo.com/ba/futebol/times/vitoria/noticia/2024/04/07/apos-segundo-titulo-com-o-vitoria-leo-conde-mira-bom-trabalho-na-serie-a-cartao-de-visitas.ghtml')]),
  novo('Flávio Araújo', 'C', [vinculo('Sampaio Corrêa', 'Campeão da Série D de 2012.', 'https://ge.globo.com/pi/futebol/noticia/2025/10/31/tecnico-flavio-araujo-aumenta-lista-de-acessos-na-carreira-com-estreante-teresina-veja-historico.ghtml'), vinculo('CSA', 'Campeão da Série C de 2017.', 'https://ge.globo.com/al/arquivo/futebol/times/csa/noticia/2023/04/19/veja-onde-estao-os-11-titulares-do-csa-na-finalissima-da-serie-c-em-2017.ghtml')]),
  novo('Paulo Roberto Santos', 'D', [vinculo('São Bento', 'Quatro acessos pelo clube, incluindo Série D e Série C.', 'https://ge.globo.com/sp/tem-esporte/futebol/times/sao-bento/noticia/2023/03/23/sao-bento-oficializa-saida-do-tecnico-paulo-roberto-santos-respeito-e-admiracao-por-toda-a-historia.ghtml')]),
  novo('Luiz Carlos Martins', 'D', [vinculo('Noroeste', 'Campeão da Paulista A3 e acesso em 2022.', 'https://ge.globo.com/sp/tem-esporte/futebol/times/noroeste/noticia/2023/01/25/apos-terceira-derrota-em-quatro-jogos-na-serie-a2-noroeste-demite-o-tecnico-luiz-carlos-martins.ghtml')]),
  novo('Rogério Zimmermann', 'D', [vinculo('Brasil de Pelotas', 'Longa passagem com três acessos e 408 partidas.', 'https://www.lance.com.br/futebol-nacional/apos-mais-cinco-anos-zimmermann-deixa-comando-brasil-pel.html')]),
  novo('Adelson de Almeida', 'D', [vinculo('Ceilândia', 'Longa trajetória e conquistas no comando do clube desde 2001.', 'https://www.ceilandiaec.com.br/tag/adelson-de-almeida/')]),
  novo('Itamar Schülle', 'C', [vinculo('Retrô', 'Campeão da Série D de 2024.', 'https://retrofcbrasil.com.br/noticia/retro-e-campeao-da-serie-d-2024'), passagem2025('Santa Cruz')]),
  novo('Marcelo Vilar', 'D', [vinculo('Botafogo-PB', 'Campeão da Série D de 2013.', 'https://ge.globo.com/pb/futebol/times/botafogo-pb/noticia/botafogo-pb-anuncia-marcelo-vilar-como-treinador-para-a-temporada-2021.ghtml'), passagem2025('Manauara')]),
  novo('Arnaldo Lira', 'D', [vinculo('Bahia de Feira', 'Campeão baiano em 2011.', 'https://ge.globo.com/futebol/times/horizonte/noticia/2015/01/campeao-baiano-arnaldo-lira-quer-repetir-receita-gloriosa-no-horizonte.html'), passagem2025('Parnahyba')]),
  novo('Francisco Diá', 'D', [vinculo('Sampaio Corrêa', 'Título estadual e acesso à Série B em 2017.', 'https://www.sampaiocorreafc.com.br/comando-experiente/'), passagem2025('Altos')]),
  novo('Leandro Campos', 'D', [vinculo('ABC', 'Campeão da Série C em 2010.', 'https://ge.globo.com/rn/abc-100-anos/noticia/2015/06/em-2010-abc-coloca-o-rio-grande-do-norte-no-rol-dos-campeoes-nacionais.html'), passagem2025('Horizonte')]),
  novo('Paulo Foiani', 'D', [vinculo('Sousa', 'Campeão paraibano em 2025.', 'https://ge.globo.com/pb/futebol/times/sousa/noticia/2025/03/30/titulo-paraibano-com-o-sousa-e-o-quarto-na-carreira-de-paulo-foiani-como-tecnico.ghtml')]),
  novo('Ranielle Ribeiro', 'D', [vinculo('Campinense', 'Dois títulos estaduais e acesso em pouco mais de um ano.', 'https://ge.globo.com/pb/futebol/times/campinense/noticia/2022/05/24/tres-finais-dois-titulos-e-um-acesso-em-pouco-mais-de-um-ano-o-efeito-ranielle-ribeiro-no-campinense.ghtml'), passagem2025('ASA')]),
  novo('Leston Júnior', 'D', [vinculo('Floresta', 'Trajetória com acesso à Série C e contrato renovado para 2027.', 'https://florestaesporteclube.com.br/2026/10/20/leston-junior-renova-contrato-e-seguira-no-floresta-para-a-temporada-2027/')]),
  novo('Felipe Surian', 'D', [vinculo('Volta Redonda', 'Campeão invicto da Série D e da Taça Rio em 2016.', 'https://www.fferj.com.br/noticias/felipe-surian-retorna-ao-voltaco'), passagem2025('Sampaio Corrêa')]),
  novo('Paulinho Kobayashi', 'D', [vinculo('Ferroviário-CE', 'Campeão invicto da Série D em 2023.', 'https://ge.globo.com/ce/futebol/times/ferroviario/noticia/2023/09/17/com-titulo-ciel-festeja-melhor-temporada-da-carreira.ghtml'), passagem2025('Capital')]),
  novo('Silvio Criciúma', 'D', [vinculo('Águia de Marabá', 'Campeão da Copa Grão Pará em 2025.', 'https://caravaggiofc.com.br/silvio-criciuma-e-o-novo-tecnico-do-caravaggio/'), vinculo('Goiás', 'Campeão goiano em 2017.', 'https://caravaggiofc.com.br/silvio-criciuma-e-o-novo-tecnico-do-caravaggio/')], 'Silvio Nicoladelli'),
  novo('Ailton Silva', 'D', [vinculo('Itabaiana', 'Finalista estadual em 2017, em passagem de destaque pelo clube.', 'https://ge.globo.com/se/futebol/times/itabaiana/noticia/2017/04/em-2-passagem-por-sergipe-ailton-silva-pode-ser-de-novo-campeao.html'), passagem2025('Sergipe')]),
  novo('Felipe Conceição', 'C', [vinculo('América-MG', 'Campanha de destaque na Série B de 2019.', 'https://ge.globo.com/sc/futebol/times/chapecoense/noticia/chapecoense-avanca-por-felipe-conceicao-e-encaminha-contratacao-do-treinador.ghtml'), passagem2025('Inter de Limeira')]),
  novo('Marcelo Cabo', 'C', [vinculo('Atlético-GO', 'Campeão da Série B de 2016.', 'https://ge.globo.com/go/futebol/times/atletico-go/noticia/atletico-go-oficializa-a-contratacao-do-tecnico-marcelo-cabo.ghtml'), passagem2025('Água Santa')]),
  novo('Leandro Sena', 'D', [vinculo('América-RN', 'Campeão da Série D de 2022.', 'https://ge.globo.com/rn/futebol/times/america-rn/noticia/2022/09/30/america-rn-oficializa-renovacao-de-tecnico-campeao-da-serie-d-para-a-temporada-2023.ghtml'), passagem2025('União Rondonópolis')]),
  novo('Marcelo Caranhato', 'D', [vinculo('Cianorte', 'Trabalho entre 2016 e 2018, terceiro no Paranaense e terceira fase da Copa do Brasil.', 'https://oparana.com.br/esportes/futebol-paranaense-fc-cascavel-apresenta-o-tecnico-marcelo-caranhato/'), passagem2025('Luverdense')], 'Marcelo Fidelcino Caranhato'),
  novo('Carlos Vitor', 'D', [vinculo('Nova Iguaçu', 'Vice-campeão carioca na campanha histórica de 2024.', 'https://www.rj.gov.br/radioroquettepinto/node/14108')]),
  novo('Jerson Testoni', 'D', [vinculo('Brusque', 'Conduziu o acesso à Série B em 2020.', 'https://jec.com.br/jerson-testoni-e-o-novo-tecnico-do-jec/'), passagem2025('Cianorte')]),
  novo('Eduardo Souza', 'D', [vinculo('Barra', 'Campeão da Série D em 2025 e catarinense em 2026.', 'https://ge.globo.com/sp/tem-esporte/futebol/times/noroeste/noticia/2026/10/21/noroeste-anuncia-eduardo-souza-como-tecnico-para-o-paulistao.ghtml'), vinculo('Noroeste', 'Anunciado em outubro de 2026 para o Paulistão de 2027.', 'https://ge.globo.com/sp/tem-esporte/futebol/times/noroeste/noticia/2026/10/21/noroeste-anuncia-eduardo-souza-como-tecnico-para-o-paulistao.ghtml', 'atual')]),
  novo('Betinho', 'D', [vinculo('Lagarto', 'Vice-campeão estadual em 2021 e retorno anunciado em 2025.', 'https://ge.globo.com/se/futebol/times/lagarto/noticia/2025/02/04/lagarto-anuncia-betinho-como-novo-treinador-da-equipe.ghtml')], 'Gilberto Carlos do Nascimento'),
  novo('Álvaro Miguéis', 'V', [vinculo('Independência', 'Campeão acreano em 2025.', 'https://ge.globo.com/google/amp/ac/futebol/campeonato-acreano/noticia/2025/04/01/alvaro-migueis-se-torna-tecnico-mais-vezes-campeao-acreano-na-era-profissional.ghtml')]),
]

/** Nomes já existentes conservam categoria, faixa e identidade no save. */
export const VINCULOS_TECNICOS_BRASIL: Record<string, VinculoTecnico[]> = {
  'Telê Santana': [vinculo('São Paulo', 'Bicampeão da Libertadores e do Mundial em 1992/1993.', 'https://www.saopaulofc.net/81-anos-de-mestre-tele/')],
  'Abel Ferreira': [vinculo('Palmeiras', 'Trajetória multicampeã e recorde de permanência em uma passagem.', 'https://www.palmeiras.com.br/comissao-tecnica/tecnico/')],
  'Jorge Jesus': [vinculo('Flamengo', 'Comandante da equipe de 2019.', 'https://ge.globo.com/futebol/times/flamengo/noticia/rodolfo-landim-fecha-acordo-e-jorge-jesus-e-o-novo-tecnico-do-flamengo.ghtml')],
  'Luiz Felipe Scolari': [vinculo('Palmeiras', 'Três passagens vitoriosas, incluindo Libertadores de 1999.', 'https://www.palmeiras.com.br/tecnicos-historia/')],
  'Rogério Ceni': [vinculo('Fortaleza', 'Campeão da Série B em 2018.', 'https://fortaleza1918.com.br/fortaleza-oficializa-renovacao-de-contrato-com-treinador-rogerio-ceni/')],
}
