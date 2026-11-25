import {criarTrechoBairro} from './clip'
import { criarPisoPasseio } from '../presidencia-passeio-geometria';
import * as T from 'three';
import { criarFigurantes, type Figurante } from '../presidencia-figurantes';
import { createCivilian } from '../cidade3d/civilians.mjs';
import { residentVisibility } from '../cidade3d/resident-visibility.mjs';
import { criarVeiculoTransporte } from '../presidencia-veiculo-transporte';
import type { ServicoTransporteComplexo } from '../presidencia-complexo-transporte-model';
import type { EstadoComplexo } from '../presidencia-complexo-model';
import { populationPlan, routeAt, planta, fadePortal, type PopulationInput } from './model';
import { criarPropsDiaJogo } from '../presidencia-dia-jogo-props';
type Input = PopulationInput & {
    feira?: boolean;
    pelada?: boolean;
    homeColor?: string;
    awayColor?: string;
    period?: string;
    humor?: 'festa'|'triste'|'normal';
    carreata?:boolean;
};
/** Existing club attendance drives bounded visual cohorts; nothing here writes career/online state. */
export function criarVidaCompacta(scene: T.Scene, state: EstadoComplexo, onReady: () => void) {
    const root = new T.Group();
    root.name = 'compacto-vida';
    const clipFloor=criarPisoPasseio(scene),clip=criarTrechoBairro(root,onReady,(x,z)=>clipFloor(x,z,.19)??.19);
    scene.add(root);
    const floor = criarPisoPasseio(scene), ground = (x: number, z: number, y = .19) => floor(x, z, y) ?? y;
    const queue = criarFigurantes(root, 160, 'compacto-torcida-portoes'), club = criarFigurantes(root, 14, 'compacto-clube-lazer');
    const pub=criarFigurantes(root,10,'compacto-boteco-vivo'),nightclub=criarFigurantes(root,5,'compacto-balada-viva');
    let parade:ReturnType<typeof criarVeiculoTransporte>|undefined,paradeFans:ReturnType<typeof criarFigurantes>|undefined;
    const flagGeometry = new T.PlaneGeometry(.6, .38), poleGeometry = new T.BoxGeometry(.025, 1.1, .025), flagMaterial = new T.MeshLambertMaterial({ color: '#ffffff', side: T.DoubleSide }), poleMaterial = new T.MeshLambertMaterial({ color: '#746849' }), flags = new T.InstancedMesh(flagGeometry, flagMaterial, 32), poles = new T.InstancedMesh(poleGeometry, poleMaterial, 32), dummy = new T.Object3D(), flagColor = new T.Color();
    flags.count = poles.count = 0;
    flags.frustumCulled = poles.frustumCulled = false;
    root.add(flags, poles);
    const rigs = Array.from({ length: 10 }, (_, i) => ({ side: i % 4 === 1 ? 'away' as const : 'home' as const, body: createCivilian(root, { id: 'compacto-pedestre-' + i, variant: i % 3 === 1 ? 'adult-woman' : i % 3 === 2 ? 'older-man' : 'adult-man', deferUntilVisible: true, onReady }), heading: 0, pose: { x: 0, y: 0, z: 0 }, visible: false, active: false, fan: false, fixture: '', path: [] as number[][], distance: 0, returning: false }));
    const props = criarPropsDiaJogo(root, () => .19);
    const vendorPositions = [[-56, 138.5], [-33, 138.5], [20, 138.5], [115, 41], [-60, 103]];
    const groups = props.root.children.filter(n => n.name.startsWith('matchday-stall-'));
    groups.forEach((n, i) => { const p = vendorPositions[i % vendorPositions.length]; n.position.set(p[0], .19, p[1]); n.rotation.y = i === 3 ? Math.PI / 2 : 0; });
    const spec = (id: string, kind: 'bus' | 'metro' | 'car', length: number, width: number, floorHeight: number): ServicoTransporteComplexo => ({ id, kind, side: 'home', width, length, wheelRadius: kind === 'car' ? .29 : .42, floorHeight, stop: { position: { x: 0, y: .19, z: 0 }, heading: 0 }, inbound: [], outbound: [], passengerRoute: [], door: { side: 1, longitudinal: 2, width: 1.2 } });
    const bus = criarVeiculoTransporte(root, spec('compacto-estadio', 'bus', 10.6, 2.5, .52), '#c5aa63'), bus2 = criarVeiculoTransporte(root, spec('compacto-bairro', 'bus', 10.6, 2.5, .52), '#54745c');
    const train = state.extras.estacao ? criarVeiculoTransporte(root, spec('compacto-metro', 'metro', 114.9, 2.65, .48), '#366a55') : undefined;
    const cars = Array.from({ length: 4 }, (_, i) => criarVeiculoTransporte(root, spec('compacto-carro-' + i, 'car', 4.4, 1.85, .34), ['#b7b4a3', '#9b5140', '#526c5c', '#d8cda7'][i]));
    let input: Input = { enabled: false, mobile: true }, plan = populationPlan(input), key = '', phase = 'idle', phaseAt = 0, last = 0, elapsed = 0, dirty = true, seconds = 0, disposed = false;
    const rnd = (i: number, k: number) => { let h = Math.imul((i + 1) * 2654435761 ^ k * 40503, 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
    function configure(next: Input) { const nextKey = JSON.stringify([next.journey?.key, next.journey?.phase, next.enabled, next.home?.supporters, next.home?.attendance, next.home?.capacity, next.away?.supporters, next.mobile, next.awayMatch, next.homeColor, next.awayColor, next.period, next.rain, next.feira, next.pelada,next.humor,next.carreata]); input = next; if (key === nextKey)
        return; key = nextKey; const nextPlan = populationPlan(next); if (phase !== nextPlan.phase) {
        phase = nextPlan.phase;
        phaseAt = elapsed;
    } plan = nextPlan; for (const r of rigs)
        if (r.fan && (!plan.active || next.journey?.key !== r.fixture || plan.phase === 'departure'))
            r.returning = true; dirty = true; root.visible = next.enabled; }
    const paths = [...['metro-oeste', 'metro-leste', 'onibus-estadio', 'onibus-arena'].map(id => planta.walks.find(r => r.id === id)!.points), [[-225.5, -80], [-225.5, 79], [-189, 79]], [[-164, 193], [-164, 229.5], [75, 229.5]], [[113.5, 41.5], [224.5, 41.5]], [[83, -141.5], [-105, -141.5], [-169, -141.5]]];
    const fanPaths = state.extras.estacao ? paths.slice(0, 3) : [paths[2]];
    const visitorPath = state.extras.estacao ? [[38, 6, -107], [85, 6, -107], [85, 6, -103], [85, .16, -91], [99, -91], [99, -4], [75, -4]] : [[174, 156], [216, 158], [216, 133], [113.5, 133], [113.5, -4], [75, -4]];
    const uniform = (i: number, side: 'home' | 'away') => rnd(i, 12) < .78 ? (side === 'home' ? input.homeColor : input.awayColor) ?? (side === 'home' ? '#eeeeee' : '#b83228') : ['#e9dfc4', '#343b34', '#b5b9ac'][i % 3];
    const shirts = (rig: typeof rigs[number], color: string) => rig.body.root.traverse(n => { if (n instanceof T.Mesh)
        for (const m of Array.isArray(n.material) ? n.material : [n.material])
            if (m instanceof T.MeshStandardMaterial && ['Shirt', 'Clothes'].includes(m.name))
                m.color.set(color); });
    function fillQueue() {
        const list: Figurante[] = [], departure = phase === 'departure' ? Math.max(0, 1 - (elapsed - phaseAt) / 120) : 1;
        const n = Math.round((plan.homeFans + plan.awayFans) * departure);
        for (let i = 0; i < n; i++) {
            const side = i < Math.round(plan.awayFans * departure) ? 'away' : 'home';
            let x: number, z: number;
            if (side === 'away') {
                x = 108 + rnd(i, 2) * 16;
                z = 12 + rnd(i, 3) * 12;
            }
            else {
                x = (i % 2 ? -11 - rnd(i, 2) * 17 : 3 + rnd(i, 2) * 17);
                z = 108 + rnd(i, 3) * 28;
            }
            list.push({ x, y: ground(x, z), z, heading: side === 'away' ? -Math.PI / 2 : Math.PI, camisa: uniform(i, side) });
        }
        let flagCount = 0;
        for (let i = 0; i < list.length && flagCount < 32; i += 5) {
            const p = list[i];
            dummy.position.set(p.x + .35, p.y + 1.65, p.z);
            dummy.rotation.set(0, p.heading ?? 0, -.2);
            dummy.updateMatrix();
            flags.setMatrixAt(flagCount, dummy.matrix);
            flagColor.set(i < plan.awayFans ? input.awayColor ?? '#b83228' : input.homeColor ?? '#eeeeee');
            flags.setColorAt(flagCount, flagColor);
            dummy.position.y = p.y + 1.1;
            dummy.updateMatrix();
            poles.setMatrixAt(flagCount, dummy.matrix);
            flagCount++;
        }
        flags.count = poles.count = flagCount;
        flags.instanceMatrix.needsUpdate = poles.instanceMatrix.needsUpdate = true;
        if (flags.instanceColor)
            flags.instanceColor.needsUpdate = true;
        for (let i = 0; i < plan.vendors; i++) {
            const p = vendorPositions[i % vendorPositions.length];
            list.push({ x: p[0], y: .19, z: p[1] - .9, heading: 0, camisa: '#e9dfc4' });
        }
        if (input.feira)
            for (const z of [209, 215, 222])
                list.push({ x: -99, y: ground(-99, z), z, heading: Math.PI / 2, camisa: '#a98b73' });
        if (input.pelada)
            for (const [x, z] of [[-47, 218], [-41, 222], [-47, 222], [-41, 218]])
                list.push({ x, y: ground(x, z), z, heading: x < -44 ? Math.PI / 2 : -Math.PI / 2, camisa: '#d8cba6' });
        if (input.period === 'night')
            for (let i = 0; i < 3; i++)
                list.push({ x: -180 + i * 1.2, y: ground(-180 + i * 1.2, 196), z: 196, camisa: '#62517d' });
        pub.set(Array.from({length:input.humor==='festa'?8:input.humor==='triste'?4:3},(_,i)=>({x:-144+(i%4-1.5)*1.45,y:ground(-144,202),z:202+Math.floor(i/4)*1.8,heading:i%2?1.1:-1.1,camisa:input.homeColor??'#1b7a3d'})));
        nightclub.set(input.period==='night'?Array.from({length:5},(_,i)=>({x:-181+i*1.2,y:ground(-181,202),z:202+i%2,camisa:['#62517d','#c38b78','#ddd5b7'][i%3]})):[]);
        if(input.carreata&&!parade){parade=criarVeiculoTransporte(root,spec('compacto-carreata','bus',10,2.5,.32),input.homeColor??'#1b7a3d');paradeFans=criarFigurantes(parade.root,7,'compacto-carreata-torcida');paradeFans.set(Array.from({length:7},(_,i)=>({x:i%2?.5:-.5,y:2.95,z:-3.5+i*1.1,camisa:input.homeColor??'#1b7a3d'})));}
        if(parade&&!input.carreata){paradeFans?.dispose();parade.dispose();parade=undefined;paradeFans=undefined;}
        parade?.setColor(input.homeColor??'#1b7a3d');
        queue.set(list);
        dirty = false;
    }
    function vehicle(body: ReturnType<typeof criarVeiculoTransporte>, path: readonly (readonly number[])[], d: number, open = 0) { const p = routeAt(path, d), fade = fadePortal(p.x); body.root.position.set(p.x, p.y < 1 ? ground(p.x, p.z) : p.y, p.z); body.root.rotation.y = p.heading; body.root.visible = input.enabled && fade > .01; body.root.traverse(n => { if (n instanceof T.Mesh)
        for (const m of Array.isArray(n.material) ? n.material : [n.material]) {
            m.userData.compactOpacity ??= m.opacity;
            m.transparent = fade < 1 || m.userData.compactOpacity < 1;
            m.opacity = m.userData.compactOpacity * fade;
        } }); body.update(d, open); }
    function update(time: number, camera: T.Camera, height: number) {
        if (disposed)
            return;
        const dt = Math.max(0, Math.min(.15, time - last));
        last = time;
        seconds = time;
        if (!input.enabled) {
            root.visible = false;
            return;
        }
        root.visible = true;
        elapsed += dt;
        if (dirty || phase === 'departure')
            fillQueue();
        queue.tempo(elapsed);pub.tempo(elapsed*(input.humor==='festa'?1.8:.5));nightclub.tempo(elapsed);
        if(parade){vehicle(parade,planta.vehiclePaths.bus,650+elapsed*3);paradeFans?.tempo(elapsed*2);}
        rigs.forEach((r, i) => {
            if (!r.fan && plan.active && phase !== 'departure' && i < plan.walkers && (r.side !== 'away' || plan.awayFans > 0)) {
                r.fan = true;
                r.fixture = input.journey?.key ?? '';
                r.path = r.side === 'away' ? visitorPath : fanPaths[i % fanPaths.length];
                r.distance = 0;
                r.returning = false;
            }
            const fan = r.fan, side = r.side, visitor = side === 'away';
            let on = i < Math.min(rigs.length, plan.residents + (plan.active ? plan.walkers : 0));
            if (visitor && fan && !plan.awayFans)
                on = false;
            const path = fan ? r.path : paths[4 + i % 4], duration = routeAt(path, 0).total;
            if (fan)
                r.distance = Math.max(0, Math.min(duration, r.distance + (r.returning ? -1 : 1) * dt * .95));
            const distance = fan ? r.distance : elapsed * .8 + i * 11;
            const p = routeAt(path, distance, !fan);
            if (fan && ((!r.returning && distance >= duration) || (r.returning && distance <= 0)))
                on = false;
            if (fan && r.returning && distance <= 0) {
                r.fan = false;
                r.returning = false;
                r.fixture = '';
            }
            p.y = ground(p.x, p.z, p.y);
            r.body.root.position.set(p.x, p.y, p.z);
            r.heading += Math.atan2(Math.sin(p.heading - r.heading), Math.cos(p.heading - r.heading)) * Math.min(1, dt * 6);
            r.body.root.rotation.y = r.heading;
            r.pose = p;
            const lod = residentVisibility(r.body.root.position, 1.76, camera, height);
            r.active = on;
            r.visible = on && lod.visible;
            shirts(r, fan ? uniform(i, side) : ['#89785c', '#58735b', '#b07c63', '#527387'][i % 4]);
            r.body.update({ seconds: elapsed, distance: Math.max(0, distance), speed: on ? .9 : 0, visible: r.visible, detail: lod.detail });
        });
        groups.forEach((g, i) => { g.visible = i < plan.vendors; const p = vendorPositions[i % vendorPositions.length]; g.position.set(p[0], .19, p[1]); });
        props.root.visible = plan.vendors > 0;
        // The purchased recreation compound is quieter at night; its residents are decorative samples.
        club.set(input.period === 'night' ? [] : Array.from({ length: input.mobile ? 6 : 10 }, (_, i) => ({ x: i < 4 ? -177.85 + (i % 2 ? 5.2 : -5.2) : -144.05 + (i % 3 - 1) * 1.7, y: i < 4 ? .32 : .42, z: i < 4 ? 67 + (i < 2 ? -7.02 : 7.02) : 63.75 + (i % 2 ? .7 : -.7), heading: i % 2 ? Math.PI / 2 : -Math.PI / 2, camisa: uniform(i, 'home') })));
        pub.mostrar(clip.view()!=='boteco-oswaldo');nightclub.mostrar(clip.view()!=='balada');club.mostrar(clip.view()!=='clube-lazer');paradeFans?.mostrar(!clip.active());
        const t = elapsed % 140, hold = (stop: number, speed: number, arrive: number, depart: number) => t < arrive ? stop - (arrive - t) * speed : t <= depart ? stop : stop + (t - depart) * speed;
        vehicle(bus, planta.vehiclePaths.bus, hold(1086.1818, 4.7, 16, 24), t >= 16 && t <= 24 ? 1 : 0);
        vehicle(bus2, planta.vehiclePaths.busEast, hold(732.8082, 4.2, 16, 24), t >= 16 && t <= 24 ? 1 : 0);
        if (train)
            vehicle(train, [[-288, 5.52, -113], [-24, 5.52, -113], [288, 5.52, -113]], hold(264, 5.8, 18, 28), t >= 18 && t <= 28 ? 1 : 0);
        cars.forEach((c, i) => { vehicle(c, planta.vehiclePaths[i % 2 ? 'south' : 'north'], elapsed * (7 + i * .3) + i * 98); c.root.visible &&= i < plan.cars; });
    }
    return { root, clip, clipUpdate:(now:number,reduced:boolean)=>clip.update(now,reduced,parade?.root), configure, update, parade:()=>parade?.root.visible?parade.root.position:undefined, vehicles: () => [bus, bus2, ...cars, ...(train ? [train] : [])].filter(b => b.root.visible).map(b => ({ x: b.root.position.x, z: b.root.position.z })), active: () => input.enabled, actor: (side: 'home' | 'away') => { const r = rigs.find(r => r.side === side && r.active); if (!r)
            return; r.body.root.userData.side = side; return { root: r.body.root }; }, inspect: () => ({ clip:clip.inspect(),pub:pub.inspect(),nightclub:nightclub.inspect(),parade:!!parade,plan, phaseElapsed: elapsed - phaseAt, queue: queue.inspect(), walkers: rigs.filter(r => r.visible).map(r => ({ id: r.body.inspect().id, side: r.side, role: r.fan ? 'fan' : 'resident', fixture: r.fixture, returning: r.returning, distance: r.distance, position: r.body.root.position.toArray(), source: r.body.inspect() })), vendors: groups.filter(g => g.visible && props.root.visible).map(g => g.name), transport: { buses: [bus.root.position.toArray(), bus2.root.position.toArray()], train: train?.root.position.toArray(), time: seconds }, writes: 0 }), dispose() { if (disposed)
            return; disposed = true; clip.dispose();rigs.forEach(r => r.body.dispose()); queue.dispose(); club.dispose();pub.dispose();nightclub.dispose();paradeFans?.dispose();parade?.dispose(); flags.removeFromParent(); poles.removeFromParent(); flagGeometry.dispose(); poleGeometry.dispose(); flagMaterial.dispose(); poleMaterial.dispose(); props.dispose(); bus.dispose(); bus2.dispose(); train?.dispose(); cars.forEach(c => c.dispose()); root.removeFromParent(); } };
}
