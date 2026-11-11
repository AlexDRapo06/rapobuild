import { useState } from "react"
import { AlertTriangleIcon, BookOpenIcon, ChevronDownIcon, ClockIcon, ListChecksIcon, TargetIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface Guide {
  what: string
  how: string[]
  when: string
  watch?: string
}

const GUIDES: Record<string, Guide> = {
  camps: {
    what: "Every camp and week families can sign up for on footyup.net: price, ages, spot limit, dates, and whether registration is open.",
    how: [
      "Click a session row to change its price, spots, dates, ages or closing time, then Save session.",
      "“Add session” adds a week to a camp; “Add camp” adds a new school or location.",
      "Set Registration to Closed, or a closing time, to stop new sign-ups.",
    ],
    when: "Right away for new checkouts, and on the website's prices within about a minute. Families who already paid keep their price.",
    watch: "A camp or session the website sells must use the same id as the website's code (shown on each camp and session).",
  },
  miami: {
    what: "The Boston College Combine (Middlesex School): when registration opens, spot limits for boys and girls, prices by date, ages, dates, and the form's size and position lists.",
    how: [
      "Edit any field, then press “Save combine settings” at the bottom. Nothing changes until you save.",
      "Before “Opens to everyone”, only families with the access code can register.",
      "Price schedule: each step's price applies until its date, then the next step takes over.",
    ],
    when: "Immediately for the combine page and checkout.",
    watch: "A spot limit can't be set below the number already taken (paid or in checkout).",
  },
  codes: {
    what: "The private code host-school families use to register before the public and to claim the reserved spots.",
    how: [
      "Type the code and press Save code. It's scrambled right away and can't be shown again, so keep your own copy.",
      "Set “Stops working at” to end the early window, or switch the code off.",
      "With no active code, the combine follows its public schedule for everyone.",
    ],
    when: "Immediately.",
    watch: "Never send the code in a group email; share it only with host-school families.",
  },
  discounts: {
    what: "Promo codes families type at checkout, the automatic sibling discount, and how long a freed-up spot is held for the next waitlist family.",
    how: [
      "Create a promo code with a percent or dollar amount, what it applies to, and optional limits and dates.",
      "Switch a code off to stop it working. Past uses stay in Revenue.",
      "Sibling discount and waitlist hold time save with their own buttons.",
    ],
    when: "Immediately for new checkouts.",
    watch: "Codes typed into Stripe's own “Add promotion code” box on the website are managed in the Stripe dashboard, not here.",
  },
  training: {
    what: "The private training packages sold with the “Buy” buttons on footyup.net's Private Training page.",
    how: ["Change a package's name or price, then save.", "Inquiries and packages bought show up under Private training in the menu."],
    when: "The next checkout charges the new price, and the website shows it within about a minute.",
    watch: "A brand-new package also needs a button added to the website, with the same id.",
  },
  waivers: {
    what: "The waiver wording parents accept at checkout, and whether accepting it is required.",
    how: [
      "Write or paste the wording and publish it. Each publish is a new version.",
      "Turn on “Waiver required” for camps here; for the combine it's in the College Combine tab.",
    ],
    when: "Immediately. Every registration keeps the exact version its parent accepted.",
    watch: "Until a waiver is published and required, registrations show “Waiver not collected”.",
  },
  email: {
    what: "Everything needed to send email: the Brevo connection, the footyup.net domain records, your mailing address and reply-to, and which automatic emails go out.",
    how: [
      "Work down the Sending checklist until everything is green.",
      "Send the DNS records to Ivy Devs to add; then press Check again.",
      "Fill in your mailing address, which the law requires in every marketing email.",
    ],
    when: "Immediately for the next email.",
  },
  admins: {
    what: "Who can sign in to this dashboard.",
    how: ["Type an email and send an invite; they choose a password from the email.", "Remove someone to cut their access on their next click."],
    when: "Immediately.",
    watch: "Admins can see every family's details. Only add people who work for Footy Up.",
  },
}

const KEY = "footyup-settings-guide-hidden"

/** "How this works" box at the top of each Settings tab. */
export function SettingsGuide({ section }: { section: string }) {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1"
    } catch {
      return false
    }
  })
  const guide = GUIDES[section]
  if (!guide) return null
  const toggle = () => {
    setHidden(!hidden)
    try {
      localStorage.setItem(KEY, hidden ? "0" : "1")
    } catch {
      // Not remembered without storage.
    }
  }

  return (
    <div className="bg-card rounded-xl border">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-medium"><BookOpenIcon className="text-brand-strong size-4" />How this works</span>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">{hidden ? "Show" : "Hide"}<ChevronDownIcon className={cn("size-4 transition-transform", !hidden && "rotate-180")} /></span>
      </button>
      {!hidden && (
        <div className="grid gap-4 border-t px-5 py-4 text-sm md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase"><TargetIcon className="size-3.5" />What it controls</p>
            <p>{guide.what}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase"><ListChecksIcon className="size-3.5" />How to change it</p>
            <ol className="list-decimal space-y-1 pl-4">{guide.how.map((h) => <li key={h}>{h}</li>)}</ol>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase"><ClockIcon className="size-3.5" />When it takes effect</p>
              <p>{guide.when}</p>
            </div>
            {guide.watch && <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"><AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />{guide.watch}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
