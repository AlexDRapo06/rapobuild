// HOME page
const HOME_COACH_PREVIEW = [
  { name: "ALEXANDER RAPO",first: "ALEXANDER",last: "RAPO",   school: "BABSON",         role: "NCAA D3",       position: "Founder",           src: "public/uploads/images/Alex Rapo.jpeg" },
  { name: "CHRIS CALDEN",  first: "CHRIS",    last: "CALDEN", school: "WATERTOWN HS",   role: "Varsity Coach", position: "CEO",               src: "public/uploads/images/new cofounder.PNG" },
  { name: "JAMIE KABUUSU", first: "JAMIE",    last: "KABUUSU",school: "DUKE",           role: "NCAA D1",       position: "Managing Director", src: "public/uploads/images/Jamie Kabuusu.jpeg" },
  { name: "ANTHONY RAPO",  first: "ANTHONY",  last: "RAPO",   school: "NORTHEASTERN",   role: "NCAA D1",       position: "Coach",             src: "public/uploads/images/Anthony Rap.jpeg" },
  { name: "BRYAN TORO",    first: "BRYAN",    last: "TORO",   school: "BOSTON COLLEGE", role: "NCAA D1",       position: "Coach",             src: "public/uploads/images/Brian Toro.jpeg" },
  { name: "ANGEL ORTEZ",   first: "ANGEL",    last: "ORTEZ",  school: "PRO FUTSAL",     role: "Professional",  position: "Coach",             src: "public/uploads/images/angel1.jpeg" },
  { name: "TJ KAHOLI",     first: "TJ",       last: "KAHOLI", school: "STANFORD",       role: "NCAA D1",       position: "Coach",             src: "public/uploads/images/Tj Kaholi.jpeg" },
];

const SPONSORS = [
  { name: "elete Electrolytes", src: "public/uploads/images/sponsors/elete-logo.png" },
  { name: "Molten", src: "public/uploads/images/sponsors/molten-logo.png" },
  { name: "Ice Shaker", src: "public/uploads/images/sponsors/iceshaker-logo.png" },
  { name: "QuickPlay", src: "public/uploads/images/sponsors/quickplay-logo.png", invert: true },
  { name: "G2G Protein Bar", src: "public/uploads/images/sponsors/g2g-logo.png" },
  { name: "VALD Performance", src: "public/uploads/images/sponsors/vald-logo.svg" },
];

const HOME_GUESTS = [
  { name: "PEYTON MILLER",      first: "PEYTON",    last: "MILLER",    school: "NER",        pos: "LEFT BACK",          posShort: "LB",   num: "09", color: "#012169", bio: "New England Revolution left back. The club's 12th Homegrown signing and youngest player in Revolution history to sign an MLS contract — already contributing with MLS starts, goals, and assists.", src: "public/uploads/images/peyton miller.jpeg" },
  { name: "OLGER ESCOBAR",      first: "OLGER",     last: "ESCOBAR",   school: "MONTRÉAL",   pos: "ATTACKING MID",      posShort: "AM",   num: "10", color: "#8C1515", bio: "Attacking midfielder / forward developed in the New England system. His MLS Homegrown Priority Rights were traded to CF Montréal, and he represents Guatemala on the senior international stage.", src: "public/uploads/images/Olger Escobar.png" },
  { name: "ERIC KLEIN",         first: "ERIC",      last: "KLEIN",     school: "NER",        pos: "MIDFIELDER",         posShort: "MID",  num: "04", color: "#A41034", bio: "New England Revolution Homegrown midfielder. Promoted to the MLS first team after being named Academy Player of the Year, with appearances across MLS, U.S. Open Cup, and U.S. youth national teams.", src: "public/uploads/images/Eric Klein.png" },
  { name: "CRISTIANO OLIVEIRA", first: "CRISTIANO", last: "OLIVEIRA",  school: "NER",        pos: "ATTACKING MID",      posShort: "AM",   num: "11", color: "#00563F", bio: "Attacking midfielder signed as a New England Homegrown on a long-term MLS deal. Developed through the Revolution Academy and MLS NEXT Pro, and capped as a U.S. youth international.", src: "public/uploads/images/Cristiano Oliveira .png" },
];

