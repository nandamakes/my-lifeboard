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
         style={{
           paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
           paddingLeft:  "calc(env(safe-area-inset-left) + 8px)",
           paddingRight: "calc(env(safe-area-inset-right) + 8px)"
         }}>
      <div className="rounded-2xl mx-2 px-2 py-2 flex gap-2"
           style={{ background: "#2c2626", border: `1px solid ${tokens.primaryDark}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
        {items.map(({ key, label, Icon }) => (
          <button key={key} onClick={()=>setTab(key)}
            className="basis-1/4 min-w-0 rounded-xl px-2 py-2 text-xs flex items-center justify-center gap-1.5"
            style={{
              background: tab===key ? tokens.primaryDark : "transparent",
              border: `1px solid ${tab===key ? tokens.primaryDark : "#4B4343"}`,
              color: tokens.text
            }}>
            <Icon size={16} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

