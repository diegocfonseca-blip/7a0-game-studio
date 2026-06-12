import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  SQUADS, FORMATIONS, FORMATION_COORDS, STYLE_MULT,
  type Formation, type Style, type Pos, type Squad, type Player,
} from "@/lib/seteAZero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "7 a 0 — Monte sua seleção dos sonhos" },
      { name: "description", content: "Role o dado, ganhe uma seleção e uma Copa do Mundo. Monte o XI ideal com jogadores reais e descubra se vence por 7 a 0." },
      { property: "og:title", content: "7 a 0 — Dream World Cup" },
      { property: "og:description", content: "Role o dado, monte seu XI com craques de verdade e simule um 7 a 0 histórico." },
    ],
  }),
  component: Game,
});

const FORMATION_LIST: Formation[] = ["4-3-3","4-4-2","4-2-3-1","3-5-2","5-3-2"];
const STYLE_LIST: Style[] = ["Defensivo","Equilibrado","Ofensivo"];

const POS_LABEL: Record<Pos,string> = {
  GK:"GOL", RB:"LD", CB:"ZAG", LB:"LE", DM:"VOL", CM:"MEI",
  AM:"MEIA", RW:"PD", LW:"PE", ST:"ATA",
};

interface Result {
  win: boolean;
  score: string;
  msg: string;
}

