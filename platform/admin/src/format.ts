const TZ = "America/New_York";

export const money = (cents: number | null | undefined) =>
  cents == null ? "—" : (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 });

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export const dateOnly = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" }) : "—";

/** "2027-05-21" -> "May 21, 2027" without timezone drift. */
export const calendarDate = (ymd: string | null | undefined) => {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
};

export const dateRange = (start: string | null, end: string | null) => {
  if (!start) return "Dates TBC";
  if (!end || end === start) return calendarDate(start);
  const [sy, sm] = start.split("-");
  const [ey, em] = end.split("-");
  if (sy === ey && sm === em) return `${calendarDate(start).replace(/, \d{4}$/, "")}–${Number(end.split("-")[2])}, ${ey}`;
  return `${calendarDate(start)} – ${calendarDate(end)}`;
};

export const height = (inches: number | null | undefined) => (inches == null ? "—" : `${Math.floor(inches / 12)}′${inches % 12}″`);

export const label = (value: string | null | undefined) =>
  value ? value.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase()) : "—";
