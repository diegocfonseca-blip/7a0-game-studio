# Publicação privada da Presidência — 15/10/2026

Diego autorizou explicitamente: **“Publique tudo no meu usuário q fez até agora”**,
seguido de “Siga”. Esta autorização substitui a pausa anterior de publicações.
O deploy usa o site compartilhado existente, mantendo as novidades atrás da
verificação de `diego.c.fonseca@gmail.com`. Não há concessão de moedas, obras,
planos ou alterações diretas no banco da conta.

## Conteúdo preparado

- Trabalho acumulado preservado no commit `6366c367`; main atualizada até
  `890175ea` incorporada por `707548fa`. Conflitos resolvidos preservando tanto
  o estacionamento gradual quanto o painel da SAF/segundo clube, e os dois
  registros de pendências. Não substituir a main por uma cópia antiga.
- A aba **Clube → Estrutura**, na carreira solo da conta autorizada, passa a
  abrir o complexo 3D com o estádio, obras, estabelecimentos, entorno, Vadico,
  ruas, metrô, ônibus, carros, torcida, camarote e mobiliário existentes.
  O carregamento do renderizador é adiado até a entrada autorizada na tela.
  A vista ilustrada anterior continua disponível numa seção expansível.
- Quatro etapas do estacionamento liberadas pela mesma restrição de conta.
  Saves antigos com estacionamento completo continuam completos. O reducer
  impede compra repetida pelo botão antigo e preserva saldo/extrato.
- A partida chega pelo mesmo publicador do placar. A agenda da liga e da Copa
  acompanha o contexto: quarta às 21h/noite, domingo às 16h/dia. A Copa usa
  a quantidade real de pernas de cada fase. Não usa a data/hora do aparelho.
  O encerramento da apresentação preserva o último contexto para a saída
  física dos espectadores; não escreve resultado nem reinicia o relógio.
- Mesmo passageiro do veículo à cadeira e no retorno. Dono da cadeira mantém
  a reserva até terminar sua jornada. A câmera acompanha o mesmo corpo.
  Metrô mandante usa o acesso frontal; visitante usa o lateral.
- Coorte de até seis espectadores usa os degraus existentes na saída/volta.
  Reduzir a quota de três para um admite primeiro quem espera mais perto da
  escada: 8.313 verificações a 10 Hz, distância mínima de 2,2 m entre corpos.

## Validação da candidata

- Build e TypeScript passaram após a integração e a conciliação com a main.
- Evolução: 2.048 combinações + 4.096 combinações do mapa; gate verificado,
  falha fechada, compras e pré-requisitos privados.
- Estacionamento: quatro etapas, 18 recusas, extrato, saldo, outros gestores e
  compatibilidade antiga preservados, executando os cases reais do reducer.
- Adaptador: 165 visuais de personagem; calendário: 1.338 cenários;
  movimento: 1.843 quadros; fluxo: 864 legados + 1.194 integrados.
- Transporte: 9.568 verificações de continuidade e 4.299 quadros de troca de
  dono. Os testes físicos anteriores da mesma geometria permanecem registrados
  em `presidencia-complexo-3d-reconstrucao.md`.
- Partida: 136 quadros, 22 atletas, pausa/gols/substituição, árbitro e bancos.
- Navegador: execução final em andamento. Atualizar esta seção com o resultado
  antes de enviar. Relatórios e capturas em `test-results/complexo-3d/`.

## Limites desta versão de teste

É a versão atual autorizada para Diego testar; acabamento e fidelidade à arte
original ainda precisam de trabalho. A coorte física cobre seis espectadores,
não toda a amostra de até 800. Chegada antecipada depende de integração adicional
com o calendário. Torcida visitante exige dados confirmados do adversário.
O personagem existente e sua sala ilustrada permanecem no fluxo da Presidência;
não há ainda um novo corpo físico do presidente no camarote.

A publicação só deve ser declarada concluída quando a main contiver a candidata
e o workflow GitHub Pages terminar com sucesso. A evidência do deploy será
registrada em `test-results/complexo-3d/publicacao-deploy.json`.
