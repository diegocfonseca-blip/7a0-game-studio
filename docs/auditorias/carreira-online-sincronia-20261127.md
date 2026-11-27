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

Fontes em `docs/sql/carreira-online-partidas*.sql`. Verificado no projeto: RLS ativa, leitura só de membros, nenhuma das sete RPCs executável por `anon`, ações sem conta recusadas e **zero partidas reais** na nova tabela. O banco de testes usa identificadores próprios e nunca escreve essas partidas no projeto real. As mudanças de suporte não ativam a funcionalidade no cliente antigo. O complemento e a publicação foram autorizados abaixo; conferir merge/deploy antes de afirmar que está no ar.

Diego pediu expressamente: **“faça tudo q tiver q fazer e publique”**. As pendências abaixo receberam implementação adicional, mantendo o acesso privado existente do Co2 e sem anúncio geral de um modo ainda fechado.

- **Um aparelho por conta/carreira:** autorização no servidor renovada na presença já existente (uma vez por minuto, sem heartbeat de canal). Outra abertura aguarda. Ao sair, confirma os envios antes de liberar; erro mantém a carreira aberta. Ao concluir, limpa o vínculo Co2 da tela inicial, evitando uma falsa carreira ativa no menu. Autorização expira em três minutos sem renovação e exige reabrir, conferindo o progresso atual. Recarregar a mesma aba conserva a autorização; Web Locks evita que uma aba duplicada copie o mesmo token. Navegador sem Web Locks usa novo token e pode aguardar a expiração ao recarregar. A gravação privada tem trava no banco contra envio atrasado do aparelho anterior. Comandos de rodada usam a verificação de aparelho na mesma transação.
- **Leilão autenticado:** o canal transporta avisos; ações e fotografia vêm de RPCs que identificam conta/clube. Convidado não publica estado do dono nem ação de outro clube. Recibo impede duplicação. Contexto do lote rejeita ação antiga. Estado atual ocupa uma linha; comandos antigos têm limpeza oportunista após três dias. Os envelopes secretos continuam restritos ao dono; a fotografia privada permite restaurá-los após fechar o navegador. Nada passa pelos canais das salas rápidas/Liga Draft.
- **Copas de clubes na tela da carreira:** Copa Legends/Brasil usam ficha compartilhada por fase/perna, os dois lados humanos podem substituir e decidir táticas. Ida e volta têm registros distintos. Quem retorna lê as mesmas decisões; fase alcançada fica no save. Fases só de bots conservam o cálculo existente. A interface própria de convocações internacionais e Copa do Mundo mantém seu fluxo anterior; os testes dessas competições continuam passando, sem afirmar nova interface de substituição nelas.
- **Lesão na liga:** usa o sorteio de desgaste já existente, sem chance adicional. Preparação ocorre antes do PLAY e avisos pendentes seguram o início. A ficha contém a lesão programada; o relógio não passa do atendimento, inclusive após suspensão do navegador. No minuto correto há pausa comum e escolha pelo técnico afetado. Entrada de reserva conta entre as três; sem reserva ou sem trocas disponíveis, retirada e dez em campo, com goleiro de emergência quando necessário. Após sessenta segundos sem resposta, o dono resolve usando reserva real da ficha ou retirada. A troca clínica e o período médico passam ao próximo XI, pelo mecanismo já existente; não cria jogador durante a partida.
- **Ausência por várias temporadas:** retoma a fotografia atual da sala e seu caixa/divisão/elenco, preservando estádio e bens privados. Não duplica prêmios nem rebaixa o dono. Se a fotografia não puder ser conferida, não abre silenciosamente a temporada antiga.

### Verificações adicionais

- `testa-sincronia-falhas.mjs`: também confirma repetição da fotografia final da virada, sem reenviar uma foto já confirmada. Essa foto usa a mesma fila aguardada na saída.
- `testa-aparelho-sinais.mjs`: autorização exclusiva, vencimento, envio atrasado, funções limitadas, origem/identidade, segredo dos envelopes e estado só do dono.
- `testa-copas-clinica.mjs`: ida/volta, dois clubes, leitura de retorno, atendimento no minuto, pausa, dez em campo/goleiro de emergência, ausência e navegador suspenso.
- `testa-partidas-model.mjs`: também compara os dois lados da Copa e verifica dez atletas reais após retirada no motor.
- `scripts/teste-co2-partida/clinica.mjs`: app com dois navegadores/SQL local; reserva no 390, três trocas já gastas no 1440, escolha de goleiro de emergência, retomada e aviso no elenco seguinte.
- `scripts/teste-co2-partida/provider.mjs`: provider real; falha ao salvar impede saída; recuperação confirma nuvem e libera a autorização.
- `testa-fluxo.mjs`: retorno de três temporadas, bens privados, caixa/divisão atuais, idempotência e preservação da coroa. `testa-internacional.mjs` e `testa-copa-mundo.mjs` continuam passando.
- `teste-co2-sincronia/runtime.mjs`: início agora fica bloqueado já na falha de leitura, antes de enviar comando ao banco. Recuperação é testada em ambos os ritmos e tamanhos.

Três migrações aditivas aplicadas e conferidas no mesmo projeto: `carreira_online_aparelhos_sinais_20261127`, `carreira_online_copas_compartilhadas_20261127`, `carreira_online_clinica_compartilhada_20261127`. Fontes nos três arquivos `docs/sql/carreira-online-{aparelho-sinais,copas,clinica}-20261127.sql`. RLS ativa, funções internas/novas sem execução anônima, consulta de não membro recusada; zero partidas, autorizações ou sinais reais criados na conferência. Health sem alertas. Os avisos informativos de RLS sem política nas tabelas internas são intencionais: acesso somente pelas funções autorizadas.

Publicação autorizada via PR503; registrar o resultado do deploy depois de concluído. Não força atualização de quem já está jogando. Fotografia/decisões de partida continuam prospectivas na próxima temporada da sala. Nenhum teste de bancada representa medição física de FPS no S25.

## Reversão

Primeiro commit de correções: `d5551dcb`. Protocolo da partida em commit separado. `CO2_TROCAS_HABILITADAS = false` em `co2-jogo-model.ts` impede novas trocas, mantendo o leitor, o relógio e decisões já aceitas. Não apagar fotografias/comandos nem voltar um jogo já compartilhado à simulação sem essas entradas. Suporte SQL pode permanecer sem novos clientes; não exige apagar progresso. Modos solo, salas rápidas, basquete, F1 e Liga Draft não recebem este protocolo.

## Conferência de versões antes da ativação

Complemento de publicação: `esc_carr_jogo_compativel` só permite iniciar o protocolo na próxima temporada quando todos os participantes têm autorização vigente de um cliente compatível. Cliente anterior não cria essa autorização. A consulta antiga de capacidade devolve0, impedindo que uma versão sem essa conferência ligue as regras novas. A consulta nova não troca o host, não reinicia uma rodada nem recarrega telas. Migração aditiva `carreira_online_compatibilidade_clientes_20261127`, fonte `docs/sql/carreira-online-versao-20261127.sql`. Teste cobre colega anterior, todos atualizados e autorização expirada.
