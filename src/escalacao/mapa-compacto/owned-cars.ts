import { criarPisoPasseio } from '../presidencia-passeio-geometria';
import * as T from 'three';
import { criarBibliotecaVeiculos, type Veiculo3D } from '../veiculos-modelos-3d';
import { modeloVeiculo } from '../veiculos-modelos';
import { carteiraPresidenciaValida, type PresidenciaCarteira } from '../presidencia-economia';
import { PLANTAS_ESTACIONAMENTO_COMPLEXO } from '../presidencia-complexo-transporte-model';
import { viagemVeiculo, arredondarCaminho } from '../veiculos-entrega-rota';
import type { EstadoPasseioCarro } from '../veiculos-entrega-3d';
import type { SentidoPasseio } from '../veiculos-passeio-planta';
type Phase = 'parked' | 'going-stadium' | 'at-stadium' | 'going-home';
type Car = {
    id: string;
    body: Veiculo3D;
    phase: Phase;
    slot: number;
    time: number;
    trip?: ReturnType<typeof viagemVeiculo>;
    heading: number;
    reverseLength: number;
};
/** Presentation of confirmed property; the wallet is never mutated by movement or rendering. */
export function criarCarrosCompactos(scene: T.Scene, enabled: boolean, parkingStage: number, blockers: () => readonly {
    x: number;
    z: number;
}[]) {
    const root = new T.Group();
    root.name = 'veiculos-do-usuario';
    scene.add(root);
    const floor = criarPisoPasseio(scene);
    const library = criarBibliotecaVeiculos(), cars = new Map<string, Car>();
    let wallet: PresidenciaCarteira | undefined, last: number | undefined, revision = -1;
    const home = (slot: number) => ({ x: 21 + (slot % 2 === 0 ? -2.1 : 2.1), y: .19, z: 216 });
    const original = PLANTAS_ESTACIONAMENTO_COMPLEXO[0].slots[5].center, bay = { x: 206 + (original.x - 220) * .67, y: .19, z: -29 + (original.z - 95.5) * .67 }, aisle = bay.z + 6.7 * .67;
    function place(c: Car, p = home(c.slot)) { c.body.root.position.set(p.x, p.y, p.z); c.body.root.rotation.y = Math.PI; c.heading = Math.PI; c.body.update(0); }
    function sync(next?: PresidenciaCarteira | null, display?: readonly (string | null)[]) { if (!enabled || !carteiraPresidenciaValida(next)) {
        wallet = undefined;
        return false;
    } wallet = next; revision = next.revision; let changed = false; const pair: readonly (string | null)[] = display ?? next.owned.filter(b => !!modeloVeiculo(b.id)).slice(0, 2).map(b => b.id), owned = new Set<string>(next.owned.map(b => b.id)); for (const [id, c] of cars)
        if (!owned.has(id)) {
            c.body.dispose();
            cars.delete(id);
            changed = true;
        } for (const id of pair) {
        if (!id || !owned.has(id) || cars.has(id))
            continue;
        const body = library.create(id);
        if (!body)
            continue;
        root.add(body.root);
        const c: Car = { id, body, phase: 'parked', slot: pair.indexOf(id), time: 0, heading: Math.PI, reverseLength: 0 };
        cars.set(id, c);
        place(c);
        changed = true;
    } for (const c of cars.values()) {
        if (c.phase !== 'parked')
            continue;
        const slot = pair.indexOf(c.id);
        c.body.root.visible = slot >= 0;
        if (slot >= 0 && c.slot !== slot) {
            c.slot = slot;
            place(c);
            changed = true;
        }
    } return changed; }
    function path(c: Car, direction: SentidoPasseio) { const h = home(c.slot); const points = direction === 'stadium' ? [h, { x: h.x, y: .19, z: 235 }, { x: 30, y: .19, z: 246.5 }, { x: 253, y: .19, z: 246.5 }, { x: 261.5, y: .19, z: 239 }, { x: 261.5, y: .19, z: -26 }, { x: 250, y: .19, z: -26 }, { x: 206, y: .19, z: -26 }, { x: 185.23, y: .19, z: -26 }, { x: 185.23, y: .19, z: aisle }, { x: bay.x, y: .19, z: aisle }, bay] : [bay, { x: bay.x, y: .19, z: aisle }, { x: 185.23, y: .19, z: aisle }, { x: 185.23, y: .19, z: -26 }, { x: 206, y: .19, z: -26 }, { x: 258.5, y: .19, z: -26 }, { x: 258.5, y: .19, z: 239 }, { x: 250, y: .19, z: 243.5 }, { x: 30, y: .19, z: 243.5 }, { x: h.x, y: .19, z: 235 }, h]; return viagemVeiculo(arredondarCaminho(points, 2.5).map(p => ({ ...p, y: floor(p.x, p.z, .19) ?? .19 })), 5); }
    function drive(id: string, direction: SentidoPasseio): {
        ok: true;
    } | {
        ok: false;
        error: string;
    } { const c = cars.get(id); if (!enabled || !wallet?.owned.some(b => b.id === id) || !c || c.slot >= 2 || c.body.profile.kind !== 'car')
        return { ok: false, error: 'not-owned' }; if (parkingStage < 1)
        return { ok: false, error: 'no-parking' }; if ([...cars.values()].some(o => o !== c && o.phase !== 'parked') || (direction === 'stadium' ? c.phase !== 'parked' : c.phase !== 'at-stadium'))
        return { ok: false, error: 'busy' }; c.trip = path(c, direction); c.reverseLength = direction === 'stadium' ? 19 : 0; c.phase = direction === 'stadium' ? 'going-stadium' : 'going-home'; c.time = 0; last = undefined; return { ok: true }; }
    function commute() { const c = [...cars.values()].find(c => c.phase !== 'parked'); return c ? { id: c.id, phase: c.phase, position: c.body.root.position.toArray() as [
            number,
            number,
            number
        ], heading: c.heading, moving: c.phase !== 'at-stadium' } : null; }
    function update(seconds: number) { const dt = last === undefined ? 0 : Math.max(0, Math.min(.1, seconds - last)); last = seconds; for (const c of cars.values()) {
        if (!c.trip || !['going-stadium', 'going-home'].includes(c.phase))
            continue;
        const current = c.trip.at(c.time), waiting = blockers().some(b => { const x = b.x - current.x, z = b.z - current.z; return x * Math.sin(current.heading) + z * Math.cos(current.heading) > 0 && x * Math.sin(current.heading) + z * Math.cos(current.heading) < 9 && Math.abs(x * Math.cos(current.heading) - z * Math.sin(current.heading)) < 2.2; });
        if (!waiting)
            c.time += dt;
        const p = c.trip.at(c.time), reverse = c.phase === 'going-stadium' && p.distance < c.reverseLength;
        c.heading = p.heading + (reverse ? Math.PI : 0);
        c.body.root.position.set(p.x, p.y, p.z);
        c.body.root.rotation.y = c.heading;
        c.body.update(p.distance * (reverse ? -1 : 1));
        if (p.done) {
            c.phase = c.phase === 'going-stadium' ? 'at-stadium' : 'parked';
            c.trip = undefined;
            if (c.phase === 'parked')
                place(c);
        }
    } }
    function snapshotTrip(): EstadoPasseioCarro | null { const c = [...cars.values()].find(c => c.phase !== 'parked'); return c ? { id: c.id, phase: c.phase as EstadoPasseioCarro['phase'], leg: 0, time: c.time, slot: c.slot } : null; }
    function restoreTrip(snapshot: EstadoPasseioCarro) { const c = cars.get(snapshot.id); if (!c || c.slot !== snapshot.slot || !drive(c.id, 'stadium').ok)
        return false; if (snapshot.phase !== 'going-stadium') {
        place(c, bay);
        c.phase = 'at-stadium';
        c.trip = undefined;
        if (snapshot.phase === 'at-stadium')
            return true;
        if (!drive(c.id, 'home').ok)
            return false;
    } c.time = Math.max(0, Math.min(c.trip!.duration, snapshot.time)); return true; }
    return { root, sync, drive, update, commute, snapshotTrip, restoreTrip, active: () => [...cars.values()].some(c => c.phase === 'going-stadium' || c.phase === 'going-home'), inspect: () => ({ source: 'confirmed ownership only; compact routes; no save writes', revision, issues: [], vehicles: [...cars.values()].map(c => ({ id: c.id, phase: c.phase, position: c.body.root.position.toArray(), time: c.time, route: c.trip?.points })), geometry: library.inspect() }), dispose() { cars.forEach(c => c.body.dispose()); cars.clear(); library.dispose(); root.removeFromParent(); } };
}
