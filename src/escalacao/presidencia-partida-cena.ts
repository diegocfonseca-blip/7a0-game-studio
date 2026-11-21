import type {Object3D,Scene} from 'three'

// A cidade permanece montada para a volta ao mapa, fora da árvore percorrida
// pelo renderizador durante a partida. `visible=false` sozinho ainda atualiza
// esqueletos e matrizes de todos os descendentes no Three.js.
const CAMPO=new Set(['campo-fundo-leve','estadio-arquitetura-volumetrica','complexo-campo','complexo-partida','placas-estadio','complexo-torcida-sentada','complexo-torcida-sombra','stadium-operations','stadium-technical-benches','complexo-dia-final','efeitos-lance-mapa','complexo-iluminacao','civilian-fanzone-eu'])
export function criarCenaFocadaPartida(scene:Scene){
 const retidos=new Set<Object3D>()
 let focused=false,disposed=false
 function sync(active:boolean,delegacao=false){
  if(disposed)return false
  let changed=focused!==active;focused=active
  const keep=(node:Object3D)=>CAMPO.has(node.name)||node.type.endsWith('Light')||node.type==='Object3D'||delegacao&&node.name==='city-team-arrivals'
  // Também cobre objetos carregados de forma assíncrona depois da abertura.
  if(active){
   for(const node of [...retidos])if(keep(node)){scene.add(node);retidos.delete(node);changed=true}
   for(const node of [...scene.children])if(!keep(node)){node.removeFromParent();retidos.add(node);changed=true}
  }else if(retidos.size){for(const node of retidos)scene.add(node);retidos.clear();changed=true}
  return changed
 }
 return{sync,inspect:()=>({focused,parked:[...retidos].map(n=>n.name||n.type),active:scene.children.map(n=>n.name||n.type)}),dispose(){if(disposed)return;sync(false);disposed=true}}
}

/** A câmera do bairro vê quilómetros; a câmera da partida vê só o estádio.
 * Nessa sessão, profundidade normal evita escrever gl_FragDepth por fragmento.
 * Ajustar o plano próximo conserva precisão quando se volta a ver a cidade. */
export function planoProximoPartida(distance:number,walking:boolean){
 return walking?.08:Math.max(.4,Math.min(8,Math.max(0,distance)*.01))
}
