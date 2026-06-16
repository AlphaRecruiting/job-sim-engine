import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Sim Engine',
  description: 'Modular job simulation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
