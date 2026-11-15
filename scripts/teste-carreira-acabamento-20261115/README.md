# Verificação local do acabamento da carreira

Usa as telas reais montadas pela fixture de `teste-mapa-clube-20261113`, com estado local de demonstração. Os navegadores bloqueiam requisições externas e WebSockets; não usa contas reais, pagamentos ou escrita no Supabase.

Inicie o Vite na porta 4201. Informe em `QA_SEED` o caminho de um estado local compatível, posterior ao leilão, com histórico de temporadas. O caminho padrão aponta para a amostra desta auditoria no workspace, que não está versionada. Chromium deve estar em `/usr/bin/chromium`; usa `playwright-core` e SwiftShader.

- `verifica.mjs`: finanças contra o extrato, obras/requisitos, bens, personagem, permissões gratuitas e larguras de 320, 390 e 1440 px.
- `fluxos.mjs`: controles, continuidade da rodada, museu e descarte de canvas, agência, segundo clube, tela cheia e passeio por toque.
- `relogio.mjs`: fonte compartilhada entre campo e mapa; abrir, pausar e retomar sem reiniciar o jogo.
- `copa.mjs`: ida/volta, gol tardio, velocidade e ordem dos resultados/pênaltis.
- `liberacao.mjs`: mapa público, bens já possuídos, compras de móveis/veículos e trocas bloqueadas, organização de móveis preservada e autoridade do clube.
- `compara.mjs`: capturas equivalentes antes/depois. Precisa também do Vite com a base anterior na porta 4209. Compara câmera, alvo e estado da cidade.

Execute os arquivos com Node a partir da raiz do projeto. Os resultados e imagens ficam em `/workspace/shared/carreira-acabamento-20261115/`. As asserções falham com código de saída diferente de zero. A comparação usa a base `485efcb8`; os quatro commits de basquete entre ela e a auditoria original não alteraram os painéis comparados.

Complementos: `npm run build`, `npm run saf2` e `npm run nuvem-craque`. As verificações locais não medem FPS ou memória de um telefone físico, nem confirmam persistência real na nuvem.
