import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { EstadoComplexo } from '../presidencia-complexo-model';
import { faixaTransporteComplexo, gerarPlantaTransporte } from '../presidencia-complexo-transporte-model';
import type { criarEntornoComplexo, SolidoEntorno } from '../presidencia-complexo-entorno';
import { criarVidaCompacta } from './life';
import { planta, caixa, boundsForView, type Bounds } from './model';
import type { DestinoClubeMapa } from '../clube-mapa-destinos';
import type { DestinoPasseio } from '../presidencia-fanzone-3d';
import { acessoDelegacoesCompacto } from './team-access';
import type { VistaComplexo } from '../presidencia-complexo-3d';
type Entorno = ReturnType<typeof criarEntornoComplexo>;
const ownership: Record<string, string> = { 'Hotel': 'hotel', 'Loja da torcida': 'loja', 'Choperia': 'chopp', 'Alimentação': 'praca', 'Estacionamento · 4 setores': 'estac', 'Metrô': 'estacao' };
const actions: {
    name: string;
    id: DestinoClubeMapa;
    view: VistaComplexo;
    height: number;
}[] = [{ name: 'Casa do presidente', id: 'presidencia', view: 'casa-usuario', height: 6 }, { name: 'Loja da torcida', id: 'loja', view: 'loja', height: 8 }, { name: 'Agência', id: 'agencia', view: 'agencia-clube', height: 17 }, { name: 'Arena Legends', id: 'arena', view: 'arena-online', height: 23 }, { name: 'Museu', id: 'museu', view: 'museu-clube', height: 9 }];
export async function criarMapaCompacto(scene: T.Scene, state: EstadoComplexo, onReady: () => void, options: {
    management: boolean;
    name?: string;
}) {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(import.meta.env.BASE_URL + 'mapa-compacto/bairro-20261123-v1.glb');
    const root = new T.Group();
    root.name = 'complexo-entorno';
    root.add(gltf.scene);
    scene.add(root);
    const landmarks = new Map<string, T.Object3D>();
    gltf.scene.traverse(o => { if (o.userData.landmark)
        landmarks.set(o.userData.landmark, o); if (o instanceof T.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
    } });
    const enabled = (name: string) => !ownership[name] || !!state.extras[ownership[name]];
    gltf.scene.traverse(o => { if (o.userData.parkingStage)
        o.visible = Number(o.userData.parkingStage) <= state.parking.stage; });
    for (const [name, o] of landmarks)
        o.visible = enabled(name) && (!['Casa do presidente', 'Agência', 'Arena Legends'].includes(name) || options.management);
    const solids: SolidoEntorno[] = planta.allLots.filter(b => !['Estádio', 'Metrô', 'Museu', 'Praça do bairro', 'Feira', 'Campo de terra', 'Estacionamento · 4 setores'].includes(b.name) && enabled(b.name)).map(b => { const box = caixa(b.name)!; return { id: 'compacto-' + b.name, ...box, base: 0, top: b.name === 'Hotel' ? 24 : 12, footprint: [{ x: box.minX, z: box.minZ }, { x: box.maxX, z: box.minZ }, { x: box.maxX, z: box.maxZ }, { x: box.minX, z: box.maxZ }] }; });
    // Landmarks are independent ownership groups, rather than a single merged all-upgrades scene.
    const transport = gerarPlantaTransporte(state), doors: Entorno['doors'] = {};
    for (const l of planta.lots) {
        const b = caixa(l.name)!, x = (b.minX + b.maxX) / 2, z = b.maxZ;
        doors[l.name] = { id: l.name, x, z, heading: 0, stay: 10, approach: { x, z: z + 2 }, threshold: { x, z }, inside: { x, z: z - 2 } };
    }
    root.userData.landscape = { publicParks: 1, beltTrees: 0, clubTrees: 32, regionalTrees: 0, compact: true };
    root.userData.roadNetwork = { diagnostics: { connected: true, source: 'compact-metric-layout', roads: planta.roads.length }, streets: [] };
    root.userData.pedestrianNetwork = { connected: true, routes: planta.walks.length };
    root.userData.clubPlaces = { clubName: options.name, store: !!state.extras.loja, agency: options.management, arena: options.management };
    root.userData.dealership = { sign: { position: { x: 204, y: 9, z: -159 } }, compact: true };
    root.userData.sponsors = { compact: true };
    const service = acessoDelegacoesCompacto(), pavement = new T.MeshLambertMaterial({ color: '#555e56' });
    for (const points of [service.inbound, service.outbound]) {
        const privateLane = points.filter(p => p.x > -114 && p.z > -65);
        if (privateLane.length < 2)
            continue;
        const polygon = faixaTransporteComplexo(privateLane, 4.2), shape = new T.Shape();
        polygon.forEach((p, i) => i ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z));
        const mesh = new T.Mesh(new T.ShapeGeometry(shape), pavement);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = .095;
        mesh.name = 'compacto-acesso-delegacoes';
        mesh.receiveShadow = true;
        root.add(mesh);
    }
    if (state.extras.estacao)
        for (let x = -262; x <= 262; x += 38) {
            const minX = x + 30 - .45, maxX = x + 30 + .45, minZ = -103 - .45, maxZ = -103 + .45;
            solids.push({ id: 'compacto-pilar-metro-' + x, minX, maxX, minZ, maxZ, base: 0, top: 5.2, footprint: [{ x: minX, z: minZ }, { x: maxX, z: minZ }, { x: maxX, z: maxZ }, { x: minX, z: maxZ }] });
        }
    const life = criarVidaCompacta(scene, state, onReady);
    let disposed = false;
    const dispose = () => { if (disposed)
        return; disposed = true; life.dispose(); const gs = new Set<T.BufferGeometry>(), ms = new Set<T.Material>(), tx = new Set<T.Texture>(); root.traverse(o => { if (o instanceof T.Mesh) {
        gs.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            ms.add(m);
            for (const v of Object.values(m))
                if (v instanceof T.Texture)
                    tx.add(v);
        }
    } }); root.removeFromParent(); gs.forEach(g => g.dispose()); ms.forEach(m => m.dispose()); tx.forEach(t => t.dispose()); };
    const surround: Entorno = { root, solids, doors, transport, botecos: [], balada: null, clubeLazer: null, residence: undefined, casaLuca: false, casaLucaSul: false, establishments: new Set(['loja', 'hotel', 'chopp', 'praca'].filter(k => state.extras[k])), bairro: { quadras: planta.allLots.map(b => ({ x: (b.minX + b.maxX) / 2 + 30, z: (b.minZ + b.maxZ) / 2 + 10 })), ruas: [], campinho: { x: -44, z: 220 }, praca: { x: -175, z: 221 }, casas: [] }, dispose };
    function rayTargets() { const out = actions.filter(a => enabled(a.name) && (options.management || a.name === 'Museu')).map(a => ({ ...a, bounds: caixa(a.name)! })); return out; }
    const placeNames: Record<string, string> = { 'Shopping e Vadico': 'shopping', 'Clube Recreio': 'clube-lazer', 'Casa Luca': 'casa-luca', 'Balada': 'balada', 'Boteco': 'boteco-oswaldo', 'Feira': 'feira', 'Banca': 'banca', 'Campo de terra': 'campinho', 'Padaria': 'padaria', 'Praça do bairro': 'praca-bairro', 'GECG': 'gecg', 'OittoLabs': 'oittolabs', 'dSouza': 'dsouza', 'Tidex': 'tidex' };
    function pick(ray: T.Raycaster) { const list = [...rayTargets().map(a => ({ view: a.view, b: a.bounds, height: a.height })), ...Object.entries(placeNames).map(([name, view]) => ({ view: view as VistaComplexo, b: caixa(name)!, height: name === 'Tidex' ? 35 : name === 'Shopping e Vadico' ? 30 : 14 }))]; const hits = list.flatMap(t => { const p = ray.ray.intersectBox(new T.Box3(new T.Vector3(t.b.minX, 0, t.b.minZ), new T.Vector3(t.b.maxX, t.height, t.b.maxZ)), new T.Vector3()); return p ? [{ view: t.view, d: ray.ray.origin.distanceTo(p) }] : []; }); hits.sort((a, b) => a.d - b.d); return hits[0]?.view; }
    function destinos(): DestinoPasseio[] { const out: DestinoPasseio[] = [{ id: 'portao', nome: ['Portão da torcida', 'Supporters gate'], x: -4.55, z: 96 }]; if (options.management) {
        out.push({ id: 'casa', nome: ['Minha casa', 'My home'], x: 15, z: 240, acao: ['Entrar na casa', 'Enter home'] }, { id: 'agencia', nome: ['Minha agência', 'My agency'], x: -75, z: -148, acao: ['Entrar na agência', 'Enter agency'] }, { id: 'financas', nome: ['Gestão do clube', 'Club management'], x: 8, z: 115, acao: ['Abrir finanças', 'Open finances'] }, { id: 'patrocinio', nome: ['Patrocínios do clube', 'Club sponsorships'], x: -8, z: 115, acao: ['Ver patrocínios', 'View sponsorships'] });
        if (state.extras.loja)
            out.push({ id: 'loja', nome: ['Loja da torcida', 'Supporters store'], x: 48, z: 139, acao: ['Ver loja', 'View store'] });
        out.push({ id: 'museu', nome: ['Museu do clube', 'Club museum'], x: -81, z: 137, acao: ['Ver museu', 'View museum'] });
    } return out; }
    return { root, surround, life, setFair: (open: boolean) => { const fair = landmarks.get('Feira'); if (fair)
            fair.visible = open; }, pick, destinos, dispose, location: (view: string) => boundsForView(view), museum: { x: -81, z: 121 }, inspect: () => ({ version: '20261123-v1', landmarks: [...landmarks.keys()], owned: [...landmarks].filter(([, o]) => o.visible).map(([name]) => name), life: life.inspect(), bounds: boundsForView('original'), writes: 0 }) };
}
export type MapaCompacto = Awaited<ReturnType<typeof criarMapaCompacto>>;
export function enquadrarCompacto(bounds: Bounds, fit: (minX: number, maxX: number, minZ: number, maxZ: number, height: number) => void, height = 20) { fit(bounds.minX - 3, bounds.maxX + 3, bounds.minZ - 3, bounds.maxZ + 3, height); }
