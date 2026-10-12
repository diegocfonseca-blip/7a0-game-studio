# Presidência — integração para teste privado em 12/10/2026

Diego confirmou a publicação para teste, com a funcionalidade somente para
`diego.c.fonseca@gmail.com`. Essa confirmação substitui a espera anterior por
publicação ao final. Não autoriza liberar a funcionalidade para outras contas.

Integração sobre `fea3c1371474e4d1f1e7a989424c256a34b9da76` da main, em
worktree separado. Preservadas as mudanças posteriores ao lote anterior,
inclusive comunidade, batismos, cartinhas e duplas. O diretório original e
seu backup de continuidade permanecem preservados.

Entrega: evolução visual do estádio e entorno; circulação e oclusão de NPCs;
campo, bola e personagens 3D com escala e contato; passes, recepção, lateral,
defesas e distribuição do goleiro; arbitragem, técnicos e reservas; partida
integrada ao relógio, gols e chances da simulação; mapa amplo com zoom;
janela da sala acompanhando as obras. Personagens continuam sem olhos,
nariz ou boca. Não foram concedidos bens ou alterados saves reais.

O acesso continua dependendo da conta verificada por `auth.getUser()`.
Testes de identidade usam fixtures locais, sem login na conta real.
As artes estáticas continuam públicas por URL; o bloqueio é da funcionalidade.

## Verificações na versão integrada

- Compilação TypeScript e Vite com `DEPLOY_BASE=/ VITE_ONLY_GAME=escalacao`.
- Evolução, motor, contato com a bola, recepção, lateral, distribuição,
  árbitro, competições, acessos e encontros: aprovados.
- Regressões da main: cartinha, pênaltis e duplas aprovadas. O teste de duplas
  precisou de `PW_CHROME=/usr/bin/chromium`, o navegador instalado no ambiente.
- Gate: conta exata, negativa, troca de conta, resposta atrasada e falha fechada.
- Placar real, Copa e cinco partidas internacionais: aprovados em Chromium
  local com rede externa bloqueada.
- 47 cenários de evolução, no mapa e na janela, nas larguras 390 e 900:
  aprovados. `git diff --cached --check` sem problemas.

## Limites da entrega

Campo e personagens são 3D; arquibancadas e entorno usam arte registrada na
mesma câmera, sem reconstrução volumétrica completa. O motor apresenta os
eventos da simulação existente; não implementa um simulador completo de
faltas, impedimentos e cartões. Celular físico e persistência em nuvem não
foram testados. Fluidez móvel permanece pendente de validação real: a
emulação por software foi lenta. Ver `presidencia-validacao-final-local.md`.

Commit enviado não comprova deploy. O resultado do GitHub Pages precisa ser
conferido após o push. A rede deste ambiente bloqueou a leitura HTTPS direta
de leilaolegends.com (proxy 403); o acompanhamento de Actions funciona pelo
conector GitHub. Nenhuma restrição de rede foi removida.
