# Futebol online — liberação geral em 23/11

Diego autorizou liberar para todos o que estava no piloto dele/Futpoint e aprovou
os ajustes do mockup: plano em duas linhas de duas decisões no desktop,
retrospecto visível na Partida e chat por último na lateral. Esta autorização
substitui a restrição de contas dos documentos anteriores.

## Entrega

- O visual não depende mais de e-mail. Mantém o escopo: futebol nas salas online,
  nas telas de liga, Libertadores, Champions e copas posteriores. Partida rápida
  online, Liga da Turma, Bafo, Vice City e formatos compatíveis recebem as mesmas
  abas e transmissão. As duas variantes Draft continuam separadas; carreira,
  basquete, co2 e pokeLiga ficam fora. Kings conserva suas posturas nativas.
- Placar/campo e telão único permanecem nas trocas de aba. Confrontos,
  classificados, eliminados e contagens de leitura usam os relógios existentes.
  Pênaltis ficam junto da transmissão. Não altera premiações ou calendário.
- No desktop, postura/caminho do ataque e marcação/ritmo formam o 2×2 sem mudar
  fontes. Nas copas, grupo/chave, retrospecto, artilharia, assistências e chat
  seguem nessa ordem na lateral. Outros jogos são consultados pela faixa lateral.
  O retrospecto entre usuários aparece quando o adversário é outra pessoa;
  partidas contra a máquina não inventam um histórico de pessoas.
- Qualquer UID válido no assento humano correspondente pode salvar o próprio
  plano pelo host. Continua nas partidas seguintes, inclusive Libertadores,
  Champions e mata-matas. Mudar o plano salvo não recalcula o jogo atual.
- Nas copas independentes, o participante da sala e da ficha pode enviar ordens
  confirmadas pelo servidor. Mantidos suporte de todos os participantes, corte
  com antecedência de entrega, passado imutável, idempotência e limite anterior.
- O recálculo local experimental das ligas/quick cups continua limitado ao
  ambiente de teste anterior. Não foi aberto o transporte de ações ao vivo por
  broadcast; não dar vantagem de recálculo a hosts de salas públicas. Fora desse
  teste, o painel informa que a escolha fica para o próximo jogo.
- Tocar novamente numa escolha já selecionada não envia salvamento. Não há novo
  canal Realtime, heartbeat ou mudança na frequência de leitura dos relógios.
  As demais prévias privadas e benefícios de conta não são liberados pelo visual.

## Banco

Migração aplicada: `copas_planos_publicos_20261123`. Remove somente a lista dos
dois UIDs do escritor interno. Continua exigindo `auth.uid()`, participação na
sala e inscrição na edição. RPC pública SECURITY INVOKER, implementação privada,
schema sem USAGE para clientes e tabelas sem acesso direto permanecem.

Testes com ROLLBACK passaram antes/depois: participante fora da lista antiga,
host/convidado distintos, estranhos e espectador sem time rejeitados, payloads
inválidos, janela de jogo, idempotência e relógios intactos. Chamada com papel
authenticated e UID público também passou. Avisos de segurança permaneceram
iguais ao início; nenhum novo aviso. [Referência das permissões de funções](https://supabase.com/docs/guides/database/functions).

## Validação

- Política pública e chave de reversão; demais prévias continuam privadas.
- Persistência real por rodadas, confirmação pelo host, UID/assento e plano
  público em liga, Libertadores, Champions e mata-mata.
- 535 checagens dos motores das copas e 360 do reducer de mata-matas passaram.
- 651 checagens gerais da liga e 268 das copas em 390/1440 px passaram.
- Mais 139 checagens da conta/UID públicos e reversão, e 23 da copa pública
  com rival humano, passaram: grade 2×2, chat no fim, histórico, opções sem escrita
  redundante e ida/volta ao visual antigo.
- Build TypeScript/Vite e diff sem espaços inválidos passaram.

Capturas/relatórios em `/workspace/shared/futebol-publico-*-20261123/`.
Bancadas de interface usam componentes reais e rede simulada, sem alterar salas
reais. Testes SQL são revertidos na mesma transação. Não substituem teste físico,
duas sessões autenticadas em produção ou teste de carga.

## Como reverter

1. Cada pessoa pode usar **Voltar ao visual anterior** no cabeçalho da sala e
   reativar depois. Preferência local; não apaga plano, identidade ou progresso.
2. Reversão geral de aparência: colocar `FOOTBALL_MATCH_PILOT_ENABLED = false`
   em `football-match-pilot-policy.ts`, buildar e publicar. Não reverter a main
   inteira nem remover atualizações de outras frentes.
3. Se necessário pausar novas ordens das copas, aplicar exclusivamente
   `docs/sql/copas-planos-pausar-escrita-20261123.sql`. A pausa foi testada dentro
   de ROLLBACK: bloqueia escrita e conserva leitura, histórico e relógios.
   Para retomar, reaplicar `copas-planos-publicos-20261123.sql`.
4. Manter leitores e motores dos planos já confirmados até a edição terminar.
   Não apagar tabelas/histórico nem recalcular jogos encerrados para desfazer
   ordens. Reverter o visual não desfaz decisões já aplicadas à partida.

As fontes SQL de pausa não são parte da execução normal da entrega.
