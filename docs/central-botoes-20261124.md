# Central sem Placar / Campo 2D / Campo 3D — 24/11/2026

Correção urgente de travamento público relatado por Diego: depois de jogar e voltar à Central, o cartão mostra o próximo confronto, mas os três botões não aparecem. Sem alteração visual nova, de save, plano, resultado, motor ou autorização do host.

## Causa reproduzida

Na segunda temporada, um Grêmio classificado para a Libertadores tem fases de duas competições na semana da rodada4. A Copa do Brasil e a fase preliminar da Libertadores podem ocorrer na mesma semana, sem participação do clube nessas páginas.

O efeito que passa as páginas sem participação observa flags como `copaPendente` e `meNaFaseCopa`, mas não observava `copaRound`. Ao passar a primeira, essas flags continuavam iguais: a próxima página também era uma copa pendente sem o usuário. O efeito não rodava novamente. A Central ficava esperando a copa enquanto escondia o avanço e os três botões.

Reprodução anterior: T2/R4 apitada, dia7/março, cartão da rodada5, passo7/7, `copaRound=3`, `copaDevidas=4`, `meNaFaseCopa=false`, `copaPendente=true`, nenhum botão. Após a correção: `copaRound=4`, `copaPendente=false`, os três botões aparecem.

## Correção

O efeito também observa `copaRound`, para reavaliar cada página que processou. As condições existentes continuam impedindo pular a fase em que o usuário joga, iniciar jogo antes do toque ou mexer em rodada de liga. Sem novo caminho paralelo para os botões.

Diego forneceu a conta do relato. Foi feita somente leitura para confirmar existência e disponibilidade de save; não há linha dela em `esc_pyramid_saves`. Não foi possível carregar o progresso específico do aparelho. Isso não demonstra perda da carreira local. A reprodução usou estado de teste independente, com o mesmo clube, temporada, semana e calendário continental.

## Verificação

- `npm run build` passou.
- `node scripts/teste-central-botoes/verifica.mjs`: quatro cenários passaram — gratuito390px com continental, pago1440px com continental, gratuito390px sem continental e fase continental com jogo do usuário.
- Conferidos os três botões, ida ao Elenco e retorno à Central, escolha de Placar sem começar sozinho, toque em Começar e retorno após o sinal de término, nova escolha em Campo2D e ausência de erros de página.
- Na fase do usuário, continua com `copaPendente=true`, `meNaFaseCopa=true` e `copaMidOn=false`: aguarda escolha/apito; não passa sozinha.
- A bancada injeta o sinal de apito pelo plugin local de teste para exercitar as transições sem esperar uma partida inteira. Não é ensaio de duração/FPS nem de renderização3D; WebGL é desativado nesta conferência de interface. A instrumentação não entra na fonte publicada.
- Capturas e resultados em `/workspace/shared/central-botoes-20261124/`. O screenshot anterior e o log de reprodução mostram o travamento antes da mudança.

Publicar como correção isolada de comportamento ao vivo, mantendo as versões anteriores disponíveis para quem ainda não atualizou. Não forçar recarga. Reversão: reverter o commit, sem migração de banco ou save.
