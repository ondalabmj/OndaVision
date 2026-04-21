/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { History, Moon, Sun } from "lucide-react";

interface HeaderProps {
  onToggleHistory: () => void;
}

export function Header({ onToggleHistory }: HeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
          <img 
            src="/logo.png" 
            alt="OndaVision Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="font-bold text-[18px] tracking-[-0.03em] text-[#111827] dark:text-white">
          OndaVision
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleHistory}
          className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          title="생성 기록"
        >
          <History className="w-5 h-5" />
        </button>
        <div className="h-4 w-[1px] bg-zinc-100 dark:bg-zinc-800" />
        <button className="p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          <Moon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
