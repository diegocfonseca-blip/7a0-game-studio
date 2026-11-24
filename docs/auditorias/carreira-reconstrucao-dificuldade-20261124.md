# Revisão da dificuldade: reconstrução do elenco e funil competitivo

> Correção posterior de método: o ator desta bancada usava notas/categorias ocultas na avaliação das ofertas. Estes resultados são diagnósticos de uma política com informação privilegiada, não estimativas de gestão humana comum. A comparação com ator de informação pública, alternativas testadas e limites está em [carreira-alternativas-classica-20261124.md](carreira-alternativas-classica-20261124.md).


**Direção posterior:** Diego pediu deixar a parte incompleta de classificação/inscrições como está e concentrar a recomendação na facilidade de evolução do elenco com gestão normal. A pendência regulamentar documentada abaixo não autoriza sua implementação agora nem deve ser oferecida como solução principal.

Diego rejeitou considerar satisfatória a facilidade de chegar à A em5–6temporadas e esclareceu que o foco é a gestão normal, com compras e vendas. O controle sem compras é somente auxiliar. Não tratar a revisão de mercado já implementada como solução aprovada da dificuldade, nem publicar com essa justificativa.

## Evidência principal: três carreiras com gestão

Dados da versão local com mercado universal, fonte SHA256 `9a154a758d245b62964015c3d631b4e1276c9ad7c955604f657d47e18259d5f0`. As três trajetórias completas já existiam; esta revisão examina composição do XI, e não apenas temporada de acesso.

| Semente | Estreia A | Força inicial | Força na estreia A* | Titulares iniciais ainda no XI-base da estreia | Caixa antes de jogar a A | Folha anual de atletas |
|---:|---:|---:|---:|---:|---:|---:|
| 20261123 | T6 | 76,64 | 76,36 | 10/11 | 215 | 52 |
| 7919001 | T5 | 76,64 | 75,77 | 10/11 | 338 | 47 |
| 871217 | T5 | 76,64 | 77,05 | 10/11 | 444 | 44 |

*Média lo/hi do XI da última rodada daquela temporada, conforme a bancada; inclui escolhas de rodízio, não é a força de todos os jogos nem apenas um efeito de contratação. A retenção usa o XI-base registrado na tabela daquela temporada. O reserva ter sido contratado não significa que substituiu um titular.

Nos XIs-base de estreia, o único nome novo era respectivamente André Santos, Isla e Miguel Trauco. Muca, Ceci, Nena, Noronha, Brandãozinho, Ipojucan, Zinho/Portuguesa, Julinho, Pinga/Portuguesa e Enéas eram iniciais. Houve negociação e montagem de banco, mas pouca substituição do núcleo titular. Não afirmar que cada chegada ao elenco foi evolução importante de força.

O caixa não obriga reconstrução nesses casos: a equipe já competitiva precisa de poucos reforços. O saldo sozinho não prova erro econômico; a comparação acima exclui comissão, renovações e outras despesas. A carência atéT3 continua sendo regra existente e não foi alterada.

## Força relativa já na largada

Primeira semente, mesma fotografia e mesmo método de XI:

| Divisão | Média dos XIs | Clubes com XI abaixo da Portuguesa inicial |
|---|---:|---:|
| A | 80,75 | 5 de20 |
| B | 69,98 | 19 de20 |
| C | 66,01 | 19 de20 |
| D | 61,43 | 95 de96 |

Nas outras duas sementes, a Portuguesa inicial supera18/20daB,19/20daC e94/96daD. A comparação é da largada; os adversários mudam depois por acesso/rebaixamento. Não confundir essa régua com a B encontrada anos depois.

Isso identifica o problema de projeto: a divisão atual do clube não representa a capacidade do elenco histórico recebido. O mercado mais competente corrige uma assimetria de gestão, mas não retira essa força já pronta. A diferença não é explicada somente por Julinho.

A pesquisa histórica confirma a qualidade real da Portuguesa1951–55: elenco campeão do Rio–São Paulo com vários grandes jogadores. A fonte valida identidade e relevância, não uma nota numérica específica. Não existe fundamento para inventar que esses históricos eram fracos apenas para aumentar o tempo de carreira.

