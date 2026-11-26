# Cenas de jogadores e lesão durante a partida — 25/11/2026

Autorização: “Ok faça isso e tudo q falamos anteriormente das animações boates e etc”. Complementa as revisões locais de cenas do bairro e de preparação/lesões. Branch `feat/cenas-bairro-preview-20261125`, base pública `45fd47d`. **Publicação desta etapa visual autorizada em 25/11/2026: “entao publique”.** Nenhuma conta real foi aberta/alterada nos testes.

## Acontecimentos e arte

- Futevôlei: quatro avatares articulados em duplas dentro de uma das duas quadras reais do Clube Recreio. A bola alterna os quatro participantes, passa sobre a rede e os participantes fazem movimentos de perna. Piscina, churrasqueira e segundo campo continuam no lugar.
- Balada: dança articulada em frente à entrada existente, iluminação noturna e dois pontos de luz sem sombras. Não reutiliza a caminhada genérica como ação principal.
- Recuperação: alongamento acompanhado, com dois atores e tapete junto ao campo de terra. Retorno: trabalho com bola/cones, respeitando a disponibilidade gradual existente. A primeira composição com maca foi descartada por interseção do personagem com o móvel.
- Apresentação de reforço, coletiva e patrocínio: pequeno cenário temporário na entrada do estádio, com três avatares, mesa/fundo e camisa na apresentação. Técnico: reunião no campo existente. Não foi criado prédio médico pago, cura acelerada ou lote sobre ruas. O campo existente serve para os trechos de preparação, sem uma compra nova de CT.
- Novas fontes reais: lesão e retorno registrados; transferência importante confirmada; treinador contratado; resposta efetivamente escolhida em coletiva; renovação Master; marcos de jogos/gols na memória existente; primeira participação **contabilizada no registro** de um atleta da base; concentração para semifinal/final já definida. Não afirmar estreia histórica com base no primeiro registro de um save antigo.
- Títulos/acesso, loja, obras, despedidas, clássico e chegada da torcida continuam no seletor. Só uma cena por vez; fatos comuns não obrigam vídeo; intervalo de três rodadas e IDs persistentes evitam repetir a mesma história. Título/acesso conservam a prioridade excepcional.
- Cena recebe identificação opcional de jogador (id/nome/clube/ano), inclusive ao repetir, redimensionar ou trocar qualidade. Rosto é avatar estilizado do jogo, não retrato real do atleta. Nenhuma imagem gerada externamente ou filmagem de conta real foi usada.
- Corrigida a identificação por nome que confundia o Romário histórico com um homônimo contemporâneo. Romário, Adriano, Edmundo e Renato possuem identidades qualificadas curadas; Pepe conserva a distinção Santos/Real Madrid. Não reescrever histórias já salvas.

## Lesão e fluidez

A checagem existente de desgaste continua **uma por equipe/rodada**, sem multiplicar o risco por onze titulares. Quando esse mesmo sorteio já encontrou uma lesão, uma chave determinística escolhe preparação ou segundo tempo. Nas ligas M2 com relógio nativo, a parte ao vivo ocorre entre 55′ e 78′; não há segundo sorteio de risco. O causo anual e os caminhos antigos mantêm a preparação. Não foi acrescentado sorteio de lesão ao vivo nas copas, bots, salas online, basquete ou F1.

