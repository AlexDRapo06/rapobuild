// MEDIA page — FOOTYUP's media team and the FOOTYUP × US Footy partnership.
//
// Add a media partner by adding an entry to MEDIA_TEAM (it also shows in the
// home page's Media teaser). `src` is a portrait; partners without one show
// their `logo`, or a monogram of `initials`.
const MEDIA_TEAM = [
  {
    key: "daniel-casper",
    name: "DANIEL CASPER",
    role: "Founder",
    org: "US FOOTY",
    meta: "@usfooty · 14,400+ followers",
    bio: "Daniel founded US Footy — FOOTYUP's official media and training partner — and runs it while studying at Babson College. Top FOOTYUP performers get featured on @usfooty in front of 14,400+ fans, recruiters and scouts.",
    logo: "assets/usfooty-logo-wide.png",
  },
  {
    key: "miguel-sosa",
    name: "MIGUEL SOSA",
    role: "Head of Media",
    org: "FOOTYUP · MIAMI",
    meta: "George Washington Men's Soccer",
    bio: "A Miami native and George Washington midfielder (formerly Furman, NCAA Final Four), Miguel runs his own content platform giving younger players an inside look at life as a Division I athlete — training, games, recovery, travel, and balancing academics. He leads FOOTYUP Media and covers our Miami programs.",
    src: "public/uploads/images/Miguel Sosa.png",
  },
  {
    key: "nextgen-boss",
    name: "NEXTGEN BOSS",
    role: "Media Partner",
    org: "FOOTYUP MEDIA",
    initials: "NGB",
    // Replace with their blurb, handle and logo once the client sends them.
    bio: "Full profile coming soon.",
  },
];

// Portrait, logo tile, or monogram — whichever the partner has.
// Styles live in index.html because the home page uses it too.
const MediaAvatar = ({ m, size = 56 }) => {
  const box = { width: size, height: size, flexShrink: 0 };
  if (m.src) {
    return (
      <span className="media-avatar" style={box}>
        <img src={encodeURI(m.src)} alt={`Portrait of ${m.name}`} loading="lazy" />
      </span>
    );
  }
  if (m.logo) {
    return (
      <span className="media-avatar media-avatar--logo" style={box}>
        <img src={m.logo} alt={`${m.org} logo`} loading="lazy" />
      </span>
    );
  }
  return (
    <span className="media-avatar media-avatar--mono font-display" style={{ ...box, fontSize: size * 0.36 }} aria-hidden="true">
      {m.initials}
    </span>
  );
};

const MediaCard = ({ m, i }) => (
  <article className="media-card">
    <div className={`media-card__media ${m.src ? "" : m.logo ? "media-card__media--logo" : "media-card__media--mono"}`}>
      {m.src && <img src={encodeURI(m.src)} alt={`Portrait of ${m.name}`} loading="lazy" />}
      {!m.src && m.logo && <img className="media-card__logo" src={m.logo} alt={`${m.org} logo`} loading="lazy" />}
      {!m.src && !m.logo && <span className="media-card__mono font-display" aria-hidden="true">{m.initials}</span>}
      <span className="media-card__index">{pad2(i + 1)} / {pad2(MEDIA_TEAM.length)}</span>
      <span className="media-card__org">{m.org}</span>
    </div>
    <div className="media-card__body">
      <div className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: "#D2122E" }}>{m.role}</div>
      <h3 className="font-display text-white mt-2 leading-none" style={{ fontSize: "clamp(2rem, 3vw, 2.6rem)" }}>{m.name}</h3>
      {m.meta && (
        <div className="mt-2 font-cond font-semibold uppercase tracking-[0.12em] text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>{m.meta}</div>
      )}
      {m.bio && <p className="media-card__bio">{m.bio}</p>}
    </div>
  </article>
);

