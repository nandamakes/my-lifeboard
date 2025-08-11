import { useEffect, useMemo, useState } from "react";

export default function Wins({ tokens, fetchWins, addWin, deleteWin }) {
  const [range, setRange] = useState(30); // 7 | 30 | 90
  const [tag, setTag] = useState("All");  // All | Work | Joy | Health | Personal
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newText, setNewText] = useState("");
  const [newTag, setNewTag] = useState("Work");
  const tags = ["Work", "Joy", "Health", "Personal"];

  async function load() {
    setLoading(true);
    try {
      const data = await fetchWins(range);
      setWins(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [range]);

  const filtered = useMemo(() => (
    tag === "All" ? wins : wins.filter(w => w.tag === tag)
  ), [wins, tag]);

  const grouped = useMemo(() => {
    const byDay = {};
    for (const w of filtered) {
      const day = new Date(w.ts).toISOString().slice(0,10);
      (byDay[day] ||= []).push(w);
    }
    // sort by date desc, then ts desc
    return Object.entries(byDay)
      .sort((a,b)=> b[0].localeCompare(a[0]))
      .map(([day, arr]) => [day, arr.sort((a,b)=> new Date(b.ts)-new Date(a.ts))]);
  }, [filtered]);

  async function handleAdd() {
    if (!newText.trim()) return;
    await addWin(newText.trim(), newTag);
    setNewText("");
    await load();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this win?")) return;
    await deleteWin(id);
    await load();
  }

  return (
    <div className="mt-5 space-y-5">
      {/* Controls */}
      <div className="rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
           style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}` }}>
        <div className="flex gap-3">
          <div>
            <div className="text-xs" style={{ color: tokens.textSecondary }}>Range</div>
            <select value={range} onChange={e=>setRange(+e.target.value)}
              className="rounded-lg px-3 py-2 bg-transparent border"
              style={{ borderColor: "#4B4343", color: tokens.text }}>
              {[7,30,90].map(n=> <option key={n} value={n} style={{ color:"black" }}>{n} days</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs" style={{ color: tokens.textSecondary }}>Tag</div>
            <select value={tag} onChange={e=>setTag(e.target.value)}
              className="rounded-lg px-3 py-2 bg-transparent border"
              style={{ borderColor: "#4B4343", color: tokens.text }}>
              {["All", ...tags].map(t=> <option key={t} value={t} style={{ color:"black" }}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Add win inline */}
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <input
            value={newText}
            onChange={e=>setNewText(e.target.value)}
            placeholder="Add a win…"
            className="flex-1 rounded-lg px-3 py-2 bg-transparent border"
            style={{ borderColor: "#4B4343", color: tokens.text }}
          />
          <select value={newTag} onChange={e=>setNewTag(e.target.value)}
            className="rounded-lg px-3 py-2 bg-transparent border"
            style={{ borderColor: "#4B4343", color: tokens.text }}>
            {tags.map(t=> <option key={t} value={t} style={{ color:"black" }}>{t}</option>)}
          </select>
          <button onClick={handleAdd}
            className="rounded-xl px-4 py-2"
            style={{ background: tokens.primaryDark, color: tokens.text }}>
            + Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-sm" style={{ color: tokens.textSecondary }}>Loading wins…</div>
        ) : grouped.length === 0 ? (
          <div className="rounded-2xl p-4" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}`, color: tokens.textSecondary }}>
            No wins yet for this view. Go make some ✨
          </div>
        ) : grouped.map(([day, arr]) => (
          <div key={day} className="rounded-2xl p-3" style={{ background: tokens.surface, border:`1px solid ${tokens.primaryDark}` }}>
            <div className="text-sm mb-2" style={{ color: tokens.textSecondary }}>{day}</div>
            <ul className="space-y-2">
              {arr.map(w => (
                <li key={w.id} className="flex justify-between items-start gap-3 rounded-lg p-3"
                    style={{ background: "#2f2929" }}>
                  <div className="flex-1">
                    <div className="text-sm" style={{ color: tokens.text }}>{w.text}</div>
                    <div className="text-xs mt-1" style={{ color: tokens.textMuted }}>
                      {new Date(w.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {w.tag || "Untagged"}
                    </div>
                  </div>
                  <button onClick={()=>handleDelete(w.id)}
                          className="text-xs rounded-full px-2 py-1 border"
                          style={{ borderColor: tokens.primaryDark, color: tokens.textSecondary }}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
