"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { AppSidebar, type DashboardSection } from "@/components/app-sidebar"
import { CertificateEditor } from "@/components/certificate/certificate-editor"
import { CertificateList } from "@/components/certificate/certificate-list"
import { LocaleProvider, useMessages } from "@/components/i18n/locale-provider"
import { NewCertificateSheet } from "@/components/certificate/new-certificate-sheet"
import { PublicationActivityDialog } from "@/components/certificate/publication-activity-dialog"
import type { PreparedDesignFile } from "@/components/certificate/prepare-design-file"
import type { CertificateEditorState, CertificateRecord, CertificateView } from "@/components/certificate/types"
import { SettingsPage } from "@/components/settings/settings-page"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/auth"
import {
  createCertificate as createStoredCertificate,
  deleteCertificate as deleteStoredCertificate,
  loadCertificates,
  saveCertificateEditor,
} from "@/lib/certificates/client"

const defaultEditor: CertificateEditorState = {
  recipientName: "Alexandra Morgan",
  fontSize: 34,
  fontFamily: "Georgia, serif",
  fontWeight: 400,
  textColor: "#171717",
  textOpacity: 100,
  textAlign: "center",
  position: { x: 50, y: 57 },
  autoFit: true,
}

function updateDashboardUrl(certificateId: string | null, view: CertificateView | null, method: "pushState" | "replaceState" = "pushState") {
  const url = new URL(window.location.href)
  url.searchParams.delete("section")
  if (certificateId) {
    url.searchParams.set("certificate", certificateId)
    if (view) url.searchParams.set("view", view)
    else url.searchParams.delete("view")
  } else {
    url.searchParams.delete("certificate")
    url.searchParams.delete("view")
  }
  window.history[method](null, "", url)
}

function updateSectionUrl(section: DashboardSection) {
  const url = new URL(window.location.href)
  url.searchParams.delete("certificate")
  url.searchParams.delete("view")
  if (section === "settings") url.searchParams.set("section", "settings")
  else url.searchParams.delete("section")
  window.history.pushState(null, "", url)
}

const messages = {
  en: { opening: "Opening certificate…" },
  id: { opening: "Membuka sertifikat…" },
}

function OpeningCertificate() {
  const t = useMessages(messages)
  return <div className="flex min-h-svh flex-1 items-center justify-center text-sm text-muted-foreground">{t.opening}</div>
}

