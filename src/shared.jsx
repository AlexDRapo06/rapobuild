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

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-[70] bg-ink text-white flex flex-col">
          <div className="h-[60px] flex items-center justify-between px-5 border-b border-white/10">
            <span className="font-display text-[26px]">FOOTY UP</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 -mr-2"><IconX size={24} /></button>
          </div>
          <ul className="flex-1 flex flex-col justify-center px-8 gap-6">
            {NAV_ITEMS.map((it) => (
              <li key={it.key}>
                <button
                  onClick={() => go(it.key)}
                  className="font-display text-[40px] tracking-wide text-left w-full"
                  style={page === it.key ? { color: "#D2122E" } : {}}
                >
                  {it.label.toUpperCase()}.
                </button>
              </li>
            ))}
          </ul>
          <div className="p-5 border-t border-white/10">
            <button
              onClick={() => go("register")}
              className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-4"
            >
              <span>REGISTER — $415</span>
              <IconArrowRight size={20} className="arrow" />
            </button>
          </div>
        </div>
      )}
    </header>
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
    <div>
      <h3 className="eyebrow text-white/50 mb-5">{title}</h3>
      <ul className="space-y-3 text-[14px] text-white/80">
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

      <div className="px-5 lg:px-10 py-12 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <Col title="Contact">
          <li className="flex items-center gap-2"><IconMail size={14} /> camp@footyup.com</li>
          <li className="flex items-center gap-2"><IconPhone size={14} /> +1 (617) 555&#8209;0119</li>
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
    level: "NCAA D1",
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
];

Object.assign(window, {
  TopNav, Footer, AccentBanner, RedButton, OutlineButton,
  UnsplashImg, LabelRow, COACHES, NAV_ITEMS,
});
