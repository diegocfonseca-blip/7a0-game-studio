# Repetição da carreira D → A — 23/11/2026

> Correção posterior de método: o ator desta bancada usava notas/categorias ocultas na avaliação das ofertas. Estes resultados são diagnósticos de uma política com informação privilegiada, não estimativas de gestão humana comum. A comparação com ator de informação pública, alternativas testadas e limites está em [carreira-alternativas-classica-20261124.md](carreira-alternativas-classica-20261124.md).


Pedido: “Ok simule novamente”. O pacote anterior continua autorizado; a discussão da facilidade da Portuguesa é separada. **Julinho e os históricos continuam no sorteio inicial. Salário desde T1 e bloqueio de históricos não foram aprovados nem aplicados.**

## Método (execução concluída)

- 30 carreiras fictícias locais: dez sementes pareadas por clube, Portuguesa/ABC/Brasiliense. Cada acesso é observado até o fim da T12; quem sobe tem duas temporadas posteriores acompanhadas. Estreia na A = temporada do acesso +1. Sem acesso até T12 é observação censurada, não impossibilidade de chegar.
- Código: `f7797497` com a revisão local já autorizada, ainda sem publicação. Hash dos arquivos principais de produto: `c52dc51454633e0d8a480607c1788084b249b5a654f2cf39123d435882b04e67`.
- Ator anual automático: reforça por faixa de nível, preserva reserva de caixa para compromissos, monta banco, vende excedentes, renova vencidos e tenta comissão melhor. Não consulta resultados futuros nem reinicia derrotas. Tática equilibrada. Salários cobrados a partir da T4, conforme a regra existente.
- Usa reducer, Motor2, calendários C/D, promoções, playoff B, copas nativas e finanças da revisão local. Não usa conta ou snapshot real, não autentica, não altera nuvem/salas/catálogos e não publica.
- Sorteio inicial original preservado; presença de Julinho na Portuguesa é assertada. Código de produto não é alterado pela bancada.

### Limites

É uma simulação anual de gestão conservadora, não uma gravação de todos os cliques e eventos de uma pessoa. Copas são calculadas após a liga; não reproduz o calendário intercalado experimental nem o registro físico de todas as fases de copa, todos os eventos/lesões do usuário, trocas no intervalo, agência, lojas, bicos, aportes ou bonificações de conta. As sondagens do ator priorizam até bom jogador e passam pelas travas nativas. A condição/rotação usa a política da bancada anterior; não equivale a uma otimização perfeita do calendário. Dez sementes e uma política não permitem estimar uma probabilidade geral com precisão.

O produto atual tem17estaduais; ABC/Brasiliense não recebem um estadual inventado para completar receitas. Os resultados são do jogo atual em revisão, não previsão histórica do futebol real.

### Validação

Piloto da Portuguesa/20261123 repetido independentemente no lote: mesmas divisões, posições, gols agregados, força e caixa nas cinco primeiras temporadas. Nessa semente: D→C→B→A, estreiaT4 (19º/rebaixado), T5naB. Nenhuma inferência sobre frequência é feita a partir desse caso isolado.

Scripts: `scripts/auditoria-serie-d/repeticao.mts` e `resume-repeticao.py`. Dados: `/workspace/shared/carreira-repeticao-20261123/`; arquivos por clube, `resumo.json` e `temporadas.csv`. A auditoria anterior é preservada.

## Resultados finais

30 carreiras concluídas, 296 temporadas simuladas. Foram observadas258entradas de atletas,178saídas e639renovações. As sementes e a trajetória de cada caso estão nos dados, sem descartar tentativas ruins.

| Clube | Casos | Estreia na A já na T4 | Obtiveram acesso até fim T12 | Temporada de estreia, entre quem subiu | Rebaixados na estreia |
|---|---:|---:|---:|---|---:|
| Portuguesa | 10 | 2 | 10 | T4–T9; mediana T6 | 5 de10 |
| ABC | 10 | 0 | 2 | T8 eT9 | 2 de2 |
| Brasiliense | 10 | 0 | 2 | T6 eT7 | 2 de2 |

Os oito ABCs e oito Brasilienses restantes não obtiveram acesso dentro das12temporadas observadas. Isso não prova que nunca conseguiriam. Não calcular uma mediana populacional de chegada à A para esses grupos a partir apenas dos dois casos bem-sucedidos.

### Portuguesa: cada caso

| Semente | Estreia A | Posição na estreia | Caixa após fechar estreia e próxima janela (moedas) | Folha só de atletas na estreia |
|---:|---:|---:|---:|---:|
| 20261123 | T4 | 19º | 335 | 55 |
| 7919001 | T5 | 18º | 162 | 57 |
| 871217 | T7 | 20º | 346 | 51 |
| 20332403 | T7 | 14º | 425 | 50 |
| 31892031 | T6 | 15º | 447 | 50 |
| 42771721 | T5 | 12º | 261 | 55 |
| 54183913 | T6 | 12º | 280 | 47 |
| 68218117 | T7 | 17º | 327 | 49 |
| 77323109 | T9 | 20º | 139 | 51 |
| 89117321 | T4 | 13º | 263 | 56 |

As folhas acima são extraídas dos dados por atleta; comissão é cobrada separadamente na mesma linha anual de folha. Conferir valores exatos no JSON/CSV. Não comparar caixa final de carreiras com comprimentos distintos como se fossem saldos ao mesmo tempo.

### Interpretação e limites da conclusão

O caminho de três acessos consecutivos ocorreu em2das10Portuguesas, não foi uma regra observada para todos. A vantagem de largada da Portuguesa permanece visível: todas as dez subiram à A, mas metade caiu na estreia. O restante da amostra apresentou uma progressão consideravelmente mais difícil, com16de20ABCs/Brasilienses sem acesso na janela observada.

Essa evidência pede avaliar a diferença de progressão entre clubes e a adaptação à A. **Não autoriza excluir Julinho, reduzir históricos à força, cobrar salários desdeT1 ou declarar o equilíbrio aprovado.** O usuário rejeitou bloquear históricos e não aceitou a proposta adicional de alterar a carência. Manter o pacote já aprovado separado dessas propostas.

### Integridade

- Mesma versão dos arquivos principais em todos os processos; hash conferido novamente ao fim.
- Julinho no elenco inicial das10Portuguesas. Nenhuma alteração de catálogo, notas, sorteio ou regra salarial na repetição.
- Nenhum XI incompleto nos técnicos acompanhados após as296janelas. Cada trajetória é contínua e todo acesso foi conferido pela promoção oficial, não por suposição de posição na tabela.
- Exatamente um fechamento de folha por temporada; T1–T3sem cobrança, T4em diante com cobrança. Nenhuma duplicação de identidade no elenco humano dos registros finais das janelas.
- Piloto reproduzido no lote com posições, gols, força e caixa idênticos; publicação e contas reais preservadas.

`integridade-final.json`, `temporadas.csv`, `resumo.json`, `trajetorias.png` e `trajetorias.pdf` estão em `/workspace/shared/carreira-repeticao-20261123/`. O gráfico mostra temporadas realmente disputadas; campos de “próxima divisão” dos dados indicam a temporada seguinte, não uma partida já observada.