export function CertificateAdmin({ user: initialUser, initialCertificateId, initialView, initialSection }: {
  user: CurrentUser
  initialCertificateId: string | null
  initialView: CertificateView | null
  initialSection: DashboardSection
}) {
  const [userName, setUserName] = useState(initialUser.name)
  const user = { ...initialUser, name: userName }
  const [section, setSection] = useState<DashboardSection>(initialCertificateId ? "certificates" : initialSection)
  const [certificates, setCertificates] = useState<CertificateRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(initialCertificateId)
  const [view, setView] = useState<CertificateView | null>(initialView)
  const [activityId, setActivityId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatuses, setSaveStatuses] = useState<Record<string, "saving" | "saved" | "error">>({})
  const certificatesRef = useRef<CertificateRecord[]>([])
  const activeIdRef = useRef(initialCertificateId)
  const pendingSaves = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const saveQueues = useRef(new Map<string, Promise<void>>())
  const latestEditors = useRef(new Map<string, CertificateEditorState>())
  const activeCertificate = certificates.find((certificate) => certificate.id === activeId)
  const activeView = view === "details" && !activeCertificate?.publication
    ? "edit"
    : view ?? (activeCertificate?.publication ? "details" : "edit")
  const activityCertificate = certificates.find((certificate) => certificate.id === activityId) ?? null

  useEffect(() => {
    function restoreLocation() {
      const params = new URLSearchParams(window.location.search)
      const nextView = params.get("view")
      const nextId = params.get("certificate")
      activeIdRef.current = nextId
      setActiveId(nextId)
      setSection(!nextId && params.get("section") === "settings" ? "settings" : "certificates")
      setView(nextView === "edit" || nextView === "preview" || nextView === "details" ? nextView : null)
    }
    window.addEventListener("popstate", restoreLocation)
    return () => window.removeEventListener("popstate", restoreLocation)
  }, [])

  function openCertificate(id: string) {
    const certificate = certificatesRef.current.find((item) => item.id === id)
    const nextView = certificate?.publication ? "details" : "edit"
    activeIdRef.current = id
    setActiveId(id)
    setSection("certificates")
    setView(nextView)
    updateDashboardUrl(id, nextView)
  }

  function showCertificateList() {
    activeIdRef.current = null
    setActiveId(null)
    setView(null)
    setSection("certificates")
    updateDashboardUrl(null, null)
  }

  function showSettings() {
    activeIdRef.current = null
    setActiveId(null)
    setView(null)
    setSection("settings")
    updateSectionUrl("settings")
  }

  function changeView(nextView: CertificateView) {
    if (!activeId) return
    setView(nextView)
    updateDashboardUrl(activeId, nextView)
  }

  const reloadCertificates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const records = await loadCertificates(user.id)
      certificatesRef.current = records
      setCertificates(records)
      if (activeIdRef.current && !records.some((certificate) => certificate.id === activeIdRef.current)) {
        activeIdRef.current = null
        setActiveId(null)
        setView(null)
        updateDashboardUrl(null, null, "replaceState")
      }
    } catch (caught) {
      // An empty message makes CertificateList show its own translated fallback.
      setError(caught instanceof Error ? caught.message : "")
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    let cancelled = false
    void loadCertificates(user.id).then((records) => {
      if (cancelled) return
      certificatesRef.current = records
      setCertificates(records)
      if (activeIdRef.current && !records.some((certificate) => certificate.id === activeIdRef.current)) {
        activeIdRef.current = null
        setActiveId(null)
        setView(null)
        updateDashboardUrl(null, null, "replaceState")
      }
      setLoading(false)
    }).catch((caught) => {
      if (cancelled) return
      setError(caught instanceof Error ? caught.message : "")
      setLoading(false)
    })
    const timers = pendingSaves.current
    return () => {
      cancelled = true
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [user.id])

  async function createCertificate(name: string, design: PreparedDesignFile) {
    const certificate = await createStoredCertificate(user.id, name, design, { ...defaultEditor })
    const next = [certificate, ...certificatesRef.current]
    certificatesRef.current = next
    setCertificates(next)
    openCertificate(certificate.id)
    setSaveStatuses((current) => ({ ...current, [certificate.id]: "saved" }))
    setNewOpen(false)
  }

  function persistEditor(id: string, editor: CertificateEditorState) {
    const previous = saveQueues.current.get(id) ?? Promise.resolve()
    const next = previous.catch(() => {}).then(() => saveCertificateEditor(user.id, id, editor))
    saveQueues.current.set(id, next)
    void next.then(() => {
      if (latestEditors.current.get(id) === editor && saveQueues.current.get(id) === next) {
        const updated = certificatesRef.current.map((certificate) => certificate.id === id
          ? { ...certificate, updatedAt: "Just now" }
          : certificate)
        certificatesRef.current = updated
        setCertificates(updated)
        setSaveStatuses((current) => ({ ...current, [id]: "saved" }))
      }
    }).catch((caught) => {
      if (saveQueues.current.get(id) === next) setSaveStatuses((current) => ({ ...current, [id]: "error" }))
      console.error("Could not save certificate changes:", caught)
    })
    return next
  }

  function updateActiveEditor(patch: Partial<CertificateEditorState>) {
    if (!activeId) return
    const current = certificatesRef.current.find((certificate) => certificate.id === activeId)
    if (!current) return
    const editor = { ...current.editor, ...patch }
    const next = certificatesRef.current.map((certificate) => certificate.id === activeId
      ? { ...certificate, editor, updatedAt: "Just now" }
      : certificate)
    certificatesRef.current = next
    latestEditors.current.set(activeId, editor)
    setCertificates(next)
    setSaveStatuses((current) => ({ ...current, [activeId]: "saving" }))
    const existing = pendingSaves.current.get(activeId)
    if (existing) clearTimeout(existing)
    pendingSaves.current.set(activeId, setTimeout(() => {
      pendingSaves.current.delete(activeId)
      void persistEditor(activeId, editor)
    }, 600))
  }

  async function saveActiveEditor() {
    if (!activeId) return
    const id = activeId
    const timer = pendingSaves.current.get(id)
    if (timer) clearTimeout(timer)
    pendingSaves.current.delete(id)
    const editor = latestEditors.current.get(id) ?? certificatesRef.current.find((certificate) => certificate.id === id)?.editor
    if (!editor) throw new Error("Certificate not found.")
    latestEditors.current.set(id, editor)
    setSaveStatuses((current) => ({ ...current, [id]: "saving" }))
    await persistEditor(id, editor)
  }

  async function deleteCertificate(id: string) {
    const timer = pendingSaves.current.get(id)
    if (timer) clearTimeout(timer)
    pendingSaves.current.delete(id)
    await saveQueues.current.get(id)?.catch(() => {})
    await deleteStoredCertificate(user.id, id)
    const next = certificatesRef.current.filter((certificate) => certificate.id !== id)
    certificatesRef.current = next
    setCertificates(next)
    if (activeId === id) showCertificateList()
    if (activityId === id) setActivityId(null)
  }

  return (
    <LocaleProvider initialLocale={initialUser.locale}>
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 60)" } as React.CSSProperties}>
        <AppSidebar section={section} onCertificates={showCertificateList} onSettings={showSettings} user={user} />
        <SidebarInset className="min-h-screen bg-muted/25">
          {section === "settings" ? (
            <SettingsPage user={user} onNameChange={setUserName} />
          ) : activeCertificate ? (
            <CertificateEditor
              key={activeCertificate.id}
              certificate={activeCertificate}
              view={activeView}
              onViewChange={changeView}
              userId={user.id}
              onBack={showCertificateList}
              onChange={updateActiveEditor}
              onSave={saveActiveEditor}
              onDelete={deleteCertificate}
              onViewActivity={() => setActivityId(activeCertificate.id)}
              saveStatus={saveStatuses[activeCertificate.id] ?? "idle"}
              onPublished={reloadCertificates}
            />
          ) : activeId && loading ? (
            <OpeningCertificate />
          ) : (
            <CertificateList
              certificates={certificates}
              loading={loading}
              error={error}
              onRetry={reloadCertificates}
              onCreate={() => setNewOpen(true)}
              onOpen={openCertificate}
            />
          )}

          <NewCertificateSheet open={newOpen} onOpenChange={setNewOpen} onCreate={createCertificate} />
          <PublicationActivityDialog key={activityId ?? "closed"} certificate={activityCertificate} onOpenChange={(open) => {
            if (!open) setActivityId(null)
          }} />
        </SidebarInset>
      </SidebarProvider>
    </LocaleProvider>
  )
}
