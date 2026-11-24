# Gestão dos adversários por elenco e orçamento

> Correção posterior de método: o ator desta bancada usava notas/categorias ocultas na avaliação das ofertas. Estes resultados são diagnósticos de uma política com informação privilegiada, não estimativas de gestão humana comum. A comparação com ator de informação pública, alternativas testadas e limites está em [carreira-alternativas-classica-20261124.md](carreira-alternativas-classica-20261124.md).


Diego aprovou aplicar os ajustes e reforçou que a regra deve valer para qualquer clube, usando o exemplo de um Gama fraco chegar à A/Libertadores sem contratar jogadores compatíveis. Não foi solicitado publicar esta revisão.

## Implementação

- Nova rotina pura `mercado-bots-oficial.ts`, integrada a `completaBancoDosBots` em `store.tsx`, só na carreira brasileira oficial com a revisão econômica ativa. Aplica-se aos clubes nacionais A/B/C/D, independentemente da divisão ou do nome do clube humano. Os estrangeiros continuam no modelo de referência já existente; não foi criada uma economia persistente estrangeira.
- Na janela anual, tenta primeiro melhorar uma vaga do XI, comparando o reforço com o último titular daquela posição. Mantém o titular anterior como reserva quando há espaço; com banco cheio, libera apenas excedente da mesma posição. Não faz venda com receita fictícia.
- Depois distribui a verba restante entre as posições que precisam de banco. Não cria jogadores, não retira um atleta ainda pertencente a outro clube e não usa cartas novas/duplicadas. Os limites de categoria continuam sendo os da divisão do comprador.
- Caixa, folha, comissão e renovações próximas limitam a verba. A compra também reserva seu acréscimo de salário. Perfis financeiros dos bots continuam limitando a parcela de caixa investida; nenhuma injeção de dinheiro ou bônus de overall por divisão.
- Ordem determinística dos clubes varia por temporada. Não há prioridade fixa por nome, por divisão ou por ser adversário do humano. Leilões/sondagens existentes continuam funcionando; a nova rotina contrata os livres restantes.
- `oficialMercadoBotsSeason` evita repetir compras ao confirmar/retomar a mesma janela. É apagado ao iniciar outra carreira oficial. A rotina entra nos caminhos de início da temporada e não é chamada para reescrever partidas em andamento. O fluxo nativo continua protegendo o XI mínimo separadamente.
- Humano e clubes humanos adormecidos ficam fora da gestão automática. Históricos, overalls, sorteio inicial, contratos do usuário e carência salarial T4 preservados. Salas online, basquete, carreira genérica e catálogos de cartas permanecem fora desta alteração.

Reversão: desligar `MERCADO_BOTS_OFICIAL_GLOBAL` volta ao caminho anterior nas próximas execuções. Não desfaz contratações já realizadas; não apresentar a flag como restauração retroativa de saves.

## Força e classificação continental

`testa-forca-copas-carreira.mts` conferiu:

- Mover o mesmo Gama de D para A não modifica suas cartas/overalls no mundo da carreira.
- A fábrica de participantes da copa utiliza o mesmo elenco do mundo, sem uma versão mais forte por ter entrado na competição.
- Entrar na A e terminar em20º não dá Libertadores. Uma campanha classificatória dá a vaga pelo critério esportivo. Vaga pela Copa do Brasil continua sendo uma rota legítima; não foi criada uma proibição por divisão.
- Gama inicial64,27 contra Flamengo86,41, em40jogos físicos controlados com mando alternado: Gama0V/3E/37D,4gols feitos/93sofridos. Elencos nativos, equilibrados, sem comissão/condição/eventos adicionais neste ensaio. Não representa probabilidade de título ou uma temporada completa.
- Outro controle de laboratório manteve nomes/estilos iguais e mudou apenas a faixa de nível:85contra55. Em40jogos, o lado forte teve39V/1E/0D e88–0em gols. Essas faixas artificiais existem apenas na bancada; nenhum catálogo foi alterado.

Esses testes verificam que qualidade pesa e não existe aumento automático de força ao subir. Não justificam garantir ausência de zebras, impedir acessos rápidos de elencos fortes ou declarar toda a curva de dificuldade calibrada.

## Coerência das avaliações

A revisão preserva as notas: não foi encontrada evidência factual suficiente para alterar a avaliação de um jogador específico. O diagnóstico anterior já mostrou diferenças importantes entre elencos históricos de clubes na mesma divisão; isso não torna cada nota individual um erro. Nenhum jogador foi acrescentado para diluir históricos ou fortalecer adversários artificialmente. O único complemento de XI da revisão anterior (Marcos Felipe/Bahia) permanece isolado das salas.

## Validação funcional

