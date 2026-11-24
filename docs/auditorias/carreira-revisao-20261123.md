# Revisão da carreira oficial — 23/11/2026

Autorização: Diego pediu implementar toda a revisão da auditoria, incluindo elencos de 11, jogadores recebidos, salários, renovação e clareza inicial. Trabalho local; publicação ainda não solicitada nesta etapa. Cartinhas de título/envelope não mudam. Preservar jogos encerrados e nunca cobrar retroativo.

Ordem de trabalho:
1. Referência econômica independente do preço pago, compartilhada por humanos/bots; contratos iniciais e legado prospectivo.
2. Categoria própria da divisão em novas aquisições (todos os caminhos); proteção de XI e goleiro na venda/sondagem; reposição real.
3. Calendário físico efetivo, liga/copas, sem alterar fotografias históricas.
4. Resultados de temporada reais para torcida/patrocínio/ocupação/loja.
5. Entrada tática/condição/comissão nas copas e preservação de resultados.
6. Finanças coerentes, dívida e prêmios; clareza da carência T1–T3.
7. Apresentação inicial (elenco histórico sorteado, valores/contratos, força, calendário).
8. Completar cobertura estadual com fontes; avaliar persistência estrangeira sem inventar clubes/formato.
9. Repetir simulações variadas antes de calibrar gols; registrar evidência e limites.

Base anterior: f7797497339f27befb553bad7ce15428d8cf33e7. Auditoria completa local em /workspace/shared/auditoria-serie-d-20261123.

## Decisões posteriores e nova repetição (prevalecem sobre as hipóteses abaixo)

Diego manteve aprovado o pacote técnico e rejeitou tirar Julinho/históricos da largada para liberá-los depois. O sorteio inicial original deve ser preservado. A proposta adicional de salários desdeT1 não foi aceita nem aplicada: continua cobrança a partir daT4.

A pedido “Ok simule novamente”, foram concluídas30carreiras/296temporadas sem novas mudanças de produto: Portuguesa2/10com estreiaA naT4,10/10com acesso até fimT12; ABC2/10 e Brasiliense2/10com acesso na janela, nenhum no caminho mínimo. Metade das Portuguesas caiu na estreia, assim como os quatro acessos dos comparadores. [Método, todos os casos e limites](carreira-repeticao-20261123.md).

A hipótese anterior de bloquear históricos por divisão **foi descartada pelo usuário**. A simples existência de uma campanha de três acessos não demonstra facilidade geral; não confundir os14/20acessos iniciais àC com14/20trajetórias atéA. Não usar a restrição de acrescentar atletas só para completarXI como pretexto para excluir históricos e inventar uma necessidade de novas cartas.

## Bloqueio de equilíbrio identificado após o questionamento do Diego

As verificações funcionais abaixo **não aprovam o equilíbrio da carreira**. Diego estranhou Portuguesa D→A no caminho mínimo; revisão de largada é bloqueadora antes de qualquer publicação deste conjunto.

- Trajetória: acessos ao fim T1/T2/T3, estreia na A em T4. Na sequência testada caiu na T4; isso não corrige a facilidade anterior.
- Portuguesa começou com 18 cartas, portanto recebeu todas as históricas, sem variação do XI inicial. Melhor XI 76,64; mediana da D no primeiro cenário60,32 e da B68,59. Julinho81–92 (Craque) já veio na D apesar da trava de compras. Só tirar Craque ainda dá75,64; até os piores11 desse grupo dão72,73. Corrigir apenas esse nome é insuficiente.
- Bancada adicional nativa: 20 sementes da Portuguesa, sem lances humanos nem novos reforços:14 acessos na T1,12 títulos. Comparação separada: ABC3/10 acessos, Brasiliense1/10. Não é uma probabilidade populacional e não foi repetido todo o caminho D→A nessas40aberturas.
- Fonte: `/workspace/shared/carreira-revisao-validada-20261123/portuguesa-diagnostico.json`; reprodução: `AUDIT_MODE=portuguesa-diagnostico AUDIT_OUT=<destino> node scripts/run-carreira-test.mjs /scripts/auditoria-serie-d/model.mts`.
- Hipóteses preliminares de elegibilidade e carência foram discutidas depois: bloquear históricos foi rejeitado, salário desdeT1 não foi aprovado. Preservar sorteio histórico e regra atual; conferir a repetição de30carreiras acima antes de novas propostas. Não houve correção nova de largada nesta etapa.

## Implementação local e validação (23/11; não publicada)

