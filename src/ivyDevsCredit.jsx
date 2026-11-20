// "Made by Ivy Devs" — the footer credit band, ported from Ivy Devs'
// IvyDevsCredit.tsx to this site's in-browser JSX (React global, no imports).
//
// Ivy's leaf draws its outline when the band scrolls into view, then fills with
// Ivy's mint and glows. On hover/focus the leaf tilts and glows brighter, a mint
// underline draws in under "Ivy Devs" and the arrow leans out. Opens
// ivy-dev.com in a new tab. Respects prefers-reduced-motion.

const IVY_HREF = "https://www.ivy-dev.com";

// Ivy Devs' leaf, redrawn from its icon (512 grid).
const IVY_LEAF =
  "M256 105C285 150 310 200 322 250L410 250C410 330 360 400 300 405C280 406 262 395 256 380C250 395 232 406 212 405C152 400 102 330 102 250L190 250C202 200 227 150 256 105Z";
const IVY_VEINS = "M256 135V345M256 345L140 275M256 345L372 275";

const IVY_CSS = `
.ivy-credit {
  --ivy-mint: #7dff9c;
  --ivy-gutter: clamp(20px, calc(20px + 20 * (100vw - 375px) / 1064), 40px);
  position: relative;
  display: flex;
  justify-content: center;
  padding: 32px var(--ivy-gutter) 36px;
  background: var(--ivy-ground);
  color: var(--ivy-ink);
  font-family: inherit;
}
.ivy-credit::before {
  content: "";
  position: absolute;
  top: 0;
  left: var(--ivy-gutter);
  right: var(--ivy-gutter);
  height: 1px;
  background: var(--ivy-rule);
}
.ivy-credit__link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}
.ivy-credit__link:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 8px;
}
.ivy-credit__label {
  opacity: 0.55;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.ivy-credit__mark {
  width: 28px;
  height: 28px;
  flex: none;
  overflow: visible;
  filter: drop-shadow(0 0 3px var(--ivy-mint));
  transition: transform 450ms cubic-bezier(.34,1.56,.64,1), filter 450ms ease;
}
.ivy-credit__leaf {
  fill: var(--ivy-mint);
  fill-opacity: 0;
  stroke: var(--ivy-mint);
  stroke-width: 12;
  stroke-linejoin: round;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 1600ms cubic-bezier(.22,1,.36,1),
    fill-opacity 900ms ease 600ms;
}
.ivy-credit__veins {
  fill: none;
  stroke: var(--ivy-mint);
  stroke-width: 16;
  stroke-linecap: round;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 1600ms cubic-bezier(.22,1,.36,1), opacity 900ms ease 600ms;
}
.ivy-credit__veins--cut {
  stroke: var(--ivy-ground);
  stroke-dashoffset: 0;
  opacity: 0;
}
.ivy-credit[data-seen] .ivy-credit__leaf { stroke-dashoffset: 0; fill-opacity: 1; }
.ivy-credit[data-seen] .ivy-credit__veins { stroke-dashoffset: 0; opacity: 0; }
.ivy-credit[data-seen] .ivy-credit__veins--cut { opacity: 1; }
.ivy-credit__name {
  position: relative;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.ivy-credit__line {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 1px;
  margin-top: 4px;
  background: var(--ivy-mint);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 350ms cubic-bezier(.22,1,.36,1);
}
.ivy-credit__arrow {
  width: 18px;
  height: 18px;
  flex: none;
  margin-left: -5px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.25;
  transition: transform 350ms cubic-bezier(.34,1.56,.64,1);
}
.ivy-credit__link:hover .ivy-credit__mark,
.ivy-credit__link:focus-visible .ivy-credit__mark {
  transform: rotate(-10deg) scale(1.1);
  filter: drop-shadow(0 0 12px var(--ivy-mint));
}
.ivy-credit__link:hover .ivy-credit__line,
.ivy-credit__link:focus-visible .ivy-credit__line {
  transform: scaleX(1);
  transform-origin: left;
}
.ivy-credit__link:hover .ivy-credit__arrow,
.ivy-credit__link:focus-visible .ivy-credit__arrow {
  transform: translate(3px, -3px);
}
.ivy-credit__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
@media (max-width: 767.98px) {
  .ivy-credit { padding: 28px var(--ivy-gutter) calc(var(--ivy-gutter) + 4px); }
  .ivy-credit__mark { width: 26px; height: 26px; }
  .ivy-credit__name { font-size: 22px; }
}
@media (min-width: 1440px) {
  .ivy-credit { padding: 36px var(--ivy-gutter) 40px; }
  .ivy-credit__link { gap: 14px; }
  .ivy-credit__mark { width: 30px; height: 30px; }
  .ivy-credit__name { font-size: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .ivy-credit *, .ivy-credit *::before { transition: none !important; }
}
`;

const IvyDevsCredit = ({
  background = "#000",
  color = "#fff",
  rule = "rgb(255 255 255 / 0.2)",
  className = "",
}) => {
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(false);

  // Draw the leaf once the band is on screen. A zero margin: it is the last
  // thing on the page, so a negative margin would never fire.
  React.useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return (
    <div
      ref={ref}
      data-seen={seen ? "" : undefined}
      className={`ivy-credit ${className}`}
      style={{
        "--ivy-ground": background,
        "--ivy-ink": color,
        "--ivy-rule": rule,
      }}
    >
      <style>{IVY_CSS}</style>
      <a href={IVY_HREF} target="_blank" rel="noopener" className="ivy-credit__link">
        <span className="ivy-credit__label">Made by</span>
        <svg aria-hidden="true" viewBox="86 90 340 340" className="ivy-credit__mark">
          <path d={IVY_LEAF} pathLength={1} className="ivy-credit__leaf" />
          <path d={IVY_VEINS} pathLength={1} className="ivy-credit__veins" />
          <path d={IVY_VEINS} className="ivy-credit__veins ivy-credit__veins--cut" />
        </svg>
        <span className="ivy-credit__name">
          Ivy Devs
          <span aria-hidden="true" className="ivy-credit__line" />
        </span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="ivy-credit__arrow">
          <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
        </svg>
        <span className="ivy-credit__sr">(opens in a new tab)</span>
      </a>
    </div>
  );
};

Object.assign(window, { IvyDevsCredit });
