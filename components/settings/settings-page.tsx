"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { useLocale, useMessages } from "@/components/i18n/locale-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/auth"
import type { Locale } from "@/lib/i18n/locale"
import { createClient } from "@/lib/supabase/client"

const messages = {
  en: {
    eyebrow: "Account",
    title: "Settings",
    description: "Manage your profile and how Sertiva looks for you.",
    profileTitle: "Profile",
    profileDescription: "Your name is shown in the sidebar.",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    nameRequired: "Enter your name.",
    nameTooLong: "Use 80 characters or fewer.",
    emailLabel: "Email",
    emailHint: "Your email is used to sign in and can't be changed here.",
    save: "Save changes",
    saving: "Saving…",
    saved: "Profile saved.",
    saveFailed: "Could not save your profile.",
    languageTitle: "Language",
    languageDescription: "Choose the language for your dashboard. Certificate pages and emails for recipients stay in English.",
    languageFailed: "Could not save your language. Please try again.",
    signOutTitle: "Sign out",
    signOutDescription: "Sign out of Sertiva on this device.",
  },
  id: {
    eyebrow: "Akun",
    title: "Pengaturan",
    description: "Kelola profil Anda dan tampilan Sertiva untuk Anda.",
    profileTitle: "Profil",
    profileDescription: "Nama Anda ditampilkan di sidebar.",
    nameLabel: "Nama",
    namePlaceholder: "Nama Anda",
    nameRequired: "Masukkan nama Anda.",
    nameTooLong: "Gunakan maksimal 80 karakter.",
    emailLabel: "Email",
    emailHint: "Email Anda digunakan untuk masuk dan tidak dapat diubah di sini.",
    save: "Simpan perubahan",
    saving: "Menyimpan…",
    saved: "Profil disimpan.",
    saveFailed: "Tidak dapat menyimpan profil Anda.",
    languageTitle: "Bahasa",
    languageDescription: "Pilih bahasa untuk dasbor Anda. Halaman sertifikat dan email untuk penerima tetap dalam bahasa Inggris.",
    languageFailed: "Tidak dapat menyimpan bahasa Anda. Silakan coba lagi.",
    signOutTitle: "Keluar",
    signOutDescription: "Keluar dari Sertiva di perangkat ini.",
  },
}

const languageOptions: { value: Locale; label: string; description: string }[] = [
  { value: "en", label: "English", description: "English" },
  { value: "id", label: "Bahasa Indonesia", description: "Indonesian" },
]

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
}

// Saves to the user's auth metadata, then refreshes the session so the server sees the new values.
async function updateUserMetadata(data: Record<string, string>) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ data })
  if (error) throw error
  await supabase.auth.refreshSession()
}

export function SettingsPage({ user, onNameChange }: { user: CurrentUser; onNameChange: (name: string) => void }) {
  const t = useMessages(messages)
  const { locale, setLocale } = useLocale()
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileStatus, setProfileStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingLocale, setSavingLocale] = useState<Locale | null>(null)
  const [localeError, setLocaleError] = useState(false)
  const trimmedName = name.trim()

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmedName) return setProfileStatus({ ok: false, text: t.nameRequired })
    if (trimmedName.length > 80) return setProfileStatus({ ok: false, text: t.nameTooLong })

    setSavingProfile(true)
    setProfileStatus(null)
    try {
      await updateUserMetadata({ display_name: trimmedName })
      onNameChange(trimmedName)
      setName(trimmedName)
      setProfileStatus({ ok: true, text: t.saved })
      router.refresh()
    } catch {
      setProfileStatus({ ok: false, text: t.saveFailed })
    } finally {
      setSavingProfile(false)
    }
  }

  async function changeLocale(next: Locale) {
    if (next === locale || savingLocale) return
    const previous = locale
    setLocale(next)
    setSavingLocale(next)
    setLocaleError(false)
    try {
      await updateUserMetadata({ locale: next })
      router.refresh()
    } catch {
      setLocale(previous)
      setLocaleError(true)
    } finally {
      setSavingLocale(null)
    }
  }

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-start gap-2">
        <SidebarTrigger className="mt-4 -ml-2 md:hidden" />
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">{t.eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
        </div>
      </div>

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.profileTitle}</CardTitle>
            <CardDescription>{t.profileDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={(event) => void saveProfile(event)}>
              <div className="flex items-center gap-3">
                <Avatar className="size-12 rounded-xl">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={trimmedName || user.name} /> : null}
                  <AvatarFallback className="rounded-xl bg-foreground text-background">{getInitials(trimmedName || user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{trimmedName || user.name}</p>
                  {user.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-name">{t.nameLabel}</Label>
                <Input
                  id="settings-name"
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  placeholder={t.namePlaceholder}
                  onChange={(event) => {
                    setName(event.target.value)
                    setProfileStatus(null)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-email">{t.emailLabel}</Label>
                <Input id="settings-email" type="email" value={user.email ?? ""} readOnly disabled />
                <p className="text-xs text-muted-foreground">{t.emailHint}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={savingProfile || trimmedName === user.name}>
                  {savingProfile ? t.saving : t.save}
                </Button>
                {profileStatus && (
                  <p role={profileStatus.ok ? "status" : "alert"} className={cn("text-sm", profileStatus.ok ? "text-emerald-700" : "text-destructive")}>
                    {profileStatus.text}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.languageTitle}</CardTitle>
            <CardDescription>{t.languageDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label={t.languageTitle} className="grid gap-3 sm:grid-cols-2">
              {languageOptions.map((option) => {
                const selected = locale === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    lang={option.value}
                    disabled={savingLocale !== null}
                    onClick={() => void changeLocale(option.value)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-progress",
                      selected ? "border-foreground bg-muted/50" : "hover:border-foreground/30 hover:bg-muted/30",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.description}</span>
                    </span>
                    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", selected && "border-foreground bg-foreground text-background")}>
                      {selected ? <CheckIcon className="size-3" /> : null}
                    </span>
                  </button>
                )
              })}
            </div>
            {localeError && <p role="alert" className="mt-3 text-sm text-destructive">{t.languageFailed}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.signOutTitle}</CardTitle>
            <CardDescription>{t.signOutDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
