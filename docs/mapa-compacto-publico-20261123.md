# Bairro compacto do futebol — 23/11/2026

Diego autorizou a implantação do mapa aprovado para todos, incluindo NPCs, torcida e ambulantes. A liberação usa `MAPA_COMPACTO_GERAL` em `src/escalacao/mapa-compacto/model.ts`. A arena de basquete continua no cenário próprio.

O bairro flutuante usa a geometria real do jogo, com os lotes e ruas do estudo aprovado. O estádio continua sendo construído pelo save existente. O Clube Recreio mantém duas quadras de futevôlei, piscina e churrasqueira; a Casa Luca ocupa o lote vizinho. Shopping, patrocinadores, calçadas, cruzamentos e acessos foram reposicionados, com oito casas residenciais. A navegação aceita a borda da ilha sem deslocar a câmera para tentar cobrir o terreno antigo.

## Público e calendário

`populationPlan` recebe o resultado existente de `publicoDoEstadio`: torcida do clube, capacidade e ocupação, além do visitante quando conhecido. Nenhum número novo é gravado como público, ingresso, receita ou torcida. Os bonecos são uma amostra visual limitada, nunca uma representação de todas as pessoas por indivíduo.

- Dia sem jogo em casa: moradores, comércio, lazer e transporte; sem filas e ambulantes do estádio.
- Chegada: maior concentração nos portões, camisas nas cores dos clubes, bandeiras, pedestres chegando dos pontos e estações e ambulantes na praça frontal.
- Bola rolando: público externo reduzido; no modo de partida focada, o bairro inteiro sai da árvore renderizada e suas animações param.
- Saída: fila diminui durante dois minutos de apresentação e os pedestres que já estavam caminhando retornam pelo próprio percurso. A troca de fase mantém suas identidades e distância no caminho.
- Noite/chuva reduzem moradores; feira e pelada respeitam o calendário de bairro já existente. Não avançam o dia da carreira.

Orçamento de torcida nos portões: até 42 no celular e 120 no desktop, ajustado pela demanda. Até dez pedestres com animação corporal, seis deles no máximo como chegadas no celular. Torcida estática, bandeiras e frequentadores usam instâncias. Visitantes só aparecem quando há os dados reais do clube visitante. Até três/cinco ambulantes no pré-jogo móvel/desktop, um durante a partida e dois/três na saída.

## Integração e propriedade

O campo, os 22 jogadores, a partida oficial, o placar, os bancos, o giro de chegada e as arquibancadas continuam nos controladores existentes. O centro do estádio permanece na origem, com o bairro deslocado em +30 X e +10 Z. Ônibus das delegações usam novos acessos externos e preservam o desembarque e a passagem pelo portão de serviço originais.

Hotel, loja, choperia, alimentação, metrô e estacionamento obedecem às compras do save. As quatro etapas do estacionamento são grupos independentes. Metrô e trem só aparecem se a estação já foi comprada. Carros particulares vêm exclusivamente da carteira confirmada, preservam a dupla da garagem e fazem ida e volta por percursos próprios; não há compra, concessão ou débito novos.

O carregamento usa um GLB local versionado, agrupado por estabelecimento, com geometria Meshopt e texturas incorporadas (~7,10 MB). O navegador não precisa primeiro construir a cidade antiga para depois reorganizá-la. O exportador remove a extensão de relevo `EXT_materials_bump`, que o GLTFLoader não suporta, e as seis imagens de ruído que ela deixaria inutilizadas. As superfícies mantêm suas texturas de cor. Não há CDN ou serviço pago adicional.

## Reprodução e verificação

Servidor local: `node scripts/mapa-compacto/serve.mjs` (porta 5184).

- `node scripts/mapa-compacto/check-layout.mjs`: 33 lotes, oito vias conectadas, 13 cruzamentos e 35 percursos; cruzamentos/edificações separados e percursos de transporte sobre ruas ou baias.
- `node scripts/mapa-compacto/test-model.mjs`: fases, influência das duas torcidas, visitante desconhecido, chuva/noite, limites de população, portais e portão original das delegações.
- `node scripts/mapa-compacto/runtime-check.cjs`: carregamento do componente real e quatro fases do dia de jogo.
- `node scripts/mapa-compacto/runtime-details.cjs`: desktop 1440 e celular 390, ilha centralizada, lazer, shopping, etapas 0/1/2/4, metrô sem compra ausente, carros comprados indo e voltando e desmontagem sem erro.
- `FOCO_ORIGIN=http://127.0.0.1:5184 FOCO_BASE=/ node scripts/testa-mapa-foco-browser.mjs`: 22 jogadores, cidade e NPCs removidos da árvore durante o jogo, zoom restrito, passeio e assentos, retorno ao mapa durante a semana.
- `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`: TypeScript e build completo do Vite.

Para reconstruir o asset, abrir o servidor local e executar `node scripts/mapa-compacto/export.cjs`, seguido de `node scripts/mapa-compacto/compress.mjs`. Alterações futuras devem receber outro nome versionado. O teste de compressão confere a igualdade de todos os buffers de geometria decodificados. As imagens dos testes são capturas do componente real; Chromium/SwiftShader valida funcionamento e geometria, mas não mede FPS de um Samsung S25.

## Reversão

Desligar `MAPA_COMPACTO_GERAL` e publicar retorna ao cenário anterior. Nenhum save precisa ser migrado ou apagado. Falha de carregamento do GLB também abre o cenário anterior. A publicação conserva a política atual de preservar arquivos da versão anterior e não força atualização de quem está jogando.
