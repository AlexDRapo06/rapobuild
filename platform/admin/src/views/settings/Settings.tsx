import { useCallback, useState } from "react"

import type { Api } from "../../api"
import { useLoad } from "../../useLoad"
import { PillTabs } from "@/components/app/kit"
import { ErrorState, PageHeader } from "@/components/app/states"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminSettings } from "./AdminSettings"
import { TodoSettings } from "./TodoSettings"
import { TrainingSettings } from "./TrainingSettings"
import { CampsSettings } from "./CampsSettings"
import { DiscountSettings } from "./DiscountSettings"
import { EmailSettings } from "./EmailSettings"
import { AccessCodes, MiamiSettings } from "./MiamiSettings"
import type { SettingsData } from "./types"
import { SettingsGuide } from "./SettingsGuide"
import { WaiverSettings } from "./WaiverSettings"

type Section = "todo" | "camps" | "miami" | "codes" | "discounts" | "training" | "waivers" | "email" | "admins"
const SECTIONS: { value: Section; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "camps", label: "Camps & sessions" },
  { value: "miami", label: "College Combine" },
  { value: "codes", label: "Access codes" },
  { value: "discounts", label: "Discounts & promo codes" },
  { value: "training", label: "Private training" },
  { value: "waivers", label: "Waivers" },
  { value: "email", label: "Email" },
  { value: "admins", label: "Admins" },
]

export function Settings({ api, onExpired, refreshKey, params }: { api: Api; onExpired: () => void; refreshKey: number; params: Record<string, string> }) {
  const [section, setSection] = useState<Section>((SECTIONS.find((s) => s.value === params.section)?.value) ?? "todo")
  const load = useCallback(() => api<SettingsData>("settings-data"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Change prices, spots, dates, codes, discounts, waivers, email and who can sign in, without a developer. Changes apply to new checkouts right away." />
      <PillTabs id="settings" value={section} onChange={setSection} options={SECTIONS} />
      <SettingsGuide section={section} />
      {section === "todo" ? (
        <TodoSettings api={api} onExpired={onExpired} onSection={(s) => setSection(s as Section)} onChanged={reload} />
      ) : section === "email" ? (
        <EmailSettings api={api} onExpired={onExpired} />
      ) : section === "admins" ? (
        <AdminSettings api={api} onExpired={onExpired} />
      ) : loading && !data ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : error && !data ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : data ? (
        <>
          {section === "camps" && <CampsSettings api={api} camps={data.camps} reload={reload} />}
          {section === "miami" && (data.miami ? <MiamiSettings key={JSON.stringify(data.miami.groups.map((g) => g.taken))} api={api} miami={data.miami} reload={reload} /> : <Card><ErrorState message="The combine isn't set up yet. Run `pnpm miami config` once." /></Card>)}
          {section === "codes" && <AccessCodes api={api} codes={data.codes} reload={reload} />}
          {section === "discounts" && <DiscountSettings api={api} data={data} reload={reload} />}
          {section === "training" && <TrainingSettings api={api} packages={data.trainingPackages} reload={reload} />}
          {section === "waivers" && <WaiverSettings api={api} data={data} reload={reload} />}
        </>
      ) : null}
    </div>
  )
}
