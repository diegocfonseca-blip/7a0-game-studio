# Carreira online: salvamento e partida compartilhada — 27/11/2026

Diego autorizou analisar a carreira online criada pelo Claude, corrigir problemas nos ritmos Dinâmica/Livre e trazer as trocas durante a partida. Salvamento permanece automático, como solicitado; não foi criado botão de salvar. A escolha Dinâmica/Livre continua e não se confunde com o antigo seletor de substituições retirado do futebol solo.

## Correções de sincronização

- PRONTO só depois de confirmar o envio da escalação. Falha de envio ou leitura não dispara PLAY_ROUND. Início, apito e retorno do ausente não consomem a tentativa quando há erro.
- Fila serializada guarda o estado mais recente, confirma somente após a resposta e repete falhas com espera de 2 a 30 segundos. Atividade contínua não adia indefinidamente: envio em até dez segundos quando a conexão responde. Sem gravações ou broadcasts periódicos de estado sem mudanças.
- Consulta que falhou é diferente de lista vazia. Gavetas são associadas ao usuário informado pelo banco e à ordem do mundo. A virada não considera todo mundo ausente se falhar a conferência dos fechamentos.
- Respostas/eventos da conexão anterior são descartados. Na mesma conexão uma leitura antiga não substitui a mais recente. Leituras que falharam tentam novamente, sem repetir uma mutação já aceita. Início/apito conferem o estado caso a resposta se perca depois da confirmação no servidor.
- Livre com automático desligado espera o botão do dono, como o aviso promete. O controle passa a dizer “Início automático”, distinguindo início de rodada de salvamento automático. Sem vice nem troca automática de host.
- Save privado automático acompanha as mudanças do clube no provider, com folga de 1,5 s para comprimir. Salva também gestão na mesma rodada. Uma revisão em memória evita reenviar o save inteiro só porque chegaram gavetas/resultados dos amigos. A carga mais recente entra no envio pendente sem reiniciar seu prazo.
- A retomada consulta a nuvem mesmo existindo cópia local. Entre cópias válidas do mesmo clube, compara temporada/rodada e depois data. A cópia local passa a ter identificação de conta. Gravação/leitura e respostas ficam presas à carreira que as iniciou.
- Avisos de conexão pendente são texto no padrão existente, sem confirmação manual de salvamento.

## Substituições na liga e relógio

- `esc_carr_jogo` mantém uma fotografia comprimida e imutável do início do jogo. Quem comanda cria a fotografia; cada participante apenas acrescenta decisões do próprio clube com autenticação verificada no banco.
- Até três substituições por clube. Tática e formação respeitam o repertório/plantel registrado. Reservas de outro clube, desfalques registrados, retorno de quem já saiu, revisão antiga e alteração de partida encerrada são recusados. Não acrescenta jogadores ao produto nem altera OVR/categorias/economia.
- Pedidos têm identidade própria: perder a resposta e tentar novamente não duplica a troca. O banco define o instante efetivo; o cliente não pode escolher um minuto anterior.
- Os dois humanos podem substituir num confronto. A simulação antiga escolhia somente o primeiro humano para `hd`; a entrada compartilhada passa a carregar explicitamente as decisões dos dois lados.
- A escolha na aba Elenco continua permanente. A troca na partida fica na ficha daquele jogo; não muda o XI/tática fixos. O painel usa os jogadores da fotografia, preservando o jogo enquanto o clube prepara a escalação futura.
- Relógio e duração são compartilhados. A duração inicial respeita a apresentação/ritmo escolhidos pelo dono, em vez de transformar o placar rápido numa partida longa. Pausar e trocar velocidade preserva o tempo já jogado; configuração de velocidade usa o bloco recolhível já existente do dono. Convidado não comanda o ritmo. Abrir o painel de trocas não pausa os demais jogadores.
- Ao voltar, o aparelho lê as mesmas fotografias e decisões. Atualizações de uma fotografia já recebida omitem sua imagem de dados (`z`/metadados) e buscam apenas comandos/relógio. O desenho do relógio usa temporizador local; não consulta o banco a cada segundo.
- Ativação prospectiva: `mundo.aoVivoDesde` é carimbado na largada de uma temporada com o protocolo disponível. Não muda a regra de uma temporada já em andamento. Preserva as contas de teste existentes e o modo independente das salas rápidas/Liga Draft.

## Verificação

