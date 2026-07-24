// Shared components: Nav, Footer, AccentBanner, Button primitives, Image helper

const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "winterCamp", label: "Winter Camp" },
  { key: "basketball", label: "Basketball" },
  { key: "coaches", label: "Coaches" },
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
          aria-label="FOOTYUP — Home"
        >
          FOOTYUP
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
            onClick={() => go("privateTraining")}
            className="btn-arrow hidden sm:inline-flex font-display text-[16px] bg-blood text-white hover:bg-blood-dark px-4 py-2.5 lg:px-5 lg:py-3"
          >
            <span>PRIVATE TRAINING</span>
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
          <span className="font-display text-[26px] tracking-wide">FOOTYUP</span>
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
            onClick={() => go("privateTraining")}
            className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-4"
          >
            <span>PRIVATE TRAINING</span>
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
          FOOTYUP
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
          <li><NavBtn to="winterCamp">Winter Camp</NavBtn></li>
          <li><NavBtn to="basketball">Basketball</NavBtn></li>
          <li><NavBtn to="coaches">Coaches</NavBtn></li>
          <li><NavBtn to="privateTraining">Private Training</NavBtn></li>
        </Col>
        <Col title="Program">
          <li><NavBtn to="coaches">About the Coaches</NavBtn></li>
          <li><NavBtn to="privateTraining">Private Training</NavBtn></li>
          <li><NavBtn to="basketball">Basketball</NavBtn></li>
          <li><NavBtn to="winterCamp">Winter Camp</NavBtn></li>
        </Col>
      </div>

      <div className="border-t border-white/10 px-5 lg:px-10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-white/50 font-cond uppercase tracking-[0.1em]">
        <div>© 2026 FOOTYUP · All Rights Reserved</div>
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