- `testa-mercado-oficial.mts`: escolher ganho de titular antes de melhoria só de reserva; orçamento, compromissos, acréscimo salarial, propriedade, categoria, determinismo e entrada imutável; integração com Gama/Portuguesa/ABC/Flamengo, contratações em A/B/C/D, caixa pago, contratos/referências, XI mínimo, ausência de novas duplicatas, idempotência, humano preservado e isolamento de online/legado. Passou.
- Tempo da rotina completa na bancada, com outras simulações concorrentes:948–1187ms nos quatro mundos. É uma execução por janela anual, fora da partida. Não é medição de desempenho no S25.
- `testa-carreira-revisao.mts`: passou após integrar a rotina nova, incluindo catálogos, referências, contratos, proteções de saída, calendário e tática de copa.
- `npm run build` (TypeScript e Vite) passou. Sem mudança visual nova ou publicação.

## Bancada de progressão

Lotes locais em `/workspace/shared/carreira-justa-20261123/`, três sementes pareadas20261123/7919001/871217 por grupo: Gama com gestão; Gama mantendo/renovando os iniciais, sem compras/nova comissão; Portuguesa com gestão; ABC com gestão; Gama com gestão e mercado anterior como controle.

O controle anterior desliga a flag somente no módulo virtual do Vite (`run-carreira-mercado-anterior.mjs`), sem reescrever arquivos de produto. O relatório identifica essa transformação: o mesmo hash de arquivos não significa o mesmo código efetivo nesse grupo. Os outros grupos usam a implementação nativa nova.

Mantidos os limites da bancada anual: política conservadora automática, copas calculadas após a liga, reprodução parcial de eventos/lesões e rotação, sem a totalidade dos cliques humanos ou calendário físico intercalado. Observação até o fimT12; quem sobe recebe duas temporadas seguintes de acompanhamento. Não converter ausência de acesso em impossibilidade, nem três sementes em uma probabilidade populacional.

### Resultados concluídos

**15carreiras,163temporadas**, sem XI incompleto nos26.552XIs conferidos das divisões A/B/C/D e sem alertas de mínimo nos técnicos acompanhados. Uma cobrança de folha por temporada, zero antesT4, sem novos jogadores no controle sem compras. Os arquivos de produto permaneceram iguais entre os processos; a transformação virtual do controle anterior é a exceção efetiva declarada.

| Grupo | Resultados nas três sementes | Melhor divisão efetivamente disputada |
|---|---|---|
| Gama, gestão/mercado novos | Sem estreia naA até fimT12 | D / B / C |
| Gama, iniciais renovados sem compras/nova comissão | Sem estreia naA até fimT12 | D / C / C |
| Portuguesa, gestão/mercado novos | EstreiaA T6 / T5 / T5 | A / A / A |
| ABC, gestão/mercado novos | Sem estreia naA até fimT12 | B / B / B |
| Gama, gestão com rotina anterior | Sem estreia naA até fimT12 | B / B / D |

- Gama sem compras manteve XI64,27, sem uma única chegada ao elenco. Isso não impediu acessos pontuais àC, mas não produziu acesso àA nem participação continental no horizonte observado.
- Gama com gestão elevou o XI final para70,14/71,09/69,09. No caso que alcançou aB, estreou nessa divisão naT5 e caiu em18º. Não apareceu o exemplo de Gama fraco ganhando Libertadores nesses testes.
- Portuguesa preservou Julinho na largada e teve entradas/saídas administradas pela política. Nas mesmas três sementes antigas, estreavaA T4/T5/T7; agora T6/T5/T5. O acesso não foi atrasado sistematicamente nem por um prazo imposto. Uma das novas trajetórias disputou a Sul-Americana e caiu nas oitavas, sem título continental observado.
- ABC chegou àB nos três casos, sem alcançarA atéT12. Os casos difíceis continuam difíceis; este lote não demonstra calibração final de toda a dificuldade, nem que esses clubes nunca consigam evoluir com outras decisões humanas.
- O controle do Gama com rotina anterior também não alcançouA. Portanto, não atribuir à rotina nova a correção de um título impossível que não foi observado no controle. O ganho implementado é gestão mais coerente/universal, não uma prova de que antes qualquer clube fraco era campeão.

Conferência reproduzível: `scripts/auditoria-serie-d/confere-carreira-justa.py`; resumo detalhado `/workspace/shared/carreira-justa-20261123/integridade-e-resultados.json`. Hash dos arquivos principais, incluindo a rotina nova: `9a154a758d245b62964015c3d631b4e1276c9ad7c955604f657d47e18259d5f0`.

Sem alteração visual, sem notas adulteradas para atingir uma demora escolhida e **sem publicação**. Pendências anteriores de estaduais/calendário completo/economia estrangeira permanecem fora desta conclusão; não anunciar a revisão ampla inteira como encerrada.
