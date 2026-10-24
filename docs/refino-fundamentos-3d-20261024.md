# Revisão da partida 11×11 e dos fundamentos

Pedido: revisar a partida inteira do Neymarzetti, principalmente domínio, condução, passes, finalização e goleiro, antes de ampliar cidade/NPCs. Estilo Civil/NO FACE, rig, cidade e regras oficiais preservados.

## Causas e correções

1. **Virada precoce para passar:** a intenção girava o corpo inteiro até 250 ms antes do início da captura. Depois, enquanto a captura ainda tinha peso baixo, a corrida para a frente aparecia de costas. A orientação da corrida agora acompanha a envoltória real de entrada/saída do clipe. Cabeça/tronco mantêm antecipação limitada; a orientação necessária no contato continua integral.
2. **Recepção versus posse:** o campo `receiver` da última ação podia manter o limite de antecipação mesmo depois da chegada, ou continuar orientando um atleta que já não recebia a bola. A antecipação agora exige passe em andamento e receptor diferente do dono atual. Ao dominar, entra a regra de condução. Isso não inventa toque, posse, impulso ou trajetória.
3. **Atenção do goleiro:** cabeça e tronco acompanham a posição real da bola durante espera/deslocamento lento, sobre a animação existente. O ajuste é limitado e amortecido; não cria defesas. A captura validada de agarrada/reposição tem prioridade e fica excluída desse ajuste, preservando contato das mãos.

Uma aproximação corporal adicional de 8 cm foi experimentada e descartada: mudou apenas uma amostra no indicador de distância e não justificava mexer no encaixe estável. O limite anterior de avanço corporal foi preservado.

## Evidência

Mesma entrada oficial, 22 atletas, resultado 1×1 e 82 eventos. Partida inteira amostrada em 2.821 quadros/30 Hz, incluindo jogadores sem bola. Registros de deslocamento contrário à orientação, fora de reinícios oficiais: **51 → 7**. São amostras de quadro, não 51 jogadas. Restam transições breves que precisam de revisão, não uma aprovação global da locomoção.

Nas amostras: zero conflitos dos volumes de cabeça/cabelo, penetração pé–bola, piso inválido ou raiz fora do orçamento. Três reposicionamentos pertencem aos reinícios oficiais; não são passos físicos e não devem ser contados como corrida. Os 48 contatos revisados de pé continuam prontos; erro máximo de orientação corporal ~29,7°. A pegada do goleiro conserva contato das superfícies das duas mãos e separação da cabeça.

O indicador de dono com pé a mais de 22 cm da bola passou de 192 para 185 amostras. Inclui bola rolando à frente e atribuição de posse antes da chegada; não mede sozinho a qualidade do domínio. Não equivale a condução certificada, e não foi mascarado por teleporte da bola.

Vídeos reais da mesma partida e comparação antes/depois, normal/lenta: `test-results/cartoon-football/refino-atual/`. A versão anterior é reproduzida por substituição local das respostas dos dois módulos no navegador de QA; nenhuma alteração de produção para gravar o “antes”. Campo-base de terra, cores atuais e receitas de uniforme preservados. A gravação isolada do campo não é uma reconstrução do estádio ou da cidade.

## Verificações e limites

`test-reception-transition.mjs`, `test-action-controller.mjs`, `audit-whole-match.cjs`, `audit-actions.cjs`, `test-keeper-reception.cjs`, paridade oficial e build de produção. Exportação de vídeo e renderização SwiftShader não medem FPS em celular físico.

Ainda faltam capturas específicas de domínio/condução, lateral com as mãos e cruzamento deste acervo; as pendências anteriores de apoio/deslizamento continuam. A calibração revisada continua específica da entrada verificada: isso não certifica passes/chutes de qualquer save. A fixture não contém todos os tipos de falta, escanteio ou cabeceio. Cidade/NPCs, interface de partida limpa e repertório universal ficam para blocos posteriores; não declarar esses itens concluídos por esta revisão.

Nenhuma rodada avançada ou escrita no banco. A fonte oficial e a identidade dos modelos não foram alteradas. Publicação segue a mesma prévia privada autorizada, condicionada ao workflow verde.
