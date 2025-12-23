import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StrategyLab - システムトレード戦略バックテスト',
  description: '42種類のトレード戦略をバックテストし、最適なパラメーターを発見。複数銘柄比較、PineScript/MQL出力対応。',
  keywords: ['システムトレード', 'バックテスト', 'テクニカル分析', 'トレード戦略', 'RSI', 'MACD', 'ボリンジャーバンド', 'タートルズ'],
  authors: [{ name: 'StrategyLab' }],
  openGraph: {
    title: 'StrategyLab - システムトレード戦略バックテスト',
    description: '42種類のトレード戦略をバックテストし、最適なパラメーターを発見',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