// ---- FORM PRIMITIVES ------------------------------------------------------
// Shared across Private Training inquiry (and formerly Register).
const Field = ({ label, id, type = "text", required, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="font-cond font-bold uppercase tracking-[0.1em] text-[12px] text-ink">
      {label}{required && " *"}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="border border-ink px-4 py-3.5 text-[16px] bg-white text-ink"
      style={{ borderRadius: 0, transition: "border-color 200ms ease" }}
    />
  </div>
);

const Textarea = ({ label, id, rows = 4, required, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="font-cond font-bold uppercase tracking-[0.1em] text-[12px] text-ink">
      {label}{required && " *"}
    </label>
    <textarea
      id={id}
      name={id}
      rows={rows}
      required={required}
      value={value}
      onChange={onChange}
      className="border border-ink px-4 py-3.5 text-[16px] bg-white text-ink resize-none"
      style={{ borderRadius: 0, transition: "border-color 200ms ease" }}
    />
  </div>
);

const SelectField = ({ label, id, required, value, onChange, options }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="font-cond font-bold uppercase tracking-[0.1em] text-[12px] text-ink">
      {label}{required && " *"}
    </label>
    <select
      id={id}
      name={id}
      required={required}
      value={value}
      onChange={onChange}
      className="border border-ink px-4 py-3.5 text-[16px] bg-white text-ink"
      style={{ borderRadius: 0, transition: "border-color 200ms ease" }}
    >
      <option value="" disabled>Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SuccessCard = ({ headline, sub }) => (
  <div className="bg-ink text-white p-12 text-center max-w-[640px]">
    <div
      className="mx-auto w-14 h-14 flex items-center justify-center"
      style={{ background: "#D2122E" }}
    >
      <IconCheck size={28} className="text-white" strokeWidth={3} />
    </div>
    <h3 className="font-display mt-6" style={{ fontSize: "clamp(1.75rem, 3vw, 2rem)" }}>{headline}</h3>
    <p className="mt-3 text-[15px]" style={{ color: "rgba(255,255,255,0.75)" }}>{sub}</p>
  </div>
);

// ---- COACH DATA -----------------------------------------------------------
const COACHES = [
  {
    n: "01",
    name: "ALEXANDER RAPO",
    first: "ALEXANDER",
    last: "RAPO",
    title: "Founder",
    school: "BABSON",
    level: "NCAA D3",
    role: "Founder · Babson Men's Soccer",
    bio: "Former New England Revolution Academy player and current Babson Men's Soccer player. Alexander founded Footy Up to bring the same training environment that shaped him to the next generation of Boston-area players.",
    chips: ["EX-NER ACADEMY", "BABSON", "FOUNDER"],
    src: "public/uploads/images/Alex Rapo.jpeg",
  },
  {
    n: "02",
    name: "CHRIS",
    first: "COACH",
    last: "CHRIS",
    title: "CEO",
    school: "WATERTOWN HS",
    level: "Varsity Coach",
    role: "CEO · Former Watertown HS Assistant Coach",
    bio: "Assistant Varsity Boys' Coach at Watertown High School (2011–2021), where he helped the program capture 5 Middlesex League titles, 3 North Championships, and an Eastern Conference Championship. A former standout defender at Watertown (Middlesex All-Star) and Fitchburg State University (All-Defensive Second Team), Chris pairs strong technical foundations with a player-centered approach — developing confident, well-rounded athletes who understand the game and love playing. Families can expect professionalism, passion, and proven success in every session.",
    chips: ["5× LEAGUE TITLES", "FITCHBURG STATE", "CEO"],
    src: "public/uploads/images/new cofounder.PNG",
  },
  {
    n: "03",
    name: "JAMIE KABUUSU",
    first: "JAMIE",
    last: "KABUUSU",
    title: "Managing Director",
    school: "DUKE",
    level: "NCAA D1",
    role: "Managing Director · Duke Men's Soccer",
    bio: "Former New England Revolution Academy player and current Duke Men's Soccer player. Jamie brings ACC-level pace, composure, and tactical detail to every session.",
    chips: ["EX-NER ACADEMY", "DUKE", "ACC"],
    src: "public/uploads/images/Jamie Kabuusu.jpeg",
  },
  {
    n: "04",
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
    n: "05",
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
    n: "06",
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
    n: "07",
    name: "TJ KAHOLI",
    first: "TJ",
    last: "KAHOLI",
    title: "Coach",
    school: "STANFORD",
    level: "NCAA D1",
    role: "Coach · Stanford Men's Soccer",
    bio: "Former Boston Bolts MLS Next captain and three-year New England Revolution Academy player, now competing at Stanford Men's Soccer — bringing leadership, on-field communication, and ACC-level habits to every session.",
    chips: ["EX-NER ACADEMY", "STANFORD", "CAPTAIN"],
    src: "public/uploads/images/Tj Kaholi.jpeg",
  },
  {
    n: "08",
    name: "ENZO GONCALVES",
    first: "ENZO",
    last: "GONCALVES",
    title: "Coach",
    school: "REVOLUTION II",
    level: "Professional",
    role: "Coach · New England Revolution II",
    bio: "Former New England Revolution Academy player who made his debut with Revolution II. Enzo brings pro-level technical detail and the standards of USL Championship environments to every session.",
    chips: ["EX-NER ACADEMY", "REVOLUTION II", "USL"],
    src: "public/uploads/images/Enzo Goncalves.png",
  },
  {
    n: "09",
    name: "SEBASTIAN OTERO",
    first: "SEBASTIAN",
    last: "OTERO",
    title: "Head of Florida",
    school: "BOSTON UNIVERSITY",
    level: "NCAA D1",
    role: "Head of Florida · Boston University Men's Soccer",
    bio: "Inter Miami CF Academy product with five-plus years in the system, training with both the first and second teams, and a Puerto Rico national team call-up for CONCACAF Nations League and Gold Cup qualifiers. Now at Boston University, Sebastian led the Terriers with three game-winning goals as a freshman and cracked TopDrawerSoccer's top-100 freshman list.",
    chips: ["EX-INTER MIAMI ACADEMY", "BOSTON UNIVERSITY", "PUERTO RICO NT"],
    src: "public/uploads/images/Sebastian Otero.png",
  },
  {
    n: "10",
    name: "IAN HECKER",
    first: "IAN",
    last: "HECKER",
    title: "Coach",
    school: "DUKE",
    level: "NCAA D1",
    role: "Coach · Duke Men's Soccer",
    bio: "Former Boston Bolts MLS Next player, now competing at Duke Men's Soccer. Ian saw action in five matches during the 2025 season, posting a season-high three shots and 47 minutes in a win over Averett — bringing ACC-level habits and the standards of an MLS Next environment to every session.",
    chips: ["EX-MLS NEXT", "DUKE", "ACC"],
    src: "public/uploads/images/Ian Hecker.png",
  },
  {
    n: "11",
    name: "AIDEN REILLY",
    first: "AIDEN",
    last: "REILLY",
    title: "Coach",
    school: "STANFORD",
    level: "NCAA D1",
    role: "Coach · Stanford Men's Soccer",
    bio: "Four-year New England Revolution Academy player who trained with the first and second teams in the offseason and was rostered for Revolution II's 1-0 win over New York Red Bulls II. Now at Stanford, Aiden made three freshman appearances and helped the defense secure a 3-0 clean sheet over Boston College.",
    chips: ["EX-NER ACADEMY", "STANFORD", "REVOLUTION II"],
    src: "public/uploads/images/Aiden Reilly.png",
  },
  {
    n: "12",
    name: "JOSH PARTAL",
    first: "JOSH",
    last: "PARTAL",
    title: "Coach",
    school: "STANFORD",
    level: "NCAA D1",
    role: "Coach · Stanford Men's Soccer",
    bio: "Four-year New England Revolution Academy player, Revolution II debutant, and 2024 United Soccer Coaches All-American. Now at Stanford, Josh started all 20 games as a freshman, earned All-ACC Freshman Team, TopDrawerSoccer Freshman Best XI Second Team, and finished No. 13 on the postseason freshman top-100 list.",
    chips: ["EX-NER ACADEMY", "STANFORD", "ALL-ACC FRESHMAN"],
    src: "public/uploads/images/Josh Partal.png",
  },
  {
    n: "13",
    name: "ALEJANDRO PALACIO",
    first: "ALEJANDRO",
    last: "PALACIO",
    title: "Coach",
    school: "HARVARD",
    level: "NCAA D1",
    role: "Coach · Harvard Men's Soccer",
    bio: "Intercontinental Football Academy of New England product, three-time ISL champion, and 2024 NEPSAC champion. Now at Harvard Men's Soccer, Alejandro played 14 games with nine starts as a freshman — tallying six points on two goals and two assists, and finishing fifth on the team in scoring.",
    chips: ["EX-IFA", "HARVARD", "IVY LEAGUE"],
    src: "public/uploads/images/Alejandro Palacio.png",
  },
];

Object.assign(window, {
  TopNav, Footer, AccentBanner, RedButton, OutlineButton,
  UnsplashImg, LabelRow, COACHES, NAV_ITEMS,
  Field, Textarea, SelectField, SuccessCard,
});
