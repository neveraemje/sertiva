import Link from "next/link"
import Image from "next/image"
import {
  BookOpen02Icon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  Link2Icon,
  MousePointer2Icon,
  UploadIcon,
} from "lucide-react"

import { HeroPreview } from "@/components/landing-hero-preview"
import { SertivaLogo } from "@/components/sertiva-logo"

const steps = [
  {
    number: "01",
    icon: UploadIcon,
    title: "Bring your design",
    description: "Upload a PDF or image and give your certificate a name.",
  },
  {
    number: "02",
    icon: MousePointer2Icon,
    title: "Place the name",
    description: "Position and style the recipient name right on your design.",
  },
  {
    number: "03",
    icon: Link2Icon,
    title: "Share one link",
    description: "Recipients add their name, preview, and download their own copy.",
  },
]

const audiences = [
  {
    label: "EVENTS",
    icon: CalendarDaysIcon,
    title: "Events & workshops",
    description: "Give attendees a simple way to collect a certificate after the event.",
  },
  {
    label: "EDUCATION",
    icon: BookOpen02Icon,
    title: "Courses & classes",
    description: "Share completion or participation certificates with your learners.",
  },
  {
    label: "WORK",
    icon: BriefcaseBusinessIcon,
    title: "Teams & organizations",
    description: "Recognize contributions, training, and milestones across your team.",
  },
  {
    label: "COMMUNITY",
    icon: UserGroupIcon,
    title: "Clubs & communities",
    description: "Make appreciation personal for members, volunteers, and contributors.",
  },
]

const questions = [
  {
    question: "Do recipients need a Sertiva account?",
    answer: "No. They can open your published link, enter their name, preview the certificate, and download it without signing in.",
  },
  {
    question: "Can I use my own certificate design?",
    answer: "Yes. Upload a PDF or image, then place the recipient name where it belongs on your design.",
  },
  {
    question: "Which download formats are available?",
    answer: "Recipients can download their personalized certificate as a PDF or PNG.",
  },
  {
    question: "Can I control who uses the link?",
    answer: "You can allow anyone with the link or limit entry to listed email addresses. You can also allow one name or repeat entries and set an expiration date. Email ownership is not verified.",
  },
]

