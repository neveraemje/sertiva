import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/roboto/wght.css";
import "@fontsource-variable/montserrat/wght.css";
import "@fontsource-variable/open-sans/wght.css";
import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource-variable/merriweather/wght.css";
import "@fontsource-variable/dancing-script/wght.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Sertiva Admin — Certificate Builder",
  description: "Create, configure, and share personalized certificates with Sertiva.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
