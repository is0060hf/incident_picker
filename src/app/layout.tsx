import React from 'react';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'インシデント管理システム',
  description: 'Slackからインシデントを自動収集・分類',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* スクリーンリーダー用スキップリンク */}
        <a href="#main-content" className="sr-only focus:not-sr-only">
          メインコンテンツへスキップ
        </a>
        
        <div className="min-h-screen bg-gray-50">
          {/* ヘッダーとナビゲーション */}
          <header className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">インシデント管理システム</h1>
            </div>
          </header>
          
          <Navigation />
          
          {/* メインコンテンツ */}
          <main id="main-content" className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}


