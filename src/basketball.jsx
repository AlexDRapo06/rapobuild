// BASKETBALL page — premium dark dossier + Walpole private sessions (inquiry-routed)
const Basketball = ({ setPage }) => {
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "", ages: "", players: "", bundle: "", notes: "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToInquiry = (preset) => {
    if (preset) setForm((f) => ({ ...f, bundle: preset }));
    scrollToId("inquiry-form");
  };

  // ---- BASKETBALL COACHES --------------------------------------------------
  const BASKETBALL_COACHES = [
    {
      n: "01",
      name: "COACH MIKE",
      first: "COACH",
      last: "MIKE",
      title: "Head of Basketball Camps & Private Training",
      school: "WHEATON COLLEGE",
      level: "NCAA",
      bio: "Coach Mike is an experienced basketball player and coach with an extensive background in training and competition. He has competed in international trainings and competitions, gaining exposure to European methodologies and team concepts. He played two years as a starter at Wheaton College and was a varsity team member and team captain at Tabor Academy (2017–2019). Those experiences built strong leadership and coaching skills, a competitive attitude, and a commitment-driven, hard-working approach to developing both himself and the players he trains.",
      chips: ["WHEATON COLLEGE", "TABOR CAPTAIN", "HEAD COACH"],
      src: "public/uploads/images/B coach.jpeg",
    },
    {
      n: "02",
      placeholder: true,
      first: "COACH",
      last: "TBA",
      title: "Coach · Joining the staff",
      level: "Announcing soon",
      bio: "Coach Mike is adding 1–2 more coaches to the basketball staff. Full profiles and photos are on the way — check back soon.",
      chips: ["ANNOUNCING SOON"],
    },
  ];

  const BallGlyph = () => (
    <svg className="bb-ph-ball" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" />
      <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="3" />
      <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="3" />
      <path d="M18 14 C40 38, 40 62, 18 86" stroke="currentColor" strokeWidth="3" />
      <path d="M82 14 C60 38, 60 62, 82 86" stroke="currentColor" strokeWidth="3" />
    </svg>
  );

  // ---- PRICING (identical to soccer; routes to inquiry, no Stripe) ----------
  const individual = [
    { count: "5 Sessions",  price: "$550",   bundle: "Basketball — Individual (5 Sessions)" },
    { count: "7 Sessions",  price: "$640",   bundle: "Basketball — Individual (7 Sessions)" },
    { count: "10 Sessions", price: "$910",   bundle: "Basketball — Individual (10 Sessions)" },
  ];
  const group2 = [
    { count: "5 Sessions", price: "$850",   bundle: "Basketball — Group of 2 (5 Sessions)" },
    { count: "7 Sessions", price: "$1,000", bundle: "Basketball — Group of 2 (7 Sessions)" },
  ];
  const bundleOptions = [
    "Basketball — Evaluation Session",
    "Basketball — Recruitment / College Help / Game Analysis (Year-long)",
    "Basketball — Individual (5 Sessions)",
    "Basketball — Individual (7 Sessions)",
    "Basketball — Individual (10 Sessions)",
    "Basketball — Group of 2 (5 Sessions)",
    "Basketball — Group of 2 (7 Sessions)",
    "Basketball — Custom Group (3+ Players)",
  ];

  const BundleCard = ({ tag, count, price, bundle }) => (
    <div className="bb-bundle bg-smoke border border-ash p-5 sm:p-10 flex flex-col">
      <div className="bb-bundle__tag eyebrow">{tag}</div>
      <div className="bb-bundle__count font-display text-ink mt-2 sm:mt-3 leading-none">{count}</div>
      <div className="bb-bundle__price font-display text-ink mt-4 sm:mt-6 leading-none">{price}</div>
      <div className="bb-bundle__foot border-t border-ash mt-5 sm:mt-7 pt-3 sm:pt-4">
        <button
          type="button"
          onClick={() => scrollToInquiry(bundle)}
          className="bb-btn btn-arrow w-full justify-center font-display text-[16px] sm:text-[18px] py-3"
        >
          <span>INQUIRE</span>
          <IconArrowRight size={16} className="arrow" />
        </button>
        <div className="bb-bundle__note text-fog mt-3 text-center">Schedule coordinated with your coach after inquiry.</div>
      </div>
    </div>
  );

  const SectionDivider = ({ label }) => (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-ash" />
      <div className="font-cond uppercase tracking-[0.2em] text-[12px] text-fog">{label}</div>
      <div className="flex-1 h-px bg-ash" />
    </div>
  );

  const SubsectionLabel = ({ label, className = "" }) => (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="font-cond uppercase tracking-[0.15em] text-[12px] text-fog whitespace-nowrap">{label}</div>
      <div className="flex-1 h-px bg-ash" />
    </div>
  );

  return (
    <main id="main" className="bb-page">
      {/* ==================== HERO ==================== */}
      <section className="bb-hero relative overflow-hidden px-5 lg:px-10 pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="bb-hero__bg" aria-hidden="true" />
        <div className="bb-hero__grid" aria-hidden="true" />
        <div className="bb-hero__glow bb-hero__glow--orange" aria-hidden="true" />
        <div className="bb-hero__glow bb-hero__glow--amber" aria-hidden="true" />

        <div className="relative z-10 max-w-[1200px] mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, transparent, #F2662D)" }} />
            <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#F2662D" }}>
              New · Footy Up Basketball
            </span>
            <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, #F2662D, transparent)" }} />
          </div>
          <h1
            className="font-display text-white"
            style={{ fontSize: "clamp(3rem, 9vw, 8rem)", lineHeight: 0.92, letterSpacing: "-0.02em" }}
          >
            <span className="bb-hero__accent">BASKETBALL</span>.
          </h1>
          <p className="mt-7 mx-auto text-[17px] lg:text-[18px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 720 }}>
            Basketball camps and private training led by Coach Mike — building fundamentals, IQ, and confidence.
            Private sessions held in <span style={{ color: "#fff", fontWeight: 600 }}>Walpole, MA</span>. Same standards, same energy — now on the court.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => scrollToId("bb-pricing")}
              className="bb-btn btn-arrow font-display tracking-wide px-6 py-3 text-[17px] justify-center"
            >
              <span>VIEW PRIVATE SESSIONS</span>
              <IconArrowRight size={18} className="arrow" />
            </button>
            <button
              type="button"
              onClick={() => scrollToId("bb-coaches")}
              className="bb-outline btn-arrow font-display tracking-wide px-6 py-3 text-[17px] justify-center"
            >
              <span>MEET THE STAFF</span>
              <IconArrowRight size={18} className="arrow" />
            </button>
          </div>

          {/* Quick stat strip */}
          <div className="mt-12 grid grid-cols-3 gap-3 max-w-[640px] mx-auto">
            {[
              { n: "WALPOLE", l: "Private Sessions" },
              { n: "CAMPS", l: "+ Private Training" },
              { n: "NEW", l: "Now Enrolling" },
            ].map((s) => (
              <div key={s.l} className="bb-hero__stat">
                <div className="font-display text-white" style={{ fontSize: "clamp(20px, 3.4vw, 34px)", lineHeight: 1 }}>{s.n}</div>
                <div className="mt-2 font-cond font-bold uppercase tracking-[0.16em] text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== COACHES ==================== */}
      <section id="bb-coaches" className="bb-roster relative px-5 lg:px-10 pt-20 pb-24 lg:pt-24 lg:pb-32">
        <div className="bb-roster__bg" aria-hidden="true" />

        <div className="relative z-10 max-w-[1300px] mx-auto">
          {/* Header */}
          <div className="text-center max-w-[760px] mx-auto mb-6">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, transparent, #F2662D)" }} />
              <span className="font-cond font-bold uppercase tracking-[0.22em] text-[11px]" style={{ color: "#F2662D" }}>
                01 — The Staff
              </span>
              <span className="block h-[1px] w-8" style={{ background: "linear-gradient(90deg, #F2662D, transparent)" }} />
            </div>
            <h2 className="font-display text-white" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}>
              MEET THE <span className="bb-hero__accent">COACHES</span>.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.68)" }}>
              Led by Coach Mike, with more coaches joining the staff shortly. Every coach is on the court with your player — coaching, demoing, and competing alongside them.
            </p>
          </div>

          <div className="flex flex-col">
            {BASKETBALL_COACHES.map((c, i) => {
              const reverse = i % 2 === 1;
              const isLast = i === BASKETBALL_COACHES.length - 1;
              const next = BASKETBALL_COACHES[i + 1];
              return (
                <React.Fragment key={c.last + c.n}>
                  <article className={`bb-profile group relative ${reverse ? "bb-profile--reverse" : ""}`}>
                    <div className="bb-profile__inner">
                      {/* Image / placeholder side */}
                      <div className="bb-profile__media">
                        {c.placeholder ? (
                          <div className="bb-profile__frame bb-profile__frame--placeholder">
                            <BallGlyph />
                            <div className="bb-ph-label">Announcing<br />Soon</div>
                            <div className="bb-profile__indexpill">
                              <span className="bb-profile__dot" aria-hidden="true" />
                              <span>{c.n} / 0{BASKETBALL_COACHES.length}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bb-profile__frame">
                            <img src={encodeURI(c.src)} alt={`Portrait of ${c.name}`} loading="lazy" />
                            <div className="bb-profile__frame-wash" aria-hidden="true" />
                            <div className="bb-profile__frame-scrim" aria-hidden="true" />
                            <div className="bb-profile__indexpill">
                              <span className="bb-profile__dot" aria-hidden="true" />
                              <span>{c.n} / 0{BASKETBALL_COACHES.length}</span>
                            </div>
                            {c.school && <div className="bb-profile__school-chip">{c.school}</div>}
                          </div>
                        )}
                        <div className="bb-profile__frame-tag">
                          <span style={{ color: "#F2662D" }}>●</span>
                          <span>{c.placeholder ? "Joining the staff" : "Active · 2026"}</span>
                        </div>
                      </div>

                      {/* Content side */}
                      <div className="bb-profile__content">
                        <div className="font-cond font-bold uppercase tracking-[0.18em] text-[12px]" style={{ color: "#F2662D" }}>
                          — {c.placeholder ? "New Coach" : `Coach No. ${c.n}`}
                        </div>

                        <h2 className="bb-profile__name">
                          <span className="bb-profile__name-first">{c.first}</span>
                          <span className="bb-profile__name-last">{c.last}</span>
                        </h2>

                        {c.school && (
                          <div className="font-display mt-2" style={{ color: "#F2662D", fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", lineHeight: 1 }}>
                            {c.school}
                          </div>
                        )}

                        <div className="mt-4 font-cond font-semibold uppercase tracking-[0.14em] text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {c.title}
                        </div>

                        <p className="bb-profile__bio">{c.bio}</p>

                        <dl className="bb-profile__stats">
                          <div><dt>Level</dt><dd>{c.level}</dd></div>
                          <div><dt>Program</dt><dd>{c.school || "TBA"}</dd></div>
                          <div><dt>Role</dt><dd>{c.title}</dd></div>
                        </dl>

                        <div className="mt-7 flex flex-wrap gap-2">
                          {c.chips.map((chip) => (
                            <span key={chip} className="bb-profile__chip">{chip}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>

                  {!isLast && (
                    <div className="bb-divider" role="separator" aria-hidden="true">
                      <span className="bb-divider__line bb-divider__line--left" />
                      <span className="bb-divider__mark">
                        <span className="bb-divider__num bb-divider__num--from">{c.n}</span>
                        <span className="bb-divider__dot" />
                        <span className="bb-divider__num bb-divider__num--to">{next.n}</span>
                      </span>
                      <span className="bb-divider__line bb-divider__line--right" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== UPCOMING CAMPS ==================== */}
      <section id="bb-camps" className="bb-upcoming relative overflow-hidden px-5 lg:px-10 py-20 lg:py-28">
        <div className="bb-upcoming__bg" aria-hidden="true" />
        <div className="bb-upcoming__grid" aria-hidden="true" />
        <div className="bb-upcoming__glow bb-upcoming__glow--orange" aria-hidden="true" />
        <div className="bb-upcoming__glow bb-upcoming__glow--amber" aria-hidden="true" />

        <div className="relative z-10 max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto">
            <div className="inline-flex items-center gap-2.5 mb-5 px-4 py-2 rounded-full" style={{ background: "rgba(242,102,45,0.10)", border: "1px solid rgba(242,102,45,0.35)" }}>
              <span className="bb-upcoming__pulse" aria-hidden="true" />
              <span className="font-cond font-bold uppercase tracking-[0.2em] text-[11px]" style={{ color: "#ff8a4c" }}>
                Heads up — camps coming
              </span>
            </div>
            <h2 className="font-display text-white" style={{ fontSize: "clamp(2.25rem, 5vw, 4.5rem)", lineHeight: 0.95, letterSpacing: "-0.01em" }}>
              UPCOMING <span className="bb-upcoming__accent">CAMPS</span>.
            </h2>
            <p className="mt-6 text-[16px] lg:text-[17px] leading-[1.6]" style={{ color: "rgba(255,255,255,0.72)" }}>
              Basketball camps are on the way. Keep an eye out — save the dates below. Full details and registration drop soon.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
            {[
              { tag: "Skills Camp", place: "WALPOLE", region: "Massachusetts", note: "Dates TBA · Stay tuned", accent: "#F2662D" },
              { tag: "Summer 2027", place: "GREATER BOSTON", region: "Massachusetts", note: "Dates TBA · Stay tuned", accent: "#FF8C42" },
              { tag: "2027 & Beyond", place: "MORE SOON", region: "Locations expanding", note: "Locations expanding · Stay tuned", accent: "#F2662D" },
            ].map((c) => (
              <div key={c.place} className="bb-upcoming__card">
                <div className="flex items-center gap-2">
                  <span className="bb-upcoming__card-dot" style={{ background: c.accent }} aria-hidden="true" />
                  <span className="font-cond font-bold uppercase tracking-[0.18em] text-[11px]" style={{ color: c.accent }}>{c.tag}</span>
                </div>
                <div className="font-display text-white mt-4 leading-none" style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.5rem)" }}>{c.place}</div>
                <div className="mt-2 font-cond uppercase tracking-[0.14em] text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>{c.region}</div>
                <div className="bb-upcoming__card-note mt-5 pt-4 flex items-center gap-2 font-cond uppercase tracking-[0.12em] text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <IconMapPin size={13} /> {c.note}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center font-cond uppercase tracking-[0.14em] text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            Want first dibs? Email{" "}
            <a href="mailto:footyupp@outlook.com" className="bb-upcoming__link">footyupp@outlook.com</a>
            {" "}to get notified.
          </div>
        </div>
      </section>

      {/* ==================== ACCENT BANNER ==================== */}
      <section className="bb-banner text-white text-center py-[60px] px-6">
        <h2 className="font-display" style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 0.95 }}>
          BASKETBALL CAMPS + PRIVATE TRAINING.<br />NOW IN WALPOLE, MA.
        </h2>
      </section>

      {/* ==================== PRIVATE SESSIONS PRICING ==================== */}
      <section id="bb-pricing" className="bg-white pt-20 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4" style={{ color: "#F2662D" }}>Private Sessions</div>
          <h2 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
            ONE-ON-ONE.<br />BY REQUEST.
          </h2>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            Custom session bundles built around your player's level. We respond within 24 hours — directly from your coach, no bots.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 font-cond uppercase tracking-[0.15em] text-[13px] text-fog">
            <span style={{ color: "#F2662D" }} aria-hidden="true">📍</span>
            Sessions held in Walpole, MA
          </div>
        </div>
      </section>

      {/* START HERE */}
      <section className="bg-white px-5 lg:px-10 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <SectionDivider label="Start Here" />

          <div className="mt-6 grid grid-cols-1 gap-4">
            {/* Evaluation */}
            <button
              type="button"
              onClick={() => scrollToInquiry("Basketball — Evaluation Session")}
              className="text-left bg-smoke border-2 p-5 sm:p-8 hover:bg-white transition-colors block"
              style={{ borderColor: "#3B82F6" }}
              aria-label="Book Evaluation Session — scroll to inquiry form"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <span className="font-cond uppercase tracking-[0.15em] text-[11px] sm:text-[12px] text-white px-3 py-1 rounded-full inline-block" style={{ backgroundColor: "#3B82F6" }}>
                    Required Before Packages
                  </span>
                  <h3 className="font-display text-ink mt-3 leading-none" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)" }}>
                    Evaluation Session
                  </h3>
                  <p className="mt-3 text-fog text-[14px] sm:text-[15px] leading-[1.55] max-w-[640px]">
                    Book an evaluation before committing to a package. We assess your player's level and build the right plan from there.
                  </p>
                </div>
                <div className="font-display text-ink leading-none whitespace-nowrap" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                  $110
                </div>
              </div>
            </button>

            {/* Recruitment */}
            <button
              type="button"
              onClick={() => scrollToInquiry("Basketball — Recruitment / College Help / Game Analysis (Year-long)")}
              className="text-left bg-smoke border-2 p-5 sm:p-8 hover:bg-white transition-colors block"
              style={{ borderColor: "#16A34A" }}
              aria-label="Recruitment, college help & game analysis — scroll to inquiry form"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <span className="font-cond uppercase tracking-[0.15em] text-[11px] sm:text-[12px] text-white px-3 py-1 rounded-full inline-block" style={{ backgroundColor: "#16A34A" }}>
                    Recruitment · College Help · Game Analysis · Year-Long
                  </span>
                  <h3 className="font-display text-ink mt-3 leading-none" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)" }}>
                    Recruitment / College Help / Game Analysis
                  </h3>
                  <p className="mt-3 text-fog text-[14px] sm:text-[15px] leading-[1.55] max-w-[640px]">
                    Your player meets with a coach every three weeks to break down their games, with 24/7 access to a coach for feedback in between — full college-recruitment help and game analysis, all year long.
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="font-display text-ink leading-none" style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}>
                    $1,500
                  </div>
                  <div className="text-fog text-[13px] mt-1">/year</div>
                  <div className="text-fog text-[12px] mt-1 leading-tight">or $500 deposit<br />+ $250/mo</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* TRAINING PACKAGES */}
      <section className="bg-white px-5 lg:px-10 pb-12">
        <div className="max-w-[1200px] mx-auto">
          <SectionDivider label="Training Packages" />
          <p className="mt-4 text-center text-fog font-cond uppercase tracking-[0.15em] text-[12px]">
            All sessions are 1 hour 30 minutes
          </p>

          {/* Individual */}
          <SubsectionLabel label="Individual" className="mt-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-5">
            {individual.map((c) => (
              <BundleCard key={`ind-${c.count}`} tag="Individual" count={c.count} price={c.price} bundle={c.bundle} />
            ))}
          </div>

          {/* Group of 2 */}
          <SubsectionLabel label="Group (2 Players)" className="mt-10" />
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 mt-5">
            {group2.map((c) => (
              <BundleCard key={`g2-${c.count}`} tag="Group (2+ Players)" count={c.count} price={c.price} bundle={c.bundle} />
            ))}
          </div>

          {/* Groups of 3+ */}
          <SubsectionLabel label="Groups of 3+" className="mt-10" />
          <div className="mt-5 bg-smoke border border-ash p-5 sm:p-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="eyebrow">Group (3+ Players)</div>
              <div className="font-display text-ink mt-2 leading-none" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
                Custom Bundles Available
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollToInquiry("Basketball — Custom Group (3+ Players)")}
              className="font-cond uppercase tracking-[0.15em] text-[13px] text-ink border border-ink hover:bg-ink hover:text-white px-5 py-3 transition-colors"
            >
              Inquire for Pricing
            </button>
          </div>

          <style>{`
            .bb-bundle__count { font-size: 24px; }
            .bb-bundle__price { font-size: clamp(3rem, 7vw, 5rem); }
            .bb-bundle__note { font-size: 13px; }
            @media (max-width: 639px) {
              .bb-bundle__tag { font-size: 9px; letter-spacing: 0.16em; }
              .bb-bundle__count { font-size: 17px; }
              .bb-bundle__price { font-size: 38px; }
              .bb-bundle__note { font-size: 11px; line-height: 1.4; }
            }
          `}</style>

          <div className="mt-10 text-center font-cond uppercase tracking-[0.15em] text-[13px] text-fog">
            Inquire below · a coach coordinates your schedule
          </div>
        </div>
      </section>

      {/* INQUIRY FORM */}
      <section id="inquiry-form" className="bg-smoke py-20 px-5 lg:px-10">
        <div className="max-w-[720px] mx-auto">
          <div className="text-center">
            <div className="eyebrow mb-4" style={{ color: "#F2662D" }}>Inquire</div>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>SEND AN INQUIRY.</h2>
            <p className="mt-4 text-[16px] text-fog">We'll reach out within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="mt-10 flex justify-center">
              <SuccessCard headline="INQUIRY RECEIVED." sub="We'll reach out within 24 hours." />
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (loading) return;
                setLoading(true);
                setError("");
                try {
                  const res = await fetch('/api/inquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: form.name,
                      email: form.email,
                      phone: form.phone,
                      players: form.players,
                      bundle: form.bundle ? `🏀 ${form.bundle}` : "🏀 Basketball — General Inquiry",
                      ages: form.ages,
                      notes: form.notes,
                    }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setSubmitted(true);
                  } else {
                    setError(data.error || 'Something went wrong. Please try again.');
                  }
                } catch {
                  setError('Something went wrong. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
              className="mt-10 flex flex-col gap-5"
            >
              <Field id="bb-name" label="Parent Name" required value={form.name} onChange={set("name")} />
              <Field id="bb-email" type="email" label="Email" required value={form.email} onChange={set("email")} />
              <Field id="bb-phone" type="tel" label="Phone" required value={form.phone} onChange={set("phone")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field id="bb-ages" label="Player Age(s)" required value={form.ages} onChange={set("ages")} />
                <Field id="bb-players" type="number" label="Number of Players" required value={form.players} onChange={set("players")} />
              </div>
              <SelectField
                id="bb-bundle"
                label="Preferred Bundle"
                required
                value={form.bundle}
                onChange={set("bundle")}
                options={bundleOptions}
              />
              <Textarea id="bb-notes" label="Availability / Notes" value={form.notes} onChange={set("notes")} />

              <button
                type="submit"
                className="bb-btn btn-arrow w-full justify-center font-display text-[22px] py-5 mt-2"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <span>{loading ? "SENDING…" : "SEND INQUIRY"}</span>
                <IconArrowRight size={20} className="arrow" />
              </button>

              {error && (
                <p className="text-[14px] text-center" style={{ color: "#D2122E" }}>{error}</p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ==================== SCOPED STYLES ==================== */}
      <style>{`
        .bb-page { background: #0A0A0A; }

        /* Orange buttons */
        .bb-btn { display: inline-flex; align-items: center; gap: 8px; background: #F2662D; color: #fff; transition: background-color 200ms ease; }
        .bb-btn:hover { background: #D8531F; }
        .bb-outline { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.6); color: #fff; background: rgba(255,255,255,0.04); backdrop-filter: blur(2px); transition: background-color 200ms ease, color 200ms ease; }
        .bb-outline:hover { background: #fff; color: #111; border-color: #fff; }

        /* Orange gradient text accent */
        .bb-hero__accent {
          background: linear-gradient(90deg, #F2662D 0%, #FF8C42 55%, #FFB55C 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }

        /* ==================== HERO ==================== */
        .bb-hero { background: #0A0A0A; }
        .bb-hero__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(900px 500px at 50% 0%, rgba(242,102,45,0.22), transparent 60%),
            linear-gradient(180deg, #0A0A0A 0%, #101013 100%);
        }
        .bb-hero__grid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse at center top, rgba(0,0,0,1) 25%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center top, rgba(0,0,0,1) 25%, transparent 75%);
          opacity: 0.6;
        }
        .bb-hero__glow { position: absolute; z-index: 0; width: 520px; height: 520px; border-radius: 999px; filter: blur(140px); pointer-events: none; }
        .bb-hero__glow--orange { top: -160px; left: -120px; background: rgba(242,102,45,0.32); }
        .bb-hero__glow--amber  { bottom: -200px; right: -120px; background: rgba(255,181,92,0.16); }
        .bb-hero__stat {
          padding: 18px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          backdrop-filter: blur(8px);
        }

        /* ==================== ROSTER ==================== */
        .bb-roster { background: #0B0B0E; }
        .bb-roster__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(1200px 700px at 100% 10%, rgba(242,102,45,0.10), transparent 60%),
            radial-gradient(1100px 600px at 0% 70%, rgba(255,140,66,0.08), transparent 60%),
            linear-gradient(180deg, #0B0B0E 0%, #0A0A0A 100%);
        }

        .bb-profile { position: relative; padding: 56px 0; }
        .bb-profile:first-child { padding-top: 24px; }
        .bb-profile:last-child  { padding-bottom: 24px; }
        @media (min-width: 1024px) {
          .bb-profile { padding: 80px 0; }
        }

        .bb-divider { display: flex; align-items: center; justify-content: center; gap: 18px; width: 100%; margin: 0 auto; padding: 0 8px; }
        .bb-divider__line { height: 1px; flex: 1; max-width: 360px; }
        .bb-divider__line--left { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 100%); }
        .bb-divider__line--right { background: linear-gradient(90deg, rgba(255,255,255,0.18) 0%, transparent 100%); }
        .bb-divider__mark {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(8px);
          font-family: "Barlow Condensed", sans-serif; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.22em; font-size: 11px;
        }
        .bb-divider__num--from { color: rgba(255,255,255,0.35); }
        .bb-divider__num--to   { color: rgba(255,255,255,0.85); }
        .bb-divider__dot { width: 5px; height: 5px; border-radius: 999px; background: #F2662D; box-shadow: 0 0 0 4px rgba(242,102,45,0.18); }

        .bb-profile__inner {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr; gap: 28px; align-items: center;
        }
        @media (min-width: 1024px) {
          .bb-profile__inner { grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); gap: 56px; }
          .bb-profile--reverse .bb-profile__inner > .bb-profile__media { order: 2; }
          .bb-profile--reverse .bb-profile__inner > .bb-profile__content { order: 1; }
        }

        .bb-profile__media { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 360px; margin: 0 auto; }
        @media (min-width: 1024px) {
          .bb-profile__media { max-width: 380px; margin: 0; }
          .bb-profile--reverse .bb-profile__media { margin-left: auto; }
        }
        .bb-profile__frame {
          position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 18px; background: #15151a;
          box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.08), 0 50px 80px -40px rgba(0,0,0,0.7);
          isolation: isolate;
          transition: transform 700ms cubic-bezier(.2,.7,.2,1), box-shadow 700ms ease;
        }
        .bb-profile:hover .bb-profile__frame {
          transform: translateY(-6px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.08) inset, 0 0 0 1px rgba(242,102,45,0.45), 0 60px 100px -40px rgba(242,102,45,0.35);
        }
        .bb-profile__frame img {
          width: 100%; height: 100%; object-fit: cover; object-position: center 18%;
          filter: saturate(0.7) contrast(1.05) brightness(0.95); transform: scale(1.04);
          transition: filter 800ms ease, transform 1400ms cubic-bezier(.2,.7,.2,1);
        }
        .bb-profile:hover .bb-profile__frame img { filter: saturate(1.1) contrast(1.05) brightness(1); transform: scale(1.08); }
        .bb-profile__frame-wash { position: absolute; inset: 0; background: linear-gradient(140deg, rgba(242,102,45,0.18) 0%, transparent 55%); mix-blend-mode: multiply; pointer-events: none; }
        .bb-profile__frame-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%); pointer-events: none; }

        /* Placeholder frame */
        .bb-profile__frame--placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
          border: 1px dashed rgba(242,102,45,0.4);
          background:
            radial-gradient(400px 260px at 50% 30%, rgba(242,102,45,0.14), transparent 70%),
            #131315;
        }
        .bb-ph-ball { width: 84px; height: 84px; color: rgba(242,102,45,0.85); }
        .bb-ph-label {
          font-family: "Bebas Neue", sans-serif; font-size: 30px; line-height: 0.95;
          text-align: center; color: rgba(255,255,255,0.85); letter-spacing: 0.02em;
        }

        .bb-profile__indexpill {
          position: absolute; top: 16px; left: 16px;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.16em; font-size: 11px; color: rgba(255,255,255,0.9);
          padding: 6px 12px 6px 10px; background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12); border-radius: 999px;
        }
        .bb-profile__dot { width: 6px; height: 6px; border-radius: 999px; background: #F2662D; box-shadow: 0 0 0 3px rgba(242,102,45,0.25); }
        .bb-profile__school-chip {
          position: absolute; bottom: 16px; left: 16px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.18em; font-size: 11px; color: #fff; padding: 6px 12px;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.16); border-radius: 6px;
        }
        .bb-profile__frame-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.16em; font-size: 11px; color: rgba(255,255,255,0.5); padding-left: 4px;
        }

        .bb-profile__content { padding: 0; }
        .bb-profile__name { margin-top: 14px; display: flex; flex-direction: column; line-height: 0.88; letter-spacing: -0.015em; }
        .bb-profile__name-first { font-family: "Bebas Neue", sans-serif; font-size: clamp(1.5rem, 3vw, 2.25rem); color: rgba(255,255,255,0.55); }
        .bb-profile__name-last {
          font-family: "Bebas Neue", sans-serif; font-size: clamp(2.25rem, 5vw, 4rem);
          background: linear-gradient(180deg, #ffffff 0%, #d8d8dc 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .bb-profile__bio { margin-top: 22px; font-size: 16px; line-height: 1.65; color: rgba(255,255,255,0.78); max-width: 520px; }

        .bb-profile__stats {
          margin-top: 28px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0;
          border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); max-width: 560px;
        }
        .bb-profile__stats > div { padding: 14px 16px 14px 0; }
        .bb-profile__stats > div + div { padding-left: 16px; border-left: 1px solid rgba(255,255,255,0.08); }
        .bb-profile__stats dt { font-family: "Barlow Condensed", sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; font-size: 10px; color: rgba(255,255,255,0.45); }
        .bb-profile__stats dd { margin: 6px 0 0 0; font-family: "Barlow Condensed", sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 14px; color: #fff; }

        .bb-profile__chip {
          font-family: "Bebas Neue", sans-serif; font-size: 18px; letter-spacing: 0.04em; color: #fff;
          padding: 6px 12px 4px 12px; border: 1px solid rgba(255,255,255,0.18); border-radius: 999px;
          background: rgba(255,255,255,0.04); transition: border-color 300ms ease, background 300ms ease;
        }
        .bb-profile__chip:hover { border-color: #F2662D; background: rgba(242,102,45,0.12); }

        /* ==================== UPCOMING ==================== */
        .bb-upcoming { background: #0A0A0A; }
        .bb-upcoming__bg {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(900px 500px at 50% 0%, rgba(242,102,45,0.18), transparent 60%),
            radial-gradient(800px 500px at 100% 100%, rgba(255,181,92,0.12), transparent 60%),
            linear-gradient(180deg, #0A0A0A 0%, #101013 100%);
        }
        .bb-upcoming__grid {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, transparent 80%);
          opacity: 0.55;
        }
        .bb-upcoming__glow { position: absolute; z-index: 0; width: 480px; height: 480px; border-radius: 9999px; filter: blur(130px); pointer-events: none; }
        .bb-upcoming__glow--orange { top: -160px; left: -120px; background: rgba(242,102,45,0.30); }
        .bb-upcoming__glow--amber  { bottom: -180px; right: -120px; background: rgba(255,181,92,0.16); }
        .bb-upcoming__accent {
          background: linear-gradient(90deg, #F2662D 0%, #FF8C42 55%, #FFB55C 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .bb-upcoming__pulse { display: inline-block; width: 7px; height: 7px; border-radius: 999px; background: #F2662D; box-shadow: 0 0 0 3px rgba(242,102,45,0.20); animation: bb-pulse 1.6s ease-in-out infinite; }
        @keyframes bb-pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(242,102,45,0.20); } 50% { box-shadow: 0 0 0 7px rgba(242,102,45,0.04); } }
        .bb-upcoming__card {
          padding: 24px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px; backdrop-filter: blur(8px); text-align: left;
          transition: border-color 300ms ease, background 300ms ease, transform 300ms ease;
        }
        .bb-upcoming__card:hover { border-color: rgba(242,102,45,0.45); background: rgba(242,102,45,0.06); transform: translateY(-3px); }
        .bb-upcoming__card-dot { width: 6px; height: 6px; border-radius: 999px; box-shadow: 0 0 0 3px rgba(242,102,45,0.15); }
        .bb-upcoming__card-note { border-top: 1px solid rgba(255,255,255,0.08); }
        .bb-upcoming__link { color: #ff8a4c; text-decoration: underline; }
        .bb-upcoming__link:hover { color: #fff; }

        /* ==================== BANNER ==================== */
        .bb-banner { background: linear-gradient(90deg, #F2662D 0%, #FF8C42 100%); }

        @media (prefers-reduced-motion: reduce) {
          .bb-profile__frame, .bb-profile__frame img, .bb-profile__chip, .bb-upcoming__card, .bb-upcoming__pulse { transition: none !important; animation: none !important; }
        }
      `}</style>
    </main>
  );
};

window.Basketball = Basketball;
