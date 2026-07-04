import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lexora AI",
  description: "Smarter rewriting. More human results.",
  verification: {
    google: "bd2ZO_yZYeWgiF6Q_CN4K03Fz3fgTbHfXlvvYN3wg9g",
    other: {
      "msvalidate.01": "A7DD98FD58EA12CE281A8C68FD8368F3"
  },
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