export function LandingPage() {
  return (
    <div className="min-h-svh bg-[#fbfaf8] text-[#1b1b1b]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm">Skip to content</a>

      <header className="sticky top-0 z-50 border-b border-[#e9e9e6] bg-[#fbfaf8]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-xl font-bold tracking-tight" aria-label="Sertiva home">
            <SertivaLogo className="h-7 w-auto" />
            <span>Sertiva</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-7 text-sm text-[#5f5f5a] md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[#1b1b1b]">How it works</a>
            <a href="#use-cases" className="transition-colors hover:text-[#1b1b1b]">Use cases</a>
            <a href="#features" className="transition-colors hover:text-[#1b1b1b]">Features</a>
            <a href="#faq" className="transition-colors hover:text-[#1b1b1b]">FAQ</a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/login" className="text-sm font-medium transition-colors hover:text-[#777770]">Sign in</Link>
            <Link href="/signup" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1b1b1b] px-4 text-sm font-medium text-white transition-colors hover:bg-[#393939] sm:px-5">
              Get started <ArrowUpRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="overflow-hidden border-b border-[#e9e9e6]">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-24 sm:px-8 sm:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-10 lg:pt-24 lg:pb-32">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full border border-[#deded9] bg-white px-3 py-1.5 text-xs font-medium tracking-wide text-[#64645e]">
                Certificates, made shareable
              </span>
              <h1 className="mt-7 text-[clamp(3.2rem,6vw,5.9rem)] leading-[1.04] font-semibold tracking-[-0.065em]">
                One design.<br />A certificate<br className="hidden sm:block" /> for everyone.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-[#64645e] sm:text-lg">
                Upload your design, place the name, and publish a link. People personalize, preview, and download their own certificate without signing in.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/signup" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1b1b1b] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#393939]">
                  Create a certificate <ArrowUpRightIcon className="size-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#d9d9d4] bg-white px-6 text-sm font-semibold transition-colors hover:bg-[#f3f3f0]">
                  See how it works <ArrowRightIcon className="size-4" />
                </a>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-[#777770]">
                <CheckIcon className="size-4 text-[#4d6f58]" /> No account needed for recipients
              </p>
            </div>
            <HeroPreview />
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#797972] uppercase">How it works</p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">From design to download in three steps.</h2>
              <p className="mt-5 text-base leading-7 text-[#666660]">Set it up once. Give every recipient an easy way to make their own copy.</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.number} className="flex min-h-[260px] flex-col rounded-[1.5rem] border border-[#e8e8e4] bg-[#fbfaf8] p-7">
                    <div className="flex items-start justify-between">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-white ring-1 ring-[#e7e7e2]"><Icon className="size-5" strokeWidth={1.7} /></span>
                      <span className="text-xs font-semibold tracking-widest text-[#989891]">{step.number}</span>
                    </div>
                    <h3 className="mt-auto pt-10 text-xl font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-2 max-w-[17rem] text-sm leading-6 text-[#686862]">{step.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="editor" className="scroll-mt-24 border-t border-[#e9e9e6] bg-[#fbfaf8] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#797972] uppercase">Inside the editor</p>
                <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">Make the name feel part of your design.</h2>
              </div>
              <p className="max-w-lg text-base leading-8 text-[#65655f]">
                Drag the name into place, then choose its font, size, color, and alignment. Once you share the certificate, each recipient can enter their own name.
              </p>
            </div>
            <a
              href="/editor-preview-high-res.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 block overflow-hidden rounded-[1.25rem] border border-[#e4e4df] bg-white shadow-[0_28px_80px_-45px_rgba(17,17,17,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1b1b]"
              aria-label="View the Sertiva certificate editor screenshot at full size"
            >
              <Image
                src="/editor-preview-high-res.jpg"
                alt="Sertiva editor showing a selected recipient name on a certificate, with typography and position controls beside it"
                width={2544}
                height={1550}
                sizes="(max-width: 1280px) 100vw, 1200px"
                unoptimized
                className="block h-auto w-full"
              />
            </a>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#777770]">
              <p>See the certificate editor in action.</p>
              <a href="/editor-preview-high-res.jpg" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[#1b1b1b] hover:underline">
                View full size <ArrowUpRightIcon className="size-4" />
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 border-y border-[#e8e8e4] bg-[#f3f4f1] py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#797972] uppercase">The recipient experience</p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">Simple for the person receiving it, too.</h2>
              <p className="mt-6 text-base leading-8 text-[#65655f]">
                Your link opens a clear page where recipients enter their name, check the preview, and keep a copy in the format they need.
              </p>
              <ul className="mt-8 space-y-4 text-sm font-medium sm:text-base">
                <li className="flex items-center gap-3"><CheckIcon className="size-5 shrink-0 text-[#4d6f58]" /> Open the link without an account</li>
                <li className="flex items-center gap-3"><CheckIcon className="size-5 shrink-0 text-[#4d6f58]" /> Preview the personalized certificate</li>
                <li className="flex items-center gap-3"><CheckIcon className="size-5 shrink-0 text-[#4d6f58]" /> Download as PDF or PNG</li>
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-[#e2e4dd] bg-white p-5 shadow-[0_25px_70px_-48px_rgba(17,17,17,0.3)] sm:p-8" role="img" aria-label="Illustration of the recipient name entry, preview, and download page">
              <div className="flex items-center justify-between border-b border-[#ecece8] pb-5">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.15em] text-[#8a8a83] uppercase">Personalize your certificate</p>
                  <p className="mt-1 text-lg font-semibold">Your moment, your name.</p>
                </div>
                <SertivaLogo className="h-8 w-auto" />
              </div>
              <div className="mt-7">
                <p className="text-sm font-medium">Your name</p>
                <div className="mt-2 rounded-xl border border-[#dfdfdb] px-4 py-3.5 text-sm">Alex Morgan</div>
                <div className="mt-4 flex h-11 items-center justify-center rounded-xl bg-[#1d1d1d] text-sm font-medium text-white">Preview certificate</div>
              </div>
              <div className="mt-6 border-t border-[#e9e9e5] pt-5">
                <p className="text-sm font-medium">Download</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-medium">
                  <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfdfdb]"><DownloadIcon className="size-4" /> PDF</div>
                  <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfdfdb]"><DownloadIcon className="size-4" /> PNG</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="use-cases" className="scroll-mt-24 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#797972] uppercase">Use cases</p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">For every kind of recognition.</h2>
              <p className="mt-5 text-base leading-7 text-[#666660]">A personal certificate can mark a small thank-you or a major milestone.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {audiences.map((audience) => (
                <div key={audience.label} className="rounded-[1.5rem] border border-[#e8e8e4] p-7 sm:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <p className="pt-1 text-[11px] font-semibold tracking-[0.16em] text-[#8c8c84]">{audience.label}</p>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#e8e8e4] bg-[#fbfaf8] text-[#34342f]" aria-hidden="true">
                      <HugeiconsIcon icon={audience.icon} size={23} strokeWidth={1.6} />
                    </span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-tight">{audience.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#696963]">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#e8e8e4] bg-[#f7f7f5] py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:px-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#797972] uppercase">After publishing</p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">A link you can manage.</h2>
              <p className="mt-6 text-base leading-8 text-[#65655f]">
                Choose how your certificate link can be used, set an expiration date, and see the names and downloads recorded after you share it.
              </p>
              <Link href="/signup" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold underline decoration-[#bdbdb7] underline-offset-4 hover:decoration-[#1b1b1b]">
                Start creating <ArrowUpRightIcon className="size-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[#e4e4e0] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold">Sharing controls</p>
                <div className="mt-6 divide-y divide-[#ededeb] text-sm">
                  <div className="flex justify-between gap-4 py-3"><span className="text-[#777770]">Access</span><span className="font-medium">Anyone with link</span></div>
                  <div className="flex justify-between gap-4 py-3"><span className="text-[#777770]">Names</span><span className="font-medium">Repeat input</span></div>
                  <div className="flex justify-between gap-4 py-3"><span className="text-[#777770]">Expires</span><span className="font-medium">Your choice</span></div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[#e4e4e0] bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold">Activity at a glance</p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-[#ededeb] pb-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#efefec] text-xs font-semibold">AM</span>
                    <div className="min-w-0"><p className="text-sm font-medium">Alex Morgan</p><p className="text-xs text-[#85857e]">Certificate downloaded</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#efefec] text-xs font-semibold">JL</span>
                    <div className="min-w-0"><p className="text-sm font-medium">Jordan Lee</p><p className="text-xs text-[#85857e]">Certificate downloaded</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 bg-white py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#797972] uppercase">FAQ</p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">A few good questions.</h2>
            </div>
            <div className="border-t border-[#e7e7e3]">
              {questions.map((item) => (
                <details key={item.question} className="group border-b border-[#e7e7e3] py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-base font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDownIcon className="size-5 shrink-0 text-[#777770] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="max-w-2xl pt-4 pr-10 text-sm leading-7 text-[#666660]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1c1c1b] py-20 text-white sm:py-28">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-9 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#aaaaa5] uppercase">Ready when you are</p>
              <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.045em] sm:text-6xl">Make recognition easy to share.</h2>
              <p className="mt-5 text-base leading-7 text-[#bdbdb8]">Your design. One link. A certificate each person can make their own.</p>
            </div>
            <Link href="/signup" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#1b1b1b] transition-colors hover:bg-[#e9e9e5]">
              Create a certificate <ArrowUpRightIcon className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#1c1c1b] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/15 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-white"><SertivaLogo className="h-5 w-auto" /></span>
            Sertiva
          </Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#bdbdb8]">
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#use-cases" className="hover:text-white">Use cases</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
