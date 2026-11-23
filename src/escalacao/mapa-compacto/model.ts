import data from './planta.json';
import type { JornadaComplexo } from '../presidencia-complexo-jornada';
import type { publicoDoEstadio } from '../presidencia-estadio-publico';
export type Point2 = readonly [
    number,
    number
];
export type Point3 = readonly [
    number,
    number,
    number
];
export type Bounds = {
    name?: string;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
};
export type Lot = {
    name: string;
    source: number[];
    x: number;
    z: number;
    scale: number;
    face: string;
};
export type Walk = {
    id: string;
    points: (number[])[];
    target: string;
    owners?: string[];
    crossings?: number[][];
};
export const planta = data as {
    offset: number[];
    bounds: Bounds;
    lots: Lot[];
    allLots: (Bounds & {
        name: string;
        face: string;
    })[];
    roads: {
        id: string;
        a: number[];
        b: number[];
        width: number;
        walk: number;
        portal?: boolean;
    }[];
    walks: Walk[];
    vehiclePaths: Record<string, number[][]>;
    portals: {
        id: string;
        x: number;
        z: number;
        fadeFrom: number;
    }[];
};
export const MAPA_COMPACTO_GERAL = true;
export const OFFSET = { x: 30, z: 10 };
export function ponto(p: readonly number[]) { return p.length === 3 ? { x: p[0] + 30, y: p[1], z: p[2] + 10 } : { x: p[0] + 30, y: .19, z: p[1] + 10 }; }
export function caixa(name: string): Bounds | undefined { const b = planta.allLots.find(b => b.name === name); return b ? { ...b, minX: b.minX + 30, maxX: b.maxX + 30, minZ: b.minZ + 10, maxZ: b.maxZ + 10 } : undefined; }
const aliases: Record<string, string> = { loja: 'Loja da torcida', chopp: 'Choperia', praca: 'Alimentação', hotel: 'Hotel', estacionamento: 'Estacionamento · 4 setores', shopping: 'Shopping e Vadico', vadico: 'Shopping e Vadico', 'agencia-clube': 'Agência', dsouza: 'dSouza', tidex: 'Tidex', oittolabs: 'OittoLabs', gecg: 'GECG', 'gecg-futebol': 'GECG', 'arena-online': 'Arena Legends', 'casa-usuario': 'Casa do presidente', 'casa-luca': 'Casa Luca', 'clube-lazer': 'Clube Recreio', balada: 'Balada', 'boteco-oswaldo': 'Boteco', 'bar-esquina': 'Boteco', feira: 'Feira', banca: 'Banca', campinho: 'Campo de terra', padaria: 'Padaria', 'praca-bairro': 'Praça do bairro', 'museu-clube': 'Museu', estacao: 'Metrô', metro: 'Metrô' };
export function boundsForView(view: string): Bounds | undefined { if (view === 'original' || view === 'region' || view === 'gestao-clube')
    return { minX: -258, maxX: 318, minZ: -213, maxZ: 259 }; if (view === 'estacao' || view === 'metro')
    return { minX: -109, maxX: 121, minZ: -115, maxZ: -77 }; if (view === 'onibus')
    return { minX: -85, maxX: 235, minZ: 134, maxZ: 173 }; if (view === 'vadico')
    return { minX: 187, maxX: 233, minZ: -192, maxZ: -134 }; return caixa(aliases[view] ?? ''); }
export function fadePortal(x: number) { return Math.max(0, Math.min(1, (288 - Math.abs(x - 30)) / 23)); }
type Audience = ReturnType<typeof publicoDoEstadio>;
export type PopulationInput = {
    journey?: JornadaComplexo;
    home?: Audience;
    away?: Audience;
    mobile: boolean;
    enabled: boolean;
    awayMatch?: boolean;
    night?: boolean;
    rain?: boolean;
};
/** A bounded visual sample of existing attendance. Never invents ticket counts or writes economy. */
export function populationPlan(input: PopulationInput) {
    const { journey, home, away, mobile } = input;
    const active = input.enabled && !!journey?.hosting && journey.phase !== 'idle' && !input.awayMatch;
    const phase = active ? journey!.phase : 'idle';
    const fanbase = Math.max(0, home?.supporters ?? 0), occupancy = Math.max(0, Math.min(1, (home?.attendance ?? 0) / 100));
    const strength = fanbase > 0 ? Math.min(1, Math.log1p(fanbase / 12000) / Math.log(16)) : 0;
    const weather = input.rain ? .65 : 1, night = input.night ? .6 : 1;
    const capacity = Math.max(0, home?.capacity ?? 0), demand = strength * (.35 + .65 * occupancy) * (capacity > 0 ? 1 : .15);
    const before = phase === 'arrival', after = phase === 'departure', during = phase === 'playing' || phase === 'interval';
    const residents = input.enabled ? Math.max(2, Math.round((mobile ? 5 : 12) * night * weather)) : 0;
    const fans = active ? Math.round((mobile ? 42 : 120) * demand * weather * (before || after ? 1 : during ? .12 : 0)) : 0;
    // Missing visiting club data remains unknown: no fictitious visiting fanbase.
    const awayDemand = away && away.supporters > 0 && away.capacity > 0 ? Math.min(.24, Math.log1p(away.supporters / 12000) / Math.log(16) * .24) : 0;
    const awayFans = Math.min(fans, Math.round(fans * awayDemand));
    return { phase, active, fanbase, capacity, occupancy, residents, homeFans: fans - awayFans, awayFans, walkers: active ? Math.min(mobile ? 6 : 10, Math.max(0, Math.ceil(fans * .16))) : 0, vendors: active ? (before ? mobile ? 3 : 5 : during ? 1 : after ? mobile ? 2 : 3 : 0) : 0, cars: input.enabled ? mobile ? 2 : 4 : 0, train: input.enabled, source: 'existing-career-attendance' as const };
}
/** Deterministic route sampler; geometry and actor positions use the same path coordinates. */
export function routeAt(points: readonly (readonly number[])[], distance: number, loop = true) {
    const ps = points.map(ponto), lengths = ps.slice(1).map((p, i) => Math.hypot(p.x - ps[i].x, p.y - ps[i].y, p.z - ps[i].z)), total = lengths.reduce((a, b) => a + b, 0);
    if (!total)
        return { ...(ps[0] ?? { x: 0, y: .19, z: 0 }), heading: 0, total: 0, done: true };
    let d = loop ? ((distance % total) + total) % total : Math.max(0, Math.min(total, distance));
    for (let i = 0; i < lengths.length; i++) {
        const len = lengths[i];
        if (d <= len || i === lengths.length - 1) {
            const a = ps[i], b = ps[i + 1], u = len ? Math.min(1, d / len) : 0;
            return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u, heading: Math.atan2(b.x - a.x, b.z - a.z), total, done: !loop && distance >= total };
        }
        d -= len;
    }
    return { ...ps[0], heading: 0, total, done: true };
}
