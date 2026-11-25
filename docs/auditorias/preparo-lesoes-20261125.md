# Preparação e lesões — 25/11/2026

> Esta é a revisão inicial de preparação. A publicação foi posteriormente autorizada em 25/11/2026: “entao publique”; as referências abaixo a trabalho local registram o estado anterior. O complemento posterior, autorizado no mesmo dia, implementa também retirada por lesão durante a liga M2: [cenas e lesão em partida](cenas-jogadores-lesao-partida-20261125.md). A descrição abaixo de ausência desse comando refere-se ao estado anterior.

Pedido: revisar o aviso tardio de machucado, o risco quando o jogador fica cansado/no limite, a falta de reservas e a fluidez das transições. Trabalho local na mesma branch da prévia das cenas. Sem commit ou publicação desta revisão visual.

## Causa encontrada

`maybeEvento()` só era chamado ao avançar a rodada. Na escolha do estádio, isso podia acontecer depois de toda a abertura 3D, no botão final de começar. Além disso, as histórias de desgaste falavam em lesão aos dez minutos de um jogo que ainda não tinha começado. O aviso de decisão ficava na área de Jogos.

O motor M2 não possui hoje comando de retirada por lesão sem substituto: `AoVivoM2` só realiza troca quando recebe saída **e** entrada; a validação de esquemas/trocas exige onze posições. Esta revisão não transforma uma lesão de preparação em lesão ao vivo nem apresenta um aviso de dez jogadores enquanto onze continuam sendo simulados.

## Correções implementadas

- Checagem na preparação, antes de escolher placar/2D/3D e antes de pedir o giro do estádio. Pendência leva ao Elenco, preservando rodada e jogos já disputados. Escolha de apresentação não é consumida quando aparece um desfalque; depois da decisão, o jogador pode retornar à Central.
- Aviso nativo reutilizado no Elenco, uma vez, com nome do clube e texto de preparação. A Central dá acesso direto à pendência. O caminho antigo de Jogos continua oferecendo a mesma decisão.
- Histórias novas de lesão deixam claro que o atleta está fora **antes do apito**. Histórias antigas do save não são reescritas. `momento: 'preparacao'` é opcional.
- Reservas elegíveis calculados em um único lugar para interface e reducer. Mesma posição, fora do XI e diferente do lesionado; sem placeholders. Um jogador real recebido por empréstimo pode atuar normalmente.
- `EVENTO_DECIDE` não libera mais lesionado/suspenso em campo quando o substituto fica inválido. A opção de jogar mesmo assim é exclusiva de noitada, com o atleta ainda escalado.
- Se o treinador já fez a troca manualmente, pode confirmar o XI atual válido. O evento termina como afastamento, preservando a escolha e sem restaurar uma escalação antiga.
- Se não há reserva, são oferecidas as opções nativas da base; só sobe alguém depois da escolha. Pendência antiga sem opções pode recuperá-las de forma determinística. Reserva que volta a ficar disponível tem preferência sobre fabricar uma necessidade de base.
- Confirmações validam onze atletas nas posições da formação. Escalação incompleta recebe orientação para Formação/Comissão e base, em vez de um botão que parece não funcionar.
- Seleções dos banners se ajustam quando suas opções mudam. A decisão de escalar o jogador após uma noitada não é sobrescrita por outro evento de desgaste na mesma preparação.
- Guia corrigido: a afirmação antiga de que bots não cansam contradizia o rodízio/desgaste dos bots da divisão do humano.

## Frequência preservada

Não foram alterados consumo/recuperação, OVR, probabilidades, duração dos afastamentos, desbloqueios ou janela de rodadas. Continua um sorteio de desgaste por rodada/equipe, sem multiplicá-lo pelo número de titulares cansados. A lesão de folclore da temporada é um mecanismo distinto; lesões de desgaste não tornam o atleta inteiro imune ao causo anual.

Medição direta do componente de desgaste, vinte mil sementes por cenário (cem mil sorteios no total):

| Estado avaliado | Lesões | Frequência |
|---|---:|---:|
| Inteiro | 0 | 0% |
| Cansado, fora do limite | 0 | 0% |
| No limite | 1.015 | 5,075% |
| Um esgotado | 2.002 | 10,01% |
| Onze esgotados | 2.002 | 10,01% |

São frequências condicionais de um sorteio elegível, não uma previsão de lesões por temporada nem uma validação epidemiológica do futebol real. Gatilhos legados (T2+, janela R3–R31, bloqueio de evento ativo e retorno gradual) continuam como estavam. Não foi somado outro sorteio nas Copas ou durante jogos.

## Lesão durante a partida: desenho recomendado, ainda não ativado

1. Determinar a ocorrência uma única vez por partida, com instante e identidade persistidos; retirada real no motor, nos três modos, a partir daquele instante.
2. Pausar e avisar; oferecer banco elegível e respeitar as três trocas já usadas.
3. Sem reserva ou sem trocas restantes: avisar que o time continuará com dez e realmente retirar o atleta. Não subir atleta novo durante a partida.
4. Após o jogo, apresentar a necessidade no Elenco e oferecer a base pelo fluxo já existente. Tratar também goleiro, expulsões e limite mínimo de atletas.
5. Salvar/retomar sem nova lesão sorteada, sem retorno indevido do machucado, sem reescrever gols anteriores e sem dobrar o risco de desgaste da preparação.

Isso exige estender o motor, o registro da partida e a validação de escalações reduzidas. Não foi simulado com um banner apenas.

## Verificação

- `scripts/testa-evento-preparo.mts`: elegibilidade, empréstimos, rejeição de lesionado em campo, seleção inválida, troca manual, opções de base idempotentes, passado congelado, isolamento online e cem mil sorteios.
- `scripts/teste-preparo-lesao/runtime.mjs`: tela real em 390 e 1440 px, com e sem reservas; desfalque antes da abertura 3D, único aviso no Elenco, escolha explícita da base, retomada da pendência, onze disponíveis depois da decisão, passado preservado e sem início automático.
- `scripts/testa-condicao.mjs`: passou, mantendo as regras físicas atuais.
- `scripts/testa-carreira-evolucao.mts`: passou; 535 amostras do 3D, três trocas/intervalo/copas/replay e memória limitada em 1.800 jogos/30 temporadas.
- `scripts/testa-evento-cria.mjs`: cenários de evento/base passaram. O bloco legado de empréstimo da SAF tem três falhas **também na HEAD publicada**, confirmado carregando o `store.tsx` original por transformação de teste, sem alterar o checkout. Não é regressão desta revisão e as regras de empréstimo não foram alteradas.
- Build completo `npm run build`: passou, código de saída 0. Sem commit/publicação nesta revisão.

Capturas e relatórios locais em `/workspace/shared/preparo-lesoes-20261125/`. Nenhuma conta real foi acessada ou modificada. Salas online, basquete, F1, mercado, preços e OVR preservados. A expansão das cenas individuais e a identificação de homônimos discutidas na análise anterior continuam propostas separadas.
