import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import * as stats from "simple-statistics";
import Wins from "./components/Wins.jsx";
import Insights from "./components/Insights.jsx";
import BottomNav from "./components/BottomNav.jsx";
import WinSheet from "./components/WinSheet.jsx";

/** ========= SUPABASE CLIENT ========= */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

/** ========= THEME TOKENS ========= */
const tokens = {
  primary: "#E5989B", primaryDark: "#B56576", primaryLight: "#FFDDE2",
  bg: "#1E1B1B", surface: "#292424", surfaceAlt: "#352E2E", divider: "#4B4343",
  text: "#F6F0F0", textSecondary: "#D8CFCF", textMuted: "#A08F8F",
  warn: "#F4A261", danger: "#E76F51",
};

/** ========= DEMO SEED ========= */
const seed = [
  { date:"2025-08-04", sleepHours:7.8, restingHr:75, stepsBand:"10k+", energyAM:7, energyPM:7, moodAM:7, moodPM:8, focus:7, spiralCount:0, nf:true,  commitmentsMetPct:90, winsCount:2, productivity:7, animalBand:30, creativity:true,  playfulness:7, spendState:"On",    cashClarity:true  },
  { date:"2025-08-05", sleepHours:6.2, restingHr:78, stepsBand:"7-10k", energyAM:6, energyPM:6, moodAM:6, moodPM:7, focus:6, spiralCount:0, nf:false, commitmentsMetPct:80, winsCount:1, productivity:6, animalBand:15, creativity:false, playfulness:6, spendState:"Under", cashClarity:true  },
  { date:"2025-08-06", sleepHours:7.1, restingHr:76, stepsBand:"3-7k",  energyAM:6, energyPM:7, moodAM:7, moodPM:7, focus:6, spiralCount:1, nf:true,  commitmentsMetPct:70, winsCount:1, productivity:6, animalBand:60, creativity:true,  playfulness:7, spendState:"On",    cashClarity:true  },
  { date:"2025-08-07", sleepHours:5.9, restingHr:81, stepsBand:"7-10k", energyAM:5, energyPM:6, moodAM:5, moodPM:6, focus:5, spiralCount:1, nf:false, commitmentsMetPct:60, winsCount:0, productivity:5, animalBand:5,  creativity:false, playfulness:5, spendState:"Over",  cashClarity:false },
  { date:"2025-08-08", sleepHours:7.4, restingHr:74, stepsBand:"10k+", energyAM:7, energyPM:7, moodAM:7, moodPM:8, focus:7, spiralCount:0, nf:true,  commitmentsMetPct:85, winsCount:3, productivity:7, animalBand:60, creativity:true,  playfulness:8, spendState:"Under", cashClarity:true  },
  { date:"2025-08-09", sleepHours:6.6, restingHr:77, stepsBand:"3-7k",  energyAM:6, energyPM:6, moodAM:6, moodPM:6, focus:6, spiralCount:0, nf:false, commitmentsMetPct:75, winsCount:1, productivity:6, animalBand:15, creativity:false, playfulness:6, spendState:"On",    cashClarity:true  },
  { date:"2025-08-10", sleepHours:7.0, restingHr:76, stepsBand:"7-10k", energyAM:7, energyPM:7, moodAM:7, moodPM:7, focus:7, spiralCount:0, nf:true,  commitmentsMetPct:80, winsCount:2, productivity:7, animalBand:30, creativity:true,  playfulness:7, spendState:"On",    cashClarity:true  },
];

/** ========= SCORING ========= */
const HR_BASELINE = 76, SLEEP_TARGET = 7.5;
const mapSteps     = (b)=>({ "0-3k":20,"3-7k":60,"7-10k":85,"10k+":100 }[b||"0-3k"]);
const sleepScore   = (h)=> h==null?0:Math.max(0,100-Math.min(100,Math.abs(h-SLEEP_TARGET)*20));
const hrScore      = (hr)=>{ if(hr==null) return 0; const d=hr-HR_BASELINE;
  if(d>=-5&&d<=5)return 95-Math.abs(d); if(d>5)return Math.max(0,90-Math.min(15,d-5)*9);
  return Math.min(90,90-Math.min(15,-d-5)*.5); };
