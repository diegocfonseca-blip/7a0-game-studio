# Implementação: concorrência por reservas, banco nas copas e ranking global

> Decisão final de24/11: Diego manteve o futebol histórico com overalls originais e descartou a calibração visível/oculta. Transferências, economia e proteção continuam aprovadas. Veja [Escopo final](carreira-historica-mantida-20261124.md).

Diego autorizou corrigir a facilidade com regras iguais para humano e bots, preservando os ídolos. Durante a implementação esclareceu que quer **um ranking único do primeiro ao último clube do cadastro**, juntando todas as divisões, como referência de força inicial. Não pediu posições finais garantidas. Não publicar por inferência desta autorização de implementação.

## Mudanças aplicadas localmente

- `mercado-bots-oficial.ts`: além dos livres, clubes nacionais podem contratar reservas disponíveis de outros bots. O comprador paga e o vendedor recebe exatamente a mesma quantia. Disponibilidade considera o melhor XI e cobertura remanescente por posição; não há retirada automática de titular ou venda do elenco humano. Uma transferência entre clubes por comprador/janela; demais reforços continuam sujeitos ao perfil, orçamento, compromissos e limites existentes. A oferta vem dos reservas da abertura; ninguém revende uma contratação da mesma janela.
- A disponibilidade foi compartilhada com a sondagem humana, respeitando olheiro, categoria e limite já existente de um alvo. Um reserva sob contrato pode entrar no pregão com piso de referência; a venda não é uma saída sem contrato. O clube vendedor participa do pregão nativo. Alvo humano já marcado fica protegido da rotina automática. O reducer resolve a carta no elenco atual, não aceita a ficha enviada como prova de posse/disponibilidade.
- Disponibilidade não implica contratação automática: pode faltar orçamento, categoria, olheiro ou haver disputa no leilão. Bot não recebe caixa extra nem alteração de nota. Prioridade de contratação continua sendo ganho no XI antes do preenchimento do banco.
- `fisicaDaCopa`: bots passam a usar o rodízio existente quando há reservas descansados, e o desgaste também afeta o caminho estatístico dos jogos entre bots. Quem joga gasta gás e o banco recupera pela mesma régua do humano/preparador. Nenhum aumento de taxas de desgaste/lesão.
- Registro físico das copas guarda a escalação efetiva e gás anterior por partida, também quando os dois clubes são bots. Reabrir uma fase preserva a ordem do XI e a condição usados; não cobra duas vezes. Valores de gás 100 são omitidos no armazenamento e recuperados por padrão. Integração na Copa do Brasil e no adaptador de estaduais/Libertadores/Sul-Americana/Intercontinental.
- `ranking-clubes-carreira.ts`: função pura para uma lista global de **todos os clubes brasileiros cadastrados**, com divisão apenas como informação, sem separação de rankings. A força é a média do melhor XI possível na formação atual, calculada pelas cartas do elenco. Recalcular após mercado reflete a nova qualidade; dinheiro, nome e promoção sozinhos não acrescentam nota. Elenco legado incompleto fica sem nota/posição, sem força inventada. Não há nova tela pública nesta etapa.

## Ranking: o que está pronto e o que ainda é referência a definir

O levantamento inicial sintético de semente20261123 cobre **228 clubes: A20, B20, C20, D96 e72 sem série nacional**. Lista contínua 1–228. Inicialmente: Flamengo1, Palmeiras2, Fluminense3, Botafogo4, Cruzeiro5. A mesma função calcula a lista posterior à gestão dos bots.

O arquivo é um **diagnóstico do elenco atual do código**, não um ranking CBF nem uma ordem esportiva real pesquisada para impor aos clubes. Não chamar receita de força. A Portuguesa aparece em17º global com XI76,64, embora esteja naD: isso explicita a vantagem histórica inicial ainda existente. Criar a lista não corrige por si só essa composição.

A hierarquia inicial desejada pelo Diego deve orientar revisão de composição/avaliação com fundamento nos jogadores reais. Não transformar o número de posição em bônus de motor, não alterar Julinho para cumprir uma meta e não prometer que todos os clubes daA sempre superam todos os daB. O ranking passa a acompanhar os elencos à medida que negociam. A função de produto já calcula essa lista global; sua exposição em nova tela não foi feita. A referência inicial independente do sorteio ainda não foi imposta e precisa de curadoria; nenhuma nota de catálogo foi alterada nesta implementação.

CSV completo e JSON antes/depois: `/workspace/shared/carreira-correcao-20261124/ranking-geral-diagnostico.csv` e `ranking-geral-diagnostico.json`. Reprodução: `node scripts/run-carreira-test.mjs /scripts/auditoria-serie-d/ranking-geral.mts`.

## Verificação

