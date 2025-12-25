'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Moon, Sun, Download, HelpCircle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportPanel } from '@/components/export-panel'
import { HelpPanel } from '@/components/help-panel'
import type { BacktestResult } from '@/types'

interface HeaderProps {
  selectedResult?: BacktestResult | null
}

export function Header({ selectedResult }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Image 
              src="/icon.png" 
              alt="StrategyLab" 
              width={28} 
              height={28}
              className="rounded"
            />
            <span className="font-bold text-xl">StrategyLab</span>
          </div>
          
          <div className="flex-1" />
          
          <nav className="flex items-center space-x-1">
            {/* Help Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHelp(true)}
              title="使い方"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">使い方</span>
            </Button>
            
            {/* Docs Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              title="戦略ガイド"
            >
              <Link href="/docs">
                <BookOpen className="h-5 w-5" />
                <span className="sr-only">戦略ガイド</span>
              </Link>
            </Button>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="テーマ切替">
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">テーマ切替</span>
            </Button>
            
            {/* Export Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowExport(true)}
              disabled={!selectedResult}
              title="エクスポート"
            >
              <Download className="h-5 w-5" />
              <span className="sr-only">エクスポート</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Help Panel */}
      <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6">
            <ExportPanel 
              selectedResult={selectedResult || null} 
              onClose={() => setShowExport(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