- `node scripts/carreira-online/testa-sincronia-falhas.mjs`: fila, último payload, erros/exceções, limite de espera, cancelamento, deduplicação, leituras em ordem inversa e entre carreiras, mundo preservado e escolha da cópia mais avançada.
- `node scripts/carreira-online/testa-fluxo.mjs`: três clubes, temporada e virada, mesmas tabelas, retorno do ausente, crise/base; receber dados dos amigos não altera a revisão privada, mas gestão própria na mesma rodada altera.
- `node scripts/carreira-online/testa-gavetas.mjs`: vinte aparelhos, cem comparações de placar/tabela e artilharia iguais; gaveta de prova de 5,9 KB.
- `node scripts/teste-co2-sincronia/runtime.mjs`: 390/1440, ambos os ritmos, falha de escalação/leitura/início e recuperação, convidado sem comando e com identidade própria, envio privado na mesma rodada e StrictMode.
- `node scripts/carreira-online/testa-partidas-sql.mjs`: PostgreSQL isolado (PGlite), autenticação, RLS, permissões padrão do Supabase, fotografia imutável, idempotência, três trocas, revisão, formação/desfalques, instante do servidor, pausa/velocidade e apito. PGlite instalado só em `/tmp/co2-pg-test`, fora das dependências do jogo; caminho alternativo via `CO2_PGLITE_PATH`.
- `node scripts/carreira-online/testa-partidas-model.mjs`: três trocas para cada lado humano, gols anteriores intactos, mesmos placares/tabelas/autores entre perspectivas, XI/OVR preservados e duração/relógio. Fotografia comprimida de um confronto entre dois humanos: 6000 bytes; não extrapolar essa medição para vinte clubes.
- `node scripts/teste-co2-partida/runtime.mjs`: app real com dois navegadores/identidades e PostgreSQL local; dono 390 com Campo 2D e convidado 1440 com placar, Dinâmica/Livre, três trocas para cada um, tática, resposta perdida, pausa, velocidade, retorno e apito único; mesma escalação fixa e mesmos resultados.
- Build completo (`npm run build`), `npm run recarga` e whitespace conferidos antes de commit. Registros/capturas em `/tmp/co2-*` e `/workspace/shared/co2-auditoria-20261127`.

São testes de bancada; não representam login em duas contas reais no site publicado nem medição física de FPS no S25. Nenhum save ou conta real foi editado.

## Banco e publicação

Suporte aditivo aplicado no projeto existente em 27/11:

1. `carreira_online_partidas_autoritativas_20261127`: tabela e RPCs.
2. `carreira_online_partidas_privilegios_20261127` e `carreira_online_protocolo_privilegios_20261127`: retirada explícita dos GRANTs anônimos padrão do projeto, incluindo a consulta de versão.
3. `carreira_online_partidas_duracao_20261127`: preserva a duração escolhida pelo dono.

Fontes em `docs/sql/carreira-online-partidas*.sql`. Verificado no projeto: RLS ativa, leitura só de membros, nenhuma das sete RPCs executável por `anon`, ações sem conta recusadas e **zero partidas reais** na nova tabela. O banco de testes usa identificadores próprios e nunca escreve essas partidas no projeto real. As mudanças de suporte não ativam a funcionalidade no cliente antigo. Código em branch de revisão; não afirmar publicação antes de merge/deploy.

## Pendências que não fazem parte desta entrega

- Lesão durante a partida e retirada sem reserva **ainda não foram ativadas no Co2**. As guardas permanecem; não acrescentar outro sorteio nem aumentar incidência. Copas também não receberam este protocolo de trocas ao vivo da liga. A reposição clínica precisa do mesmo registro compartilhado antes da extensão.
- O broadcast legado do leilão ainda não autentica a origem do payload. As novas decisões da partida usam RPC autenticada, mas isso não resolve o transporte do leilão. Próxima correção deve usar canais com autorização por remetente ou ações autenticadas persistidas.
- Dois aparelhos simultâneos da mesma conta ainda não têm escritor único de clube imposto no banco. A fila ordena um aparelho; não é a garantia completa da Liga Draft para uso simultâneo. Uso sequencial já consulta a nuvem e escolhe progresso mais recente.
- Retorno após múltiplas temporadas de ausência e demais transições internacionais merecem teste específico; não confundir o teste de retorno na mesma temporada com validação de todas as combinações. Fotografias antigas permanecem no banco; não foram apagadas por uma política de retenção inferida.

## Reversão

Primeiro commit de correções: `d5551dcb`. Protocolo da partida em commit separado. `CO2_TROCAS_HABILITADAS = false` em `co2-jogo-model.ts` impede novas trocas, mantendo o leitor, o relógio e decisões já aceitas. Não apagar fotografias/comandos nem voltar um jogo já compartilhado à simulação sem essas entradas. Suporte SQL pode permanecer sem novos clientes; não exige apagar progresso. Modos solo, salas rápidas, basquete, F1 e Liga Draft não recebem este protocolo.
