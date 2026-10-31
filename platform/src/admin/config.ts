/**
 * Loads camp and Miami configuration from JSON files into the database. This
 * is the documented "no code change" way to add or edit camps until the Stage 2
 * dashboard exists. Upserts by slug; nothing is ever deleted (close a session
 * with "status": "closed" or hide a camp with "active": false).
 */
import { z } from "zod";
import type { Db } from "../lib/db.js";

const slug = z.string().regex(/^[a-z0-9_-]+$/, "lowercase letters, digits, dashes and underscores only");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

export const SessionConfig = z.object({
  slug,
  name: z.string().min(1),
  startsOn: isoDate.nullish(),
  endsOn: isoDate.nullish(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM (24h)").nullish(),
  location: z.string().nullish(),
  ageMin: z.int().nullish(),
  ageMax: z.int().nullish(),
  priceCents: z.int().min(0),
  earlyBirdPriceCents: z.int().min(0).nullish(),
  earlyBirdUntil: isoDate.nullish(),
  capacity: z.int().positive().nullish(),
  status: z.enum(["open", "closed"]).default("open"),
  infoText: z.string().nullish(),
  reminderDays: z.array(z.int().min(0)).default([7, 1]),
  sortOrder: z.int().default(0),
  closesAt: z.iso.datetime({ offset: true }).nullish(),
});

export const CampConfig = z.object({
  slug,
  name: z.string().min(1),
  host: z.string().nullish(),
  kind: z.enum(["summer", "winter", "other"]).default("summer"),
  infoOnly: z.boolean().default(false),
  active: z.boolean().default(true),
  description: z.string().nullish(),
  infoUrl: z.string().url().nullish(),
  siteRoute: z.string().max(120).nullish(),
  sortOrder: z.int().default(0),
  sessions: z.array(SessionConfig).default([]),
});

export const CampsFile = z.object({ camps: z.array(CampConfig) });

export const MiamiFile = z.object({
  camp: z.object({ slug, name: z.string().min(1), host: z.string().nullish(), siteRoute: z.string().max(120).nullish() }),
  event: z.object({
    name: z.string().min(1),
    location: z.string().nullish(),
    infoText: z.string().nullish(),
    /** Checkout opens (code holders included). */
    opensAt: z.iso.datetime({ offset: true }).nullish(),
    /** Families without a code may register from this time. */
    publicOpensAt: z.iso.datetime({ offset: true }).nullish(),
    closesAt: z.iso.datetime({ offset: true }).nullish(),
    checkoutOpen: z.boolean().default(true),
    holdMinutes: z.int().min(31).max(1440).default(35),
    waiverRequired: z.boolean().default(false),
    /** Spots held for code holders across both groups. */
    reservedTotal: z.int().min(0).default(0),
    reservedUntil: z.iso.datetime({ offset: true }).nullish(),
    priceTiers: z.array(z.object({ until: z.iso.datetime({ offset: true }).nullable(), cents: z.int().min(0) })).default([]),
    positions: z.array(z.string().min(1)).default([]),
    shirtSizes: z.array(z.string().min(1)).default([]),
    shortSizes: z.array(z.string().min(1)).default([]),
    gradYears: z.array(z.string().min(1)).default([]),
  }),
  groups: z
    .array(
      z.object({
        grp: z.enum(["boys", "girls"]),
        label: z.string().min(1),
        cap: z.int().min(0),
        ageMin: z.int().min(0).max(25).nullish(),
        ageMax: z.int().min(0).max(25).nullish(),
        startsOn: isoDate.nullish(),
        endsOn: isoDate.nullish(),
        dailyStartTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM (24h)").nullish(),
        dailyEndTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM (24h)").nullish(),
        reservedForCodeHolders: z.int().min(0).default(0),
        reservedUntil: z.iso.datetime({ offset: true }).nullish(),
        priceCodeHolderCents: z.int().min(0).nullish(),
        pricePublicCents: z.int().min(0).nullish(),
        open: z.boolean().default(true),
      }),
    )
    .length(2),
});

export async function upsertCamps(db: Db, file: z.infer<typeof CampsFile>) {
  const summary: string[] = [];
  for (const camp of file.camps) {
    const [row] = await db<{ id: string }[]>`
      insert into public.camps (slug, name, host, kind, info_only, active, description, info_url, sort_order, site_route)
      values (${camp.slug}, ${camp.name}, ${camp.host ?? null}, ${camp.kind}, ${camp.infoOnly}, ${camp.active},
              ${camp.description ?? null}, ${camp.infoUrl ?? null}, ${camp.sortOrder}, ${camp.siteRoute ?? null})
      on conflict (slug) do update set
        name = excluded.name, host = excluded.host, kind = excluded.kind, info_only = excluded.info_only,
        active = excluded.active, description = excluded.description, info_url = excluded.info_url,
        sort_order = excluded.sort_order, site_route = excluded.site_route
      returning id`;
    for (const s of camp.sessions) {
      await db`
        insert into public.sessions
          (camp_id, slug, name, starts_on, ends_on, start_time, location, age_min, age_max, price_cents,
           early_bird_price_cents, early_bird_until, capacity, status, info_text, reminder_days, sort_order, closes_at)
        values
          (${row!.id}, ${s.slug}, ${s.name}, ${s.startsOn ?? null}, ${s.endsOn ?? null}, ${s.startTime ?? null},
           ${s.location ?? null}, ${s.ageMin ?? null}, ${s.ageMax ?? null}, ${s.priceCents},
           ${s.earlyBirdPriceCents ?? null}, ${s.earlyBirdUntil ?? null}, ${s.capacity ?? null}, ${s.status},
           ${s.infoText ?? null}, ${s.reminderDays}, ${s.sortOrder}, ${s.closesAt ?? null})
        on conflict (camp_id, slug) do update set
          name = excluded.name, starts_on = excluded.starts_on, ends_on = excluded.ends_on,
          start_time = excluded.start_time, location = excluded.location, age_min = excluded.age_min,
          age_max = excluded.age_max, price_cents = excluded.price_cents,
          early_bird_price_cents = excluded.early_bird_price_cents, early_bird_until = excluded.early_bird_until,
          capacity = excluded.capacity, status = excluded.status, info_text = excluded.info_text,
          reminder_days = excluded.reminder_days, sort_order = excluded.sort_order, closes_at = excluded.closes_at`;
    }
    summary.push(`${camp.slug}: ${camp.sessions.length} session(s)${camp.infoOnly ? " (info only)" : ""}${camp.active ? "" : " (hidden)"}`);
  }
  return summary;
}

export async function upsertMiami(db: Db, file: z.infer<typeof MiamiFile>) {
  const { camp, event, groups } = file
  const [row] = await db<{ id: string }[]>`
    insert into public.camps (slug, name, host, kind, site_route)
    values (${camp.slug}, ${camp.name}, ${camp.host ?? null}, 'miami', ${camp.siteRoute ?? null})
    on conflict (slug) do update set name = excluded.name, host = excluded.host, kind = 'miami', site_route = excluded.site_route
    returning id`
  const groupDates = groups.flatMap((g) => [g.startsOn, g.endsOn]).filter((d): d is string => Boolean(d)).sort()
  await db`
    insert into public.miami_event
      (id, camp_id, name, starts_on, ends_on, location, info_text, opens_at, public_opens_at, closes_at,
       checkout_open, hold_minutes, waiver_required, reserved_total, reserved_until, positions, shirt_sizes, short_sizes, price_tiers, grad_years)
    values
      (true, ${row!.id}, ${event.name}, ${groupDates[0] ?? null}, ${groupDates.at(-1) ?? null}, ${event.location ?? null},
       ${event.infoText ?? null}, ${event.opensAt ?? null}, ${event.publicOpensAt ?? null}, ${event.closesAt ?? null},
       ${event.checkoutOpen}, ${event.holdMinutes}, ${event.waiverRequired}, ${event.reservedTotal},
       ${event.reservedUntil ?? null}, ${event.positions}, ${event.shirtSizes}, ${event.shortSizes}, ${db.json(event.priceTiers)},
       ${event.gradYears})
    on conflict (id) do update set
      camp_id = excluded.camp_id, name = excluded.name, starts_on = excluded.starts_on, ends_on = excluded.ends_on,
      location = excluded.location, info_text = excluded.info_text, opens_at = excluded.opens_at,
      public_opens_at = excluded.public_opens_at, closes_at = excluded.closes_at,
      checkout_open = excluded.checkout_open, hold_minutes = excluded.hold_minutes,
      waiver_required = excluded.waiver_required, reserved_total = excluded.reserved_total,
      reserved_until = excluded.reserved_until, positions = excluded.positions,
      shirt_sizes = excluded.shirt_sizes, short_sizes = excluded.short_sizes, price_tiers = excluded.price_tiers,
      grad_years = excluded.grad_years`
  for (const g of groups) {
    await db`
      insert into public.miami_groups
        (grp, label, cap, age_min, age_max, starts_on, ends_on, daily_start_time, daily_end_time,
         reserved_for_code_holders, reserved_until, price_code_holder_cents, price_public_cents, open)
      values
        (${g.grp}, ${g.label}, ${g.cap}, ${g.ageMin ?? null}, ${g.ageMax ?? null}, ${g.startsOn ?? null}, ${g.endsOn ?? null},
         ${g.dailyStartTime ?? null}, ${g.dailyEndTime ?? null},
         ${g.reservedForCodeHolders}, ${g.reservedUntil ?? null},
         ${g.priceCodeHolderCents ?? null}, ${g.pricePublicCents ?? null}, ${g.open})
      on conflict (grp) do update set
        label = excluded.label, cap = excluded.cap, age_min = excluded.age_min, age_max = excluded.age_max,
        starts_on = excluded.starts_on, ends_on = excluded.ends_on,
        daily_start_time = excluded.daily_start_time, daily_end_time = excluded.daily_end_time,
        reserved_for_code_holders = excluded.reserved_for_code_holders,
        reserved_until = excluded.reserved_until, price_code_holder_cents = excluded.price_code_holder_cents,
        price_public_cents = excluded.price_public_cents, open = excluded.open`
  }
}
