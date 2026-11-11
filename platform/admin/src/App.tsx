import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import { ArrowRightIcon, KeyRoundIcon, LockIcon, MailIcon, RefreshCwIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react"

import { createApi } from "./api"
import {
  fetchConfig,
  loadSession,
  saveSession,
  sendPasswordReset,
  setPassword,
  signIn,
  signOut,
  takeLinkError,
  takeLinkSession,
  type AuthConfig,
  type Session,
} from "./auth"
import type { Overview as OverviewData } from "./types"
import { Analytics } from "./views/Analytics"
import { Compose } from "./views/Compose"
import { Contacts } from "./views/Contacts"
import { EmailHistory } from "./views/EmailHistory"
import { Overview, miamiPhase } from "./views/Overview"
import { Registrations } from "./views/Registrations"
import { Requests } from "./views/Requests"
import { Revenue } from "./views/Revenue"
import { Rosters } from "./views/Rosters"
import { Settings } from "./views/settings/Settings"
import { Waitlist } from "./views/Waitlist"
import { AppSidebar, BrandMark, TAB_LABELS, type NavCounts, type Tab } from "@/components/app/app-sidebar"
import { ErrorState } from "@/components/app/states"
import { BlurFade } from "@/components/magicui/blur-fade"
import { BorderBeam } from "@/components/magicui/border-beam"
import { DotPattern } from "@/components/magicui/dot-pattern"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface ViewProps {
  api: ReturnType<typeof createApi>
  onExpired: () => void
  refreshKey: number
  navigate: (tab: string, params?: Record<string, string>) => void
  params: Record<string, string>
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <DotPattern
        width={18}
        height={18}
        cr={1}
        className="text-zinc-300 [mask-image:radial-gradient(520px_circle_at_center,white,transparent)]"
      />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
      <BlurFade inView={false} className="relative w-full max-w-sm">
        {children}
        <p className="text-muted-foreground mt-6 flex items-center justify-center gap-1.5 text-xs">
          <ShieldCheckIcon className="size-3.5" /> Private area for Footy Up staff
        </p>
      </BlurFade>
    </div>
  )
}

function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="bg-card relative overflow-hidden rounded-2xl border p-8 shadow-lg shadow-zinc-200/60">
      <BorderBeam size={90} duration={9} colorFrom="#10b981" colorTo="#0ea5e9" />
      <div className="mb-7 flex flex-col items-center gap-4 text-center">
        <BrandMark className="size-11 rounded-xl text-base" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Notice({ tone, children }: { tone: "error" | "ok" | "dev"; children: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dev: "border-amber-200 bg-amber-50 text-amber-800",
  }[tone]
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-2 rounded-lg border px-3 py-2.5 text-sm", styles)}>
      {tone === "error" && <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />}
      <span>{children}</span>
    </div>
  )
}

function IconInput({ icon: Icon, ...props }: React.ComponentProps<typeof Input> & { icon: typeof MailIcon }) {
  return (
    <div className="relative">
      <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input className="h-10 pl-9" {...props} />
    </div>
  )
}

function Login({ config, onSignedIn, initialError }: { config: AuthConfig; onSignedIn: (s: Session) => void; initialError: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPw] = useState("")
  const [error, setError] = useState<string | null>(initialError)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const dev = config.auth === "dev"

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (resetMode) {
        await sendPasswordReset(config, email)
        setNotice("If that email has access, a reset link is on its way. Check your inbox.")
      } else {
        onSignedIn(await signIn(config, email, password))
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title={resetMode ? "Reset your password" : "Welcome back"}
        description={resetMode ? "We'll email you a link to choose a new password." : "Sign in to see registrations, College Combine spots and training requests."}
      >
        <form onSubmit={submit} className="space-y-4">
          {dev && <Notice tone="dev">Local test mode: sign in with an admin email. No password needed.</Notice>}
          {config.auth === "unconfigured" && <Notice tone="error">Sign-in isn't configured on this deployment yet.</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {notice && <Notice tone="ok">{notice}</Notice>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <IconInput icon={MailIcon} id="email" type="email" autoComplete="email" placeholder="you@footyup.net" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {!dev && !resetMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline" onClick={() => { setResetMode(true); setError(null) }}>
                  Forgot password?
                </button>
              </div>
              <IconInput icon={LockIcon} id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPw(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="h-10 w-full" disabled={busy || config.auth === "unconfigured"}>
            {busy ? <Spinner /> : null}
            {resetMode ? "Send reset link" : "Sign in"}
            {!busy && !resetMode && <ArrowRightIcon />}
          </Button>
          {resetMode && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => { setResetMode(false); setNotice(null); setError(null) }}>
              Back to sign in
            </Button>
          )}
        </form>
      </AuthCard>
    </AuthLayout>
  )
}

