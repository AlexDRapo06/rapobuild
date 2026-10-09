// MIAMI COLLEGE COMBINE — event page + code-gated registration (#miami).
//
// Registration state comes from /api/camp-access, backed by api/_camps.js:
// before `opensAt` the form is locked behind a countdown; while `gated`, families
// unlock it with the private-school access code. api/checkout.js re-checks both,
// so nothing here can be used to skip the gate. If the API can't be reached
// (e.g. a static preview), the page falls back to the defaults in src/camps.jsx.

// Gulliver Prep campus photo behind the hero. Set to null to fall back to the
// designed stadium backdrop. Sizes are pre-cropped to 16:9 and compressed; the
// browser picks the smallest one that fills the screen.
const MIAMI_HERO_IMAGE = {
  src: "public/uploads/images/gulliver-prep-hero-1920.jpg",
  srcSet: [
    "public/uploads/images/gulliver-prep-hero-1280.jpg 1280w",
    "public/uploads/images/gulliver-prep-hero-1920.jpg 1920w",
    "public/uploads/images/gulliver-prep-hero-2560.jpg 2560w",
  ].join(", "),
};

// Must match the lists in api/checkout.js.
const MIAMI_SIZES = ["Youth L", "Adult XS", "Adult S", "Adult M", "Adult L", "Adult XL", "Adult XXL"];
const MIAMI_POSITIONS = [
  "Goalkeeper", "Center Back", "Outside Back", "Defensive Midfielder",
  "Central Midfielder", "Attacking Midfielder", "Winger", "Striker",
];
const MIAMI_GRAD_YEARS = ["2027", "2028", "2029", "2030", "2031", "2032"];
const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([value, label]) => ({ value, label }));

// Remembers an unlocked code for this tab so a refresh doesn't relock the form.
const MIAMI_CODE_KEY = "footyup:miami-access";

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Ticks once a second while `active` (the countdown), otherwise stays put.
const useMiamiClock = (active) => {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
};

const formatOpensAt = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/New_York" });

// ---- REGISTRATION: LOCKED (countdown) ---------------------------------------
const MiamiCountdown = ({ opensAt, now }) => {
  const ms = Math.max(0, Date.parse(opensAt) - now);
  const parts = [
    { l: "Days", v: Math.floor(ms / 86400000) },
    { l: "Hours", v: Math.floor(ms / 3600000) % 24 },
    { l: "Min", v: Math.floor(ms / 60000) % 60 },
    { l: "Sec", v: Math.floor(ms / 1000) % 60 },
  ];
  return (
    <div className="miami-gate">
      <div className="miami-gate__icon"><IconLock size={22} /></div>
      <div className="eyebrow mt-6" style={{ color: "#C9A24A" }}>Registration</div>
      <h3 className="font-display text-white mt-2 leading-none" style={{ fontSize: "clamp(2rem, 4.5vw, 3.25rem)" }}>
        OPENS {formatOpensAt(opensAt).toUpperCase()}.
      </h3>
      <p className="mt-4 text-[15px] leading-[1.6] mx-auto" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 520 }}>
        Priority registration opens first to families with an access code from their school. Public registration follows — spots are limited.
      </p>
      <div className="miami-countdown" role="timer" aria-label="Time until registration opens">
        {parts.map((p) => (
          <div key={p.l} className="miami-countdown__cell">
            <div className="miami-countdown__num font-display">{pad2(p.v)}</div>
            <div className="miami-countdown__label">{p.l}</div>
          </div>
        ))}
      </div>
      <a href="mailto:footyupp@outlook.com?subject=Miami%20College%20Combine" className="miami-gate__link">
        Get notified — footyupp@outlook.com
      </a>
    </div>
  );
};

// ---- REGISTRATION: ACCESS CODE ----------------------------------------------
const MiamiCodeGate = ({ camp, onUnlock, initialError = "" }) => {
  const [code, setCode] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [error, setError] = React.useState(initialError);

  const submit = async (e) => {
    e.preventDefault();
    if (checking || !code.trim()) return;
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/camp-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: camp.id, code }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onUnlock(code.trim());
      } else {
        setError(data.error || "That access code is not valid. Please check it and try again.");
      }
    } catch {
      setError("We couldn't check that code. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="miami-gate">
      <div className="miami-gate__icon"><IconLock size={22} /></div>
      <div className="eyebrow mt-6" style={{ color: "#C9A24A" }}>Priority Registration</div>
      <h3 className="font-display text-white mt-2 leading-none" style={{ fontSize: "clamp(2rem, 4.5vw, 3.25rem)" }}>
        ENTER YOUR ACCESS CODE.
      </h3>
      <p className="mt-4 text-[15px] leading-[1.6] mx-auto" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 520 }}>
        Registration is currently reserved for families with an access code from their school. Enter it below to unlock the registration form.
      </p>
      <form onSubmit={submit} className="miami-gate__form">
        <label htmlFor="miami-code" className="sr-only">Access code</label>
        <input
          id="miami-code"
          name="accessCode"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? "miami-code-error" : undefined}
          className="miami-gate__input"
        />
        <button type="submit" disabled={checking} className="btn-arrow justify-center font-display tracking-wide bg-blood text-white hover:bg-blood-dark px-6 py-4 text-[18px]" style={{ opacity: checking ? 0.6 : 1 }}>
          <span>{checking ? "CHECKING…" : "UNLOCK"}</span>
          <IconArrowRight size={18} className="arrow" />
        </button>
      </form>
      {error && <p id="miami-code-error" role="alert" className="mt-4 text-[14px]" style={{ color: "#ff6072" }}>{error}</p>}
      <a href="mailto:footyupp@outlook.com?subject=Miami%20College%20Combine%20%E2%80%94%20public%20registration" className="miami-gate__link">
        No code? Get notified when public registration opens
      </a>
    </div>
  );
};

