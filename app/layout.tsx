import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jareb Content Hub',
  description: 'Content aggregation app for news, videos, and GitHub updates.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
