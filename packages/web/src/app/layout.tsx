import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ECOSYSTEMCL.AI - Multi-Agent Development Platform",
  description: "The world's most advanced multi-agent development platform. Deploy autonomous AI teams that code, test, review, and deploy.",
  keywords: ["AI", "development", "automation", "agents", "coding", "DevOps"],
  authors: [{ name: "ECOSYSTEMCL.AI" }],
  openGraph: {
    title: "ECOSYSTEMCL.AI - Multi-Agent Development Platform",
    description: "Deploy autonomous AI teams that code, test, review, and deploy - all while you sleep.",
    type: "website",
    url: "https://ecosystemcl.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "ECOSYSTEMCL.AI - Multi-Agent Development Platform",
    description: "Deploy autonomous AI teams that code, test, review, and deploy.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-slate-900 text-white`}>
          <Header />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
