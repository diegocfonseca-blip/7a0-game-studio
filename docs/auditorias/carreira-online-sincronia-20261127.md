# Carreira online: sincronização e recuperação — 27/11/2026

Pedido de Diego: analisar a carreira online do Claude (Dinâmica e Livre), corrigir os problemas encontrados e manter salvamento automático como na Liga Draft. Dinâmica/Livre é o ritmo da carreira e permanece; não é o seletor de substituições aposentado no futebol solo.

## Correções implementadas

- Envio público serializado por conexão: guarda a alteração mais recente, confirma só após sucesso e repete falhas com espera progressiva de 2 a 30 segundos. Sem gravação ou broadcast periódico de estado sem mudanças.
- PRONTO só depois de confirmar o envio da escalação. Falha de envio/leitura não dispara PLAY_ROUND. Início, apito e retorno de ausente não consomem permanentemente a tentativa quando há erro.
- Leitura com erro é diferente de lista vazia. Gavetas são associadas à identidade que o banco informa, comparada à ordem do mundo; mgrId declarado sozinho não basta. A virada também para se não conseguir conferir os fechamentos, em vez de concluir que todos faltaram.
- Respostas e eventos da conexão anterior são descartados após sair ou trocar de carreira. Na mesma conexão, uma leitura antiga não sobrescreve a mais recente. Consulta mundo/clubes/fase de novo ao reconectar ou voltar à aba.
- Livre com automático desligado espera o botão do dono, conforme o texto já existente. Sem vice ou substituição automática do host.
- Save privado automático sai do componente da rodada e acompanha as alterações do clube no provider, com folga de 1,5 s para comprimir. Também salva gestão feita sem mudar de rodada. Falha conserva pendência e tenta novamente; consulta e gravação ficam presas à carreira/conta que as iniciou. Cópia local continua existindo.
- Retomada consulta a nuvem mesmo quando existe cópia local. Entre cópias válidas do mesmo clube, compara temporada/rodada e depois data. A cópia local ganha identificação de conta; cópia de outro clube/conta não abre como se fosse do usuário atual.
- Aviso textual de conexão pendente reaproveita a apresentação existente; não acrescenta botão de salvar ou confirmação manual.

## Provas

- `node scripts/carreira-online/testa-sincronia-falhas.mjs`: fila/último estado, erro e exceção, cancelamento, novas tentativas, deduplicação, leituras em ordem inversa, troca de carreira durante autenticação, mundo preservado e escolha de cópia mais adiantada.
- `node scripts/carreira-online/testa-fluxo.mjs`: três clubes, temporada e virada, mesmo resultado entre os três aparelhos, retorno do ausente e crise/base.
- `node scripts/carreira-online/testa-gavetas.mjs`: vinte aparelhos, cem comparações de placar/tabela e artilharia iguais; gaveta de prova de 5,9 KB.
- `node scripts/teste-co2-sincronia/runtime.mjs`: navegador 390/1440, ambos os ritmos, falhas de escalação/leitura/início e recuperação sem recarregar, convidado sem comando da carreira e com identidade própria; envio privado na mesma rodada e StrictMode.
- `npm run build`, `npm run recarga`, `git diff --check`: registrar conclusão antes de commit/publicação.

Testes usam transporte simulado e clubes de bancada. Não alteram contas, saves reais, permissões ou tabelas do Supabase. Não representam medição de FPS físico no S25 nem teste real de duas contas conectadas.

## Pendências da auditoria (não apresentar como já implementadas)

1. **Trocas ao vivo e lesão durante a partida ainda não foram liberadas na carreira online.** As guardas Co2 continuam. É necessário um registro compartilhado e persistente de comandos com dono, temporada/partida, instante efetivo e revisão, congelar a entrada comum e impedir reescrita de rodadas anteriores. Remover `!state.co2` sozinho faria o próprio usuário continuar com a gaveta congelada, ou permitiria divergência/reescrita do jogo. O limite de três, troca só daquele jogo e reposição clínica do próximo XI devem ser mantidos na implementação.
2. O canal de broadcast Co2 atual é público e não autentica a origem das ações de leilão. As permissões do banco protegem gravação/leitura das tabelas, mas não tornam o payload de broadcast autenticado. Precisa de protocolo de ações autenticadas/persistentes; não dar isso como resolvido por validar campos no cliente.
3. As gavetas públicas ainda não têm congelamento/revisão atômicos no servidor. O fluxo de sucesso continua dependente do instante em que cada cliente leu. A fila resolve falhas/ordem no mesmo aparelho, não uma transação entre vinte aparelhos.
4. Dois aparelhos simultâneos da mesma conta ainda não têm um único escritor de clube imposto no banco; isso não equivale à garantia completa da Liga Draft. A correção de leitura/local não substitui esse controle. Evitar dois aparelhos administrando o mesmo clube simultaneamente até concluir o protocolo.
5. Relógio/pausa/velocidade da partida precisam da mesma âncora persistente para quem volta no meio. Não confundir pausa entre rodadas com pausa do jogo em andamento.

Essas pendências exigem trabalho de protocolo, banco e partida, com testes reais de reconexão e de duas contas antes de liberar as trocas. Sem alteração de OVR, categorias, economia, cartas ou acesso público ao modo nesta etapa.

## Reversão

Arquivos Co2, chamada de autosave no provider e testes/documentação em commit isolado. Sem migração de banco ou conversão destrutiva de save; campos novos da cópia local são opcionais. Os modos solo, salas rápidas e Liga Draft não usam a nova fila Co2.
