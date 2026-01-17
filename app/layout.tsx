import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";


const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeetLog",
  description: "Your personal journal for mastering algorithms. Log problems, track progress, and stay consistent with your technical interview prep.",
  icons: {
    icon: '/icon_LL..svg',
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
        className={`${jost.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}