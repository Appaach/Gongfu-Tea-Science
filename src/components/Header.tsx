import React from 'react';
import { Beaker, BookOpen, Scale, Bookmark } from 'lucide-react';

export type ActiveTab = 'simulator' | 'compare' | 'journal' | 'research';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'simulator', label: 'Симулятор', icon: Beaker },
    { id: 'compare', label: 'Сравнение', icon: Scale },
    { id: 'journal', label: 'Дневник', icon: Bookmark },
    { id: 'research', label: 'Научная база', icon: BookOpen },
  ];

  return (
    <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur-md relative z-10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 sm:py-3 gap-2.5 sm:gap-3">
          <div className="flex items-center">
            <span className="font-serif font-bold text-stone-900 tracking-tight text-base sm:text-lg">
              Расчет кинетики экстракции чая
            </span>
          </div>

          {/* Unified 2x2 Table Navigation Window */}
          <nav className="inline-grid grid-cols-2 gap-0.5 rounded-lg bg-stone-100 p-1 border border-stone-200 print:hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`px-3.5 py-1.5 rounded-md text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
