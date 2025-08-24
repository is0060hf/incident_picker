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
    <nav className="bg-white shadow-sm border-b" aria-label="メインナビゲーション">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-2 overflow-x-auto py-2" role="list">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`
                  block py-3 px-4 rounded-md text-base font-medium
                  transition-all duration-150 ease-in-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  ${
                    pathname === link.href
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                  }
                `}
                aria-current={pathname === link.href ? 'page' : undefined}
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