import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SprintCopilot - AI-Powered Sprint Planning',
  description: 'Transform feature requests into actionable sprint tickets with AI',
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
