import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";


const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://leetlog.net'),
  title: {
    default: "LeetLog",
    template: "%s | LeetLog"
  },
  description: "Your personal journal for mastering algorithms. Log problems, track progress, and stay consistent with your technical interview prep.",
  keywords: [
    "leetcode",
    "coding interview",
    "algorithm practice",
    "leetcode tracker",
    "coding journal",
    "technical interview prep",
    "leetcode problems",
    "coding practice",
    "algorithm problems"
  ],
  authors: [{ name: "LeetLog" }],
  creator: "LeetLog",
  publisher: "LeetLog",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/llicon.png',
    shortcut: '/llicon.png',
    apple: '/llicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'LeetLog',
    title: 'LeetLog - Your Personal Algorithm Practice Journal',
    description: 'Log problems, track progress, and stay consistent with your technical interview prep. Track your LeetCode solutions, time spent, and insights.',
    images: [
      {
        url: '/white_LL.jpg',
        width: 1200,
        height: 630,
        alt: 'LeetLog Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeetLog - Your Personal Algorithm Practice Journal',
    description: 'Log problems, track progress, and stay consistent with your technical interview prep.',
    images: ['/white_LL.jpg'],
    creator: '@leetlog',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
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
        <Analytics />
      </body>
    </html>
  );
}