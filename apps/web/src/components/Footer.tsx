import Link from 'next/link';

function Col({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[12px] font-bold tracking-[.08em] uppercase text-ink-400">{title}</div>
      {items.map(({ label, href }) => (
        <Link key={label} href={href} className="text-[14px] text-ink-300 hover:text-white transition-colors">
          {label}
        </Link>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink-950 text-white mt-20">
      <div
        className="max-w-container mx-auto px-6 pt-14 pb-10 grid gap-10"
        style={{ gridTemplateColumns: '1.6fr 1fr 1fr 1fr' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">M</span>
            </div>
            <span className="font-bold text-[18px] font-display">Mansio</span>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-ink-400 max-w-[280px]">
            Prova il lavoro prima di candidarti. Dimostra le tue competenze con task reali, non solo con un CV.
          </p>
        </div>
        <Col title="Candidati" items={[
          { label: 'Trova lavoro', href: '/' },
          { label: 'Come funziona', href: '/#come-funziona' },
          { label: 'Le mie candidature', href: '/dashboard' },
        ]} />
        <Col title="Aziende" items={[
          { label: "Pubblica un'offerta", href: '/aziende/nuova-offerta' },
          { label: 'Per le aziende', href: '/aziende' },
          { label: 'Richiedi una demo', href: '/aziende#demo' },
        ]} />
        <Col title="Azienda" items={[
          { label: 'Chi siamo', href: '/chi-siamo' },
          { label: 'Blog', href: '/blog' },
          { label: 'Contatti', href: '/contatti' },
        ]} />
      </div>
      <div className="border-t border-ink-800 py-5 max-w-container mx-auto px-6 flex justify-between text-[13px] text-ink-500">
        <span>© 2026 Mansio S.r.l. — Milano, Italia</span>
        <span className="flex gap-5">
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Termini', href: '/termini' },
            { label: 'Cookie', href: '/cookie' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="text-ink-400 hover:text-ink-200 transition-colors">{label}</Link>
          ))}
        </span>
      </div>
    </footer>
  );
}
