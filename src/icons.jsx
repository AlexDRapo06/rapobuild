// Inline lucide-style SVG icons (avoids needing the lucide-react package)
const IconArrowRight = ({ size = 18, className = "", strokeWidth = 2 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconPlus = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconMinus = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconCheck = ({ size = 18, className = "", strokeWidth = 2.25 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconMenu = ({ size = 22, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <line x1="3" y1="7" x2="21" y2="7" />
    <line x1="3" y1="17" x2="21" y2="17" />
  </svg>
);

const IconX = ({ size = 22, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <line x1="5" y1="5" x2="19" y2="19" />
    <line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

const IconMail = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" />
    <polyline points="3 7 12 13 21 7" />
  </svg>
);

const IconPhone = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <path d="M22 16.92V21a1 1 0 0 1-1.11 1A19 19 0 0 1 2 4.11 1 1 0 0 1 3 3h4.09a1 1 0 0 1 1 .75l1 4a1 1 0 0 1-.27 1L7.21 10.21a16 16 0 0 0 6.58 6.58l1.46-1.61a1 1 0 0 1 1-.27l4 1a1 1 0 0 1 .75 1z" />
  </svg>
);

const IconMapPin = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconCalendar = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
  </svg>
);

// Shared frame for the icons below — same stroke style as the ones above.
const IconFrame = ({ size, className, children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className={className} aria-hidden="true">
    {children}
  </svg>
);

const IconLock = ({ size = 18, className = "" }) => (
  <IconFrame size={size} className={className}>
    <rect x="4" y="11" width="16" height="10" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </IconFrame>
);

const IconBolt = ({ size = 18, className = "" }) => (
  <IconFrame size={size} className={className}>
    <polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />
  </IconFrame>
);

const IconUsers = ({ size = 18, className = "" }) => (
  <IconFrame size={size} className={className}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />
    <path d="M16 4a4 4 0 0 1 0 8" />
    <path d="M22 21v-1a6 6 0 0 0-4-5.6" />
  </IconFrame>
);

const IconBook = ({ size = 18, className = "" }) => (
  <IconFrame size={size} className={className}>
    <path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
    <path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" />
  </IconFrame>
);

const IconShirt = ({ size = 18, className = "" }) => (
  <IconFrame size={size} className={className}>
    <path d="M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z" />
  </IconFrame>
);

const IconIdCard = ({ size = 18, className = "" }) => (
  <IconFrame size={size} className={className}>
    <rect x="3" y="5" width="18" height="14" />
    <circle cx="9" cy="11" r="2" />
    <path d="M6 16a3 3 0 0 1 6 0" />
    <line x1="15" y1="10" x2="18" y2="10" />
    <line x1="15" y1="14" x2="18" y2="14" />
  </IconFrame>
);

const IconTarget = ({ size = 18, className = "" }) => (
  <IconFrame size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </IconFrame>
);

Object.assign(window, {
  IconArrowRight, IconPlus, IconMinus, IconCheck, IconMenu, IconX, IconMail, IconPhone, IconMapPin,
  IconCalendar, IconLock, IconBolt, IconUsers, IconBook, IconShirt, IconIdCard, IconTarget,
});
