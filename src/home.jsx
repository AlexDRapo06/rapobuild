// HOME page
const HOME_COACH_PREVIEW = [
  { name: "ALEXANDER RAPO",first: "ALEXANDER",last: "RAPO",   school: "BABSON",         role: "NCAA D1",      position: "Founder",   src: "public/uploads/images/Alex Rapo.jpeg" },
  { name: "JAMIE KABUUSU", first: "JAMIE",    last: "KABUUSU",school: "DUKE",           role: "NCAA D1",      position: "Coach",     src: "public/uploads/images/Jamie Kabuusu.jpeg" },
  { name: "ANTHONY RAPO",  first: "ANTHONY",  last: "RAPO",   school: "NORTHEASTERN",   role: "NCAA D1",      position: "Coach",     src: "public/uploads/images/Anthony Rap.jpeg" },
  { name: "BRYAN TORO",    first: "BRYAN",    last: "TORO",   school: "BOSTON COLLEGE", role: "NCAA D1",      position: "Coach",     src: "public/uploads/images/Brian Toro.jpeg" },
  { name: "ANGEL ORTEZ",   first: "ANGEL",    last: "ORTEZ",  school: "PRO FUTSAL",     role: "Professional", position: "Coach",     src: "public/uploads/images/angel1.jpeg" },
];

const HOME_GUESTS = [
  { name: "PEYTON MILLER",      first: "PEYTON",    last: "MILLER",    school: "NER",        pos: "LEFT BACK",          posShort: "LB",   num: "09", color: "#012169", bio: "New England Revolution left back. The club's 12th Homegrown signing and youngest player in Revolution history to sign an MLS contract — already contributing with MLS starts, goals, and assists.", src: "public/uploads/images/peyton miller.jpeg" },
  { name: "OLGER ESCOBAR",      first: "OLGER",     last: "ESCOBAR",   school: "MONTRÉAL",   pos: "ATTACKING MID",      posShort: "AM",   num: "10", color: "#8C1515", bio: "Attacking midfielder / forward developed in the New England system. His MLS Homegrown Priority Rights were traded to CF Montréal, and he represents Guatemala on the senior international stage.", src: "public/uploads/images/Olger Escobar.png" },
  { name: "ERIC KLEIN",         first: "ERIC",      last: "KLEIN",     school: "NER",        pos: "MIDFIELDER",         posShort: "MID",  num: "04", color: "#A41034", bio: "New England Revolution Homegrown midfielder. Promoted to the MLS first team after being named Academy Player of the Year, with appearances across MLS, U.S. Open Cup, and U.S. youth national teams.", src: "public/uploads/images/Eric Klein.png" },
  { name: "CRISTIANO OLIVEIRA", first: "CRISTIANO", last: "OLIVEIRA",  school: "NER",        pos: "ATTACKING MID",      posShort: "AM",   num: "11", color: "#00563F", bio: "Attacking midfielder signed as a New England Homegrown on a long-term MLS deal. Developed through the Revolution Academy and MLS NEXT Pro, and capped as a U.S. youth international.", src: "public/uploads/images/Cristiano Oliveira .png" },
];

