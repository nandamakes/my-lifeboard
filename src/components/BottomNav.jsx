import { TodayIcon, TrendsIcon, TrophyIcon, LightbulbIcon } from "./Icons.jsx";

export default function BottomNav({ tab, setTab, tokens }) {
  const items = [
    { key: "today",    label: "Today",    Icon: TodayIcon },
    { key: "trends",   label: "Trends",   Icon: TrendsIcon },
    { key: "wins",     label: "Wins",     Icon: TrophyIcon },
    { key: "insights", label: "Insights", Icon: LightbulbIcon },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 md:hidden z-40"
         style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}>
      <div className="mx-auto max-w-xl rounded-2xl m-3 px-2 py-2 flex justify-between gap-2"
           style={{ background: "#2c2626", border: `1px solid ${tokens.primaryDark}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
        {items.map(({ key, label, Icon }) => (
          <button key={key} onClick={()=>setTab(key)}
            className="flex-1 rounded-xl px-3 py-2 text-sm flex items-center justify-center gap-1.5"
            style={{
              background: tab===key ? tokens.primaryDark : "transparent",
              border: `1px solid ${tab===key ? tokens.primaryDark : "#4B4343"}`,
              color: tokens.text
            }}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
