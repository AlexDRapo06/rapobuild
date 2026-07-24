// WINTER CAMP page — indoor camp sign-up with Stripe checkout
const WinterCamp = ({ setPage }) => {
  const [buying, setBuying] = React.useState(false);

  const buyWinter = async () => {
    if (buying) return;
    setBuying(true);
    try {
      const res = await fetch('/api/checkout-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: 'winter_camp' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Could not start checkout. Please try again.');
        setBuying(false);
      }
    } catch {
      alert('Could not start checkout. Please try again.');
      setBuying(false);
    }
  };

  const SignUpButton = ({ size = "lg", full = false, className = "" }) => (
    <button
      type="button"
      onClick={buyWinter}
      disabled={buying}
      aria-label="Sign up for Winter Camp — $315"
      className={`btn-arrow justify-center font-display tracking-wide bg-blood text-white hover:bg-blood-dark ${size === "lg" ? "px-6 py-5 text-[20px] sm:text-[22px]" : "px-5 py-3 text-[16px]"} ${full ? "w-full" : ""} ${className}`}
      style={{ opacity: buying ? 0.6 : 1 }}
    >
      <span>{buying ? "LOADING…" : "SIGN UP NOW — $315"}</span>
      <IconArrowRight size={20} className="arrow" />
    </button>
  );

  return (
    <main id="main">
      {/* HERO */}
      <section className="bg-white pt-20 pb-10 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="eyebrow mb-4">Winter Camp</div>
          <h1 className="font-display text-ink" style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}>
            WINTER CAMP.<br />TRAIN THROUGH THE COLD.
          </h1>
          <p className="mt-6 mx-auto text-[18px] text-fog leading-[1.55]" style={{ maxWidth: 700 }}>
            A high-energy indoor session with the FOOTYUP staff — four hours of real coaching to keep your player sharp all winter. Spots are limited.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 font-cond uppercase tracking-[0.15em] text-[13px] text-fog">
            <IconMapPin size={14} />
            24 Industrial Road, Walpole, MA
          </div>
          <div className="mt-8 flex justify-center">
            <SignUpButton />
          </div>
        </div>
      </section>

      {/* THE DETAILS */}
      <section className="bg-white px-5 lg:px-10 pb-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <div className="eyebrow mb-4">The Details</div>
            <h2 className="font-display text-ink leading-none" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
              ONE FLAT PRICE.<br />DROP OFF &amp; TRAIN.
            </h2>
            <p className="mt-5 text-fog text-[16px] leading-[1.55]" style={{ maxWidth: 520 }}>
              Drop your player off at 9 and pick them up at 1 — technical work, small-sided games, and coaching from college and pro-level players. Register online in under a minute; details for the day are sent after checkout.
            </p>
          </div>

          <div className="bg-ink p-6 sm:p-10">
            <LabelRow dark label="Location" value="24 Industrial Road, Walpole, MA" />
            <LabelRow dark label="Schedule" value="9:00 AM – 1:00 PM" />
            <LabelRow dark label="Dates" value="TBA" />
            <LabelRow dark label="Price" value="$315 per player" last />
            <div className="mt-8">
              <SignUpButton full />
            </div>
            <p className="mt-4 text-center font-cond uppercase tracking-[0.15em] text-[12px] text-white/50">
              Secure checkout · Player details collected at payment
            </p>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <AccentBanner>SPOTS ARE LIMITED — LOCK IN YOUR PLAYER.</AccentBanner>
      <section className="bg-white py-14 px-5 lg:px-10">
        <div className="max-w-[1200px] mx-auto flex justify-center">
          <SignUpButton />
        </div>
      </section>
    </main>
  );
};

window.WinterCamp = WinterCamp;