const boolScore    = (b)=> b?100:0;
const animalScore  = (m)=>({0:0,5:40,15:70,30:90,60:100}[m||0]);

function scorePhysical(d){ const e=[d.energyAM,d.energyPM].filter(v=>v!=null);
  const energy=(e.length?(e.reduce((a,b)=>a+b,0)/e.length):0)*10;
  return Math.round(.4*sleepScore(d.sleepHours)+.3*energy+.2*mapSteps(d.stepsBand)+.1*hrScore(d.restingHr)); }
function scoreMental(d){ const m=[d.moodAM,d.moodPM].filter(v=>v!=null);
  const mood=(m.length?(m.reduce((a,b)=>a+b,0)/m.length):0)*10; const focus=(d.focus||0)*10;
  const base=.5*mood+.25*focus+.25*100; const pen={0:0,1:.1,2:.2,3:.25}[d.spiralCount||0];
  let out=Math.round(base*(1-pen)); if(d.nf) out=Math.min(100,Math.round(out*1.05)); return out; }
function scoreWork(d){ return Math.round(.7*(d.commitmentsMetPct||0)+.3*((d.productivity||0)*10)); }
function scoreJoy(d){ return Math.round(.6*animalScore(d.animalBand)+.2*boolScore(d.creativity)+.2*((d.playfulness||0)*10)); }
function scoreFinancial(d){ const spend=({Under:100,On:75,Over:20})[d.spendState||"On"]; return Math.round(.7*spend+.3*boolScore(d.cashClarity)); }
function scoreLife(d){ const phys=scorePhysical(d), ment=scoreMental(d), work=scoreWork(d), joy=scoreJoy(d), fin=scoreFinancial(d);
  const life=Math.round(.25*phys+.30*ment+.20*work+.15*joy+.10*fin); return {phys,ment,work,joy,fin,life}; }

