# Campo 2D dentro do estádio 3D — teste privado

Diego aprovou o mockup e autorizou implementação e publicação em 03/11/2026.
O acesso continua dependendo da verificação existente da conta do presidente;
nenhuma conta foi adicionada à lista e nenhuma migração foi executada.

## Apresentação

A cidade, estádio, acessos, ônibus e NPCs continuam em Three.js. No gramado,
o mapa usa a superfície desenhada pelo Campo2D existente e os mesmos estados
interpolados de jogadores, bola e juiz. O desenho dos marcadores foi extraído
para uma função compartilhada: cores, número, nome, destaque e retratos NO FACE
das lendas seguem a apresentação já disponível no campo 2D.

O adaptador não instancia um motor, não decide jogadas, não calcula resultados
e não salva carreira. O placar/HUD continua vindo do estado oficial. Um cache
limitado mantém a instância de apresentação ao trocar cinema/campo 2D.
Replays salvos têm identificadores próprios por sessão e usam a fonte oficial
já existente, sem avançar rodada.

O plano segue as dimensões reais de 105 × 68 m, com margem para as traves.
Marcadores planos mantêm nomes orientados à câmera. A opção “Ver partida”
enquadra o gramado inteiro; zoom continua manual e “Mapa” restaura a exploração
da cidade. Em telas verticais o eixo maior do campo acompanha a tela.

## Custo e reversibilidade

Essa apresentação não carrega malhas, esqueletos ou BVHs dos futebolistas.
As delegações usam os civis existentes ao sair dos ônibus e entrar pelo acesso
de serviço. O banco mantém os elementos e funcionários existentes, sem carregar
reservas humanoides. Não há novos serviços, contas, bibliotecas pagas ou assets.

A superfície é atualizada sob demanda (até 30 Hz perto, 6 Hz distante, zero
quando o mapa está oculto). Texturas de marcadores são reaproveitadas enquanto
identidade/arte não mudam. A implementação anterior 3D permanece disponível
no componente pela opção `matchPresentation`, sem ser usada nesta experiência.

## Validação local

- Build completo TypeScript/Vite e testes da fonte compartilhada e câmera.
- Componentes reais com cópia local somente de leitura do save Neymarzetti:
  22 marcadores, gols de Oséas aos 45 e Bruno Rangel aos 84; resultado 1–1.
- Verificações de continuidade, pausa, zoom, orientação móvel e ocultação após
  troca de conta/logout; zero downloads de rigs/clipes de futebol nesse fluxo.
- Capturas reais desktop/celular e cidade. Nenhuma medição em Chromium com
  renderização por software representa FPS de um celular físico.

Arquivos do motor oficial, banco, permissões e regras competitivas não foram
modificados. Fingerprint do motor: `23599bdba04b0c7c2639389e2509f4d81a34796083f78b6a5d81e97c0d22bbbd`.

Limites: os atletas agora são símbolos 2D no gramado, sem ações corporais 3D;
o mapa herda os movimentos e as limitações do campo 2D. A cidade e sua população
continuam tendo custo de renderização; remover futebolistas não elimina esse
custo. A aparência e fluidez precisam da avaliação de Diego no celular real.