function ChoosePassword({ config, session, invited, onDone }: { config: AuthConfig; session: Session; invited: boolean; onDone: () => void }) {
  const [pw, setPw] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pw.length < 10) return setError("Use at least 10 characters.")
    if (pw !== confirm) return setError("The two passwords don't match.")
    setBusy(true)
    setError(null)
    try {
      await setPassword(config, session, pw)
      onDone()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard title={invited ? "Welcome to Footy Up Admin" : "Choose a new password"} description="You'll use it with your email to sign in from now on.">
        <form onSubmit={submit} className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <div className="space-y-2">
            <Label htmlFor="pw">New password</Label>
            <IconInput icon={KeyRoundIcon} id="pw" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
            <p className="text-muted-foreground text-xs">At least 10 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2">Confirm password</Label>
            <IconInput icon={KeyRoundIcon} id="pw2" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="h-10 w-full" disabled={busy}>
            {busy && <Spinner />} Save password
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}

const TABS = Object.keys(TAB_LABELS) as Tab[]

function Dashboard({ config, session, setSession, onSignOut }: { config: AuthConfig; session: Session; setSession: (s: Session | null) => void; onSignOut: () => void }) {
  const [tab, setTabState] = useState<Tab>(() => TABS.find((t) => `#${t}` === location.hash) ?? "overview")
  const [params, setParams] = useState<Record<string, string>>({})
  const navigate = useCallback((t: string, p: Record<string, string> = {}) => {
    setParams(p)
    setTabState(t as Tab)
  }, [])
  const setTab = useCallback((t: Tab) => navigate(t), [navigate])
  const [refreshKey, setRefreshKey] = useState(0)
  const [summary, setSummary] = useState<OverviewData | null>(null)
  const [openTodos, setOpenTodos] = useState<number | undefined>(undefined)
  const [updatedAt, setUpdatedAt] = useState(() => new Date())
  const sessionRef = useMemo(() => ({ current: session }), [])
  sessionRef.current = session
  const api = useMemo(() => createApi(config, () => sessionRef.current, setSession), [config, sessionRef, setSession])
  const expired = useCallback(() => onSignOut(), [onSignOut])

  useEffect(() => {
    history.replaceState(null, "", `#${tab}`)
    window.scrollTo(0, 0)
  }, [tab])

  useEffect(() => {
    let alive = true
    api<OverviewData>("overview")
      .then((d) => alive && (setSummary(d), setUpdatedAt(new Date())))
      .catch(() => {})
    api<{ open: number }>("todos")
      .then((d) => alive && setOpenTodos(d.open))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [api, refreshKey])

  const counts: NavCounts = summary
    ? { registrations: summary.totals.registrations, requests: summary.totals.new_requests, waitlist: summary.totals.waiting, todos: openTodos }
    : { todos: openTodos }
  const views: Record<Tab, React.ComponentType<ViewProps>> = {
    overview: Overview, analytics: Analytics, revenue: Revenue, registrations: Registrations, rosters: Rosters, waitlist: Waitlist,
    requests: Requests, compose: Compose, contacts: Contacts, emails: EmailHistory, settings: Settings,
  }
  const View = views[tab]

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <AppSidebar
          tab={tab}
          onTab={setTab}
          counts={counts}
          email={session.email || summary?.me.email || ""}
          onSignOut={onSignOut}
          miami={summary ? miamiPhase(summary) : null}
        />
        <SidebarInset className="min-w-0">
          <header className="app-topbar bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur md:rounded-t-xl">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="text-muted-foreground hidden sm:inline">Footy Up</span>
              <span className="text-muted-foreground hidden sm:inline">/</span>
              <span className="truncate font-medium">{TAB_LABELS[tab]}</span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-muted-foreground hidden text-xs md:inline">
                Updated {updatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
                <RefreshCwIcon /> <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
            <View key={`${tab}:${JSON.stringify(params)}`} api={api} onExpired={expired} refreshKey={refreshKey} navigate={navigate} params={params} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export function App() {
  const [config, setConfig] = useState<AuthConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [session, setSessionState] = useState<Session | null>(() => loadSession())
  const [link, setLink] = useState<{ session: Session; type: string } | null>(null)
  const [linkError] = useState(() => takeLinkError())

  const setSession = useCallback((s: Session | null) => {
    saveSession(s)
    setSessionState(s)
  }, [])

  useEffect(() => {
    fetchConfig().then(setConfig, (err) => setConfigError((err as Error).message))
    const fromLink = takeLinkSession()
    if (fromLink) setLink(fromLink)
  }, [])

  const handleSignOut = useCallback(() => {
    if (config) void signOut(config, session)
    setSessionState(null)
  }, [config, session])

  if (configError) return <AuthLayout><div className="bg-card rounded-2xl border"><ErrorState message={configError} onRetry={() => location.reload()} /></div></AuthLayout>
  if (!config) return <div className="flex min-h-svh items-center justify-center"><Spinner className="text-muted-foreground size-6" /></div>

  if (link && (link.type === "recovery" || link.type === "invite")) {
    return (
      <ChoosePassword
        config={config}
        session={link.session}
        invited={link.type === "invite"}
        onDone={() => {
          setSession({ ...link.session, email: "" })
          setLink(null)
        }}
      />
    )
  }

  if (!session) return <Login config={config} onSignedIn={setSession} initialError={linkError} />
  return <Dashboard config={config} session={session} setSession={setSession} onSignOut={handleSignOut} />
}
