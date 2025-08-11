import { useMemo, useState } from "react";
import * as stats from "simple-statistics";

export default function Insights({ tokens, days }) {
  const [range, setRange] = useState(30);          // 7 or 30
  const [brief, setBrief] = useState("");          // generated weekly brief text
  const [copied, setCopied] = useState(false);

  const sample = useMemo(() => days.slice(-range), [days, range]);

  // helpers
  const byDate = useMemo(() => Object.fromEntries(sample.map(d => [d.date, d])), [sample]);
  const nextDay = (date) => { const t = new Date(date); t.setDate(t.getDate()+1); return t.toISOString().slice(0,10); };
  const mean = (arr)=> arr.length ? stats.mean(arr) : NaN;
  const fmt = (n, d=1)=> Number.isFinite(n) ? n.toFixed(d) : "–";

  // ---- Insight cards (same spirit as before, tightened) ----
  const cards = useMemo(() => {
    const out = [];

    // Sleep ≥ 7h → next-day spirals (lower is better)
    (function(){
      const A=[], B=[];
      for (const d of sample) {
        const nd = byDate[nextDay(d.date)];
        if (!nd || d.sleepHours == null || nd.spiralCount == null) continue;
        (d.sleepHours >= 7 ? A : B).push(nd.spiralCount);
      }
      if (A.length>=8 && B.length>=8) {
        const delta = mean(A) - mean(B); // negative good
        out.push({
          id:"sleep_spiral",
          title:"Sleep ≥7h → next-day spirals",
          stat: `${fmt(delta,1)}`,
          body: delta<0 ? "Fewer spirals after 7h+ nights" : "More spirals after 7h+ nights",
          n: A.length+B.length,
          good: delta<0,
          nudge: delta<0 ? "Protect a 7h+ window tonight." : "Try an earlier wind-down + lights out."
        });
      }
    })();

    // Animal ≥30m → same-day mood
    (function(){
      const A=[], B=[];
      for (const d of sample) {
        const moods = [d.moodAM, d.moodPM].filter(v=>v!=null);
        if (!moods.length || d.animalBand==null) continue;
        (d.animalBand>=30 ? A : B).push(mean(moods));
      }
      if (A.length>=8 && B.length>=8) {
        const delta = mean(A)-mean(B);
        out.push({
          id:"animal_mood",
          title:"≥30m with animals → mood",
          stat:`${delta>=0?"+":""}${fmt(delta)}`,
          body: delta>=0 ? "Happier on animal-time days" : "No lift from animal time (yet)",
          n:A.length+B.length,
          good: delta>0,
          nudge: delta>0 ? "Block 30m Tue/Thu." : "Try earlier in the day, pair with a walk."
        });
      }
    })();

    // NF → next-day focus
    (function(){
      const A=[], B=[];
      for (const d of sample) {
        const nd = byDate[nextDay(d.date)];
        if (!nd || nd.focus==null || d.nf==null) continue;
        (d.nf ? A : B).push(nd.focus);
      }
      if (A.length>=8 && B.length>=8) {
        const delta = mean(A)-mean(B);
        out.push({
          id:"nf_focus",
          title:"NF day → next-day focus",
          stat:`${delta>=0?"+":""}${fmt(delta)}`,
          body: delta>=0 ? "Sharper tomorrow after NF" : "No clear lift from NF",
          n:A.length+B.length,
          good: delta>0,
          nudge: delta>0 ? "Schedule NF before focus-heavy days." : "Try a shorter session or earlier timing."
        });
      }
    })();

    // Under-spend → same-day mood
    (function(){
      const A=[], B=[];
      for (const d of sample) {
        const moods=[d.moodAM,d.moodPM].filter(v=>v!=null);
        if (!moods.length || !d.spendState) continue;
        (d.spendState==="Under" ? A : B).push(mean(moods));
      }
      if (A.length>=8 && B.length>=8) {
        const delta = mean(A)-mean(B);
        out.push({
          id:"spend_mood",
          title:"Under-spend → mood",
          stat:`${delta>=0?"+":""}${fmt(delta)}`,
          body: delta>=0 ? "Cleaner, lighter days" : "Tight spend doesn't lift mood",
          n:A.length+B.length,
          good: delta>0,
          nudge: delta>0 ? "Add a playful mini-treat inside budget." : "Allow a tiny guilt-free spend."
        });
      }
    })();

    // Steps ≥7k → productivity
    (function(){
      const A=[], B=[];
      for (const d of sample) {
        if (d.productivity==null || !d.stepsBand) continue;
        (d.stepsBand==="7-10k" || d.stepsBand==="10k+" ? A : B).push(d.productivity);
      }
      if (A.length>=8 && B.length>=8) {
        const delta = mean(A)-mean(B);
        out.push({
          id:"steps_prod",
          title:"Steps ≥7k → productivity",
          stat:`${delta>=0?"+":""}${fmt(delta)}`,
          body: delta>=0 ? "Movement nudges output" : "No clear effect",
          n:A.length+B.length,
          good: delta>0,
          nudge: delta>0 ? "Walk-call before deep work." : "Try a shorter, earlier walk."
        });
      }
    })();

    return out;
  }, [sample]);

  // ---- Weekly brief generator (playful but kind) ----
  function generateBrief() {
    if (sample.length < 5) { setBrief("Not enough data yet — keep logging, love."); return; }

    const life = sample.map(d => {
      // simple life score re-calc (mirror your app’s weighting)
      const phys = (d.energyAM ?? 0 + d.energyPM ?? 0)/2 * 10;
      const mood = ([d.moodAM,d.moodPM].filter(v=>v!=null).reduce((a,b)=>a+b,0)/( [d.moodAM,d.moodPM].filter(v=>v!=null).length||1))*10;
      const work = (d.commitmentsMetPct ?? 0)*0.7 + (d.productivity??0)*10*0.3;
      const joy  = (d.playfulness??0)*10;
      const fin  = ({Under:100,On:75,Over:20}[d.spendState||"On"]*0.7) + ((d.cashClarity?100:0)*0.3);
      return Math.round(.25*scorePhys(d) + .30*scoreMent(d) + .20*work + .15*joy + .10*fin);

      function scorePhys(x){
        const energy = (([x.energyAM,x.energyPM].filter(v=>v!=null).reduce((a,b)=>a+b,0) / ([x.energyAM,x.energyPM].filter(v=>v!=null).length||1))*10)||0;
        const sleep  = x.sleepHours==null?0:Math.max(0,100-Math.min(100,Math.abs(x.sleepHours-7.5)*20));
        const steps  = ({"0-3k":20,"3-7k":60,"7-10k":85,"10k+":100}[x.stepsBand||"0-3k"]);
        const hr     = x.restingHr==null ? 0 : (95 - Math.min(20, Math.abs((x.restingHr-76))) );
        return Math.round(.4*sleep + .3*energy + .2*steps + .1*hr);
      }
      function scoreMent(x){
        const moodAvg = ([x.moodAM,x.moodPM].filter(v=>v!=null).reduce((a,b)=>a+b,0)/( [x.moodAM,x.moodPM].filter(v=>v!=null).length||1))*10 || 0;
        const focus   = (x.focus||0)*10;
        const pen = {0:0,1:.1,2:.2,3:.25}[x.spiralCount||0];
        let base = .5*moodAvg + .25*focus + .25*100;
        if (x.nf) base = Math.min(100, Math.round(base*1.05));
        return Math.round(base*(1-pen));
      }
    });

    // trend via regression slope (last N days)
    const xs = life.map((_,i)=>i);
    const slope = life.length>=3 ? stats.linearRegression(stats.linearRegressionLine(stats.linearRegression(xs.map((x,i)=>[x,life[i]])))) : 0;
    // above line is overkill; simpler:
    const lr = stats.linearRegression(xs.map((x,i)=>[x,life[i]]));
    const trend = lr && Number.isFinite(lr.m) ? lr.m : 0;

    const bestIdx = life.indexOf(Math.max(...life));
    const worstIdx= life.indexOf(Math.min(...life));
    const best = sample[bestIdx]?.date, worst = sample[worstIdx]?.date;

    const topNudges = cards.slice(0,3).map(c => (c.good ? `• ${c.title}: ${c.body}. ${c.nudge}` : `• ${c.title}: ${c.body}. ${c.nudge}`));

    const t = [
      `Weekly Brief (${range}d) —`,
      trend > 0 ? "up and to the right 📈" : trend < 0 ? "drifting a bit 📉" : "steady as she goes ➖",
      `• Peak day: ${best ?? "—"} • Tough day: ${worst ?? "—"}.`,
      topNudges.length ? "Nudges:\n" + topNudges.join("\n") : "No strong patterns yet — keep logging."
    ].join(" ");

    setBrief(t);
  }

  async function copyBrief(){
    try {
      await navigator.clipboard.writeText(brief || "Not enough data yet — keep logging, love.");
      setCopied(true); setTimeout(()=>setCopied(false), 1500);
    } catch {}
  }

  async function shareBrief(){
    const text = brief || "Not enough data yet — keep logging, love.";
    if (navigator.share) {
      try { await navigator.share({ text, title:"My Lifeboard – Weekly Brief" }); } catch {}
    } else {
      await copyBrief();
      alert("Copied to clipboard ✨");
    }
  }

  return (
    <div className="mt-5 space-y-4">
      {/* Controls */}
      <div className="rounded-2xl p-4 flex flex-wrap items-center gap-3"
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
        <div className="ml-auto flex gap-2">
          <button onClick={generateBrief}
            className="rounded-full px-3 py-1 text-sm border"
            style={{ borderColor: tokens.primaryDark, background: tokens.primaryDark, color: tokens.text }}>
            Generate brief
          </button>
          <button onClick={copyBrief}
            className="rounded-full px-3 py-1 text-sm border"
            style={{ borderColor: "#4B4343", color: tokens.text }}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button onClick={shareBrief}
            className="rounded-full px-3 py-1 text-sm border"
            style={{ borderColor: "#4B4343", color: tokens.text }}>
            Share
          </button>
        </div>
      </div>

      {/* Brief */}
      {brief && (
        <div className="rounded-2xl p-4 whitespace-pre-wrap"
             style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, color: tokens.text }}>
          {brief}
        </div>
      )}

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
