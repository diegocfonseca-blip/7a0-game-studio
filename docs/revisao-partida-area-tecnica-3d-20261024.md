# Partida 3D, arbitragem e área técnica — 24/10/2026

Pedido: revisar continuamente a sensação de futebol, preservando os Civis NO FACE, e usar o mesmo estilo no juiz, técnicos/presidente e reservas. Alterações de apresentação; Motor2, atributos, resultados, carreira, cidade e estádio preservados. Sem escrita em DB/save.

## Problemas confirmados e correções

1. Juiz, técnicos e reservas eram personagens rígidos antigos mesmo quando os atletas já eram Civis. `sidelines.mjs` reutiliza o mesmo modelo/rig aprovado, roupas existentes e capturas adquiridas. Há um árbitro seguindo a posição oficial, dois técnicos e bancos nas coordenadas existentes da área técnica. A marcha do árbitro usa a passada calibrada do jogador. A rota antiga também podia cruzar um atleta: acrescentados antecipação de cruzamentos e separação conservadora das cabeças renderizadas, movendo somente a apresentação do árbitro (antecipação até 1,8 m e correção limitada a 2,4 m da referência). Não se criaram novas anatomias ou roupas primitivas.
2. Os bancos usam `SitDown` original do GLB Quaternius CC0, em pose final, com solas no piso e assento ajustado à pose. Compartilham malhas e atlas dos clubes. LOD oculta apoio fora do enquadramento/distante; os reservas sentados não reavaliam a animação a cada quadro.
3. A lista de suplentes filtra atletas em campo, expulsos, duplicatas, IDs vazios e fillers, limitada a sete por lado. Reaproveita os slots para a lista real atual, separando goleiros e atletas de linha para não trocar a roupa de função. Nenhuma carta/ID foi criada no jogo. **O save exportado do Neymarzetti tem 11 atletas disponíveis e zero reservas reais**; seus bancos ficam vazios. A imagem com 14 suplentes é uma bancada sintética, explicitamente marcada e nunca gravada na carreira.
4. O presidente existente é passado por referência ao montar os personagens. Só o técnico do lado identificado por `viewerClubId` recebe sua identidade. Nome, tom de pele disponível e ausência de cabelo podem ser representados. Roupa/cabelo/acessórios completos do presidente 2D ainda não têm equivalentes 3D fiéis: a roupa civil do técnico é provisória. A arte do presidente no escritório permanece intacta.
5. A orientação da aproximação do passe mudava abruptamente com a posse/distância da bola. A correção agora é angularmente limitada e contínua na distância e no giro de 180°. Na mesma partida completa, o salto fora de reinícios de Paolo Montero aos 60,7 s deixou de ocorrer. Não se moveu a bola oficial nem se atrasou seu impulso.
6. **Expulsão reproduzida em teste local:** após o vermelho de Cuadrado, o Motor2 reduz a lista para 21. A condição antiga `snapshot.players.length !== 22` apagava a partida do mapa. A integração passou a aceitar a redução oficial e conserva os mesmos objetos dos avatares, ocultando o slot sem jogador. O plano não é recriado só porque houve um vermelho. O teste verifica os UUIDs, 21 avatares visíveis, ausência do expulso no banco, continuidade e placar final oficial. A leitura inicial de que a fonte sempre mantinha 22 slots foi descartada após executar este teste.

O uniforme de arbitragem seleciona entre ciano, rosa e verde-lima a cor mais distante das duas camisas e do dourado dos goleiros. Isso evita que o árbitro antigo amarelo pareça um terceiro goleiro; não modifica o uniforme dos clubes.

## Validação realizada