const Home = ({ setPage }) => {
  const [activeGuest, setActiveGuest] = React.useState(null);
  const coachRailRef = React.useRef(null);
  const scrollCoachRail = (dir) => {
    const rail = coachRailRef.current;
    if (!rail) return;
    const card = rail.querySelector(".coach-tile");
    const step = card ? card.getBoundingClientRect().width + 16 : 320;
    rail.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  const guest = activeGuest != null ? HOME_GUESTS[activeGuest] : null;

  React.useEffect(() => {
    if (guest == null) return;
    const onKey = (e) => { if (e.key === "Escape") setActiveGuest(null); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [guest]);

  return (
    <main id="main">
      {/* SPONSORS STRIP */}
      <section className="bg-ink text-white px-5 lg:px-10 py-2.5 lg:py-3 border-b border-white/5">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5">
          <span
            className="eyebrow shrink-0"
            style={{ color: "rgba(255,255,255,0.32)", fontSize: 10 }}
          >
            Our Sponsors
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {SPONSORS.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-center bg-white/90 rounded-sm px-2 py-1 opacity-70 hover:opacity-100 transition-opacity"
              >
                <img
                  src={s.src}
                  alt={s.name}
                  loading="lazy"
                  className="max-h-[13px] lg:max-h-[15px] w-auto object-contain"
                  style={s.invert ? { filter: "invert(1)" } : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="hero-video relative overflow-hidden bg-ink min-h-[calc(100vh-72px)] flex items-center">
        {/* Background video */}
        <video
          className="hero-video__media"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="public/uploads/videos/hero-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="public/uploads/videos/hero-bg.webm" type="video/webm" />
          <source src="public/uploads/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Layered overlays: left-weighted gradient for text legibility + subtle vignette + grain */}
        <div className="hero-video__scrim" aria-hidden="true" />
        <div className="hero-video__vignette" aria-hidden="true" />

        {/* Content */}
        <div className="hero-content-wrap relative z-10 w-full px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
          <div className="hero-content max-w-[640px]">
            <div className="hero-content__top">
              <div className="eyebrow mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span className="inline-block w-2 h-2 rounded-full mr-2.5 align-middle" style={{ background: "#D2122E", boxShadow: "0 0 0 4px rgba(210,18,46,0.25)" }} />
                Boston · Est. 2024 · Soccer &amp; Basketball
              </div>
              <h1
                className="font-display text-white"
                style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)", lineHeight: 0.92, letterSpacing: "-0.01em", textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}
              >
                TRAIN WITH<br />
                THE PROS.<br />
                <span style={{ color: "#D2122E" }}>REALLY.</span>
              </h1>
            </div>
            <div className="hero-content__bottom">
              <p className="hero-content__lead mt-7 text-[18px] leading-[1.55]" style={{ maxWidth: 480, color: "rgba(255,255,255,0.88)", textShadow: "0 1px 12px rgba(0,0,0,0.35)" }}>
                Coached by ex-New England Revolution players and NCAA Division I starters from Duke, BC, and Northeastern. Private training booking now — camps returning soon.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <RedButton onClick={() => setPage("privateTraining")}>SOCCER PRIVATE TRAINING</RedButton>
                <button
                  type="button"
                  onClick={() => setPage("basketball")}
                  className="btn-arrow font-display tracking-wide text-white px-5 py-3 text-[16px] bg-[#F2662D] hover:bg-[#D8531F]"
                >
                  <span>BASKETBALL</span>
                  <IconArrowRight size={18} className="arrow" />
                </button>
                <OutlineButton onClick={() => setPage("coaches")} className="hero-outline-btn">MEET THE COACHES</OutlineButton>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .hero-video__media {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            z-index: 0;
            opacity: 0;
            animation: heroVideoFadeIn 1.2s ease-out 0.15s forwards, heroVideoDrift 24s ease-in-out 1.2s infinite alternate;
            will-change: opacity, transform;
          }
          @keyframes heroVideoFadeIn {
            to { opacity: 1; }
          }
          @keyframes heroVideoDrift {
            from { transform: scale(1.04) translate3d(0, 0, 0); }
            to   { transform: scale(1.08) translate3d(-1.5%, -1%, 0); }
          }
          /* Left-weighted gradient so copy stays legible without darkening the whole frame */
          .hero-video__scrim {
            position: absolute;
            inset: 0;
            z-index: 1;
            background:
              linear-gradient(90deg, rgba(10,10,10,0.78) 0%, rgba(10,10,10,0.55) 35%, rgba(10,10,10,0.18) 70%, rgba(10,10,10,0.05) 100%),
              linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.55) 100%);
            pointer-events: none;
          }
          @media (max-width: 768px) {
            /* Darker top + bottom, lighter middle so the video is visible between text blocks */
            .hero-video__scrim {
              background:
                linear-gradient(180deg,
                  rgba(0,0,0,0.88) 0%,
                  rgba(0,0,0,0.78) 18%,
                  rgba(0,0,0,0.32) 42%,
                  rgba(0,0,0,0.32) 58%,
                  rgba(0,0,0,0.78) 82%,
                  rgba(0,0,0,0.92) 100%);
            }
            .hero-video__media {
              opacity: 0;
              animation: heroVideoFadeIn 1.2s ease-out 0.15s forwards, heroVideoDrift 24s ease-in-out 1.2s infinite alternate;
              filter: brightness(0.85) saturate(1);
            }
            /* Push title up under nav, push paragraph + buttons down — video plays in the middle */
            .hero-video {
              min-height: calc(100vh - 60px);
              align-items: stretch;
            }
            .hero-content-wrap {
              padding-top: 18px;
              padding-bottom: 28px;
              display: flex;
              align-items: stretch;
            }
            .hero-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: calc(100vh - 60px - 46px);
            }
            .hero-content__top { padding-top: 4px; }
            .hero-content__lead { margin-top: 0; }
          }
          /* Subtle vignette */
          .hero-video__vignette {
            position: absolute;
            inset: 0;
            z-index: 2;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.4) 100%);
            pointer-events: none;
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-video__media { animation: none !important; opacity: 1 !important; transform: none !important; }
          }
          /* Outline button styled for dark video background */
          .hero-video .hero-outline-btn {
            border-color: rgba(255,255,255,0.6) !important;
            color: #ffffff !important;
            background: rgba(255,255,255,0.04);
            backdrop-filter: blur(2px);
          }
          .hero-video .hero-outline-btn:hover {
            background: #ffffff !important;
            color: #111111 !important;
            border-color: #ffffff !important;
          }
        `}</style>
      </section>

      {/* CREDENTIALS STRIP */}
      <section className="bg-ink text-white py-14 lg:py-16 px-5 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {[
            { n: "100+", l: "Private Clients" },
            { n: "8", l: "College Programs" },
            { n: "D1", l: "Coaching Staff" },
            { n: "EX-NER", l: "Professional Roots" },
          ].map((c, i, arr) => (
            <div
              key={c.l}
              className="flex flex-col items-center justify-center text-center px-4 py-6"
              style={{
                borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
              }}
            >
              <div className="font-display text-[56px] lg:text-[64px] leading-none">{c.n}</div>
              <div className="eyebrow mt-3" style={{ color: "rgba(255,255,255,0.55)" }}>{c.l}</div>
            </div>
          ))}
        </div>
        <style>{`@media (min-width: 1024px) {
          .home-cred-fix { display: none; }
        }`}</style>
      </section>

      {/* BASKETBALL PROMO — new vertical, top-of-page visibility */}
      <section className="bball-promo relative overflow-hidden px-5 lg:px-10 py-20 lg:py-24">
        <div className="bball-promo__bg" aria-hidden="true" />
        <div className="bball-promo__grid" aria-hidden="true" />
        <div className="bball-promo__glow" aria-hidden="true" />

        <div className="relative z-10 max-w-[1200px] mx-auto">
          <div className="bball-promo__inner">
            <div className="bball-promo__copy">
              <div className="inline-flex items-center gap-2.5 mb-5 px-4 py-2 rounded-full" style={{ background: "rgba(242,102,45,0.10)", border: "1px solid rgba(242,102,45,0.35)" }}>
                <span className="bball-promo__pulse" aria-hidden="true" />
                <span className="font-cond font-bold uppercase tracking-[0.2em] text-[11px]" style={{ color: "#ff8a4c" }}>
                  New — now offering basketball
                </span>
              </div>
              <h2 className="font-display text-white" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}>
                BASKETBALL IS <span className="bball-promo__accent">HERE</span>.
              </h2>
              <p className="mt-5 text-[16px] lg:text-[17px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 560 }}>
                Camps and private training led by Coach Mike — private sessions held in Walpole, MA. The same standards and energy you know from the pitch, now on the court.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPage("basketball")}
                  className="bball-promo__cta btn-arrow font-display tracking-wide px-6 py-3.5 text-[18px]"
                >
                  <span>EXPLORE BASKETBALL</span>
                  <IconArrowRight size={18} className="arrow" />
                </button>
              </div>

              {/* Feature pills */}
              <div className="mt-7 flex flex-wrap gap-2">
                {["Basketball Camps", "Private Training", "Walpole, MA"].map((t) => (
                  <span key={t} className="bball-promo__pill">{t}</span>
                ))}
              </div>
            </div>

            {/* Basketball glyph */}
            <div className="bball-promo__aside" aria-hidden="true">
              <div className="bball-promo__ball">
                <svg viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2.5" />
                  <line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" strokeWidth="2.5" />
                  <line x1="4" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M16 16 C40 40, 40 60, 16 84" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M84 16 C60 40, 60 60, 84 84" stroke="currentColor" strokeWidth="2.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .bball-promo { background: #0B0B0E; }
          .bball-promo__bg {
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background:
              radial-gradient(900px 500px at 12% 0%, rgba(242,102,45,0.16), transparent 60%),
              radial-gradient(700px 500px at 100% 100%, rgba(255,140,66,0.10), transparent 60%),
              linear-gradient(180deg, #0B0B0E 0%, #0A0A0A 100%);
          }
          .bball-promo__grid {
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background-image:
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 80px 80px;
            mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            opacity: 0.5;
          }
          .bball-promo__glow {
            position: absolute; z-index: 0;
            width: 520px; height: 520px; border-radius: 9999px;
            filter: blur(140px); pointer-events: none;
            top: -160px; right: -120px; background: rgba(242,102,45,0.22);
          }
          .bball-promo__accent {
            background: linear-gradient(90deg, #F2662D 0%, #FF8C42 55%, #FFB55C 100%);
            -webkit-background-clip: text; background-clip: text; color: transparent;
          }
          .bball-promo__pulse {
            display: inline-block; width: 7px; height: 7px; border-radius: 999px;
            background: #F2662D; box-shadow: 0 0 0 3px rgba(242,102,45,0.20);
            animation: bbp-pulse 1.6s ease-in-out infinite;
          }
          @keyframes bbp-pulse {
            0%,100% { box-shadow: 0 0 0 3px rgba(242,102,45,0.20); }
            50%     { box-shadow: 0 0 0 7px rgba(242,102,45,0.04); }
          }
          .bball-promo__cta {
            display: inline-flex; align-items: center; gap: 8px;
            background: #F2662D; color: #fff;
            transition: background-color 200ms ease;
          }
          .bball-promo__cta:hover { background: #D8531F; }
          .bball-promo__pill {
            font-family: "Barlow Condensed", sans-serif; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px;
            color: rgba(255,255,255,0.72);
            padding: 6px 12px; border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.03);
          }
          .bball-promo__inner {
            display: grid; grid-template-columns: 1fr; gap: 32px; align-items: center;
          }
          .bball-promo__aside { display: flex; justify-content: center; }
          .bball-promo__ball {
            width: min(280px, 62vw);
            color: rgba(242,102,45,0.7);
            filter: drop-shadow(0 24px 60px rgba(242,102,45,0.25));
          }
          .bball-promo__ball svg { width: 100%; height: auto; display: block; }
          @media (min-width: 1024px) {
            .bball-promo__inner { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 56px; }
          }
          @media (max-width: 1023px) {
            .bball-promo__aside { display: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .bball-promo__pulse { animation: none !important; }
          }
        `}</style>
      </section>

      {/* UPCOMING CAMPS — heads-up alert */}
      <section className="upcoming relative overflow-hidden px-5 lg:px-10 py-20 lg:py-28">
        <div className="upcoming__bg" aria-hidden="true" />
        <div className="upcoming__grid" aria-hidden="true" />
        <div className="upcoming__glow upcoming__glow--red" aria-hidden="true" />
        <div className="upcoming__glow upcoming__glow--gold" aria-hidden="true" />

        <div className="relative z-10 max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="text-center max-w-[760px] mx-auto">
            <div className="inline-flex items-center gap-2.5 mb-5 px-4 py-2 rounded-full" style={{ background: "rgba(210,18,46,0.10)", border: "1px solid rgba(210,18,46,0.35)" }}>
              <span className="upcoming__pulse" aria-hidden="true" />
              <span className="font-cond font-bold uppercase tracking-[0.2em] text-[11px]" style={{ color: "#ff6072" }}>
                Now open — Winter & Summer camp registration
              </span>
            </div>
            <h2 className="font-display text-white" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}>
              UPCOMING <span className="upcoming__accent">CAMPS</span>.
            </h2>
            <p className="mt-6 text-[16px] lg:text-[17px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)" }}>
              Two camps are open for registration — Winter Camp in Walpole this December, and two summer weeks at Victory Field in Watertown. More locations below are on the way; save the dates.
            </p>
          </div>

          {/* Location cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {[
              { tag: "Winter Camp", place: "WALPOLE", region: "Massachusetts", note: "Dec 27–31 · 9 AM–1 PM", accent: "#D2122E", page: "winterCamp" },
              { tag: "Summer 2027", place: "WATERTOWN", region: "Victory Field", note: "July 12–23 · 9 AM–2 PM", accent: "#C9A24A", page: "summerCamp" },
              { tag: "Summer 2027", place: "BB&N", region: "Cambridge, MA", note: "Dates TBA · Stay tuned", accent: "#C9A24A" },
              { tag: "Summer 2027 & Beyond", place: "DOVER", region: "Massachusetts · + more", note: "Locations expanding · Stay tuned", accent: "#D2122E" },
            ].map((c) => {
              // Camps with a page are clickable; the rest are still just teasers.
              const Card = c.page ? "button" : "div";
              return (
                <Card
                  key={c.place}
                  type={c.page ? "button" : undefined}
                  onClick={c.page ? () => setPage(c.page) : undefined}
                  className={`upcoming__card text-left ${c.page ? "upcoming__card--live" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="upcoming__card-dot" style={{ background: c.accent }} aria-hidden="true" />
                    <span className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: c.accent }}>{c.tag}</span>
                  </div>
                  <div className="font-display text-white mt-4 leading-none" style={{ fontSize: "clamp(2rem, 3.4vw, 2.75rem)" }}>{c.place}</div>
                  <div className="mt-2 font-cond uppercase tracking-[0.14em] text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>{c.region}</div>
                  <div className="upcoming__card-note mt-5 pt-4 flex items-center gap-2 font-cond uppercase tracking-[0.12em] text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <IconMapPin size={13} /> {c.note}
                  </div>
                  {c.page && (
                    <div className="mt-3 flex items-center gap-2 font-cond font-bold uppercase tracking-[0.14em] text-[11px]" style={{ color: c.accent }}>
                      Register now <IconArrowRight size={13} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Camp CTAs */}
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
            <RedButton onClick={() => setPage("winterCamp")}>WINTER CAMP — $315</RedButton>
            <RedButton onClick={() => setPage("summerCamp")}>SUMMER CAMP — $415/WEEK</RedButton>
          </div>

          {/* Notify */}
          <div className="mt-10 text-center font-cond uppercase tracking-[0.14em] text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Want first dibs? Email{" "}
            <a href="mailto:footyupp@outlook.com" className="upcoming__link">footyupp@outlook.com</a>
            {" "}to get notified.
          </div>
        </div>

        <style>{`
          .upcoming { background: #0A0A0A; }
          .upcoming__bg {
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background:
              radial-gradient(900px 500px at 50% 0%, rgba(210,18,46,0.18), transparent 60%),
              radial-gradient(800px 500px at 100% 100%, rgba(201,162,74,0.12), transparent 60%),
              linear-gradient(180deg, #0A0A0A 0%, #101013 100%);
          }
          .upcoming__grid {
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background-image:
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 80px 80px;
            mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            opacity: 0.55;
          }
          .upcoming__glow {
            position: absolute; z-index: 0;
            width: 480px; height: 480px; border-radius: 9999px;
            filter: blur(130px); pointer-events: none;
          }
          .upcoming__glow--red  { top: -160px; left: -120px; background: rgba(210,18,46,0.30); }
          .upcoming__glow--gold { bottom: -180px; right: -120px; background: rgba(201,162,74,0.16); }
          .upcoming__accent {
            background: linear-gradient(90deg, #D2122E 0%, #ff5066 55%, #C9A24A 100%);
            -webkit-background-clip: text; background-clip: text; color: transparent;
          }
          .upcoming__pulse {
            display: inline-block; width: 7px; height: 7px; border-radius: 999px;
            background: #D2122E; box-shadow: 0 0 0 3px rgba(210,18,46,0.20);
            animation: upcoming-pulse 1.6s ease-in-out infinite;
          }
          @keyframes upcoming-pulse {
            0%,100% { box-shadow: 0 0 0 3px rgba(210,18,46,0.20); }
            50%     { box-shadow: 0 0 0 7px rgba(210,18,46,0.04); }
          }
          .upcoming__card {
            display: block;
            width: 100%;
            padding: 24px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 16px;
            backdrop-filter: blur(8px);
            text-align: left;
            transition: border-color 300ms ease, background 300ms ease, transform 300ms ease;
          }
          /* Only camps with a live page react to hover — the rest are teasers. */
          .upcoming__card--live { cursor: pointer; }
          .upcoming__card--live:hover {
            border-color: rgba(210,18,46,0.45);
            background: rgba(210,18,46,0.06);
            transform: translateY(-3px);
          }
          .upcoming__card-dot {
            width: 6px; height: 6px; border-radius: 999px;
            box-shadow: 0 0 0 3px rgba(210,18,46,0.15);
          }
          .upcoming__card-note { border-top: 1px solid rgba(255,255,255,0.08); }
          .upcoming__link { color: #ff6072; text-decoration: underline; }
          .upcoming__link:hover { color: #fff; }
          @media (prefers-reduced-motion: reduce) {
            .upcoming__card, .upcoming__pulse { transition: none !important; animation: none !important; }
          }
        `}</style>
      </section>

      {/* COACH PREVIEW GRID — premium dark editorial */}
      <section className="coach-section relative overflow-hidden py-20 lg:py-28 px-5 lg:px-10">
        {/* Atmospheric backdrop */}
        <div className="coach-section__bg" aria-hidden="true" />
        <div className="coach-section__grid-pattern" aria-hidden="true" />
        <div className="coach-section__glow coach-section__glow--red" aria-hidden="true" />
        <div className="coach-section__glow coach-section__glow--gold" aria-hidden="true" />

        <div className="relative z-10 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 lg:mb-16">
            <div className="max-w-[820px]">
              <div className="inline-flex items-center gap-3 mb-5">
                <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, transparent, #D2122E)" }} />
                <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#D2122E" }}>
                  01 — The Staff
                </span>
              </div>
              <h2
                className="font-display text-white"
                style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}
              >
                MEET THE <span className="coach-section__title-accent">COACHES</span>.
              </h2>
              <p className="mt-6 text-[16px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.68)", maxWidth: 560 }}>
                Active NCAA Division I starters and ex–New England Revolution professionals. Every coach on this card is on the field with your kid this summer.
              </p>
            </div>
            <div className="flex items-center gap-4 lg:pb-3">
              <div className="font-display text-[44px] lg:text-[56px] leading-none text-white">
                0{HOME_COACH_PREVIEW.length}
              </div>
              <div className="flex flex-col">
                <span className="font-cond font-bold uppercase tracking-[0.18em] text-[11px] text-white/85">Coaches</span>
                <span className="font-cond uppercase tracking-[0.14em] text-[10px] text-white/45">On the field daily</span>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="coach-rail-wrap">
            <button
              type="button"
              onClick={() => scrollCoachRail(-1)}
              className="coach-rail-nav coach-rail-nav--prev"
              aria-label="Scroll coaches left"
            >
              <IconArrowRight size={18} className="coach-rail-nav__icon coach-rail-nav__icon--flip" />
            </button>
            <button
              type="button"
              onClick={() => scrollCoachRail(1)}
              className="coach-rail-nav coach-rail-nav--next"
              aria-label="Scroll coaches right"
            >
              <IconArrowRight size={18} className="coach-rail-nav__icon" />
            </button>
            <ul ref={coachRailRef} className="coach-rail" role="list">
              {HOME_COACH_PREVIEW.map((c, i) => (
                <li key={c.name} className="coach-tile">
                  <article className="coach-tile__inner group">
                    {/* Image */}
                    <div className="coach-tile__media">
                      <img
                        src={encodeURI(c.src)}
                        alt={`Portrait of coach ${c.name}`}
                        loading="lazy"
                      />
                    </div>

                    {/* Color wash + bottom scrim */}
                    <div className="coach-tile__wash" aria-hidden="true" />
                    <div className="coach-tile__scrim" aria-hidden="true" />

                    {/* Top corner: index */}
                    <div className="coach-tile__index">
                      <span className="coach-tile__dot" aria-hidden="true" />
                      <span>{String(i + 1).padStart(2, "0")} / 0{HOME_COACH_PREVIEW.length}</span>
                    </div>

                    {/* Top-right: school chip (glass) */}
                    {c.school && (
                      <div className="coach-tile__chip">{c.school}</div>
                    )}

                    {/* Bottom info panel */}
                    <div className="coach-tile__info">
                      <div className="coach-tile__name">
                        <span className="coach-tile__name-first">{c.first}</span>
                        <span className="coach-tile__name-last">{c.last}</span>
                      </div>
                      <div className="coach-tile__meta">
                        <span className="coach-tile__pos">{c.position}</span>
                        <span className="coach-tile__sep" aria-hidden="true">/</span>
                        <span className="coach-tile__role">{c.role}</span>
                      </div>
                    </div>

                    {/* Hover bottom red bar */}
                    <div className="coach-tile__bar" aria-hidden="true" />
                  </article>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-10 lg:mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="font-cond uppercase tracking-[0.14em] text-[12px] text-white/45">
              Swipe / scroll to see all
            </div>
            <button
              onClick={() => setPage("coaches")}
              className="coach-cta font-display tracking-wide"
            >
              <span>VIEW FULL COACHING STAFF</span>
              <IconArrowRight size={18} className="arrow" />
            </button>
          </div>
        </div>

        <style>{`
          .coach-section {
            background: #0A0A0A;
          }
          /* Layered radial backdrop */
          .coach-section__bg {
            position: absolute; inset: 0; z-index: 0;
            background:
              radial-gradient(1100px 600px at 12% 8%, rgba(210,18,46,0.18), transparent 60%),
              radial-gradient(900px 500px at 92% 18%, rgba(201,162,74,0.10), transparent 60%),
              linear-gradient(180deg, #0A0A0A 0%, #111114 100%);
            pointer-events: none;
          }
          /* Faint grid pattern */
          .coach-section__grid-pattern {
            position: absolute; inset: 0; z-index: 0;
            background-image:
              linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 80px 80px;
            mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
            opacity: 0.6;
            pointer-events: none;
          }
          /* Soft accent glows */
          .coach-section__glow {
            position: absolute; z-index: 0;
            width: 480px; height: 480px;
            border-radius: 9999px;
            filter: blur(120px);
            pointer-events: none;
          }
          .coach-section__glow--red  { top: -120px; left: -120px; background: rgba(210,18,46,0.35); }
          .coach-section__glow--gold { bottom: -160px; right: -120px; background: rgba(201,162,74,0.18); }

          .coach-section__title-accent {
            background: linear-gradient(90deg, #D2122E 0%, #ff5066 60%, #C9A24A 100%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          /* Card rail: horizontal scroll on mobile, equal grid on desktop */
          .coach-rail-wrap {
            position: relative;
            margin: 0 -20px;
            padding: 0 20px;
          }
          .coach-rail {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: calc((100% - 12px) / 2);
            gap: 12px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 8px;
            scrollbar-width: none;
            scroll-behavior: smooth;
          }
          .coach-rail::-webkit-scrollbar { display: none; }
          .coach-tile { scroll-snap-align: start; list-style: none; }
          @media (min-width: 640px) {
            .coach-rail { grid-auto-columns: 46%; gap: 14px; }
          }
          @media (min-width: 1024px) {
            .coach-rail-wrap { margin: 0; padding: 0; }
            .coach-rail {
              grid-auto-columns: calc((100% - 16px * 4) / 5);
              gap: 16px;
              padding-bottom: 0;
              scroll-padding-left: 0;
            }
          }
          /* Scroll arrows */
          .coach-rail-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 5;
            width: 38px;
            height: 38px;
            border-radius: 9999px;
            background: rgba(15,15,17,0.85);
            border: 1px solid rgba(255,255,255,0.14);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
          }
          .coach-rail-nav:hover {
            background: #D2122E;
            border-color: #D2122E;
            transform: translateY(-50%) scale(1.05);
          }
          .coach-rail-nav--prev { left: 6px; }
          .coach-rail-nav--next { right: 6px; }
          .coach-rail-nav__icon--flip { transform: rotate(180deg); }
          @media (min-width: 1024px) {
            .coach-rail-nav { width: 44px; height: 44px; }
            .coach-rail-nav--prev { left: -22px; }
            .coach-rail-nav--next { right: -22px; }
          }

          /* Tile */
          .coach-tile__inner {
            position: relative;
            aspect-ratio: 3 / 4;
            overflow: hidden;
            border-radius: 18px;
            background: #15151a;
            box-shadow:
              0 1px 0 rgba(255,255,255,0.06) inset,
              0 0 0 1px rgba(255,255,255,0.06),
              0 30px 60px -30px rgba(0,0,0,0.6);
            transition: transform 600ms cubic-bezier(.2,.7,.2,1), box-shadow 600ms ease;
            isolation: isolate;
          }
          .coach-tile__inner:hover,
          .coach-tile__inner:focus-within {
            transform: translateY(-6px);
            box-shadow:
              0 1px 0 rgba(255,255,255,0.08) inset,
              0 0 0 1px rgba(210,18,46,0.45),
              0 40px 80px -30px rgba(210,18,46,0.35);
          }

          .coach-tile__media {
            position: absolute; inset: 0; z-index: 0;
            overflow: hidden;
          }
          .coach-tile__media img {
            width: 100%; height: 100%;
            object-fit: cover;
            object-position: center 18%;
            filter: saturate(0.55) contrast(1.05) brightness(0.95);
            transform: scale(1.04);
            transition: filter 700ms ease, transform 1200ms cubic-bezier(.2,.7,.2,1);
          }
          .coach-tile__inner:hover .coach-tile__media img {
            filter: saturate(1.1) contrast(1.05) brightness(1);
            transform: scale(1.08);
          }

          /* Color wash that fades on hover */
          .coach-tile__wash {
            position: absolute; inset: 0; z-index: 1;
            background:
              linear-gradient(180deg, rgba(10,10,10,0.05) 0%, rgba(10,10,10,0.0) 35%),
              linear-gradient(140deg, rgba(210,18,46,0.20) 0%, rgba(0,0,0,0) 55%);
            mix-blend-mode: multiply;
            transition: opacity 600ms ease;
            pointer-events: none;
          }
          .coach-tile__inner:hover .coach-tile__wash { opacity: 0.4; }

          .coach-tile__scrim {
            position: absolute; inset: 0; z-index: 2;
            background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.92) 100%);
            pointer-events: none;
          }

          .coach-tile__index {
            position: absolute; top: 14px; left: 14px; z-index: 3;
            display: inline-flex; align-items: center; gap: 8px;
            font-family: "Barlow Condensed", system-ui, sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 11px;
            color: rgba(255,255,255,0.85);
            padding: 5px 10px 5px 8px;
            background: rgba(255,255,255,0.06);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 999px;
          }
          .coach-tile__dot {
            width: 6px; height: 6px; border-radius: 999px;
            background: #D2122E;
            box-shadow: 0 0 0 3px rgba(210,18,46,0.25);
          }

          .coach-tile__chip {
            position: absolute; top: 14px; right: 14px; z-index: 3;
            font-family: "Barlow Condensed", system-ui, sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 10px;
            color: #fff;
            padding: 5px 10px;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 6px;
            max-width: 60%;
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Glass info panel */
          .coach-tile__info {
            position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 3;
            padding: 14px 16px 14px 16px;
            color: #fff;
            background: linear-gradient(180deg, rgba(20,20,24,0.55) 0%, rgba(20,20,24,0.78) 100%);
            backdrop-filter: blur(14px) saturate(140%);
            -webkit-backdrop-filter: blur(14px) saturate(140%);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 12px;
            transform: translateY(0);
            transition: transform 500ms cubic-bezier(.2,.7,.2,1), border-color 500ms ease, background 500ms ease;
          }
          .coach-tile__inner:hover .coach-tile__info {
            transform: translateY(-4px);
            border-color: rgba(210,18,46,0.45);
            background: linear-gradient(180deg, rgba(20,20,24,0.62) 0%, rgba(15,15,18,0.85) 100%);
          }

          .coach-tile__name {
            display: flex; flex-direction: column;
            line-height: 0.92;
            letter-spacing: -0.01em;
          }
          .coach-tile__name-first {
            font-family: "Bebas Neue", "Oswald", system-ui, sans-serif;
            font-size: clamp(20px, 1.6vw, 26px);
            color: rgba(255,255,255,0.6);
          }
          .coach-tile__name-last {
            font-family: "Bebas Neue", "Oswald", system-ui, sans-serif;
            font-size: clamp(26px, 2.4vw, 36px);
            color: #fff;
          }

          .coach-tile__meta {
            display: flex; align-items: center; gap: 8px;
            margin-top: 10px;
            font-family: "Barlow Condensed", system-ui, sans-serif;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-size: 11px;
          }
          .coach-tile__pos { color: #fff; }
          .coach-tile__sep { color: rgba(255,255,255,0.3); }
          .coach-tile__role { color: #D2122E; }

          /* Bottom red bar that sweeps in on hover */
          .coach-tile__bar {
            position: absolute; left: 0; right: 0; bottom: 0; height: 3px; z-index: 4;
            background: linear-gradient(90deg, #D2122E 0%, #ff5066 50%, #C9A24A 100%);
            transform: scaleX(0);
            transform-origin: left center;
            transition: transform 600ms cubic-bezier(.2,.7,.2,1);
          }
          .coach-tile__inner:hover .coach-tile__bar { transform: scaleX(1); }

          /* CTA button */
          .coach-cta {
            display: inline-flex; align-items: center; gap: 12px;
            padding: 14px 22px;
            font-size: 15px;
            color: #fff;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 999px;
            backdrop-filter: blur(8px);
            transition: background 300ms ease, border-color 300ms ease, color 300ms ease, transform 300ms ease;
          }
          .coach-cta:hover {
            background: #D2122E;
            border-color: #D2122E;
            color: #fff;
            transform: translateX(2px);
          }
          .coach-cta .arrow { transition: transform 300ms ease; }
          .coach-cta:hover .arrow { transform: translateX(4px); }

          @media (prefers-reduced-motion: reduce) {
            .coach-tile__inner, .coach-tile__media img, .coach-tile__info, .coach-tile__bar, .coach-cta { transition: none !important; }
          }
        `}</style>
      </section>


      {/* GUEST APPEARANCES — compact glow tiles, click to pop */}
      <section
        className="guests-mini relative overflow-hidden px-5 lg:px-10 py-14 lg:py-20"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
          e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        {/* Top + bottom hairline dividers */}
        <div className="guests-mini__divider guests-mini__divider--top" aria-hidden="true" />
        <div className="guests-mini__divider guests-mini__divider--bot" aria-hidden="true" />

        {/* Layered backdrop */}
        <div className="guests-mini__bg" aria-hidden="true" />
        <div className="guests-mini__grid-bg" aria-hidden="true" />
        <div className="guests-mini__corner guests-mini__corner--tl" aria-hidden="true" />
        <div className="guests-mini__corner guests-mini__corner--br" aria-hidden="true" />
        <div className="guests-mini__spotlight" aria-hidden="true" />

        <div className="relative z-10 max-w-[1400px] mx-auto">
          {/* Tight header */}
          <div className="flex items-end justify-between gap-6 mb-6 lg:mb-7">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="block w-1.5 h-1.5 rounded-full" style={{ background: "#D2122E" }} />
                <span className="font-cond font-bold uppercase tracking-[0.22em] text-[10px]" style={{ color: "rgba(20,20,20,0.6)" }}>
                  ★ Drop-in guests this summer
                </span>
              </div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", lineHeight: 1, letterSpacing: "-0.005em", color: "#111" }}>
                GUEST <span className="guests-mini__accent">APPEARANCES.</span>
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 font-cond font-bold uppercase tracking-[0.18em] text-[10px]" style={{ color: "rgba(20,20,20,0.5)" }}>
              <span className="guests-mini__pulse" aria-hidden="true" />
              <span>Tap a card</span>
            </div>
          </div>

          {/* Glow tiles */}
          <ul className="guests-mini__grid" role="list">
            {HOME_GUESTS.map((g, i) => (
              <li key={g.name}>
                <button
                  type="button"
                  onClick={() => setActiveGuest(i)}
                  className="guest-tile"
                  style={{ "--school": g.color }}
                  aria-label={`Open profile for ${g.name}`}
                >
                  <span className="guest-tile__halo" aria-hidden="true" />
                  <span className="guest-tile__inner">
                    <img
                      className="guest-tile__img"
                      src={encodeURI(g.src)}
                      alt={`Portrait of ${g.name}`}
                      loading="lazy"
                    />
                    <span className="guest-tile__scrim" aria-hidden="true" />
                    <span className="guest-tile__shimmer" aria-hidden="true" />

                    {/* corner brackets */}
                    <span className="guest-tile__bracket guest-tile__bracket--tl" aria-hidden="true" />
                    <span className="guest-tile__bracket guest-tile__bracket--tr" aria-hidden="true" />
                    <span className="guest-tile__bracket guest-tile__bracket--bl" aria-hidden="true" />
                    <span className="guest-tile__bracket guest-tile__bracket--br" aria-hidden="true" />

                    <span className="guest-tile__pos">{g.posShort}</span>
                    <span className="guest-tile__num" aria-hidden="true">{g.num}</span>

                    <span className="guest-tile__caption">
                      <span className="guest-tile__name">{g.last}</span>
                      <span className="guest-tile__school">{g.school}</span>
                    </span>

                    <span className="guest-tile__cue">
                      <span>OPEN</span>
                      <span className="guest-tile__cue-arrow" aria-hidden="true">→</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <style>{`
          .guests-mini {
            background: #FBF6EC;
            --mx: 50%; --my: 50%;
          }
          /* Mesh gradient pack — peach + rose + gold + cream */
          .guests-mini__bg {
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background:
              radial-gradient(900px 600px at 12% -10%, rgba(255, 180, 170, 0.55), transparent 55%),
              radial-gradient(800px 500px at 92% 8%,  rgba(255, 218, 140, 0.55), transparent 55%),
              radial-gradient(1000px 700px at 50% 110%, rgba(255, 180, 200, 0.45), transparent 60%),
              radial-gradient(700px 500px at 0% 100%, rgba(210, 18, 46, 0.18), transparent 60%),
              radial-gradient(700px 500px at 100% 100%, rgba(201, 162, 74, 0.22), transparent 60%),
              linear-gradient(135deg, #FFF7EB 0%, #FBEFE0 50%, #FCEAE2 100%);
          }
          /* Faint grain for depth on top of the gradient */
          .guests-mini__grid-bg {
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px);
            background-size: 6px 6px;
            mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 85%);
            -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 85%);
            opacity: 0.7;
          }
          /* Subtle diagonal stripe accents in corners */
          .guests-mini__corner {
            position: absolute; z-index: 0; pointer-events: none;
            width: 240px; height: 240px;
          }
          .guests-mini__corner--tl {
            top: 0; left: 0;
            background: repeating-linear-gradient(45deg, transparent 0 14px, rgba(210,18,46,0.16) 14px 16px);
            mask-image: linear-gradient(135deg, rgba(0,0,0,1) 0%, transparent 70%);
            -webkit-mask-image: linear-gradient(135deg, rgba(0,0,0,1) 0%, transparent 70%);
          }
          .guests-mini__corner--br {
            bottom: 0; right: 0;
            background: repeating-linear-gradient(45deg, transparent 0 14px, rgba(201,162,74,0.22) 14px 16px);
            mask-image: linear-gradient(315deg, rgba(0,0,0,1) 0%, transparent 70%);
            -webkit-mask-image: linear-gradient(315deg, rgba(0,0,0,1) 0%, transparent 70%);
          }
          /* Cursor-following warm spotlight — feels like a sun spot */
          .guests-mini__spotlight {
            position: absolute; inset: 0; z-index: 0; pointer-events: none;
            background: radial-gradient(420px 420px at var(--mx) var(--my), rgba(255, 200, 130, 0.30), transparent 70%);
            mix-blend-mode: multiply;
            transition: background-position 200ms ease;
          }
          /* Top + bottom dividers — brand red→gold gradient hairlines, slightly thicker on light bg */
          .guests-mini__divider {
            position: absolute; left: 0; right: 0; height: 1px; z-index: 2; pointer-events: none;
            background: linear-gradient(90deg, transparent 0%, rgba(210,18,46,0.55) 35%, rgba(201,162,74,0.55) 65%, transparent 100%);
          }
          .guests-mini__divider--top { top: 0; }
          .guests-mini__divider--bot {
            bottom: 0;
            background: linear-gradient(90deg, transparent 0%, rgba(201,162,74,0.55) 35%, rgba(210,18,46,0.55) 65%, transparent 100%);
          }

          .guests-mini__accent {
            background: linear-gradient(90deg, #D2122E 0%, #8C1515 100%);
            -webkit-background-clip: text; background-clip: text;
            color: transparent;
          }
          .guests-mini__pulse {
            display: inline-block;
            width: 6px; height: 6px; border-radius: 999px;
            background: #D2122E;
            box-shadow: 0 0 0 3px rgba(210,18,46,0.18);
            animation: gm-pulse 1.6s ease-in-out infinite;
          }
          @keyframes gm-pulse {
            0%,100% { box-shadow: 0 0 0 3px rgba(210,18,46,0.18); }
            50%     { box-shadow: 0 0 0 6px rgba(210,18,46,0.04); }
          }

          /* Tile grid */
          .guests-mini__grid {
            list-style: none; padding: 0; margin: 0;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          @media (min-width: 1024px) {
            .guests-mini__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
          }

          /* Tile */
          .guest-tile {
            position: relative;
            display: block; width: 100%;
            padding: 2px;
            background: transparent;
            border: 0;
            border-radius: 16px;
            cursor: pointer;
            transform-style: preserve-3d;
            transition: transform 500ms cubic-bezier(.2,.7,.2,1);
            outline: none;
          }
          .guest-tile:hover { transform: translateY(-6px) rotateX(4deg) scale(1.02); }
          .guest-tile:focus-visible { outline: 2px solid var(--school); outline-offset: 4px; }

          /* Animated glow halo */
          .guest-tile__halo {
            position: absolute; inset: 0;
            border-radius: 16px;
            padding: 2px;
            background: conic-gradient(from var(--gh-angle, 0deg),
              transparent 0deg,
              var(--school) 80deg,
              rgba(255,255,255,0.85) 160deg,
              #D2122E 220deg,
              var(--school) 300deg,
              transparent 360deg);
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
                    mask-composite: exclude;
            opacity: 0.55;
            filter: blur(0.4px);
            animation: gh-spin 6s linear infinite;
            pointer-events: none;
          }
          .guest-tile:hover .guest-tile__halo { opacity: 1; animation-duration: 2.5s; filter: blur(0px) drop-shadow(0 0 14px var(--school)); }
          @property --gh-angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
          }
          @keyframes gh-spin {
            from { --gh-angle: 0deg; }
            to   { --gh-angle: 360deg; }
          }
          @supports not (background: conic-gradient(from var(--x, 0deg), red, blue)) {
            .guest-tile__halo { animation: gh-rotate 6s linear infinite; }
            @keyframes gh-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          }

          /* Inner card */
          .guest-tile__inner {
            display: block;
            position: relative;
            aspect-ratio: 1 / 1;
            overflow: hidden;
            border-radius: 14px;
            background: #15151a;
            box-shadow:
              0 1px 0 rgba(255,255,255,0.05) inset,
              0 14px 40px -18px rgba(0,0,0,0.6);
          }
          .guest-tile:hover .guest-tile__inner {
            box-shadow:
              0 1px 0 rgba(255,255,255,0.08) inset,
              0 24px 50px -18px var(--school),
              0 0 60px -10px var(--school);
          }
          .guest-tile__img {
            width: 100%; height: 100%;
            object-fit: cover; object-position: center 18%;
            filter: saturate(0.7) contrast(1.05) brightness(0.95);
            transform: scale(1.04);
            transition: filter 600ms ease, transform 900ms cubic-bezier(.2,.7,.2,1);
          }
          .guest-tile:hover .guest-tile__img {
            filter: saturate(1.15) contrast(1.05) brightness(1);
            transform: scale(1.08);
          }
          .guest-tile__scrim {
            position: absolute; inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%);
            pointer-events: none;
          }
          .guest-tile__shimmer {
            position: absolute; inset: 0;
            background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%);
            transform: translateX(-100%);
            transition: transform 900ms ease;
            mix-blend-mode: screen;
            pointer-events: none;
          }
          .guest-tile:hover .guest-tile__shimmer { transform: translateX(100%); }

          /* Corner brackets — sci-fi/HUD touch */
          .guest-tile__bracket {
            position: absolute; width: 14px; height: 14px;
            border-color: rgba(255,255,255,0.55);
            transition: border-color 300ms ease, width 300ms ease, height 300ms ease;
            pointer-events: none;
          }
          .guest-tile__bracket--tl { top: 8px; left: 8px;   border-top: 2px solid; border-left: 2px solid; }
          .guest-tile__bracket--tr { top: 8px; right: 8px;  border-top: 2px solid; border-right: 2px solid; }
          .guest-tile__bracket--bl { bottom: 8px; left: 8px;border-bottom: 2px solid; border-left: 2px solid; }
          .guest-tile__bracket--br { bottom: 8px; right: 8px; border-bottom: 2px solid; border-right: 2px solid; }
          .guest-tile:hover .guest-tile__bracket {
            border-color: var(--school);
            width: 18px; height: 18px;
          }

          .guest-tile__pos {
            position: absolute; top: 12px; left: 12px;
            font-family: "Barlow Condensed", sans-serif;
            font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.18em; font-size: 10px;
            color: #fff;
            padding: 4px 8px 3px;
            background: var(--school);
            border-radius: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          }
          .guest-tile__num {
            position: absolute; right: 8px; top: -4px;
            font-family: "Bebas Neue", sans-serif;
            font-size: clamp(56px, 7vw, 88px);
            line-height: 0.85;
            color: rgba(255,255,255,0.10);
            letter-spacing: -0.04em;
            user-select: none;
            pointer-events: none;
          }
          .guest-tile__caption {
            position: absolute; left: 12px; right: 12px; bottom: 12px;
            display: flex; flex-direction: column;
            color: #fff;
            line-height: 0.9;
          }
          .guest-tile__name {
            font-family: "Bebas Neue", sans-serif;
            font-size: clamp(20px, 2vw, 26px);
            letter-spacing: 0.01em;
          }
          .guest-tile__school {
            margin-top: 5px;
            font-family: "Barlow Condensed", sans-serif;
            font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.18em; font-size: 10px;
            color: var(--school);
            text-shadow: 0 0 12px color-mix(in oklab, var(--school) 50%, transparent);
          }
          .guest-tile__cue {
            position: absolute; right: 12px; bottom: 12px;
            display: inline-flex; align-items: center; gap: 6px;
            font-family: "Barlow Condensed", sans-serif;
            font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.18em; font-size: 10px;
            color: #fff;
            padding: 4px 8px;
            background: rgba(0,0,0,0.55);
            border: 1px solid rgba(255,255,255,0.16);
            border-radius: 999px;
            backdrop-filter: blur(6px);
            opacity: 0;
            transform: translateY(4px);
            transition: opacity 300ms ease, transform 300ms ease;
          }
          .guest-tile:hover .guest-tile__cue { opacity: 1; transform: translateY(0); }
          .guest-tile__cue-arrow { display: inline-block; transition: transform 300ms ease; }
          .guest-tile:hover .guest-tile__cue-arrow { transform: translateX(3px); }

          @media (prefers-reduced-motion: reduce) {
            .guest-tile, .guest-tile__halo, .guest-tile__img, .guest-tile__shimmer, .guest-tile__cue, .guests-mini__pulse {
              animation: none !important; transition: none !important;
            }
          }
        `}</style>
      </section>

      {/* FOOTY UP × US FOOTY PARTNERSHIP */}
      <section className="bg-smoke text-ink px-5 lg:px-10 py-20 lg:py-24 border-t border-black/10">
        <div className="max-w-[1200px] mx-auto">
          {/* Header: logos + meta */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10 justify-center text-center sm:text-left">
            <img
              src="assets/usfooty-logo.png"
              alt="US Footy logo"
              loading="lazy"
              className="h-[68px] lg:h-[84px] w-auto object-contain"
            />
            <div className="hidden sm:block w-px self-stretch bg-black/15" />
            <div>
              <div className="font-display flex items-baseline gap-3 justify-center sm:justify-start" style={{ color: "rgba(0,0,0,0.55)" }}>
                <span className="text-[22px] lg:text-[26px]">FOOTYUP ×</span>
                <span className="text-[40px] lg:text-[52px] leading-none text-ink">US FOOTY.</span>
              </div>
              <div className="mt-3 font-cond uppercase tracking-[0.18em] text-[12px] text-ink/70">
                @usfooty · 14,400+ followers · @footyup_
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-black/20" />
            <span className="font-cond font-bold uppercase tracking-[0.18em] text-[12px]">Official Media &amp; Training Partnership</span>
            <span className="h-px w-12 bg-black/20" />
          </div>

          {/* Tagline */}
          <div className="mt-10 text-center max-w-[820px] mx-auto">
            <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4.2vw, 3.6rem)", lineHeight: 0.98 }}>
              YOUR KID WORKS HARD.<br />IT'S TIME PEOPLE SAW IT.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.72)" }}>
              Join the Footy Up × US Footy partnership — media exposure, elite training, collab gear, and real recruiting visibility for your young athlete.
            </p>
          </div>

          {/* Three pillars */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-black/15">
            {[
              { n: "01", t: "MEDIA EXPOSURE", d: "Featured on @usfooty to 14,400+ fans, recruiters & scouts." },
              { n: "02", t: "ELITE TRAINING",  d: "Train with NCAA D1 + Academy players. Real coaching, real results." },
              { n: "03", t: "COLLAB GEAR",     d: "Exclusive Footy Up × US Footy kit. Rep the brand on the pitch." },
            ].map((p) => (
              <div key={p.n} className="px-2 md:px-8 text-center">
                <div className="font-display text-[18px]" style={{ color: "#C9A24A" }}>{p.n}</div>
                <div className="mt-1 h-px w-10 mx-auto" style={{ background: "#C9A24A" }} />
                <div className="mt-5 font-display text-[22px]">{p.t}</div>
                <p className="mt-3 text-[15px] leading-[1.55]" style={{ color: "rgba(0,0,0,0.7)", maxWidth: 280, marginInline: "auto" }}>
                  {p.d}
                </p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="mt-16">
            <div className="text-center font-display tracking-wide text-[20px] lg:text-[24px]">HOW IT WORKS</div>
            <div className="mt-6 max-w-[820px] mx-auto">
              {[
                { n: "01", t: "JOIN",         d: "Sign up at footyup.net and create your athlete's player profile." },
                { n: "02", t: "TRAIN",        d: "Book sessions with D1 + Academy coaches. Develop real skills." },
                { n: "03", t: "GET FEATURED", d: "Top performers get spotlighted on @usfooty — seen by 14,400+ fans." },
                { n: "04", t: "GET RECRUITED",d: "Gain real exposure to scouts, fans, and the soccer community." },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className="flex items-start gap-4 px-5 py-4 border-l-[3px]"
                  style={{
                    borderColor: "#C9A24A",
                    background: i % 2 === 0 ? "rgba(0,0,0,0.04)" : "transparent",
                  }}
                >
                  <div className="font-display text-[16px] tracking-wide text-ink/60 w-8 shrink-0">{s.n}</div>
                  <div>
                    <div className="font-display tracking-wide text-[16px]">{s.t}</div>
                    <div className="text-[14px] leading-[1.55]" style={{ color: "rgba(0,0,0,0.72)" }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <RedButton onClick={() => setPage("privateTraining")}>READY TO GET YOUR ATHLETE NOTICED?</RedButton>
          </div>
        </div>
      </section>

      {/* GUEST DETAIL MODAL */}
      {guest && (
        <div
          className="guest-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${guest.name} profile`}
          onClick={() => setActiveGuest(null)}
        >
          <div
            className="guest-modal__card"
            style={{ "--school": guest.color }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="guest-modal__close"
              onClick={() => setActiveGuest(null)}
              aria-label="Close"
            >×</button>

            <div className="guest-modal__media">
              <img
                src={encodeURI(guest.src)}
                alt={`Portrait of ${guest.name}`}
              />
              <div className="guest-modal__num" aria-hidden="true">{guest.num}</div>
              <div className="guest-modal__ribbon" aria-hidden="true" />
              <div className="guest-modal__pos">{guest.posShort}</div>
              <div className="guest-modal__schoolchip">
                <span className="guest-modal__schooldot" aria-hidden="true" />
                {guest.school}
              </div>
              <div className="guest-modal__stamp" aria-hidden="true">★ DROP-IN GUEST</div>
            </div>

            <div className="guest-modal__body">
              <div className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: guest.color }}>
                Guest Profile · No. {guest.num}
              </div>
              <h3 className="guest-modal__name">
                <span className="guest-modal__name-first">{guest.first}</span>
                <span className="guest-modal__name-last">{guest.last}</span>
              </h3>
              <p className="guest-modal__bio">{guest.bio}</p>

              <dl className="guest-modal__stats">
                <div>
                  <dt>Club</dt>
                  <dd>{guest.school}</dd>
                </div>
                <div>
                  <dt>Position</dt>
                  <dd>{guest.pos}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>MLS Pro</dd>
                </div>
              </dl>

              <div className="guest-modal__nav">
                <button
                  type="button"
                  className="guest-modal__navbtn"
                  onClick={() => setActiveGuest((activeGuest - 1 + HOME_GUESTS.length) % HOME_GUESTS.length)}
                  aria-label="Previous guest"
                >← Prev</button>
                <span className="guest-modal__counter">{String(activeGuest + 1).padStart(2, "0")} / 0{HOME_GUESTS.length}</span>
                <button
                  type="button"
                  className="guest-modal__navbtn"
                  onClick={() => setActiveGuest((activeGuest + 1) % HOME_GUESTS.length)}
                  aria-label="Next guest"
                >Next →</button>
              </div>
            </div>
          </div>

          <style>{`
            .guest-modal {
              position: fixed; inset: 0; z-index: 100;
              display: flex; align-items: center; justify-content: center;
              padding: 20px;
              background: rgba(5,5,7,0.78);
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
              animation: gm-fade 220ms ease-out;
            }
            @keyframes gm-fade { from { opacity: 0; } to { opacity: 1; } }

            .guest-modal__card {
              position: relative;
              width: 100%; max-width: 880px;
              max-height: 92vh;
              overflow: auto;
              display: grid;
              grid-template-columns: 1fr;
              background: #0F0F12;
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 22px;
              box-shadow:
                0 0 0 1px var(--school),
                0 30px 80px -20px rgba(0,0,0,0.7),
                0 0 120px -20px var(--school);
              animation: gm-pop 360ms cubic-bezier(.2,.7,.2,1);
            }
            @media (min-width: 760px) {
              .guest-modal__card { grid-template-columns: 1fr 1fr; }
            }
            @keyframes gm-pop {
              from { opacity: 0; transform: scale(0.92) translateY(8px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }

            .guest-modal__close {
              position: absolute; top: 12px; right: 12px; z-index: 5;
              width: 36px; height: 36px;
              display: inline-flex; align-items: center; justify-content: center;
              border-radius: 999px;
              background: rgba(0,0,0,0.55);
              border: 1px solid rgba(255,255,255,0.16);
              color: #fff;
              font-size: 20px; line-height: 1;
              cursor: pointer;
              backdrop-filter: blur(8px);
              transition: background 200ms ease, border-color 200ms ease, transform 200ms ease;
            }
            .guest-modal__close:hover {
              background: var(--school);
              border-color: var(--school);
              transform: rotate(90deg);
            }

            .guest-modal__media {
              position: relative;
              aspect-ratio: 4 / 5;
              overflow: hidden;
              background: #15151a;
              border-top-left-radius: 22px;
              border-top-right-radius: 22px;
            }
            @media (min-width: 760px) {
              .guest-modal__media {
                aspect-ratio: auto;
                border-top-right-radius: 0;
                border-bottom-left-radius: 22px;
              }
            }
            .guest-modal__media img {
              width: 100%; height: 100%;
              object-fit: cover; object-position: center 18%;
            }
            .guest-modal__ribbon {
              position: absolute; left: 0; top: 0; bottom: 0; width: 5px;
              background: var(--school);
              box-shadow: 0 0 24px var(--school);
            }
            .guest-modal__num {
              position: absolute; right: 14px; top: 4px;
              font-family: "Bebas Neue", sans-serif;
              font-size: clamp(120px, 18vw, 200px);
              line-height: 0.85;
              color: rgba(255,255,255,0.16);
              letter-spacing: -0.04em;
              user-select: none;
              pointer-events: none;
              text-shadow: 0 4px 24px rgba(0,0,0,0.4);
            }
            .guest-modal__pos {
              position: absolute; top: 14px; left: 14px;
              font-family: "Barlow Condensed", sans-serif;
              font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.18em; font-size: 11px;
              color: #fff;
              padding: 6px 10px 5px;
              background: var(--school);
              border-radius: 6px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }
            .guest-modal__schoolchip {
              position: absolute; top: 14px; right: 56px;
              display: inline-flex; align-items: center; gap: 6px;
              font-family: "Barlow Condensed", sans-serif;
              font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.16em; font-size: 10px;
              color: #fff;
              padding: 5px 9px 5px 7px;
              background: rgba(0,0,0,0.55);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255,0.14);
              border-radius: 999px;
            }
            .guest-modal__schooldot {
              width: 6px; height: 6px; border-radius: 999px;
              background: var(--school);
            }
            .guest-modal__stamp {
              position: absolute; left: 14px; bottom: 14px;
              font-family: "Barlow Condensed", sans-serif;
              font-weight: 800; text-transform: uppercase;
              letter-spacing: 0.28em; font-size: 10px;
              color: #fff;
              padding: 6px 12px;
              background: rgba(0,0,0,0.55);
              border: 1px dashed rgba(255,255,255,0.45);
              border-radius: 4px;
              backdrop-filter: blur(8px);
            }

            .guest-modal__body {
              padding: 28px 28px 26px;
              color: #fff;
            }
            .guest-modal__name {
              margin-top: 10px;
              display: flex; flex-direction: column;
              line-height: 0.88; letter-spacing: -0.015em;
            }
            .guest-modal__name-first {
              font-family: "Bebas Neue", sans-serif;
              font-size: clamp(20px, 2.3vw, 30px);
              color: rgba(255,255,255,0.55);
            }
            .guest-modal__name-last {
              font-family: "Bebas Neue", sans-serif;
              font-size: clamp(38px, 5vw, 56px);
              background: linear-gradient(180deg, #ffffff 0%, #d8d8dc 100%);
              -webkit-background-clip: text; background-clip: text;
              color: transparent;
            }
            .guest-modal__bio {
              margin-top: 18px;
              font-size: 15px; line-height: 1.65;
              color: rgba(255,255,255,0.78);
            }
            .guest-modal__stats {
              margin-top: 22px;
              display: grid; grid-template-columns: repeat(3, 1fr);
              border-top: 1px solid rgba(255,255,255,0.10);
              border-bottom: 1px solid rgba(255,255,255,0.10);
            }
            .guest-modal__stats > div { padding: 12px 14px 12px 0; }
            .guest-modal__stats > div + div {
              padding-left: 14px;
              border-left: 1px solid rgba(255,255,255,0.10);
            }
            .guest-modal__stats dt {
              font-family: "Barlow Condensed", sans-serif;
              font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.14em; font-size: 10px;
              color: rgba(255,255,255,0.45);
            }
            .guest-modal__stats dd {
              margin: 5px 0 0 0;
              font-family: "Barlow Condensed", sans-serif;
              font-weight: 600; text-transform: uppercase;
              letter-spacing: 0.06em; font-size: 13.5px;
              color: #fff;
            }
            .guest-modal__nav {
              margin-top: 22px;
              display: flex; align-items: center; justify-content: space-between; gap: 10px;
            }
            .guest-modal__navbtn {
              font-family: "Barlow Condensed", sans-serif;
              font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.18em; font-size: 11px;
              color: #fff;
              padding: 8px 14px;
              background: rgba(255,255,255,0.05);
              border: 1px solid rgba(255,255,255,0.14);
              border-radius: 999px;
              cursor: pointer;
              transition: background 200ms ease, border-color 200ms ease, transform 200ms ease;
            }
            .guest-modal__navbtn:hover {
              background: var(--school);
              border-color: var(--school);
            }
            .guest-modal__counter {
              font-family: "Barlow Condensed", sans-serif;
              font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.18em; font-size: 11px;
              color: rgba(255,255,255,0.55);
            }
          `}</style>
        </div>
      )}
    </main>
  );
};

window.Home = Home;
