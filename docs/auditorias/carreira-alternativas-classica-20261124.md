# Carreira oficial: alternativas e comparação com a carreira de batismos

> Etapa posterior autorizada por Diego: implementadas transferências de reservas, revisão física das copas e função de ranking global. O ranking atual não significa que a hierarquia inicial foi corrigida. Ver [implementação e resultados](carreira-transferencias-ranking-20261124.md).


Diego pediu que a recomendação seja responsabilidade da análise: carreira justa com compras/vendas, preservando os ídolos e aproveitando o que funcionava no modo antigo. A revisão de classificação/inscrições da D permanece fora do trabalho por orientação explícita. Este documento não autoriza publicação e não declara o balanceamento resolvido.

## Recomendação

Adotar um pacote centrado em **qualidade real dos elencos e concorrência por jogadores**, aproveitando o princípio de progressão do modo antigo, sem copiar seus bônus. A prioridade é a composição e a força relativa de todos os clubes: um elenco histórico forte de um clube da D pode ser favorito na D, mas a subida deve encontrar adversários de nível crescente e exigir soluções para os pontos fracos do time.

1. **Mesma régua de avaliação para todos os jogadores, pelo clube/ano da carta.** Revisar incoerências individualmente com fundamento futebolístico; categoria e nota não podem depender de ser humano, bot ou de qual divisão está o dono. Julinho permanece no time e não perde atributos só para atrasar a Portuguesa. Médias diferentes entre catálogos apontam onde investigar, não provam que todo jogador de uma fonte está errado. Não aplicar em massa o protótipo estatístico abaixo.
2. **Revisar a montagem inicial de todos os adversários usando o catálogo existente.** Verificar cobertura por posição, aproveitamento de históricos disponíveis, sorteio e reservas antes de falar em enfraquecer o usuário. Não distribuir estrelas de outro clube sem transferência, criar fichas desnecessárias nem completar com jogador fictício. Caso o catálogo legítimo de um clube não comporte mais força, não inventar notas para cumprir uma média. Manter a identidade histórica implica aceitar que algumas equipes tenham uma largada especialmente forte; isso precisa ser avaliado no conjunto dos adversários, não só pelo nome da divisão.
3. **Ampliar o mercado efetivo entre clubes, com a mesma oportunidade para humano e bots.** A rotina nacional implementada melhora o uso dos livres, mas não constitui por si só um mercado completo de transferências entre clubes. Priorizar necessidades do XI, preço, salário, renovação e cobertura do vendedor. Empréstimo é uma possibilidade posterior, com posse/uso exclusivos e elenco legal nos dois lados. Não obrigar venda nem oferecer reforço grátis. Esta etapa ainda é proposta e pode também beneficiar o humano; não prometer que necessariamente atrasará o acesso.
4. **Fazer a profundidade do elenco importar por condições já existentes.** Completar a validação do calendário físico de liga/copas, descanso e rodízio, para um time forte precisar de banco em calendário cheio. Não aumentar lesões/fadiga artificialmente nem cobrar salários antes de T4: a carência T1–T3 continua. A bancada anual atual não reproduz todo esse calendário.

Critério de sucesso: a compra certa melhora uma fraqueza; adversários também conseguem evoluir pagando; subir não garante permanecer; diferentes clubes conservam dificuldades distintas. Medir força relativa, reposições no XI, manutenção na divisão e custo de gestão, além do ano do acesso. Não instituir um número obrigatório de temporadas nem derrotas programadas.

## O que o modo antigo realmente fazia

`pyramidseason.tsx:buildCpuSquads` ordena o conjunto de jogadores por `(lo+hi)/2` e o divide em faixas de qualidade para distribuir jogadores reais entre clubes de batismo. A comparação diagnóstica usa baralho Brasil/Europa/Mundo e Várzea, diferente da carreira oficial brasileira com elencos vinculados aos clubes. Não é uma comparação causal isolada nem uma simulação de temporadas do modo antigo.

Antes de concluir a janela inicial, nas três sementes:

| Média do XI | Antigo, receita com todos os baralhos | Oficial, clubes reais |
|---|---:|---:|
| A | 87,44–87,67 | 77,56–77,92 |
| B | 78,78–78,88 | 67,63–67,68 |
| C | 74,47–74,68 | 63,24–63,30 |
| D | 67,30–67,94 | 59,47–59,48 |

A Portuguesa histórica inicial tem XI de 76,64. Em fotografia posterior à janela, o diagnóstico anterior encontrou B perto de 70 e A perto de 81: etapas distintas, não intercambiáveis com a tabela. Isso explica por que um elenco da D pode já disputar em força com adversários de divisões superiores. O princípio aproveitável do modo antigo é a qualidade crescente dos oponentes; os números acima não são metas obrigatórias de nota.

Os antigos `CPU_DIV_BOOST_V8` e `DIVISION_BASE` não devem ser copiados como remédio: o caminho atual com critérios/Motor2 projeta outra força e não equivale a esses ajustes estatísticos legados. Melhorar o adversário exige jogador e escalação efetivos, não apenas um número de divisão.

## Correção de método: os testes anteriores tinham informação privilegiada

A automação anterior avaliava lances e alvos com `lo/hi`, categoria e valor real antes de comprar. A interface do pregão não mostra esses atributos naquele momento. Foi incorreto descrever essa política como gestão comum sem essa ressalva. Os resultados antigos continuam sendo diagnósticos válidos daquela política, mas não estimam o tempo esperado de um humano comum.

