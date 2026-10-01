# Verificação local da carreira internacional — 1º de outubro de 2026

**Escopo:** Chromium + Vite em `127.0.0.1`, sem deploy, push, PR ou escrita no banco. Todas as requisições do navegador para `*.supabase.co` foram abortadas. `supabase.auth.getUser` e `onAuthStateChange` foram substituídos apenas na página de teste por usuários fictícios com e-mails `diego.c.fonseca@gmail.com` e `outra@conta.test`. A primeira identidade usa o endereço permitido como entrada do teste; não houve login na conta real.

## Fluxos executados

| Caso | Resultado observado |
| --- | --- |
| Save sintético T87 sem as propriedades `careerInternational` e `careerInternationalHistory` | Painel das três competições apareceu para a identidade Diego simulada; usuário sem vaga acompanhou os bots. |
| T87: iniciar, avançar 6 das 14 etapas, fechar a aba, abrir outra na mesma sessão | Retomou na etapa 7/14. O cartão de fim da liga voltou e precisou de “Continuar”, como já ocorre no fluxo da tela. |
| T87: terminar as 14 etapas | Histórico salvo uma vez, com registros dos 72 clubes e estatísticas dos jogadores bots. Nenhum erro JavaScript na página. |
| T87 → T88 pelo botão “Mesmo time” | `seasonNo=88`, histórico T87 preservado; campanha T87 removida do save após correção em `store.tsx`. |
| Outra identidade simulada, T87 | Painel internacional ausente; nenhum erro JavaScript. |
| Save sintético T100 sem campos internacionais | Após terminar Libertadores, Champions e Mundial, apareceu “Disputar a Copa do Mundo”. A escolha de seleção abriu; Brasil aceitou 11 cartas reais, e a fase de grupos da Copa do Mundo iniciou. Nenhum erro JavaScript. |
| Fluxo isolado da interface de inscrição, Flamengo e Real Madrid | Em cada clube: seleção da instituição, inscrição de 11 cartas reais, 14 etapas, encerramento e estante/ranking internacional. Flamengo abriu Libertadores; Real Madrid abriu Champions; nenhum erro JavaScript. O teste usou propriedades locais do componente, não a classificação completa da Série A. |
| Jornal da T87 após campanha internacional sem vaga do usuário | Exibiu os campeões de Libertadores, Champions e Mundial; histórico salvo com 72 clubes e 792 jogadores bots; nenhum erro JavaScript. |

No primeiro teste de virada, a campanha completa permanecia no save T88 embora a tela a ignorasse. A correção local limpa `careerInternational` nas duas rotas que avançam a carreira e mantém `careerInternationalHistory`. O fluxo T87→T88 passou após a correção.

## Verificações adicionais

- `npm run build`: passou.
- `PW_CHROME=/usr/bin/chromium npm run copamundo`: passou; 40 Copas simuladas, 2.040 partidas, 5.060 gols e 3.773 assistências nesta execução. O teste confirmou estatísticas, Bola de Ouro e gravação única por temporada.
- `node scripts/testa-temporada-internacional.mjs`: passou para 72 elencos, dois continentais, Mundial, histórico compacto e classificação T39/T87.
- A função local `pontosDeTitulos` retornou Copa do Mundo 200, Mundial de Clubes 50, Libertadores 40, Champions 40 e Copa do Brasil 30; um título de cada somou 360. O ranking internacional distribuiu 130 pontos pelos três títulos internacionais de uma temporada.
- `node scripts/testa-fixtures-carreira-internacional.mjs`: sete cenários nomeados de G8/G9 (Copa sem campeão, campeão da Série A repetido, vice, 6º, 8º, 10º e campeão fora da Série A), sem duplicatas; prioridades 1–9 e acesso apenas ao bloco correspondente ou inferior; nove blocos com 36 clubes por continente. Campanhas determinísticas com usuário na Libertadores, na Champions e sem vaga confirmaram 72 elencos de cartas existentes, preservação do nome do clube do usuário, as duas competições na mesma temporada e o Mundial como última etapa entre os campeões.
- No mesmo fixture, o reducer registrou uma única entrada no histórico e uma única premiação após repetir `FINISH_INTERNATIONAL_CAMPAIGN` depois de serializar/reabrir o estado. A ação real `OPEN_RESERVE_LIST` avançou T87→T88, limpou a campanha, preservou histórico/ranking e recusou uma segunda virada. O ranking de uma temporada com títulos sintéticos de Libertadores e Mundial ficou em 90 pontos antes e depois da serialização. O jornal recebe uma entrada por temporada pela mesma lista de histórico; a T87 no Chromium mostrou cada manchete uma vez.

