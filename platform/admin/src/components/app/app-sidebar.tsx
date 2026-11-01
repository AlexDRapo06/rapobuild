import { useState } from "react"
import { motion } from "motion/react"
import {
  BarChart3Icon,
  BanknoteIcon,
  ChevronsUpDownIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  ContactIcon,
  HistoryIcon,
  HourglassIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessageSquareTextIcon,
  SendIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react"

import { NameAvatar } from "@/components/app/states"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type Tab = "overview" | "analytics" | "revenue" | "registrations" | "rosters" | "waitlist" | "requests" | "compose" | "contacts" | "emails" | "settings"

export interface NavCounts {
  registrations?: number
  requests?: number
  waitlist?: number
  /** Open items in Settings → To do. */
  todos?: number
}

const GROUPS: { label: string; items: { id: Tab; label: string; icon: LucideIcon; count?: keyof NavCounts }[] }[] = [
  {
    label: "Dashboard",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboardIcon },
      { id: "analytics", label: "Analytics", icon: BarChart3Icon },
      { id: "revenue", label: "Revenue", icon: BanknoteIcon },
    ],
  },
  {
    label: "Registrations",
    items: [
      { id: "registrations", label: "Registrations", icon: ClipboardListIcon, count: "registrations" },
      { id: "rosters", label: "Rosters", icon: ClipboardCheckIcon },
      { id: "waitlist", label: "Waitlist", icon: HourglassIcon, count: "waitlist" },
      { id: "requests", label: "Private training", icon: MessageSquareTextIcon, count: "requests" },
    ],
  },
  {
    label: "Email",
    items: [
      { id: "compose", label: "Send email", icon: SendIcon },
      { id: "contacts", label: "Contacts", icon: ContactIcon },
      { id: "emails", label: "Email history", icon: HistoryIcon },
    ],
  },
  {
    label: "Manage",
    items: [{ id: "settings", label: "Settings", icon: SettingsIcon, count: "todos" }],
  },
]

export const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  analytics: "Analytics",
  revenue: "Revenue",
  registrations: "Registrations",
  rosters: "Rosters",
  waitlist: "Waitlist",
  requests: "Private training",
  compose: "Send email",
  contacts: "Contacts",
  emails: "Email history",
  settings: "Settings",
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-[13px] font-bold tracking-tight text-white shadow-sm ring-1 ring-emerald-700/20",
        className
      )}
    >
      FU
    </span>
  )
}

/**
 * Navigation with a highlight that glides to the hovered item and settles back
 * on the active one (the interaction pattern popularised by Animate UI),
 * built on the shadcn/ReUI sidebar and motion.
 */
export function AppSidebar({
  tab,
  onTab,
  counts,
  email,
  onSignOut,
  miami,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  counts: NavCounts
  email: string
  onSignOut: () => void
  miami?: { label: string; tone: "open" | "pending" | "closed"; detail: string } | null
}) {
  const [hovered, setHovered] = useState<Tab | null>(null)
  const { isMobile, setOpenMobile } = useSidebar()
  const highlighted = hovered ?? tab

  const go = (t: Tab) => {
    onTab(t)
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none" tabIndex={-1}>
              <BrandMark />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">Footy Up</span>
                <span className="text-muted-foreground truncate text-xs">Registration admin</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent onMouseLeave={() => setHovered(null)}>
        {GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const count = item.count ? counts[item.count] : undefined
                  const active = tab === item.id
                  return (
                    <SidebarMenuItem key={item.id} onMouseEnter={() => setHovered(item.id)}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        onClick={() => go(item.id)}
                        className="relative h-9 bg-transparent! hover:bg-transparent! data-[active=true]:bg-transparent!"
                      >
                        {highlighted === item.id && (
                          <motion.span
                            layoutId="sidebar-highlight"
                            className="bg-sidebar-accent ring-sidebar-border absolute inset-0 rounded-md shadow-xs ring-1"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          />
                        )}
                        <item.icon className={cn("relative z-10", active ? "text-brand-strong" : "text-muted-foreground")} />
                        <span className={cn("relative z-10", active && "font-medium text-foreground")}>{item.label}</span>
                      </SidebarMenuButton>
                      {count !== undefined && count > 0 && (
                        <SidebarMenuBadge className={cn("z-10 tabular-nums", item.count === "todos" ? "rounded-full bg-amber-100 px-1.5 text-amber-800" : "text-muted-foreground")} title={item.count === "todos" ? `${count} to-do items` : undefined}>{count}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {miami && (
          <div className="mx-2 mt-auto mb-2 rounded-lg border bg-card p-3 shadow-xs group-data-[collapsible=icon]:hidden">
            <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">Miami combine</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <span className="relative flex size-2">
                {miami.tone === "open" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                <span
                  className={cn(
                    "relative inline-flex size-2 rounded-full",
                    miami.tone === "open" ? "bg-emerald-500" : miami.tone === "pending" ? "bg-amber-500" : "bg-zinc-400"
                  )}
                />
              </span>
              {miami.label}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">{miami.detail}</p>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <NameAvatar name={email.split("@")[0]!.replace(/[._-]+/g, " ")} className="rounded-lg" />
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{email.split("@")[0]}</span>
                    <span className="text-muted-foreground truncate text-xs">{email}</span>
                  </span>
                  <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="end" sideOffset={6} className="min-w-56 rounded-lg">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">Signed in</p>
                  <p className="text-muted-foreground truncate text-xs">{email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
