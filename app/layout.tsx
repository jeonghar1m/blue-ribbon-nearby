import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "블루리본 근처 맛집",
  description: "내 주변 블루리본 레스토랑을 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://jeongharim.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline hover:text-gray-700"
          >
            Jeong Harim
          </a>
        </footer>
      </body>
      <Analytics />
    </html>
  );
}
