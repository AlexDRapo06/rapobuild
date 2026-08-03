// CAMP REGISTRATION FORM — shared by every camp page.
//
// Collects the four details on the site (Player Name, Parent Name, Player Age,
// Parent Email) and then hands off to Stripe, rather than letting Stripe collect
// them at checkout. Camps running more than one session also get a session picker.

// Camp pages link to the form with a button rather than an <a href="#camp-register">,
// because the site routes on the URL hash — an anchor would navigate to the home page.
const scrollToCampForm = () => {
  const el = document.getElementById("camp-register");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const CampRegistrationForm = ({ camp }) => {
  const multiSession = camp.sessions.length > 1;
  const [form, setForm] = React.useState({
    playerName: "",
    parentName: "",
    playerAge: "",
    parentEmail: "",
    // Single-session camps have nothing to choose, so preselect it.
    session: multiSession ? "" : camp.sessions[0].value,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const selected = camp.sessions.find((s) => s.value === form.session);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: camp.id, ...form }),
      });
      const data = await res.json();
      if (data.url) {
        // Leaves the page — deliberately stays in the loading state.
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const cta = loading
    ? "REDIRECTING TO CHECKOUT…"
    : selected
      ? `REGISTER — $${selected.price}`
      : "REGISTER";

  return (
    <section id="camp-register" className="bg-smoke px-5 lg:px-10 py-16 lg:py-24">
      <div className="max-w-[680px] mx-auto">
        <div className="text-center">
          <div className="eyebrow mb-3">Registration</div>
          <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            REGISTER YOUR PLAYER.
          </h2>
          <p className="mt-4 text-[15px] text-fog leading-[1.55]">
            {camp.ages} · {camp.schedule} · {camp.venue}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-5">
          <Field
            id="playerName"
            label="Player Name"
            required
            value={form.playerName}
            onChange={set("playerName")}
          />
          <Field
            id="parentName"
            label="Parent Name"
            required
            value={form.parentName}
            onChange={set("parentName")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              id="playerAge"
              type="number"
              label="Player Age"
              required
              min={camp.minAge}
              max={camp.maxAge}
              value={form.playerAge}
              onChange={set("playerAge")}
            />
            <Field
              id="parentEmail"
              type="email"
              label="Parent Email"
              required
              value={form.parentEmail}
              onChange={set("parentEmail")}
            />
          </div>

          {multiSession && (
            <SelectField
              id="session"
              label="Camp Session"
              required
              value={form.session}
              onChange={set("session")}
              options={camp.sessions}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-arrow w-full justify-center font-display text-[22px] bg-blood text-white hover:bg-blood-dark py-5 mt-2"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <span>{cta}</span>
            <IconArrowRight size={20} className="arrow" />
          </button>

          {error && (
            <p role="alert" className="text-[14px] text-center" style={{ color: "#D2122E" }}>
              {error}
            </p>
          )}

          <div className="mt-1 text-[12px] text-fog flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
            <span>Secured by Stripe</span>
            <span aria-hidden="true" className="text-fog/50">•</span>
            <span>Confirmation emailed after checkout</span>
          </div>
        </form>
      </div>
    </section>
  );
};

window.CampRegistrationForm = CampRegistrationForm;
window.scrollToCampForm = scrollToCampForm;
