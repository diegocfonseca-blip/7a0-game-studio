const clampLength = (x, z, radius) => {
  const length = Math.hypot(x, z), scale = length > radius ? radius / length : 1;
  return {x: x * scale, z: z * scale};
};
const stoppedPhases = new Set(['saida', 'gol', 'fim', 'lateral', 'escanteio', 'falta', 'penalti', 'tiro-de-meta']);
// Limit correction to the discrepancy introduced by presentation. Preserve the
// defender's approach side and leave a stand-off instead of copying target motion.
function approach(self, target, sourceTarget, standOff) {
  const discrepancy = Math.hypot(target.x - sourceTarget.mx, target.z - sourceTarget.mz);
  const x = target.x - self.x, z = target.z - self.z, distance = Math.hypot(x, z);
  if (distance < 1e-6 || discrepancy < .01) return {x: 0, z: 0};
  const step = Math.max(-discrepancy, Math.min(discrepancy, distance - standOff));
  return {x: x / distance * step, z: z / distance * step};
}
/** Read-only presentation compensation. Tactical roles, ball and events stay
 * authoritative. Contact protection and collision separation run in the caller. */
export function collectivePresentation(frame, world, previous, dt, {limit = .8} = {}) {
  const source = new Map(frame.players.map(p => [p.key, p]));
  const ball = frame.ball.presentation ?? frame.ball, owner = source.get(frame.owner);
  const ownerWorld = owner && world.get(owner.key);
  const controlled = ownerWorld && Math.hypot(ownerWorld.x - ball.x, ownerWorld.z - ball.z) < 1.3;
  const offsets = new Map(), diagnostics = {pressing: 0, marking: 0, support: 0, looseBallPressure: 0, maxOffset: 0};
  for (const p of frame.players) {
    let wanted = {x: 0, z: 0};
    const self = world.get(p.key) ?? {x: p.mx, z: p.mz};
    const near = owner && Math.hypot(p.mx - owner.mx, p.mz - owner.mz) < 16;
    if (!p.keeper && !stoppedPhases.has(frame.phase)) {
      if (p.tacticalRole === 'marca' && p.markingTarget) {
        const target = source.get(p.markingTarget), shown = world.get(p.markingTarget);
        if (target && shown && target.side !== p.side && Math.hypot(p.mx - target.mx, p.mz - target.mz) < 12) {
          wanted = approach(self, shown, target, 1.8);
          diagnostics.marking++;
        }
      } else if (p.tacticalRole === 'pressiona' && owner && owner.side !== p.side && near && !owner.keeper) {
        wanted = approach(self, controlled ? ownerWorld : ball, owner, 1.5);
        diagnostics.pressing++;
        if (!controlled) diagnostics.looseBallPressure++;
      } else if (['opcao', 'ultrapassa'].includes(p.tacticalRole) && controlled && owner.side === p.side && near) {
        wanted = {x: (ownerWorld.x - owner.mx) * .5, z: (ownerWorld.z - owner.mz) * .5};
        diagnostics.support++;
      }
    }
    const desired = clampLength(wanted.x, wanted.z, limit), old = previous.get(p.key) ?? {x: 0, z: 0};
    const blend = dt > 0 ? 1 - Math.exp(-dt / .25) : 1;
    const delta = clampLength((desired.x - old.x) * blend, (desired.z - old.z) * blend, Math.max(0, dt) * 2);
    const next = dt > 0 ? {x: old.x + delta.x, z: old.z + delta.z} : desired;
    offsets.set(p.key, next);
    diagnostics.maxOffset = Math.max(diagnostics.maxOffset, Math.hypot(next.x, next.z));
  }
  return {offsets, diagnostics};
}