/** ========= UI PRIMITIVES ========= */
function Spark({values}){ const max=Math.max(...values,1), min=Math.min(...values,0), range=Math.max(1,max-min);
  const pts=values.map((v,i)=>`${(i/(values.length-1))*100},${100-((v-min)/range)*100}`).join(" ");
  return (<svg viewBox="0 0 100 100" style={{width:"100%",height:"24px",display:"block"}}>
    <polyline fill="none" stroke={tokens.primaryLight} strokeWidth="6" points={pts} strokeLinejoin="round" strokeLinecap="round"/></svg>);
}
function Tile({title,value,subtext,series}){ const status=value>=75?tokens.primary:value>=55?tokens.warn:tokens.danger;
  return (<div className="rounded-2xl p-4 shadow-md" style={{background:tokens.surface,border:`1px solid ${tokens.primaryDark}`}}>
    <div className="flex items-center justify-between"><div className="text-sm" style={{color:tokens.textSecondary}}>{title}</div>
      <div className="text-xl font-semibold" style={{color:tokens.text}}>{value}</div></div>
    <div className="mt-1 text-xs" style={{color:tokens.textMuted}}>{subtext}</div>
    <div className="mt-2"><Spark values={series}/></div>
    <div className="mt-2 h-1.5 w-full rounded-full" style={{background:tokens.primaryLight}}>
      <div className="h-1.5 rounded-full" style={{width:`${value}%`,background:status}}/></div></div>);
}
const Field=({label,children})=>(<label className="flex flex-col gap-1"><span className="text-sm" style={{color:tokens.textSecondary}}>{label}</span>{children}</label>);
const NumberInput=(p)=>(<input {...p} type="number" step="0.1" className="rounded-lg px-3 py-2 bg-transparent border" style={{borderColor:tokens.divider,color:tokens.text}}/>);
const Slider=({min=0,max=10,step=1,value,onChange})=>(<input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-full" />);
const Select=({value,onChange,options})=>(
  <select value={value} onChange={onChange} className="rounded-lg px-3 py-2 bg-transparent border" style={{borderColor:tokens.divider,color:tokens.text}}>
    {options.map(o=><option key={o} value={o} style={{color:"black"}}>{o}</option>)}
  </select>
);
const YesNo=({value,onChange})=>(<Select value={value?"Yes":"No"} onChange={e=>onChange(e.target.value==="Yes")} options={["No","Yes"]}/>);
const Textarea = (p) => (
  <textarea {...p} rows={3}
    className="rounded-lg px-3 py-2 bg-transparent border w-full"
    style={{ borderColor: tokens.divider, color: tokens.text }}
  />
);

/** ========= SHEET (mobile scrollable) ========= */
function Sheet({ title, children, onClose, onSave }) {
  const [el, setEl] = useState(null);
  useEffect(()=>{ if(el) el.scrollTop = 0; },[el]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background:"rgba(0,0,0,0.5)", touchAction:"pan-y" }}>
      <div className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl" style={{ background: tokens.surfaceAlt, color: tokens.text }}>
        <div className="p-5 border-b" style={{ borderColor: tokens.divider }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-sm" style={{ color: tokens.textSecondary }}>Close</button>
          </div>
        </div>
        <div ref={setEl} className="px-5" style={{ maxHeight:"80dvh", overflowY:"auto", WebkitOverflowScrolling:"touch", overscrollBehavior:"contain" }}>
          <div className="py-4 space-y-3">{children}</div>
        </div>
        <div className="p-5 flex justify-end gap-2 border-t" style={{ borderColor: tokens.divider }}>
          <button onClick={onClose} className="rounded-xl px-4 py-2 border" style={{ borderColor: tokens.divider, color: tokens.textSecondary }}>Cancel</button>
          <button onClick={onSave} className="rounded-xl px-4 py-2" style={{ background: tokens.primaryDark, color: tokens.text }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/** ========= SERVER HELPERS ========= */
async function signInMagic(email){ const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: window.location.origin } }); if(error) throw error; }
async function upsertEntryServer(date, period, data){
  const { data: u } = await supabase.auth.getUser(); if(!u?.user) throw new Error("Not signed in");
  const row={ user_id:u.user.id, date, period, data, updated_at:new Date().toISOString() };
  const { error } = await supabase.from("entries").upsert(row, { onConflict:"user_id,date,period" }); if(error) throw error;
}
async function fetchEntriesLast30Server(){
  const since=new Date(Date.now()-29*24*3600*1000); const start=`${since.getFullYear()}-${String(since.getMonth()+1).padStart(2,"0")}-${String(since.getDate()).padStart(2,"0")}`;
  const { data, error } = await supabase.from("entries").select("date,period,data").gte("date",start).order("date",{ascending:true});
  if(error) throw error; return data||[];
}
async function addWinServer(text, tag){
  const { data: u } = await supabase.auth.getUser(); if(!u?.user) throw new Error("Not signed in");
  const { error } = await supabase.from("wins").insert({ user_id:u.user.id, text, tag: tag??null }); if(error) throw error;
}
async function fetchWinsNDays(days = 30) {
  const since = new Date(Date.now() - (days - 1) * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("wins")
    .select("id, ts, text, tag")
    .gte("ts", since)
    .order("ts", { ascending: false });
  if (error) throw error;
  return data;
}

async function addWin(text, tag) {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) throw new Error("Not signed in");
  const { error } = await supabase.from("wins").insert({ user_id: u.user.id, text, tag });
  if (error) throw error;
}

async function deleteWin(id) {
  const { error } = await supabase.from("wins").delete().eq("id", id);
  if (error) throw error;
}

