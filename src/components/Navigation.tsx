'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'ダッシュボード' },
    { href: '/channels', label: 'チャンネル管理' },
    { href: '/slack-fetch', label: 'Slack取得' },
    { href: '/incidents', label: 'インシデント一覧' },
    { href: '/search', label: '検索' },
    { href: '/rules', label: 'ルール管理' },
    { href: '/reports', label: 'レポート' },
    { href: '/audit', label: '監査ログ' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-6 overflow-x-auto">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block py-4 px-2 border-b-2 hover:text-blue-600 ${
                  pathname === link.href
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}