Fonte: Trivela/Imortais,18/07/2022, [A Portuguesa que marcou seu nome na história de1951a1955](https://trivela.com.br/imortais-do-futebol/imortais-do-futebol-a-portuguesa-que-marcou-seu-nome-na-historia-de-1951-a-1955/).

## Funil nacional ainda provisório

`promocoesOficial`, em `pyramidseason.tsx`, preserva os times daD que não sobem, recebe os rebaixados daC e, se houver vaga, completa até96 com clubes de fora sorteados por semente. O próprio comentário reconhece a falta da classificação pelos estaduais.

Isso não equivale à regra real de participação seguinte. NaD2026, os32que chegam à terceira fase garantem participação mínima em2027, salvo os promovidos; os demais não recebem essa garantia pela campanha naD. Eles podem voltar por outro critério válido, não devem ser excluídos automaticamente. É necessário fechar inscrições com os critérios esportivos, estaduais e distribuição documentada, sem sorteio de conveniência.

Fontes primárias:

- CBF,30/06/2026: [Série D define32classificados e os confrontos da terceira fase](https://www.cbf.com.br/futebol-brasileiro/noticias/campeonato-brasileiro/campeonato-brasileiro-serie-d/serie-d-define-32-classificados-e-os-confrontos-da-terceira-fase).
- [Regulamento específico da Série D2026](https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/REC_Brasileiro_Serie_D_2026_2def4ff8f2.pdf), artigo20, separa a classificação dos eliminados:33–64na segunda fase,17–32na terceira,9–16nas oitavas, com regras próprias para os playoffs.

Essa pendência afeta o mundo inteiro e as receitas/oportunidades nacionais dos clubes, sem precisar retirar jogadores. **Não é solução suficiente para as três Portuguesas:** a primeira terminou aD inicial em33º e precisaria de outra rota para retornar; as outras já estavam entre os classificados garantidos ou conseguiram acesso. Não prometer que corrigir a inscrição fará todas demorarem mais.

Não foi implementada uma retirada automática dos piores64: faltam integrar as rotas corretas e fechar cobertura dos estaduais. Usar apenas posição final seria outra regra falsa e poderia excluir clube que se classificou por seu estadual. A revisão ampla anterior ainda possui dez estaduais pendentes.

## Referência da vida real

CSA disputou aD em2016 e aA em2019. Chapecoense, Joinville, Santa Cruz e Mirassol fizeram trajetórias de aproximadamente cinco anos entre disputar aD e estrear naA. Portanto, uma trajetória em5–6temporadas é possível; não é correto proibi-la por definição.

Por outro lado, o estudo Convocados/XP divulgado em2022 contou seis casos de chegada àA entre267clubes que tinham disputado aD desde2009. Esse recorte histórico não é a probabilidade de um humano experiente, não tem horizonte fixo de12anos e não representa especificamente a Portuguesa com históricos. Não usá-lo como uma meta automática de2%para o jogo.

Fontes: [ge,17/06/2022, funil daD àA](https://ge.globo.com/pe/futebol/noticia/2022/06/17/um-funil-estudo-mostra-que-so-2percent-dos-times-deixaram-a-serie-d-rumo-a-elite-do-futebol-brasileiro.ghtml); [ge,25/11/2018, três acessos doCSA](https://ge.globo.com/al/arquivo/futebol/times/csa/noticia/2018/11/25/da-d-para-a-csa-e-o-primeiro-clube-do-brasil-com-tres-acessos-nacionais-seguidos.ghtml); [ge,11/09/2026, oito trajetórias](https://ge.globo.com/google/amp/al/futebol/brasileirao-serie-d/noticia/2026/09/11/conheca-os-oito-clubes-que-passaram-pela-serie-d-e-chegaram-a-elite-do-futebol-brasileiro.ghtml). O último texto contém uma cronologia inconsistente do Cuiabá; não reproduzir esse trecho.

## Critério de revisão e trabalho ainda necessário

1. Avaliar composição, posições, categorias e faixas de força de todos os elencos de largada, comparando os catálogos históricos/regionais com os complementos da carreira. Aplicar a mesma régua a humano e bots. Identificar distorções específicas antes de alterar notas; não dar força arbitrária ao bot por divisão ou enfraquecer um histórico para cumprir um prazo.
2. Medir reconstrução de verdade: ganho do XI, melhora por posição, profundidade utilizada, custos de contratação/renovação e alternativas disponíveis no mercado. Contagem de compras ou dinheiro acumulado não equivale a uma equipe mais forte.
3. Concluir inscrições daD pelos critérios reais e integração com estaduais, preservando elencos e edições em andamento. A ausência de divisão nacional não pode ser tratada como Várzea fictícia nem causar desaparecimento do clube/jogadores.
4. Validar a curva com clubes inicialmente fortes e fracos e gestão normal em várias políticas, além de completar o calendário físico intercalado. Não introduzir derrotas, prazo obrigatório, retirada de histórico ou bônus oculto para obter um número desejado.

**Conclusão de escopo:** a gestão universal foi implementada e passou em suas verificações, mas não resolveu nem demonstrou resolvida a dificuldade de construção do elenco solicitada por Diego. A meta de reconstrução não pode ser anunciada como concluída. Preservar as mudanças já autorizadas; balanceamento reaberto, sem nova mudança de nota ou regra de inscrição publicada nesta revisão.

## Controle auxiliar executado nesta revisão

Três novas carreiras da Portuguesa, mesmos sorteios da comparação, mantendo e renovando todos os iniciais, sem compras/nova comissão: estreiasA T10/T11/T4. Na estreia, posições20º/17º/20º, todas rebaixadas. Esse resultado mostra variação entre campanhas e que é possível subir com o elenco herdado; não substitui a análise de gestão normal, que é o pedido principal.

Dados: `/workspace/shared/portuguesa-sem-reforcos-20261124/repeticao.json`; `/workspace/shared/carreira-revisao-dificuldade-20261124/forca-progressao.json`. Mantidos os limites da bancada anual: copas calculadas após a liga, política/rotação automáticas, reprodução parcial de eventos/lesões e horizonte limitado. Nenhum acesso indevido ou ajuste especial contra/para a Portuguesa foi inserido.