/** ========= CORRELATIONS (last 30d) ========= */
function computeCorrelations(days){
  // guard: need at least 8 samples per condition
  const chips = [];
  const last30 = days.slice(-30);

  // helpers
  const dayMap = Object.fromEntries(last30.map(d=>[d.date,d]));
  const nextDay = (date) => {
    const t = new Date(date); t.setDate(t.getDate()+1);
    return t.toISOString().slice(0,10);
  };

  // 1) Sleep >= 7h → next-day spirals (lower is better)
  {
    const A=[], B=[]; // A: sleep>=7, B: sleep<7
    for(const d of last30){
      const nd = dayMap[nextDay(d.date)];
      if(!nd || d.sleepHours == null || nd.spiralCount == null) continue;
      (d.sleepHours >= 7 ? A : B).push(nd.spiralCount);
    }
    if(A.length>=8 && B.length>=8){
      const dlt = stats.mean(A) - stats.mean(B); // negative good
      chips.push({ id:"sleep_spiral", label:`Sleep ≥7h → next-day spirals ${(dlt).toFixed(2)}`, n: A.length+B.length, positive: dlt<0 });
    }
  }

  // 2) Animal ≥30 → same-day mood Δ
  {
    const A=[], B=[];
    for(const d of last30){
      const moods = [d.moodAM, d.moodPM].filter(v=>v!=null);
      if(!moods.length || d.animalBand==null) continue;
      const mood = stats.mean(moods);
      (d.animalBand>=30 ? A : B).push(mood);
    }
    if(A.length>=8 && B.length>=8){
      const dlt = stats.mean(A) - stats.mean(B);
      chips.push({ id:"animal_mood", label:`≥30m animals → mood +${dlt.toFixed(1)}`, n:A.length+B.length, positive: dlt>0 });
    }
  }

  // 3) NF day → next-day focus Δ
  {
    const A=[], B=[];
    for(const d of last30){
      const nd = dayMap[nextDay(d.date)];
      if(!nd || nd.focus==null || d.nf==null) continue;
      (d.nf ? A : B).push(nd.focus);
    }
    if(A.length>=8 && B.length>=8){
      const dlt = stats.mean(A) - stats.mean(B);
      chips.push({ id:"nf_focus", label:`NF day → next-day focus +${dlt.toFixed(1)}`, n:A.length+B.length, positive: dlt>0 });
    }
  }

  // 4) Under-spend → same-day mood Δ
  {
    const A=[], B=[];
    for(const d of last30){
      const moods=[d.moodAM,d.moodPM].filter(v=>v!=null);
      if(!moods.length || !d.spendState) continue;
      const mood = stats.mean(moods);
      (d.spendState==="Under" ? A : B).push(mood);
    }
    if(A.length>=8 && B.length>=8){
      const dlt = stats.mean(A) - stats.mean(B);
      chips.push({ id:"spend_mood", label:`Under-spend → mood +${dlt.toFixed(1)}`, n:A.length+B.length, positive: dlt>0 });
    }
  }

  return chips;
}

