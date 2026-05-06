// HOME page
const Home = ({ setPage }) => {
  return (
    <main id="main">
      {/* HERO */}
      <section className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[calc(100vh-72px)]">
        {/* Left */}
        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-20 py-16 lg:py-24 order-1">
          <div className="eyebrow mb-6">Boston · Est. 2024 · Youth Soccer</div>
          <h1
            className="font-display text-ink"
            style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)", lineHeight: 0.92, letterSpacing: "-0.01em" }}
          >
            TRAIN WITH<br />
            THE PROS.<br />
            <span style={{ color: "#D2122E" }}>REALLY.</span>
          </h1>
          <p className="mt-7 text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 480 }}>
            Coached by ex-New England Revolution players and NCAA Division I starters from Duke, Stanford, and Harvard. Summer camp registration open.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <RedButton onClick={() => setPage("register")}>REGISTER — $415</RedButton>
            <OutlineButton onClick={() => setPage("coaches")}>MEET THE COACHES</OutlineButton>
          </div>
        </div>
        {/* Right image */}
        <div className="order-2 aspect-[16/9] lg:aspect-auto lg:min-h-[calc(100vh-72px)] overflow-hidden">
          <UnsplashImg
            id="1574629810360-7efbbe195018"
            w={1600}
            alt="Youth player mid-strike at training"
            className="coach-img-zoom"
          />
          {/* SWAP: hero shot from Rappo's May 11 shoot */}
        </div>
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

      {/* COACH PREVIEW GRID */}
      <section className="bg-white py-20 lg:py-24 px-5 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="max-w-[800px]">
            <div className="eyebrow mb-4">01 — The Staff</div>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 4rem)" }}>MEET THE COACHES.</h2>
            <p className="mt-5 text-[16px] text-fog leading-[1.55]" style={{ maxWidth: 600 }}>
              Active NCAA Division I starters and ex-New England Revolution professionals. Each is coaching at this camp.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {COACHES.map((c) => (
              <div key={c.name} className="coach-card relative aspect-[3/4] overflow-hidden bg-ink">
                <div className="absolute inset-0 coach-img coach-img-zoom">
                  <UnsplashImg id={c.img} w={800} alt={`Portrait of coach ${c.name}`} />
                  {/* SWAP: real headshot from Rappo, May 11 shoot */}
                </div>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)" }}
                />
                <div className="absolute left-0 right-0 bottom-0 p-5 text-white">
                  <div className="font-display text-[24px] lg:text-[28px] leading-none">{c.name}</div>
                  <div className="font-display text-[16px] lg:text-[18px] leading-none mt-1.5" style={{ color: "#D2122E" }}>{c.school}</div>
                  <div className="text-[13px] mt-2" style={{ color: "rgba(255,255,255,0.8)" }}>{c.role.split("·")[0].trim()} · Pro debut</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setPage("coaches")}
              className="btn-arrow font-display text-[18px] text-ink hover:underline"
            >
              <span>VIEW ALL COACHES</span>
              <IconArrowRight size={16} className="arrow" />
            </button>
          </div>
        </div>
      </section>

      {/* GUEST APPEARANCES */}
      <section className="bg-white pt-4 pb-20 lg:pb-24 px-5 lg:px-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div className="max-w-[720px]">
              <div className="eyebrow mb-4" style={{ color: "#D2122E" }}>★ Featured this summer</div>
              <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
                GUEST APPEARANCES.
              </h2>
              <p className="mt-4 text-[16px] text-fog leading-[1.55]" style={{ maxWidth: 560 }}>
                Pros and D1 starters dropping in throughout the summer. Sessions aren't pre-scheduled — show up, train with whoever's running the day.
              </p>
            </div>
            <div className="font-cond font-bold uppercase tracking-[0.15em] text-[12px] text-fog lg:pb-2">
              4 Guests · Unannounced Drop-ins
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: "PEYTON MILLER", school: "DUKE", role: "Forward", img: "1577223625816-7546f13df25d" },
              { name: "OLGER ESCOBAR", school: "STANFORD", role: "Midfielder", img: "1571019613454-1cb2f99b2d8b" },
              { name: "ERIC KLEIN", school: "HARVARD", role: "Defender", img: "1526232761682-d26e03ac148e" },
              { name: "CRISTIANO OLIVEIRA", school: "BABSON", role: "Winger", img: "1543326727-cf6c39e8f84c" },
            ].map((g, i) => (
              <figure key={g.name} className="relative aspect-[3/4] overflow-hidden bg-ink coach-card">
                <div className="absolute inset-0 coach-img coach-img-zoom">
                  <UnsplashImg id={g.img} w={800} alt={`Portrait placeholder for ${g.name}`} />
                  {/* SWAP: real professional photo of {g.name} from Rappo */}
                </div>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.85) 100%)" }} />
                <div className="absolute top-4 left-4 font-cond font-bold uppercase tracking-[0.15em] text-[11px] text-white/80">
                  {String(i + 1).padStart(2, "0")} / Guest
                </div>
                <figcaption className="absolute left-0 right-0 bottom-0 p-5 text-white">
                  <div className="font-display text-[24px] lg:text-[26px] leading-none">{g.name}</div>
                  <div className="font-display text-[16px] leading-none mt-1.5" style={{ color: "#D2122E" }}>{g.school}</div>
                  <div className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {g.role} · Drop-in
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
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
    </main>
  );
};

window.Home = Home;
