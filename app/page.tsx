import type { Metadata } from "next"

import { LandingPage } from "@/components/landing-page"

export const metadata: Metadata = {
  title: "Sertiva — Certificates people can personalize",
  description: "Upload your certificate design, publish one link, and let recipients personalize, preview, and download their own PDF or PNG.",
}

export default function Home() {
  return <LandingPage />
}