- `testa-transferencias-carreira.mts`: conservação de dinheiro, cobertura, titular protegido, salário, categoria, determinismo, flag, alvo humano, preservação de Julinho e caixa humano; desgaste no caminho estatístico; mesma régua física; idempotência e reabertura. Estadual Paulista completo:71jogos com XI real, resultados/classificados/campeão idênticos após registrar/reabrir.
- `testa-mercado-oficial.mts`: integração em mundos Gama, Portuguesa, ABC e Flamengo, alcance A/B/C/D, contratos/preços, contabilidade de compras e vendas, duplicatas, XI, retorno idempotente e exclusão de online/legado anterior à adesão econômica.
- `testa-carreira-revisao.mts`: abertura, salários/contratos, mínimo por posição, calendário com folgas e tática do estadual passaram.
- `testa-forca-copas-carreira.mts`: promoção não cria força; copas preservam elenco; vaga continental por campanha; qualidade pesa no motor. Gama64,27 contra Flamengo86,41 em40jogos:0vitórias/3empates/37derrotas. Controle artificial85×55:39vitórias/1empate do mais forte. Não estimar probabilidades populacionais por essa amostra.
- Navegador local390/1440: central/elenco/calendário sem exceções. Build TypeScript/Vite e verificação de whitespace.
- Ranking: confronto com implementação independente para228clubes; caixa sozinho não altera força; promoção não aumenta nota; queda de qualidade derruba posição; online excluído.

## Simulações com gestão aproximada por informação pública

Mesmas três sementes, compras/vendas/renovações/comissão, copas nativas, sem aportes nem refazer derrotas. Comparador virtual desliga apenas `TRANSFERENCIAS_OFICIAIS`, preservando as demais revisões. SHA nos dados identifica os arquivos originais; no controle a flag é transformada em memória.

| Semente | Com transferências: estreiaA | Sem transferências: estreiaA | PrimeiraA com transferências | Caixa / folha de atletas na primeiraA* |
|---:|---:|---:|---|---|
| 20261123 | T9 | T8 | 20º, caiu | 60 /44 |
| 7919001 | T11 | T12 | 19º, caiu | 77 /42 |
| 871217 | T9 | T4 | 20º, caiu | 225 /42 |

*Campos registrados pela bancada no fecho da primeira campanha A; não equivalem ao saldo antes de entrar na temporada.

Seis trajetórias completas,59temporadas. Controle tem4392fotografias de XI, todas completas; versão com transferências contém verificações anuais de cobertura dos managers e contagem das divisões, sem fotografar cada XI de CPU. Nenhum alerta dessas verificações. Expansão nativa C20/24/28 e Julinho81–92 preservados.

Essa amostra não prova balanceamento final nem justifica uma meta obrigatória de9temporadas. Houve uma trajetória mais rápida com transferências que no controle e duas mais lentas. A hierarquia inicial continua exigindo revisão, conforme o diagnóstico do ranking. Não usar tempos de acesso para ajustar derrotas ou bônus ocultos.

Limites: o caminho estatístico legado da Copa do Brasil ainda contém os bônus de divisão preexistentes; a função de ranking não usa esses bônus. Essa diferença para o Motor2 continua como pendência de paridade e não foi usada como nova ferramenta para dificultar a carreira. Uma única política automática, três sementes, não usuários reais; liga seguida de copas no ensaio, sem intercalar toda a carga física do calendário; alguns eventos/lesões não reproduzidos. A matriz59temporadas foi feita antes do ajuste final de reabertura (preservação da ordem do XI e armazenamento esparso); esse caminho de histórico salvo não é usado pela matriz anual. Foi testado diretamente na reabertura dos71jogos do Paulista e conferido em uma temporada final de controle de execução. Dados anuais anteriores não foram reescritos para simular uma execução nova.

Reprodução anual: `AUDIT_FULL=1 REPEAT_PUBLIC_MARKET=1 REPEAT_DETAIL=1 REPEAT_SEEDS=20261123,7919001,871217 AUDIT_OUT=<pasta> node scripts/run-carreira-test.mjs /scripts/auditoria-serie-d/repeticao.mts`. Controle usa `scripts/run-carreira-sem-transferencias.mjs`. A variável da pasta é **AUDIT_OUT**. O primeiro comando desta etapa usou por engano REPEAT_OUT, gravando na pasta temporária padrão; o resultado completo foi arquivado na pasta correta, sem alterar contas/saves reais.

Evidências: `/workspace/shared/carreira-correcao-20261124/{portuguesa,controle-sem-transferencias,smoke-final}/repeticao.json` e `resumo-validado.json`. A distinção de informação privilegiada/pública dos relatórios anteriores permanece válida.

## Escopo e reversão

Preservados históricos, notas, contratos/salários da revisão anterior, carência atéT3, categorias por divisão e classificação/inscrição como Diego pediu. Não foram adicionados jogadores. Online, carreira antiga e basquete não recebem estas transferências/ranking.

Desligar `TRANSFERENCIAS_OFICIAIS` interrompe novas transferências e a disponibilidade adicional na sondagem; não desfaz negócios já pagos. O retorno do mercado global inteiro continua na flag `MERCADO_BOTS_OFICIAL_GLOBAL`. Registros físicos já gravados precisam ser preservados ao reverter código; não apagar a temporada para voltar ao comportamento anterior.

Implementado/testado localmente; sem commit, push, publicação ou mudança de conta real nesta etapa.
