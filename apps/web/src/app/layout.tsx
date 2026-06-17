import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JobSim — Hire on skill, not just on paper',
  description: 'Replace take-home assignments with real work simulations. AI scores instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">{children}</body>
    </html>
  );
}
