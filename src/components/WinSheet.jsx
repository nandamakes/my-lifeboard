import { useState } from "react";

export default function WinSheet({ tokens, onClose, onSave }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("Work");
  const tags = ["Work", "Joy", "Health", "Personal"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
         style={{ background:"rgba(0,0,0,0.5)" }}>
      <div className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl"
           style={{ background:"#352E2E", color: tokens.text }}>
        <div className="p-5 border-b" style={{ borderColor:"#4B4343" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Win</h3>
            <button onClick={onClose} className="text-sm" style={{ color: tokens.textSecondary }}>Close</button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3" style={{ maxHeight:"70dvh", overflowY:"auto" }}>
          <label className="flex flex-col gap-1">
            <span className="text-sm" style={{ color: tokens.textSecondary }}>Win</span>
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="What went right?"
                   className="rounded-lg px-3 py-2 bg-transparent border"
                   style={{ borderColor:"#4B4343", color: tokens.text }} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm" style={{ color: tokens.textSecondary }}>Tag</span>
            <select value={tag} onChange={e=>setTag(e.target.value)}
                    className="rounded-lg px-3 py-2 bg-transparent border"
                    style={{ borderColor:"#4B4343", color: tokens.text }}>
              {tags.map(t => <option key={t} value={t} style={{ color:"black" }}>{t}</option>)}
            </select>
          </label>
        </div>

        <div className="p-5 flex justify-end gap-2 border-t" style={{ borderColor:"#4B4343" }}>
          <button onClick={onClose} className="rounded-xl px-4 py-2 border"
                  style={{ borderColor:"#4B4343", color: tokens.textSecondary }}>Cancel</button>
          <button onClick={()=>onSave(text.trim(), tag)} className="rounded-xl px-4 py-2"
                  style={{ background: tokens.primaryDark, color: tokens.text }}>Save</button>
        </div>
      </div>
    </div>
  );
}
