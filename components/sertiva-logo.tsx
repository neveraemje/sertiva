import Image from "next/image"

export function SertivaLogo({ className }: { className?: string }) {
  return <Image src="/sertiva.svg" alt="" aria-hidden="true" width={24} height={25} className={className} />
}