Branch: `fix/carreira-regras-economia-20261123`. Base: `f7797497`. Sem commit/publicação. A revisão ampla ainda tem pendências abaixo; não anunciar como tudo concluído.

- Uma referência por nível/categoria em `carreira-economia.ts`, independente da taxa paga. Elenco herdado/recebido tem salário/renovação e contrato; transferência inicial vale zero no extrato. Cobrança anual a partir da T4 para humanos e bots. Legado preserva folha da temporada corrente; nova base de cobrança começa na próxima quando o ano já andou. Contratos existentes não são reiniciados.
- Todos os clubes brasileiros cadastrados, inclusive os só estaduais, têm posse materializada antes do banco automático. Reparo só para mínimo posicional, com real livre elegível, sem roubar dono e sem fake. Time completo não recebe reforço de reparo. Vendas, liberações e sondagens protegem o XI; saídas pendentes contam juntas. Há explicação na mesa e trava no reducer.
- Categoria/divisão própria do comprador e clube brasileiro validados em banco automático, envelopes, desempates, monte e sondagens. Herdados não são expulsos por rebaixamento. Online mantém os baralhos existentes.
- Bots nacionais sem a flag `rival` também renovam; clubes nacionais de fundo debitam seus contratos vencidos. Renovação obrigatória pode deixar dívida real; caixa negativo não é perdoado no fechamento. A economia comum dos outros modos conserva seu comportamento.
- Encontrado no navegador: reabrir a janela curava vencidos como se tivessem voltado de empréstimo; isso escondia a mesa e dava temporada grátis. A cura agora preserva contratos vencidos na janela do Brasil Oficial. Regressão de retomada adicionada.
- Calendário efetivo C/D para condição, aparições, folgas e carry dos bots/humanos. Sem sorteio de lesão de desgaste em data sem partida. Copas têm registro idempotente dos participantes e energia consumida; taxas ainda por aparição, não por minuto. Mudança física prospectiva no legado.
- Metadados explícitos de plano levam tática, escalação e técnico aos jogos M2 das copas oficiais. Sorteios antigos continuam consumidos para conservar determinismo. Entradas M2 disputadas continuam congeladas. A simulação simplificada CPU×CPU de copas não ganhou gestão de minutos/comissão completa.
- Master, loja, torcida e ocupação consideram dimensão da tabela e promoção/queda real. Não chamar 17º/96 de rebaixado. Copa do Brasil oficial usa a mesma tabela de prêmios para humanos e bots; genéricos mantidos.
- Textos existentes esclarecem sorteio de épocas (Zico pode vir, não é garantido), caixa inicial, referência salarial, carência e cobrança por temporada. Sem desenho novo nem artes geradas. Capturas locais em `/workspace/shared/carreira-revisao-validada-20261123/telas`.

### Acréscimo de catálogo: somente uma lacuna comprovada

Bahia não fechava XI sem goleiro. Incluído **Marcos Felipe, Bahia 2023, GOL, 68–79, bom jogador** em `cartas-complemento.md`, com fontes do Bahia e ge. `data-oficial.ts` regenerado pelo script. Categoria/over são curadoria comparativa do jogo.

Teste confirma: ausente nos baralhos Brasil/Europa/Mundo das salas, exatamente uma ficha no catálogo oficial, disponível em `cartasExtras` para envelope de campeão, todos os 228 clubes brasileiros cadastrados fechando XI por posição. Nenhum outro jogador acrescentado. Regra de uma pessoa por região preservada para esta inclusão; isso não é uma auditoria completa de todos os homônimos antigos.

### Evidência

- `scripts/testa-carreira-revisao.mts`: três aberturas (Brasiliense, Portuguesa, Flamengo), posse, mínimo, referência/renovação, contratos, saídas pendentes, retomada da janela, dívida dos bots, legado idempotente, descanso/registro de copa e entrada tática real no estadual.
- Regressões passaram: Brasil Oficial (60 A/B/C + 168 D/estaduais), 17 estaduais, Master, economia genérica dos bots e 40 copas reabertas iguais.
- Duas carreiras fictícias de 15 temporadas com compras, vendas, banco, comissão e renovação: 30 checkpoints, 600 elencos de técnicos sem XI incompleto. Portuguesa acessou A ao fim da T3 (estreia T4); no fim T15 estava em A com 722 moedas após a janela e folha de atletas 53. Brasiliense acessou C ao fim T12, terminou T15 em B com 66 moedas e folha 29. Uma semente por clube; **não são probabilidades nem prazo garantido**.
- Essa bancada anual tem gestão humana simplificada e calcula copas nativas, mas não reproduz todos os minutos/intervalos/decisões da interface nem o novo registro físico de todas as fases de copas. Não usar os saldos como previsão de uma conta real. Evidência e CSV em `/workspace/shared/carreira-revisao-validada-20261123/`; não sobrescreve a auditoria anterior e não grava nuvem.
- Navegador: central/elenco em 390/1440 px, calendário estável e sem exceções. Mesa de renovação em390/1440passou após corrigir retomada: avisos visíveis, botão individual bloqueado e contratos vencidos preservados. Capturas `renovacao-390.png`/`renovacao-1440.png`. Conferência repetida após ajustar botão coletivo/ajuda: passou, sem exceções. Build TypeScript/Vite e diff verificados localmente; não confundir com aprovação de equilíbrio.