function Game() {
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [style, setStyle] = useState<Style>("Equilibrado");
  const [squad, setSquad] = useState<Squad | null>(null);
  const [picks, setPicks] = useState<(Player | null)[]>(Array(11).fill(null));
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const slots = FORMATIONS[formation];
  const coords = FORMATION_COORDS[formation];

  const filled = picks.filter(Boolean).length;

  function roll() {
    setRolling(true);
    setResult(null);
    setPicks(Array(11).fill(null));
    let n = 0;
    const t = setInterval(() => {
      setSquad(SQUADS[Math.floor(Math.random() * SQUADS.length)]);
      n++;
      if (n > 10) {
        clearInterval(t);
        setRolling(false);
      }
    }, 80);
  }

  function changeFormation(f: Formation) {
    setFormation(f);
    setPicks(Array(11).fill(null));
    setResult(null);
  }

  function pickPlayer(slotIdx: number, p: Player | null) {
    setPicks(prev => {
      const next = [...prev];
      // remove same player from other slots
      if (p) for (let i = 0; i < next.length; i++) if (next[i]?.name === p.name) next[i] = null;
      next[slotIdx] = p;
      return next;
    });
    setEditingSlot(null);
    setResult(null);
  }

  function simulate() {
    if (!squad || filled < 11) return;
    const mult = STYLE_MULT[style];
    let atk = 0, def = 0;
    picks.forEach((p, i) => {
      if (!p) return;
      const pos = slots[i];
      const inPos = p.pos.includes(pos);
      const base = p.rating - (inPos ? 0 : 6);
      if (["GK","RB","CB","LB","DM"].includes(pos)) def += base;
      else if (["CM"].includes(pos)) { def += base * 0.5; atk += base * 0.5; }
      else atk += base;
    });
    atk *= mult.atk;
    def *= mult.def;
    const total = atk + def;
    // opponent baseline ~ random 880..960
    const opp = 880 + Math.random() * 80;
    const diff = total - opp;
    const goalsFor = Math.max(0, Math.round(diff / 18 + Math.random() * 2));
    const goalsAgainst = Math.max(0, Math.round((opp - total) / 28 + Math.random() * 1.4));

    let msg = "";
    let win = false;
    let score = `${goalsFor} x ${goalsAgainst}`;
    if (goalsFor >= 7 && goalsAgainst === 0) {
      msg = "SETE A ZERO! Goleada histórica.";
      win = true;
      score = "7 x 0";
    } else if (goalsFor > goalsAgainst) {
      msg = "Vitória — mas não foi 7 a 0.";
    } else if (goalsFor === goalsAgainst) {
      msg = "Empate. Faltou capricho na finalização.";
    } else {
      msg = "Derrota. O adversário foi melhor.";
    }
    setResult({ win, score, msg });
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="font-display text-4xl font-bold tracking-tight">
              7<span className="text-accent">–</span>0
            </div>
            <div className="hidden border-l border-border pl-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Sete a Zero<br/>Dream World Cup
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {formation} · {style}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr_260px]">
        {/* Left: controls */}
        <aside className="space-y-6">
          <Panel title="Formação">
            <div className="grid grid-cols-3 gap-1.5">
              {FORMATION_LIST.map(f => (
                <button
                  key={f}
                  onClick={() => changeFormation(f)}
                  className={`rounded border px-2 py-1.5 text-xs font-medium transition ${
                    formation === f
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card hover:border-foreground/40"
                  }`}
                >{f}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Estilo">
            <div className="grid grid-cols-3 gap-1.5">
              {STYLE_LIST.map(s => (
                <button
                  key={s}
                  onClick={() => { setStyle(s); setResult(null); }}
                  className={`rounded border px-2 py-1.5 text-[11px] font-medium transition ${
                    style === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card hover:border-foreground/40"
                  }`}
                >{s}</button>
              ))}
            </div>
          </Panel>

          <Panel title="Sorteio">
            <div className="rounded border border-dashed border-border bg-card/50 p-4 text-center">
              {squad ? (
                <div className="space-y-1">
                  <div className="text-3xl">{squad.flag}</div>
                  <div className="font-display text-xl font-semibold">{squad.team}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Copa de {squad.cup}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Role o dado para sortear uma seleção e uma Copa do Mundo.
                </div>
              )}
            </div>
            <button
              onClick={roll}
              disabled={rolling}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-3 font-display text-lg font-bold uppercase tracking-wider text-accent-foreground shadow-sm transition hover:bg-accent/90 disabled:opacity-60"
            >
              {rolling ? "Sorteando…" : "Rolar"} <span className="text-2xl">🎲</span>
            </button>
          </Panel>

          <button
            onClick={simulate}
            disabled={!squad || filled < 11}
            className="w-full rounded border border-foreground bg-foreground px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-background transition hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Simular ({filled}/11)
          </button>
        </aside>

        {/* Center: pitch */}
        <div className="relative">
          <Pitch>
            {slots.map((pos, i) => {
              const [x, y] = coords[i];
              const p = picks[i];
              const active = editingSlot === i;
              return (
                <button
                  key={i}
                  onClick={() => squad && setEditingSlot(active ? null : i)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                    squad ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 text-[10px] font-bold transition ${
                    p
                      ? "border-[color:var(--gold)] bg-card text-foreground shadow-lg"
                      : "border-dashed border-pitch-line bg-pitch/30 text-pitch-line"
                  } ${active ? "ring-4 ring-accent/60" : ""}`}>
                    {p ? (
                      <>
                        <span className="text-[9px] opacity-70">{POS_LABEL[pos]}</span>
                        <span className="line-clamp-1 px-1 text-[10px] leading-tight">
                          {lastName(p.name)}
                        </span>
                      </>
                    ) : (
                      <span>{POS_LABEL[pos]}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </Pitch>

          {editingSlot !== null && squad && (
            <PlayerPicker
              slotPos={slots[editingSlot]}
              squad={squad}
              picks={picks}
              onPick={(p) => pickPlayer(editingSlot, p)}
              onClose={() => setEditingSlot(null)}
            />
          )}
        </div>

        {/* Right: box score */}
        <aside className="space-y-4">
          <Panel title={`Boletim · ${filled}/11`}>
            <ol className="space-y-1 text-xs">
              {slots.map((pos, i) => {
                const p = picks[i];
                return (
                  <li key={i} className="flex items-center justify-between border-b border-border/60 py-1.5">
                    <span className="w-10 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {POS_LABEL[pos]}
                    </span>
                    <span className={`flex-1 px-2 ${p ? "" : "text-muted-foreground/60"}`}>
                      {p?.name ?? "—"}
                    </span>
                    {p && <span className="font-mono text-[10px] text-accent">{p.rating}</span>}
                  </li>
                );
              })}
            </ol>
          </Panel>

          {result && (
            <div className={`rounded border-2 p-4 text-center ${
              result.win ? "border-accent bg-accent/10" : "border-border bg-card"
            }`}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Resultado final
              </div>
              <div className="font-display text-5xl font-bold my-2">{result.score}</div>
              <div className="text-xs">{result.msg}</div>
            </div>
          )}
        </aside>
      </section>

      <footer className="border-t border-border py-6 text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        7 a 0 · monte · simule · 7–0 · inspirado em 7a0.com.br
      </footer>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-md border-2 border-foreground/80 shadow-xl"
      style={{
        backgroundColor: "var(--pitch)",
        backgroundImage:
          "repeating-linear-gradient(0deg, var(--pitch) 0 9%, var(--pitch-stripe) 9% 18%)",
      }}
    >
      {/* lines */}
      <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <g fill="none" stroke="var(--pitch-line)" strokeWidth="0.4">
          <rect x="2" y="2" width="96" height="129" />
          <line x1="2" y1="66.5" x2="98" y2="66.5" />
          <circle cx="50" cy="66.5" r="9" />
          <circle cx="50" cy="66.5" r="0.6" fill="var(--pitch-line)" />
          {/* top box */}
          <rect x="22" y="2" width="56" height="14" />
          <rect x="36" y="2" width="28" height="5" />
          {/* bottom box */}
          <rect x="22" y="117" width="56" height="14" />
          <rect x="36" y="126" width="28" height="5" />
        </g>
      </svg>
      {children}
    </div>
  );
}

function PlayerPicker({
  slotPos, squad, picks, onPick, onClose,
}: {
  slotPos: Pos; squad: Squad; picks: (Player | null)[];
  onPick: (p: Player | null) => void; onClose: () => void;
}) {
  const used = new Set(picks.filter(Boolean).map(p => p!.name));
  const sorted = useMemo(() => {
    return [...squad.players].sort((a, b) => {
      const ai = a.pos.includes(slotPos) ? 0 : 1;
      const bi = b.pos.includes(slotPos) ? 0 : 1;
      if (ai !== bi) return ai - bi;
      return b.rating - a.rating;
    });
  }, [squad, slotPos]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="font-display text-sm font-semibold">
            Escolher {POS_LABEL[slotPos]}
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <ul className="max-h-80 overflow-auto">
          {sorted.map(p => {
            const inPos = p.pos.includes(slotPos);
            const taken = used.has(p.name);
            return (
              <li key={p.name}>
                <button
                  onClick={() => onPick(p)}
                  className={`flex w-full items-center justify-between border-b border-border/60 px-4 py-2 text-left text-sm transition hover:bg-secondary ${
                    taken ? "opacity-40" : ""
                  }`}
                >
                  <span>
                    <span className="font-medium">{p.name}</span>
                    {!inPos && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.pos.join("/")}
                    </span>}
                  </span>
                  <span className={`font-mono text-xs ${inPos ? "text-accent" : "text-muted-foreground"}`}>
                    {p.rating}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function lastName(full: string) {
  const parts = full.split(" ");
  return parts[parts.length - 1];
}
