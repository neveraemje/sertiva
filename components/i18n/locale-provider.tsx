"use client"

import { createContext, useContext, useEffect, useState } from "react"

import { dateFnsLocales, defaultLocale, localeTags, type Locale, type Messages } from "@/lib/i18n/locale"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({ locale: defaultLocale, setLocale: () => {} })

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocale] = useState(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <LocaleContext value={{ locale, setLocale }}>{children}</LocaleContext>
}

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext)
  return { locale, setLocale, localeTag: localeTags[locale], dateLocale: dateFnsLocales[locale] }
}

// Each component keeps its own English and Bahasa Indonesia text next to it.
export function useMessages<T>(messages: Messages<T>) {
  return messages[useContext(LocaleContext).locale]
}
