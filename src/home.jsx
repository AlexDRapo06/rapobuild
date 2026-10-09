// HOME page
const SPONSORS = [
  { name: "elete Electrolytes", src: "public/uploads/images/sponsors/elete-logo.png" },
  { name: "Molten", src: "public/uploads/images/sponsors/molten-logo.png" },
  { name: "Ice Shaker", src: "public/uploads/images/sponsors/iceshaker-logo.png" },
  { name: "QuickPlay", src: "public/uploads/images/sponsors/quickplay-logo.png", invert: true },
  { name: "G2G Protein Bar", src: "public/uploads/images/sponsors/g2g-logo.png" },
  { name: "VALD Performance", src: "public/uploads/images/sponsors/vald-logo.svg" },
];

const Home = ({ setPage }) => {
  const coachRailRef = React.useRef(null);
  const scrollCoachRail = (dir) => {
    const rail = coachRailRef.current;
    if (!rail) return;
    const card = rail.querySelector(".coach-tile");
    const step = card ? card.getBoundingClientRect().width + 16 : 320;
    rail.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const railCoaches = homeRailCoaches();
  const homeCamps = HOME_CAMP_ORDER.map(campById).filter(Boolean);
  const miami = campById("miami_combine_2027");
  const miamiOpen = campRegistrationOpen(miami);

  const goCamp = (c) => {
    const route = campRoute(c);
    if (route) setPage(...route);
  };

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
              <button type="button" onClick={() => setPage("miami")} className="hero-pill mb-6">
                <span className="hero-pill__tag">New</span>
                <span>Miami College Combine · May 2027</span>
                <IconArrowRight size={14} className="hero-pill__arrow" />
              </button>
              <div className="eyebrow mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                <span className="inline-block w-2 h-2 rounded-full mr-2.5 align-middle" style={{ background: "#D2122E", boxShadow: "0 0 0 4px rgba(210,18,46,0.25)" }} />
                Boston · Miami · Est. 2024
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
                Coached by ex-MLS Academy / MLS NEXT players and NCAA Division I starters.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <RedButton onClick={() => setPage("summerCamp")}>BOOK SUMMER CAMP</RedButton>
                <button
                  type="button"
                  onClick={() => setPage("winterCamp")}
                  className="btn-arrow font-display tracking-wide bg-white text-ink hover:bg-smoke px-5 py-3 text-[16px]"
                >
                  <span>BOOK WINTER CAMP</span>
                  <IconArrowRight size={18} className="arrow" />
                </button>
                <OutlineButton onClick={() => setPage("privateTraining")} className="hero-outline-btn">PRIVATE TRAINING</OutlineButton>
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
          /* "New: Miami" pill above the eyebrow */
          .hero-pill {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 5px 14px 5px 5px;
            border-radius: 999px;
            background: rgba(10,10,10,0.45);
            border: 1px solid rgba(201,162,74,0.55);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            font-family: "Barlow Condensed", sans-serif; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px;
            color: #fff;
            transition: border-color 200ms ease, background 200ms ease;
          }
          .hero-pill:hover { border-color: #C9A24A; background: rgba(201,162,74,0.16); }
          .hero-pill__tag {
            padding: 3px 9px; border-radius: 999px;
            background: #C9A24A; color: #111; letter-spacing: 0.16em; font-size: 10px;
          }
          .hero-pill__arrow { transition: transform 200ms ease; }
          .hero-pill:hover .hero-pill__arrow { transform: translateX(3px); }
          @media (max-width: 768px) { .hero-pill { margin-bottom: 18px; font-size: 11px; } }
        `}</style>
      </section>

      {/* COACH RAIL — premium dark editorial, directly under the hero */}
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
                  The Staff
                </span>
              </div>
              <h2
                className="font-display text-white"
                style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}
              >
                MEET THE <span className="coach-section__title-accent">COACHES</span>.
              </h2>
              <p className="mt-6 text-[16px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.68)", maxWidth: 600 }}>
                NCAA Division I starters and ex-MLS Academy / MLS NEXT players — from Duke, Stanford, Harvard, LSU, Boston College and more. Every coach here is on the field with your kid.
              </p>
            </div>
            <div className="flex items-center gap-4 lg:pb-3">
              <div className="font-display text-[44px] lg:text-[56px] leading-none text-white">
                {pad2(railCoaches.length)}
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
              {railCoaches.map((c, i) => (
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
                      <span>{pad2(i + 1)} / {pad2(railCoaches.length)}</span>
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
                        <span className="coach-tile__pos">{c.title}</span>
                        <span className="coach-tile__sep" aria-hidden="true">/</span>
                        <span className="coach-tile__role">{c.level}</span>
                      </div>
                    </div>

                    {/* Hover bottom red bar */}
                    <div className="coach-tile__bar" aria-hidden="true" />

                    {/* Whole tile opens the coach's profile */}
                    <button
                      type="button"
                      className="coach-tile__link"
                      onClick={() => setPage("coaches", coachSlug(c))}
                      aria-label={`View ${c.first} ${c.last}'s profile`}
                    />
                  </article>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-10 lg:mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="font-cond uppercase tracking-[0.14em] text-[12px] text-white/45">
              Swipe / scroll to see all · Tap a coach for their profile
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
            display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px;
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
          /* Full-tile link to the coach's profile */
          .coach-tile__link {
            position: absolute; inset: 0; z-index: 5;
            width: 100%; height: 100%;
            background: transparent; border: 0; cursor: pointer;
            border-radius: 18px;
          }
          .coach-tile__link:focus-visible { outline: 2px solid #D2122E; outline-offset: -2px; }
        `}</style>
      </section>

      {/* UPCOMING CAMPS — every camp, straight to its page */}
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
                Now booking — Summer 2027 · Winter · Miami
              </span>
            </div>
            <h2 className="font-display text-white" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}>
              UPCOMING <span className="upcoming__accent">CAMPS</span>.
            </h2>
            <p className="mt-6 text-[16px] lg:text-[17px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)" }}>
              Summer camps at Arlington Catholic, Watertown and BB&amp;N, Winter Camp in Walpole this December, and the FOOTYUP College Combine in Miami. Tap a camp for dates, details and registration.
            </p>
          </div>

          {/* Camp cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {homeCamps.map((c) => {
              const route = campRoute(c);
              const Card = route ? "button" : "div";
              const featured = c.id === miami.id;
              const cta = featured
                ? (miamiOpen ? "Register now" : "Registration opens Nov 1")
                : c.status === "external" ? "Camp info" : "Register now";
              return (
                <Card
                  key={c.id}
                  type={route ? "button" : undefined}
                  onClick={route ? () => goCamp(c) : undefined}
                  className={`upcoming__card text-left ${route ? "upcoming__card--live" : ""} ${featured ? "upcoming__card--featured sm:col-span-2" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="upcoming__card-dot" style={{ background: c.accent }} aria-hidden="true" />
                    <span className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: c.accent }}>{c.tag}</span>
                    {featured && <span className="upcoming__new">New</span>}
                  </div>
                  <div className="font-display text-white mt-4 leading-none" style={{ fontSize: featured ? "clamp(2.75rem, 5vw, 4rem)" : "clamp(2rem, 3.4vw, 2.75rem)" }}>{c.place}</div>
                  <div className="mt-2 font-cond uppercase tracking-[0.14em] text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>{c.region}</div>
                  {featured && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {c.sessions.map((s) => (
                        <span key={s.value} className="upcoming__chip">{s.short} · {s.dates.replace(", 2027", "")}</span>
                      ))}
                      <span className="upcoming__chip upcoming__chip--price">{formatUSD(c.sessions[0].price)}</span>
                    </div>
                  )}
                  {featured && (
                    <p className="mt-4 text-[14px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.68)", maxWidth: 460 }}>
                      College coaches in attendance, VALD performance testing, recruiting sessions and a custom FOOTYUP × GOINGFORGOAT kit shipped home.
                    </p>
                  )}
                  <div className="flex-1" aria-hidden="true" />
                  <div className="upcoming__card-note mt-5 pt-4 flex items-center gap-2 font-cond uppercase tracking-[0.12em] text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <IconCalendar size={13} /> {c.cardNote}
                  </div>
                  {route && (
                    <div className="mt-3 flex items-center gap-2 font-cond font-bold uppercase tracking-[0.14em] text-[11px]" style={{ color: c.accent }}>
                      {cta} <IconArrowRight size={13} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Camp CTAs */}
          <div className="mt-12 flex flex-col sm:flex-row sm:flex-wrap justify-center items-center gap-4">
            <RedButton onClick={() => setPage("summerCamp")}>BOOK SUMMER CAMP</RedButton>
            <RedButton onClick={() => setPage("winterCamp")}>BOOK WINTER CAMP — $315</RedButton>
            <button
              type="button"
              onClick={() => setPage("miami")}
              className="upcoming__gold-btn btn-arrow font-display tracking-wide px-5 py-3 text-[16px]"
            >
              <span>MIAMI COLLEGE COMBINE</span>
              <IconArrowRight size={18} className="arrow" />
            </button>
          </div>

          {/* Notify */}
          <div className="mt-10 text-center font-cond uppercase tracking-[0.14em] text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Want first dibs on new locations? Email{" "}
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
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
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
          /* Featured card (Miami combine) spans two columns */
          .upcoming__card--featured {
            background:
              radial-gradient(500px 260px at 100% 0%, rgba(201,162,74,0.22), transparent 70%),
              linear-gradient(160deg, rgba(201,162,74,0.10) 0%, rgba(255,255,255,0.03) 55%);
            border-color: rgba(201,162,74,0.40);
          }
          .upcoming__card--featured.upcoming__card--live:hover {
            border-color: rgba(201,162,74,0.85);
            background:
              radial-gradient(500px 260px at 100% 0%, rgba(201,162,74,0.30), transparent 70%),
              linear-gradient(160deg, rgba(201,162,74,0.14) 0%, rgba(255,255,255,0.04) 55%);
          }
          .upcoming__new {
            margin-left: auto;
            font-family: "Barlow Condensed", sans-serif; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.16em; font-size: 10px;
            padding: 3px 9px; border-radius: 999px; background: #C9A24A; color: #111;
          }
          .upcoming__chip {
            font-family: "Barlow Condensed", sans-serif; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px;
            color: #fff; padding: 5px 10px; border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.05);
          }
          .upcoming__chip--price { border-color: rgba(201,162,74,0.6); color: #E8C877; }
          .upcoming__gold-btn { background: transparent; color: #E8C877; border: 1px solid rgba(201,162,74,0.7); transition: background 200ms ease, color 200ms ease; }
          .upcoming__gold-btn:hover { background: #C9A24A; color: #111; }
        `}</style>
      </section>

      {/* MEDIA — short teaser; the full story lives on the Media tab */}
      <section className="bg-smoke text-ink px-5 lg:px-10 py-16 lg:py-24 border-t border-black/10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, transparent, #D2122E)" }} />
              <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#D2122E" }}>
                FOOTYUP Media
              </span>
            </div>
            <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4.2vw, 3.6rem)", lineHeight: 0.98 }}>
              YOUR KID WORKS HARD.<br />IT'S TIME PEOPLE SAW IT.
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6]" style={{ color: "rgba(0,0,0,0.72)", maxWidth: 520 }}>
              Official media &amp; training partner of US Footy — 14,400+ followers — with our own media team covering FOOTYUP players in Boston and Miami.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <RedButton onClick={() => setPage("media")}>MEET OUR MEDIA TEAM</RedButton>
            </div>
          </div>

          <ul className="flex flex-col gap-3" role="list">
            {MEDIA_TEAM.map((m) => (
              <li key={m.key}>
                <button type="button" onClick={() => setPage("media")} className="media-mini group">
                  <MediaAvatar m={m} size={56} />
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block font-display text-[22px] leading-none text-ink truncate">{m.name}</span>
                    <span className="block mt-1.5 font-cond font-bold uppercase tracking-[0.14em] text-[11px]" style={{ color: "#D2122E" }}>
                      {m.role} · {m.org}
                    </span>
                  </span>
                  <IconArrowRight size={18} className="media-mini__arrow" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <style>{`
          .media-mini {
            display: flex; align-items: center; gap: 16px; width: 100%;
            padding: 14px 18px 14px 14px;
            background: #fff; border: 1px solid #E5E5E5;
            transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
          }
          .media-mini:hover { border-color: #111; transform: translateX(3px); box-shadow: 0 16px 30px -24px rgba(0,0,0,0.4); }
          .media-mini__arrow { color: rgba(0,0,0,0.35); transition: transform 200ms ease, color 200ms ease; flex-shrink: 0; }
          .media-mini:hover .media-mini__arrow { color: #D2122E; transform: translateX(3px); }
          @media (prefers-reduced-motion: reduce) { .media-mini, .media-mini__arrow { transition: none !important; } }
        `}</style>
      </section>
    </main>
  );
};

window.Home = Home;
