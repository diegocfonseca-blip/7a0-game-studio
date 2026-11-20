# Inscrições continentais e correção da carreira — 20/11/2026

Diego autorizou corrigir as vagas antes da disputa e acrescentar clubes/elencos reais. A proposta de reintegrar um eliminado à mesma competição foi retirada. Esta entrega é local; não autoriza publicação.

## Erro corrigido

Quando o campeão anterior da Libertadores era estrangeiro, a inscrição podia fechar em 46 clubes. O simulador recolocava um eliminado na Libertadores para completar seus grupos. Só três eliminados chegavam então aos grupos da Sul-Americana, que ficava com 31 candidatos, montava sete grupos e podia produzir uma final sem adversário. A tabela percorria também essa final futura e tentava ler o nome do adversário ausente.

Agora:

- Libertadores: 47 inscritos distintos, 28 diretamente nos grupos, 13 na segunda fase e seis na primeira. Os quatro vencedores da terceira fase completam os 32 dos grupos.
- Sul-Americana: 44 inscritos próprios, sendo 12 nos grupos e 32 na primeira fase. Os 16 vencedores e os quatro eliminados da terceira fase da Libertadores completam 32 clubes nos grupos. Os oito terceiros da Libertadores entram nos playoffs.
- O campeão continental anterior entra nos grupos da **edição seguinte**, em vaga adicional. A cota nacional é preenchida antes de começar a copa, sem duplicar o campeão.
- Ninguém eliminado da Libertadores volta àquela Libertadores; permanece a transferência regulamentar à Sul-Americana.
- Listas com contagem, duplicidade ou cotas inválidas são recusadas antes de gerar resultados.
- A classificação ao vivo lê apenas partidas dos grupos. Um confronto futuro incompleto não cria time, empate ou pontos e não derruba essa tabela.

Referência: [Manual de Clubes CONMEBOL Libertadores 2026, §3.6.1](https://cdn.conmebol.com/wp-content/uploads/2025/12/Manual-de-Clubes-CONMEBOL-Libertadores-2026-ESP.pdf). Sete vagas nacionais brasileiras, seis argentinas, quatro de cada outra associação, mais os dois campeões continentais. A associação utiliza a vaga nacional quando seu campeão já se classificou por mérito nacional.

## Limite da simulação e ordem nacional

O Brasil usa os resultados da Série A e da Copa guardados na carreira, com a prioridade de campeão/vice da Copa já adotada pelo jogo para 2027. **As ligas estrangeiras ainda não são simuladas.** Seus classificados continuam partindo da referência de 2026, com aproveitamento das vagas e próximos elegíveis documentados abaixo. Isso não equivale a simular tabelas nacionais estrangeiras futuras.

As vagas de fase dos classificados nacionais de 2026 permanecem como referência. Lanús entra em 2026 pelo título da Sul-Americana de 2025; não é uma sétima vaga nacional argentina. Nas edições seguintes, sem novo título, ocupa sua posição na referência anual de 2025, depois de San Lorenzo.

| País | Próximos elegíveis, depois da referência existente | Referência |
|---|---|---|
| Argentina | Independiente; Lanús já está no cadastro e volta à ordem nacional | [Anual 2025](https://www.rsssf.org/tablesa/arg2025.html) |
| Bolívia | GV San José, Aurora | [Temporada 2025](https://www.rsssf.org/tablesb/bol2025.html) |
| Chile | Colo-Colo, Ñublense; Huachipato já tem vaga pela Copa | [Temporada 2025](https://www.rsssf.org/tablesc/chile2025.html) |
| Colômbia | Once Caldas, Alianza FC | [Reclassificação 2025](https://caracol.com.co/2025/12/13/tabla-de-reclasificacion-asi-quedaron-las-posiciones-tras-goleada-de-junior-al-tolima-en-la-final/) |
| Equador | Aucas, Emelec | [Segundo hexagonal 2025](https://www.rsssf.org/tablese/ecua2025.html) |
| Paraguai | Sportivo Ameliano, Sportivo Luqueño; General Caballero rebaixado fica fora | [Temporada 2025](https://www.rsssf.org/tablesp/para2025.html) |
| Peru | Los Chankas, ADT | [Acumulado 2025](https://www.rsssf.org/tablesp/peru2025.html) |
| Uruguai | Cerro Largo, Cerro | [Anual 2025](https://www.rsssf.org/tablesu/uru2025.html) |
| Venezuela | Anzoátegui, Zamora | [Acumulada oficial 2025](https://ligafutve.org/table/tabla-acumulada-liga-futve-temporada-2025/) |

O cadastro cobre até os dois campeões continentais saindo do mesmo país: a Libertadores aproveita as vagas nacionais e a Sul-Americana mantém sua cota própria. Não é uma escolha por fama do clube nem repescagem de quem perdeu.

## Elencos

Dos 17 clubes adicionais, Independiente, Colo-Colo e Emelec já fecham XI com cartas existentes. Os outros 14 recebem 154 registros de jogadores reais das escalações citadas em [cartas-conmebol-reservas.md](cartas-conmebol-reservas.md). São elencos privados da fábrica de adversários oficiais, carregados somente com o baralho do Brasil Oficial. Não entram no catálogo de compra, mercado, pregão ou salas online. A régua inicial interna é Bom Jogador, 68–76; não é uma estatística oficial de desempenho.

## Carreiras existentes

`oficial.vagasDesde` grava a primeira temporada com a nova distribuição. Carreira nova recebe `1`. Uma carreira antiga sem a marca conserva a edição atual **se as duas inscrições antigas fechavam completas**; a marca só nasce ao virar a temporada. O seletor de compatibilidade conserva listas, países e resultados determinísticos da edição completa, sem misturar metadados novos de sorteio.

Se a inscrição antiga já era incompleta, a edição afetada é recalculada a partir das inscrições corrigidas. Seus confrontos/resultados derivados podem mudar, pois a chave anterior tinha participantes faltando. Campeões históricos guardados, títulos e pagamentos anteriores não são reescritos por esse seletor. Retomar o save não antecipa a mudança de uma edição válida. Não foi lido nem alterado save de usuário real nesta correção.

Históricos antigos sem registro de um título mantêm a referência de 2025 apenas para preencher inscrições; não se grava um campeão ou prêmio inventado. Se essa referência colidir com o único título conhecido, aproveita-se a vaga na associação correspondente sem inscrever o mesmo clube duas vezes.

## Verificação

- `scripts/testa-classificacao-grupos.mts`: classificação parcial, anti-spoiler, desempates, adversário ausente e nenhuma alteração dos resultados recebidos.
- `scripts/testa-inscricoes-conmebol.mts`: 9.120 combinações de campeões, 100 pares completos de copas, cotas nacionais, inscrições distintas, transferências regulamentares e nenhuma reintegração à Libertadores. Snapshots da temporada 2026 e das edições antigas completas iguais à versão publicada.
- `scripts/diagnostica-tabela-carreira.mjs`: navegador local sem rede externa: 17 elencos com XI válido, 39 competições (17 estaduais e 22 continentais), dez temporadas sucessivas com motor/catálogo reais, tabela React real com oito grupos/32 clubes mesmo recebendo uma final futura incompleta, migração e retomada. Sem erros JavaScript. A bancada não usa contas de produção.
- `npm run build`: passou (TypeScript e empacotamento de produção). `git diff --check`: passou.

A suíte antiga `testa-libertadores.mts` já tinha 30 falhas nas expectativas de nomes da Intercontinental antes desta correção. Elas não foram encobertas nem usadas para validar esta entrega; as novas regressões são específicas das inscrições e tabelas.
