# Copas online — piloto privado (23/11)

Diego autorizou o padrão da liga nas competições online para sua conta principal e Futpoint. Confrontos, classificados/eliminados e segundos de leitura continuam usando os componentes e relógios existentes, agora no palco da transmissão em qualquer aba. Pênaltis ficam junto do placar/campo, antes do resumo, telão e controles.

## Escopo e comportamento

- Cinco abas separadas: Partida, Copa e jogos, Estatísticas, Elenco e Rivalidades. Transmissão permanente, telão único e fases dentro de Copa e jogos. Desktop conserva chat, grupo/chave atual, artilharia e retrospecto lateral.
- Seleções (Mundo/Euro/América), regionais, Libertadores da sala e mata-matas do campeonato usam os adaptadores correspondentes, independentemente do rótulo da sala compatível (rápida, turma, Bafo, Vice City etc.). Partidas futuras não revelam vencedores; estatísticas só incluem jogos encerrados.
- Elenco é o XI efetivamente inscrito na competição, sem inventar substituições ou modificar convocação. Kings conserva suas três posturas nativas. Carreira, basquete, outros jogos e as duas variantes Draft ficam fora do novo piloto.
- Cerimônias, mascotes, lendas, destaques e chaves originais das premiações preservados; trocar de apresentação não cria uma segunda chave de prêmio.
- Plano escolhido continua nas próximas partidas. Salvar preferência e enviar uma ordem para o jogo atual são ações distintas.
- Copas independentes: escrita autenticada restrita aos dois UIDs autorizados, confirmação do servidor e histórico imutável. Só liberam os novos planos quando todos os humanos da ficha anunciam suporte à versão. Ordens modificam somente eventos posteriores ao minuto confirmado, com antecedência de entrega de 4,5 segundos; até 16 ordens por jogador/etapa. Após a janela, salva-se para a próxima partida.
- Liga e mata-mata comandados pelo host: salvamento futuro dos dois usuários pode ser confirmado por qualquer host atualizado; ordens que recalculam a partida atual conservam a proteção anterior (host principal do Diego e participantes humanos de teste autorizados). Nenhum convidado ganha autoridade de host.
- Identidade por UID/assento, relógios, intervalo entre fases e resultados já mostrados permanecem protegidos. Sem novo canal Realtime; usa revisão/leitura dos relógios existentes.

## Banco e permissões

Aplicadas as migrações `copas_planos_piloto_20261123` e `copas_planos_rpc_internas_20261123` no projeto existente. As tabelas têm RLS e ficam no esquema interno sem USAGE/acesso direto dos clientes. Implementações privilegiadas ficam nesse esquema; as quatro RPCs públicas são SECURITY INVOKER com wrappers estáticos BEGIN ATOMIC. Anônimo não executa nenhuma delas. Membros precisam estar na sala e na ficha da edição.

Teste transacional com ROLLBACK passou antes e depois das migrações: suporte das versões, identidade separada host/convidado, payload inválido, idempotência, intervalo entre partidas, corte do servidor e relógios imutáveis. Chamada com papel authenticated também passou. Ao final: zero planos reais criados e zero salas de teste persistidas. Advisor não acrescentou WARN; exposição de funções SECURITY DEFINER públicas diminuiu (anônimo 243→241, autenticado 305→303). As duas informações adicionais de RLS sem policy são deliberadas: tabelas internas sem acesso direto. [Referência do advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Validação

- Build TypeScript/Vite e diff sem espaços inválidos.
- 535 verificações dos motores Mundo/regional/Liberta: neutralidade com regras antigas, influência real, passado/assistências preservados, mesmos resultados em dois clientes e finais.
- 360 verificações do reducer dos mata-matas: ida/volta/final, pênaltis coerentes, contexto de perna anterior rejeitado, estatísticas da liga intactas e persistência.
- Regressões do plano persistente, ordens anteriores, três posturas antigas, Libertadores (incluindo 400 copas) e allowlist/Draft passaram.
- 651 verificações gerais da interface da liga passaram.
- 250 verificações da interface real das copas em 390/1440 px passaram: cinco competições, cinco abas, cinema/2D, continuidade da transmissão/canvas, telão único, chat, transições em outra aba, ordem confirmada e plano persistindo entre etapas, pênaltis da final de seleções e da Copa dos 8. Sem exceções JavaScript.

Após integrar a main, 91 verificações adicionais das finais/transições passaram, incluindo a duração carimbada real do 2D e a continuidade do canvas nas cinco abas.

Bancadas usam componentes reais com rede simulada, sem escrever em salas reais. SQL usa dados de teste revertidos. Não substitui celular físico, duas sessões autenticadas de produção ou teste de carga. Evidências em `/workspace/shared/copas-piloto-20261123/`; publicação registrada separadamente após CI/deploy.

## Operação e reversão

Não recarregar automaticamente quem está jogando. Para compatibilidade, todos atualizam ao entrar em uma nova competição. É possível desligar o piloto visual por conta. Se houver incidente com ordens, suspender escritores/novas ordens e manter a leitura dos planos já confirmados até a edição terminar; não apagar histórico nem remover o motor durante uma copa ativa.

Fontes: `docs/sql/copa-planos-piloto-20261123.sql`, `docs/sql/copa-planos-rpc-internas-20261123.sql`, `docs/sql/teste-copa-planos-piloto-20261123.sql`. Liga Draft: [auditoria separada](auditoria-liga-draft-20261123.md).
