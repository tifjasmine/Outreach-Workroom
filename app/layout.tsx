import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Outreach Workroom',
  description: 'A calm, fast outreach and task workspace for The Daily Session and The Healing Directory.',
  metadataBase: new URL('https://outreach-workroom.buzzy-fawn-9912.chatgpt.site'),
  openGraph: {
    title: 'Outreach Workroom',
    description: 'A calm home for outreach, tasks, and team momentum.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outreach Workroom',
    description: 'A calm home for outreach, tasks, and team momentum.',
    images: ['/og.png'],
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
