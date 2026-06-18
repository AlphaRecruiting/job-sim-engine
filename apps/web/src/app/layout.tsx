import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mansio — Prova il lavoro, poi candidati',
  description: 'Completa task reali del ruolo e dimostra le tue competenze. Le aziende ti scelgono per il lavoro svolto, non solo per il CV.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
