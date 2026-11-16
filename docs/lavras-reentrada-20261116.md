# Lavras FC: saída para menu e identidade trocada na Copa

Sala identificada: **GGWNX6**, “Sala do Eight”, criada em 15/11 às 23:13 de Brasília. Liga seguida de Copa do Mundo (`mundoNaLiga=true`), com 19 humanos e um bot. A investigação fez somente leituras na produção; não mudou escolhas, resultados, host ou cadeiras.

## Evidência de produção

Horários de Brasília, 15/11/2026:

- **23:55:13:** Lavras abriu a edição 1 da Copa; a primeira vez ficou com Mano 3 Meses.
- **23:55:22:** última atualização do estado da partida pelo dono.
- **23:55:24:** a conta do Lavras começou a consultar as listas do menu.
- **23:55:29–30:** a conta do Mano leu o estado da sala e enviou uma ação à caixa do dono. Às **23:55:30**, a caixa-preta registrou que o Lavras perdeu a coroa no navegador, sem saída voluntária e sem registro de rebaixamento pelo vigia de host.
- **23:55:48:** uma requisição autenticada como Lavras atualizou a linha de Mano 3 Meses em `room_players`. Ela contém Brasil com convocação vazia. O Lavras continuava sendo `host_id` e dono do assento 0; Mano continuava no assento 8.
- A fase da Copa permaneceu em `bandeira`, com a vez e o prazo originais do Mano. Não apareceu exceção em `esc_quedas` naquele intervalo.

Os logs registram rota, conta e horário, mas não o corpo da ação enviada pelo convidado. Por isso, a atribuição do pacote histórico exato se apoia na sequência observada e na reprodução abaixo, não na leitura de um payload que não foi armazenado.

## Reprodução do mecanismo

Dois clientes locais, usando o **EscProvider da aplicação**, reproduziram as duas etapas na base `1dbffc9f`:

1. O convidado chama `GO_LOBBY_ONLINE`. O dispatch a encaminha ao dono como uma ação de jogo. O dono vai para `lobby`; o convidado permanece na tela anterior até receber o próximo estado.
2. O convidado chama `RESTORE_ONLINE` enquanto o aparelho continua marcado como online. A ação também vai ao dono; os dois receptores aplicam qualquer payload diretamente. O reducer então restaura **no dono** a identidade do convidado, incluindo `youUid`, `youIdx` e `isHost=false`.

Isso explica a sequência relatada: menu inesperado, dono sem coroa, “você” na linha do Mano e escolha gravada para o Mano. A Copa identifica a pessoa por `state.youUid`; depois da contaminação ele passa a ser o UID do convidado. Como o dono perdeu `isHost`, também para de conduzir o prazo da Copa. Não houve evidência de mudança no `host_id` da sala ou de sobrecarga do banco causando essa troca.

## Correção preparada

- Menu online, retomada e entrada como espectador são locais ao aparelho.
- As demais ações de identidade/navegação também não seguem pela caixa de ações dos convidados.
- Os dois receptores do dono rejeitam ações locais, incluindo mensagens enviadas por abas antigas ainda abertas.
- Ações de jogo continuam pelo caminho existente. Não altera host, eleições, tempo do leilão, envelope, regra das seleções, RLS, consultas ou canais.

## Validação e limites

- Reprodução anterior confirmou a falha; a mesma bancada corrigida mantém identidades e coroa.
- Mensagens antigas rejeitadas no canal da sala e na caixa reservada do dono; ação legítima entregue.
- Build de produção passou.
- Simulador existente: 16 cenários, uma semente por cenário, nenhuma falha. É regressão local, não teste de carga em produção.
- Teste existente da Copa online passou com Chromium instalado neste ambiente e tráfego externo bloqueado. A invocação original pressupõe `/opt/pw-browsers/chromium`; o ambiente tem `/usr/bin/chromium`.
- `npm run sala` tem duas verificações textuais que já falham **também na base sem esta correção**: fiação de duas saídas para a espera e seletor da barra inferior. Não foram alteradas neste trabalho.

Evidências locais: `/workspace/shared/lavras-reentrada-20261116/`. Nenhuma mudança publicada.

## Complemento: participantes saindo antes da Copa

Diego autorizou testar e alterar a GGWNX6 após o encerramento da noite. Foi preservada uma cópia completa da sala, participantes e fase da Copa em `/workspace/shared/lavras-reentrada-20261116/sala-antes.json`; não foi necessário alterar a sala real para confirmar o mecanismo.

Nos logs entre 23:10 e 00:05 de Brasília, apareceram quatro requisições DELETE de vagas nesta sala: Cabulosojp às 23:55:36, Vascodadepressao às 23:55:41, Fiel Torcedor FC às 23:56:01 e Gui às 23:57:31. Cada requisição foi autenticada como o próprio participante removido. Vascodadepressao voltou às 23:56:01, com o assento 16 correto.

Essas remoções ocorreram depois de a Copa abrir (23:55:13) e de o dono perder a identidade local (23:55:30). O log não registra o gesto de interface que originou a exclusão: não é suficiente para chamar todas de saídas voluntárias, nem para atribuí-las a uma expulsão automática. As rotas de saída/retomada da aplicação podem apagar a própria vaga.

A ida involuntária ao menu tem um mecanismo confirmado: a navegação do convidado chegava ao dono; o estado da tela do dono era reenviado à sala. Esse caminho é comum aos modos online, não específico do Lavras ou da Copa. A correção preparada impede essa navegação remota e a posterior adoção da identidade de outro participante. Os logs históricos não permitem provar que todas as queixas anteriores tiveram exatamente a mesma causa.
