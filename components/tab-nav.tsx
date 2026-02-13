'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Analytics', href: '/analytics' },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-0 mb-6 border-b border-[#E5E5E5]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-3 text-lg font-semibold transition-colors relative ${
              isActive
                ? 'text-[#1A1A1A]'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
            style={{ fontFamily: 'var(--font-jost)' }}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