## Limites da evidência

- O save é **sintético**, embora omita os campos da expansão e percorra o leitor/autosave reais no navegador. Não foi aberto um save pessoal de Diego.
- A sessão foi **simulada localmente**. O app exibiu o aviso de sessão expirada porque `getSession` não foi falsificado. Não há prova de isolamento com duas contas autenticadas reais; isso exigiria credenciais ou ação dos donos das contas.
- Na T100, a Copa do Mundo chegou à fase de grupos; o torneio de seleções não foi jogado até a final no navegador. O teste automatizado existente cobre a simulação e a contagem de estatísticas de 40 edições.
- Uma tentativa posterior de seguir a Copa de seleções até a final foi interrompida durante a simulação, depois da convocação de 11 cartas e início da fase de grupos, por mudança expressa de prioridade de Diego. Não há nova comprovação da final/virada T100→T101 no navegador.
- O usuário fictício T87 estava fora do G8; este fluxo verifica disponibilidade da temporada e campanha de bots, não a inscrição de clube classificado. A regra de G8 e Copa do Brasil tem teste de função em `scripts/testa-temporada-internacional.mjs`.
- Os fluxos Flamengo/Real Madrid verificam a interface isoladamente com prioridade 1 fornecida pelo teste. Eles não provam uma classificação real no campeonato nem autenticação real. Os pontos testados são da função local; o ranking compartilhado do banco não foi atualizado.
- Os cenários G8/G9 são fixtures de função com clubes fictícios da Série A. A vitória Flamengo+Mundial usada no teste de 90 pontos é um registro sintético para exercitar a conta; não é resultado obtido no navegador nem concede título a conta alguma.

## Interface provisória de inscrição e ranking — teste privado

Diego autorizou integrar o visual antes de poder avaliar o mockup no Android. Esta versão é **provisória** e permanece apenas em commit local. A inscrição usa o mesmo `CMModal`, formações 4-3-3/4-4-2, seleção por posição e `JogadorNoCampo` da convocação da Copa do Mundo; o escudo/nome do clube criado continuam no cabeçalho e no campo. Diferente da convocação de seleções, ela consulta somente o elenco real já adquirido pelo usuário e não completa vagas com jogadores gerados. A escolha da instituição antecede a inscrição e determina o continente.

| Verificação local | Resultado |
| --- | --- |
| Chromium desktop 1280×800, 4-3-3 | Modal abriu, 11 cartas inscritas, confirmação iniciou a campanha; sem erro JavaScript ou rolagem horizontal. |
| Chromium mobile 390×844, 4-4-2 | Mesmos passos passaram; botões e confirmação permaneceram alcançáveis; sem erro JavaScript ou rolagem horizontal. |
| Elenco qualificado sem 11 cartas reais | A tela informou o motivo e permitiu acompanhar Libertadores, Champions e Mundial pelos bots sem travar a temporada. |
| Cartas falsas, crias da Base e fillers | Validação do catálogo real recusou cada tipo; a UI oferece apenas cartas reais do elenco. |
| Ranking Local e prévia Global, mobile e desktop | Fixture com Libertadores + Mundial exibiu dois selos e 90 pontos. O ranking Global deixou explícito que a posição compartilhada ainda vem do servidor. Nenhuma RPC real foi feita. |
| Regressões | `node scripts/testa-fixtures-carreira-internacional.mjs`, `node scripts/testa-temporada-internacional.mjs`, `PW_CHROME=/usr/bin/chromium npm run copamundo` e `npm run build` passaram após os ajustes. |

Capturas de fixture: [mockup inicial](mockups/inscricao-internacional-proposta.png), [modal no desktop](mockups/inscricao-internacional-desktop-teste.png), [inscrição 4-4-2 no mobile](mockups/inscricao-internacional-mobile-teste.png) e [ranking Local no mobile](mockups/ranking-internacional-local-mobile-teste.png). As imagens contêm clubes/cartas de um teste sintético e não representam uma conta autenticada.