- Plano opcional pequeno no save, com temporada/rodada/clube/jogador/minuto/prazo. Repetir seleção de placar/2D/3D não muda o plano nem anuncia uma lesão futura. Não inserir sorteios novos em partidas antigas já iniciadas.
- Ao atingir o momento, a partida pausa e abre a escolha. Reserva da mesma posição entra por confirmação, com o limite compartilhado de **três substituições**, incluindo intervalo. Seleção inicial sugere um reserva elegível, sem efetivar troca sozinha.
- Sem reserva ou sem trocas, o atleta é realmente retirado do motor e a vaga fica vazia no restante desse jogo. A escolha informa que o time seguirá com um a menos. Não criar jogador durante a partida.
- Se o goleiro sair sem substituto, exige escolher um atleta em campo para o gol. Papel de emergência não muda a carta, o OVR ou a categoria.
- Se o atleta já saiu por troca/vermelho, o incidente planejado é cancelado; não sortear outro no lugar.
- Retirada/substituição entram na mesma agenda gravada usada pelo placar, 2D, 3D, resultado e reconstrução. Chaves antigas permanecem idênticas sem os novos campos. Não usar cartão vermelho para fingir lesão.
- Na apresentação 3D, a interpolação anterior é associada ao id do atleta, evitando deslocar coordenadas para o jogador errado quando a lista diminui. A trilha nativa deixa de desenhar o lesionado.
- Após o apito, o próximo jogo fica pendente no Elenco: resolver a substituição/escalação e, se necessário, escolher entre as opções da base já existentes. Só aí alguém pode subir. Jogos passados e XI das rodadas anteriores permanecem intactos.
- Persistem plano, decisão e desfalque. Os testes de retomada preservam o próximo jogo pendente. Na reabertura antes do último comando salvo, um aviso informa quando o usuário poderá alterar o time novamente; não oferecer troca que o reducer rejeitaria por tentar reescrever o passado. Não foi criado novo salvamento do instante exato da animação da partida; o relógio de reabertura continua a regra já existente do modo.

## Peso e isolamento

Somente a cena visível cria os atores: dois na recuperação, três nas apresentações, quatro nas cenas coletivas. Avatares GLB existentes (Quaternius), poses limitadas a 18 atualizações/s, sem sombras; cache das fontes compartilhado e esqueletos/materiais/props liberados ao sair. Sete segundos de apresentação sem avançar o calendário, o dinheiro ou a partida. Respeita movimento reduzido e reprodução manual. O histórico de cenas é limitado; plano clínico mantém apenas um registro ativo/recente; a ficha M2 conserva as decisões como já fazia com trocas.

Bancada WebGL real com SwiftShader: sete cenas sem erros; recuperação 12.512 triângulos, apresentações aproximadamente 19 mil, futevôlei 25.228. **Isto não mede FPS em um celular físico.** Sem assets novos pesados, alteração de OVR/economia, jogadores adicionais ao baralho ou mudança no online. Os campos novos são opcionais, limpos na carreira nova e retirados da sincronização online.

## Evidências e verificação

- `/workspace/shared/cenas-jogadores-20261125/revisao.html`: capturas do motor real em móvel e desktop, futevôlei/balada gravados do canvas, sete composições e relatório de execução.
- `/workspace/shared/lesao-partida-20261125/revisao.html`: avisos nativos, com reserva, sem reserva e goleiro; relatório da interface.
- `scripts/testa-lesao-partida.mts`: retirada real, reserva, três trocas, sem reserva, goleiro de emergência, decisões persistidas, causalidade, reconstrução e 36 quadros nativos 3D antes/depois da retirada.
- `scripts/teste-lesao-partida/runtime.mjs`: fluxo real do Pyramid em 390/1440 px, pausa, decisão, apito, desfalque seguinte, ausência de reescrita do passado, save/retomada.
- `scripts/teste-preparo-lesao/runtime.mjs`: aviso antes da abertura 3D, reserva/base, escolha explícita, retomada e plano futuro sem anunciar lesão na preparação.
- `scripts/testa-cenas-bairro-central.mts`: prioridade/intervalo/IDs/limites, ausência de vídeos em 60 resultados comuns, identificação, homônimos e fatos confirmados.
- Regressão de evolução: 535 amostras nativas 3D, formação/intervalo/copa/máximo três, 1.800 registros em 30 temporadas. Trocas M2: 12 jogos com passado preservado e reconstrução igual ao ao vivo.
- A revisão anterior já documenta três fixtures antigos de empréstimo SAF que falham também no HEAD público; não alterar regra de empréstimo para encaixar esse teste antigo.

Estado final de compilação e dos relatórios em `validacao.json` nas pastas de revisão. Revisão visual apresentada; publicação expressamente autorizada. Resultado do deploy será registrado ao concluir a entrega.