/** ========= MAIN ========= */
export default function App(){
  
  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const action = params.get('action')
  if (action === 'am') setShowAM(true)
  if (action === 'pm') setShowPM(true)
  if (action === 'win') setShowWin(true)
  if (action) history.replaceState({}, '', window.location.pathname)
  }, [])

  const [session,setSession]=useState(null);
  const [email,setEmail]=useState(""); const [status,setStatus]=useState("");
  const [tab,setTab]=useState("today"); // "today" | "trends"
  useEffect(()=>{ window.scrollTo({ top: 0, behavior: "smooth" }); }, [tab]);
  
  useEffect(()=>{ supabase.auth.getSession().then(({data:{session}})=>setSession(session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=> sub.subscription.unsubscribe();
  },[]);

  const [days,setDays]=useState(seed);
  useEffect(()=>{ (async()=>{
    if(!session?.user) return;
    const rows = await fetchEntriesLast30Server().catch(()=>[]);
    if(rows.length){
      const byDate={};
      for(const r of rows){ byDate[r.date] ||= { date:r.date };
        Object.assign(byDate[r.date],
          r.period==="AM" ? { energyAM:r.data.energyAM, moodAM:r.data.moodAM, sleepHours:r.data.sleepHours, restingHr:r.data.restingHr }
                          : { moodPM:r.data.moodPM, focus:r.data.focus, spiralCount:r.data.spiralCount, nf:r.data.nf, nfProtocol:r.data.nfProtocol,
                              commitmentsMetPct:r.data.commitmentsMetPct, winsCount:r.data.winsCount, productivity:r.data.productivity,
                              animalBand:r.data.animalBand, creativity:r.data.creativity, playfulness:r.data.playfulness,
                              stepsBand:r.data.stepsBand, spendState:r.data.spendState, cashClarity:r.data.cashClarity });
      }
      const merged=Object.values(byDate).sort((a,b)=>a.date.localeCompare(b.date));
      setDays(prev=>{
        const existing=new Set(prev.map(d=>d.date));
        const insert=merged.filter(d=>!existing.has(d.date));
        return [...prev, ...insert].sort((a,b)=>a.date.localeCompare(b.date));
      });
    }
  })(); },[session]);

  // Scoring prep
  const last30 = days.slice(-30);
  const series30 = last30.map(d=>({ d, s: scoreLife(d) }));
  const last7 = days.slice(-7);
  const series7 = last7.map(d=>({ d, s: scoreLife(d) }));
  const today = series7[series7.length-1] || { d: days[days.length-1], s: scoreLife(days[days.length-1]||{}) };
  const lifeScore = today.s.life || 0;
  const micro = useMemo(()=> lifeScore>=85 ? "Crisp execution, soft heart. Keep the cadence, love."
                     : lifeScore>=70 ? "Clean lines, good taste. Watch that HR creep."
                     : lifeScore>=55 ? "Okay vibes. Tiny tweaks beat big swings."
                     : "Stormy but steerable. One kind habit, then rest.", [lifeScore]);

  // AM/PM sheets (same as before)
  const [showAM,setShowAM]=useState(false), [showPM,setShowPM]=useState(false), [showWin, setShowWin] = useState(false);
  const draftAMInit = ()=>({ energyAM: today.d?.energyAM ?? 5, moodAM: today.d?.moodAM ?? 5, sleepHours: today.d?.sleepHours ?? 7.0, restingHr: today.d?.restingHr ?? HR_BASELINE });
  const draftPMInit = ()=>({ moodPM: today.d?.moodPM ?? 5, focus: today.d?.focus ?? 5, spiralCount: today.d?.spiralCount ?? 0, nf: !!today.d?.nf, nfProtocol: today.d?.nfProtocol || "",
                             commitmentsMetPct: today.d?.commitmentsMetPct ?? 0, winsCount: today.d?.winsCount ?? 0, productivity: today.d?.productivity ?? 5,
                             animalBand: today.d?.animalBand ?? 0, creativity: !!today.d?.creativity, playfulness: today.d?.playfulness ?? 5,
                             stepsBand: today.d?.stepsBand || "3-7k", spendState: today.d?.spendState || "On", cashClarity: !!today.d?.cashClarity });
  const [draftAM,setDraftAM]=useState(draftAMInit()); const [draftPM,setDraftPM]=useState(draftPMInit());
  function upsertTodayLocal(patch){ const date=today.d.date; setDays(prev=>prev.map(d=>d.date===date?{...d,...patch}:d)); }

  // Auth gate
  if(!session){
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: tokens.bg, color: tokens.text }}>
        <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: tokens.surface }}>
          <h2 className="text-xl font-semibold mb-2">Sign in to My Lifeboard</h2>
          <p className="text-sm mb-4" style={{ color: tokens.textSecondary }}>Magic link to your email. No passwords.</p>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full rounded-lg px-3 py-2 mb-3 bg-transparent border" style={{borderColor:tokens.divider,color:tokens.text}}/>
          <button onClick={async()=>{ try{ setStatus("Sending…"); await signInMagic(email); setStatus("Check your email ✉️"); } catch(e){ setStatus(e.message); } }}
            className="w-full rounded-xl px-4 py-2" style={{ background: tokens.primaryDark, color: tokens.text }}>Send magic link</button>
          <div className="mt-3 text-xs" style={{ color: tokens.textSecondary }}>{status}</div>
        </div>
      </div>
    );
  }

  // Shared bits
  const physSeries7 = series7.map(x=>x.s.phys), mentSeries7 = series7.map(x=>x.s.ment),
        workSeries7 = series7.map(x=>x.s.work), joySeries7  = series7.map(x=>x.s.joy), finSeries7 = series7.map(x=>x.s.fin);

  const todaySub = {
    physical: `Sleep ${today.d?.sleepHours ?? "-"}h • HR ${today.d?.restingHr ?? "-"}`,
    mental:   `Mood ${(today.d?.moodAM ?? "-")}/${(today.d?.moodPM ?? "-")} • Focus ${today.d?.focus ?? "-"} • Spirals ${today.d?.spiralCount ?? 0}`,
    work:     `Commitments ${today.d?.commitmentsMetPct ?? 0}% • Wins ${today.d?.winsCount ?? 0}`,
    joy:      `Animals ${today.d?.animalBand ?? 0}m • Play ${today.d?.playfulness ?? 0}`,
    financial:`${today.d?.spendState ?? "On"} budget • Clarity ${today.d?.cashClarity ? "✓" : "–"}`,
  };

  // ======= Charts config (Trends) =======
  const labels30 = series30.map(x=>x.d.date.slice(5)); // MM-DD
  const ds = (label, data, color) => ({
    label, data, tension: .35, borderColor: color, backgroundColor: tokens.primaryLight + "55", fill: false, pointRadius: 0, borderWidth: 2,
  });
  const trendsData = {
    life: { labels: labels30, datasets: [ ds("Life", series30.map(x=>x.s.life), tokens.primary) ] },
    phys: { labels: labels30, datasets: [ ds("Physical", series30.map(x=>x.s.phys), "#E5989B") ] },
    ment: { labels: labels30, datasets: [ ds("Mental",   series30.map(x=>x.s.ment), "#F4A261") ] },
    work: { labels: labels30, datasets: [ ds("Work",     series30.map(x=>x.s.work), "#B56576") ] },
    joy:  { labels: labels30, datasets: [ ds("Joy",      series30.map(x=>x.s.joy),  "#FFB4A2") ] },
    fin:  { labels: labels30, datasets: [ ds("Financial",series30.map(x=>x.s.fin),  "#E76F51") ] },
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins:{ legend:{ display:false }, tooltip:{ mode:"index", intersect:false } },
    scales:{ x:{ grid:{ color:"#3a3333" }, ticks:{ color:tokens.textMuted } }, y:{ min:0, max:100, grid:{ color:"#3a3333" }, ticks:{ color:tokens.textMuted } } }
  };

  // ======= Correlations =======
  const chips = computeCorrelations(days);

  return (
    <div
    className="min-h-screen w-full p-4 sm:p-6 lg:p-8 md:pb-8"
    style={{
      background: tokens.bg,
      color: tokens.text,
      fontFamily: "ui-sans-serif, system-ui",
      paddingBottom: "calc(var(--bottom-nav-h, 96px) + 8px)" // key line
    }}
    >

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-2xl sm:text-3xl font-semibold">My Lifeboard</div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="rounded-full px-4 py-1.5 text-sm sm:text-base shadow" style={{ background: tokens.primaryDark, color: tokens.text }}>
            Life Score <span className="font-bold">{lifeScore}</span> ★
          </div>
          <button onClick={()=>supabase.auth.signOut()} className="rounded-full px-3 py-1 text-sm border" style={{ borderColor: tokens.primaryDark, color: tokens.textSecondary }}>Sign out</button>
        </div>
      </div>

      {/* Tabs */}
     <div className="mt-4 hidden md:flex gap-2">
        {["today","trends","wins","insights"].map(t => (
         <button 
            key={t} 
            onClick={() => setTab(t)}
            className="rounded-full px-4 py-1.5 text-sm border"
            style={{ 
              borderColor: tab === t ? tokens.primaryDark : tokens.divider, 
              background: tab === t ? tokens.primaryDark : "transparent", 
              color: tokens.text 
            }}
          >
            {t === "today" 
              ? "Today" 
              : t === "trends" 
              ? "Trends" 
              : t === "insights" 
              ? "Insights" 
              : "Wins"}
          </button>
        ))}
      </div>

{/* --- VIEWS --- */}
{tab === "today" ? (
  <>
    <div className="mt-1 text-sm" style={{ color: tokens.textSecondary }}>{micro}</div>
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Tile title="Physical"  value={today.s.phys} subtext={todaySub.physical}  series={physSeries7} />
      <Tile title="Mental"    value={today.s.ment} subtext={todaySub.mental}    series={mentSeries7} />
      <Tile title="Work"      value={today.s.work} subtext={todaySub.work}      series={workSeries7} />
      <Tile title="Joy"       value={today.s.joy}  subtext={todaySub.joy}       series={joySeries7} />
      <Tile title="Financial" value={today.s.fin}  subtext={todaySub.financial} series={finSeries7} />
    </div>

    {/* Actions bar */}
    <div className="sticky bottom-3 mt-6 flex gap-3 flex-wrap md:pr-28">
      <button
        onClick={()=>{ setDraftAM(draftAMInit()); setShowAM(true); }}
        className="rounded-xl px-4 py-2 text-sm shadow active:scale-95"
        style={{ background: tokens.primaryDark, color: tokens.text }}
      >
        AM LOG
      </button>

      <button
        onClick={()=>{ setDraftPM(draftPMInit()); setShowPM(true); }}
        className="rounded-xl px-4 py-2 text-sm shadow active:scale-95"
        style={{ background: tokens.primaryDark, color: tokens.text }}
      >
        PM LOG
      </button>

      <button
        onClick={()=> setShowWin(true)}
        className="rounded-xl px-4 py-2 text-sm shadow active:scale-95"
        style={{ background: tokens.primaryDark, color: tokens.text }}
      >
        + WIN
      </button>
    </div>

    {/* AM & PM & WIN Sheets */}
    {showAM && (
      <Sheet title="AM Check-in" onClose={()=>setShowAM(false)} onSave={async()=>{
        const patch = { energyAM:draftAM.energyAM, moodAM:draftAM.moodAM, sleepHours:draftAM.sleepHours, restingHr:draftAM.restingHr };
        upsertTodayLocal(patch);
        try { await upsertEntryServer(today.d.date, "AM", patch); } catch(e){ console.error(e); }
        setShowAM(false);
      }}>
        <Field label={`Energy (${draftAM.energyAM})`}><Slider value={draftAM.energyAM} onChange={e=>setDraftAM({...draftAM,energyAM:+e.target.value})}/></Field>
        <Field label={`Mood (${draftAM.moodAM})`}><Slider value={draftAM.moodAM} onChange={e=>setDraftAM({...draftAM,moodAM:+e.target.value})}/></Field>
        <Field label="Sleep hours"><NumberInput value={draftAM.sleepHours} onChange={e=>setDraftAM({...draftAM,sleepHours:+e.target.value})}/></Field>
        <Field label="Resting HR"><NumberInput value={draftAM.restingHr} onChange={e=>setDraftAM({...draftAM,restingHr:+e.target.value})}/></Field>
      </Sheet>
    )}

    {showPM && (
      <Sheet title="PM Check-in" onClose={()=>setShowPM(false)} onSave={async()=>{
        const patch = { moodPM:draftPM.moodPM, focus:draftPM.focus, spiralCount:draftPM.spiralCount, nf:draftPM.nf, nfProtocol:draftPM.nfProtocol,
                        commitmentsMetPct:draftPM.commitmentsMetPct, winsCount:draftPM.winsCount, productivity:draftPM.productivity,
                        animalBand:draftPM.animalBand, creativity:draftPM.creativity, playfulness:draftPM.playfulness,
                        stepsBand:draftPM.stepsBand, spendState:draftPM.spendState, cashClarity:draftPM.cashClarity };
        upsertTodayLocal(patch);
        try { await upsertEntryServer(today.d.date, "PM", patch); } catch(e){ console.error(e); }
        setShowPM(false);
      }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={`Mood (${draftPM.moodPM})`}><Slider value={draftPM.moodPM} onChange={e=>setDraftPM({...draftPM,moodPM:+e.target.value})}/></Field>
          <Field label={`Focus (${draftPM.focus})`}><Slider value={draftPM.focus} onChange={e=>setDraftPM({...draftPM,focus:+e.target.value})}/></Field>
          <Field label="Spirals"><Select value={draftPM.spiralCount} onChange={e=>setDraftPM({...draftPM,spiralCount:+e.target.value})} options={[0,1,2,3]}/></Field>
          <Field label="NF today?"><YesNo value={draftPM.nf} onChange={v=>setDraftPM({...draftPM,nf:v})}/></Field>
          <Field label="NF protocol (optional)"><input value={draftPM.nfProtocol} onChange={e=>setDraftPM({...draftPM,nfProtocol:e.target.value})} className="rounded-lg px-3 py-2 bg-transparent border" style={{borderColor:tokens.divider,color:tokens.text}}/></Field>
          <Field label="Commitments met %"><NumberInput value={draftPM.commitmentsMetPct} onChange={e=>setDraftPM({...draftPM,commitmentsMetPct:+e.target.value})}/></Field>
          <Field label="Wins count"><NumberInput value={draftPM.winsCount} onChange={e=>setDraftPM({...draftPM,winsCount:+e.target.value})}/></Field>
          <Field label={`Productivity (${draftPM.productivity})`}><Slider value={draftPM.productivity} onChange={e=>setDraftPM({...draftPM,productivity:+e.target.value})}/></Field>
          <Field label="Animal time (min band)"><Select value={draftPM.animalBand} onChange={e=>setDraftPM({...draftPM,animalBand:+e.target.value})} options={[0,5,15,30,60]}/></Field>
          <Field label="Creativity"><YesNo value={draftPM.creativity} onChange={v=>setDraftPM({...draftPM,creativity:v})}/></Field>
          <Field label={`Playfulness (${draftPM.playfulness})`}><Slider value={draftPM.playfulness} onChange={e=>setDraftPM({...draftPM,playfulness:+e.target.value})}/></Field>
          <Field label="Steps band"><Select value={draftPM.stepsBand} onChange={e=>setDraftPM({...draftPM,stepsBand:e.target.value})} options={["0-3k","3-7k","7-10k","10k+"]}/></Field>
          <Field label="Spend vs plan"><Select value={draftPM.spendState} onChange={e=>setDraftPM({...draftPM,spendState:e.target.value})} options={["Under","On","Over"]}/></Field>
          <Field label="Cash clarity"><YesNo value={draftPM.cashClarity} onChange={v=>setDraftPM({...draftPM,cashClarity:v})}/></Field>
        </div>
      </Sheet>
    )}

    {showWin && (
      <WinSheet
        tokens={tokens}
        onClose={()=>setShowWin(false)}
        onSave={async (text, tag) => {
          if (!text) return;
          try {
            await addWinServer(text, tag);
            setShowWin(false);
            alert("Win saved ✨");
          } catch (e) {
            alert(e.message);
          }
        }}
      />
    )}

  </>
) : tab === "wins" ? (
  <Wins
    tokens={tokens}
    fetchWins={fetchWinsNDays}
    addWin={addWin}
    deleteWin={deleteWin}
  />
) : tab === "insights" ? (
  <Insights tokens={tokens} days={days} />
) : (
  /* ============ TRENDS VIEW ============ */
  <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-6">
    {/* Life */}
    <div className="rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, height: 260 }}>
      <div className="mb-2 text-sm" style={{ color: tokens.textSecondary }}>Life Score (last 30 days)</div>
      <Line data={trendsData.life} options={chartOpts} />
    </div>
    {/* Domains */}
    <div className="rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, height: 260 }}>
      <div className="mb-2 text-sm" style={{ color: tokens.textSecondary }}>Physical</div>
      <Line data={trendsData.phys} options={chartOpts} />
    </div>
    <div className="rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, height: 260 }}>
      <div className="mb-2 text-sm" style={{ color: tokens.textSecondary }}>Mental</div>
      <Line data={trendsData.ment} options={chartOpts} />
    </div>
    <div className="rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, height: 260 }}>
      <div className="mb-2 text-sm" style={{ color: tokens.textSecondary }}>Work</div>
      <Line data={trendsData.work} options={chartOpts} />
    </div>
    <div className="rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, height: 260 }}>
      <div className="mb-2 text-sm" style={{ color: tokens.textSecondary }}>Joy</div>
      <Line data={trendsData.joy} options={chartOpts} />
    </div>
    <div className="rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, height: 260 }}>
      <div className="mb-2 text-sm" style={{ color: tokens.textSecondary }}>Financial</div>
      <Line data={trendsData.fin} options={chartOpts} />
    </div>

    {/* Correlations */}
    <div className="xl:col-span-2 rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}` }}>
      <div className="mb-3 text-sm" style={{ color: tokens.textSecondary }}>Correlation highlights (last 30 days)</div>
      <div className="flex flex-wrap gap-2">
        {chips.length === 0 ? (
          <div className="text-sm" style={{ color: tokens.textMuted }}>Not enough data yet — keep logging, love.</div>
        ) : chips.map(c => (
          <span key={c.id} className="rounded-full px-3 py-1 text-xs"
            style={{ background: c.positive ? tokens.primaryDark : tokens.warn, color: tokens.text }}>
            {c.label} • n={c.n}
          </span>
        ))}
      </div>
    </div>
  </div>
    )}
    <BottomNav tab={tab} setTab={setTab} tokens={tokens} />
    </div>
  );
}
