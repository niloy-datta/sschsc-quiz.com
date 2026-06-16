import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Outfit } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { MainContent } from "@/components/layout/MainContent";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Providers } from "@/components/providers/Providers";
import { cn } from "@/lib/utils";

// Configure Google Fonts for Bangla and English numbers/characters
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "বিজ্ঞান র্যাঙ্কার — SSC ও HSC বিজ্ঞান MCQ যুদ্ধঘর",
  description:
    "বিজ্ঞান বিভাগের শিক্ষার্থীদের জন্য প্রিমিয়াম MCQ যুদ্ধঘর। অধ্যায়ভিত্তিক কুইজ, লাইভ ব্যাটল, লিডারবোর্ড ও AI দুর্বলতা রিপোর্ট — সম্পূর্ণ বাংলায়।",
  keywords:
    "SSC, HSC, Science MCQ, Physics MCQ, Chemistry MCQ, Biology, Higher Math, Bangladesh, Exam preparation, বিজ্ঞান র্যাঙ্কার",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-152x152.png",
  },
  openGraph: {
    title: "বিজ্ঞান র্যাঙ্কার — SSC ও HSC বিজ্ঞান MCQ যুদ্ধঘর",
    description:
      "বিজ্ঞান বিভাগের শিক্ষার্থীদের জন্য প্রিমিয়াম MCQ যুদ্ধঘর। কুইজ ও লাইভ র্যাঙ্কিংয়ে লড়াই করো!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={cn(
        "scroll-smooth",
        hindSiliguri.variable,
        outfit.variable,
      )}
    >
      <body
        className={cn(
          "min-h-screen bg-navy-dark text-slate-100 font-bangla antialiased selection:bg-purple-glow/30 selection:text-white",
        )}
      >
        {/* Background Aurora Ambient Lights */}
        <div className="aurora-bg">
          <div className="aurora-center" />
        </div>

        <Providers>
          {/* Global Desktop Navigation */}
          <Navbar />

          {/* Core Content */}
          <main className="relative">
            <MainContent>{children}</MainContent>
          </main>

          {/* Mobile Navigation Bar */}
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
