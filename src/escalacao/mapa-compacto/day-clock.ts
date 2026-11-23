import * as T from 'three';
import { stadiumDayClock, STADIUM_DAY, type StadiumDayFrame } from '../cidade3d/stadium-day.mjs';
import type { DadosDiaJogo, criarDiaDeJogo } from '../presidencia-dia-jogo';
/** Preserve the stadium/team presentation clock without constructing the retired city's actors. */
export function criarRelogioCompacto(scene: T.Scene) {
    const root = new T.Group();
    root.name = 'complexo-dia-jogo';
    scene.add(root);
    const clock = stadiumDayClock();
    let input: DadosDiaJogo | undefined, frame: StadiumDayFrame | undefined, time = 0, start = 0, key = '';
    const api = { root, configure(next: DadosDiaJogo, now: number) { input = next; if (key !== next.journey?.key) {
            key = next.journey?.key ?? '';
            start = now;
        } }, update(now: number) { time = now; frame = clock.update(input?.journey, now); }, day: () => frame, coachesAllowed: () => !!frame?.active && frame.phase === 'arrival' && frame.elapsed >= STADIUM_DAY.coaches, coachStart: () => start + STADIUM_DAY.coaches, onibusLiberadoEm: () => start + STADIUM_DAY.coaches + .5, key: () => key,
        inspect: () => ({ multidao: { quantos: 0, max: 0, desenhos: 0, triangulos: 0, visivel: false, pai: false }, active: !!frame?.active, key, requestedKey: input?.journey?.key, elapsed: time - start, stage: frame?.stage ?? 'idle', cycle: frame, coachesAllowed: !!frame?.active && frame.elapsed >= STADIUM_DAY.coaches, coachEarliest: STADIUM_DAY.coaches, fanLimit: 0, source: 'compact-day-clock; actors owned by compact population controller', fans: [], vendors: [], vans: {}, customers: [], flags: {}, streets: { flagPosts: [] }, routes: [] }), dispose() { root.removeFromParent(); } };
    // Same coordinator contract; detailed old-city inspector arrays are deliberately empty.
    return api as unknown as ReturnType<typeof criarDiaDeJogo>;
}