// ---- REGISTRATION: FORM -----------------------------------------------------
const MiamiFieldset = ({ n, title, note, children }) => (
  <fieldset className="miami-fieldset">
    <legend className="miami-fieldset__legend">
      <span className="miami-fieldset__n">{n}</span>
      <span>{title}</span>
    </legend>
    {note && <p className="miami-fieldset__note">{note}</p>}
    <div className="flex flex-col gap-5">{children}</div>
  </fieldset>
);

const MiamiForm = ({ camp, accessCode, session, setSession, onCodeRejected }) => {
  const [form, setForm] = React.useState({
    playerName: "", playerEmail: "", playerAge: "", gradYear: "",
    heightFt: "", heightIn: "", weight: "", position: "", club: "", clothingSize: "",
    parentName: "", parentEmail: "", parentPhone: "",
    address1: "", address2: "", city: "", state: "", zip: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const selected = camp.sessions.find((s) => s.value === session);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!selected) {
      setError("Please choose the Boys or Girls combine.");
      scrollToId("miami-register");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: camp.id, session, accessCode, ...form }),
      });
      const data = await res.json();
      if (data.url) {
        // Leaves the page — deliberately stays in the loading state.
        window.location.href = data.url;
      } else if (res.status === 403 && onCodeRejected) {
        // The saved code no longer works (or registration closed) — back to the gate.
        onCodeRejected(data.error);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10">
      <MiamiFieldset n="01" title="Choose Your Combine">
        <div role="radiogroup" aria-label="Combine" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {camp.sessions.map((s) => {
            const on = session === s.value;
            return (
              <label key={s.value} className={`miami-choice ${on ? "miami-choice--on" : ""}`}>
                <input
                  type="radio"
                  name="session"
                  value={s.value}
                  checked={on}
                  onChange={() => setSession(s.value)}
                  className="sr-only"
                />
                <span className="miami-choice__radio" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block font-display text-[26px] leading-none text-ink">{s.title}</span>
                  <span className="block mt-1.5 font-cond font-semibold uppercase tracking-[0.12em] text-[13px] text-fog">{s.dates} · {s.ages}</span>
                </span>
                <span className="font-display text-[24px] text-ink">{formatUSD(s.price)}</span>
              </label>
            );
          })}
        </div>
      </MiamiFieldset>

      <MiamiFieldset n="02" title="Player">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field id="m-playerName" label="Player Full Name" required autoComplete="off" value={form.playerName} onChange={set("playerName")} />
          <Field id="m-playerEmail" type="email" label="Player Email" required autoComplete="off" value={form.playerEmail} onChange={set("playerEmail")} hint="Used for VALD performance testing results." />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <Field id="m-playerAge" type="number" inputMode="numeric" label="Age" required min={camp.minAge} max={camp.maxAge} value={form.playerAge} onChange={set("playerAge")} />
          <SelectField id="m-gradYear" label="Grad Year" required value={form.gradYear} onChange={set("gradYear")} options={MIAMI_GRAD_YEARS} />
          <SelectField id="m-heightFt" label="Height (ft)" required value={form.heightFt} onChange={set("heightFt")} options={["4", "5", "6", "7"].map((v) => ({ value: v, label: `${v} ft` }))} />
          <SelectField id="m-heightIn" label="Height (in)" required value={form.heightIn} onChange={set("heightIn")} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `${i} in` }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Field id="m-weight" type="number" inputMode="numeric" label="Weight (lb)" required min={60} max={350} value={form.weight} onChange={set("weight")} />
          <SelectField id="m-position" label="Primary Position" required value={form.position} onChange={set("position")} options={MIAMI_POSITIONS} />
          <SelectField id="m-clothingSize" label="Clothing Size" required value={form.clothingSize} onChange={set("clothingSize")} options={MIAMI_SIZES} />
        </div>
        <Field id="m-club" label="Current Club / Team" required placeholder="e.g. Club name, MLS NEXT / ECNL team" maxLength={120} value={form.club} onChange={set("club")} />
      </MiamiFieldset>

      <MiamiFieldset n="03" title="Parent / Guardian">
        <Field id="m-parentName" label="Parent / Guardian Name" required autoComplete="name" value={form.parentName} onChange={set("parentName")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field id="m-parentEmail" type="email" label="Parent Email" required autoComplete="email" value={form.parentEmail} onChange={set("parentEmail")} />
          <Field id="m-parentPhone" type="tel" label="Parent Phone" required autoComplete="tel" value={form.parentPhone} onChange={set("parentPhone")} />
        </div>
      </MiamiFieldset>

      <MiamiFieldset n="04" title="Home Address" note="Your custom FOOTYUP × GOINGFORGOAT kit ships here before the combine.">
        <Field id="m-address1" label="Street Address" required autoComplete="address-line1" value={form.address1} onChange={set("address1")} />
        <Field id="m-address2" label="Apt / Unit" optional autoComplete="address-line2" value={form.address2} onChange={set("address2")} />
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-5">
          <Field id="m-city" label="City" required autoComplete="address-level2" value={form.city} onChange={set("city")} />
          <SelectField id="m-state" label="State" required autoComplete="address-level1" value={form.state} onChange={set("state")} options={US_STATES} />
          <Field id="m-zip" label="ZIP" required autoComplete="postal-code" inputMode="numeric" maxLength={10} value={form.zip} onChange={set("zip")} />
        </div>
      </MiamiFieldset>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-5"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <span>{loading ? "REDIRECTING TO CHECKOUT…" : selected ? `CONTINUE TO PAYMENT — ${formatUSD(selected.price)}` : "CONTINUE TO PAYMENT"}</span>
          <IconArrowRight size={20} className="arrow" />
        </button>
        {error && (
          <p role="alert" className="mt-4 text-[14px] text-center" style={{ color: "#D2122E" }}>{error}</p>
        )}
        <div className="mt-4 text-[12px] text-fog flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
          <span>Secured by Stripe</span>
          <span aria-hidden="true">•</span>
          <span>Confirmation emailed after checkout</span>
        </div>
      </div>
    </form>
  );
};

