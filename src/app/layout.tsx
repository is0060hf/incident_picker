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
      <body className="min-h-screen bg-background text-text-primary">
        {/* スクリーンリーダー用スキップリンク */}
        <a 
          href="#main-content" 
          className="sr-only-focusable absolute top-4 left-4 z-50 bg-white px-4 py-2 text-primary font-medium rounded-md shadow-lg"
        >
          メインコンテンツへスキップ
        </a>
        
        <div className="min-h-screen flex flex-col">
          {/* ヘッダーとナビゲーション */}
          <header className="bg-white shadow-sm border-b border-border" role="banner">
            <div className="container mx-auto px-4 py-6">
              <h1 className="text-3xl font-bold text-text-primary">
                インシデント管理システム
              </h1>
            </div>
          </header>
          
          <Navigation />
          
          {/* メインコンテンツ */}
          <main 
            id="main-content" 
            className="flex-1 container mx-auto px-4 py-8 focus-visible:outline-none"
            tabIndex={-1}
          >
            {children}
          </main>
          
          {/* フッター */}
          <footer className="bg-background-secondary border-t border-border mt-auto" role="contentinfo">
            <div className="container mx-auto px-4 py-4 text-sm text-text-secondary">
              © 2024 インシデント管理システム - WCAG 2.2準拠
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}


