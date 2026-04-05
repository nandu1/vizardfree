import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ToastContainer } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VizardFree – AI Video Clips for Indian Creators",
  description:
    "Open-source Vizard.ai clone. Create viral clips, add Hindi/Hinglish subtitles, smart reframe for Reels/Shorts – 100% free, no watermark.",
  keywords: ["hindi subtitles", "reels creator", "vizard free", "video clips", "hinglish"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${syne.variable} antialiased`}>
        <Providers>{children}</Providers>
        <ToastContainer />
      </body>
    </html>
  );
}