// ---- PAGE -------------------------------------------------------------------
const MiamiCombine = ({ setPage }) => {
  const camp = campById("miami_combine_2027");
  const [status, setStatus] = React.useState(null);
  const [session, setSession] = React.useState("");
  const [accessCode, setAccessCode] = React.useState(() => {
    try { return sessionStorage.getItem(MIAMI_CODE_KEY) || ""; } catch { return ""; }
  });
  const vald = React.useRef(null);
  const [valdVisible, setValdVisible] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch(`/api/camp-access?campId=${encodeURIComponent(camp.id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (alive) setStatus(d); })
      .catch(() => {
        if (alive) setStatus({ open: campRegistrationOpen(camp), gated: camp.gated, opensAt: camp.opensAt });
      });
    return () => { alive = false; };
  }, []);

  // Animate the VALD report bars once they scroll into view.
  React.useEffect(() => {
    const el = vald.current;
    if (!el || !("IntersectionObserver" in window)) { setValdVisible(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setValdVisible(true); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const waiting = !!status && !status.open && !!status.opensAt;
  const now = useMiamiClock(waiting);
  // The countdown flips the page open on its own at the opening time; the
  // server still enforces the real time at checkout.
  const open = !!status && (status.open || (status.opensAt && now >= Date.parse(status.opensAt)));
  const gated = !!status && status.gated;
  const unlocked = !gated || !!accessCode;

  const [gateError, setGateError] = React.useState("");
  const unlock = (code) => {
    setGateError("");
    setAccessCode(code);
    try { sessionStorage.setItem(MIAMI_CODE_KEY, code); } catch {}
  };
  const relock = (message) => {
    setGateError(message || "");
    setAccessCode("");
    try { sessionStorage.removeItem(MIAMI_CODE_KEY); } catch {}
    scrollToId("miami-register");
  };

  const pickSession = (value) => {
    setSession(value);
    scrollToId("miami-register");
  };

  const statusLine = !status
    ? "Checking registration…"
    : !open
      ? `Registration opens ${formatOpensAt(status.opensAt)} · Priority access code required`
      : gated
        ? "Registration open · Priority access code required"
        : "Registration open";

  const SignUp = ({ className = "" }) => (
    <button
      type="button"
      onClick={() => scrollToId("miami-register")}
      className={`btn-arrow justify-center font-display tracking-wide bg-blood text-white hover:bg-blood-dark px-6 py-4 text-[20px] ${className}`}
    >
      <span>SIGN UP NOW</span>
      <IconArrowRight size={20} className="arrow" />
    </button>
  );

  const INCLUDED = [
    { icon: IconUsers, t: "College Coaches On Site", d: "College coaches will be in attendance to watch players train and compete — the opportunity to showcase yourself in a highly competitive environment." },
    { icon: IconIdCard, t: "Personal Player Profile", d: "Every player receives a personalized player profile that college coaches can access throughout the event." },
    { icon: IconBolt, t: "VALD Performance Testing", d: "Measurable data on speed, power, strength, and athletic performance." },
    { icon: IconBook, t: "Recruiting Classroom", d: "Classroom sessions on the college recruitment process and the steps involved in pursuing college soccer." },
    { icon: IconTarget, t: "High-Level Training", d: "Technical work, position-specific training, competitive exercises, small-sided games, and full-sided matches." },
    { icon: IconShirt, t: "Custom Kit & Gear", d: "A custom FOOTYUP × GOINGFORGOAT kit shipped to your home, plus a check-in band and event gear on arrival." },
  ];

  const VALD_TESTS = [
    { t: "Sprint Speed", d: "20, 30 & 40-yard dashes", w: 86 },
    { t: "Vertical Jump", d: "Measured on ForceDecks", w: 72 },
    { t: "Power Output", d: "Measured on ForceDecks", w: 79 },
    { t: "Strength", d: "Force & athletic profile", w: 64 },
  ];

  const ROTATION = [
    { g: "A", blocks: ["field", "vald", "class"] },
    { g: "B", blocks: ["vald", "class", "field"] },
    { g: "C", blocks: ["class", "field", "vald"] },
  ];
  const BLOCK = {
    field: { label: "On-Field", cls: "miami-rot__cell--field" },
    vald: { label: "VALD Testing", cls: "miami-rot__cell--vald" },
    class: { label: "Classroom", cls: "miami-rot__cell--class" },
  };

  return (
    <main id="main" className="miami-page">
      {/* HERO */}
      <section className="miami-hero relative overflow-hidden">
        {MIAMI_HERO_IMAGE && (
          <img
            className="miami-hero__photo"
            src={MIAMI_HERO_IMAGE.src}
            srcSet={MIAMI_HERO_IMAGE.srcSet}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            fetchpriority="high"
          />
        )}
        <div className={`miami-hero__bg ${MIAMI_HERO_IMAGE ? "miami-hero__bg--photo" : ""}`} aria-hidden="true" />
        {!MIAMI_HERO_IMAGE && (
          <svg className="miami-hero__pitch" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="40,420 1160,420 900,70 300,70" />
              <line x1="170" y1="245" x2="1030" y2="245" />
              <ellipse cx="600" cy="245" rx="150" ry="46" />
              <polygon points="390,70 810,70 830,130 370,130" />
              <polygon points="250,420 950,420 900,340 300,340" />
            </g>
          </svg>
        )}
        {!MIAMI_HERO_IMAGE && <div className="miami-hero__beam miami-hero__beam--l" aria-hidden="true" />}
        {!MIAMI_HERO_IMAGE && <div className="miami-hero__beam miami-hero__beam--r" aria-hidden="true" />}

        <div className="relative z-10 max-w-[1200px] mx-auto px-5 lg:px-10 pt-16 pb-16 lg:pt-24 lg:pb-24 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full" style={{ background: "rgba(201,162,74,0.12)", border: "1px solid rgba(201,162,74,0.45)" }}>
            <span className="miami-pulse" aria-hidden="true" />
            <span className="font-cond font-bold uppercase tracking-[0.2em] text-[11px]" style={{ color: "#E8C877" }}>
              FOOTYUP College Combine · 2027
            </span>
          </div>
          <h1 className="miami-hero__title font-display text-white">
            <span className="miami-hero__kicker">FOOTYUP COLLEGE COMBINE</span>
            <span className="miami-hero__city">MIAMI</span>
            <span className="miami-hero__host">Hosted at <span style={{ color: "#E8C877" }}>Gulliver Prep</span></span>
          </h1>

          <div className="mt-9 flex flex-wrap justify-center gap-2.5">
            {camp.sessions.map((s) => (
              <span key={s.value} className="miami-chip"><strong>{s.short}</strong> · {s.dates.replace(", 2027", "")}</span>
            ))}
            <span className="miami-chip">{camp.ages}</span>
            <span className="miami-chip miami-chip--gold">{formatUSD(camp.sessions[0].price)}</span>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <SignUp />
            <button
              type="button"
              onClick={() => scrollToId("miami-included")}
              className="btn-arrow justify-center font-display tracking-wide text-white px-6 py-4 text-[20px] miami-ghost-btn"
            >
              <span>WHAT'S INCLUDED</span>
              <IconArrowRight size={20} className="arrow" />
            </button>
          </div>

          <div className="mt-7 inline-flex items-center gap-2.5 font-cond font-semibold uppercase tracking-[0.16em] text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            <IconLock size={13} />
            {statusLine}
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="bg-white px-5 lg:px-10 py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
          <div>
            <div className="eyebrow mb-4">The Combine</div>
            <h2 className="font-display text-ink leading-[0.95]" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)" }}>
              A PROFESSIONAL, COLLEGE-LEVEL EXPERIENCE FROM THE MOMENT THEY REGISTER.
            </h2>
            <p className="mt-6 text-fog text-[17px] leading-[1.6]" style={{ maxWidth: 560 }}>
              The FOOTYUP Miami College Combine is designed to give every player a professional, college-level experience from the moment they register — three days of high-level training, competition, performance testing and recruiting education in front of college coaches.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-ash border border-ash">
            {[
              { n: "3", l: "Days per combine" },
              { n: "A·B·C", l: "Training groups" },
              { n: "VALD", l: "Performance testing" },
              { n: "1 KIT", l: "Shipped to your door" },
            ].map((s) => (
              <div key={s.l} className="bg-white p-6 lg:p-8">
                <div className="font-display text-ink leading-none" style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)" }}>{s.n}</div>
                <div className="eyebrow mt-3">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section id="miami-included" className="miami-dark px-5 lg:px-10 py-20 lg:py-28" style={{ scrollMarginTop: 60 }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-[760px]">
            <div className="eyebrow mb-4" style={{ color: "#C9A24A" }}>What Every Player Gets</div>
            <h2 className="font-display text-white leading-[0.95]" style={{ fontSize: "clamp(2.25rem, 5vw, 4.25rem)" }}>
              EXPOSURE. DATA. <span className="miami-gold-text">KNOWLEDGE.</span>
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {INCLUDED.map(({ icon: Icon, t, d }) => (
              <div key={t} className="miami-feature">
                <div className="miami-feature__icon"><Icon size={22} /></div>
                <div className="mt-5 font-display text-white text-[24px] leading-none">{t}</div>
                <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.68)" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALD TESTING */}
      <section className="miami-vald px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="eyebrow" style={{ color: "#C9A24A" }}>Performance Testing</span>
              <span className="miami-vald__logo"><img src="public/uploads/images/sponsors/vald-logo.svg" alt="VALD Performance" loading="lazy" /></span>
            </div>
            <h2 className="mt-5 font-display text-white leading-[0.95]" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.75rem)" }}>
              MEASURED LIKE <span className="miami-gold-text">A PRO.</span>
            </h2>
            <p className="mt-6 text-[17px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 540 }}>
              Players will complete VALD performance testing, giving them measurable data on areas such as speed, power, strength, and athletic performance — the same technology used by professional and college programs.
            </p>
            <ul className="mt-8 flex flex-col" role="list">
              {VALD_TESTS.map((v) => (
                <li key={v.t} className="miami-vald__item">
                  <span className="font-display text-white text-[22px] leading-none">{v.t}</span>
                  <span className="font-cond font-semibold uppercase tracking-[0.12em] text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>{v.d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div ref={vald} className={`miami-report ${valdVisible ? "is-visible" : ""}`}>
            <div className="miami-report__head">
              <div>
                <div className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: "#C9A24A" }}>Player Performance Profile</div>
                <div className="font-display text-white text-[28px] leading-none mt-1">YOUR COMBINE DATA</div>
              </div>
              <span className="miami-report__badge">Sample</span>
            </div>
            <div className="miami-report__rows">
              {VALD_TESTS.map((v, i) => (
                <div key={v.t} className="miami-report__row">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-cond font-bold uppercase tracking-[0.14em] text-[12px] text-white">{v.t}</span>
                    <span className="font-cond uppercase tracking-[0.12em] text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{v.d}</span>
                  </div>
                  <div className="miami-report__track">
                    <div className="miami-report__fill" style={{ "--w": `${v.w}%`, transitionDelay: `${0.15 + i * 0.12}s` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="miami-report__foot">
              <span>Groups A · B · C</span>
              <span>Shared with your player profile</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT RUNS — group rotation */}
      <section className="bg-white px-5 lg:px-10 py-20 lg:py-24">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-10 lg:gap-16 items-center">
          <div>
            <div className="eyebrow mb-4">How It Runs</div>
            <h2 className="font-display text-ink leading-[0.95]" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)" }}>
              THREE GROUPS.<br />EVERY PLAYER SEES IT ALL.
            </h2>
            <p className="mt-6 text-fog text-[16px] leading-[1.65]" style={{ maxWidth: 520 }}>
              Each player will be assigned to Group A, B, or C. Group assignments determine which players they train and compete with, as well as when they take part in classroom sessions, VALD performance testing, and on-field activities. Groups rotate throughout the event so every player experiences each part of the combine.
            </p>
          </div>
          <div>
            <div className="miami-rot" role="table" aria-label="Example group rotation">
              <div className="miami-rot__row miami-rot__row--head" role="row">
                <span role="columnheader" />
                {["Block 1", "Block 2", "Block 3"].map((b) => <span key={b} role="columnheader">{b}</span>)}
              </div>
              {ROTATION.map((r) => (
                <div key={r.g} className="miami-rot__row" role="row">
                  <span role="rowheader" className="miami-rot__group font-display">{r.g}</span>
                  {r.blocks.map((b, i) => (
                    <span key={i} role="cell" className={`miami-rot__cell ${BLOCK[b].cls}`}>{BLOCK[b].label}</span>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-3 font-cond uppercase tracking-[0.12em] text-[11px] text-fog">
              Example rotation · Final schedules are shared with families before the combine
            </p>
          </div>
        </div>
      </section>

      {/* THE KIT */}
      <section className="miami-dark px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
          <div className="miami-kit">
            <img src="assets/footyup-goat-kit.jpeg" alt="Custom FOOTYUP × GOINGFORGOAT kit — black and gold jersey, socks, water bottle and towel" loading="lazy" />
          </div>
          <div>
            <div className="eyebrow mb-4" style={{ color: "#C9A24A" }}>Shipped To Your Door</div>
            <h2 className="font-display text-white leading-[0.95]" style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)" }}>
              YOUR CUSTOM <span className="miami-gold-text">COMBINE KIT.</span>
            </h2>
            <p className="mt-6 text-[16px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.72)" }}>
              Before the combine, every player will receive a custom FOOTYUP × GOINGFORGOAT kit shipped directly to their home. Players will also receive a combine check-in band and additional event gear upon arrival.
            </p>
            <ul className="mt-7 flex flex-col gap-3" role="list">
              {[
                "Custom FOOTYUP × GOINGFORGOAT kit — shipped home",
                "Combine check-in band — on arrival",
                "Additional event gear — on arrival",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-white">
                  <span className="miami-check" aria-hidden="true"><IconCheck size={12} strokeWidth={3} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* DATES & PRICING */}
      <section className="bg-white px-5 lg:px-10 py-20 lg:py-24">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center">
            <div className="eyebrow mb-4">Dates &amp; Pricing · {camp.venue}, {camp.address}</div>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: 0.95 }}>
              PICK YOUR COMBINE.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {camp.sessions.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => pickSession(s.value)}
                className={`miami-price ${session === s.value ? "miami-price--on" : ""}`}
                aria-pressed={session === s.value}
              >
                <span className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: "#D2122E" }}>{s.ages}</span>
                <span className="block font-display text-ink leading-none mt-3" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>{s.title.toUpperCase()}</span>
                <span className="block font-display text-fog text-[24px] mt-2">{s.dates}</span>
                <span className="miami-price__foot">
                  <span className="font-display text-ink text-[40px] leading-none">{formatUSD(s.price)}</span>
                  <span className="miami-price__cta">
                    {session === s.value ? "Selected" : "Select"} <IconArrowRight size={16} />
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-center text-[14px] text-fog">
            One price, everything included — training, testing, classroom sessions, player profile and your custom kit.
          </p>
        </div>
      </section>

      {/* REGISTRATION */}
      <section id="miami-register" className="bg-smoke px-5 lg:px-10 py-20 lg:py-24" style={{ scrollMarginTop: 60 }}>
        <div className="max-w-[760px] mx-auto">
          <div className="text-center">
            <div className="eyebrow mb-3">Registration</div>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              SECURE YOUR SPOT.
            </h2>
            <p className="mt-4 text-[15px] text-fog leading-[1.55]">
              {camp.venue} · Boys May 21–23 · Girls May 24–26 · {camp.ages} · {formatUSD(camp.sessions[0].price)}
            </p>
          </div>

          <div className="mt-10">
            {!status && (
              <div className="miami-gate miami-gate--loading" aria-busy="true">
                <div className="miami-gate__icon"><IconLock size={22} /></div>
                <p className="mt-5 font-cond uppercase tracking-[0.16em] text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>Checking registration…</p>
              </div>
            )}
            {status && !open && <MiamiCountdown opensAt={status.opensAt} now={now} />}
            {status && open && !unlocked && <MiamiCodeGate camp={camp} onUnlock={unlock} initialError={gateError} />}
            {status && open && unlocked && (
              <>
                {gated && (
                  <div className="miami-unlocked" role="status">
                    <IconCheck size={14} strokeWidth={3} />
                    Access code accepted — priority registration unlocked
                  </div>
                )}
                <MiamiForm camp={camp} accessCode={accessCode} session={session} setSession={setSession} onCodeRejected={gated ? relock : undefined} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* GOAL */}
      <section className="miami-dark px-5 lg:px-10 py-20 lg:py-24 text-center">
        <div className="max-w-[900px] mx-auto">
          <div className="eyebrow mb-5" style={{ color: "#C9A24A" }}>The Goal</div>
          <p className="font-display text-white leading-[1.02]" style={{ fontSize: "clamp(1.75rem, 3.6vw, 2.9rem)" }}>
            AN ORGANIZED, PROFESSIONAL RECRUITING ENVIRONMENT WHERE EVERY PLAYER LEAVES WITH <span className="miami-gold-text">EXPOSURE, PERFORMANCE DATA, RECRUITING KNOWLEDGE,</span> AND A TRUE COLLEGE COMBINE EXPERIENCE.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <SignUp />
          </div>
          <div className="mt-8 font-cond uppercase tracking-[0.14em] text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Questions? Email{" "}
            <a href="mailto:footyupp@outlook.com?subject=Miami%20College%20Combine" className="underline hover:text-white">footyupp@outlook.com</a>
          </div>
        </div>
      </section>

      <style>{`
        .miami-page { background: #0A0A0A; }
        .miami-gold-text {
          background: linear-gradient(90deg, #C9A24A 0%, #F3DC9A 55%, #C9A24A 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .miami-dark {
          background:
            radial-gradient(900px 500px at 0% 0%, rgba(201,162,74,0.10), transparent 60%),
            radial-gradient(900px 500px at 100% 100%, rgba(210,18,46,0.10), transparent 60%),
            #0A0A0A;
          color: #fff;
        }

        /* ---------- HERO ---------- */
        .miami-hero { min-height: calc(100vh - 72px); display: flex; align-items: center; background: #050807; }
        @media (max-width: 1023px) { .miami-hero { min-height: calc(100vh - 60px); } }
        .miami-hero__photo {
          position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0;
          object-fit: cover; object-position: 50% 55%;
          filter: saturate(0.9) contrast(1.05);
          animation: miami-photo-in 1.4s ease-out both, miami-photo-drift 28s ease-in-out 1.4s infinite alternate;
        }
        /* On phones, keep the field and main building in frame */
        @media (max-width: 767px) { .miami-hero__photo { object-position: 38% 55%; } }
        @keyframes miami-photo-in { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1.04); } }
        @keyframes miami-photo-drift { from { transform: scale(1.04); } to { transform: scale(1.09) translate3d(-1%, -0.6%, 0); } }
        .miami-hero__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(55% 45% at 50% 108%, rgba(201,162,74,0.22), transparent 70%),
            radial-gradient(70% 55% at 50% 40%, rgba(16,58,40,0.55), transparent 75%),
            linear-gradient(180deg, #050807 0%, #07110D 55%, #0A0A0A 100%);
        }
        /* Daytime aerial → heavy, centered darkening so white type stays crisp,
           with a touch of the brand's gold glow at the bottom. */
        .miami-hero__bg--photo {
          z-index: 1;
          background:
            radial-gradient(ellipse 70% 60% at 50% 48%, rgba(5,8,7,0.55) 0%, rgba(5,8,7,0) 75%),
            radial-gradient(55% 40% at 50% 108%, rgba(201,162,74,0.22), transparent 70%),
            linear-gradient(180deg, rgba(5,8,7,0.86) 0%, rgba(5,8,7,0.62) 35%, rgba(5,8,7,0.66) 65%, rgba(10,10,10,0.97) 100%);
        }
        .miami-hero__pitch {
          position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 62%;
          z-index: 1; color: rgba(255,255,255,0.10); pointer-events: none;
          -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 45%);
                  mask-image: linear-gradient(180deg, transparent 0%, #000 45%);
        }
        @media (max-width: 639px) { .miami-hero__pitch { color: rgba(255,255,255,0.055); height: 48%; } }
        .miami-hero__beam {
          position: absolute; top: -20%; z-index: 1; pointer-events: none;
          width: 46vw; height: 120%;
          background: conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(255,240,200,0.12) 12deg, transparent 26deg);
          filter: blur(6px);
          opacity: 0.9;
        }
        .miami-hero__beam--l { left: -6vw; transform: rotate(-14deg); }
        .miami-hero__beam--r { right: -6vw; transform: rotate(14deg) scaleX(-1); }
        .miami-hero__title { display: flex; flex-direction: column; align-items: center; margin-top: 28px; }
        .miami-hero__kicker {
          font-size: clamp(1.25rem, 3vw, 2.25rem); letter-spacing: 0.08em; line-height: 1;
          color: rgba(255,255,255,0.86);
          text-shadow: 0 2px 18px rgba(0,0,0,0.65);
        }
        .miami-hero__city {
          font-size: clamp(6.5rem, 30vw, 17rem); line-height: 0.82; letter-spacing: -0.01em;
          background: linear-gradient(180deg, #FFFFFF 0%, #F3E6C2 55%, #C9A24A 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          filter: drop-shadow(0 6px 28px rgba(0,0,0,0.55)) drop-shadow(0 18px 60px rgba(201,162,74,0.25));
        }
        .miami-hero__host {
          margin-top: 10px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.24em; font-size: clamp(13px, 1.6vw, 16px);
          color: rgba(255,255,255,0.88);
          text-shadow: 0 2px 14px rgba(0,0,0,0.7);
        }
        .miami-chip {
          font-family: "Barlow Condensed", sans-serif; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.14em; font-size: 13px;
          color: rgba(255,255,255,0.85);
          padding: 7px 14px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.05);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        }
        .miami-chip strong { color: #fff; font-weight: 800; }
        .miami-chip--gold { border-color: rgba(201,162,74,0.7); color: #E8C877; }
        .miami-ghost-btn { border: 1px solid rgba(255,255,255,0.45); background: rgba(255,255,255,0.04); transition: background 200ms ease, color 200ms ease; }
        .miami-ghost-btn:hover { background: #fff; color: #111; }
        .miami-pulse {
          display: inline-block; width: 7px; height: 7px; border-radius: 999px;
          background: #C9A24A; box-shadow: 0 0 0 3px rgba(201,162,74,0.25);
          animation: miami-pulse 1.6s ease-in-out infinite;
        }
        @keyframes miami-pulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(201,162,74,0.25); }
          50%     { box-shadow: 0 0 0 7px rgba(201,162,74,0.04); }
        }

        /* ---------- INCLUDED ---------- */
        .miami-feature {
          padding: 28px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          transition: border-color 300ms ease, background 300ms ease, transform 300ms ease;
        }
        .miami-feature:hover { border-color: rgba(201,162,74,0.5); background: rgba(201,162,74,0.05); transform: translateY(-3px); }
        .miami-feature__icon {
          width: 48px; height: 48px; display: inline-flex; align-items: center; justify-content: center;
          border-radius: 12px; color: #E8C877;
          background: rgba(201,162,74,0.10); border: 1px solid rgba(201,162,74,0.35);
        }

        /* ---------- VALD ---------- */
        .miami-vald {
          color: #fff;
          background:
            radial-gradient(800px 500px at 100% 50%, rgba(201,162,74,0.12), transparent 60%),
            linear-gradient(180deg, #0A0A0A 0%, #0E0E11 100%);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .miami-vald__logo { display: inline-flex; align-items: center; padding: 6px 10px; background: #fff; border-radius: 4px; }
        .miami-vald__logo img { height: 10px; width: auto; display: block; }
        .miami-vald__item {
          display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap;
          padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .miami-vald__item:first-child { border-top: 1px solid rgba(255,255,255,0.08); }
        .miami-report {
          position: relative;
          padding: 26px;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(201,162,74,0.30);
          box-shadow: 0 50px 90px -50px rgba(201,162,74,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .miami-report__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .miami-report__badge {
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.16em; font-size: 10px;
          padding: 4px 10px; border-radius: 999px; color: rgba(255,255,255,0.7);
          border: 1px dashed rgba(255,255,255,0.35);
        }
        .miami-report__rows { display: flex; flex-direction: column; gap: 20px; padding: 22px 0; }
        .miami-report__track {
          margin-top: 10px; height: 10px; border-radius: 999px; overflow: hidden;
          background:
            repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 10%),
            rgba(255,255,255,0.06);
        }
        .miami-report__fill {
          height: 100%; width: 0; border-radius: 999px;
          background: linear-gradient(90deg, #A8832F 0%, #C9A24A 45%, #F3DC9A 100%);
          box-shadow: 0 0 18px rgba(201,162,74,0.45);
          transition: width 1.1s cubic-bezier(.2,.7,.2,1);
        }
        .miami-report.is-visible .miami-report__fill { width: var(--w); }
        .miami-report__foot {
          display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08);
          font-family: "Barlow Condensed", sans-serif; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.14em; font-size: 11px; color: rgba(255,255,255,0.5);
        }

        /* ---------- ROTATION ---------- */
        .miami-rot { display: flex; flex-direction: column; gap: 8px; }
        .miami-rot__row { display: grid; grid-template-columns: 52px repeat(3, minmax(0, 1fr)); gap: 8px; align-items: stretch; }
        .miami-rot__row--head span {
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.16em; font-size: 11px; color: #757575;
          text-align: center;
        }
        .miami-rot__group {
          display: flex; align-items: center; justify-content: center;
          font-size: 30px; color: #fff; background: #111;
        }
        .miami-rot__cell {
          display: flex; align-items: center; justify-content: center; text-align: center;
          min-height: 64px; padding: 10px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em; font-size: 13px;
        }
        .miami-rot__cell--field { background: #D2122E; color: #fff; }
        .miami-rot__cell--vald  { background: #C9A24A; color: #111; }
        .miami-rot__cell--class { background: #F5F5F5; color: #111; border: 1px solid #E5E5E5; }

        /* ---------- KIT ---------- */
        .miami-kit {
          overflow: hidden; border-radius: 18px;
          border: 1px solid rgba(201,162,74,0.35);
          box-shadow: 0 50px 90px -50px rgba(201,162,74,0.4);
        }
        .miami-kit img { width: 100%; height: auto; display: block; }
        .miami-check {
          width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px;
          display: inline-flex; align-items: center; justify-content: center;
          background: #C9A24A; color: #111;
        }

        /* ---------- PRICING ---------- */
        .miami-price {
          display: block; width: 100%; text-align: left;
          padding: 28px; background: #F5F5F5; border: 1px solid #E5E5E5;
          transition: border-color 200ms ease, background 200ms ease, box-shadow 200ms ease, transform 200ms ease;
        }
        .miami-price:hover { background: #fff; border-color: #111; transform: translateY(-2px); }
        .miami-price--on { background: #fff; border-color: #D2122E; box-shadow: inset 0 0 0 1px #D2122E; }
        .miami-price__foot { margin-top: 22px; padding-top: 18px; border-top: 1px solid #E5E5E5; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .miami-price__cta {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.03em;
          color: #fff; background: #D2122E; padding: 10px 16px;
        }
        .miami-price--on .miami-price__cta { background: #111; }

        /* ---------- GATE ---------- */
        .miami-gate {
          text-align: center; color: #fff;
          padding: 40px 24px;
          background:
            radial-gradient(500px 260px at 50% 0%, rgba(201,162,74,0.16), transparent 70%),
            #0E0E11;
          border: 1px solid rgba(201,162,74,0.30);
        }
        @media (min-width: 640px) { .miami-gate { padding: 52px 40px; } }
        .miami-gate--loading { padding-top: 48px; padding-bottom: 48px; }
        .miami-gate__icon {
          width: 56px; height: 56px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center;
          border-radius: 999px; color: #E8C877;
          background: rgba(201,162,74,0.10); border: 1px solid rgba(201,162,74,0.45);
        }
        .miami-countdown { margin: 30px auto 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; max-width: 460px; }
        .miami-countdown__cell { padding: 14px 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10); }
        .miami-countdown__num { font-size: clamp(34px, 7vw, 48px); line-height: 1; color: #fff; }
        .miami-countdown__label {
          margin-top: 6px; font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.16em; font-size: 10px; color: rgba(255,255,255,0.5);
        }
        .miami-gate__form { margin: 28px auto 0; max-width: 460px; display: flex; flex-direction: column; gap: 10px; }
        @media (min-width: 480px) { .miami-gate__form { flex-direction: row; } }
        .miami-gate__input {
          flex: 1; min-width: 0;
          padding: 16px 18px; font-size: 18px; letter-spacing: 0.04em;
          background: #fff; color: #111; border: 1px solid #fff; border-radius: 0;
        }
        .miami-gate__input[aria-invalid="true"] { border-color: #D2122E; box-shadow: inset 0 0 0 1px #D2122E; }
        .miami-gate__link {
          display: inline-block; margin-top: 26px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px;
          color: #E8C877; text-decoration: underline;
        }
        .miami-gate__link:hover { color: #fff; }
        .miami-unlocked {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 28px; padding: 12px 16px;
          background: #ECFDF3; border: 1px solid #A7E3BE; color: #166534;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px;
        }

        /* ---------- FORM ---------- */
        .miami-fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
        .miami-fieldset__legend {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding-bottom: 14px; margin-bottom: 20px;
          border-bottom: 2px solid #111;
          font-family: "Bebas Neue", sans-serif; font-size: 26px; line-height: 1; color: #111;
        }
        .miami-fieldset__n { font-family: "Barlow Condensed", sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.16em; color: #D2122E; }
        .miami-fieldset__note { margin: -8px 0 18px; font-size: 14px; color: #757575; }
        .miami-choice {
          display: flex; align-items: center; gap: 14px;
          padding: 18px; cursor: pointer;
          background: #fff; border: 1px solid #111;
          transition: box-shadow 200ms ease, border-color 200ms ease;
        }
        .miami-choice:hover { box-shadow: inset 0 0 0 1px #111; }
        .miami-choice--on { border-color: #D2122E; box-shadow: inset 0 0 0 1px #D2122E; }
        .miami-choice:focus-within { outline: 2px solid #D2122E; outline-offset: 2px; }
        .miami-choice__radio {
          width: 20px; height: 20px; flex-shrink: 0; border-radius: 999px;
          border: 2px solid #111; background: #fff;
        }
        .miami-choice--on .miami-choice__radio { border-color: #D2122E; box-shadow: inset 0 0 0 4px #fff; background: #D2122E; }

        @media (prefers-reduced-motion: reduce) {
          .miami-pulse { animation: none !important; }
          .miami-hero__photo { animation: none !important; transform: none !important; }
          .miami-report__fill { transition: none !important; }
          .miami-feature, .miami-price, .miami-choice { transition: none !important; }
        }
      `}</style>
    </main>
  );
};

window.MiamiCombine = MiamiCombine;
