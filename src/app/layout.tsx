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
  title: "Linear AI Issue Creator",
  description: "Create Linear issues from images, PDFs, and text using AI. Upload screenshots, diagrams, or paste content to automatically generate structured Linear issues.",
  openGraph: {
    title: "Linear AI Issue Creator",
    description: "Create Linear issues from images, PDFs, and text using AI. Upload screenshots, diagrams, or paste content to automatically generate structured Linear issues.",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Linear AI Issue Creator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Linear AI Issue Creator",
    description: "Create Linear issues from images, PDFs, and text using AI",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
