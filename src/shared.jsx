// Shared components: Nav, Footer, AccentBanner, Button primitives, Image helper

const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "coaches", label: "Coaches" },
  { key: "camp", label: "Camp" },
  { key: "privateTraining", label: "Private Training" },
];

// ---- BUTTON ---------------------------------------------------------------
const RedButton = ({ children, onClick, full = false, size = "md", type = "button", className = "" }) => {
  const sizeCls = size === "lg"
    ? "px-6 py-5 text-[22px]"
    : size === "sm" ? "px-4 py-2.5 text-[15px]" : "px-5 py-3 text-[16px]";
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn-arrow font-display tracking-wide bg-blood text-white hover:bg-blood-dark ${sizeCls} ${full ? "w-full justify-center" : ""} ${className}`}
    >
      <span>{children}</span>
      <IconArrowRight size={18} className="arrow" />
    </button>
  );
};

const OutlineButton = ({ children, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`btn-arrow font-display tracking-wide border border-ink text-ink hover:bg-ink hover:text-white px-5 py-3 text-[16px] transition-colors ${className}`}
  >
    <span>{children}</span>
    <IconArrowRight size={18} className="arrow" />
  </button>
);

// ---- NAV ------------------------------------------------------------------
const TopNav = ({ page, setPage }) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (key) => {
    setOpen(false);
    setPage(key);
  };

  return (
    <>
    <header
      className="sticky top-0 z-50 bg-ink text-white"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        backgroundColor: scrolled ? "rgba(17,17,17,0.85)" : "#111111",
      }}
    >
      <nav className="h-[60px] lg:h-[72px] flex items-center justify-between px-5 lg:px-8" aria-label="Primary">
        {/* Wordmark */}
        <button
          onClick={() => go("home")}
          className="font-display text-[26px] lg:text-[28px] tracking-wide hover:opacity-80"
          aria-label="Footy Up — Home"
        >
          FOOTY UP
        </button>

        {/* Center desktop */}
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((it) => {
            const active = page === it.key;
            return (
              <li key={it.key}>
                <button
                  onClick={() => go(it.key)}
                  className={`nav-link transition-opacity ${active ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                  style={active ? { borderBottom: "2px solid #D2122E", paddingBottom: 4 } : {}}
                >
                  {it.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => go("register")}
            className="btn-arrow hidden sm:inline-flex font-display text-[16px] bg-blood text-white hover:bg-blood-dark px-4 py-2.5 lg:px-5 lg:py-3"
          >
            <span>REGISTER</span>
            <IconArrowRight size={16} className="arrow" />
          </button>
          <button
            className="lg:hidden p-2 -mr-2 text-white"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <IconMenu size={24} />
          </button>
        </div>
      </nav>
    </header>

    {/* Mobile overlay — rendered as sibling to escape header's stacking context */}
    {open && (
      <div className="mobile-menu fixed inset-0 z-[100] text-white flex flex-col">
        <div className="mobile-menu__bg" aria-hidden="true" />
        <div className="mobile-menu__glow mobile-menu__glow--red" aria-hidden="true" />
        <div className="mobile-menu__glow mobile-menu__glow--gold" aria-hidden="true" />
        <div className="mobile-menu__grid" aria-hidden="true" />

        <div className="relative z-10 h-[60px] flex items-center justify-between px-5 border-b border-white/10">
          <span className="font-display text-[26px] tracking-wide">FOOTY UP</span>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 -mr-2 text-white/90 hover:text-white"><IconX size={24} /></button>
        </div>

        <div className="relative z-10 px-7 pt-10">
          <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#D2122E" }}>
            Navigate
          </span>
        </div>

        <ul className="relative z-10 flex-1 flex flex-col justify-center px-7 gap-1 -mt-6">
          {NAV_ITEMS.map((it, i) => {
            const active = page === it.key;
            return (
              <li key={it.key} className="mobile-menu__item" style={{ animationDelay: `${0.05 + i * 0.06}s` }}>
                <button
                  onClick={() => go(it.key)}
                  className="mobile-menu__link group"
                >
                  <span className="mobile-menu__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mobile-menu__label" style={active ? { color: "#D2122E" } : {}}>
                    {it.label.toUpperCase()}.
                  </span>
                  <IconArrowRight size={18} className="mobile-menu__arrow" />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="relative z-10 px-5 pb-8 pt-6 border-t border-white/10">
          <button
            onClick={() => go("register")}
            className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-4"
          >
            <span>REGISTER — $350</span>
            <IconArrowRight size={20} className="arrow" />
          </button>
          <div className="mt-5 flex items-center justify-between text-[11px] text-white/45 font-cond uppercase tracking-[0.16em]">
            <span>Boston · Est. 2024</span>
            <a href="mailto:footyupp@outlook.com" className="hover:text-white">footyupp@outlook.com</a>
          </div>
        </div>

        <style>{`
          .mobile-menu__bg {
            position: absolute; inset: 0; z-index: 0;
            background:
              radial-gradient(900px 500px at 10% 0%, rgba(210,18,46,0.10), transparent 55%),
              radial-gradient(700px 420px at 95% 110%, rgba(201,162,74,0.08), transparent 55%),
              linear-gradient(180deg, #0A0A0A 0%, #111114 100%);
          }
          .mobile-menu__glow {
            position: absolute; z-index: 0;
            width: 360px; height: 360px; border-radius: 9999px;
            filter: blur(110px); pointer-events: none;
          }
          .mobile-menu__glow--red  { top: -120px; left: -100px; background: rgba(210,18,46,0.32); }
          .mobile-menu__glow--gold { bottom: -160px; right: -120px; background: rgba(201,162,74,0.18); }
          .mobile-menu__grid {
            position: absolute; inset: 0; z-index: 0;
            background-image:
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 60px 60px;
            mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            opacity: 0.55;
          }
          .mobile-menu__item {
            opacity: 0;
            transform: translateY(8px);
            animation: mm-slide 0.42s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          }
          @keyframes mm-slide {
            to { opacity: 1; transform: translateY(0); }
          }
          .mobile-menu__link {
            position: relative;
            display: flex;
            align-items: center;
            gap: 14px;
            width: 100%;
            text-align: left;
            padding: 14px 4px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            transition: padding-left 0.25s ease, border-color 0.25s ease;
          }
          .mobile-menu__link:hover,
          .mobile-menu__link:focus-visible {
            padding-left: 14px;
            border-color: rgba(210,18,46,0.5);
          }
          .mobile-menu__num {
            font-family: "Barlow Condensed", sans-serif;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 0.2em;
            color: rgba(255,255,255,0.35);
            min-width: 22px;
          }
          .mobile-menu__label {
            font-family: "Bebas Neue", sans-serif;
            font-size: 38px;
            line-height: 1;
            letter-spacing: 0.01em;
            color: #fff;
            flex: 1;
          }
          .mobile-menu__arrow {
            color: rgba(255,255,255,0.25);
            transition: transform 0.25s ease, color 0.25s ease;
          }
          .mobile-menu__link:hover .mobile-menu__arrow,
          .mobile-menu__link:focus-visible .mobile-menu__arrow {
            transform: translateX(4px);
            color: #D2122E;
          }
        `}</style>
      </div>
    )}
    </>
  );
};

// ---- ACCENT BANNER --------------------------------------------------------
const AccentBanner = ({ children }) => (
  <section className="bg-blood text-white text-center py-[60px] px-6">
    <h2
      className="font-display"
      style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.95 }}
    >
      {children}
    </h2>
  </section>
);

// ---- FOOTER ---------------------------------------------------------------
const Footer = ({ setPage }) => {
  const Col = ({ title, children }) => (
    <div className="footer-col">
      <h3 className="eyebrow text-white/50 mb-3 lg:mb-5">{title}</h3>
      <ul className="footer-col__list text-white/80">
        {children}
      </ul>
    </div>
  );
  const NavBtn = ({ to, children }) => (
    <button onClick={() => setPage(to)} className="hover:text-white text-left">
      {children}
    </button>
  );

  return (
    <footer className="bg-ink text-white">
      {/* Massive wordmark — barely visible */}
      <div className="px-5 lg:px-10 pt-20 lg:pt-24 overflow-hidden">
        <div
          aria-hidden="true"
          className="font-display select-none whitespace-nowrap"
          style={{
            fontSize: "clamp(4rem, 18vw, 16rem)",
            color: "#1F1F1F",
            lineHeight: 0.85,
            letterSpacing: "-0.02em",
            marginBottom: "-0.18em", // crop bottom slightly
          }}
        >
          FOOTY UP
        </div>
      </div>

      <div className="border-t border-white/10" />

      <div className="px-5 lg:px-10 py-10 lg:py-20 grid grid-cols-3 gap-4 lg:gap-10">
        <Col title="Contact">
          <li className="flex items-center gap-2"><IconMail size={14} /> <a href="mailto:footyupp@outlook.com" style={{ color: "inherit", textDecoration: "underline" }}>footyupp@outlook.com</a></li>
          <li className="flex items-center gap-2"><IconPhone size={14} /> <a href="tel:+16176344744" style={{ color: "inherit", textDecoration: "underline" }}>+1 (617) 634&#8209;4744</a></li>
          <li className="flex items-center gap-2"><IconMapPin size={14} /> Greater Boston, MA</li>
        </Col>
        <Col title="Navigate">
          <li><NavBtn to="home">Home</NavBtn></li>
          <li><NavBtn to="coaches">Coaches</NavBtn></li>
          <li><NavBtn to="camp">Camp</NavBtn></li>
          <li><NavBtn to="register">Register</NavBtn></li>
          <li><NavBtn to="privateTraining">Private Training</NavBtn></li>
        </Col>
        <Col title="Program">
          <li><NavBtn to="coaches">About the Coaches</NavBtn></li>
          <li><NavBtn to="camp">Camp Schedule</NavBtn></li>
          <li><NavBtn to="privateTraining">Private Training</NavBtn></li>
          <li><NavBtn to="camp">FAQ</NavBtn></li>
        </Col>
      </div>

      <div className="border-t border-white/10 px-5 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-white/50 font-cond uppercase tracking-[0.1em]">
        <div>© 2026 Footy Up · All Rights Reserved</div>
        <div>Built in collaboration with GOAT</div>
      </div>

      <style>{`
        .footer-col__list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 14px;
        }
        .footer-col__list > li {
          word-break: break-word;
        }
        @media (max-width: 1023px) {
          .footer-col__list {
            font-size: 12px;
            gap: 8px;
          }
          .footer-col__list svg { flex-shrink: 0; }
        }
        @media (max-width: 480px) {
          .footer-col__list {
            font-size: 11px;
            gap: 7px;
          }
        }
      `}</style>
    </footer>
  );
};

// ---- IMG helper -----------------------------------------------------------
const UnsplashImg = ({ id, w = 1200, alt, className = "" }) => (
  <img
    src={`https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`}
    alt={alt}
    loading="lazy"
    className={`w-full h-full object-cover ${className}`}
  />
);

// ---- LABEL ROW ------------------------------------------------------------
const LabelRow = ({ label, value, dark = false, last = false }) => (
  <div
    className={`flex items-baseline justify-between gap-6 py-4 ${last ? "" : dark ? "border-b border-white/10" : "border-b border-ash"}`}
  >
    <span className={`eyebrow ${dark ? "text-white/60" : "text-fog"}`} style={{ color: dark ? "rgba(255,255,255,0.6)" : "#757575" }}>{label}</span>
    <span className={`font-cond font-semibold uppercase text-right text-[15px] ${dark ? "text-white" : "text-ink"}`}>{value}</span>
  </div>
);

// ---- COACH DATA -----------------------------------------------------------
const COACHES = [
  {
    n: "01",
    name: "ALEXANDER RAPO",
    first: "ALEXANDER",
    last: "RAPO",
    title: "Founder of Footy Up",
    school: "BABSON",
    level: "NCAA D3",
    role: "Founder · Babson Men's Soccer",
    bio: "Former New England Revolution Academy player and current Babson Men's Soccer player. Alexander founded Footy Up to bring the same training environment that shaped him to the next generation of Boston-area players.",
    chips: ["EX-NER ACADEMY", "BABSON", "FOUNDER"],
    src: "public/uploads/images/Alex Rapo.jpeg",
  },
  {
    n: "02",
    name: "JAMIE KABUUSU",
    first: "JAMIE",
    last: "KABUUSU",
    title: "Coach",
    school: "DUKE",
    level: "NCAA D1",
    role: "Coach · Duke Men's Soccer",
    bio: "Former New England Revolution Academy player and current Duke Men's Soccer player. Jamie brings ACC-level pace, composure, and tactical detail to every session.",
    chips: ["EX-NER ACADEMY", "DUKE", "ACC"],
    src: "public/uploads/images/Jamie Kabuusu.jpeg",
  },
  {
    n: "03",
    name: "ANTHONY RAPO",
    first: "ANTHONY",
    last: "RAPO",
    title: "Coach",
    school: "NORTHEASTERN",
    level: "NCAA D1",
    role: "Coach · Northeastern Men's Soccer",
    bio: "Former IFA MLS Next player and current Northeastern Men's Soccer player. Anthony's sessions blend pro-level technical structure with the energy that keeps young players locked in for the full day.",
    chips: ["EX-MLS NEXT", "NORTHEASTERN", "D1"],
    src: "public/uploads/images/Anthony Rap.jpeg",
  },
  {
    n: "04",
    name: "BRYAN TORO",
    first: "BRYAN",
    last: "TORO",
    title: "Coach",
    school: "BOSTON COLLEGE",
    level: "NCAA D1",
    role: "Coach · Boston College Men's Soccer",
    bio: "Former IFA MLS Next player and current Boston College Men's Soccer player. Bryan focuses on pressing patterns, off-ball movement, and the small habits young players need to compete at the next level.",
    chips: ["EX-MLS NEXT", "BOSTON COLLEGE", "D1"],
    src: "public/uploads/images/Brian Toro.jpeg",
  },
  {
    n: "05",
    name: "ANGEL ORTEZ",
    first: "ANGEL",
    last: "ORTEZ",
    title: "Coach",
    school: "PRO FUTSAL",
    level: "Professional",
    role: "Coach · Pro Futsal Player",
    bio: "Former New England Revolution Academy player and current professional Futsal player. Angel runs the technical and 1v1 sessions — first touch, tight-space mastery, and the moves that translate from the cone to the game.",
    chips: ["EX-NER ACADEMY", "PRO FUTSAL", "1V1"],
    src: "public/uploads/images/angel1.jpeg",
  },
  {
    n: "06",
    name: "TJ KAHOLI",
    first: "TJ",
    last: "KAHOLI",
    title: "Coach",
    school: "LOUISVILLE",
    level: "NCAA D1",
    role: "Coach · Louisville Men's Soccer",
    bio: "Former Boston Bolts MLS Next captain and three-year New England Revolution Academy player. Now a sophomore and current captain at Louisville Men's Soccer — bringing leadership, on-field communication, and ACC-level habits to every session.",
    chips: ["EX-NER ACADEMY", "LOUISVILLE", "CAPTAIN"],
    src: "public/uploads/images/Tj Kaholi.jpeg",
  },
];

Object.assign(window, {
  TopNav, Footer, AccentBanner, RedButton, OutlineButton,
  UnsplashImg, LabelRow, COACHES, NAV_ITEMS,
});
