export const TodayIcon = ({ size = 18, stroke = 1.75, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5"></rect>
    <path d="M8 3v3M16 3v3M3 9h18"></path>
    <circle cx="12" cy="14" r="1.5"></circle>
  </svg>
);

export const TrendsIcon = ({ size = 18, stroke = 1.75, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 17l6-6 4 4 7-7"></path>
    <path d="M21 10V4h-6"></path>
  </svg>
);

export const TrophyIcon = ({ size = 18, stroke = 1.75, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M8 21h8"></path>
    <path d="M12 17v4"></path>
    <path d="M7 4h10v4a5 5 0 0 1-10 0V4z"></path>
    <path d="M21 6a3 3 0 0 1-3 3V6h3zM3 6h3v3A3 3 0 0 1 3 6z"></path>
  </svg>
);

export const LightbulbIcon = ({ size = 18, stroke = 1.75, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
    <path d="M12 2a7 7 0 0 0-4 12c.6.6 1 1.4 1 2.3V17h6v-.7c0-.9.4-1.7 1-2.3A7 7 0 0 0 12 2z"></path>
  </svg>
);
