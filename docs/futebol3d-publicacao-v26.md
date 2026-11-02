# Publicação do futebol 3D v26 — conta de teste

Autorização do proprietário: “Publique tudo na minha conta já… campo 2D, mapa da cidade e campo 3D é só na minha conta”. Entrega integrada sobre a `main` atual, preservando os trabalhos recentes de salas, loja e carreira. Não inclui gravação de save, avanço de rodada ou alteração de banco.

## Pacote

O caminho de produção `futebol3d/players-novo.mjs` usa o avatar estilizado NO FACE aprovado e o controlador revisado em `futebol3d/chibi/`. Os módulos testados anteriormente em bancada foram integrados com imports relativos. Não há dependência de `/scripts/` ou `/test-results/` no runtime gerado.

`assets/jogador-estilizado-v1.glb` é a exportação de caminhada/corrida já existente no projeto para o modelo fornecido e aprovado pelo proprietário. Tem **4.756.492 bytes** e é emitido pelo Vite com nome versionado. O arquivo é carregado sob demanda e compartilhado pelos 22 atletas e pelo árbitro, em vez de baixar um arquivo por jogador. O doador de clipes e o pipeline de retargeting existentes foram preservados. Não se atribui uma nova licença ao arquivo enviado pelo proprietário. Origem/hash dos módulos e do asset em `chibi/integration.json`.

Inclui as revisões locais de orientação, corrida, preparação, domínio, continuidade da bola, contato, separação entre atletas, goleiros e sinalização do árbitro. Em particular, o corpo acompanha a bola antes de abrir em arco para o passe, em vez de ultrapassá-la e aguardar no ponto futuro da batida. Rig, malha e estilo aprovados preservados.

O observador opcional de toques lê evidência do motor para sincronizar a apresentação. O motor em `motor2/`, resultados, categorias, atributos e descanso não foram editados. O relógio compartilhado e o replay mantêm os eventos oficiais ao mudar a velocidade de visualização.

## Restrição e compatibilidade

A autorização continua em `presidente-acesso.ts`, usando a identidade conferida por `supabase.auth.getUser()` e a lista privada existente. A câmera também bloqueia entradas alternativas sem essa conta. O campo 2D da apresentação exige a mesma conta verificada, inclusive com preferência local antiga ou campo lógico da sala ligado.

A lógica de duração de uma sala online permanece compartilhada. Só a exibição experimental é restrita: não se muda o relógio de convidados, host, gols ou resultado por esconder o canvas.

Não há atualização automática da página. O workflow existente mantém as versões anteriores dos assets por três dias; o usuário atualiza manualmente para abrir a nova versão.

## Verificação antes do envio

- Build completo `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao npm run build`.
- 26 suites executadas sobre os módulos de produção: `node scripts/futebol3d/testa-fundamentos-v26.cjs`.
- Cinco partidas históricas completas pelo entry point de produção, 6.975 estados e os mesmos 383 contatos planejados confirmados, com relatórios oficiais idênticos aos da v26 validada em bancada.
- `node scripts/futebol3d/testa-publicacao-v26.cjs`: conta autorizada, segunda conta, logout, preferência 2D forçada, entrada alternativa do mapa, troca entre mapa livre/transmissão/tática, 22 atletas, modelo correto e apenas um download do GLB. Viewports desktop e 390×844; rede externa bloqueada e Auth simulado no limite de rede, sem substituir o hook ou o renderer.
- `npm run recarga`: nenhuma recarga automática e manutenção dos assets antigos preservadas.
- Asset emitido no build com hash idêntico ao aprovado; ausência de referências a arquivos privados no JavaScript de produção.

O teste de acesso usa `qa-futebol3d-publicacao-v26.html`, que não é uma entrada do build público. Ele requer a fixture privada existente em `test-results/career-chibi-20261030/private/match-r1.json`. As evidências e saves locais ficam ignorados em `test-results/release-v26/`.

As capturas em WebGL por software e viewport móvel não são benchmark de telefone físico. A publicação desta versão de testes não certifica perfeição de todos os fundamentos. A base da cidade e do estádio existente foi preservada.

## Reversão

Reverter o commit desta publicação restaura o renderer e a integração anteriores sem tocar no save ou no banco. Não reverter commits de outros trabalhos. A revisão anterior à integração permanece no worktree de desenvolvimento e nos pontos de recuperação locais da v26.

Conferência adicional: a interface real da carreira foi montada com a cópia privada da rodada 4 do Neymarzetti, em viewport 390×844, sem injeção de renderer. A entrada normal do mapa carregou 22 atletas, o modelo aprovado e a revisão 26. Alternar as câmeras preservou partida, tempo e placar. Todo tráfego externo estava bloqueado; não houve avanço da carreira na nuvem. Evidência local: `test-results/release-v26/career.json`.

O fingerprint do motor oficial permaneceu `23599bdba04b0c7c2639389e2509f4d81a34796083f78b6a5d81e97c0d22bbbd`, idêntico ao utilizado na revisão anterior. O workflow de publicação e sua política de retenção não foram alterados.