const Media = ({ setPage }) => (
  <main id="main" className="media-page">
    {/* HERO */}
    <section className="media-hero relative overflow-hidden px-5 lg:px-10 pt-24 pb-20 lg:pt-32 lg:pb-24">
      <div className="media-hero__bg" aria-hidden="true" />
      <div className="media-hero__grid" aria-hidden="true" />
      <div className="relative z-10 max-w-[1200px] mx-auto text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, transparent, #D2122E)" }} />
          <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#D2122E" }}>
            FOOTYUP Media
          </span>
          <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, #D2122E, transparent)" }} />
        </div>
        <h1 className="font-display text-white" style={{ fontSize: "clamp(3rem, 9vw, 8rem)", lineHeight: 0.92, letterSpacing: "-0.02em" }}>
          ON CAMERA.<br />ON THE <span className="media-hero__accent">RADAR</span>.
        </h1>
        <p className="mt-7 mx-auto text-[17px] lg:text-[18px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 680 }}>
          Your kid works hard — it's time people saw it. FOOTYUP Media puts our players in front of fans, recruiters and scouts through US Footy and our own media team in Boston and Miami.
        </p>

        <div className="mt-12 grid grid-cols-3 gap-3 max-w-[640px] mx-auto">
          {[
            { n: "14,400+", l: "@usfooty followers" },
            { n: "BOS · MIA", l: "Coverage" },
            { n: pad2(MEDIA_TEAM.length), l: "Media partners" },
          ].map((s) => (
            <div key={s.l} className="media-hero__stat">
              <div className="font-display text-white" style={{ fontSize: "clamp(24px, 4vw, 40px)", lineHeight: 1 }}>{s.n}</div>
              <div className="mt-2 font-cond font-bold uppercase tracking-[0.16em] text-[10px] sm:text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <RedButton onClick={() => setPage("summerCamp")}>BOOK A CAMP</RedButton>
          <OutlineButton onClick={() => setPage("privateTraining")} className="media-outline-btn justify-center">PRIVATE TRAINING</OutlineButton>
        </div>
      </div>
    </section>

    {/* MEDIA TEAM */}
    <section className="media-team relative px-5 lg:px-10 pb-20 lg:pb-28">
      <div className="relative z-10 max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <h2 className="font-display text-white" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: 0.95 }}>
            THE MEDIA <span className="media-hero__accent">TEAM</span>.
          </h2>
          <div className="font-cond uppercase tracking-[0.16em] text-[12px] text-white/45">
            Telling our players' stories
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MEDIA_TEAM.map((m, i) => <MediaCard key={m.key} m={m} i={i} />)}
        </div>
      </div>
    </section>

    {/* FOOTYUP × US FOOTY PARTNERSHIP */}
    <section className="bg-smoke text-ink px-5 lg:px-10 py-20 lg:py-24">
      <div className="max-w-[1200px] mx-auto">
        {/* Header: logos + meta */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10 justify-center text-center sm:text-left">
          <img
            src="assets/usfooty-logo-wide.png"
            alt="US Footy logo"
            loading="lazy"
            className="h-[60px] lg:h-[72px] w-auto object-contain rounded-md"
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
            Join the FOOTYUP × US Footy partnership — media exposure, elite training, collab gear, and real recruiting visibility for your young athlete.
          </p>
        </div>

        {/* Three pillars */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x divide-black/15">
          {[
            { n: "01", t: "MEDIA EXPOSURE", d: "Featured on @usfooty to 14,400+ fans, recruiters & scouts." },
            { n: "02", t: "ELITE TRAINING",  d: "Train with NCAA D1 + MLS Academy players. Real coaching, real results." },
            { n: "03", t: "COLLAB GEAR",     d: "Exclusive FOOTYUP × US Footy kit. Rep the brand on the pitch." },
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
              { n: "01", t: "JOIN",          d: "Book a FOOTYUP camp or private training session." },
              { n: "02", t: "TRAIN",         d: "Train with D1 + MLS Academy coaches. Develop real skills." },
              { n: "03", t: "GET FEATURED",  d: "Top performers get spotlighted on @usfooty — seen by 14,400+ fans." },
              { n: "04", t: "GET RECRUITED", d: "Gain real exposure to scouts, fans, and the soccer community." },
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
      </div>
    </section>

    {/* CTA */}
    <AccentBanner>READY TO GET YOUR ATHLETE NOTICED?</AccentBanner>
    <section className="bg-white py-14 px-5 lg:px-10">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-center gap-3">
        <RedButton onClick={() => setPage("summerCamp")}>BOOK A CAMP</RedButton>
        <OutlineButton onClick={() => setPage("privateTraining")} className="justify-center">PRIVATE TRAINING</OutlineButton>
      </div>
    </section>

    <style>{`
      .media-page { background: #0A0A0A; }
      .media-hero { background: #0A0A0A; }
      .media-hero__bg {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background:
          radial-gradient(900px 500px at 50% 0%, rgba(210,18,46,0.22), transparent 60%),
          radial-gradient(700px 400px at 90% 100%, rgba(201,162,74,0.12), transparent 60%),
          linear-gradient(180deg, #0A0A0A 0%, #101013 100%);
      }
      .media-hero__grid {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background-image:
          linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
        background-size: 80px 80px;
        mask-image: radial-gradient(ellipse at center top, rgba(0,0,0,1) 25%, transparent 75%);
        -webkit-mask-image: radial-gradient(ellipse at center top, rgba(0,0,0,1) 25%, transparent 75%);
        opacity: 0.6;
      }
      .media-hero__accent {
        background: linear-gradient(90deg, #D2122E 0%, #ff5066 50%, #C9A24A 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .media-hero__stat {
        padding: 18px 10px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px;
      }
      .media-page .media-outline-btn { border-color: rgba(255,255,255,0.5); color: #fff; }
      .media-page .media-outline-btn:hover { background: #fff; color: #111; border-color: #fff; }

      .media-team { background: linear-gradient(180deg, #101013 0%, #0A0A0A 100%); }
      .media-card {
        display: flex; flex-direction: column;
        overflow: hidden;
        border-radius: 18px;
        background: #121216;
        border: 1px solid rgba(255,255,255,0.08);
        transition: transform 500ms cubic-bezier(.2,.7,.2,1), border-color 500ms ease, box-shadow 500ms ease;
      }
      .media-card:hover {
        transform: translateY(-4px);
        border-color: rgba(210,18,46,0.45);
        box-shadow: 0 40px 70px -40px rgba(210,18,46,0.35);
      }
      .media-card__media {
        position: relative;
        aspect-ratio: 4 / 3;
        overflow: hidden;
        background: #15151a;
      }
      .media-card__media img {
        width: 100%; height: 100%; object-fit: cover; object-position: center 22%;
        filter: saturate(0.8) contrast(1.05);
        transition: filter 600ms ease, transform 900ms cubic-bezier(.2,.7,.2,1);
      }
      .media-card:hover .media-card__media img { filter: saturate(1.05) contrast(1.05); transform: scale(1.04); }
      /* Logos sit on black to match the US Footy artwork's own background */
      .media-card__media--logo {
        display: flex; align-items: center; justify-content: center;
        background: radial-gradient(circle at 50% 45%, #1a1a1a 0%, #000 70%);
      }
      .media-card__media--logo img.media-card__logo {
        width: 78%; height: auto; max-height: 70%;
        object-fit: contain; filter: none;
      }
      .media-card:hover .media-card__media--logo img.media-card__logo { transform: scale(1.03); filter: none; }
      .media-card__media--mono {
        display: flex; align-items: center; justify-content: center;
        background:
          radial-gradient(400px 260px at 20% 0%, rgba(201,162,74,0.28), transparent 70%),
          radial-gradient(400px 260px at 100% 100%, rgba(210,18,46,0.25), transparent 70%),
          #141418;
      }
      .media-card__mono {
        font-size: clamp(64px, 9vw, 104px); line-height: 1; letter-spacing: 0.02em;
        background: linear-gradient(180deg, #F3DC9A 0%, #C9A24A 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
      }
      .media-card__index, .media-card__org {
        position: absolute; top: 14px;
        font-family: "Barlow Condensed", sans-serif; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.16em; font-size: 10px;
        padding: 5px 10px; border-radius: 999px;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      }
      .media-card__index { left: 14px; color: #fff; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.14); }
      .media-card__org { right: 14px; color: #111; background: #C9A24A; }
      .media-card__body { padding: 22px 24px 26px; }
      .media-card__bio { margin-top: 16px; font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.74); }

      @media (prefers-reduced-motion: reduce) {
        .media-card, .media-card__media img { transition: none !important; }
      }
    `}</style>
  </main>
);

Object.assign(window, { Media, MEDIA_TEAM, MediaAvatar });