Novo controle `REPEAT_PUBLIC_MARKET=1`: estimativas aproximadas por nome/clube/ano/posição públicos; notas reveladas do próprio elenco podem ser usadas. Lotes mascarados não usam os campos de identidade escondidos. Técnicos são avaliados por reputação aproximada pública. Os testes de observação bloqueiam leitura das notas/categorias ocultas na avaliação de ofertas. Isso ainda é uma única política automatizada simplificada; não é uma distribuição empírica de comportamento humano.

## Alternativas testadas

Mesmas sementes 20261123, 7919001 e 871217; gestão com compras, vendas, renovações e comissão. Temporada indicada é a **estreia na A**, não a temporada anterior em que conquistou o acesso.

| Variante | Semente 20261123 | 7919001 | 871217 | Leitura |
|---|---:|---:|---:|---|
| Regras locais atuais, ator privilegiado anterior | T6 | T5 | T5 | Diagnóstico anterior; informação indevida para caracterizar humano comum |
| Regras locais atuais, estimativas públicas | T8 | T7 | T9 | Controle novo; os três caíram na primeira A (17º, 17º, 18º) |
| Categorias como teto, permitindo também inferiores; estimativas públicas | T4 | T6 | T5 | Acelerou o acesso; não recomendar como solução para facilidade |
| Alinhamento estatístico de fontes por categoria/posição v2; estimativas públicas | T6 | T5 | Sem acesso até T12 | Efeito heterogêneo; não aprovar como ajuste automático |

Na última variante, os dois que estrearam na A foram 20º e caíram. A terceira terminou T12 na B. Não apresentar a ausência de acesso de uma semente como prova de equilíbrio, nem escolher apenas o resultado mais lento para justificar uma mudança. Regras de mercado alteram escolhas e trajetórias; a diferença de tempos não isola um único efeito de força.

### Limites do protótipo de notas

O protótipo transforma virtualmente as faixas de 4377 fichas regionais/complementares para quantis do catálogo principal Brasil/Europa/Mundo por categoria pública e posição. Preserva nomes, categorias, empates/ordem na mesma classe/posição e grupos pequenos, inclusive Julinho 81–92. O XI inicial da Portuguesa passa de 76,64 para 74,59. Isso **não é curadoria factual de 4377 jogadores**, tampouco demonstra que essa mudança seria justa. Os arquivos de catálogo do produto não foram alterados.

A versão v1 foi descartada antes da conclusão por separar internamente `fame=2` e `fame=3`, que são a mesma categoria pública Bom jogador. Seus resultados parciais não entram na tabela ou no total validado; o mapa e a invalidação foram preservados. A v2 corrige essa regra. Não escolher a v1 porque apresentou uma trajetória mais demorada.

## Oferta real de mercado: possibilidade, não contratação garantida

Uma fotografia da primeira B local encontrou 52 reservas potenciais de clubes da A com média de pelo menos 72 e cobertura de posição remanescente; 42 são Bom jogador. Mesmo mantendo os limites atuais, há oportunidades potenciais de ganho de XI para os 19 rivais da B. Isso não prova disposição de vender, orçamento suficiente ou transferência aceita. Serve para justificar examinar circulação de jogadores existentes antes de criar mais jogadores ou dar bônus.

## Validação e reprodução

- Nove trajetórias novas completas, 70 temporadas, 11372 XIs anuais de 11 jogadores, sem erros de cobertura registrados e sem alertas nas execuções. A expansão nativa C20/C24/C28 foi respeitada nas fotografias. Integridade anual não prova cada instante da temporada nem resolve lacunas de calendário/inscrição.
- `node scripts/auditoria-serie-d/testa-observacao.mts`: passou a invariância a atributos ocultos, ordenação por categoria pública/posição e preservação de Julinho.
- A fonte dos dez módulos de produto acompanhados continua SHA256 `9a154a758d245b62964015c3d631b4e1276c9ad7c955604f657d47e18259d5f0`. Nos protótipos, esse hash refere-se aos arquivos originais; o código efetivamente executado recebeu transformações virtuais explicitadas nos metadados.
- Simulação anual com copas nativas após a liga; não intercala toda a carga física das copas, não executa todos os eventos pessoais/lesões e não constitui teste de interface. Três sementes por alternativa, uma política de gestão, sem previsão populacional de acesso. Os três processos separados da v2 declaram uma semente cada.

Scripts: `scripts/auditoria-serie-d/repeticao.mts`, `observacao-publica.mts`, `compara-reguas.mts`, `testa-observacao.mts`, `scripts/run-carreira-teto-inclusivo.mjs`, `scripts/run-carreira-referencia-escala.mjs`. Executar os wrappers pela raiz, com `REPEAT_PUBLIC_MARKET=1`, `REPEAT_SEEDS` e `AUDIT_OUT` explícitos. O wrapper de escala lê o mapa produzido pela comparação; não regenerar/trocar o mapa durante uma execução.

Evidências locais em `/workspace/shared/carreira-alternativas-20261124/`: `comparacao.json`, `publica/repeticao.json`, `teto-inclusivo/repeticao.json`, `referencia-escala-v2/<semente>/repeticao.json`, `resumo-validado.json`, `oferta-reservas.json`, `mapa-referencia.json`; v1 arquivada separadamente. A correção descritiva de quantidade de sementes não alterou resultados numéricos.

Nenhuma dessas alternativas foi aplicada ao produto ou publicada. O pacote técnico e o mercado universal de trabalhos anteriores continuam preservados, com balanceamento ainda em aberto.
