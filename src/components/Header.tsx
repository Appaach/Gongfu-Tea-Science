import React from 'react';
import { Beaker, BookOpen, Layers } from 'lucide-react';

export type ActiveTab = 'simulator' | 'research' | 'protocols';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'simulator', label: 'Симулятор проливов', icon: Beaker },
    { id: 'research', label: 'Биохимия и научная база', icon: BookOpen },
    { id: 'protocols', label: 'Методы заваривания', icon: Layers },
  ];

  return (
    <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 sm:py-3 gap-2 sm:gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-800 text-stone-100 flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              茶
            </div>
            <span className="font-serif font-bold text-stone-900 tracking-tight text-base sm:text-lg">
              Расчет кинетики экстракции чая
            </span>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
