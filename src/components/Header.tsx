import React from 'react';
import { Beaker, BookOpen, Layers, Scale, Bookmark } from 'lucide-react';

export type ActiveTab = 'simulator' | 'compare' | 'journal' | 'research' | 'protocols';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const practiceTabs = [
    { id: 'simulator', label: 'Симулятор проливов', icon: Beaker },
    { id: 'compare', label: 'Сравнение сортов', icon: Scale },
    { id: 'journal', label: 'Дневник дегустаций', icon: Bookmark },
  ];

  const knowledgeTabs = [
    { id: 'research', label: 'Биохимия и научная база', icon: BookOpen },
    { id: 'protocols', label: 'Методы заваривания', icon: Layers },
  ];

  const renderTabButton = (tab: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        id={`tab-${tab.id}`}
        onClick={() => setActiveTab(tab.id as ActiveTab)}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
          isActive
            ? 'bg-amber-800 text-white shadow-xs'
            : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 border border-stone-200/60'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 sm:py-3 gap-2.5 sm:gap-3">
          <div className="flex items-center">
            <span className="font-serif font-bold text-stone-900 tracking-tight text-base sm:text-lg">
              Расчет кинетики экстракции чая
            </span>
          </div>

          {/* 2-Row Navigation Structure */}
          <nav className="flex flex-col gap-1.5 sm:gap-2">
            {/* Row 1: Interactive Brewing & Practice Tools */}
            <div className="flex flex-wrap items-center gap-1.5">
              {practiceTabs.map(renderTabButton)}
            </div>

            {/* Row 2: Knowledge, Research & Standard Protocols */}
            <div className="flex flex-wrap items-center gap-1.5">
              {knowledgeTabs.map(renderTabButton)}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
