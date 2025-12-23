'use client'

import { useState } from 'react'
import { LineChart, Moon, Sun, Download, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportPanel } from '@/components/export-panel'
import type { BacktestResult } from '@/types'

interface HeaderProps {
  selectedResult?: BacktestResult | null
}

export function Header({ selectedResult }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [showExport, setShowExport] = useState(false)

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
            <LineChart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">StrategyLab</span>
          </div>
          
          <div className="flex-1" />
          
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">テーマ切替</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowExport(true)}
              disabled={!selectedResult}
            >
              <Download className="h-5 w-5" />
              <span className="sr-only">エクスポート</span>
            </Button>
          </nav>
        </div>
      </header>

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