const Home = ({ setPage }) => {
  const [activeGuest, setActiveGuest] = React.useState(null);
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
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-20 py-20 lg:py-28">
          <div className="max-w-[640px]">
            <div className="eyebrow mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
              <span className="inline-block w-2 h-2 rounded-full mr-2.5 align-middle" style={{ background: "#D2122E", boxShadow: "0 0 0 4px rgba(210,18,46,0.25)" }} />
              Boston · Est. 2024 · Youth Soccer
            </div>
            <h1
              className="font-display text-white"
              style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)", lineHeight: 0.92, letterSpacing: "-0.01em", textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}
            >
              TRAIN WITH<br />
              THE PROS.<br />
              <span style={{ color: "#D2122E" }}>REALLY.</span>
            </h1>
            <p className="mt-7 text-[18px] leading-[1.55]" style={{ maxWidth: 480, color: "rgba(255,255,255,0.88)", textShadow: "0 1px 12px rgba(0,0,0,0.35)" }}>
              Coached by ex-New England Revolution players and NCAA Division I starters from Duke, Stanford, and Harvard. Summer camp registration open.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <RedButton onClick={() => setPage("register")}>REGISTER — $415</RedButton>
              <OutlineButton onClick={() => setPage("coaches")} className="hero-outline-btn">MEET THE COACHES</OutlineButton>
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
            .hero-video__scrim {
              background:
                linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%);
            }
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
            { n: "4", l: "College Programs" },
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
            <ul className="coach-rail" role="list">
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
            grid-auto-columns: 78%;
            gap: 14px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 8px;
            scrollbar-width: none;
          }
          .coach-rail::-webkit-scrollbar { display: none; }
          .coach-tile { scroll-snap-align: start; list-style: none; }
          @media (min-width: 640px) {
            .coach-rail { grid-auto-columns: 46%; }
          }
          @media (min-width: 1024px) {
            .coach-rail-wrap { margin: 0; padding: 0; }
            .coach-rail {
              grid-auto-flow: initial;
              grid-template-columns: repeat(5, minmax(0, 1fr));
              grid-auto-columns: initial;
              overflow: visible;
              scroll-snap-type: none;
              gap: 16px;
              padding-bottom: 0;
            }
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

      {/* FOOTY UP × GOAT MOMENT */}
      <section className="bg-ink text-white px-0 lg:px-10 py-20 lg:py-24">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">
          {/* Image */}
          <div className="relative order-2 lg:order-1 overflow-hidden">
            <img
              src="assets/footyup-goat-kit.jpeg"
              alt="Footy Up × GOAT co-branded kit: jersey, socks, water bottle, and towel on a soccer field"
              loading="lazy"
              className="w-full h-auto object-cover"
              style={{ aspectRatio: "3 / 2" }}
            />
            <div className="absolute top-4 left-4 font-cond font-bold uppercase tracking-[0.15em] text-[11px] px-2.5 py-1.5" style={{ background: "#D2122E", color: "#fff" }}>
              Included with registration
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2 px-6 lg:px-0">
            <div className="font-display flex items-baseline gap-3" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span className="text-[22px] lg:text-[26px]">FOOTY UP ×</span>
              <span className="text-[44px] lg:text-[56px] text-white leading-none" style={{ color: "#C9A24A" }}>GOAT.</span>
            </div>
            <h2 className="font-display mt-6" style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)", lineHeight: 0.95 }}>
              EVERY CAMPER<br />GETS THE DROP.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.82)", maxWidth: 480 }}>
              Co-branded jersey, socks, bottle, and towel — included with every registration. Limited to camp participants. Sizes locked at signup. Drop reveals on Day 1.
            </p>
            <ul className="mt-7 grid grid-cols-2 gap-3 max-w-[420px]">
              {["Jersey", "Socks", "Bottle", "Towel"].map((it) => (
                <li key={it} className="flex items-center gap-2 text-[14px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                  <span style={{ color: "#D2122E" }}><IconCheck size={16} strokeWidth={3} /></span>
                  <span className="font-cond font-semibold uppercase tracking-[0.08em]">{it}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <RedButton onClick={() => setPage("register")}>SIGN UP FOR THE CAMP</RedButton>
              <button
                onClick={() => setPage("camp")}
                className="btn-arrow font-display tracking-wide border border-white/40 text-white hover:bg-white hover:text-ink px-5 py-3 text-[16px] transition-colors"
              >
                <span>SEE WHAT'S INSIDE</span>
                <IconArrowRight size={18} className="arrow" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CAMP SUMMARY */}
      <section className="bg-smoke py-20 lg:py-24 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-3">
            <div className="eyebrow mb-4">02 — Summer Camp 2026</div>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 4rem)" }}>5 HOURS. ZERO WASTED.</h2>
            <p className="mt-5 text-[16px] text-ink leading-[1.55]" style={{ maxWidth: 480 }}>
              A full day of training run start to finish by D1 athletes. Technical work, ball progressions, scrimmages, and a parent recruitment session — all coached by the people your kid sees on TV someday.
            </p>

            <div className="mt-8 max-w-[520px]">
              <LabelRow label="Price" value="$415 per player" />
              <LabelRow label="Guest Appearances" value="Peyton · Olger · Eric · Cristiano" />
              <LabelRow label="Included" value="Lunch, snacks, GOAT × Footy Up gear drop" last />
            </div>

            <div className="mt-8">
              <RedButton onClick={() => setPage("camp")}>SEE FULL CAMP DETAILS</RedButton>
            </div>
          </div>

          <div className="lg:col-span-2 aspect-[4/5] overflow-hidden">
            <UnsplashImg
              id="1431324155629-1a6deb1dec8d"
              w={1000}
              alt="Players running a training drill"
              className="coach-img-zoom"
            />
            {/* SWAP: real camp photo from Rappo */}
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
