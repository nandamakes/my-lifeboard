import { useMemo, useState } from "react";
import * as stats from "simple-statistics";

export default function Insights({ tokens, days }) {
  const [range, setRange] = useState(30); // 7 or 30
  const sample = useMemo(() => days.slice(-range), [days, range]);

  // helper: next-day lookup map
  const byDate = useMemo(() => Object.fromEntries(sample.map(d => [d.date, d])), [sample]);
  const nextDay = (date) => {
    const t = new Date(date); t.setDate(t.getDate()+1);
    return t.toISOString().slice(0,10);
  };

  function mean(arr){ return arr.length ? stats.mean(arr) : NaN; }
  function deltaLabel(v, unit="+"){ return (v>=0?"+":"") + (Number.isFinite(v) ? v.toFixed(1) : "–") + (unit===""?"":` ${unit}`); }

  // Build insight cards
  const cards = useMemo(() => {
    const out = [];

    // 1) Sleep ≥ 7h → next-day spirals (lower is better)
    {
      const A=[], B=[];
      for (const d of sample) {
        const nd = byDate[nextDay(d.date)];
        if (!nd || d.sleepHours == null || nd.spiralCount == null) continue;
        (d.sleepHours >= 7 ? A : B).push(nd.spiralCount);
      }
      if (A.length>=8 && B.length>=8) {
        const dlt = mean(A) - mean(B); // negative good
        out.push({
          id: "sleep_spiral",
          title: "Sleep ≥ 7h → next-day spirals",
          body: `${dlt<0 ? "↓ fewer spirals" : "↑ more spirals"} versus <7h`,
          stat: deltaLabel(dlt, ""), n: A.length+B.length,
          good: dlt < 0,
          nudge: dlt<0 ? "Protect a 7h+ window tonight." : "Try a wind-down and lights-out earlier."
        });
      }
    }

    // 2) Animal time ≥ 30m → same-day mood
    {
      const A=[], B=[];
      for (const d of sample) {
        const moods = [d.moodAM, d.moodPM].filter(v=>v!=null);
        if (!moods.length || d.animalBand==null) continue;
        const mood = mean(moods);
        (d.animalBand>=30 ? A : B).push(mood);
      }
      if (A.length>=8 && B.length>=8) {
        const dlt = mean(A) - mean(B);
        out.push({
          id: "animal_mood",
          title: "≥30m with animals → mood",
          body: dlt>=0 ? "Happier on those days" : "Mood dips despite animal time",
          stat: deltaLabel(dlt), n: A.length+B.length,
          good: dlt > 0,
          nudge: dlt>0 ? "Block 30m animal time Tue/Thu." : "Try earlier in the day or after a walk."
        });
      }
    }

    // 3) NF day → next-day focus
    {
      const A=[], B=[];
      for (const d of sample) {
        const nd = byDate[nextDay(d.date)];
        if (!nd || nd.focus==null || d.nf==null) continue;
        (d.nf ? A : B).push(nd.focus);
      }
      if (A.length>=8 && B.length>=8) {
        const dlt = mean(A) - mean(B);
        out.push({
          id: "nf_focus",
          title: "NF day → next-day focus",
          body: dlt>=0 ? "Sharper tomorrow" : "No lift seen",
          stat: deltaLabel(dlt), n: A.length+B.length,
          good: dlt > 0,
          nudge: dlt>0 ? "Schedule NF on heavy-focus eve." : "Try NF earlier, or shorten the session."
        });
      }
    }

    // 4) Under-spend → same-day mood
    {
      const A=[], B=[];
      for (const d of sample) {
        const moods=[d.moodAM,d.moodPM].filter(v=>v!=null);
        if(!moods.length || !d.spendState) continue;
        const mood = mean(moods);
        (d.spendState==="Under" ? A : B).push(mood);
      }
      if (A.length>=8 && B.length>=8) {
        const dlt = mean(A) - mean(B);
        out.push({
          id: "spend_mood",
          title: "Under-spend day → mood",
          body: dlt>=0 ? "Feels cleaner, lighter" : "Tighter days don’t lift mood",
          stat: deltaLabel(dlt), n: A.length+B.length,
          good: dlt > 0,
          nudge: dlt>0 ? "Set a playful mini-treat inside budget." : "Allow a tiny guilt-free spend."
        });
      }
    }

    // 5) Steps band (≥7k) → same-day productivity
    {
      const A=[], B=[];
      for (const d of sample) {
        if (d.productivity==null || !d.stepsBand) continue;
        (d.stepsBand==="7-10k" || d.stepsBand==="10k+" ? A : B).push(d.productivity);
      }
      if (A.length>=8 && B.length>=8) {
        const dlt = mean(A) - mean(B);
        out.push({
          id: "steps_prod",
          title: "Steps ≥7k → productivity",
          body: dlt>=0 ? "Moves the needle" : "No clear lift",
          stat: deltaLabel(dlt), n: A.length+B.length,
          good: dlt > 0,
          nudge: dlt>0 ? "Walk call blocks before deep work." : "Try a shorter, earlier walk."
        });
      }
    }

    return out;
  }, [sample]);

  return (
    <div className="mt-5 space-y-4">
      {/* Controls */}
      <div className="rounded-2xl p-4 flex items-center gap-3"
           style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}` }}>
        <div className="text-sm" style={{ color: tokens.textSecondary }}>Generate insights for</div>
        <div className="flex gap-2">
          {[7,30].map(n=>(
            <button key={n}
              onClick={()=>setRange(n)}
              className="rounded-full px-3 py-1 text-sm border"
              style={{ borderColor: range===n?tokens.primaryDark:"#4B4343",
                       background: range===n?tokens.primaryDark:"transparent",
                       color: tokens.text }}>
              Last {n} days
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {cards.length === 0 ? (
        <div className="rounded-2xl p-4"
             style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, color: tokens.textSecondary }}>
          Not enough data yet — keep logging, love.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(c => (
            <div key={c.id} className="rounded-2xl p-4"
                 style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}` }}>
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold" style={{ color: tokens.text }}>{c.title}</div>
                <span className="text-xs rounded-full px-2 py-0.5"
                      style={{ background: c.good? tokens.primaryDark : tokens.warn, color: tokens.text }}>
                  n={c.n}
                </span>
              </div>
              <div className="mt-1 text-sm" style={{ color: tokens.textSecondary }}>{c.body}</div>
              <div className="mt-2 text-2xl font-bold" style={{ color: tokens.text }}>{c.stat}</div>
              <div className="mt-2 text-sm" style={{ color: tokens.textMuted }}>{c.nudge}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
