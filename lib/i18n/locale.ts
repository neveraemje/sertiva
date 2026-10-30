import { enUS, id } from "date-fns/locale"

export const locales = ["en", "id"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
}

// BCP 47 tags for Intl and toLocaleString.
export const localeTags: Record<Locale, string> = { en: "en-US", id: "id-ID" }

export const dateFnsLocales = { en: enUS, id }

export type Messages<T> = Record<Locale, T>