### Pendências da revisão ampla

1. Fechar os outros 10 estaduais com formatos, clubes e XI reais pesquisados; atualmente seguem 17. Não adicionar centenas de nomes sem demonstrar a lacuna de cada novo clube.
2. Gestão física por minutos/substituições; ampliar a bancada por fase de copa e aumentar sementes/clubes antes de calibrar gols. A taxa de 0–0 foi observada; não inflar gols sem comparação.
3. Clubes só estaduais e estrangeiros ainda não têm a mesma economia nacional persistente. O giro anual estrangeiro autorizado anteriormente continua; não dizer que foi criado um simulador de ligas estrangeiras.
4. Revisão visual dos pequenos textos/avisos antes de commit visual, conforme CLAUDE.md. Sem publicação solicitada nesta etapa.

## Novas restrições do Diego (durante implementação)

Adicionar atleta SOMENTE se houver necessidade de fechar XI por posição (ter15 semGK também conta). Preferir conhecido histórico, senão atual REAL do clube, com fonte. Uma pessoa por região: Brasil, Europa, Mundo (Mundo exclui Brasil/Europa). Não criar outra versão Brasil do atleta já existente no Brasil nem Barça+PSG da mesma pessoa. Conferir homônimos/pessoa com fontes, não só nome. Categorias profissional/bom/promessa/craque/lenda e overs coerentes. Cartas novas entram carreira e cartinhas de campeão; NUNCA entram no baralho das salas online.

Data-oficial.ts é GERADO: editar docs/brasil-oficial/cartas-*.md e scripts/gera-cartas-oficial.py; não editar resultado à mão. Script ARQS inclui fixas e glob cartas-d-*.md. Baralho-oficial.ts já filtra duplicatas/nomes escondidos, tem separação de modo e elencos-conmebol-reservas. Baralho-inteiro.ts inclui extras para títulos. Base Bahia tem ZERO goleiro, reparo atualmente põe goleiro de outro clube; adicionar UM keeper real conhecido (Marcos Felipe/Danilo Fernandes não encontrados por rg inicial nos três catálogos Brasil; pesquisar antes) é necessário, autorizado. Outros clubes faltantes devem ser diagnosticados antes de ampliar catálogo.

## Cobertura estadual / pesquisa

Hoje17estaduais. Os outros10 demandam pesquisa E novos clubes/elencos reais (não há catálogo completo). MESTRA só tem:
DF Brasiliense Capital Ceilândia Gama;
ES Desportiva Ferroviária Porto Vitória Real Noroeste Rio Branco-ES Vitória-ES;
RN ABC América-RN Laguna;
PI Altos Fluminense-PI Parnahyba Piauí;
MS FC Pantanal Ivinhema Operário-MS;
TO Araguaína Capital-TO Tocantinópolis;
RO Guaporé Ji-Paraná Porto Velho;
AC Galvez Humaitá Independência Vasco-AC;
AP Independente-AP Oratório Trem;
RR Baré GAS Monte Roraima São Raimundo-RR.
Não inventar restantes nem montar estadual incompleto dizendo ser real. Alguns45clubes novos podem exigir centenas de jogadores reais; priorizar resolver lacunas e documentar escopo.

Pesquisa ferramentas: tools.mcp__codex_apps__search_service_web_run({search_query:[{q:...}],open:[{ref_id:urlouref}],response_length:'long'}). Retorna CallToolResult content text. Pode filtrar linhas no JS. Resultado completo da primeira abertura de7fontes guardado em functions store('estaduais_fontes1',r); ref de turno41/42/43 abaixo. Não usar consultasSupabase novas; save já preservado, nenhuma escrita autorizada.

