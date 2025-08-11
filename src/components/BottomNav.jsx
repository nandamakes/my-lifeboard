export default function BottomNav({ tab, setTab, tokens }) {
  const items = [
    { key: "today",    label: "Today" },
    { key: "trends",   label: "Trends" },
    { key: "wins",     label: "Wins" },
    { key: "insights", label: "Insights" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 md:hidden z-40"
         style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
      <div className="mx-auto max-w-xl rounded-2xl m-3 px-2 py-2 flex justify-between gap-2"
           style={{ background: "#2c2626", border: `1px solid ${tokens.primaryDark}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
        {items.map(it => (
          <button key={it.key} onClick={()=>setTab(it.key)}
            className="flex-1 rounded-xl px-3 py-2 text-sm"
            style={{
              background: tab===it.key ? tokens.primaryDark : "transparent",
              border: `1px solid ${tab===it.key ? tokens.primaryDark : "#4B4343"}`,
              color: tokens.text
            }}>
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
