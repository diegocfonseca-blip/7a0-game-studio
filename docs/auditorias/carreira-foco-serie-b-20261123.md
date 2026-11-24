# Portuguesa: investigação do acesso B → A

Pedido de Diego: aprofundar a análise do acesso rápido, preservando os históricos no time. Esta é uma investigação local sobre a revisão já existente; não publica, não altera contas, não muda overalls, não bloqueia Julinho e não muda a carência salarial.

## O que foi executado

- Repetição instrumentada das dez carreiras da Portuguesa: **70 temporadas**, incluindo **23 temporadas na B antes do primeiro acesso à A**. Fotografia de cada passagem pela B contém elencos, escalações, condição, técnicos, caixa e tabela. A instrumentação não muda entradas nem decisões.
- Conferência de reprodução contra a rodada anterior de dez carreiras, incluindo divisões, posições, pontos, gols, força, caixa e identidades dos elencos: **passou nas 70 temporadas**. Mesma versão de produto, identificada pelo hash do relatório original.
- Controles de uma temporada a partir da fotografia da primeira B: reprodução do futebol físico; substituição apenas do cálculo físico pelo cálculo leve; retirada do técnico humano; retirada dos modificadores de condição dos dois lados, preservando as escalações/rodízio. A remoção do técnico é uma comparação experimental, não proposta para o produto.
- Em quatro fotografias, seis sementes alternativas de liga por fotografia: **24 campanhas isoladas** com os mesmos elencos/condição/técnicos. Não são carreiras novas ou temporadas consecutivas. O sorteio/seed dos playoffs fica o da fotografia; essas campanhas não estimam uma probabilidade geral de acesso.
- Três carreiras contrafactuais: estender a rotina de banco/reforços existente às outras divisões em cada janela, na ordem A/B/C/D, pagando com caixa real, respeitando categorias e sem criar atletas ou alterar sua força. É uma intervenção em várias equipes e no mercado compartilhado; diferenças de trajetória não isolam um único adversário.

Scripts: `scripts/auditoria-serie-d/repeticao.mts` (instrumentação opcional), `foco-b-controles.mts`, `resume-foco-b.py`. Dados: `/workspace/shared/carreira-foco-b-20261123/`. Limites da simulação anual original permanecem: copas calculadas depois da liga, política conservadora única e reprodução parcial dos eventos/lesões, sem todos os cliques humanos ou todas as fases físicas intercaladas.

## Onde ocorre a vantagem

| Semente | Primeira B | Posição nessa B | Ranking de força nessa B | Temporadas na B até subir | Estreia A |
|---:|---:|---:|---:|---:|---:|
| 20261123 | T3 | 2º | 2º | 1 | T4 |
| 7919001 | T4 | 2º | 4º | 1 | T5 |
| 871217 | T4 | 8º | 2º | 3 | T7 |
| 20332403 | T3 | 5º | 1º | 4 | T7 |
| 31892031 | T3 | 4º | 1º | 3 | T6 |
| 42771721 | T4 | 2º | 2º | 1 | T5 |
| 54183913 | T4 | 7º | 5º | 2 | T6 |
| 68218117 | T4 | 6º | 1º | 3 | T7 |
| 77323109 | T5 | 3º | 2º | 4 | T9 |
| 89117321 | T3 | 1º | 1º | 1 | T4 |

Quatro subiram na primeira tentativa na B; seis precisaram de duas a quatro temporadas. A mediana da permanência até o primeiro acesso é 2,5 temporadas. **Oito das dez estreias na B já tinham um dos dois melhores XIs daquela edição; todas estavam entre os cinco melhores.** Ranking de força usa média lo/hi do XI, não é uma previsão exata do resultado: posições, estilos, técnico, condição e dia da partida também contam.

Comparar apenas com a B inicial do mundo seria enganoso: quando a Portuguesa chega, a composição da B já mudou com acessos e rebaixamentos. Aqui a comparação usa os adversários daquela mesma temporada.

### Caso que originou a reclamação

Na semente 20261123, estreia na B em T3:

- Portuguesa: XI 79,32, caixa 165, 21 atletas; 65 pontos e 2º lugar. Internacional: XI 82,2 e 71 pontos; Coritiba: XI 78,2 e também 65 pontos, atrás no desempate.
- Antes disso, contratou Wesley (30), Edílson/Grêmio (18), Aldair (7), Miguelito (6) e Kaká (31); saíram Carlos/Portuguesa e Nininho. Julinho permaneceu. O XI passou de 76,64 para 79,32. Não foi uma carreira sem gestão ou sem contratações.
- A Portuguesa original possui 18 cartas; como o sorteio entrega todas quando há até 22, o elenco inicial dela é tecnicamente igual nas dez sementes. Contratos e o restante do mundo variam. Isso é a regra solicitada, não um motivo para retirar históricos.
- A carência salarial até T3 permite reinvestir receitas antes da cobrança. Vale para humanos e bots na revisão atual; é um incentivo de progressão, não uma vantagem salarial exclusiva do usuário. Não foi alterada neste trabalho.

## Conferência das regras de acesso

- A B disputa 38 jogos por clube; os pontos correspondem a 3 por vitória + 1 por empate.
- Dois sobem diretamente; 3º a 6º disputam as outras duas vagas. Nos casos em que o usuário entrou no playoff, foi usado o resultado do caminho da tela, não apenas a simulação de fundo.
- Antes do primeiro acesso, houve sete participações da Portuguesa em playoffs; só uma terminou em acesso. Nove dos dez primeiros acessos vieram pelas duas vagas diretas.
- Não foi encontrado, nessas trajetórias, acesso concedido por temporada mínima, pelo nome Portuguesa, por simples entrada na B ou por ficar em 3º/4º sem vencer o playoff.