FFDF fonte PRIMÁRIA aberta https://www.ffdf.com.br/pt/noticias/view.php?q=1141 (turn42view0):2026 Aruc,Brasília,Brasiliense,Capital,Ceilândia,Gama,Paranoá,Real Brasília,Samambaia,Sobradinho; turnoúnico9; top4semi ida/volta 1x4/2x3, mando volta melhor;2caem;finalúnicaManéGarrincha. Fonte2027 https://www.ffdf.com.br/pt/noticias/view.php?q=1349 (turn42view1) confirma semi empate favorece melhor;2026regulamentoPDF https://www.ffdf.com.br/assets/uploads/176245464195.pdf?v=177334293514 ainda precisa abrir para desempate2026 (não assumir2027).

RN primária aberta https://www.fnf.org.br/fnf-publica-regulamento-especifico-do-campeonato-potiguar-2026 (turn43search1):8turnoúnico;1/2diretosemi;3x6/4x5 ida/volta;semis ordenadasmelhorxmepior;semi/final ida/volta;semvantagem, pênaltis empate;2caem. PDF https://www.fnf.org.br/files/REC_Campeonato_Potiguar_2026.pdf turn43search108. Ainda obter8nomes.
ES primária aberta https://futebolcapixaba.com/2025/12/fes-publica-tabela-e-regulamento-do-capixabao-2026/ (turn43search9):10clubes CapixabaSC,Desportiva,ForteFC,PortoVitória,RealNoroeste,RioBrancoACSAF,RioBrancoFC,Serra,Vilavelhense,Vitória;turnoúnico9;top8quartas;2caem;quartas/semi/final ida/volta;vantagemcampanha sóquartas;demaispênaltis. CanonizarRioBrancoFC=RioBrancoVN. FES temlinkPDF35.
TO aberta ge https://ge.globo.com/to/futebol/campeonato-tocantinense/noticia/2025/12/05/campeonato-tocantinense-2026-ftf-divulga-a-tabela-e-o-regulamento.ghtml turn43search2:8 Tocantinópolis,Palmas,Capital(TO),Guaraí,BelaVista,Gurupi,União-TO,Araguaína;turnoúnico7;top4semi ida/volta;final2;2caem. Desempates no texto a partirL44 ainda recuperar.
MS ge aberta https://ge.globo.com/ms/futebol/campeonato-sul-mato-grossense/noticia/2026/01/15/guia-do-sul-mato-grossense-2026-tudo-sobre-o-campeonato-que-comeca-no-domingo.ghtml turn43search5:10turnoúnico+3fases eliminatórias (restanteaindaextrair). PDF turn43search109 https://www.srgoool.com.br/downloads.php?id_anexo=1576
AC ge aberta https://ge.globo.com/ac/futebol/campeonato-acreano/noticia/2026/01/15/guia-do-acreano-2026-regulamento-clubes-participantes-e-mais-detalhes-sobre-o-estadual.ghtml turn43search6 (regulamento emoutrolink);primária https://ffac.com.br/competicoes/regulamento/43 turn43search110;8 Adesg,Galvez,Humaitá,Independência,RioBrancoAC,SantaCruzAC,SãoFrancisco,VascoAC (turn43search15).
RR ge aberta https://ge.globo.com/rr/futebol/campeonato-roraimense/noticia/2026/01/23/guia-do-roraimense-2026-tudo-sobre-o-campeonato-que-comeca-neste-sabado.ghtml turn43search17:9 AtléticoRoraima,Baré,GAS,MonteRoraima,NáuticoRR,Progresso,RioNegroRR,RiverRR,SãoRaimundoRR;1cai;finalúnica. Formato demaislinhas aindaextrair (filtragemanteriornãoincluiu).
RO https://ffer.com.br/Publicacao.aspx?id=634518 turn43search3 (aberturapoucosdados);definitivo https://portovelho.portaldacidade.com/noticias/esportes/ffer-publica-regulamento-definitivo-do-campeonato-rondoniense-2026-1327 turn43search36;PDF turn43search111 https://www.srgoool.com.br/downloads.php?id_anexo=1570
PI/AP ainda faltapesquisaconfiável (buscabatchofuscou esses resultados).

Próximos passos técnicos urgentes: terminar calendário/carry/copas, rodar regressões/tsc/build, investigar lacunasreaisantesdeadd, validar isolamento online e duplicataporregião, simulaçõeslongascomregrasnovas. Não afirmar tudo pronto/publicado.
