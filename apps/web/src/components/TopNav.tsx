'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Building2 } from 'lucide-react';

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-50 border-b border-ink-200"
      style={{ background: 'rgba(255,255,255,.86)', backdropFilter: 'saturate(180%) blur(12px)' }}
    >
      <div className="max-w-container mx-auto px-6 h-[68px] flex items-center gap-7">
        <Link href="/" className="flex items-center gap-2.5 flex-none">
          <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold font-display">M</span>
          </div>
          <span className="font-bold text-[20px] font-display text-ink-950 tracking-tight">Mansio</span>
        </Link>

        <nav className="flex gap-6 items-center">
          {[
            { href: '/', label: 'Trova lavoro' },
            { href: '/dashboard', label: 'Le mie candidature' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-[15px] font-semibold pb-px border-b-2 transition-colors ${
                isActive(href)
                  ? 'text-ink-950 border-brand'
                  : 'text-ink-500 border-transparent hover:text-ink-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/aziende"
            className="text-[14px] font-semibold text-ink-500 hover:text-ink-700 flex items-center gap-1.5 transition-colors"
          >
            <Building2 size={16} /> Per le aziende
          </Link>
          <div className="w-px h-6 bg-ink-200" />
          <button type="button" className="text-ink-400 hover:text-ink-700 transition-colors flex">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[13px] font-bold font-display select-none">
            G
          </div>
        </div>
      </div>
    </header>
  );
}
