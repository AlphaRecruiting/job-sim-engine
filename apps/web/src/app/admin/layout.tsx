'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex flex-col p-4 gap-1">
        <div className="text-lg font-bold mb-6 px-2">Job Sim</div>
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`px-3 py-2 rounded text-sm font-medium transition ${pathname.startsWith(item.href) ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            {item.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
