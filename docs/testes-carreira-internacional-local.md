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

## Limites da evidência

- O save é **sintético**, embora omita os campos da expansão e percorra o leitor/autosave reais no navegador. Não foi aberto um save pessoal de Diego.
- A sessão foi **simulada localmente**. O app exibiu o aviso de sessão expirada porque `getSession` não foi falsificado. Não há prova de isolamento com duas contas autenticadas reais; isso exigiria credenciais ou ação dos donos das contas.
- Na T100, a Copa do Mundo chegou à fase de grupos; o torneio de seleções não foi jogado até a final no navegador. O teste automatizado existente cobre a simulação e a contagem de estatísticas de 40 edições.
- Uma tentativa posterior de seguir a Copa de seleções até a final foi interrompida durante a simulação, depois da convocação de 11 cartas e início da fase de grupos, por mudança expressa de prioridade de Diego. Não há nova comprovação da final/virada T100→T101 no navegador.
- O usuário fictício T87 estava fora do G8; este fluxo verifica disponibilidade da temporada e campanha de bots, não a inscrição de clube classificado. A regra de G8 e Copa do Brasil tem teste de função em `scripts/testa-temporada-internacional.mjs`.
- Os fluxos Flamengo/Real Madrid verificam a interface isoladamente com prioridade 1 fornecida pelo teste. Eles não provam uma classificação real no campeonato nem autenticação real. Os pontos testados são da função local; o ranking compartilhado do banco não foi atualizado.
