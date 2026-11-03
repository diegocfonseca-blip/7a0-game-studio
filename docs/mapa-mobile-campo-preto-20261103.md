# Correção do campo preto e orçamento gráfico móvel

Correção funcional da prévia privada já aprovada, sem novo layout, cidade ou
motor. O acesso continua restrito à mesma conta verificada; banco e save não
foram alterados.

## Diagnóstico reproduzido

Segurando a requisição `grass-base.webp`, o campo nativo ficava inteiramente
preto com as linhas ainda visíveis, como na captura de Diego. TextureLoader
retorna uma textura antes de sua imagem existir; WebGL amostra preto nesse
intervalo. Isso não era falta de luz: aumentar exposição não resolveria.

Uma imagem verde válida de 1×1 agora ocupa a própria textura durante a espera.
O download substitui essa imagem normalmente; a falha mantém a reserva verde.
O material passa a usar o shader padrão do Three.js, com a textura original,
UVs, faixas de corte e progresso de plantio preservados.

## Custo no celular

- Substitui a captura cúbica da cidade inteira por uma sonda de céu neutro:
  deixa de desenhar o cenário em seis direções ao abrir o mapa no celular.
  Desktop conserva os reflexos detalhados existentes.
- Desativa os passes pesados de sombras dinâmicas no perfil móvel. Luzes,
  dia/noite e sombras baratas de contato dos marcadores continuam presentes.
- Cadeiras distantes usam uma superfície simples nas mesmas instâncias,
  cores e coordenadas; a geometria original retorna ao aproximar. No fixture
  local, 4.351 instâncias economizaram 17.404 triângulos nessa vista.
- Torcedores móveis só recebem geometria detalhada a até 80 m da câmera.
  Os demais continuam nos mesmos assentos, com a representação simples;
  números de torcida, capacidade, receitas e reservas não mudam.
- O limite visual da cidade distante é 20 Hz; navegação e aproximação usam o
  orçamento interativo de até 30 Hz. Não são medições de FPS no aparelho.
  O relógio oficial e os relógios de trajetos mantêm o tempo decorrido real.
- Sob carga sustentada, o celular pode reduzir a resolução até 0,8 pixel
  físico por pixel CSS, em vez de ficar preso ao piso anterior de 1,25.
  O controlador considera a cadência intencional antes de reduzir qualidade.
- `try/finally` libera a trava de desenho mesmo se um quadro lançar exceção;
  um erro isolado não bloqueia permanentemente as próximas interações.

## Validação

Build TypeScript/Vite, orçamento gráfico, material nativo, LOD de cadeiras e
torcida, câmera e preservação dos respectivos dados/transformações. Browser
com renderização real (sem pular os desenhos) reproduziu a textura pendente,
confirmou campo verde com download pendente/interrompido e substituição pela
imagem de 256 px ao liberar a conexão. Amostra de reserva: RGB 67/102/13.
Teste de exceção transitória confirmou retomada do desenho. Navegação e
dia/noite foram exercitados; testes de conta alternativa/logout passaram.

Partida local somente de leitura: 22 atletas, mesmos gols e resultado 1–1;
475 amostras sincronizadas com erro X/Z zero, bola girando e rede reagindo.
Nenhuma promessa de FPS em celular físico é derivada de Chromium/SwiftShader:
seus atrasos de GPU não representam o aparelho de Diego.

Motor oficial intacto: `23599bdba04b0c7c2639389e2509f4d81a34796083f78b6a5d81e97c0d22bbbd`.
Não há novos serviços, pagamentos, migrações ou chamadas Realtime.
