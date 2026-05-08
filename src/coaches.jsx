// COACHES page — premium dark dossier
const Coaches = ({ setPage }) => {
  return (
    <main id="main" className="coaches-page">
      {/* HEADER */}
      <section className="coaches-hero relative overflow-hidden px-5 lg:px-10 pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="coaches-hero__bg" aria-hidden="true" />
        <div className="coaches-hero__grid" aria-hidden="true" />
        <div className="coaches-hero__glow coaches-hero__glow--red" aria-hidden="true" />
        <div className="coaches-hero__glow coaches-hero__glow--gold" aria-hidden="true" />

        <div className="relative z-10 max-w-[1200px] mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, transparent, #D2122E)" }} />
            <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#D2122E" }}>
              The Staff · {COACHES.length} Coaches
            </span>
            <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, #D2122E, transparent)" }} />
          </div>
          <h1
            className="font-display text-white"
            style={{ fontSize: "clamp(3rem, 9vw, 8rem)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            THE <span className="coaches-hero__accent">COACHES</span>.
          </h1>
          <p className="mt-7 mx-auto text-[17px] lg:text-[18px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 720 }}>
            Active NCAA Division I starters and coaches building this program from the ground up. Every name on this page is on the field with your kid this summer — coaching, demoing, and competing alongside them.
          </p>

          {/* Quick stat strip */}
          <div className="mt-12 grid grid-cols-3 gap-3 max-w-[640px] mx-auto">
            {[
              { n: String(COACHES.length).padStart(2, "0"), l: "Coaches" },
              { n: "D1", l: "Programs" },
              { n: "100%", l: "On Field" },
            ].map((s) => (
              <div key={s.l} className="coaches-hero__stat">
                <div className="font-display text-white" style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1 }}>{s.n}</div>
                <div className="mt-2 font-cond font-bold uppercase tracking-[0.16em] text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROSTER — dossier profiles */}
      <section className="coaches-roster relative px-5 lg:px-10 pb-24 lg:pb-32">
        <div className="coaches-roster__bg" aria-hidden="true" />
        <div className="coaches-roster__noise" aria-hidden="true" />

        <div className="relative z-10 max-w-[1300px] mx-auto flex flex-col">
          {COACHES.map((c, i) => {
            const reverse = i % 2 === 1;
            const isLast = i === COACHES.length - 1;
            const next = COACHES[i + 1];
            return (
              <React.Fragment key={c.name}>
              <article
                className={`coach-profile group relative ${reverse ? "coach-profile--reverse" : ""}`}
              >
                <div className="coach-profile__inner">
                  {/* Image side */}
                  <div className="coach-profile__media">
                    <div className="coach-profile__frame">
                      <img
                        src={encodeURI(c.src)}
                        alt={`Portrait of coach ${c.name}`}
                        loading="lazy"
                      />
                      <div className="coach-profile__frame-wash" aria-hidden="true" />
                      <div className="coach-profile__frame-scrim" aria-hidden="true" />

                      {/* Top chip: index pill */}
                      <div className="coach-profile__indexpill">
                        <span className="coach-profile__dot" aria-hidden="true" />
                        <span>{c.n} / 0{COACHES.length}</span>
                      </div>

                      {/* Bottom-left: school chip */}
                      {c.school && (
                        <div className="coach-profile__school-chip">{c.school}</div>
                      )}
                    </div>

                    {/* Frame tag-line under image */}
                    <div className="coach-profile__frame-tag">
                      <span style={{ color: "#D2122E" }}>●</span>
                      <span>Active · Summer 2026</span>
                    </div>
                  </div>

                  {/* Content side */}
                  <div className="coach-profile__content">
                    <div className="font-cond font-bold uppercase tracking-[0.18em] text-[12px]" style={{ color: "#D2122E" }}>
                      — Coach No. {c.n}
                    </div>

                    <h2 className="coach-profile__name">
                      <span className="coach-profile__name-first">{c.first}</span>
                      <span className="coach-profile__name-last">{c.last}</span>
                    </h2>

                    {c.school && (
                      <div
                        className="font-display mt-2"
                        style={{ color: "#D2122E", fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", lineHeight: 1 }}
                      >
                        {c.school}
                      </div>
                    )}

                    <div className="mt-4 font-cond font-semibold uppercase tracking-[0.14em] text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {c.title}
                    </div>

                    <p className="coach-profile__bio">
                      {c.bio}
                    </p>

                    {/* Dossier stats row */}
                    <dl className="coach-profile__stats">
                      <div>
                        <dt>Level</dt>
                        <dd>{c.level}</dd>
                      </div>
                      <div>
                        <dt>Program</dt>
                        <dd>{c.school || "Independent"}</dd>
                      </div>
                      <div>
                        <dt>Role at Camp</dt>
                        <dd>{c.title}</dd>
                      </div>
                    </dl>

                    {/* Chips */}
                    <div className="mt-7 flex flex-wrap gap-2">
                      {c.chips.map((chip) => (
                        <span key={chip} className="coach-profile__chip">{chip}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              {!isLast && (
                <div className="coach-divider" role="separator" aria-hidden="true">
                  <span className="coach-divider__line coach-divider__line--left" />
                  <span className="coach-divider__mark">
                    <span className="coach-divider__num coach-divider__num--from">{c.n}</span>
                    <span className="coach-divider__dot" />
                    <span className="coach-divider__num coach-divider__num--to">{next.n}</span>
                  </span>
                  <span className="coach-divider__line coach-divider__line--right" />
                </div>
              )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* GUEST APPEARANCES CALLOUT */}
      <section className="coaches-guests relative overflow-hidden px-5 lg:px-10 py-24 lg:py-28">
        <div className="coaches-guests__bg" aria-hidden="true" />

        <div className="relative z-10 max-w-[900px] mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, transparent, #C9A24A)" }} />
            <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#C9A24A" }}>
              ★ Featured this summer
            </span>
            <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, #C9A24A, transparent)" }} />
          </div>
          <h2 className="font-display text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 0.95 }}>
            GUEST <span className="coaches-guests__accent">APPEARANCES</span>.
          </h2>
          <p className="mt-5 text-[16px] lg:text-[17px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.72)" }}>
            New England Revolution and CF Montréal Homegrown pros — Peyton Miller, Olger Escobar, Eric Klein, and Cristiano Oliveira — dropping in throughout the summer. Sessions aren't pre-scheduled. Drop by, train with whoever's running the day.
          </p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { n: "PEYTON MILLER",      s: "NER · LB",        src: "public/uploads/images/peyton miller.jpeg" },
              { n: "OLGER ESCOBAR",      s: "MONTRÉAL · AM",   src: "public/uploads/images/Olger Escobar.png" },
              { n: "ERIC KLEIN",         s: "NER · MID",       src: "public/uploads/images/Eric Klein.png" },
              { n: "CRISTIANO OLIVEIRA", s: "NER · AM",        src: "public/uploads/images/Cristiano Oliveira .png" },
            ].map((g) => (
              <div key={g.n} className="coaches-guests__card">
                <div className="coaches-guests__thumb">
                  <img src={encodeURI(g.src)} alt={`Portrait of ${g.n}`} loading="lazy" />
                </div>
                <div className="font-display text-white text-[18px] leading-tight mt-3">{g.n}</div>
                <div className="mt-1.5 font-cond font-bold uppercase tracking-[0.14em] text-[11px]" style={{ color: "#D2122E" }}>{g.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RED BANNER */}
      <AccentBanner>
        EX-NEW ENGLAND REVOLUTION PLAYERS.<br />
        NCAA D1 STARTERS.<br />
        YOUR KID'S COACHES.
      </AccentBanner>

      {/* CTA TO REGISTER */}
      <section className="coaches-cta relative overflow-hidden px-5 lg:px-10 py-24 lg:py-28 text-center">
        <div className="coaches-cta__bg" aria-hidden="true" />
        <div className="relative z-10">
          <h2 className="font-display text-white" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 0.95 }}>
            READY TO TRAIN <span className="coaches-cta__accent">WITH THEM</span>?
          </h2>
          <p className="mt-4 text-[16px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            Camp registration open. $350 per player. Spots are limited.
          </p>
          <div className="mt-8 flex justify-center">
            <RedButton onClick={() => setPage("register")}>REGISTER NOW</RedButton>
          </div>
        </div>
      </section>

      <style>{`
        .coaches-page { background: #0A0A0A; }

        /* ==================== HERO ==================== */
        .coaches-hero { background: #0A0A0A; }
        .coaches-hero__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(900px 500px at 50% 0%, rgba(210,18,46,0.22), transparent 60%),
            linear-gradient(180deg, #0A0A0A 0%, #101013 100%);
        }
        .coaches-hero__grid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse at center top, rgba(0,0,0,1) 25%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center top, rgba(0,0,0,1) 25%, transparent 75%);
          opacity: 0.6;
        }
        .coaches-hero__glow {
          position: absolute; z-index: 0;
          width: 520px; height: 520px;
          border-radius: 999px; filter: blur(140px);
          pointer-events: none;
        }
        .coaches-hero__glow--red  { top: -160px; left: -120px; background: rgba(210,18,46,0.32); }
        .coaches-hero__glow--gold { bottom: -200px; right: -120px; background: rgba(201,162,74,0.18); }

        .coaches-hero__accent {
          background: linear-gradient(90deg, #D2122E 0%, #ff5066 50%, #C9A24A 100%);
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
        }

        .coaches-hero__stat {
          padding: 18px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          backdrop-filter: blur(8px);
        }

        /* ==================== ROSTER ==================== */
        .coaches-roster { background: #0B0B0E; }
        .coaches-roster__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(1200px 700px at 100% 10%, rgba(210,18,46,0.10), transparent 60%),
            radial-gradient(1100px 600px at 0% 70%, rgba(201,162,74,0.08), transparent 60%),
            linear-gradient(180deg, #0B0B0E 0%, #0A0A0A 100%);
        }
        .coaches-roster__noise {
          position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.4;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
        }

        /* ---- COACH PROFILE ---- */
        .coach-profile {
          position: relative;
          padding: 56px 0;
        }
        .coach-profile:first-child { padding-top: 24px; }
        .coach-profile:last-child  { padding-bottom: 24px; }
        @media (min-width: 1024px) {
          .coach-profile { padding: 80px 0; }
          .coach-profile:first-child { padding-top: 32px; }
          .coach-profile:last-child  { padding-bottom: 32px; }
        }

        /* ---- DIVIDER between coaches ---- */
        .coach-divider {
          display: flex; align-items: center; justify-content: center;
          gap: 18px;
          width: 100%;
          margin: 0 auto;
          padding: 0 8px;
        }
        .coach-divider__line {
          height: 1px; flex: 1;
          max-width: 360px;
        }
        .coach-divider__line--left {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 100%);
        }
        .coach-divider__line--right {
          background: linear-gradient(90deg, rgba(255,255,255,0.18) 0%, transparent 100%);
        }
        .coach-divider__mark {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-family: "Barlow Condensed", sans-serif;
          font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.22em; font-size: 11px;
        }
        .coach-divider__num--from { color: rgba(255,255,255,0.35); }
        .coach-divider__num--to   { color: rgba(255,255,255,0.85); }
        .coach-divider__dot {
          width: 5px; height: 5px; border-radius: 999px;
          background: #D2122E;
          box-shadow: 0 0 0 4px rgba(210,18,46,0.18);
        }

        .coach-profile__inner {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: center;
        }
        @media (min-width: 1024px) {
          .coach-profile__inner {
            grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
            gap: 56px;
          }
          .coach-profile--reverse .coach-profile__inner > .coach-profile__media { order: 2; }
          .coach-profile--reverse .coach-profile__inner > .coach-profile__content { order: 1; }
        }

        /* MEDIA / FRAME */
        .coach-profile__media {
          display: flex; flex-direction: column; gap: 12px;
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .coach-profile__media { max-width: 380px; margin: 0; }
          .coach-profile--reverse .coach-profile__media { margin-left: auto; }
        }
        .coach-profile__frame {
          position: relative;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 18px;
          background: #15151a;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 0 0 1px rgba(255,255,255,0.08),
            0 50px 80px -40px rgba(0,0,0,0.7),
            0 0 0 1px rgba(210,18,46,0.0);
          isolation: isolate;
          transition: transform 700ms cubic-bezier(.2,.7,.2,1), box-shadow 700ms ease;
        }
        .coach-profile:hover .coach-profile__frame {
          transform: translateY(-6px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.08) inset,
            0 0 0 1px rgba(210,18,46,0.45),
            0 60px 100px -40px rgba(210,18,46,0.35);
        }
        .coach-profile__frame img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center 18%;
          filter: saturate(0.6) contrast(1.05) brightness(0.95);
          transform: scale(1.04);
          transition: filter 800ms ease, transform 1400ms cubic-bezier(.2,.7,.2,1);
        }
        .coach-profile:hover .coach-profile__frame img {
          filter: saturate(1.1) contrast(1.05) brightness(1);
          transform: scale(1.08);
        }

        .coach-profile__frame-wash {
          position: absolute; inset: 0;
          background: linear-gradient(140deg, rgba(210,18,46,0.18) 0%, transparent 55%);
          mix-blend-mode: multiply;
          pointer-events: none;
        }
        .coach-profile__frame-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%);
          pointer-events: none;
        }

        .coach-profile__indexpill {
          position: absolute; top: 16px; left: 16px;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "Barlow Condensed", sans-serif;
          font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.16em; font-size: 11px;
          color: rgba(255,255,255,0.9);
          padding: 6px 12px 6px 10px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
        }
        .coach-profile__dot {
          width: 6px; height: 6px; border-radius: 999px;
          background: #D2122E;
          box-shadow: 0 0 0 3px rgba(210,18,46,0.25);
        }
        .coach-profile__school-chip {
          position: absolute; bottom: 16px; left: 16px;
          font-family: "Barlow Condensed", sans-serif;
          font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.18em; font-size: 11px;
          color: #fff;
          padding: 6px 12px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 6px;
        }

        .coach-profile__frame-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "Barlow Condensed", sans-serif;
          font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.16em; font-size: 11px;
          color: rgba(255,255,255,0.5);
          padding-left: 4px;
        }

        /* CONTENT SIDE */
        .coach-profile__content { padding: 0; }

        .coach-profile__name {
          margin-top: 14px;
          display: flex; flex-direction: column;
          line-height: 0.88;
          letter-spacing: -0.015em;
        }
        .coach-profile__name-first {
          font-family: "Bebas Neue", sans-serif;
          font-size: clamp(1.5rem, 3vw, 2.25rem);
          color: rgba(255,255,255,0.55);
        }
        .coach-profile__name-last {
          font-family: "Bebas Neue", sans-serif;
          font-size: clamp(2.25rem, 5vw, 4rem);
          background: linear-gradient(180deg, #ffffff 0%, #d8d8dc 100%);
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
        }

        .coach-profile__bio {
          margin-top: 22px;
          font-size: 16px; line-height: 1.65;
          color: rgba(255,255,255,0.78);
          max-width: 520px;
        }

        .coach-profile__stats {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          max-width: 560px;
        }
        .coach-profile__stats > div {
          padding: 14px 16px 14px 0;
        }
        .coach-profile__stats > div + div {
          padding-left: 16px;
          border-left: 1px solid rgba(255,255,255,0.08);
        }
        .coach-profile__stats dt {
          font-family: "Barlow Condensed", sans-serif;
          font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.14em; font-size: 10px;
          color: rgba(255,255,255,0.45);
        }
        .coach-profile__stats dd {
          margin: 6px 0 0 0;
          font-family: "Barlow Condensed", sans-serif;
          font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; font-size: 14px;
          color: #fff;
        }

        .coach-profile__chip {
          font-family: "Bebas Neue", sans-serif;
          font-size: 18px; letter-spacing: 0.04em;
          color: #fff;
          padding: 6px 12px 4px 12px;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          transition: border-color 300ms ease, color 300ms ease, background 300ms ease;
        }
        .coach-profile__chip:hover {
          border-color: #D2122E;
          background: rgba(210,18,46,0.12);
        }

        /* ==================== GUESTS ==================== */
        .coaches-guests { background: #0A0A0C; }
        .coaches-guests__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(800px 400px at 50% 0%, rgba(201,162,74,0.18), transparent 60%),
            linear-gradient(180deg, #0A0A0C 0%, #101012 100%);
        }
        .coaches-guests__accent {
          background: linear-gradient(90deg, #C9A24A 0%, #f0d68f 100%);
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
        }
        .coaches-guests__card {
          padding: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          text-align: left;
          transition: border-color 300ms ease, background 300ms ease, transform 300ms ease;
        }
        .coaches-guests__card:hover {
          border-color: rgba(210,18,46,0.45);
          background: rgba(210,18,46,0.06);
          transform: translateY(-2px);
        }
        .coaches-guests__thumb {
          aspect-ratio: 1 / 1;
          width: 100%;
          overflow: hidden;
          border-radius: 10px;
          background: #15151a;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .coaches-guests__thumb img {
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center 18%;
          filter: saturate(0.85) contrast(1.05);
          transition: filter 500ms ease, transform 700ms cubic-bezier(.2,.7,.2,1);
        }
        .coaches-guests__card:hover .coaches-guests__thumb img {
          filter: saturate(1.1) contrast(1.05);
          transform: scale(1.05);
        }

        /* ==================== CTA ==================== */
        .coaches-cta { background: #0A0A0A; }
        .coaches-cta__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(700px 400px at 50% 100%, rgba(210,18,46,0.30), transparent 60%),
            linear-gradient(180deg, #0A0A0A 0%, #101013 100%);
        }
        .coaches-cta__accent {
          background: linear-gradient(90deg, #D2122E 0%, #ff5066 100%);
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
        }

        @media (prefers-reduced-motion: reduce) {
          .coach-profile__frame, .coach-profile__frame img, .coach-profile__chip, .coaches-guests__card { transition: none !important; }
        }
      `}</style>
    </main>
  );
};

window.Coaches = Coaches;
