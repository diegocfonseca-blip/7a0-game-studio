# Experimento arquivado: hierarquia anterior às cartas — carreira oficial

> **SUPERADO pela decisão final de Diego em24/11.** As duas versões de ajuste inicial foram rejeitadas e retiradas do produto. Este documento registra o experimento anterior; seus resultados de simulação não descrevem o jogo mantido. Veja [Carreira histórica mantida](carreira-historica-mantida-20261124.md).

Implementação local autorizada por Diego em 24/11/2026. O pedido esclarecido é **a hierarquia real dos clubes definir a força inicial**, e não ordenar clubes pelas cartas históricas. Não houve publicação, commit, acesso à conta real ou mudança de sala online.

## Referência única de todos os clubes

O cadastro atual contém **228 clubes brasileiros**, não 500: 20 da A, 20 da B, 20 da C, 96 da D e 72 fora das séries nacionais. Todos entram em uma única lista. A divisão é um dos critérios da lista, não uma lista separada.

Fontes para o começo da temporada de 2026:

- [RNC 2026 da CBF, revisão de 23/12/2025](https://stcbfsiteprdimgbrs.blob.core.windows.net/img-site/cdn/RNC_Ranking_Nacional_dos_Clubes_2026_27e24418e7.pdf): pontuação ponderada dos cinco anos anteriores.
- [Classificação final da Série A 2025](https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-a/2025).
- [Classificação final da Série B 2025](https://www.cbf.com.br/futebol-brasileiro/tabelas/campeonato-brasileiro/serie-b/2025).
- Divisão cadastrada em `brasil-oficial.ts` e receitas já documentadas em `economia-oficial.ts`.

Os dados extraídos estão versionados em `docs/brasil-oficial/fontes-hierarquia-2026.json`. O gerador `scripts/gera-hierarquia-inicial.mts` associa nome/UF e aliases explícitos, conferindo as 40 campanhas de A/B. Dos 228 clubes, 162 têm correspondência no RNC; 66 ficam explicitamente sem esse dado. Não foram inventadas pontuações ou receitas para preencher lacunas. É referência para o início de 2026, **não a classificação ao vivo de novembro**.

A fórmula de design é explícita em `hierarquia-inicial-carreira.ts`: base da divisão (A76/B62/C49/D35/E23), até 12 pontos pelo RNC, até 8 pela campanha recente A/4 pela B e até 3 por receita documentada. Nos demais clubes, variação de posição no RNC contribui entre −2 e +2. A receita tem peso pequeno e não substitui força de elenco. Índice é convertido para a média alvo do melhor XI, com faixas contínuas; não entra como bônus escondido no motor.

**Esta é a hierarquia de referência do jogo, não a ordem oficial do RNC.** Flamengo, Palmeiras e Cruzeiro abrem a lista porque também entram divisão, campanha e estrutura. Empates de índice usam pontos do RNC e nome para ordenação determinística; essa posição ordinal não inventa uma diferença de força entre clubes sem dados diferentes.

| Clube | Posição geral inicial | Média alvo do melhor XI | Média antiga nesta semente |
|---|---:|---:|---:|
| Flamengo | 1 | 84,5 | 86,41 |
| Palmeiras | 2 | 84,2 | 86,09 |
| Portuguesa | 64 | 58,4 | 76,64 |
| Gama | 133 | 55,5 | 64,27 |

A lista completa está em `/workspace/shared/hierarquia-inicial-20261124/hierarquia-inicial.csv`. `ranking-clubes-carreira.ts` continua sendo outro indicador: a força efetiva atual depois das negociações, calculada do elenco, não a fonte desta hierarquia inicial.

## Aplicação uma vez, mantendo os históricos

Na abertura de uma **nova carreira oficial**:

1. O sorteio nativo materializa e confere os elencos reais de todos os clubes.
2. Calcula um deslocamento comum das faixas de notas de cada acervo para o melhor XI chegar à referência do clube. Mantém nomes, posições, categoria histórica e diferenças entre atletas, respeitando os limites 25–99.
3. Guarda uma ficha imutável de calibração no save e a origem/nota canônica em cada atleta. As sobras do mesmo acervo usadas no mercado recebem a mesma régua.
4. Grava valores de referência e reancora o catálogo daquela carreira antes do primeiro pregão.

Julinho continua na Portuguesa. Neste sorteio, sua faixa de **carreira** é 62,8–73,8; a faixa canônica 81–92 permanece registrada. A coleção de cartinhas de campeão e o catálogo original não mudam. Os novos campos não entram nas salas online.

Não há corte permanente por clube/divisão. Transferido, o jogador leva suas notas; promoção, temporada nova e F5 não aumentam ou restauram o overall. As diferenças posteriores vêm do elenco e das regras já existentes. Saves antigos sem ficha não são recalibrados automaticamente.

## Consistência econômica e oportunidades

- A nota efetiva manda no preço, salário e renovação. Raridade histórica acrescenta um prêmio proporcional pequeno (até 15%); uma lenda de força baixa não recebe o piso de estrela mundial só pelo nome. A fórmula anterior continua nos saves antigos. Salários seguem a carência existente até a T3, cobrando da T4 em diante.
- O mercado de sondagem das novas carreiras passa a listar os mesmos 155 adversários nacionais A/B/C/D que os bots podem negociar. Antes o humano ficava preso à mesma série. Mantém olheiro, categorias, disponibilidade real, proteção do XI/cobertura, orçamento e disputa do pregão. A interface não revela notas ocultas.
- Clubes brasileiros fora da série nacional usam seus elencos salvos nas copas. O caminho estatístico da Copa do Brasil deixa de somar o bônus antigo por divisão **somente na nova coorte calibrada**, pois a diferença já está nas notas. Carreiras antigas conservam seu comportamento.
- Não mudou inscrição incompleta da D/estaduais, limites de categoria, regras de promoção, taxas do motor ou premiação para fabricar um prazo de subida. Não adicionou jogadores.

## Verificações funcionais

- `testa-hierarquia-inicial-carreira.mts`: 228 referências únicas, melhor XI na meta com tolerância de 0,1, nomes/limites, economia, sobras do pregão, mercado nacional, recarga, transferência, promoção sem aumento, clube fora da série, catálogo canônico intacto, legado e paridade humano/bot na mesma semente.
- `testa-transferencias-carreira.mts`: transferências, proteção e reabertura dos 71 jogos do Paulista estáveis.
- `testa-mercado-oficial.mts`: Gama, Portuguesa, ABC e Flamengo; conservação financeira, categorias, quatro divisões e exclusões de legado/online.
- `testa-carreira-revisao.mts`: contratos, salários e mínimos de elenco.
- `testa-hierarquia-ui.mjs`: abertura real a 390 e 1440 px, sem exceções/overflow; mostra referência inicial e carência de salários, mantendo o padrão visual.
- `testa-revisao-carreira-ui.mjs`: central e elenco reais a 390/1440, calendário estável e sem exceções.
- Build TypeScript/Vite e `git diff --check` passaram. Não houve commit de visual.

Capturas reais: `/workspace/shared/hierarquia-inicial-20261124/telas/inicio-portuguesa-390.png` e `inicio-portuguesa-1440.png`.

## Simulações e limites

Evidências em `/workspace/shared/hierarquia-inicial-20261124/`. As execuções antigas não devem ser misturadas nem contadas como novas amostras:

- Protótipos usavam políticas/orçamentos incompletos, ou avaliador antigo, ou piso de categoria anterior. Tentativas com diretório compartilhado e avaliação de lote mascarado incorreta estão arquivadas como inválidas.
- `validada-final` e `controle-gestao-completo` revelaram outro defeito da bancada: depois de poupar titulares, o gestor mantinha reservas fracos, mesmo com os melhores descansados. O Flamengo ficou com XI médio 69,87 na T2 apesar de um elenco capaz de muito mais. **Não usar esses resultados como evidência da dificuldade humana.**
- O gestor corrigido recompõe o melhor XI próprio conhecido antes de aplicar o rodízio por cansaço. Não lê notas ocultas dos rivais na política pública. O controle privilegiado pode ler essas notas e é identificado separadamente.
- A espera de desempate apenas avança o relógio virtual até o prazo nativo, em vez de executar centenas de comandos prematuros. Duas temporadas comparadas antes/depois produziram os mesmos campos esportivos/econômicos/copas; não é otimização do produto nem medição de FPS.

### Resultados com o rodízio corrigido

| Execução | Semente | Temporadas | Mudanças de divisão | Situação final / caixa / folha |
|---|---:|---:|---|---|
| Portuguesa, informação pública, orçamento0,6 | 20261123 | 12 | D→C no fim daT12 | C /47 /30 |
| Portuguesa, informação pública, orçamento0,6 | 7919001 | 12 | D→C T4; C→D T8; D→C T10; C→D T11 | D /26 /29 |
| Portuguesa, informação pública, orçamento0,6 | 871217 | 12 | D→C T6; C→D T7 | D /66 /27 |
| Portuguesa, notas conhecidas, orçamento0,85 | 20261123 | 20 | D→C T8; C→D T20 | D /5 /35 |
| Flamengo, informação pública, orçamento0,6 | 20261123 | 2 | Permaneceu naA, posições7 e12 | A /630 /73 |

Cinco trajetórias concluídas, **58 temporadas**, sem alertas nas verificações anuais de integridade de elencos. As três sementes públicas da Portuguesa não chegaram àA em12temporadas. O controle privilegiado também não chegou em20; não é um gestor ótimo nem prova que a promoção seja impossível. Ele aumentou a média do XI de59,34 naT1 para73,01 naT17, com compras pagas, mas não converteu isso em acesso àB. Isso é um **alerta de progressão**, não motivo para declarar o jogo justo por ter ficado mais demorado.

A hierarquia inicial e sua persistência estão funcionalmente verificadas. **O equilíbrio geral da progressão não está encerrado.** Antes de publicar como solução final de dificuldade, é preciso confrontar outras políticas de gestão, aproveitamento tático e resultados de times equivalentes nos caminhos físico/estatístico; não aumentar notas do humano ou impor anos mínimos para obter um resultado desejado.

Evidência final: `gestao-rodizio-corrigido/repeticao.json`, `controle-rodizio-corrigido/repeticao.json`, `flamengo-rodizio-corrigido/repeticao.json` e `evidencias-finais.json` com hashes e contagens. As execuções anteriores e o teste do relógio não entram nessas58temporadas.

Não há mínimo obrigatório de temporadas ou garantia de promoção. Uma política automatizada e poucas sementes não representam a probabilidade de todos os usuários. Calendário de copas é anual nesta bancada; não reproduz todos os eventos pessoais e cada toque humano. Clubes estrangeiros continuam com referência, não uma economia completa simulada.

## Reversão

`HIERARQUIA_INICIAL_CARREIRA=false` impede a criação de novas fichas. **Preservar os leitores, a calibração de catálogo e as regras econômicas dos saves já calibrados**: remover tudo e restaurar nota canônica nessas carreiras desfaria o elenco do usuário. Não há migração destrutiva de saves antigos e nada foi publicado nesta etapa.
