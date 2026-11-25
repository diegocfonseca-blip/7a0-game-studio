# Carreira: apresentação compacta para todos — 25/11/2026

## Aprovação e escopo

Diego aprovou as oito telas de referência e a publicação para todos: “Ok, pode fazer tudo e publicar p todo já tb”. Pediu adicionalmente um mapa maior no celular e a retirada de “Patrocinadores” de cima do mapa. Referências locais: `/workspace/shared/mockups-carreira-20261124/`, telas 01–08; material de apresentação, sem código de protótipo incluído no produto.

A entrega é de apresentação na carreira de futebol. Preserva permissões, limites de três trocas, táticas, elenco fixo, formações, mercado, contratos, dinheiro e salvamentos. A Liga Draft mantém as alterações já publicadas em `88787d9d`.

## Resultado

- Marca e cabeçalhos menores no celular. As sub-abas selecionadas ficam roxas; os seis destinos principais continuam dourados.
- Rodada destacada ao lado da divisão; remoção somente do estado redundante “Bola rolando”. Encerramento e avisos de pendência continuam disponíveis.
- Escudos e placar menores no celular, preservando leitura da narração e gols.
- Botões Substituir e Táticas abrem o mesmo painel pausado já existente. Em campo e reservas ocupam duas colunas; posições incompatíveis e quarta troca continuam bloqueadas.
- Durante o painel, o placar grande fica oculto visualmente, permanecendo montado para preservar relógio e simulação. Um placar pequeno usa somente o estado já apresentado, sem revelar o resultado final.
- Classificação e outros jogos recebe o cabeçalho da competição quando selecionada. Na Partida móvel a tabela fica na sub-aba própria; no desktop continua a composição lado a lado.
- Elenco e Mercado recebem espaçamentos compactos e sub-abas coerentes com a apresentação aprovada. Instruções, onboarding, conta e salvamento permanecem acessíveis.
- Ranking sazonal permite filtrar Sua série ou todas as séries. Histórico e prêmios continuam com as regras anteriores; o filtro não reduz o histórico de todas as temporadas nem a Copa encerrada.
- Clube recebe quatro acessos com descrições. Loja e Agência continuam acessíveis quando não ocupam os quatro cartões.
- No celular o mapa usa mais largura, altura útil maior e aproximação inicial do bairro do estádio. Ver cidade conserva o panorama completo; zoom, deslocamento e tela cheia permanecem disponíveis.
- Retirado o botão sobreposto “Patrocinadores →”; marcas, prédios, menu Locais e a área Patrocínios permanecem.

## Verificação

Bancadas locais usam estado separado e bloqueiam serviços externos; não acessam nem modificam contas reais.

- `scripts/teste-travas-carreira/ciclo-publicacao.mjs`: placar móvel, 2D móvel, última rodada desktop e 3D real com WebGL; pausa, retorno, três trocas, bloqueio da quarta, tática sem gastar troca, preservação do XI fixo, retomada do estado e apito final. Os quatro cenários passaram.
- `scripts/teste-visual-carreira/verifica.mjs`: telas reais 390/1440, abas, painel em duas colunas, filtro sazonal e ausência de vazamento horizontal. `QA_GPU=1` confere mapa no celular, Locais e diferença entre visão inicial e cidade inteira. Brasil Oficial e tradicional passaram. No mapa de 390 px, a área útil aumentou de 322 para 350 px de largura, com 668 px de altura; a visão inicial ficou mais próxima e Ver cidade preservou o panorama completo. Evidências em `/workspace/shared/visual-carreira-publico-20261125/`.
- `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`: TypeScript e produção concluídos sem erros.
- `LL_SAVE_BASE=http://127.0.0.1:5344 LL_SAVE_LABEL=carreira-compacta node scripts/teste-salvamento/publicacao.mjs`: versão compilada retornou HTTP 200 em 390/1440, sem erros JavaScript.

## Publicação e reversão

Publicação autorizada para todos, pelo fluxo normal do GitHub Pages, preservando os arquivos de versões anteriores e sem recarregar partidas à força. Registrar commit e execução após a conclusão.

A reversão é feita revertendo o commit desta entrega. Não há migração de banco nem mudança no formato dos saves para desfazer.