## Controles do futebol e do desgaste

As dez fotografias da primeira B foram reproduzidas com as mesmas tabelas ao fim dos38jogos por clube. Conferidos pontos, vitórias, empates, derrotas e gols de todos os times, não apenas a posição humana. Os controles concluíram sem alterar as regras do produto.

- Nos **380 jogos físicos** dessas estreias, a Portuguesa somou **629 pontos**; a projeção de gols usada pelo cálculo leve corresponderia a **628,27 pontos esperados** nesses mesmos confrontos. Gols humanos físicos402/projetados422,29; sofridos físicos262/projetados257,12. Não apareceu um excesso agregado de pontos do futebol físico que explique o acesso; isso não valida toda a distribuição/variância do motor nem exclui falhas em outros cenários.
- As dez estreias na B tinham **zero jogos com modificador de condição humano** nas entradas do motor. Retirar os modificadores de condição dos dois lados, preservando as escalações e o rodízio, manteve os pontos humanos em nove casos; em um, mudou59→60 por causa do adversário. Portanto, a sugestão anterior de que apenas acrescentar desgaste resolveria a subida rápida **não está demonstrada**. A política automática rodizia jogadores e não reproduz todas as lesões/eventos de uma pessoa.
- Nas 24 campanhas de liga com sementes alternativas, os mesmos elencos obtiveram17acessos. Houve posições entre1ºe10º. Esse ensaio confirma que existe vantagem competitiva com variação de campanha; não mede a chance de uma pessoa subir, usa quatro fotografias escolhidas e mantém fixo o seed do playoff.
- Tirar técnico ou trocar o cálculo dos jogos não produz uma redução consistente que explique a reclamação. Não usar isso como motivo para retirar comissão ou substituir o futebol físico por placares artificiais.

Resultados individuais e verificações: `resumo-foco-b.json`; a conferência de tabelas e pontuação está em `foco-b-controles.mts`/`resume-foco-b.py`.

## O que o código mostra sobre os adversários

1. `store.tsx:completaBancoDosBots` atende apenas à divisão do humano. Os outros clubes têm receitas e folha, mas não recebem essa mesma rotina de preencher banco/melhorar elenco em cada janela enquanto o usuário está longe. **Não significa que todos fiquem congelados**: o mercado de famosos e a materialização de clubes sondados também podem movimentá-los.
2. Na melhoria automática dessa rotina, o ganho é calculado contra o pior jogador da posição no elenco inteiro. Uma contratação pode melhorar a reserva sem melhorar o XI titular. Isso pode ser uma escolha útil para profundidade; não prova sozinho uma falha, mas limita a capacidade de um bot rico corrigir sua principal deficiência no time titular.
3. Bots já escolhem XI por nível e têm rodízio/condição. Não recomendar implementar esses recursos como se não existissem.
4. Com os critérios de carreira ativos, a projeção leve usa os mesmos perfis do dia do Motor2. O antigo `CPU_DIV_BOOST_V8` não é uma alavanca confiável para este modo: sua expectativa de gols é substituída nesse caminho.
5. O catálogo tem amplitudes diferentes entre clubes. Exemplos do primeiro mundo: Portuguesa XI76,64; Sport74,68; Fortaleza72; Goiás68,64; Ceará68,59; Cuiabá64,55. Isso compara versões históricas diferentes, não o desempenho real desses clubes em 2026. Não é justificativa para atribuir notas maiores aos adversários sem critérios e fontes.

## Teste de mercado nas quatro divisões

| Semente | Estreia na A original | Estreia na A com a rotina estendida |
|---:|---:|---:|
| 20261123 | T4 | T4 |
| 89117321 | T4 | T7 |
| 20332403 | T7 | T4 |

**Não resolveu sozinho o acesso rápido.** O mercado compartilhado também altera quem contrata quem e a composição das divisões; mais atividade não implica necessariamente uma B mais forte em cada semente. Não apresentar isso como correção comprovada, nem publicar essa experiência.

## Recomendação sustentada pelo diagnóstico

- Preservar os históricos, suas cartas e o sorteio solicitado. Não criar espera obrigatória, derrotas forçadas, punição por acesso ou bônus oculto por divisão.
- Melhorar a gestão dos adversários como um mundo persistente: reposição/mercado também fora da divisão acompanhada, decisão de reforço que considere XI e banco separadamente e reserva para folha/contratos. O teste demonstrou que apenas repetir a rotina atual em todo mundo é insuficiente.
- Auditar coerência das avaliações e composição dos XIs da B por critérios de jogador, sem elevar notas apenas para atrasar a Portuguesa. Completar com nomes reais somente onde falta XI, conforme autorização existente; não expandir catálogos para diluir os históricos no sorteio.
- Validar o calendário físico completo de liga e copas antes de usar desgaste como argumento de dificuldade. Não aumentar lesões para fabricar obstáculo. Os controles de uma temporada são diagnósticos, não substituem essa validação.
- Repetir qualquer mudança escolhida também com clubes que já tiveram dificuldade (ABC/Brasiliense). O objetivo é decisões de gestão e adversários coerentes; não obrigar a Portuguesa a demorar um prazo escolhido.

Há um limite de projeto: um elenco histórico de qualidade superior pode legitimamente subir rápido. Se os históricos mantêm suas forças, não se pode prometer o mesmo tempo de acesso de um clube com elenco contemporâneo muito mais fraco. A correção deve ser da coerência das regras e do mundo, sem falsificar esse resultado.