- Partida inteira de Rei da Bola FC × Neymarzetti: 2.821 quadros a 30 Hz, mesmos **1×1 / 82 eventos**, zero penetrações pé–bola/piso, zero estouros do orçamento de raiz, zero toques falsamente confirmados e zero erros JS.
- Comparação da mesma partida: correções bruscas fora dos reposicionamentos oficiais **1 → 0**. Permanecem três reposicionamentos nas saídas oficiais, uma aproximação conservadora de cabelo e 211 amostras com pé afastado mais de 22 cm durante domínio/preparação (antes: 208). Logo, **o domínio/condução não está aprovado universalmente** só porque o salto foi removido.
- Os três replays de contatos continuam com **52/44/36** contatos preparados válidos, preservando eventos/placares. Alguns lances seguem sem captura segura.
- Bancada do componente real do mapa: um juiz, dois técnicos, nenhum personagem antigo duplicado, rig de 23 ossos, solas no piso, pausa estável. Teste local adicional com 14 reservas sintéticos para validar assento/filtro/identidade; não são suplentes do save do Diego.
- Árbitro na partida inteira: 1.881 amostras a 20 Hz, zero sobreposições dos volumes conservadores de cabeça com os atletas, margem mínima 2,5 cm. Não ocorreram deslocamentos maiores que 65 cm por amostra de 50 ms. É uma verificação desta sequência, não aprovação universal da navegação ou de todas as partes da malha.
- Variante local com seed +4: vermelho de Cuadrado aos 31,6 s, jogo segue com 21 atletas, mesmo pool de modelos e resultado oficial **5×0**. Este resultado pertence somente à fixture de QA, não é rodada da carreira.
- Vídeo normal/lento e capturas são do renderizador real. O campo de terra corresponde ao save sem evolução de gramado cadastrada. Testes de navegador/LOD não certificam FPS de celular físico.

Reprodução: `node scripts/cartoon-football/test-sidelines.cjs` prepara as variantes somente em `test-results/` a partir da exportação privada já existente. `test-referee-clearance.cjs` verifica a separação do juiz e registra correções bruscas. `audit-whole-match.cjs`, `test-runtime-matches.cjs` e `record-sideline-review.cjs` usam o servidor local na porta 4197. Evidências em `test-results/cartoon-football/apoio-partida/`, incluindo comparação `whole/` × `whole-after/` e `world-tests.json`.

## Próximos pontos que mais aproximam a leitura de futebol

1. **Recepção e condução:** antecipar pé de recepção, amortecimento e toques separados. Ainda falta captura específica; a adaptação de marcha/IK não equivale a domínio adquirido.
2. **Peso e apoio:** reduzir deslizamento das passadas na aceleração/freada, preservar pé de apoio, quadril e recuperação após passes/chutes. Conferir a sequência completa, não só o instante medido do impacto.
3. **Sem bola:** corpo comunica apoio, marcação, cobertura e reação à perda usando os alvos oficiais. Evitar orientar todos para um único ponto ou criar outra IA concorrente.
4. **Goleiros e bola aérea:** ampliar capturas de pega/rebote, recepção alta e cabeceio. Só há uma adaptação de pega/reposição revisada; postura de espera não fornece todas as defesas.
5. **Arbitragem/área técnica:** juiz visual já acompanha a fonte; faltam sinais adquiridos de cartão/falta, gestos do técnico e reações de banco. Não inventar esses gestos com rotações de braços.
6. **Leitura visual:** conferir bola, sombras, uniformes, enquadramento e textura na condição real do estádio e em retrato/paisagem. Não aumentar avatares/bola nem antecipar obras do gramado para compensar a câmera.

## Rotina solicitada pelo Diego

Em cada manutenção do futebol 3D, revisar evidência nova de uma partida completa e trechos próximos em velocidade normal/lenta: com e sem bola, passe/recepção/finalização, goleiro, reinícios, pausa e fim. Comparar à fonte oficial e registrar falhas/lacunas, inclusive contatos não preparados. Só declarar corrigido o que foi reproduzido e verificado; gol ou bola chegando ao destino não bastam. O pedido não cria uma tarefa automática em segundo plano após encerrar a conversa.

Publicação somente na prévia privada já autorizada, após build/testes e workflow verde. Atualização do cliente continua manual.
